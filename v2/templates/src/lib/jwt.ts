import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

if (!env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required when the auth-jwt module is installed');
}

const secret = env.JWT_SECRET;

export interface TokenPayload {
  sub: string;
  roles?: string[];
}

export function signToken(payload: TokenPayload, expiresIn: string = env.JWT_EXPIRES_IN): string {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === 'string') {
    throw new Error('unexpected string token payload');
  }
  return decoded as TokenPayload;
}
