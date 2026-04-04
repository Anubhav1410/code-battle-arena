import { Server as SocketServer } from 'socket.io'
import { AuthSocket } from './index'
import { Match } from '../models/Match'
import { Problem } from '../models/Problem'
import { env } from '../config/env'
import crypto from 'crypto'

// In-memory challenge rooms
const challenges = new Map<
  string,
  {
    code: string
    creatorId: string
    creatorUsername: string
    creatorElo: number
    creatorSocketId: string
    difficulty: string | null
    problemSlug: string | null
    timeLimit: number
    createdAt: number
  }
>()

function generateCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

export function registerChallengeHandlers(io: SocketServer, socket: AuthSocket): void {
  socket.on(
    'challenge:create',
    async ({
      difficulty,
      problemSlug,
      timeLimit,
    }: {
      difficulty?: string
      problemSlug?: string
      timeLimit?: number
    }) => {
      const code = generateCode()
      challenges.set(code, {
        code,
        creatorId: socket.userId,
        creatorUsername: socket.username,
        creatorElo: socket.elo,
        creatorSocketId: socket.id,
        difficulty: difficulty || null,
        problemSlug: problemSlug || null,
        timeLimit: timeLimit || 15,
        createdAt: Date.now(),
      })

      socket.emit('challenge:created', { code })

      if (env.isDev) console.log(`[Challenge] ${socket.username} created room ${code}`)

      // Auto-expire after 10 minutes
      setTimeout(() => {
        if (challenges.has(code)) {
          challenges.delete(code)
          socket.emit('challenge:expired', { code })
        }
      }, 10 * 60 * 1000)
    }
  )

  socket.on('challenge:join', async ({ code }: { code: string }) => {
    const challenge = challenges.get(code.toUpperCase())

    if (!challenge) {
      socket.emit('challenge:error', { error: 'Challenge room not found or expired' })
      return
    }

    if (challenge.creatorId === socket.userId) {
      socket.emit('challenge:error', { error: 'You cannot join your own challenge' })
      return
    }

    // Find a problem
    let problem
    if (challenge.problemSlug) {
      problem = await Problem.findOne({ slug: challenge.problemSlug })
    } else if (challenge.difficulty) {
      const count = await Problem.countDocuments({ difficulty: challenge.difficulty })
      const idx = Math.floor(Math.random() * count)
      problem = await Problem.findOne({ difficulty: challenge.difficulty }).skip(idx)
    }

    if (!problem) {
      const count = await Problem.countDocuments()
      const idx = Math.floor(Math.random() * count)
      problem = await Problem.findOne().skip(idx)
    }

    if (!problem) {
      socket.emit('challenge:error', { error: 'No problems available' })
      return
    }

    // Create match
    const match = await Match.create({
      players: [
        {
          userId: challenge.creatorId,
          username: challenge.creatorUsername,
          ratingBefore: challenge.creatorElo,
          language: 'cpp',
        },
        {
          userId: socket.userId,
          username: socket.username,
          ratingBefore: socket.elo,
          language: 'cpp',
        },
      ],
      problemId: problem._id,
      state: 'waiting',
    })

    const matchId = String(match._id)
    const roomName = `match:${matchId}`

    // Join both to room
    const creatorSocket = io.sockets.sockets.get(challenge.creatorSocketId)
    if (creatorSocket) creatorSocket.join(roomName)
    socket.join(roomName)

    // Strip hidden test cases
    const problemObj = problem.toObject()
    problemObj.testCases = problemObj.testCases.filter((tc) => !tc.isHidden)

    const matchData = {
      matchId,
      problem: problemObj,
      players: [
        { userId: challenge.creatorId, username: challenge.creatorUsername, elo: challenge.creatorElo },
        { userId: socket.userId, username: socket.username, elo: socket.elo },
      ],
      timeLimit: challenge.timeLimit,
    }

    // Notify both
    if (creatorSocket) creatorSocket.emit('match:found', matchData)
    socket.emit('match:found', matchData)

    // Cleanup
    challenges.delete(code.toUpperCase())

    if (env.isDev) {
      if (env.isDev) console.log(`[Challenge] ${socket.username} joined ${challenge.creatorUsername}'s room → match ${matchId}`)
    }
  })

  socket.on('challenge:cancel', ({ code }: { code: string }) => {
    const challenge = challenges.get(code.toUpperCase())
    if (challenge && challenge.creatorId === socket.userId) {
      challenges.delete(code.toUpperCase())
      socket.emit('challenge:cancelled')
    }
  })
}
