# Module: `tests`

Vitest + supertest scaffold with a sample test that hits `/health` against the in-memory Express app.

## Install

```bash
node scripts/scaffold.mjs add tests <target-dir>
```

## Files added

- `vitest.config.ts`
- `tests/health.test.ts`

Also merges these scripts into `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## Run

```bash
npm test
npm run test:watch
```

## Pattern

- Use `supertest(createApp())` to drive the Express app without binding a port.
- Each test creates its own app via `createApp()` for isolation.
- For DB-touching integration tests, prefer a real test DB over mocks. Spin one up via `docker compose` and set `NODE_ENV=test` with an isolated `MONGO_URI` / `DATABASE_URL`.

```ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server/http.js';

describe('POST /api/example', () => {
  it('creates an example', async () => {
    const app = createApp();
    const res = await request(app).post('/api/example').send({ name: 'foo' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'foo' });
  });
});
```

## Coverage

```bash
npx vitest run --coverage
```

The config enables the `v8` provider with text + HTML reporters by default.
