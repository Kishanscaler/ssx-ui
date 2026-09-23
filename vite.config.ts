import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * This config exists for Storybook (which uses the Vite builder) and for the
 * React 19 test run. The PACKAGE is built by `vite.lib.config.ts`; the React 16
 * test run is `vitest.react16.config.ts` (which extends this one).
 *
 * JSX is the CLASSIC runtime everywhere (`React.createElement`, matching
 * tsconfig's `"jsx": "react"`), because that is what ships: the automatic
 * runtime imports `react/jsx-runtime`, which React 16.12 does not have.
 *
 * Under Vitest the transform is esbuild's, not plugin-react's. In development
 * plugin-react adds Babel's jsx-self / jsx-source plugins to classic JSX, and
 * React 19 answers the `__self` prop they add with a one-time "outdated JSX
 * transform" console warning — which the test setup (rightly) treats as a
 * failure. esbuild's classic transform is exactly what the package build uses
 * (a production build skips those plugins), so the tests run what ships.
 * Storybook keeps plugin-react for Fast Refresh; its dev server may print that
 * warning once. `build-storybook` is a production build and does not.
 */
const isTest = Boolean(process.env.VITEST);

export default defineConfig({
  plugins: [isTest ? null : react({ jsxRuntime: 'classic' }), tailwindcss()],
  esbuild: isTest
    ? { jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' }
    : undefined,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: true,
  },
});
