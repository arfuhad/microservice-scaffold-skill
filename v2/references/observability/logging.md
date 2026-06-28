# Module: `observability`

Replaces the core's basic logger with [pino](https://getpino.io), adds request-ID middleware, a central error handler, and `/ready`.

## Install

```bash
node v2/scripts/scaffold.mjs add observability <target-dir>
```

This **overwrites** `src/lib/logger.ts`. Other modules already import from `./lib/logger.js`, so the swap is seamless — no other file changes.

## Files added / replaced

- `src/lib/logger.ts` — replaced with pino-backed implementation
- `src/middleware/requestId.ts` — assigns `req.id` from `X-Request-Id` or generates one
- `src/middleware/error.ts` — central error handler that understands `AppError`
- `src/routes/ready.ts` — `/ready` with a check registry

## Wire it up

In `src/server/http.ts`, register middleware in this order — **request ID before routes, error handler last**:

```ts
import pinoHttp from 'pino-http';
import { logger } from '../lib/logger.js';
import { requestId } from '../middleware/requestId.js';
import { errorHandler } from '../middleware/error.js';
import { readyRouter } from '../routes/ready.js';

export function createApp(): Express {
  const app = express();
  app.use(requestId);
  app.use(pinoHttp({ logger, customProps: (req) => ({ reqId: req.id }) }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/health', healthRouter);
  app.use('/ready', readyRouter);
  // ... module routers go here ...
  app.use(errorHandler);  // MUST be last
  return app;
}
```

For convenience, you can extract this into a `registerObservability(app)` helper if you prefer.

## Adding readiness checks

`src/routes/ready.ts` exports a `checks` array. Push a check whenever a module needs external dependencies:

```ts
import { pingPg } from '../db/pg.js';
checks.push({ name: 'pg', fn: () => pingPg() });
```

`/ready` returns 503 if any check fails — wire this to Kubernetes/load-balancer readiness probes.

## Throwing errors

Use `AppError` (and the `badRequest` / `notFound` / etc. helpers from `src/lib/errors.ts`) for expected failures. The handler:

- formats the response as `{ error: { code, message, details } }`
- logs at `warn` for 4xx and `error` for 5xx
- never leaks stack traces to the client

## Env vars

| Var | Default | Notes |
|---|---|---|
| `LOG_LEVEL` | `info` | already in `core` |

In `NODE_ENV=development`, logs render via `pino-pretty`. In other envs, raw JSON for log aggregators.
