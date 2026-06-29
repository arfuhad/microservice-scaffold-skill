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
# Add a module to an existing project later — auto-wires it into src/index.ts
node v2/scripts/scaffold.mjs add graphql ./my-service
node v2/scripts/scaffold.mjs add auth-jwt ./my-service
```

```bash
# See what's available (pass a target to mark installed modules)
node v2/scripts/scaffold.mjs list ./my-service
```

The scaffold tracks installed modules in `.scaffold-state.json` and **regenerates `src/index.ts`** on every `init`/`add` based on that state. No manual wire-up step. Adding the same module twice is a no-op.

## File layout

See the "File layout of this skill" section in [`AGENTS.md`](./AGENTS.md).

## Design

Three principles, in order:

1. **Same shape for every module.** `modules.json` declares each module's files, deps, and devDeps. The scaffold script regenerates `src/index.ts` so module wire-up is automatic — no glue code to copy by hand.
2. **No agent-specific lock-in.** `AGENTS.md` is canonical. `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `SKILL.md` are one-line shims pointing at it.
3. **Templates are real files, not snippets.** You can copy them verbatim into a project and they will compile and run. For agents that can't run the script, [`references/wire-up.md`](./references/wire-up.md) documents the manual recipe.
