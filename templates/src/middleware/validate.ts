import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';
import { badRequest } from '../lib/errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      valid?: { body?: unknown; params?: unknown; query?: unknown };
    }
  }
}

export function validate(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    if (!result.success) {
      return next(badRequest('validation failed', result.error.flatten()));
    }
    // Store coerced values on req.valid instead of mutating req.body/params/query.
    // req.query is a read-only getter under Express 5, so direct mutation breaks.
    req.valid = result.data;
    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.params !== undefined) req.params = result.data.params;
    next();
  };
}
