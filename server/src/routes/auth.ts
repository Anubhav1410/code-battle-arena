import { Router } from 'express'
import {
  register,
  registerValidation,
  login,
  loginValidation,
  getMe,
} from '../controllers/authController'
import { auth } from '../middleware/auth'

const router = Router()

router.post('/register', registerValidation, register)
router.post('/login', loginValidation, login)
router.get('/me', auth, getMe)

export default router
