# Module: `core` — environment & bootstrap

The `core` module is the foundation of every project built with this skill. It ships:

- `package.json`, `tsconfig.json`, `.env.example`, `.gitignore`
- `src/index.ts` — entry point that boots Express and listens
- `src/config/env.ts` — zod-validated environment schema
- `src/server/http.ts` — `createApp()` factory
- `src/lib/logger.ts` — basic JSON logger (replaced by the `observability` module when installed)
- `src/lib/errors.ts` — `AppError` + helpers (`badRequest`, `unauthorized`, ...)
- `src/routes/health.ts` — `GET /health`

## Install

```bash
node scripts/scaffold.mjs init <target-dir>
```

This installs `core` only. Add other modules with `add`.

## After install

```bash
cd <target-dir>
npm install
cp .env.example .env
npm run dev
# GET http://localhost:4000/health
```

## Env vars

| Var | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | `development` / `test` / `production` |
| `PORT` | `4000` | |
| `LOG_LEVEL` | `info` | `fatal` / `error` / `warn` / `info` / `debug` / `trace` |

The schema in `src/config/env.ts` also declares optional vars for other modules (`JWT_SECRET`, `MONGO_URI`, `PG_*`, `DATABASE_URL`). They are validated only when the corresponding module's code actually reads them.

## Convention

**Never call `process.env.X` outside `src/config/env.ts`.** Add new vars to the zod schema first, then import `env` from `./config/env.js`.

## Adding a new env var

1. Add the field to the schema in `src/config/env.ts`.
2. Add the var to `.env.example` with a sensible default or placeholder.
3. Use it via `import { env } from '../config/env.js'`.

## How modules wire into the entry point

`scaffold.mjs` regenerates `src/index.ts` on every `init`/`add` based on the modules tracked in `.scaffold-state.json`. You should not hand-edit `src/index.ts` — your changes will be lost on the next `add`. If you need to customize the startup flow, edit `src/server/http.ts` (which generated `index.ts` calls into) instead.

For the manual recipe (when not using the script), see [`../wire-up.md`](../wire-up.md).
