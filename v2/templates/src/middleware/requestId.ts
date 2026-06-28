import type { Request, Response, NextFunction } from 'express';

const HEADER = 'x-request-id';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header(HEADER);
  const id = incoming && incoming.length <= 200 ? incoming : crypto.randomUUID();
  req.id = id;
  res.setHeader(HEADER, id);
  next();
}
