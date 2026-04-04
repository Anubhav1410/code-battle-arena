import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { User } from '../models/User'
import { env } from '../config/env'
import { AuthRequest } from '../types'

const generateToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as string,
  } as jwt.SignOptions)
}

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-20 alphanumeric characters or underscores'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
]

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
]

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: errors.array()[0].msg })
      return
    }

    const { username, email, password } = req.body

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username'
      res.status(409).json({ success: false, error: `${field} already taken` })
      return
    }

    const user = await User.create({
      username,
      email,
      passwordHash: password,
    })

    const token = generateToken(String(user._id), user.role)

    res.status(201).json({
      success: true,
      data: {
        token,
        user,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    res.status(500).json({ success: false, error: message })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: errors.array()[0].msg })
      return
    }

    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+passwordHash')

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    user.lastActive = new Date()
    await user.save()

    const token = generateToken(String(user._id), user.role)

    res.json({
      success: true,
      data: {
        token,
        user,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    res.status(500).json({ success: false, error: message })
  }
}

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id)

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    res.json({ success: true, data: { user } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user'
    res.status(500).json({ success: false, error: message })
  }
}
