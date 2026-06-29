# Module: `graphql`

GraphQL API via Apollo Server **v4** mounted on Express with `expressMiddleware`.

> v1 of this skill used `apollo-server-express` (Apollo v2/v3), which is deprecated. v2 uses `@apollo/server` v4 — the supported path.

## Install

```bash
node v2/scripts/scaffold.mjs add graphql <target-dir>
```

## Files added

- `src/server/apollo.ts` — `registerApollo(app, path?)` mounts the middleware
- `src/graphql/schema.ts` — type defs (`gql` template tag)
- `src/graphql/resolvers.ts` — resolver map

## Wire it up

Auto-wired by `scaffold.mjs`. If `auth-jwt` is also installed, the script wires `extractAuth` to verify Bearer tokens automatically. For the manual recipe, see [`../wire-up.md`](../wire-up.md).

## Modular schemas

For larger services, split type defs by domain and merge:

```bash
npm install @graphql-tools/load-files @graphql-tools/merge
```

```ts
// src/graphql/schema.ts
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
export const typeDefs = mergeTypeDefs(loadFilesSync('src/graphql/**/*.graphql'));
```

## Context & auth

`registerApollo` accepts an `extractAuth(req) => GraphQLContext` callback. With `auth-jwt` installed, the scaffold passes a Bearer-token verifier automatically. If you call it by hand:

```ts
import { verifyToken } from '../lib/jwt.js';
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

## CORS

`registerApollo` reads `env.CORS_ORIGIN` — a comma-separated list of allowed origins. Unset means permissive in dev / blocked in production.

## Troubleshooting

- **`Apollo Server must be started before...`**: you forgot `await` on `registerApollo`.
- **CORS errors from browser**: set `CORS_ORIGIN=https://your.app` in `.env`.
