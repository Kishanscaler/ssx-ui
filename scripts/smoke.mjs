/**
 * `npm run smoke` — build the package, install it into a real Next.js App
 * Router app from the packed tarball (exactly what a consumer gets from the
 * registry), run `next build`, then check the output.
 *
 *   SMOKE_SKIP_BUILD=1   reuse the current dist/ instead of rebuilding
 *
 * See examples/next-smoke/README.md.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { buildPackAndInstall, exportedComponents, pkgRoot, run } from './lib/pack.mjs';

const app = resolve(pkgRoot, 'examples/next-smoke');

// 1-2. Build, pack, install.
buildPackAndInstall(app, { clean: ['.next'] });

// 3. Build.
run('npx next build', app, { NEXT_TELEMETRY_DISABLED: '1' });

// 4. Check the output.
const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${message}`);
  if (!ok) failures.push(message);
};

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

console.log('\nchecks:');
const css = [...walk(join(app, '.next/static'))]
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

check(css.length > 0, 'compiled CSS emitted');
check(/\.h-control-md\b/.test(css), 'component utilities generated with no consumer @source (h-control-md)');
check(/\.size-icon-sm\b/.test(css), 'component utilities generated (size-icon-sm)');
check(/\[data-slot=["']?button["']?\]\[data-shine\]/.test(css), 'components.css shipped (Button shine rule)');
check(/@layer components/.test(css), 'components.css is inside @layer components');
check(!/@media[^{]*var\(--breakpoint/.test(css), 'no var() inside a media query');
check(/@media[^{]*(1056px|66rem)/.test(css), 'md: breakpoint compiled to a literal 1056px');
check(/data-theme=["']?dark/.test(css) && /\.dark\\:font-bold/.test(css), 'dark: variant bound to data-theme');
check(!/--color-blue-500|\.bg-blue-500/.test(css), "Tailwind's default palette is not in the theme");

const components = await exportedComponents();
console.log(`exported components (from dist/index.d.ts): ${components.join(', ')}`);

/** The markup of one `data-sample` block: from its marker to the next one. */
function sampleBlock(html, name) {
  const start = html.indexOf(`data-sample="${name}"`);
  if (start === -1) return null;
  const next = html.indexOf('data-sample="', start + 1);
  return html.slice(start, next === -1 ? undefined : next);
}

const serverApp = join(app, '.next/server/app');
for (const brand of ['sst', 'ssb']) {
  for (const theme of ['light', 'dark']) {
    const file = join(serverApp, brand, `${theme}.html`);
    if (!existsSync(file)) {
      check(false, `prerendered /${brand}/${theme}`);
      continue;
    }
    const html = readFileSync(file, 'utf8');
    check(
      html.includes(`data-brand="${brand}"`) &&
        html.includes(`data-theme="${theme}"`) &&
        html.includes('data-slot="button"') &&
        html.includes('data-slot="input"') &&
        html.includes('data-slot="spinner"'),
      `/${brand}/${theme} prerendered with data-brand/data-theme and all three atoms`,
    );
    const missing = components.filter((name) => {
      const block = sampleBlock(html, name);
      if (block === null) return true;
      return !/data-covered-by=/.test(block.slice(0, 200)) && !/data-slot=/.test(block);
    });
    check(
      missing.length === 0,
      `/${brand}/${theme} prerendered every exported component (${components.length}) with a [data-slot] element${missing.length ? `: missing ${missing.join(', ')}` : ''}`,
    );
  }
}

if (failures.length) {
  console.error(`\nsmoke: ${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nsmoke: next build OK, all checks passed');
