import { Request, Response, NextFunction } from 'express'
import { env } from '../config/env'

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (env.isDev) {
    console.error(err.stack)
  }

  res.status(500).json({
    success: false,
    error: env.isDev ? err.message : 'Internal server error',
  })
}
