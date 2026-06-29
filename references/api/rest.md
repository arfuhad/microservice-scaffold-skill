# Module: `rest`

REST API on Express. Ships a router pattern with zod-validated request bodies/params, plus a working example resource at `/api/example`.

## Install

```bash
node scripts/scaffold.mjs add rest <target-dir>
```

## Files added

- `src/server/rest.ts` — `registerRest(app)` mounts `/api`
- `src/routes/example.rest.ts` — sample CRUD-ish router
- `src/middleware/validate.ts` — generic zod request validator

## Wire it up

Auto-wired by `scaffold.mjs`. For the manual recipe, see [`../wire-up.md`](../wire-up.md).

## Pattern

Each domain has a router file under `src/routes/`. The router uses `validate(schema)` middleware for request shaping:

```ts
const createSchema = z.object({
  body: z.object({ name: z.string().min(1) }),
});

router.post('/', validate(createSchema), (req, res) => {
  // req.body is fully typed by zod
});
```

Throw from `src/lib/errors.ts` (`badRequest`, `notFound`, ...) for expected failures — the central error handler formats them. Core ships a basic handler (`middleware/error.basic.ts`); installing the `observability` module upgrades it to a reqId-aware version at `middleware/error.ts`.

## Add a new resource

1. Create `src/routes/<name>.rest.ts` with a `Router()` export.
2. Mount it inside `registerRest`:

   ```ts
   import { fooRouter } from '../routes/foo.rest.js';
   api.use('/foo', fooRouter);
   ```

## Troubleshooting

- **404 on `/api/example/`**: trailing slash. Express is strict by default; use `/api/example`.
- **Body is `undefined`**: ensure `express.json()` is mounted (it is, in `createApp`).
