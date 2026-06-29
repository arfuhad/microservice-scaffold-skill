# Microservice Scaffold Skill

A tool-agnostic skill for scaffolding and updating Node.js microservices. Designed to be readable and usable by any coding agent — Claude Code, Codex, Antigravity, Cursor, Aider, Qwen Coder, Gemini CLI — not just one of them.

## Versions

- **[v1/](./v1)** — original Gemini CLI skill. Documentation-only guide for Express + Apollo v2 + Mongoose/PostgreSQL. Kept for reference.
- **[v2/](./v2)** — modern, tool-agnostic, plug-and-play. TypeScript-first. Modular: REST and/or GraphQL, choice of Mongoose 8 / pg / Prisma, optional auth/observability/docker/tests. Includes runnable templates and a scaffold script.

Most users want **v2**. Start at [v2/AGENTS.md](./v2/AGENTS.md).

## Install

Pick whichever path matches how you want to use the skill. They can coexist — all three reference the same files.

### 1. Direct use (no install)

The scaffold script is zero-dep. Clone this repo (or copy the `v2/` folder) and run it via Node:

```bash
git clone https://github.com/<you>/microservice-scaffold-skill.git
node microservice-scaffold-skill/v2/scripts/scaffold.mjs \
  init my-service --api=rest --db=pg --modules=auth-jwt,observability,docker,tests
```

Optional convenience alias:

```bash
echo 'alias scaffold-svc="node $(pwd)/microservice-scaffold-skill/v2/scripts/scaffold.mjs"' >> ~/.zshrc
source ~/.zshrc
scaffold-svc list
```

### 2. As a Claude Code skill

Symlink `v2/` into Claude Code's skills directory so the CLI discovers it via the `SKILL.md` frontmatter:

```bash
mkdir -p ~/.claude/skills
ln -s "$(pwd)/microservice-scaffold-skill/v2" ~/.claude/skills/microservice-scaffold
```

Restart Claude Code. Prompts like *"scaffold a new Node microservice with REST + Postgres + JWT"* will then surface this skill. The skill's `CLAUDE.md` redirects to `AGENTS.md`, which contains the full contract Claude follows.

### 3. From another agent (Cursor / Gemini CLI / Codex / Aider)

The skill is agent-agnostic by design:

- **Cursor:** `v2/.cursorrules` is already set up — drop `v2/` into a workspace.
- **Gemini CLI:** `v2/GEMINI.md` redirects to `AGENTS.md`.
- **Codex / Aider / generic agent:** point them at `v2/AGENTS.md` (the OpenAI/Anthropic community standard).

All variants consume the same `v2/modules.json` + `v2/templates/`, so behavior is identical regardless of which agent drives it.

### Requirements

- Node.js **20+** (the scaffold script and templates both target Node 20 ESM).
- Git (only if cloning).
- No global npm install needed — the scaffolded project pulls its own deps via `npm install`.

## Design Principles

- **Agent-agnostic.** Canonical instructions live in `AGENTS.md` (community standard). Tool-specific files (`CLAUDE.md`, `GEMINI.md`, `.cursorrules`) are one-line shims that redirect to it.
- **Modular.** Each capability (REST, GraphQL, Mongoose, pg, Prisma, JWT, logging, Docker, tests) is an independent module. Add or remove without touching others.
- **Plug-and-play.** A machine-readable `modules.json` plus a `scripts/scaffold.mjs` CLI let any LLM (or human) initialize a project or add a single module with one command.
- **Convention over framework.** Plain Express + ESM + TypeScript. No bespoke abstractions.
