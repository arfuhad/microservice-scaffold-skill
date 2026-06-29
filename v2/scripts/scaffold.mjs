#!/usr/bin/env node
// microservice-scaffold v2 — scaffolding CLI.
// Zero dependencies. Run with: node v2/scripts/scaffold.mjs <command> [args]
//
// Commands:
//   init <target> [--api=rest,graphql] [--db=mongoose|pg|prisma] [--modules=a,b,c] [--force]
//   add  <module> <target> [--force]
//   list [<target>]
//   help

import { readFile, writeFile, mkdir, access, copyFile, readdir } from 'node:fs/promises';
import { existsSync, constants } from 'node:fs';
import { dirname, join, resolve, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(__dirname, '..');
const STATE_FILE = '.scaffold-state.json';

// ----- ANSI helpers ---------------------------------------------------------
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m',
};
const log = (...a) => console.log(...a);
const ok = (m) => log(`${c.green}✓${c.reset} ${m}`);
const warn = (m) => log(`${c.yellow}!${c.reset} ${m}`);
const err = (m) => log(`${c.red}✗${c.reset} ${m}`);
const step = (m) => log(`${c.cyan}→${c.reset} ${m}`);

// ----- manifest -------------------------------------------------------------
async function loadManifest() {
  const raw = await readFile(join(SKILL_ROOT, 'modules.json'), 'utf8');
  return JSON.parse(raw);
}

// ----- arg parsing ----------------------------------------------------------
function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      flags[k] = v === undefined ? true : v;
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

// ----- module resolution ----------------------------------------------------
function resolveModuleList(manifest, requested) {
  const known = new Set(Object.keys(manifest.modules));
  const requestedSet = new Set(requested);
  // expand `requires` transitively
  const queue = [...requestedSet];
  while (queue.length) {
    const name = queue.shift();
    if (!known.has(name)) {
      throw new Error(`Unknown module: ${name}. Run 'list' to see available modules.`);
    }
    requestedSet.add(name);
    for (const dep of manifest.modules[name].requires ?? []) {
      if (!requestedSet.has(dep)) queue.push(dep);
    }
  }
  // detect conflicts
  for (const name of requestedSet) {
    for (const conflict of manifest.modules[name].conflicts ?? []) {
      if (requestedSet.has(conflict)) {
        throw new Error(`Modules conflict: '${name}' cannot be installed alongside '${conflict}'.`);
      }
    }
  }
  // order: core first, then alphabetical
  const ordered = [];
  if (requestedSet.has('core')) {
    ordered.push('core');
    requestedSet.delete('core');
  }
  return [...ordered, ...[...requestedSet].sort()];
}

function modulesFromInitFlags(flags) {
  const set = new Set(['core']);
  if (flags.api) {
    for (const api of String(flags.api).split(',').map((s) => s.trim()).filter(Boolean)) {
      if (api === 'rest' || api === 'graphql') set.add(api);
      else throw new Error(`Unknown --api value: ${api} (use rest or graphql)`);
    }
  }
  if (flags.db) {
    const db = String(flags.db).trim();
    if (['mongoose', 'pg', 'prisma'].includes(db)) set.add(`db-${db}`);
    else throw new Error(`Unknown --db value: ${db} (use mongoose, pg, or prisma)`);
  }
  if (flags.modules) {
    for (const m of String(flags.modules).split(',').map((s) => s.trim()).filter(Boolean)) {
      set.add(m);
    }
  }
  return [...set];
}

// ----- file ops -------------------------------------------------------------
async function fileExists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function copyTemplate(srcRel, destAbs, { force = false, overwrite = false } = {}) {
  const src = join(SKILL_ROOT, srcRel);
  if (!existsSync(src)) {
    throw new Error(`Template missing: ${srcRel}`);
  }
  if (await fileExists(destAbs)) {
    if (!force && !overwrite) {
      warn(`skip (exists): ${relative(process.cwd(), destAbs)}`);
      return false;
    }
  }
  await mkdir(dirname(destAbs), { recursive: true });
  await copyFile(src, destAbs);
  ok(`wrote ${relative(process.cwd(), destAbs)}`);
  return true;
}

