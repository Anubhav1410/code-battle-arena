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

// Debug route — test if outbound HTTP works on this host
app.get('/api/debug/outbound', async (_req, res) => {
  const results: Record<string, string> = {}

  // Test 1: generic HTTP
  try {
    const r = await fetch('https://httpbin.org/get')
    results.httpbin = `${r.status} OK`
  } catch (err: unknown) {
    const e = err as Error & { cause?: Error; code?: string }
    results.httpbin = `FAIL: ${e.message} | cause: ${e.cause?.message ?? 'none'} | code: ${(e.cause as Error & { code?: string })?.code ?? 'none'}`
  }

  // Test 2: Judge0 free instance
  try {
    const r = await fetch(`${env.judge0ApiUrl}/about`)
    const body = await r.text()
    results.judge0 = `${r.status} — ${body.slice(0, 100)}`
  } catch (err: unknown) {
    const e = err as Error & { cause?: Error }
    results.judge0 = `FAIL: ${e.message} | cause: ${e.cause?.message ?? 'none'}`
  }

  // Test 3: ce.judge0.com
  try {
    const r = await fetch('https://ce.judge0.com/about')
    const body = await r.text()
    results.judge0_ce = `${r.status} — ${body.slice(0, 100)}`
  } catch (err: unknown) {
    const e = err as Error & { cause?: Error }
    results.judge0_ce = `FAIL: ${e.message} | cause: ${e.cause?.message ?? 'none'}`
  }

  res.json({ success: true, data: results })
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
