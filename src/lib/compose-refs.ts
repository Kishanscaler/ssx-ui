import type * as React from 'react';

/* ---------------------------------------------------------------------------
 * composeRefs — hand one DOM node to several refs.
 *
 * An atom that needs its own ref to the element (to measure it, focus it, call
 * `stepUp()`) and must ALSO forward the caller's ref cannot pass both to one
 * `ref` prop. This merges them. Pure, no hook, so it is safe to import from a
 * server atom; `useComposedRefs` (./use-composed-refs) is the memoised form
 * for client atoms.
 *
 * `asChild` does not need this: Radix `Slot` already composes the child's ref
 * with the slot's.
 *
 * React 19 ref cleanup functions are deliberately not returned: React 16-18
 * would treat the returned function as nothing and never call it, so an atom
 * that relied on cleanup would leak on the versions we also support.
 * ------------------------------------------------------------------------- */

export type PossibleRef<T> = React.Ref<T> | undefined;

export function setRef<T>(ref: PossibleRef<T>, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

export function composeRefs<T>(...refs: PossibleRef<T>[]): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) setRef(ref, node);
  };
}