async function writeFileLogged(destAbs, contents, { force = false } = {}) {
  if (await fileExists(destAbs) && !force) {
    warn(`skip (exists): ${relative(process.cwd(), destAbs)}`);
    return false;
  }
  await mkdir(dirname(destAbs), { recursive: true });
  await writeFile(destAbs, contents);
  ok(`wrote ${relative(process.cwd(), destAbs)}`);
  return true;
}

// ----- semver compare (real, with pre-release handling) ---------------------
function parseSemver(s) {
  const m = String(s).match(/^[\^~>=<]*\s*v?(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?/);
  if (!m) return { main: [0, 0, 0], pre: null };
  return {
    main: [Number(m[1]), Number(m[2]), Number(m[3])],
    pre: m[4] ? m[4].split('.').map((p) => (/^\d+$/.test(p) ? Number(p) : p)) : null,
  };
}

function cmpSemver(a, b) {
  const A = parseSemver(a), B = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (A.main[i] !== B.main[i]) return A.main[i] - B.main[i];
  }
  // Per semver: a version with pre-release has lower precedence than the same version without.
  if (A.pre === null && B.pre !== null) return 1;
  if (A.pre !== null && B.pre === null) return -1;
  if (A.pre === null && B.pre === null) return 0;
  const len = Math.max(A.pre.length, B.pre.length);
  for (let i = 0; i < len; i++) {
    const ai = A.pre[i], bi = B.pre[i];
    if (ai === undefined) return -1;
    if (bi === undefined) return 1;
    if (typeof ai === typeof bi) {
      if (ai < bi) return -1;
      if (ai > bi) return 1;
    } else {
      // numeric identifiers have lower precedence than alphanumeric
      return typeof ai === 'number' ? -1 : 1;
    }
  }
  return 0;
}

function pickHigher(a, b) {
  return cmpSemver(a, b) >= 0 ? a : b;
}

// ----- package.json merging -------------------------------------------------
async function mergePackageJson(targetDir, modulesToApply, manifest) {
  const pkgPath = join(targetDir, 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
  } catch {
    pkg = {};
  }
  pkg.dependencies ??= {};
  pkg.devDependencies ??= {};
  pkg.scripts ??= {};

  for (const name of modulesToApply) {
    const mod = manifest.modules[name];
    for (const [dep, ver] of Object.entries(mod.deps ?? {})) {
      pkg.dependencies[dep] = pkg.dependencies[dep] ? pickHigher(pkg.dependencies[dep], ver) : ver;
    }
    for (const [dep, ver] of Object.entries(mod.devDeps ?? {})) {
      pkg.devDependencies[dep] = pkg.devDependencies[dep]
        ? pickHigher(pkg.devDependencies[dep], ver)
        : ver;
    }
    for (const [k, v] of Object.entries(mod.scripts ?? {})) {
      if (!pkg.scripts[k]) pkg.scripts[k] = v;
    }
  }

  if (!pkg.name || pkg.name === 'service') pkg.name = basename(resolve(targetDir));

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  ok(`merged package.json (${Object.keys(pkg.dependencies).length} deps, ${Object.keys(pkg.devDependencies).length} devDeps)`);
}

// ----- state tracking -------------------------------------------------------
async function readState(targetDir) {
  const p = join(targetDir, STATE_FILE);
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch {
    return { skill: 'microservice-scaffold', version: null, modules: [] };
  }
}

async function writeState(targetDir, state, manifest) {
  const p = join(targetDir, STATE_FILE);
  const out = {
    skill: 'microservice-scaffold',
    version: manifest.version,
    modules: [...new Set(state.modules)].sort(),
    updatedAt: new Date().toISOString(),
  };
  await writeFile(p, JSON.stringify(out, null, 2) + '\n');
}

