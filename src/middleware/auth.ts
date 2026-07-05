import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ status: 'error', message: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: number; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ status: 'error', message: 'Admin access required' });
    return;
  }

  next();
};
