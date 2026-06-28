# Module: `auth-jwt`

JWT sign/verify helpers plus Express middleware: `requireAuth`, `optionalAuth`, `requireRole`.

## Install

```bash
node v2/scripts/scaffold.mjs add auth-jwt <target-dir>
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

There is no global wire-up. Apply the middleware on routers that need protection:

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

## Combining with GraphQL

In `src/server/apollo.ts`, replace the placeholder `userId` extraction with:

```ts
import { verifyToken } from '../lib/jwt.js';
// inside context:
const raw = req.headers.authorization?.replace('Bearer ', '');
const userId = raw ? verifyToken(raw).sub : undefined;
return { userId };
```

## Troubleshooting

- **`JWT_SECRET is required` at boot**: the module's `lib/jwt.ts` throws at import time if the secret is missing. Set it in `.env`.
- **`jwt expired`**: client is sending a stale token. Either refresh on the client or extend `JWT_EXPIRES_IN`.