// ----- index.ts generator (wire-up) -----------------------------------------
function renderIndexTs(installed) {
  const has = (m) => installed.includes(m);
  const imports = [
    `import 'dotenv/config';`,
    `import { env } from './config/env.js';`,
    `import { createApp } from './server/http.js';`,
    `import { logger } from './lib/logger.js';`,
    `import { installShutdown, onShutdown } from './lib/shutdown.js';`,
  ];
  if (has('db-mongoose')) imports.push(`import { connectMongo } from './db/mongoose.js';`);
  if (has('db-pg')) imports.push(`import { pingPg } from './db/pg.js';`);
  if (has('rest')) imports.push(`import { registerRest } from './server/rest.js';`);
  if (has('graphql')) {
    imports.push(`import { registerApollo } from './server/apollo.js';`);
    if (has('auth-jwt')) imports.push(`import { verifyToken } from './lib/jwt.js';`);
  }
  if (has('observability')) {
    imports.push(`import { requestId } from './middleware/requestId.js';`);
    imports.push(`import { pinoHttp } from 'pino-http';`);
    imports.push(`import { readyRouter } from './routes/ready.js';`);
    imports.push(`import { errorHandler, notFoundHandler } from './middleware/error.js';`);
  } else {
    imports.push(`import { errorHandler, notFoundHandler } from './middleware/error.basic.js';`);
  }

  const body = [];
  body.push(`async function main() {`);
  body.push(`  installShutdown(env.SHUTDOWN_TIMEOUT_MS);`);
  body.push(``);
  if (has('db-mongoose')) body.push(`  await connectMongo();`);
  if (has('db-pg')) body.push(`  await pingPg();`);
  body.push(``);
  body.push(`  const app = createApp();`);
  body.push(``);
  if (has('observability')) {
    body.push(`  app.use(requestId);`);
    body.push(`  app.use(pinoHttp({ logger, customProps: (req) => ({ reqId: req.id }) }));`);
    body.push(`  app.use('/ready', readyRouter);`);
    body.push(``);
  }
  if (has('rest')) body.push(`  registerRest(app);`);
  if (has('graphql')) {
    if (has('auth-jwt')) {
      body.push(`  await registerApollo(app, {`);
      body.push(`    extractAuth: (req) => {`);
      body.push(`      const header = req.headers.authorization;`);
      body.push(`      if (!header?.startsWith('Bearer ')) return {};`);
      body.push(`      try {`);
      body.push(`        const payload = verifyToken(header.slice(7));`);
      body.push(`        return { userId: payload.sub, roles: payload.roles };`);
      body.push(`      } catch {`);
      body.push(`        return {};`);
      body.push(`      }`);
      body.push(`    },`);
      body.push(`  });`);
    } else {
      body.push(`  await registerApollo(app);`);
    }
  }
  body.push(``);
  body.push(`  app.use(notFoundHandler);`);
  body.push(`  app.use(errorHandler);`);
  body.push(``);
  body.push(`  const server = app.listen(env.PORT, () => {`);
  body.push(`    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'service started');`);
  body.push(`  });`);
  body.push(``);
  // server close runs as the first shutdown step (LIFO order)
  body.push(`  onShutdown('http', () => new Promise<void>((r) => server.close(() => r())));`);
  body.push(`}`);
  body.push(``);
  body.push(`main().catch((err) => {`);
  body.push(`  logger.error({ err }, 'fatal startup error');`);
  body.push(`  process.exit(1);`);
  body.push(`});`);

  return imports.join('\n') + '\n\n' + body.join('\n') + '\n';
}

// ----- docker-compose generator ---------------------------------------------
function renderDockerCompose(installed) {
  const has = (m) => installed.includes(m);
  const lines = [`services:`, `  app:`, `    build: .`, `    ports:`, `      - "4000:4000"`, `    env_file: .env`];
  const dbs = [];
  if (has('db-pg') || has('db-prisma')) {
    lines.push(`    depends_on:`, `      - postgres`);
    dbs.push(
      ``,
      `  postgres:`,
      `    image: postgres:16-alpine`,
      `    environment:`,
      `      POSTGRES_USER: postgres`,
      `      POSTGRES_PASSWORD: postgres`,
      `      POSTGRES_DB: app`,
      `    ports:`,
      `      - "5432:5432"`,
      `    volumes:`,
      `      - pgdata:/var/lib/postgresql/data`
    );
  }
  if (has('db-mongoose')) {
    lines.push(`    depends_on:`, `      - mongo`);
    dbs.push(
      ``,
      `  mongo:`,
      `    image: mongo:7`,
      `    ports:`,
      `      - "27017:27017"`,
      `    volumes:`,
      `      - mongodata:/data/db`
    );
  }
  const volumes = [];
  if (has('db-pg') || has('db-prisma')) volumes.push(`  pgdata:`);
  if (has('db-mongoose')) volumes.push(`  mongodata:`);
  return (
    [...lines, ...dbs].join('\n') +
    (volumes.length ? `\n\nvolumes:\n${volumes.join('\n')}` : '') +
    '\n'
  );
}

