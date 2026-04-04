import { Request, Response } from 'express'
import { User } from '../models/User'
import { Match } from '../models/Match'

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-passwordHash')

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    // Get recent matches
    const recentMatches = await Match.find({
      'players.userId': user._id,
      state: 'finished',
    })
      .sort({ endedAt: -1 })
      .limit(10)
      .select('-events')
      .populate('problemId', 'title slug difficulty')

    res.json({
      success: true,
      data: {
        user,
        recentMatches,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch profile'
    res.status(500).json({ success: false, error: message })
  }
}

export const getMatchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as unknown as { user: { id: string } }).user?.id
    const { result, difficulty, page = '1', limit = '20' } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)

    const matchFilter: Record<string, unknown> = {
      'players.userId': userId,
      state: 'finished',
    }

    // Result filter
    if (result === 'wins') {
      matchFilter.winner = userId
    } else if (result === 'losses') {
      matchFilter.winner = { $ne: null, $ne2: userId }
      // Use $and for proper filtering
      matchFilter.$and = [
        { winner: { $ne: null } },
        { winner: { $ne: userId } },
      ]
      delete matchFilter.winner
    } else if (result === 'draws') {
      matchFilter.result = 'draw'
    }

    let query = Match.find(matchFilter)
      .sort({ endedAt: -1 })
      .select('-events')
      .populate('problemId', 'title slug difficulty')

    // Difficulty filter — need to filter after populate
    if (difficulty && difficulty !== 'all') {
      query = query.populate({
        path: 'problemId',
        match: { difficulty },
        select: 'title slug difficulty',
      })
    }

    const [matches, total] = await Promise.all([
      query.skip((pageNum - 1) * limitNum).limit(limitNum),
      Match.countDocuments(matchFilter),
    ])

    // Filter out matches where populated problemId is null (difficulty filter)
    const filtered = difficulty && difficulty !== 'all'
      ? matches.filter((m) => m.problemId !== null)
      : matches

    res.json({
      success: true,
      data: {
        matches: filtered,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch match history'
    res.status(500).json({ success: false, error: message })
  }
}

export const getMatchDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const match = await Match.findById(req.params.id)
      .select('-events')
      .populate('problemId', 'title slug difficulty')

    if (!match) {
      res.status(404).json({ success: false, error: 'Match not found' })
      return
    }

    res.json({ success: true, data: { match } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch match'
    res.status(500).json({ success: false, error: message })
  }
}
