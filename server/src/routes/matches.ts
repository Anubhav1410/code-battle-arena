import { Router, Request, Response } from 'express'
import { Match } from '../models/Match'
import { auth } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()

// Get current user's recent matches
router.get('/history', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matches = await Match.find({
      'players.userId': req.user?.id,
      state: 'finished',
    })
      .sort({ endedAt: -1 })
      .limit(20)
      .select('-events')
      .populate('problemId', 'title slug difficulty')

    res.json({ success: true, data: { matches } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch matches'
    res.status(500).json({ success: false, error: message })
  }
})

// Get live matches for spectating
router.get('/live/list', async (_req: Request, res: Response): Promise<void> => {
  try {
    const matches = await Match.find({
      state: { $in: ['in_progress', 'countdown'] },
    })
      .select('players problemId startedAt spectatorCount state')
      .populate('problemId', 'title difficulty')

    res.json({ success: true, data: { matches } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch live matches'
    res.status(500).json({ success: false, error: message })
  }
})

// Get match replay (includes events)
router.get('/:id/replay', async (req: Request, res: Response): Promise<void> => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('problemId', 'title slug difficulty description examples constraints')

    if (!match) {
      res.status(404).json({ success: false, error: 'Match not found' })
      return
    }

    if (match.state !== 'finished') {
      res.status(400).json({ success: false, error: 'Match is not finished yet' })
      return
    }

    res.json({ success: true, data: { match } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch replay'
    res.status(500).json({ success: false, error: message })
  }
})

// Get match by ID (no events)
router.get('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
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
})

export default router
