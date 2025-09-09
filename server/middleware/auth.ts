import type { Request, Response, NextFunction } from 'express'

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = process.env.API_TOKEN
  if (!token) {
    return res.status(500).json({ error: 'API token not configured' })
  }
  const authHeader = req.header('Authorization')
  if (!authHeader || authHeader !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
