/**
 * Build (unless SMOKE_SKIP_BUILD=1) and `npm pack` the package into
 * `<fixture>/.pack/scaler-ssx-ui.tgz` — exactly what a consumer gets from the
 * registry — then reinstall the fixture from it. Shared by smoke.mjs (Next)
 * and smoke-legacy.mjs (webpack 4 + React 16).
 */
import { execSync } from 'node:child_process';
import { mkdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const pkgRoot = resolve(here, '..', '..');

export function run(cmd, cwd, env = {}) {
  console.log(`\n$ ${cmd}   (in ${cwd.replace(pkgRoot, 'react')})`);
  execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });
}

export function buildPackAndInstall(app, { clean = [] } = {}) {
  if (!process.env.SMOKE_SKIP_BUILD) run('npm run build', pkgRoot);
  const packDir = join(app, '.pack');
  rmSync(packDir, { recursive: true, force: true });
  mkdirSync(packDir, { recursive: true });
  const packed = execSync(`npm pack --silent --pack-destination "${packDir}"`, { cwd: pkgRoot })
    .toString()
    .trim()
    .split('\n')
    .pop();
  renameSync(join(packDir, packed), join(packDir, 'scaler-ssx-ui.tgz'));
  console.log(`\npacked ${packed} -> ${app.replace(pkgRoot, 'react')}/.pack/scaler-ssx-ui.tgz`);

  // The old copy is removed first so npm cannot keep a stale one with the
  // same version number.
  rmSync(join(app, 'node_modules/@scaler'), { recursive: true, force: true });
  for (const path of clean) rmSync(join(app, path), { recursive: true, force: true });
  run('npm install --no-audit --no-fund --no-package-lock', app);
}

/** The package's exported component names (PascalCase), read from the built ESM barrel. */
export async function exportedComponents() {
  const names = [];
  const { readFileSync } = await import('node:fs');
  const barrel = readFileSync(join(pkgRoot, 'dist/index.d.ts'), 'utf8');
  for (const m of barrel.matchAll(/export\s*\{([^}]*)\}\s*from/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop();
      if (name && /^[A-Z]/.test(name) && !/^type\s/.test(part.trim())) names.push(name);
    }
  }
  return [...new Set(names)].sort();
}
