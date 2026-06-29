---
name: microservice-scaffold
description: Scaffold a modern Node.js (TS, ESM, Node 20+) microservice — REST and/or GraphQL, with Mongoose 8 / pg / Prisma, optional JWT, observability, Docker, and tests. Plug-and-play modules, agent-agnostic. Use when starting a new service or adding a capability (auth, db, graphql, etc.) to an existing one.
---

# microservice-scaffold

This skill is **agent-agnostic**. The canonical instructions live in [`AGENTS.md`](./AGENTS.md). Read that file for the module catalog, install flow, and coding conventions.

This `SKILL.md` exists only so Claude Code and Gemini CLI discover the skill via their normal frontmatter scan. It is intentionally short.

## Quick pointer

- New project: `node scripts/scaffold.mjs init <target> --api=rest --db=pg`
- Add a module: `node scripts/scaffold.mjs add auth-jwt <target>`
- List modules: `node scripts/scaffold.mjs list`
- Full instructions: [`AGENTS.md`](./AGENTS.md)
