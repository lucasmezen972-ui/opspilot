import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = process.env.API_TOKEN;
  if (!token) {
    logger.warn('API token not configured');
    return res.status(500).json({ error: 'API token not configured' });
  }
  const authHeader = req.header('Authorization');
  if (!authHeader || authHeader !== `Bearer ${token}`) {
    logger.warn({ ip: req.ip }, 'Unauthorized access attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  logger.debug({ ip: req.ip }, 'Authenticated request');
  next();
}
