import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { AuthRequest, JwtPayload } from '../types'

export const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided' })
    return
  }

  const token = header.split(' ')[1]

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload
    req.user = { id: decoded.id, role: decoded.role }
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}
