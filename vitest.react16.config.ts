import { defineConfig, mergeConfig } from 'vitest/config';

import base from './vite.config';

/** A file URL as a path. (Not `node:url`: this package has no @types/node, on purpose — see src/types/env.d.ts.) */
const filePath = (url: URL) => decodeURIComponent(url.pathname);

/**
 * The same test suite, on React 16.12 + React Testing Library 12 — the React
 * the Rails monolith runs. `npm test` runs both this and the React 19 suite.
 *
 * Why not npm aliases (`react16: npm:react@16.12.0`)? react-dom@16 would then
 * `require('react')` from the package root and get React 19. React 16 lives in
 * its own install instead (`test-env/react16`, a `file:` devDependency, so
 * `npm install` sets it up), where react-dom and RTL resolve their own React.
 *
 * Every module the tests load that imports React must resolve to that copy:
 *   - our source, via the aliases below;
 *   - Radix, input-otp and their React-importing dependencies: INLINED, so
 *     Vite resolves their imports (and applies the aliases) rather than Node;
 *   - `react/jsx-runtime`, which Radix imports and React 16.12 does not have:
 *     the same shim the legacy build bundles (src/lib/react-jsx-runtime.ts).
 */
const env = (p: string) => filePath(new URL(`./test-env/react16/node_modules/${p}`, import.meta.url));
const shim = filePath(new URL('./src/lib/react-jsx-runtime.ts', import.meta.url));

export default mergeConfig(
  base,
  defineConfig({
    resolve: {
      // Prefer ESM entry points. react-remove-scroll's CJS `main` does a Node
      // `require('react')` that escapes the aliases below and loads React 19,
      // which broke every OPEN Select under React 16. The legacy bundle uses
      // browser mainFields already; this makes the tests match it.
      mainFields: ['browser', 'module', 'jsnext:main', 'jsnext'],
      alias: [
        { find: /^react\/jsx(-dev)?-runtime$/, replacement: shim },
        { find: /^react$/, replacement: env('react/index.js') },
        { find: /^react-dom$/, replacement: env('react-dom/index.js') },
        { find: /^react-dom\/(.*)$/, replacement: env('react-dom/$1') },
        { find: /^@testing-library\/react$/, replacement: env('@testing-library/react/dist/index.js') },
      ],
    },
    test: {
      name: 'react16',
      env: { SSX_EXPECT_REACT: '16.12.0' },
      server: {
        deps: {
          inline: [
            /@radix-ui\//,
            /input-otp/,
            /@floating-ui\//,
            /react-remove-scroll/,
            /react-style-singleton/,
            /use-sidecar/,
            /use-callback-ref/,
            /aria-hidden/,
          ],
        },
      },
    },
  }),
);
