import { Router } from 'express'
import { auth } from '../middleware/auth'
import { admin } from '../middleware/admin'
import {
  createProblem,
  createProblemValidation,
  updateProblem,
  deleteProblem,
  getProblemsAdmin,
  getProblemAdmin,
} from '../controllers/adminController'

const router = Router()

router.use(auth, admin)

router.get('/problems', getProblemsAdmin)
router.get('/problems/:slug', getProblemAdmin)
router.post('/problems', createProblemValidation, createProblem)
router.put('/problems/:slug', updateProblem)
router.delete('/problems/:slug', deleteProblem)

export default router
