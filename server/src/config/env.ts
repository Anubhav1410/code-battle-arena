import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const requiredVars = ['MONGODB_URI', 'JWT_SECRET'] as const

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }
}

export const env = {
  port: parseInt(process.env.PORT || '5001', 10),
  mongodbUri: process.env.MONGODB_URI!,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  pistonApiUrl: process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
}
