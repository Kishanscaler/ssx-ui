/**
 * Adds `.js` / `/index.js` to relative specifiers in the emitted `.d.ts` files.
 *
 * The source uses bundler-style extensionless imports (`'./Button'`), which is
 * what Vite, Vitest and Storybook want. `tsc` copies those specifiers into the
 * declarations verbatim, and a consumer on `moduleResolution: node16/nodenext`
 * then cannot follow them (attw: "internal resolution error"). The JS side is
 * already correct — Rollup writes `.js` itself under preserveModules — so only
 * the declarations need this.
 *
 * Each specifier is resolved against what is actually on disk, so a wrong
 * guess fails the build instead of shipping a broken type graph.
 *
 * It also writes a `.d.cts` twin of every file, with `.cjs` specifiers, so
 * `require` consumers (the `require` condition, dist/index.cjs) get CJS-typed
 * declarations (attw: "masquerading as ESM" otherwise). See vite.lib.config.ts.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, '..', 'dist');

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (name.endsWith('.d.ts')) yield full;
  }
}

// from './x' | import('./x') | export * from "./x"
const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]*?)\2/g;

let files = 0;
let rewritten = 0;
const failures = [];

for (const file of walk(dist)) {
  const source = readFileSync(file, 'utf8');
  const out = source.replace(SPECIFIER, (match, lead, quote, spec) => {
    if (/\.(js|mjs|cjs|json|css)$/.test(spec)) return match;
    const base = resolve(dirname(file), spec);
    let next;
    if (existsSync(`${base}.d.ts`)) next = `${spec}.js`;
    else if (existsSync(join(base, 'index.d.ts'))) next = `${spec.replace(/\/$/, '')}/index.js`;
    else {
      failures.push(`${file}: cannot resolve '${spec}'`);
      return match;
    }
    rewritten += 1;
    return `${lead}${quote}${next}${quote}`;
  });
  files += 1;
  if (out !== source) writeFileSync(file, out);
  const cts = out.replace(SPECIFIER, (match, lead, quote, spec) =>
    spec.endsWith('.js') ? `${lead}${quote}${spec.slice(0, -3)}.cjs${quote}` : match,
  );
  writeFileSync(file.replace(/\.d\.ts$/, '.d.cts'), cts);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`fix-dts-extensions: ${rewritten} specifier(s) in ${files} declaration file(s)`);
