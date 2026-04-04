import express from 'express'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { env } from './config/env'
import { connectDB } from './config/db'
import { errorHandler } from './middleware/errorHandler'
import { setupSocket } from './socket'
import { syncAllUsersToLeaderboard } from './services/leaderboardService'
import authRoutes from './routes/auth'
import problemRoutes from './routes/problems'
import adminRoutes from './routes/admin'
import matchRoutes from './routes/matches'
import leaderboardRoutes from './routes/leaderboard'
import userRoutes from './routes/users'

const app = express()
const httpServer = createServer(app)

const io = new SocketServer(httpServer, {
  cors: {
    origin: env.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Security & compression
app.use(helmet({ contentSecurityPolicy: false }))
app.use(compression())
app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(express.json({ limit: '1mb' }))

// Trust proxy for Railway/Vercel (needed for rate limiting, secure cookies)
if (!env.isDev) {
  app.set('trust proxy', 1)
}

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/problems', problemRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/matches', matchRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/users', userRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', env: env.nodeEnv } })
})

// Debug route — test outbound HTTP connectivity
app.get('/api/debug/outbound', (_req, res) => {
  const urls = [
    'https://httpbin.org/get',
    'https://ce.judge0.com/about',
    'https://judge0-ce.p.swisspol.ch/about',
    'https://emkc.org/api/v2/piston/runtimes',
  ]

  async function testUrl(url: string) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const r = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)
      const body = await r.text()
      return { url, status: 'ok' as const, httpStatus: r.status, body: body.slice(0, 120) }
    } catch (err: unknown) {
      const e = err as Error & { cause?: Error & { code?: string } }
      return {
        url,
        status: 'failed' as const,
        error: `${e.message} | cause: ${e.cause?.message ?? 'none'} | code: ${e.cause?.code ?? 'none'}`,
      }
    }
  }

  Promise.all(urls.map(testUrl))
    .then((results) => res.json({ success: true, data: results }))
    .catch((err) => res.status(500).json({ success: false, error: String(err) }))
})

app.use(errorHandler)

setupSocket(io)

const start = async () => {
  await connectDB()

  // Sync leaderboard from MongoDB to Redis on startup
  syncAllUsersToLeaderboard().catch(() => {})

  httpServer.listen(env.port, () => {
    if (env.isDev) {
      console.log(`Server running on port ${env.port} [${env.nodeEnv}]`)
    }
  })
}

start()

export { io }
