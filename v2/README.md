# microservice-scaffold v2

A plug-and-play, agent-agnostic scaffold for Node.js microservices. Designed so any coding agent (Claude Code, Codex, Antigravity, Cursor, Aider, Qwen Coder, Gemini CLI) can initialize a service or add a feature with the same workflow.

**Agents:** read [`AGENTS.md`](./AGENTS.md). Everything else in this folder is referenced from there.

**Humans:** keep reading.

## What's in the box

- **TypeScript 5 / ESM / Node 20+** baseline
- **REST** (Express) and/or **GraphQL** (Apollo Server v4) API layer
- DB choice: **Mongoose 8**, **`pg` Pool**, or **Prisma**
- Optional: **JWT** auth, **zod** validation, env-schema config, **pino** logger, central error handler, `/health` + `/ready`, multi-stage **Dockerfile**, **docker-compose**, **vitest** + supertest

Every capability is a self-contained module. The shape is the same for all of them, so any LLM can apply the "add a module" recipe without special-casing.

## Quick start

```bash
# Initialize a new service
node v2/scripts/scaffold.mjs init my-service \
  --api=rest \
  --db=pg \
  --modules=auth-jwt,observability,docker,tests

cd my-service
npm install
cp .env.example .env
npm run dev
```

```bash
# Add a module to an existing project later
node v2/scripts/scaffold.mjs add graphql ./my-service
node v2/scripts/scaffold.mjs add auth-jwt ./my-service
```

```bash
# See what's available
node v2/scripts/scaffold.mjs list
```

## File layout

See the "File layout of this skill" section in [`AGENTS.md`](./AGENTS.md).

## Design

Three principles, in order:

1. **Same shape for every module.** `modules.json` declares each module's files, deps, and devDeps. The reference doc explains the 2–5 lines of glue to wire it into `src/index.ts`. No module breaks the pattern.
2. **No agent-specific lock-in.** `AGENTS.md` is canonical. `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `SKILL.md` are one-line shims pointing at it.
3. **Templates are real files, not snippets.** You can copy them verbatim into a project and they will compile and run.