// ----- apply ----------------------------------------------------------------
async function applyModules(targetDir, modulesToApply, manifest, { force }) {
  await mkdir(targetDir, { recursive: true });
  for (const name of modulesToApply) {
    step(`module: ${c.bold}${name}${c.reset}`);
    const mod = manifest.modules[name];
    for (const file of mod.files ?? []) {
      await copyTemplate(file.src, join(targetDir, file.dest), {
        force,
        overwrite: file.overwrite,
      });
    }
  }
  await mergePackageJson(targetDir, modulesToApply, manifest);
}

function printPostInstall(modulesToApply, manifest) {
  log(`\n${c.bold}Next steps:${c.reset}`);
  const seen = new Set();
  for (const name of modulesToApply) {
    for (const cmd of manifest.modules[name].postInstall ?? []) {
      if (seen.has(cmd)) continue;
      seen.add(cmd);
      log(`  ${c.green}$${c.reset} ${cmd}`);
    }
  }
}

async function regenerateGenerated(targetDir, installed) {
  // src/index.ts — always regenerated to reflect installed modules
  await writeFile(join(targetDir, 'src/index.ts'), renderIndexTs(installed));
  ok(`generated src/index.ts (${installed.filter((m) => m !== 'core').length} module wire-ups)`);
  // docker-compose.yml — only if docker module installed
  if (installed.includes('docker')) {
    await writeFile(join(targetDir, 'docker-compose.yml'), renderDockerCompose(installed));
    ok(`generated docker-compose.yml`);
  }
}

// ----- non-empty dir guard --------------------------------------------------
async function isDirSafeForInit(dir) {
  if (!existsSync(dir)) return true;
  try {
    const entries = await readdir(dir);
    // Allow dotfiles and a few common metadata files; refuse if real content exists.
    const real = entries.filter((e) => !['.git', '.gitignore', '.DS_Store', STATE_FILE].includes(e));
    return real.length === 0;
  } catch {
    return true;
  }
}

// ----- commands -------------------------------------------------------------
async function cmdList(positional) {
  const m = await loadManifest();
  log(`${c.bold}microservice-scaffold v${m.version} — modules${c.reset}\n`);
  let installed = null;
  if (positional[0]) {
    const state = await readState(resolve(positional[0]));
    installed = new Set(state.modules);
  }
  for (const [name, mod] of Object.entries(m.modules)) {
    const reqs = mod.requires?.length ? ` ${c.dim}(requires: ${mod.requires.join(', ')})${c.reset}` : '';
    const cons = mod.conflicts?.length ? ` ${c.dim}(conflicts: ${mod.conflicts.join(', ')})${c.reset}` : '';
    const mark = installed?.has(name) ? `${c.green}●${c.reset} ` : `  `;
    log(`  ${mark}${c.cyan}${name.padEnd(16)}${c.reset}${mod.description}${reqs}${cons}`);
  }
  if (installed) log(`\n${c.dim}● = installed in ${resolve(positional[0])}${c.reset}`);
  log(`\n${c.dim}Init: node v2/scripts/scaffold.mjs init <dir> --api=rest --db=pg --modules=auth-jwt,observability,docker,tests${c.reset}`);
  log(`${c.dim}Add:  node v2/scripts/scaffold.mjs add <module> <dir>${c.reset}`);
}

