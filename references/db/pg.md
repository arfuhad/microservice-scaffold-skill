# Module: `db-pg`

PostgreSQL using the `pg` package with connection pooling, a parametrized `query()` helper, and a `withTransaction()` helper.

## Install

```bash
node scripts/scaffold.mjs add db-pg <target-dir>
```

Conflicts with `db-mongoose` and `db-prisma` — pick one.

## Files added

- `src/db/pg.ts` — `pool`, `query()`, `withTransaction()`, `pingPg()`

## Env vars

| Var | Required | Default |
|---|---|---|
| `PG_HOST` | yes | — |
| `PG_PORT` | no | `5432` |
| `PG_USER` | yes | — |
| `PG_PASSWORD` | no | — |
| `PG_DATABASE` | yes | — |

## Wire it up

Auto-wired by `scaffold.mjs` — it adds `await pingPg()` before the app is created and registers pool shutdown via the central coordinator. For the manual recipe, see [`../wire-up.md`](../wire-up.md).

`pingPg` runs a `SELECT 1` to fail-fast if config is wrong. The pool itself is lazy — creating `getPool()` only happens on first use, so missing `PG_*` env vars don't crash unrelated startup paths.

## Querying

Always use parametrized queries — never string interpolation. SQL injection prevention is the whole point.

```ts
import { query } from '../db/pg.js';

const { rows } = await query<{ id: string; name: string }>(
  'SELECT id, name FROM examples WHERE id = $1',
  [id]
);
```

## Transactions

```ts
import { withTransaction } from '../db/pg.js';

await withTransaction(async (client) => {
  await client.query('INSERT INTO examples (id, name) VALUES ($1, $2)', [id, name]);
  await client.query('INSERT INTO audit (op, target) VALUES ($1, $2)', ['create', id]);
});
```

The wrapper handles BEGIN/COMMIT/ROLLBACK automatically.

## Troubleshooting

- **`password authentication failed`**: usually `PG_PASSWORD` mismatch with the server.
- **Pool exhaustion under load**: the template caps `max: 20`. Increase if the DB can take it.
- **Idle connection drops behind a proxy**: lower `idleTimeoutMillis` below the proxy's idle limit.
