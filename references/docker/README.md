# Module: `docker`

Multi-stage `Dockerfile` for production and a `docker-compose.yml` for local development with the DB of your choice.

## Install

```bash
node scripts/scaffold.mjs add docker <target-dir>
```

## Files added

- `Dockerfile` — three stages: `deps`, `build`, `runtime`. Runtime is `node:20-alpine` with prod-only `node_modules`.
- `.dockerignore`
- `docker-compose.yml` — `app` service plus commented-out `postgres` and `mongo` services.

## Local development

Pick the DB matching your installed module and uncomment its block in `docker-compose.yml` (plus the `depends_on` and the volume).

```bash
docker compose up --build
# app at http://localhost:4000
```

## Production image

```bash
docker build -t my-service:latest .
docker run --rm -p 4000:4000 --env-file .env my-service:latest
```

The image:

- runs as the non-root `node` user
- ships only built JS in `dist/` and production `node_modules`
- expects `NODE_ENV=production` (set in the Dockerfile)

## Troubleshooting

- **`npm ci` fails with `EUSAGE`**: there's no `package-lock.json` yet. Run `npm install` once locally, commit the lockfile, then build.
- **App can't reach `postgres` / `mongo`**: use the service name (`postgres`, `mongo`) as the host, not `localhost`. Inside the network, `PG_HOST=postgres`.
- **Permission errors on `dist/`**: the build stage runs as root, runtime as `node`. The COPY in the runtime stage preserves ownership — if you mount a volume on top, it may shadow this.
