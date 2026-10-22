# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`@kishanscaler/ssx-ui`: the React package of the Scaler Design System. It is one system with two sub-brands and two modes, set independently on `<html data-brand="sst|ssb" data-theme="light|dark">`. README.md is the long-form reference for the API, the decisions behind it and their dates. Read it before you change a convention.

## Repo layout and the parent repo

The git root is this `react/` directory, but it lives inside a larger design-system checkout (`..`):

- `../scripts/build.py` (Python) is the **source of truth for tokens**. It reads `../tokens/*.json` (DTCG, authored in px) and writes `../dist/tokens.css` (emitted in rem).
- `npm run sync:tokens` copies that output into `src/styles/tokens.generated.css`. It also regenerates `src/lib/scale.generated.ts`, `src/motion/tokens.generated.ts` and `src/foundations/_generated/*`. These files are committed. **Never hand-edit them.** To change a colour, size or motion value, change `../tokens/` and run the root build. If `..` is missing, the committed copies are used.
- README references such as `docs/05-react-architecture.md` (the component template is in section 6, the `"use client"` rules in section 5) point to `../docs/`, not to `./docs/`.

## Commands

```bash
npm run storybook            # :6006; syncs tokens + logos first
npm test                     # React 19 run, then React 16.12 run (pretest syncs tokens/logos)
npm run typecheck
npm run build                # JS (modern + legacy) + .d.ts + styles + standalone CSS + gates
npm run check:package        # publint --strict + attw
npm run smoke                # pack -> examples/next-smoke, next build, check
npm run smoke:legacy         # pack -> examples/webpack4-react16, webpack 4 on Node 14, headless check
npm run check:reflow         # every story at 320px/375px; needs a served storybook-static on :6201
```

To run a single test file, or tests filtered by name:

```bash
npx vitest run src/components/Button/Button.test.tsx                               # React 19
npx vitest run -c vitest.react16.config.ts src/components/Button/Button.test.tsx    # React 16.12
npx vitest run src/components/Button -t "loading"
```

These commands skip `pretest`. Run `npm run sync:tokens` first if the tokens changed.

## Architecture

**The shadcn shape, React 16.12+ compatible.** Each component is a `cva` recipe plus a `React.forwardRef` component with a `displayName`, `import * as React`, and the **classic JSX runtime**, because React 16.12 has no `react/jsx-runtime`. Polymorphism uses Radix `Slot` (`asChild`). Every element gets a `data-slot` styling hook. `cn()` (`src/lib/cn.ts`) is tailwind-merge configured for the custom scales and `type-*` roles. Its `cn.test.ts` guards against drift. Use the React-16-safe helpers in `src/lib/` (`use-id`, `compose-refs`, `use-composed-refs`) instead of the React 18+ APIs. Use scoped `@radix-ui/react-*` packages, never the `radix-ui` monopackage.

**Styling is utilities only.** There is no per-component stylesheet. `src/styles/theme.css` binds the semantic tokens to Tailwind v4 through `@theme inline`. It also **removes Tailwind's default scales** (colours, spacing, containers, blur, type, radius, easing and so on), so an off-scale class such as `p-7`, `max-w-md` or `bg-blue-500` silently compiles to nothing. `src/styles/foundations-only.test.ts` fails when a component contains any literal length, colour, opacity, z-index, ratio or duration. A new value needs a token: a foundation step, or a tier-3 `component.<name>.<prop>` token in `../tokens/component.*.json`. Radix numeric offsets read from `space` in `src/lib/scale.generated.ts` (for example `sideOffset={space['2']}`). The only exception is `src/styles/components.css` (and `src/styles/batches/*.css`, inside `@layer components`). It holds only what Tailwind cannot express: pseudo-element content, `@keyframes`, and SVG `stroke-dashoffset` against `pathLength`. Never use raw hex.

**Cross-component context goes through attributes, never through outside styling.** A region over a strong fill declares `data-surface-ink="on-image"`, and each component reads it in its own recipe (`in-data-[surface-ink=…]:`). Elevation works the same way through `data-elevation`. No component sets another component's tokens or classes.

**Server and client split.** `src/index.ts` is a re-export-only barrel with no directive. A module that uses a hook, attaches an event handler, or imports a client Radix package or `input-otp` must have `'use client'` as line 1. It must also be listed in `scripts/client-manifest/batch-*.mjs`. `scripts/check-directives.mjs` (part of `npm run build`) fails when either one is missing or when they differ.

**Two builds.** `vite.lib.config.ts` runs twice. Both runs use `preserveModules`, ES2019, and ESM + CJS output.
- `dist/` is what `exports` points to. Dependencies are external. It is for Next.js, Vite, webpack 5 and Node.
- `dist/legacy/` is what `main`/`module` point to. Dependencies are bundled into `vendor/`, and `react/jsx-runtime` is aliased to `src/lib/react-jsx-runtime.ts`. It is for webpack 4 and React 16.12 (the Rails monolith).

`scripts/check-legacy.mjs` fails on any syntax newer than ES2019, any `react/jsx-runtime` import, or any `.mjs` output. A second entry, `src/motion/index.ts` (`@kishanscaler/ssx-ui/motion`), is the only code that imports the optional `gsap` peer. Its literals are gated by `src/motion/motion.test.tsx`. `MotionScope` must never import GSAP statically: it `import()`s `motion/markup` only when a `data-ssx-*` target exists. That lazy `import()` is the one form newer than ES2019 that `check-legacy` allows. See `docs/motion.md`.

**Tests on two Reacts.** `vite.config.ts` serves Storybook and the React 19 test run. `vitest.react16.config.ts` aliases React to `test-env/react16/` (a separate install, set up by `npm install`). **Any `console.error` or `console.warn` during a test fails it** (`src/test/setup.ts`). Write contract and ARIA tests, not snapshots.

**Batch-partitioned files (parallel agents).** Several shared registries are split into per-batch sections or files so that concurrent agents never edit the same lines. Edit only your batch's part:
- exports: a batch section in `src/index.ts`, or `src/batches/<batch>.ts`
- client manifest: `scripts/client-manifest/batch-<batch>.mjs`
- smoke samples: `examples/next-smoke/app/samples/batch-<batch>.tsx` and `examples/webpack4-react16/src/samples/batch-<batch>.js`. These are needed only for an export that cannot render without props. Every PascalCase export is rendered automatically.
- `src/styles/batches/<batch>.css`

## Conventions

- Each component has one PascalCase folder: `X.tsx`, `X.stories.tsx` (CSF3, `tags: ['autodocs']`, props documented by TSDoc on the props interface), `X.test.tsx`, an `index.ts` barrel, and `_fixtures/` for story-only files. A component exists for consumers only once `src/index.ts` exports it. Use named exports only.
- Icons are passed as children, not as `leadingIcon`/`trailingIcon` props. A square control is a `size` (`icon-md`), not a boolean. Layout such as full width goes through `className`, not props.
- Set text with a `type-*` role utility (`type-h2`, `type-body-sm` and so on), not with raw size and leading. 12px is the floor. Page-edge padding is `px-gutter`.
- Review every visual change in **both brands and both themes**. Storybook's toolbar has Brand and Theme controls, or use the URL `?globals=brand:ssb;theme:dark`. A defect that appears only in dark mode has shipped before.
