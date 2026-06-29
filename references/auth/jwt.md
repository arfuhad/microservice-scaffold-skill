# Module: `auth-jwt`

JWT sign/verify helpers plus Express middleware: `requireAuth`, `optionalAuth`, `requireRole`.

## Install

```bash
node scripts/scaffold.mjs add auth-jwt <target-dir>
```

## Files added

- `src/lib/jwt.ts` — `signToken`, `verifyToken`, `TokenPayload`
- `src/middleware/auth.ts` — `requireAuth`, `optionalAuth`, `requireRole`

## Env vars

| Var | Required | Default |
|---|---|---|
| `JWT_SECRET` | yes (min 16 chars) | — |
| `JWT_EXPIRES_IN` | no | `1h` |

For production: generate with `openssl rand -hex 32`. Never commit it.

## Wire it up

No global wire-up — apply the middleware on routers that need protection. (When `graphql` is also installed, `scaffold.mjs` auto-wires JWT verification into the Apollo context; see [`../wire-up.md`](../wire-up.md).)

```ts
import { requireAuth, requireRole } from '../middleware/auth.js';

router.get('/profile', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.delete('/users/:id', requireAuth, requireRole('admin'), handler);
```

Use `optionalAuth` when an endpoint returns different data depending on whether the caller is logged in but does not require it.

## Issuing tokens (login flow)

```ts
import { signToken } from '../lib/jwt.js';

router.post('/login', validate(loginSchema), async (req, res) => {
  const user = await verifyCredentials(req.body);
  const token = signToken({ sub: user.id, roles: user.roles });
  res.json({ token });
});
```

## Troubleshooting

- **`JWT_SECRET is required to sign or verify tokens`**: the secret is read lazily on the first sign/verify call. Set it in `.env` before issuing or validating tokens. The service itself starts fine without it (so unrelated routes still work).
- **`jwt expired`**: client is sending a stale token. Either refresh on the client or extend `JWT_EXPIRES_IN`.
