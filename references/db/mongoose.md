# Module: `db-mongoose`

Mongoose **8** connection with event-based logging and graceful shutdown.

> Don't pass `useNewUrlParser` / `useUnifiedTopology` — both are no-ops in Mongoose 6+ and emit deprecation warnings.

## Install

```bash
node scripts/scaffold.mjs add db-mongoose <target-dir>
```

Conflicts with `db-pg` and `db-prisma` — pick one.

## Files added

- `src/db/mongoose.ts` — `connectMongo()` + lifecycle hooks
- `src/models/example.ts` — sample model using `InferSchemaType`

## Env vars

| Var | Required | Example |
|---|---|---|
| `MONGO_URI` | yes | `mongodb://localhost:27017/myapp` |

For authenticated URIs, encode credentials in the URI itself:
`mongodb://user:pass@host:27017/myapp?authSource=admin`

## Wire it up

Auto-wired by `scaffold.mjs` — `await connectMongo()` is placed before the app is created. Shutdown registers via the central coordinator (`onShutdown('mongo', …)`). For the manual recipe, see [`../wire-up.md`](../wire-up.md).

## Defining a model

```ts
import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema> & { _id: string };
export const UserModel = model('User', userSchema);
```

## Troubleshooting

- **`MongoServerSelectionError`**: `serverSelectionTimeoutMS` defaults to 5s in the template. Increase if your DB is slow to bootstrap, or check that `MONGO_URI` is reachable.
- **Connection works but no documents written**: check that the model name matches an existing collection (Mongoose pluralizes — `User` ⇒ `users`).
