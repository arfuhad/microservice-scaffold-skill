import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const reqId = (req as Request & { id?: string }).id;

  if (err instanceof AppError) {
    if (err.status >= 500) logger.error({ err, reqId }, err.message);
    else logger.warn({ err: { code: err.code, status: err.status }, reqId }, err.message);
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  logger.error({ err, reqId }, 'unhandled error');
  res.status(500).json({ error: { code: 'internal_error', message: 'internal server error' } });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'not_found', message: 'route not found' } });
}
