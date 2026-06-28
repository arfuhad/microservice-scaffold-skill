import { Router } from 'express';

export const readyRouter = Router();

// Register checks here. Each check returns true (ready) or throws.
const checks: Array<{ name: string; fn: () => Promise<unknown> }> = [
  // Example: { name: 'pg', fn: () => pingPg() },
];

readyRouter.get('/', async (_req, res) => {
  const results = await Promise.allSettled(checks.map((c) => c.fn()));
  const report = checks.map((c, i) => ({
    name: c.name,
    status: results[i].status === 'fulfilled' ? 'ok' : 'failed',
  }));
  const allOk = report.every((r) => r.status === 'ok');
  res.status(allOk ? 200 : 503).json({ ready: allOk, checks: report });
});
