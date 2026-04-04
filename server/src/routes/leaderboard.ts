import { Router } from 'express'
import { getLeaderboardData, getMyRank } from '../controllers/leaderboardController'
import { auth } from '../middleware/auth'

const router = Router()

router.get('/', getLeaderboardData)
router.get('/me', auth, getMyRank)

export default router
