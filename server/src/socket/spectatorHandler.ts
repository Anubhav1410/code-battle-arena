import { Server as SocketServer } from 'socket.io'
import { AuthSocket } from './index'
import { Match } from '../models/Match'
import { env } from '../config/env'

export function registerSpectatorHandlers(io: SocketServer, socket: AuthSocket): void {
  socket.on('spectate:join', async ({ matchId }: { matchId: string }) => {
    const match = await Match.findById(matchId)
      .select('players state problemId startedAt spectatorCount')
      .populate('problemId', 'title slug difficulty description examples constraints starterCode')

    if (!match || match.state === 'finished') {
      socket.emit('spectate:error', { error: 'Match not available for spectating' })
      return
    }

    const roomName = `spectate:${matchId}`
    socket.join(roomName)

    // Increment spectator count
    await Match.findByIdAndUpdate(matchId, { $inc: { spectatorCount: 1 } })
    const updated = await Match.findById(matchId).select('spectatorCount')

    // Notify match room about spectator count change
    io.to(`match:${matchId}`).emit('match:spectator_count', {
      count: updated?.spectatorCount ?? 0,
    })

    // Send current state to spectator (strip hidden test cases)
    const problemObj = match.problemId ? (match.problemId as unknown as Record<string, unknown>) : null
    if (problemObj && Array.isArray((problemObj as Record<string, unknown[]>).testCases)) {
      (problemObj as Record<string, unknown[]>).testCases = (
        (problemObj as Record<string, unknown[]>).testCases as Array<{ isHidden: boolean }>
      ).filter((tc) => !tc.isHidden)
    }

    socket.emit('spectate:state', {
      matchId,
      state: match.state,
      players: match.players.map((p) => ({
        userId: String(p.userId),
        username: p.username,
        ratingBefore: p.ratingBefore,
        language: p.language,
      })),
      problem: problemObj,
      startedAt: match.startedAt ? new Date(match.startedAt).getTime() : null,
      spectatorCount: updated?.spectatorCount ?? 0,
    })

    if (env.isDev) {
      if (env.isDev) console.log(`[Spectator] ${socket.username} watching match ${matchId}`)
    }
  })

  socket.on('spectate:leave', async ({ matchId }: { matchId: string }) => {
    const roomName = `spectate:${matchId}`
    socket.leave(roomName)

    await Match.findByIdAndUpdate(matchId, {
      $inc: { spectatorCount: -1 },
    })
    const updated = await Match.findById(matchId).select('spectatorCount')

    io.to(`match:${matchId}`).emit('match:spectator_count', {
      count: Math.max(0, updated?.spectatorCount ?? 0),
    })
  })

  socket.on('disconnect', () => {
    // Socket.IO auto-removes from rooms on disconnect
    // Spectator count is approximate — cleaned up when matches end
  })
}
