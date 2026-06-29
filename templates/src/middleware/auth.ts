import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from '../lib/jwt.js';
import { forbidden, unauthorized } from '../lib/errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

function extract(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extract(req);
  if (!token) return next(unauthorized());
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(unauthorized('invalid token'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extract(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      /* ignore — endpoint will see undefined user */
    }
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!req.user.roles?.some((r) => roles.includes(r))) {
      return next(forbidden('insufficient role'));
    }
    next();
  };
}
