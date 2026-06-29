# microservice-scaffold

A plug-and-play, agent-agnostic scaffold for Node.js microservices. Designed so any coding agent (Claude Code, Codex, Antigravity, Cursor, Aider, Qwen Coder, Gemini CLI) can initialize a service or add a feature with the same workflow.

**Agents:** read [`AGENTS.md`](./AGENTS.md). Everything else in this repo is referenced from there.

**Humans:** keep reading.

## What's in the box

- **TypeScript 5 / ESM / Node 20+** baseline
- **REST** (Express) and/or **GraphQL** (Apollo Server v4) API layer
- DB choice: **Mongoose 8**, **`pg` Pool**, or **Prisma**
- Optional: **JWT** auth, **zod** validation, env-schema config, **pino** logger, central error handler, `/health` + `/ready`, multi-stage **Dockerfile**, **docker-compose**, **vitest** + supertest

Every capability is a self-contained module. The shape is the same for all of them, so any LLM can apply the "add a module" recipe without special-casing.

## Install

Pick whichever path matches how you want to use the skill. They can coexist — all three reference the same files.

### 1. Direct use (no install)

The scaffold script is zero-dep. Clone this repo and run it via Node:

```bash
git clone https://github.com/<you>/microservice-scaffold-skill.git
node microservice-scaffold-skill/scripts/scaffold.mjs \
  init my-service --api=rest --db=pg --modules=auth-jwt,observability,docker,tests
```

Optional convenience alias:

```bash
echo 'alias scaffold-svc="node $(pwd)/microservice-scaffold-skill/scripts/scaffold.mjs"' >> ~/.zshrc
source ~/.zshrc
scaffold-svc list
```

### 2. As a Claude Code skill

Symlink the repo into Claude Code's skills directory so the CLI discovers it via the `SKILL.md` frontmatter:

```bash
mkdir -p ~/.claude/skills
ln -s "$(pwd)/microservice-scaffold-skill" ~/.claude/skills/microservice-scaffold
```

Restart Claude Code. Prompts like *"scaffold a new Node microservice with REST + Postgres + JWT"* will then surface this skill. The skill's `CLAUDE.md` redirects to `AGENTS.md`, which contains the full contract Claude follows.

### 3. From another agent (Cursor / Gemini CLI / Codex / Aider)

The skill is agent-agnostic by design:

- **Cursor:** `.cursorrules` is already set up — open this repo as a workspace.
- **Gemini CLI:** `GEMINI.md` redirects to `AGENTS.md`.
- **Codex / Aider / generic agent:** point them at `AGENTS.md` (the OpenAI/Anthropic community standard).

All variants consume the same `modules.json` + `templates/`, so behavior is identical regardless of which agent drives it.

### Requirements

- Node.js **20+** (the scaffold script and templates both target Node 20 ESM).
- Git (only if cloning).
- No global npm install needed — the scaffolded project pulls its own deps via `npm install`.

## Quick start

```bash
# Initialize a new service
node scripts/scaffold.mjs init my-service \
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
node scripts/scaffold.mjs add graphql ./my-service
node scripts/scaffold.mjs add auth-jwt ./my-service
```

```bash
# See what's available (pass a target to mark installed modules)
node scripts/scaffold.mjs list ./my-service
```

The scaffold tracks installed modules in `.scaffold-state.json` and **regenerates `src/index.ts`** on every `init`/`add` based on that state. No manual wire-up step. Adding the same module twice is a no-op.

## Design Principles

1. **Same shape for every module.** `modules.json` declares each module's files, deps, and devDeps. The scaffold script regenerates `src/index.ts` so module wire-up is automatic — no glue code to copy by hand.
2. **No agent-specific lock-in.** `AGENTS.md` is canonical. `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `SKILL.md` are one-line shims pointing at it.
3. **Templates are real files, not snippets.** You can copy them verbatim into a project and they will compile and run. For agents that can't run the script, [`references/wire-up.md`](./references/wire-up.md) documents the manual recipe.
4. **Convention over framework.** Plain Express + ESM + TypeScript. No bespoke abstractions.

## File layout

See the "File layout of this skill" section in [`AGENTS.md`](./AGENTS.md).
