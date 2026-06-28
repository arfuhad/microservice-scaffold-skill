# Module: `rest`

REST API on Express. Ships a router pattern with zod-validated request bodies/params, plus a working example resource at `/api/example`.

## Install

```bash
node v2/scripts/scaffold.mjs add rest <target-dir>
```

## Files added

- `src/server/rest.ts` — `registerRest(app)` mounts `/api`
- `src/routes/example.rest.ts` — sample CRUD-ish router
- `src/middleware/validate.ts` — generic zod request validator

## Wire it up

In `src/index.ts`, after `const app = createApp();`, add:

```ts
import { registerRest } from './server/rest.js';
// ...
registerRest(app);
```

(Replace the `// rest: registerRest(app);` placeholder comment.)

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

Throw from `src/lib/errors.ts` (`badRequest`, `notFound`, ...) for expected failures — the central error handler (from the `observability` module) formats them. Without `observability`, Express's default handler renders a 500.

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
