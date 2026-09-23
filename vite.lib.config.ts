import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import preserveDirectives from 'rollup-plugin-preserve-directives';

import pkg from './package.json' with { type: 'json' };

/** A file URL as a path. (Not `node:url`: this package has no @types/node, on purpose — see src/types/env.d.ts.) */
const filePath = (url: URL) => decodeURIComponent(url.pathname);

/**
 * The PACKAGE build (JS only). `vite.config.ts` is Storybook's and Vitest's.
 *
 * It runs twice (see `build:js` in package.json), and both passes emit ESM
 * (`.js`) AND CommonJS (`.cjs`), lowered to ES2019, one file per source module:
 *
 *   SSX_BUILD_VARIANT=modern  ->  dist/          what `exports` points at.
 *     Every dependency and peer is EXTERNAL. Next.js, Vite, webpack 5 and Node
 *     all read `exports`, and dedupe Radix against the app's own copy.
 *
 *   SSX_BUILD_VARIANT=legacy  ->  dist/legacy/   what `main` / `module` point at.
 *     Only `react` and `react-dom` are external; every other dependency (Radix,
 *     cva, clsx, tailwind-merge, input-otp) is bundled into dist/legacy/vendor
 *     and lowered to ES2019 WITH our code. The only tools that read
 *     `main`/`module` instead of `exports` are old ones — webpack 4 above all —
 *     and a webpack 4 app cannot consume Radix as published, for two reasons
 *     verified on 2026-09-23:
 *       1. Radix ships `?.` and `??` in both its ESM and CJS builds, and
 *          webpack 4's parser (acorn 6) rejects them. Apps on webpacker exclude
 *          node_modules from Babel, so nothing lowers them.
 *       2. 18 Radix packages (and input-otp) `import { jsx } from
 *          "react/jsx-runtime"`, which React only ships from 16.14. In the
 *          legacy build that import is aliased to src/lib/react-jsx-runtime.ts.
 *     Bundling deps costs the legacy consumer nothing it had (it cannot share
 *     a Radix it cannot parse) and makes the package work with no config.
 *
 * Shared by both:
 *   - `preserveModules`, so a `'use client'` line stays at the top of the file
 *     that declared it (a concatenating bundler has to drop module directives),
 *     and `rollup-plugin-preserve-directives` to re-emit it — first line, above
 *     Rollup's "use strict" in CJS.
 *   - The CLASSIC JSX runtime (`React.createElement`, needs
 *     `import * as React from 'react'` in every .tsx). The automatic runtime
 *     imports `react/jsx-runtime`, which React 16.12 does not have.
 *   - ES2019: no `?.`, `??`, class fields or top-level await in the output.
 *   - `.js` on every relative import (Rollup does it under preserveModules):
 *     webpack 5 and Turbopack resolve a `"type": "module"` package strictly.
 *   - Never `.mjs`: webpack 4 treats `.mjs` as strict ESM and breaks on CJS
 *     interop. Vendored `.mjs` sources are renamed to `.js`.
 *
 * Declarations are emitted separately by `tsc -p tsconfig.build.json`, once,
 * into dist/ (both variants share them).
 */
export const VARIANT = process.env.SSX_BUILD_VARIANT === 'legacy' ? 'legacy' : 'modern';
const LEGACY = VARIANT === 'legacy';

const peers = Object.keys(pkg.peerDependencies ?? {});
const deps = Object.keys(pkg.dependencies ?? {});

/** The packages whose automatic-runtime imports the legacy build rewrites. */
const JSX_RUNTIME = /^react\/jsx(-dev)?-runtime$/;
const shim = filePath(new URL('./src/lib/react-jsx-runtime.ts', import.meta.url));

function isExternal(id: string): boolean {
  if (LEGACY) {
    if (JSX_RUNTIME.test(id)) return false;
    return peers.some((dep) => id === dep || id.startsWith(`${dep}/`));
  }
  // `react/jsx-runtime` would be caught by the prefix too, but our own code is
  // classic-runtime and never imports it.
  return [...peers, ...deps].some((dep) => id === dep || id.startsWith(`${dep}/`));
}

/** `node_modules/@radix-ui/react-slot/dist/index.mjs` -> `vendor/@radix-ui/react-slot/dist/index`. */
function outputName(name: string): string {
  return name.replace(/^(?:.*\/)?node_modules\//, 'vendor/').replace(/\.(m|c)?js$/, '');
}

export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' }), preserveDirectives()],
  resolve: LEGACY ? { alias: [{ find: JSX_RUNTIME, replacement: shim }] } : undefined,
  // Lib mode leaves `process.env.NODE_ENV` alone, so the consumer's bundler
  // decides dev vs prod (only `import.meta.env` is replaced here).
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      // Called per module under preserveModules: `components/Button/Button`.
      fileName: (format, name) => `${outputName(name)}.${format === 'cjs' ? 'cjs' : 'js'}`,
    },
    outDir: LEGACY ? 'dist/legacy' : 'dist',
    // The modern pass runs first and clears dist/; the legacy pass clears only
    // its own directory.
    emptyOutDir: true,
    sourcemap: true,
    // The consumer's bundler minifies. A readable dist is how a consumer
    // debugs us without a source-map round trip.
    minify: false,
    target: 'es2019',
    copyPublicDir: false,
    rollupOptions: {
      external: isExternal,
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        // CJS only: `exports.Button = ...` rather than a default-export wrapper.
        exports: 'named',
        // Keep CJS interop helpers per file rather than in a shared _virtual
        // chunk named after a path we do not control.
        interop: 'auto',
      },
      onwarn(warning, warn) {
        // Rollup warns that it ignores module-level directives before the
        // plugin re-adds them. The plugin handles it; the warning is noise.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
    },
  },
});
