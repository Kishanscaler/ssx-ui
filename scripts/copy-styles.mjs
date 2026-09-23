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

const files = readdirSync(src).filter(
  (name) => name.endsWith('.css') && !EXCLUDE.has(name),
);

for (const name of files) {
  copyFileSync(join(src, name), join(out, name));
}

console.log(`copy-styles: ${files.length} stylesheet(s) -> dist/styles`);
