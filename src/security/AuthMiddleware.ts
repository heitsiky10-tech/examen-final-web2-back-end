import { RequestHandler } from 'express';
import { verifyAccessToken } from './jwt';
import { AuthenticatedUser, Role } from '../models/User';

const BEARER_PREFIX = 'Bearer ';

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

export const authenticate: RequestHandler = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith(BEARER_PREFIX)) {
    res.status(401).json({ message: 'Missing or malformed Authorization header' });
    return;
  }
  try {
    req.authUser = verifyAccessToken(authorization.slice(BEARER_PREFIX.length));
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, res, next) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };