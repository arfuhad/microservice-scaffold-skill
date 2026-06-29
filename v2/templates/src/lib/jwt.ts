import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
  sub: string;
  roles?: string[];
}

function getSecret(): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required to sign or verify tokens');
  }
  return env.JWT_SECRET;
}

export function signToken(payload: TokenPayload, expiresIn: string = env.JWT_EXPIRES_IN): string {
  return jwt.sign(payload, getSecret(), { expiresIn } as SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getSecret());
  if (typeof decoded === 'string') {
    throw new Error('unexpected string token payload');
  }
  return decoded as TokenPayload;
}
