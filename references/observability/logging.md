# Module: `observability`

Replaces the core's basic logger with [pino](https://getpino.io), adds request-ID middleware, a central error handler, and `/ready`.

## Install

```bash
node scripts/scaffold.mjs add observability <target-dir>
```

This **overwrites** two files from core:

- `src/lib/logger.ts` — swapped from the basic console logger to a pino-backed one
- `src/middleware/error.basic.ts`'s role is taken over by `src/middleware/error.ts` (reqId-aware)

Other modules already import `logger` from `./lib/logger.js` and `errorHandler` from `./middleware/error.js`, so the upgrade is seamless.

## Files added / replaced

- `src/lib/logger.ts` — replaced with pino-backed implementation
- `src/middleware/requestId.ts` — assigns `req.id` from `X-Request-Id` or generates one
- `src/middleware/error.ts` — central error handler that understands `AppError` and logs `reqId`
- `src/routes/ready.ts` — `/ready` with a check registry

## Wire it up

Auto-wired by `scaffold.mjs`: the generated `src/index.ts` mounts `requestId` and `pinoHttp` before routes, mounts `/ready`, and uses the reqId-aware error handler. For the manual recipe, see [`../wire-up.md`](../wire-up.md).

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
