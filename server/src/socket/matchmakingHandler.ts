import { Server as SocketServer } from 'socket.io'
import { AuthSocket } from './index'
import { addToQueue, removeFromQueue, findMatch, isInQueue } from '../services/matchmaking'
import { Match } from '../models/Match'
import { Problem } from '../models/Problem'
import { env } from '../config/env'

let matchmakingInterval: ReturnType<typeof setInterval> | null = null

export function startMatchmakingLoop(io: SocketServer): void {
  if (matchmakingInterval) return

  matchmakingInterval = setInterval(async () => {
    try {
      const result = await findMatch()
      if (!result) return

      const { player1, player2 } = result

      // Remove both from queue
      await removeFromQueue(player1.userId)
      await removeFromQueue(player2.userId)

      // Pick a random problem
      const count = await Problem.countDocuments()
      if (count === 0) {
        if (env.isDev) console.log('[Matchmaking] No problems in database')
        return
      }
      const randomIndex = Math.floor(Math.random() * count)
      const problem = await Problem.findOne().skip(randomIndex)
      if (!problem) return

      // Create match document
      const match = await Match.create({
        players: [
          {
            userId: player1.userId,
            username: player1.username,
            ratingBefore: player1.elo,
            language: 'cpp',
          },
          {
            userId: player2.userId,
            username: player2.username,
            ratingBefore: player2.elo,
            language: 'cpp',
          },
        ],
        problemId: problem._id,
        state: 'waiting',
      })

      const matchId = String(match._id)
      const roomName = `match:${matchId}`

      // Get sockets and join room
      const p1Socket = io.sockets.sockets.get(player1.socketId)
      const p2Socket = io.sockets.sockets.get(player2.socketId)

      if (!p1Socket || !p2Socket) {
        if (env.isDev) console.log('[Matchmaking] One or both players disconnected')
        await Match.findByIdAndDelete(matchId)
        return
      }

      p1Socket.join(roomName)
      p2Socket.join(roomName)

      // Strip hidden test cases for the problem data sent to players
      const problemObj = problem.toObject()
      problemObj.testCases = problemObj.testCases.filter((tc) => !tc.isHidden)

      const matchData = {
        matchId,
        problem: problemObj,
        players: [
          { userId: player1.userId, username: player1.username, elo: player1.elo },
          { userId: player2.userId, username: player2.username, elo: player2.elo },
        ],
      }

      // Notify both players
      io.to(roomName).emit('match:found', matchData)

      if (env.isDev) {
        console.log(
          `[Matchmaking] Matched: ${player1.username} (${player1.elo}) vs ${player2.username} (${player2.elo}) — ${problem.title}`
        )
      }
    } catch (err) {
      if (env.isDev) console.error('[Matchmaking] Error:', err)
    }
  }, 2000)
}

export function registerMatchmakingHandlers(io: SocketServer, socket: AuthSocket): void {
  // Start the loop if not running
  startMatchmakingLoop(io)

  socket.on('matchmaking:join', async () => {
    const alreadyQueued = await isInQueue(socket.userId)
    if (alreadyQueued) {
      socket.emit('matchmaking:error', { error: 'Already in queue' })
      return
    }

    await addToQueue({
      userId: socket.userId,
      username: socket.username,
      elo: socket.elo,
      joinedAt: Date.now(),
      socketId: socket.id,
    })

    socket.emit('matchmaking:joined', { elo: socket.elo })
  })

  socket.on('matchmaking:cancel', async () => {
    await removeFromQueue(socket.userId)
    socket.emit('matchmaking:cancelled')
  })

  socket.on('disconnect', async () => {
    await removeFromQueue(socket.userId)
  })
}
