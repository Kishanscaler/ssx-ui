/**
 * `npm run smoke:legacy` — the Rails monolith, reduced to a fixture.
 *
 * Builds and packs the package, installs the tarball into
 * examples/webpack4-react16 (webpack 4.41.2, babel-loader excluding
 * node_modules, css-loader 3 + postcss-loader 3 + postcss-preset-env 6,
 * React + ReactDOM 16.12.0), bundles it with webpack 4 RUNNING ON NODE 14,
 * then loads the bundle in headless Chromium and asserts:
 *
 *   - no console error or warning (React's dev build reports every contract
 *     violation there) and no uncaught exception;
 *   - React is 16.12.0 and the package resolved to dist/legacy (the `module`
 *     field), with no Radix or other dependency pulled from node_modules;
 *   - EVERY PascalCase export rendered (read from the built barrel, so a new
 *     atom is covered with no edit here) and produced a [data-slot] element;
 *   - a Button click reaches its onClick;
 *   - the standalone CSS applied: the primary Button's fill is the brand's
 *     `--action-primary-bg`, and differs between SST and SSB.
 *
 * Both brands and both themes in the development bundle; SST light and SSB
 * dark in the production (minified by webpack 4's terser) bundle.
 *
 *   SMOKE_SKIP_BUILD=1       reuse the current dist/
 *   SSX_LEGACY_NODE=/path    the Node binary that runs webpack (default: the
 *                            newest Node 14 for this platform, fetched once
 *                            from npm into the fixture's .legacy-node/)
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { arch, platform } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { launchBrowser } from './lib/browser.mjs';
import { buildPackAndInstall, exportedComponents, pkgRoot } from './lib/pack.mjs';

const app = resolve(pkgRoot, 'examples/webpack4-react16');
const shots = join(app, '.shots');

// 1-2. Build, pack, install.
buildPackAndInstall(app, { clean: ['public/build'] });

// 3. Find Node 14.
function legacyNode() {
  if (process.env.SSX_LEGACY_NODE) return process.env.SSX_LEGACY_NODE;
  const pkg = `node-${platform() === 'win32' ? 'win' : platform()}-${arch()}`;
  const prefix = join(app, '.legacy-node');
  const bin = join(prefix, 'node_modules', pkg, 'bin', platform() === 'win32' ? 'node.exe' : 'node');
  if (!existsSync(bin)) {
    console.log(`\nfetching Node 14 (${pkg}@14) into examples/webpack4-react16/.legacy-node`);
    mkdirSync(prefix, { recursive: true });
    try {
      execSync(`npm install --no-save --no-audit --no-fund --no-package-lock --prefix "${prefix}" ${pkg}@14`, {
        stdio: 'inherit',
      });
    } catch {
      return null;
    }
  }
  return existsSync(bin) ? bin : null;
}

const node = legacyNode();
const nodeVersion = node ? execFileSync(node, ['-v']).toString().trim() : null;
if (!node) console.warn('\nWARNING: no Node 14 available; running webpack 4 on the current Node.');
const nodeBin = node ?? process.execPath;
console.log(`\nwebpack 4 runs on Node ${nodeVersion ?? process.version}`);

// 4. Bundle, both modes.
for (const mode of ['development', 'production']) {
  console.log(`\n$ node ${nodeVersion ?? process.version} webpack --config webpack.config.js  (SSX_MODE=${mode})`);
  execFileSync(nodeBin, ['node_modules/webpack/bin/webpack.js', '--config', 'webpack.config.js'], {
    cwd: app,
    stdio: 'inherit',
    env: {
      ...process.env,
      SSX_MODE: mode,
      NODE_ENV: mode,
      // Node 17+ needs this for webpack 4's md4 hashing; harmless on 14.
      ...(node ? {} : { NODE_OPTIONS: '--openssl-legacy-provider' }),
    },
  });
}

// 5. Check.
const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${message}`);
  if (!ok) failures.push(message);
};

console.log('\nchecks:');
check(Boolean(node) && /^v14\./.test(nodeVersion ?? ''), `webpack 4 ran on Node 14 (${nodeVersion ?? 'unavailable'})`);

const devBundle = readFileSync(join(app, 'public/build/development/app.js'), 'utf8');
check(
  /node_modules\/@kishanscaler\/ssx-ui\/dist\/legacy\/index\.js/.test(devBundle),
  'webpack 4 resolved @kishanscaler/ssx-ui to dist/legacy/index.js (the `module` field)',
);
check(
  !/node_modules\/@kishanscaler\/ssx-ui\/dist\/(?!legacy\/)[^\s*]*\.c?js/.test(devBundle),
  'no module from the modern dist/ build was bundled',
);
check(
  !/\.\/node_modules\/(@radix-ui|class-variance-authority|clsx|tailwind-merge|input-otp)\//.test(devBundle),
  'no dependency pulled from node_modules (all vendored in dist/legacy/vendor)',
);
check(!/react\/jsx-runtime/.test(devBundle), 'no react/jsx-runtime in the bundle');

const css = readFileSync(join(app, 'public/build/development/app.css'), 'utf8');
check(css.length > 10000, `standalone CSS went through css-loader 3 + postcss 7 (${css.length} bytes)`);
check(/\[data-slot=["']?button["']?\]/.test(css) && /--action-primary-bg/.test(css), 'CSS kept component rules and tokens');

const components = await exportedComponents();
console.log(`\nexported components (from dist/index.d.ts): ${components.join(', ')}`);

const browser = await launchBrowser();
mkdirSync(shots, { recursive: true });
const primaryByBrand = {};

const loads = [
  ['development', 'sst', 'light'],
  ['development', 'sst', 'dark'],
  ['development', 'ssb', 'light'],
  ['development', 'ssb', 'dark'],
  ['production', 'sst', 'light'],
  ['production', 'ssb', 'dark'],
];

for (const [mode, brand, theme] of loads) {
  const label = `${mode} ${brand}/${theme}`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const logs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') logs.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (error) => logs.push(`pageerror: ${error.message}`));

  const url = `${pathToFileURL(join(app, 'public', `${mode}.html`)).href}?brand=${brand}&theme=${theme}`;
  await page.goto(url);
  await page.waitForFunction(() => window.__SSX_SMOKE__ && window.__SSX_SMOKE__.rendered, null, { timeout: 10000 }).catch(() => {});
  const result = await page.evaluate(() => window.__SSX_SMOKE__ || null);

  if (!result) {
    check(false, `${label}: the bundle ran and rendered (${logs.join(' | ') || 'no output'})`);
    await page.close();
    continue;
  }

  check(result.react === '16.12.0', `${label}: React ${result.react}`);
  check(
    JSON.stringify(result.components) === JSON.stringify(components),
    `${label}: the bundle sees every exported component (${result.components.length})`,
  );
  check(result.unknownSamples.length === 0, `${label}: no sample for a name the package does not export ${result.unknownSamples.join(', ')}`);
  check(Object.keys(result.renderErrors).length === 0, `${label}: every component rendered ${Object.entries(result.renderErrors).map(([n, e]) => `\n    ${n}: ${e.split('\n')[0]}`).join('')}`);

  const missing = await page.evaluate((names) => {
    const samples = window.__SSX_SMOKE__.samples;
    return names.filter((name) => {
      if (String(samples[name]).startsWith('covered-by:')) return false;
      const section = document.querySelector(`[data-sample="${name}"]`);
      return !section || !section.querySelector('[data-slot]');
    });
  }, components);
  check(missing.length === 0, `${label}: each component produced a [data-slot] element ${missing.join(', ')}`);

  const before = await page.textContent('[data-testid="click-count"]');
  await page.click('[data-testid="click-target"]');
  const after = await page.textContent('[data-testid="click-count"]');
  check(before === '0' && after === '1', `${label}: Button click reached onClick (${before} -> ${after})`);

  const colours = await page.evaluate(() => {
    const button = document.querySelector('[data-testid="click-target"]');
    const probe = document.querySelector('[data-probe="action-primary"]');
    return {
      button: getComputedStyle(button).backgroundColor,
      probe: getComputedStyle(probe).backgroundColor,
      html: document.documentElement.getAttribute('data-brand'),
    };
  });
  // The pointer is still over the button after the click; move it off so the
  // fill is the resting one.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(250);
  const resting = await page.evaluate(
    () => getComputedStyle(document.querySelector('[data-testid="click-target"]')).backgroundColor,
  );
  check(
    colours.html === brand && resting === colours.probe && !/rgba\(0, 0, 0, 0\)|transparent/.test(resting),
    `${label}: primary Button is filled with --action-primary-bg (${resting})`,
  );
  if (theme === 'light') primaryByBrand[`${mode}-${brand}`] = resting;

  check(logs.length === 0, `${label}: no console errors or warnings${logs.length ? `\n    ${logs.join('\n    ')}` : ''}`);
  await page.screenshot({ path: join(shots, `${mode}-${brand}-${theme}.png`), fullPage: true });
  await page.close();
}
await browser.close();

check(
  primaryByBrand['development-sst'] && primaryByBrand['development-sst'] !== primaryByBrand['development-ssb'],
  `data-brand switches the brand (SST ${primaryByBrand['development-sst']} vs SSB ${primaryByBrand['development-ssb']})`,
);
console.log(`\nscreenshots: examples/webpack4-react16/.shots/`);

if (failures.length) {
  console.error(`\nsmoke:legacy: ${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nsmoke:legacy: webpack 4 + React 16.12 OK, all checks passed');
