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

`registerApollo` is async — Apollo must `start()` before `expressMiddleware` is registered. In `src/index.ts`:

```ts
import { registerApollo } from './server/apollo.js';
// ...
await registerApollo(app);
```

(Replace the `// graphql: await registerApollo(app);` placeholder comment.)

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

`registerApollo`'s `context` function receives the Express `req` and returns a `GraphQLContext`. Combine with the `auth-jwt` module:

```ts
import { verifyToken } from '../lib/jwt.js';
// inside context:
const auth = req.headers.authorization?.replace('Bearer ', '');
return { userId: auth ? verifyToken(auth).sub : undefined };
```

## Troubleshooting

- **`Apollo Server must be started before...`**: you forgot `await` on `registerApollo`.
- **CORS errors from browser**: `registerApollo` mounts `cors()` on the GraphQL path. If you serve a non-default origin, configure `cors({ origin: ... })`.
