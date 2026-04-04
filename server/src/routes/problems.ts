import { Router } from 'express'
import { getProblems, getProblemBySlug, runCode, submitCode } from '../controllers/problemController'
import { auth } from '../middleware/auth'

const router = Router()

router.get('/', getProblems)
router.get('/:slug', getProblemBySlug)
router.post('/:slug/run', auth, runCode)
router.post('/:slug/submit', auth, submitCode)

export default router
