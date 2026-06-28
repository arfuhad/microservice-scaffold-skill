#!/usr/bin/env node
// microservice-scaffold v2 — scaffolding CLI.
// Zero dependencies. Run with: node v2/scripts/scaffold.mjs <command> [args]
//
// Commands:
//   init <target> [--api=rest,graphql] [--db=mongoose|pg|prisma] [--modules=a,b,c] [--force]
//   add  <module> <target> [--force]
//   list
//   help

import { readFile, writeFile, mkdir, access, copyFile } from 'node:fs/promises';
import { existsSync, constants } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(__dirname, '..');

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
      warn(`skip (exists): ${destAbs.replace(process.cwd() + '/', '')}`);
      return false;
    }
  }
  await mkdir(dirname(destAbs), { recursive: true });
  await copyFile(src, destAbs);
  ok(`wrote ${destAbs.replace(process.cwd() + '/', '')}`);
  return true;
}

// ----- package.json merging -------------------------------------------------
function pickHigher(a, b) {
  // crude semver-ish compare; falls back to string compare. "Higher" wins.
  const norm = (s) => String(s).replace(/^[\^~>=<]+/, '').split(/[.-]/).map((x) => Number(x) || 0);
  const A = norm(a), B = norm(b);
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const av = A[i] ?? 0, bv = B[i] ?? 0;
    if (av !== bv) return av > bv ? a : b;
  }
  return a;
}

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

  // Set the project name from the target dir if not yet set
  if (!pkg.name || pkg.name === 'service') pkg.name = basename(resolve(targetDir));

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  ok(`merged package.json (${Object.keys(pkg.dependencies).length} deps, ${Object.keys(pkg.devDependencies).length} devDeps)`);
}

// ----- commands -------------------------------------------------------------
async function cmdList() {
  const m = await loadManifest();
  log(`${c.bold}microservice-scaffold v${m.version} — modules${c.reset}\n`);
  for (const [name, mod] of Object.entries(m.modules)) {
    const reqs = mod.requires?.length ? ` ${c.dim}(requires: ${mod.requires.join(', ')})${c.reset}` : '';
    const cons = mod.conflicts?.length ? ` ${c.dim}(conflicts: ${mod.conflicts.join(', ')})${c.reset}` : '';
    log(`  ${c.cyan}${name.padEnd(16)}${c.reset}${mod.description}${reqs}${cons}`);
  }
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
${c.cyan}list${c.reset}                    Show available modules
${c.cyan}help${c.reset}                    Show this message

${c.dim}Examples:${c.reset}
  node v2/scripts/scaffold.mjs init my-svc --api=rest --db=pg --modules=observability,docker,tests
  node v2/scripts/scaffold.mjs add graphql ./my-svc
  node v2/scripts/scaffold.mjs add auth-jwt ./my-svc
  node v2/scripts/scaffold.mjs list
`);
}

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
  log(`\n${c.bold}Wire-up:${c.reset} for each module installed, see references/<module>.md for the 2–5 lines to add to src/index.ts.`);
  for (const name of modulesToApply) {
    const wireUp = manifest.modules[name].wireUp;
    if (wireUp) log(`  ${c.cyan}${name}${c.reset}: ${wireUp}`);
  }
}

async function cmdInit(positional, flags) {
  const target = positional[0];
  if (!target) throw new Error(`Usage: init <target> [flags]`);
  const manifest = await loadManifest();
  const requested = modulesFromInitFlags(flags);
  const ordered = resolveModuleList(manifest, requested);
  step(`initializing ${c.bold}${resolve(target)}${c.reset}`);
  step(`modules: ${ordered.join(', ')}`);
  await applyModules(resolve(target), ordered, manifest, { force: Boolean(flags.force) });
  printPostInstall(ordered, manifest);
}

async function cmdAdd(positional, flags) {
  const [moduleName, target] = positional;
  if (!moduleName || !target) throw new Error(`Usage: add <module> <target> [--force]`);
  const manifest = await loadManifest();
  if (!manifest.modules[moduleName]) {
    throw new Error(`Unknown module: ${moduleName}. Run 'list' to see available modules.`);
  }
  if (!existsSync(target)) {
    throw new Error(`Target does not exist: ${target}. Use 'init' for a new project.`);
  }
  // Detect conflict: if any file from a conflicting module already exists in the target, refuse.
  for (const conflict of manifest.modules[moduleName].conflicts ?? []) {
    const conflictFiles = manifest.modules[conflict]?.files ?? [];
    const hit = conflictFiles.find((f) => existsSync(join(target, f.dest)));
    if (hit) {
      throw new Error(
        `Cannot add '${moduleName}': '${conflict}' is already installed (found ${hit.dest}). ` +
        `Remove it first, or pass --force to overwrite.`
      );
    }
  }
  // For `add`, do NOT auto-pull `core` (target should already have it).
  const requested = [moduleName];
  step(`adding ${c.bold}${moduleName}${c.reset} to ${resolve(target)}`);
  await applyModules(resolve(target), requested, manifest, { force: Boolean(flags.force) });
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
      case 'list': return await cmdList();
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
