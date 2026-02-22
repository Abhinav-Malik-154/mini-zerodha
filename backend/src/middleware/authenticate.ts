import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    res.status(401).json({ success: false, error: 'Authorization header missing' });
    return;
  }

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ success: false, error: 'Invalid authorization format' });
    return;
  }

  const token = parts[1];
  try {
    const secret = process.env.JWT_SECRET || 'default_secret';
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
    return;
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return;
  }
}
