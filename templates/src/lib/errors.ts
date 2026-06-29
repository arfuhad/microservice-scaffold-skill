export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, opts: { status?: number; code?: string; details?: unknown } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = opts.status ?? 500;
    this.code = opts.code ?? 'internal_error';
    this.details = opts.details;
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new AppError(msg, { status: 400, code: 'bad_request', details });

export const unauthorized = (msg = 'unauthorized') =>
  new AppError(msg, { status: 401, code: 'unauthorized' });

export const forbidden = (msg = 'forbidden') =>
  new AppError(msg, { status: 403, code: 'forbidden' });

export const notFound = (msg = 'not found') =>
  new AppError(msg, { status: 404, code: 'not_found' });

export const conflict = (msg: string) =>
  new AppError(msg, { status: 409, code: 'conflict' });