async function cmdHelp() {
  log(`${c.bold}microservice-scaffold v2${c.reset}

${c.cyan}init${c.reset} <target> [flags]   Initialize a new project
  --api=rest,graphql       API layers to include
  --db=mongoose|pg|prisma  Database driver (only one)
  --modules=a,b,c          Extra modules (auth-jwt, observability, docker, tests)
  --force                  Overwrite existing files

${c.cyan}add${c.reset} <module> <target>   Add a single module to an existing project
${c.cyan}list${c.reset} [<target>]         Show available modules (marks installed when target given)
${c.cyan}help${c.reset}                    Show this message

${c.dim}Examples:${c.reset}
  node v2/scripts/scaffold.mjs init my-svc --api=rest --db=pg --modules=observability,docker,tests
  node v2/scripts/scaffold.mjs add graphql ./my-svc
  node v2/scripts/scaffold.mjs add auth-jwt ./my-svc
  node v2/scripts/scaffold.mjs list ./my-svc
`);
}

async function cmdInit(positional, flags) {
  const target = positional[0];
  if (!target) throw new Error(`Usage: init <target> [flags]`);
  const targetAbs = resolve(target);
  if (!flags.force && !(await isDirSafeForInit(targetAbs))) {
    throw new Error(
      `Target '${targetAbs}' is not empty. Pass --force to scaffold into an existing project.`
    );
  }
  const manifest = await loadManifest();
  const requested = modulesFromInitFlags(flags);
  const ordered = resolveModuleList(manifest, requested);
  step(`initializing ${c.bold}${targetAbs}${c.reset}`);
  step(`modules: ${ordered.join(', ')}`);
  await applyModules(targetAbs, ordered, manifest, { force: Boolean(flags.force) });
  await regenerateGenerated(targetAbs, ordered);
  await writeState(targetAbs, { modules: ordered }, manifest);
  printPostInstall(ordered, manifest);
}

async function cmdAdd(positional, flags) {
  const [moduleName, target] = positional;
  if (!moduleName || !target) throw new Error(`Usage: add <module> <target> [--force]`);
  const manifest = await loadManifest();
  if (!manifest.modules[moduleName]) {
    throw new Error(`Unknown module: ${moduleName}. Run 'list' to see available modules.`);
  }
  const targetAbs = resolve(target);
  if (!existsSync(targetAbs)) {
    throw new Error(`Target does not exist: ${target}. Use 'init' for a new project.`);
  }

  const state = await readState(targetAbs);
  const installed = new Set(state.modules);

  if (installed.has(moduleName) && !flags.force) {
    warn(`'${moduleName}' is already installed (per .scaffold-state.json). Pass --force to reinstall.`);
    return;
  }

  // Detect conflict via state (preferred) and via file presence (legacy projects without state).
  for (const conflict of manifest.modules[moduleName].conflicts ?? []) {
    if (installed.has(conflict)) {
      throw new Error(
        `Cannot add '${moduleName}': '${conflict}' is already installed. ` +
        `Remove it first, or pass --force.`
      );
    }
    const conflictFiles = manifest.modules[conflict]?.files ?? [];
    const hit = conflictFiles.find((f) => existsSync(join(targetAbs, f.dest)));
    if (hit && !flags.force) {
      throw new Error(
        `Cannot add '${moduleName}': '${conflict}' files exist (found ${hit.dest}). Remove them or pass --force.`
      );
    }
  }

  // For `add`, do NOT auto-pull `core` (target should already have it).
  const requested = [moduleName];
  step(`adding ${c.bold}${moduleName}${c.reset} to ${targetAbs}`);
  await applyModules(targetAbs, requested, manifest, { force: Boolean(flags.force) });

  installed.add(moduleName);
  const allInstalled = [...installed];
  await regenerateGenerated(targetAbs, allInstalled);
  await writeState(targetAbs, { modules: allInstalled }, manifest);
  printPostInstall(requested, manifest);
}

// ----- entry ----------------------------------------------------------------
async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseArgs(rest);
  try {
    switch (cmd) {
      case 'init': return await cmdInit(positional, flags);
      case 'add': return await cmdAdd(positional, flags);
      case 'list': return await cmdList(positional);
      case 'help': case '--help': case '-h': case undefined: return await cmdHelp();
      default:
        err(`Unknown command: ${cmd}`);
        await cmdHelp();
        process.exit(1);
    }
  } catch (e) {
    err(e.message);
    process.exit(1);
  }
}

main();
