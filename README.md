# Microservice Scaffold Skill

A tool-agnostic skill for scaffolding and updating Node.js microservices. Designed to be readable and usable by any coding agent — Claude Code, Codex, Antigravity, Cursor, Aider, Qwen Coder, Gemini CLI — not just one of them.

## Versions

- **[v1/](./v1)** — original Gemini CLI skill. Documentation-only guide for Express + Apollo v2 + Mongoose/PostgreSQL. Kept for reference.
- **[v2/](./v2)** — modern, tool-agnostic, plug-and-play. TypeScript-first. Modular: REST and/or GraphQL, choice of Mongoose 8 / pg / Prisma, optional auth/observability/docker/tests. Includes runnable templates and a scaffold script.

Most users want **v2**. Start at [v2/AGENTS.md](./v2/AGENTS.md).

## Design Principles

- **Agent-agnostic.** Canonical instructions live in `AGENTS.md` (community standard). Tool-specific files (`CLAUDE.md`, `GEMINI.md`, `.cursorrules`) are one-line shims that redirect to it.
- **Modular.** Each capability (REST, GraphQL, Mongoose, pg, Prisma, JWT, logging, Docker, tests) is an independent module. Add or remove without touching others.
- **Plug-and-play.** A machine-readable `modules.json` plus a `scripts/scaffold.mjs` CLI let any LLM (or human) initialize a project or add a single module with one command.
- **Convention over framework.** Plain Express + ESM + TypeScript. No bespoke abstractions.
