'use client';

// Client: this module is a hook.
import * as React from 'react';

/* ---------------------------------------------------------------------------
 * useId — a stable, unique id for wiring `aria-*` / `htmlFor` between the
 * parts of one component, on every React the package supports (16.12+).
 *
 *   React 18+  `React.useId()`. Deterministic, so server and client agree and
 *              hydration is clean.
 *   React <18  a module counter captured once in `useState`. Stable for the
 *              life of the component, unique within the page. It is NOT
 *              deterministic across server and client, which is acceptable
 *              because the only React <18 consumer (the Rails monolith) renders
 *              on the client only (`ReactDOM.render`, no SSR).
 *
 * `React.useId` is looked up with a computed key on purpose. A plain
 * `React.useId` is a static named-import reference, and webpack 5 in strict
 * ESM fails the build with "export 'useId' was not found in 'react'" when the
 * app is on React 17. Radix does exactly the same (`react-id`).
 *
 * The branch is chosen once, at module load, from the React that is actually
 * installed, so a given app always calls the same hooks in the same order.
 * ------------------------------------------------------------------------- */

const useReactId = (React as unknown as Record<string, (() => string) | undefined>)[
  ' useId '.trim().toString()
];

let counter = 0;

function useCounterId(): string {
  const [id] = React.useState(() => {
    counter += 1;
    return `ssx-${counter}`;
  });
  return id;
}

const useAnyId: () => string = useReactId ?? useCounterId;

/**
 * Returns `idOverride` when the caller passed an `id` (theirs always wins, so
 * a label elsewhere on the page can point at it), else a generated one.
 */
export function useId(idOverride?: string): string {
  const generated = useAnyId();
  return idOverride ?? generated;
}
