# Wire-up reference

`scaffold.mjs init` and `scaffold.mjs add` regenerate `src/index.ts` automatically based on the modules tracked in `.scaffold-state.json`. **You only need this doc if you are copying templates by hand** (e.g., an LLM running without shell access).

The recipe below mirrors what the script generates. Reproduce it exactly and the result will compile and run.

## Skeleton

Every `src/index.ts` follows this shape:

```ts
import 'dotenv/config';
import { env } from './config/env.js';
import { createApp } from './server/http.js';
import { logger } from './lib/logger.js';
import { installShutdown, onShutdown } from './lib/shutdown.js';
// ── module imports go here ──
// ── error-handler import (basic vs observability) goes here ──

async function main() {
  installShutdown(env.SHUTDOWN_TIMEOUT_MS);

  // ── db connect calls go here (await connectMongo / pingPg) ──

  const app = createApp();

  // ── observability middleware (requestId, pinoHttp, /ready) goes here ──

  // ── api registrations go here (registerRest, await registerApollo) ──

  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'service started');
  });

  onShutdown('http', () => new Promise<void>((r) => server.close(() => r())));
}

main().catch((err) => {
  logger.error({ err }, 'fatal startup error');
  process.exit(1);
});
```

## Per-module additions

Apply each module's `imports` and `body` lines, in the order shown. Skip modules you didn't install.

### `core` (always present)

Already covered by the skeleton above.

### Error handler — pick one based on installed modules

| Installed                  | Import                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `observability`            | `import { errorHandler, notFoundHandler } from './middleware/error.js';`                        |
| anything else (no obs)     | `import { errorHandler, notFoundHandler } from './middleware/error.basic.js';`                  |

The body lines (`app.use(notFoundHandler); app.use(errorHandler);`) are identical for both.

### `db-mongoose`

```ts
// import
import { connectMongo } from './db/mongoose.js';
// body — before createApp()
await connectMongo();
```

### `db-pg`

```ts
// import
import { pingPg } from './db/pg.js';
// body — before createApp()
await pingPg();
```

### `db-prisma`

No `index.ts` wire-up needed. Import `prisma` from `./db/prisma.js` where you query.

### `observability`

```ts
// imports
import { requestId } from './middleware/requestId.js';
import { pinoHttp } from 'pino-http';
import { readyRouter } from './routes/ready.js';
// body — immediately after `const app = createApp();`, BEFORE api registrations
app.use(requestId);
app.use(pinoHttp({ logger, customProps: (req) => ({ reqId: req.id }) }));
app.use('/ready', readyRouter);
```

### `rest`

```ts
// import
import { registerRest } from './server/rest.js';
// body — after observability middleware, before error handler
registerRest(app);
```

### `graphql` (without `auth-jwt`)

```ts
// import
import { registerApollo } from './server/apollo.js';
// body — after rest, before error handler
await registerApollo(app);
```

### `graphql` (with `auth-jwt` also installed)

```ts
// imports
import { registerApollo } from './server/apollo.js';
import { verifyToken } from './lib/jwt.js';
// body — after rest, before error handler
await registerApollo(app, {
  extractAuth: (req) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return {};
    try {
      const payload = verifyToken(header.slice(7));
      return { userId: payload.sub, roles: payload.roles };
    } catch {
      return {};
    }
  },
});
```

### `auth-jwt` (without `graphql`)

No `index.ts` wire-up needed. Apply `requireAuth` directly to protected routers:

```ts
import { requireAuth } from './middleware/auth.js';
exampleRouter.use(requireAuth); // or apply per-route
```

### `docker` / `tests`

No `index.ts` wire-up.

## Order summary

When multiple modules are installed, the body of `main()` follows this order:

1. `installShutdown(...)` (always)
2. DB connect calls (`connectMongo` / `pingPg`)
3. `const app = createApp();`
4. Observability middleware (`requestId`, `pinoHttp`, `/ready`)
5. API registrations (`registerRest`, `await registerApollo`)
6. `app.use(notFoundHandler); app.use(errorHandler);` (always last)
7. `app.listen(...)` + `onShutdown('http', …)`

If you follow this order, the result is byte-identical to what `scaffold.mjs` generates.
