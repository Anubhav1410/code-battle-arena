import Redis from 'ioredis'
import { env } from './env'

let redis: Redis | null = null

export const getRedis = (): Redis => {
  if (!redis) {
    redis = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.error('Redis connection failed after 3 retries')
          return null
        }
        return Math.min(times * 200, 2000)
      },
    })

    redis.on('connect', () => {
      if (env.isDev) console.log('Redis connected')
    })

    redis.on('error', (err) => {
      console.error('Redis error:', err.message)
    })
  }

  return redis
}
