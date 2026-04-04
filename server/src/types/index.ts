import { Request } from 'express'

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: string
  }
}

export interface JwtPayload {
  id: string
  role: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
