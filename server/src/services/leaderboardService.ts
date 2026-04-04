import { getRedis } from '../config/redis'
import { env } from '../config/env'

const GLOBAL_KEY = 'leaderboard:global'
const WEEKLY_KEY = 'leaderboard:weekly'

let redisAvailable = true

async function checkRedis(): Promise<boolean> {
  try {
    const redis = getRedis()
    await redis.ping()
    redisAvailable = true
    return true
  } catch {
    redisAvailable = false
    return false
  }
}

export async function updateLeaderboard(
  userId: string,
  elo: number,
  username: string
): Promise<void> {
  if (!(await checkRedis())) return

  try {
    const redis = getRedis()
    // Global leaderboard
    await redis.zadd(GLOBAL_KEY, elo, userId)
    // Weekly leaderboard
    await redis.zadd(WEEKLY_KEY, elo, userId)
    // Store username mapping
    await redis.hset('leaderboard:usernames', userId, username)
  } catch (err) {
    if (env.isDev) console.error('[Leaderboard] Redis update error:', err)
  }
}

export async function getLeaderboard(
  type: 'global' | 'weekly',
  page: number,
  limit: number
): Promise<{
  entries: Array<{ userId: string; username: string; elo: number; rank: number }>
  total: number
}> {
  if (!(await checkRedis())) {
    return { entries: [], total: 0 }
  }

  try {
    const redis = getRedis()
    const key = type === 'weekly' ? WEEKLY_KEY : GLOBAL_KEY

    const total = await redis.zcard(key)
    const start = (page - 1) * limit
    const stop = start + limit - 1

    // Get members in descending order (highest ELO first)
    const members = await redis.zrevrange(key, start, stop, 'WITHSCORES')

    const entries: Array<{ userId: string; username: string; elo: number; rank: number }> = []

    for (let i = 0; i < members.length; i += 2) {
      const userId = members[i]
      const elo = parseInt(members[i + 1], 10)
      const username = (await redis.hget('leaderboard:usernames', userId)) || 'Unknown'

      entries.push({
        userId,
        username,
        elo,
        rank: start + i / 2 + 1,
      })
    }

    return { entries, total }
  } catch (err) {
    if (env.isDev) console.error('[Leaderboard] Redis fetch error:', err)
    return { entries: [], total: 0 }
  }
}

export async function getUserRank(
  userId: string,
  type: 'global' | 'weekly' = 'global'
): Promise<number | null> {
  if (!(await checkRedis())) return null

  try {
    const redis = getRedis()
    const key = type === 'weekly' ? WEEKLY_KEY : GLOBAL_KEY
    const rank = await redis.zrevrank(key, userId)
    return rank !== null ? rank + 1 : null
  } catch {
    return null
  }
}

export async function resetWeeklyLeaderboard(): Promise<void> {
  if (!(await checkRedis())) return

  try {
    const redis = getRedis()
    await redis.del(WEEKLY_KEY)
    if (env.isDev) console.log('[Leaderboard] Weekly leaderboard reset')
  } catch (err) {
    if (env.isDev) console.error('[Leaderboard] Reset error:', err)
  }
}

export async function syncAllUsersToLeaderboard(): Promise<void> {
  // Called at startup to populate Redis from MongoDB
  const { User } = await import('../models/User')

  const users = await User.find().select('_id username rating.elo')
  if (!(await checkRedis())) return

  const redis = getRedis()
  const pipeline = redis.pipeline()

  for (const user of users) {
    const userId = String(user._id)
    pipeline.zadd(GLOBAL_KEY, user.rating.elo, userId)
    pipeline.zadd(WEEKLY_KEY, user.rating.elo, userId)
    pipeline.hset('leaderboard:usernames', userId, user.username)
  }

  await pipeline.exec()
  if (env.isDev) console.log(`[Leaderboard] Synced ${users.length} users to Redis`)
}
