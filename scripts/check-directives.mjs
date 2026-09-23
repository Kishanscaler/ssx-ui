/**
 * Guards the React Server Components contract in the BUILT output.
 *
 * Two rules, checked on every `dist/**\/*.js` and `*.cjs` — in dist/ (the
 * `exports` build) AND dist/legacy/ (the `main`/`module` build), except the
 * third-party code vendored into dist/legacy/vendor:
 *
 *   1. A module that NEEDS the client — it imports a React hook, a client-only
 *      Radix primitive, or `input-otp`, or it attaches a handler to a host
 *      element — must start with `"use client"`. Without it, importing the atom
 *      into a Server Component throws at render time.
 *   2. A module that starts with `"use client"` must be listed in the CLIENT
 *      manifest (scripts/client-manifest/*.mjs, one file per batch), and every
 *      module in it must have it. The directive is a decision
 *      (docs/05-react-architecture.md section 5), not a side effect, so an
 *      atom that quietly gains or loses it fails here.
 *
 * The barrel (`dist/index.js`) must NOT carry the directive: it only
 * re-exports, and marking it client would turn every server atom into a
 * client reference.
 *
 * When you add a client atom, add its dist path to YOUR batch's manifest file.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, '..', 'dist');
const manifestDir = join(here, 'client-manifest');

/** dist-relative paths, without extension, of modules that must start with "use client". */
const CLIENT = new Set();
const manifestFiles = readdirSync(manifestDir).filter((n) => n.endsWith('.mjs')).sort();
for (const name of manifestFiles) {
  const { default: list } = await import(pathToFileURL(join(manifestDir, name)).href);
  for (const rel of list) CLIENT.add(rel);
}

/** Builds to check, as [label, directory]. The legacy one exists after a full build. */
const BUILDS = [['dist', dist], ['dist/legacy', join(dist, 'legacy')]];

/** Packages whose entry is client-only (they ship their own "use client"). */
const CLIENT_PACKAGES = [
  /^@radix-ui\/react-(?!slot$|separator$|primitive$|compose-refs$)[a-z-]+$/,
  /^input-otp$/,
];

const HOOK = /\buse(State|Effect|LayoutEffect|InsertionEffect|Reducer|Ref|Context|Callback|Memo|Id|Transition|DeferredValue|SyncExternalStore|ImperativeHandle|Optimistic|ActionState|FormStatus)\b/;
const HOST_HANDLER = /\bon[A-Z][A-Za-z]+:\s*(?!void\b|undefined\b|null\b)/;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    // dist/legacy is walked as its own build; vendor/ is third-party code
    // (Radix carries its own directives, which are not ours to manage).
    if (full === join(dist, 'legacy') || name === 'vendor') continue;
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.c?js$/.test(name)) yield full;
  }
}

function hasDirective(source) {
  // A directive must be in the directive prologue. Comments may precede it,
  // and in CJS output Rollup also emits "use strict" there.
  const body = source.replace(/^(\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/))*\s*/, '');
  return /^(['"]use strict['"];?\s*)?['"]use client['"];?/.test(body);
}

function importedPackages(source) {
  const out = [];
  const re = /\bfrom\s*['"]([^'".][^'"]*)['"]|\bimport\s*['"]([^'".][^'"]*)['"]|\brequire\(\s*['"]([^'".][^'"]*)['"]\s*\)/g;
  for (const m of source.matchAll(re)) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

const errors = [];
let checked = 0;
const seenClient = new Set();

for (const [label, root] of BUILDS) {
  if (!existsSync(root)) {
    errors.push(`${label}: missing. Run the full \`npm run build\`.`);
    continue;
  }
  const seenWithExt = new Set();
  const exts = new Set();
  const emitted = new Set();

  for (const file of walk(root)) {
    const rel = relative(root, file).split('\\').join('/').replace(/\.c?js$/, '');
    const source = readFileSync(file, 'utf8');
    const directive = hasDirective(source);
    const ext = file.endsWith('.cjs') ? '.cjs' : '.js';
    exts.add(ext);
    emitted.add(rel);
    if (directive) seenWithExt.add(rel + ext);
    checked += 1;

    const reasons = [];
    const pkgs = importedPackages(source);
    for (const p of pkgs) if (CLIENT_PACKAGES.some((re) => re.test(p))) reasons.push(`imports ${p}`);
    const hook = source.match(HOOK);
    if (hook) reasons.push(`uses ${hook[0]}`);
    if (HOST_HANDLER.test(source)) reasons.push('attaches an event handler');

    if (rel === 'index') {
      if (directive) errors.push(`${label}/${rel}${ext}: the barrel must not be "use client"`);
      continue;
    }

    if (directive) seenClient.add(rel);
    if (reasons.length && !directive) {
      errors.push(`${label}/${rel}${ext}: needs "use client" (${reasons.join(', ')})`);
    }
    if (directive && !CLIENT.has(rel)) {
      errors.push(
        `${label}/${rel}${ext}: has "use client" but is not in the CLIENT manifest (scripts/client-manifest/)`,
      );
    }
  }

  for (const rel of CLIENT) {
    // A lib/ helper is only emitted once an atom imports it.
    if (!emitted.has(rel)) {
      if (!rel.startsWith('lib/')) errors.push(`${label}/${rel}: listed as client but not emitted`);
      continue;
    }
    for (const ext of exts) {
      if (!seenWithExt.has(rel + ext)) {
        errors.push(`${label}/${rel}${ext}: listed as client but has no "use client"`);
      }
    }
  }
  for (const ext of ['.js', '.cjs']) {
    if (!exts.has(ext)) errors.push(`${label}: no ${ext} output (both ESM and CJS are expected)`);
  }
}

if (errors.length) {
  console.error(`check-directives: ${errors.length} problem(s)\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(
  `check-directives: ${checked} module(s) OK; client: ${[...seenClient].sort().join(', ') || 'none'}`,
);
