/**
 * Copies the generated token stylesheet out of the Python build into the React
 * package, so `src/styles/` has a real file to import without the package
 * reaching outside its own root (which breaks once it is published).
 *
 * The copy is GENERATED. It is never hand-edited, and it is never the source of
 * truth — `scripts/build.py` in the repo root is. Run `npm run build` at the
 * repo root first if the tokens have changed.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

const sources = [
  {
    from: resolve(repoRoot, 'dist/tokens.css'),
    to: resolve(here, '..', 'src/styles/tokens.generated.css'),
    required: true,
  },
];

let copied = 0;
for (const { from, to, required } of sources) {
  if (!existsSync(from)) {
    const message = `sync-tokens: missing ${from}. Run \`npm run build\` at the repo root first.`;
    // Standalone checkout (this package without the design-system repo around it):
    // the committed copy is the tokens. Keep it rather than failing.
    if (existsSync(to)) {
      console.warn(`sync-tokens: ${from} not found; using the committed ${to}.`);
      continue;
    }
    if (required) {
      console.error(message);
      process.exit(1);
    }
    console.warn(message);
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  copied += 1;
  console.log(`sync-tokens: ${from} -> ${to}`);
}

console.log(`sync-tokens: ${copied} file(s) synced.`);
