# Module: `db-prisma`

Prisma Client + schema + migration commands. Defaults to PostgreSQL but the provider in `prisma/schema.prisma` is swappable.

## Install

```bash
node v2/scripts/scaffold.mjs add db-prisma <target-dir>
```

Conflicts with `db-mongoose` and `db-pg` — pick one.

## Files added

- `src/db/prisma.ts` — singleton `prisma` client + graceful shutdown
- `prisma/schema.prisma` — sample `Example` model

## Env vars

| Var | Required | Example |
|---|---|---|
| `DATABASE_URL` | yes | `postgresql://user:pass@host:5432/db?schema=public` |

## After install

```bash
npx prisma generate                 # generate the typed client
npx prisma migrate dev --name init  # apply the initial migration
```

## Wire it up

No glue in `src/index.ts`. Import the singleton wherever needed:

```ts
import { prisma } from '../db/prisma.js';

const items = await prisma.example.findMany();
```

## Adding a model

Edit `prisma/schema.prisma`, then:

```bash
npx prisma migrate dev --name add_user
```

This generates a migration, applies it, and regenerates the client. **Never edit migration SQL by hand after it's committed.**

## Switching to MySQL or SQLite

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"  // or "sqlite"
  url      = env("DATABASE_URL")
}
```

Then re-run `npx prisma generate`.

## Troubleshooting

- **`Cannot find module '@prisma/client'`**: you skipped `npx prisma generate`.
- **`Environment variable not found: DATABASE_URL`**: Prisma reads env at generate-time too. Make sure `.env` exists before generating.
