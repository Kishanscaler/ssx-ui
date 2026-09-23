/**
 * Guards what the LEGACY consumer (webpack 4 + Babel excluding node_modules +
 * React 16.12) needs from the built output, statically, in under a second.
 * `npm run smoke:legacy` is the real proof; this is the fast gate that runs on
 * every build.
 *
 *   1. Every `.js` / `.cjs` in dist/ and dist/legacy/ (vendored code included)
 *      parses as ES2019. webpack 4's parser is acorn 6, which rejects `?.`,
 *      `??`, class fields and top-level await, and the consumer does not run
 *      Babel over node_modules.
 *   2. Nothing imports `react/jsx-runtime` or `react/jsx-dev-runtime`: React
 *      16.12 does not have them.
 *   3. No `.mjs` anywhere (webpack 4 treats it as strict ESM).
 *   4. `main`, `module` and every `exports` target exist.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'acorn';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dist = join(root, 'dist');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

const errors = [];
let parsed = 0;
const JSX_RUNTIME = /(?:from\s*|import\s*\(\s*|require\(\s*|import\s+)['"]react\/jsx-(?:dev-)?runtime['"]/;

for (const file of walk(dist)) {
  const rel = relative(root, file);
  if (file.endsWith('.mjs')) errors.push(`${rel}: .mjs is not allowed (webpack 4)`);
  if (!/\.c?js$/.test(file)) continue;
  const source = readFileSync(file, 'utf8');
  if (JSX_RUNTIME.test(source)) errors.push(`${rel}: imports react/jsx-runtime (absent in React 16.12)`);
  try {
    parse(source, {
      ecmaVersion: 2019,
      sourceType: file.endsWith('.cjs') ? 'script' : 'module',
      allowHashBang: true,
    });
    parsed += 1;
  } catch (error) {
    errors.push(`${rel}: not ES2019 — ${error.message}`);
  }
}

const targets = [pkg.main, pkg.module, pkg.types];
(function collect(node) {
  if (typeof node === 'string') targets.push(node);
  else if (node && typeof node === 'object') Object.values(node).forEach(collect);
})(pkg.exports);
for (const target of targets) {
  if (!target || target.includes('*')) continue;
  if (!existsSync(join(root, target))) errors.push(`package.json points at ${target}, which does not exist`);
}

if (errors.length) {
  console.error(`check-legacy: ${errors.length} problem(s)\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`check-legacy: ${parsed} file(s) parse as ES2019; no react/jsx-runtime; no .mjs; entry points exist`);
