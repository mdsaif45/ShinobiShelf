import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RepositoryFactory } from '../repositories/factory';

export const JWT_SECRET = process.env.JWT_SECRET || 'shinobishelf-sqlite-secret';

export interface AuthRequest extends Request {
  user?: { uid: string; email: string; displayName?: string };
  dbUser?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split('Bearer ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.displayName,
    };
    
    const userRepo = RepositoryFactory.getUserRepository();
    const dbUser = await userRepo.findById(decoded.uid);
    if (!dbUser) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }
    req.dbUser = dbUser;

    next();
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
};
