import * as React from 'react';

/* ---------------------------------------------------------------------------
 * A `react/jsx-runtime` for React 16.12, built on `React.createElement`.
 *
 * NOT part of the public package and NOT used by our own components: they are
 * compiled with the classic runtime (`React.createElement`) precisely so they
 * need no `react/jsx-runtime`. It exists for our DEPENDENCIES. Every Radix
 * primitive (checkbox, select, ... 18 packages as of 2026-09) and `input-otp`
 * are compiled with the automatic runtime and `import { jsx } from
 * "react/jsx-runtime"`, which React only ships from 16.14. On 16.12 that
 * import does not resolve and the consumer's build fails.
 *
 * Two places swap it in for `react/jsx-runtime`:
 *   - the legacy build (`dist/legacy/`, vite.lib.config.ts), which bundles the
 *     dependencies and points their `react/jsx-runtime` imports here;
 *   - the React 16 test run (vitest.react16.config.ts).
 *
 * `jsxs` spreads its (static) children as arguments rather than passing the
 * array: React validates keys on an array child, so passing it whole would
 * print a false "Each child in a list should have a unique key" for every
 * static child list in Radix. That is exactly what `jsxs` exists to avoid.
 * ------------------------------------------------------------------------- */

type Props = Record<string, unknown> & { children?: unknown };
type ElementType = Parameters<typeof React.createElement>[0];

function split(props: Props, key: React.Key | undefined): [Record<string, unknown>, unknown, boolean] {
  const rest: Record<string, unknown> = {};
  let hasChildren = false;
  let children: unknown;
  for (const name in props) {
    if (!Object.prototype.hasOwnProperty.call(props, name)) continue;
    if (name === 'children') {
      hasChildren = true;
      children = props[name];
    } else {
      rest[name] = props[name];
    }
  }
  if (key !== undefined) rest.key = key;
  return [rest, children, hasChildren];
}

export const Fragment = React.Fragment;

export function jsx(type: ElementType, props: Props, key?: React.Key): React.ReactElement {
  const [rest, children, hasChildren] = split(props, key);
  const create = React.createElement as (...args: unknown[]) => React.ReactElement;
  return hasChildren ? create(type, rest, children) : create(type, rest);
}

export function jsxs(type: ElementType, props: Props, key?: React.Key): React.ReactElement {
  const [rest, children, hasChildren] = split(props, key);
  const create = React.createElement as (...args: unknown[]) => React.ReactElement;
  if (!hasChildren) return create(type, rest);
  return Array.isArray(children) ? create(type, rest, ...children) : create(type, rest, children);
}

/** `react/jsx-dev-runtime`: the same, plus an `isStatic` flag and source info we drop. */
export function jsxDEV(
  type: ElementType,
  props: Props,
  key?: React.Key,
  isStatic?: boolean,
): React.ReactElement {
  return isStatic ? jsxs(type, props, key) : jsx(type, props, key);
}
