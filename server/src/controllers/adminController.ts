import { Response } from 'express'
import { body, validationResult } from 'express-validator'
import { Problem } from '../models/Problem'
import { AuthRequest } from '../types'

export const createProblemValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Slug must be lowercase alphanumeric with hyphens'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  body('testCases').isArray({ min: 1 }).withMessage('At least one test case is required'),
]

export const createProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: errors.array()[0].msg })
      return
    }

    const existing = await Problem.findOne({ slug: req.body.slug })
    if (existing) {
      res.status(409).json({ success: false, error: 'A problem with this slug already exists' })
      return
    }

    const problem = await Problem.create(req.body)
    res.status(201).json({ success: true, data: { problem } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create problem'
    res.status(500).json({ success: false, error: message })
  }
}

export const updateProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true }
    )

    if (!problem) {
      res.status(404).json({ success: false, error: 'Problem not found' })
      return
    }

    res.json({ success: true, data: { problem } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update problem'
    res.status(500).json({ success: false, error: message })
  }
}

export const deleteProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findOneAndDelete({ slug: req.params.slug })

    if (!problem) {
      res.status(404).json({ success: false, error: 'Problem not found' })
      return
    }

    res.json({ success: true, data: { message: 'Problem deleted' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete problem'
    res.status(500).json({ success: false, error: message })
  }
}

export const getProblemsAdmin = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problems = await Problem.find().sort({ createdAt: -1 })
    res.json({ success: true, data: { problems } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch problems'
    res.status(500).json({ success: false, error: message })
  }
}

export const getProblemAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug })
    if (!problem) {
      res.status(404).json({ success: false, error: 'Problem not found' })
      return
    }
    res.json({ success: true, data: { problem } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch problem'
    res.status(500).json({ success: false, error: message })
  }
}
