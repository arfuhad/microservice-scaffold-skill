# microservice-scaffold — Agent Instructions

This file is the **canonical entry point** for any coding agent (Claude Code, Codex, Antigravity, Cursor, Aider, Qwen Coder, Gemini CLI, etc.) that needs to scaffold or update a Node.js microservice using this skill.

Tool-specific files in this directory (`CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `SKILL.md`) all redirect here. Read this file; ignore the others.

---

## What this skill does

Scaffolds modern Node.js microservices on a small, opinionated core:

- **Runtime:** Node.js 20+, ESM, TypeScript 5
- **API:** Express + (optionally) Apollo Server v4 for GraphQL
- **DB:** one of Mongoose 8, `pg` Pool, or Prisma
- **Optional modules:** JWT auth, zod validation, env-schema config, pino logging, central error handler, `/health` + `/ready`, multi-stage Dockerfile, docker-compose, vitest + supertest

Everything is a **module**. Pick what you need; skip the rest. Modules don't depend on each other except where noted.

---

## Two ways to use this skill

### A. Run the scaffold script (preferred when a shell is available)

```bash
# Initialize a new project with chosen modules
node scripts/scaffold.mjs init <target-dir> \
  --api=rest,graphql \
  --db=pg \
  --modules=auth,observability,docker,tests

# Add a single module to an existing project
node scripts/scaffold.mjs add <module> <target-dir>

# List available modules
node scripts/scaffold.mjs list
```

The script reads [`modules.json`](./modules.json), copies template files, merges `package.json` dependencies, and prints the exact next steps.

### B. Read templates and copy them yourself (when no shell, or for fine-grained edits)

1. Read [`modules.json`](./modules.json) to see the file list and npm deps for each module.
2. Copy the template files from `templates/` into the target project at the `dest` paths declared in the manifest.
3. Merge each module's `deps` and `devDeps` into the project's `package.json`.
4. Wire the modules into `src/index.ts` following [`references/wire-up.md`](./references/wire-up.md) — that single doc covers every module's wire-up in order.
5. Run the post-install steps listed in the module's reference doc under `references/`.

Either path produces the same result. The script is just a convenience — the manifest, templates, and `wire-up.md` are the source of truth.

---

## Module catalog

| Module | Description | Reference | Depends on |
|---|---|---|---|
| `core` | Base project: `package.json`, `tsconfig.json`, env loader, Express bootstrap, `/health` | [config/env.md](./references/config/env.md) | — |
| `rest` | REST router pattern with controllers, zod validation, example resource | [api/rest.md](./references/api/rest.md) | `core` |
| `graphql` | Apollo Server v4 mounted on Express with `expressMiddleware` | [api/graphql.md](./references/api/graphql.md) | `core` |
| `db-mongoose` | Mongoose 8 connection + model template + graceful shutdown | [db/mongoose.md](./references/db/mongoose.md) | `core` |
| `db-pg` | `pg.Pool` connection + parametrized query helper | [db/pg.md](./references/db/pg.md) | `core` |
| `db-prisma` | Prisma Client + sample schema + migration commands | [db/prisma.md](./references/db/prisma.md) | `core` |
| `auth-jwt` | JWT sign/verify + Express middleware + role guards | [auth/jwt.md](./references/auth/jwt.md) | `core` |
| `observability` | pino logger, request-ID middleware, central error handler, `/ready` | [observability/logging.md](./references/observability/logging.md) | `core` |
| `docker` | Multi-stage Dockerfile + docker-compose with selected DB | [docker/README.md](./references/docker/README.md) | `core` |
| `tests` | vitest + supertest config and example tests | [testing/vitest.md](./references/testing/vitest.md) | `core` |

Pick **at most one** of `db-mongoose` / `db-pg` / `db-prisma` per project unless you really know what you're doing.

---

## Adding a module to an existing project (any agent, any tool)

This is the **plug-and-play contract**. Every module follows the same shape so it works the same way for every LLM.

### With the scaffold script (preferred)

```bash
node scripts/scaffold.mjs add <module> <target>
```

The script copies files, merges `package.json`, regenerates `src/index.ts` based on `.scaffold-state.json`, and prints post-install commands. Wire-up is automatic; do not hand-edit `src/index.ts` after running it.

### Without the script (no shell, or for fine-grained control)

1. **Read** `modules.json` and look up the module by name.
2. **Read** `.scaffold-state.json` in the target (if present) to see what's already installed.
3. **Copy** each file from `files[].src` to `files[].dest` in the target project, creating directories as needed. Files marked `overwrite: true` (e.g., observability's logger upgrade) should replace existing files; others should never overwrite without diffing.
4. **Merge** `deps` and `devDeps` into the target's `package.json`. Prefer the higher version on conflict.
5. **Wire it up.** Open [`references/wire-up.md`](./references/wire-up.md) and rebuild `src/index.ts` for the full set of installed modules (existing + new). This single doc lists the imports and statements per module, in the correct order.
6. **Update** `.scaffold-state.json` to include the new module (alphabetized).
7. **Print** the post-install commands (e.g., `npm install`, `npx prisma generate`) listed in `modules.json` under the module's `postInstall` array.

Stop after step 7 to let the user run the install commands themselves.

---

## Coding conventions

These apply to every template and every change an agent makes inside a project scaffolded by this skill.

- **TypeScript, strict mode.** `tsconfig.json` ships with `"strict": true`.
- **ESM only.** `"type": "module"` in `package.json`. Imports use `.js` extensions even for `.ts` source files (Node ESM requirement).
- **Top-level `await` is fine.** Node 20+ supports it.
- **Env via zod schema.** All env vars go through `src/config/env.ts`. Never call `process.env.X` outside that file.
- **Errors are typed.** Throw `AppError` (from `src/lib/errors.ts`) for expected failures with HTTP status codes. Let the central handler format the response.
- **No `console.log` in app code.** Use the pino logger from `src/lib/logger.ts`.
- **No default exports** except where a framework requires it (e.g., Prisma schema).

---

## When to use this skill

- Creating a new microservice from scratch.
- Adding a previously-absent capability (e.g., "add JWT auth to this service") — use module-add flow.
- Standardizing connection/error-handling patterns across an existing service — copy the relevant templates and refactor to match.

## When NOT to use this skill

- Existing services with a different architecture (Nest, Fastify, Hono). The templates assume Express.
- Front-end projects, monorepo setups, or serverless functions.

---

## File layout of this skill

```
microservice-scaffold/
├── AGENTS.md              ← you are here
├── CLAUDE.md              ← shim → AGENTS.md
├── GEMINI.md              ← shim → AGENTS.md
├── SKILL.md               ← Claude/Gemini skill frontmatter
├── .cursorrules           ← shim → AGENTS.md
├── README.md              ← human-facing overview
├── modules.json           ← machine-readable module manifest
├── references/            ← per-module deep-dive docs ("wire it up" lives here)
│   ├── api/{rest,graphql}.md
│   ├── db/{mongoose,pg,prisma}.md
│   ├── auth/jwt.md
│   ├── config/env.md
│   ├── observability/{logging,errors,health}.md
│   ├── docker/README.md
│   └── testing/vitest.md
├── templates/             ← real, working files to copy into the target project
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .gitignore
│   ├── src/...
│   ├── tests/...
│   ├── docker/{Dockerfile,docker-compose.yml}
│   └── prisma/schema.prisma
└── scripts/
    └── scaffold.mjs       ← reads modules.json, copies templates, merges deps
```
