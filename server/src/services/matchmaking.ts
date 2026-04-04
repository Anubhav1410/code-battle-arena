import { getRedis } from '../config/redis'
import { env } from '../config/env'

interface QueuedPlayer {
  userId: string
  username: string
  elo: number
  joinedAt: number
  socketId: string
}

const QUEUE_KEY = 'matchmaking:queue'
const TIMESTAMPS_KEY = 'matchmaking:timestamps'
const BASE_RANGE = 200
const RANGE_EXPANSION = 50
const EXPANSION_INTERVAL = 10000

// In-memory fallback
const memoryQueue: Map<string, QueuedPlayer> = new Map()
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

export async function addToQueue(player: QueuedPlayer): Promise<void> {
  if (await checkRedis()) {
    const redis = getRedis()
    await redis.zadd(QUEUE_KEY, player.elo, player.userId)
    await redis.hset(
      TIMESTAMPS_KEY,
      player.userId,
      JSON.stringify({
        username: player.username,
        elo: player.elo,
        joinedAt: player.joinedAt,
        socketId: player.socketId,
      })
    )
  } else {
    memoryQueue.set(player.userId, player)
  }
  if (env.isDev) console.log(`[Matchmaking] ${player.username} (${player.elo}) joined queue`)
}

export async function removeFromQueue(userId: string): Promise<void> {
  if (redisAvailable) {
    try {
      const redis = getRedis()
      await redis.zrem(QUEUE_KEY, userId)
      await redis.hdel(TIMESTAMPS_KEY, userId)
    } catch {
      memoryQueue.delete(userId)
    }
  } else {
    memoryQueue.delete(userId)
  }
}

export async function isInQueue(userId: string): Promise<boolean> {
  if (redisAvailable) {
    try {
      const redis = getRedis()
      const score = await redis.zscore(QUEUE_KEY, userId)
      return score !== null
    } catch {
      return memoryQueue.has(userId)
    }
  }
  return memoryQueue.has(userId)
}

export async function findMatch(): Promise<{ player1: QueuedPlayer; player2: QueuedPlayer } | null> {
  if (redisAvailable) {
    return findMatchRedis()
  }
  return findMatchMemory()
}

async function findMatchRedis(): Promise<{ player1: QueuedPlayer; player2: QueuedPlayer } | null> {
  try {
    const redis = getRedis()
    const members = await redis.zrangebyscore(QUEUE_KEY, '-inf', '+inf', 'WITHSCORES')

    if (members.length < 4) return null // Need at least 2 players (each = id + score)

    const players: QueuedPlayer[] = []
    for (let i = 0; i < members.length; i += 2) {
      const userId = members[i]
      const elo = parseInt(members[i + 1], 10)
      const dataStr = await redis.hget(TIMESTAMPS_KEY, userId)
      if (!dataStr) continue
      const data = JSON.parse(dataStr)
      players.push({
        userId,
        username: data.username,
        elo,
        joinedAt: data.joinedAt,
        socketId: data.socketId,
      })
    }

    return matchFromPlayers(players)
  } catch {
    return findMatchMemory()
  }
}

function findMatchMemory(): { player1: QueuedPlayer; player2: QueuedPlayer } | null {
  const players = Array.from(memoryQueue.values())
  if (players.length < 2) return null
  return matchFromPlayers(players)
}

function matchFromPlayers(
  players: QueuedPlayer[]
): { player1: QueuedPlayer; player2: QueuedPlayer } | null {
  const now = Date.now()

  // Sort by ELO
  players.sort((a, b) => a.elo - b.elo)

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const p1 = players[i]
      const p2 = players[j]
      const eloDiff = Math.abs(p1.elo - p2.elo)

      // Calculate expanded range for each player based on wait time
      const waitTimeP1 = now - p1.joinedAt
      const waitTimeP2 = now - p2.joinedAt
      const expansionsP1 = Math.floor(waitTimeP1 / EXPANSION_INTERVAL)
      const expansionsP2 = Math.floor(waitTimeP2 / EXPANSION_INTERVAL)
      const rangeP1 = BASE_RANGE + expansionsP1 * RANGE_EXPANSION
      const rangeP2 = BASE_RANGE + expansionsP2 * RANGE_EXPANSION
      const effectiveRange = Math.max(rangeP1, rangeP2)

      if (eloDiff <= effectiveRange) {
        return { player1: p1, player2: p2 }
      }
    }
  }

  return null
}

export function getQueueSize(): number {
  return memoryQueue.size
}

export async function getQueueSizeAsync(): Promise<number> {
  if (redisAvailable) {
    try {
      const redis = getRedis()
      return await redis.zcard(QUEUE_KEY)
    } catch {
      return memoryQueue.size
    }
  }
  return memoryQueue.size
}
