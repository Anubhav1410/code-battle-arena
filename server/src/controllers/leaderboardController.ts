import { Request, Response } from 'express'
import { getLeaderboard, getUserRank } from '../services/leaderboardService'
import { User } from '../models/User'

export const getLeaderboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = (req.query.type as 'global' | 'weekly') || 'global'
    const page = parseInt(req.query.page as string, 10) || 1
    const limit = parseInt(req.query.limit as string, 10) || 50

    // Try Redis first
    let { entries, total } = await getLeaderboard(type, page, limit)

    // Fallback to MongoDB if Redis is empty
    if (entries.length === 0) {
      const skip = (page - 1) * limit
      const [users, count] = await Promise.all([
        User.find()
          .sort({ 'rating.elo': -1 })
          .skip(skip)
          .limit(limit)
          .select('username rating.elo rating.wins rating.losses rating.draws'),
        User.countDocuments(),
      ])

      entries = users.map((u, i) => ({
        userId: String(u._id),
        username: u.username,
        elo: u.rating.elo,
        rank: skip + i + 1,
      }))
      total = count
    }

    // Enrich with win/loss data from MongoDB
    const userIds = entries.map((e) => e.userId)
    const users = await User.find({ _id: { $in: userIds } }).select(
      'rating.wins rating.losses rating.draws'
    )
    const userMap = new Map(users.map((u) => [String(u._id), u]))

    const enriched = entries.map((e) => {
      const u = userMap.get(e.userId)
      const wins = u?.rating.wins ?? 0
      const losses = u?.rating.losses ?? 0
      const draws = u?.rating.draws ?? 0
      const total = wins + losses + draws
      return {
        ...e,
        wins,
        losses,
        draws,
        winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      }
    })

    res.json({
      success: true,
      data: {
        entries: enriched,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch leaderboard'
    res.status(500).json({ success: false, error: message })
  }
}

export const getMyRank = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as unknown as { user: { id: string } }).user?.id
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const [globalRank, weeklyRank] = await Promise.all([
      getUserRank(userId, 'global'),
      getUserRank(userId, 'weekly'),
    ])

    res.json({
      success: true,
      data: { globalRank, weeklyRank },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rank'
    res.status(500).json({ success: false, error: message })
  }
}
