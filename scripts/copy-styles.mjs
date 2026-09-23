/**
 * Copies the shippable stylesheets into dist/styles.
 *
 * `standalone.css` is excluded on purpose: it is a BUILD INPUT (it pulls in
 * Tailwind itself and compiles to `dist/ssx.standalone.css`). Shipping the
 * input alongside the output is how a consumer ends up importing the one that
 * needs a Tailwind build and getting a stylesheet full of at-rules.
 */
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '..', 'src/styles');
const out = resolve(here, '..', 'dist/styles');

const EXCLUDE = new Set(['standalone.css']);

mkdirSync(out, { recursive: true });

// Recursive: per-batch stylesheets live in styles/batches/ and ssx.css
// @imports them by relative path, so the tree must be copied as-is.
const files = readdirSync(src, { recursive: true }).filter(
  (name) => name.endsWith('.css') && !EXCLUDE.has(name) && !name.endsWith('.test.css'),
);

for (const name of files) {
  mkdirSync(dirname(join(out, name)), { recursive: true });
  copyFileSync(join(src, name), join(out, name));
}

console.log(`copy-styles: ${files.length} stylesheet(s) -> dist/styles`);
