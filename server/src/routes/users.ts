import { Router } from 'express'
import { getUserProfile, getMatchHistory, getMatchDetail } from '../controllers/userController'
import { auth } from '../middleware/auth'

const router = Router()

router.get('/profile/:username', getUserProfile)
router.get('/matches', auth, getMatchHistory)
router.get('/matches/:id', auth, getMatchDetail)

export default router
