import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { supabase } from '../supabase';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'JWT secret not configured' });
  }

  try {
    jwt.verify(token, secret);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { data, error } = await supabase
    .from('auth_tokens')
    .select('revoked, expires_at')
    .eq('token', token)
    .single();

  if (error || !data) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (data.revoked || new Date(data.expires_at) < new Date()) {
    return res.status(401).json({ error: 'Token expired or revoked' });
  }

  next();
}
