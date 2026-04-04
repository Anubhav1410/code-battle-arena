import { Request, Response } from 'express'
import { Problem } from '../models/Problem'
import { AuthRequest } from '../types'
import { runTestCases } from '../services/executor'

export const getProblems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { difficulty, tag, page = '1', limit = '50' } = req.query

    const filter: Record<string, unknown> = {}
    if (difficulty) filter.difficulty = difficulty
    if (tag) filter.tags = tag

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .select('-testCases -starterCode')
        .sort({ difficulty: 1, title: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Problem.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: {
        problems,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch problems'
    res.status(500).json({ success: false, error: message })
  }
}

export const getProblemBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug })

    if (!problem) {
      res.status(404).json({ success: false, error: 'Problem not found' })
      return
    }

    // Strip hidden test cases for non-admin
    const problemObj = problem.toObject()
    problemObj.testCases = problemObj.testCases.filter((tc) => !tc.isHidden)

    res.json({ success: true, data: { problem: problemObj } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch problem'
    res.status(500).json({ success: false, error: message })
  }
}

export const runCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params
    const { code, language } = req.body

    if (!code || !language) {
      res.status(400).json({ success: false, error: 'Code and language are required' })
      return
    }

    const problem = await Problem.findOne({ slug })
    if (!problem) {
      res.status(404).json({ success: false, error: 'Problem not found' })
      return
    }

    // Run against visible test cases only
    const results = await runTestCases(code, language, problem.testCases, false)

    const passed = results.filter((r) => r.verdict === 'AC').length

    res.json({
      success: true,
      data: {
        results,
        summary: {
          passed,
          total: results.length,
          allPassed: passed === results.length,
        },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Code execution failed'
    res.status(500).json({ success: false, error: message })
  }
}

export const submitCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params
    const { code, language } = req.body

    if (!code || !language) {
      res.status(400).json({ success: false, error: 'Code and language are required' })
      return
    }

    const problem = await Problem.findOne({ slug })
    if (!problem) {
      res.status(404).json({ success: false, error: 'Problem not found' })
      return
    }

    // Run against ALL test cases including hidden
    const results = await runTestCases(code, language, problem.testCases, true)

    const passed = results.filter((r) => r.verdict === 'AC').length
    const total = results.length
    const allPassed = passed === total

    // Determine overall verdict
    let overallVerdict = 'AC'
    if (!allPassed) {
      const firstFail = results.find((r) => r.verdict !== 'AC')
      overallVerdict = firstFail?.verdict || 'WA'
    }

    res.json({
      success: true,
      data: {
        results,
        summary: {
          passed,
          total,
          allPassed,
          verdict: overallVerdict,
        },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Submission failed'
    res.status(500).json({ success: false, error: message })
  }
}
