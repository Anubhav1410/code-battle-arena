import { Server as SocketServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { JwtPayload } from '../types'
import { User } from '../models/User'
import { registerMatchmakingHandlers } from './matchmakingHandler'
import { registerMatchHandlers } from './matchHandler'
import { registerSpectatorHandlers } from './spectatorHandler'
import { registerChallengeHandlers } from './challengeHandler'

export interface AuthSocket extends Socket {
  userId: string
  username: string
  elo: number
  role: string
}

export function setupSocket(io: SocketServer): void {
  // JWT auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('Authentication required'))
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload
      const user = await User.findById(decoded.id).select('username rating.elo role')
      if (!user) {
        return next(new Error('User not found'))
      }

      const authSocket = socket as AuthSocket
      authSocket.userId = String(user._id)
      authSocket.username = user.username
      authSocket.elo = user.rating.elo
      authSocket.role = user.role
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const authSocket = socket as AuthSocket
    if (env.isDev) {
      console.log(`[Socket] ${authSocket.username} connected (${authSocket.userId})`)
    }

    registerMatchmakingHandlers(io, authSocket)
    registerMatchHandlers(io, authSocket)
    registerSpectatorHandlers(io, authSocket)
    registerChallengeHandlers(io, authSocket)

    socket.on('disconnect', () => {
      if (env.isDev) {
        console.log(`[Socket] ${authSocket.username} disconnected`)
      }
    })
  })
}
