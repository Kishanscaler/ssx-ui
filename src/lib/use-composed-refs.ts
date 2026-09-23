'use client';

// Client: this module is a hook.
import * as React from 'react';

import { composeRefs, type PossibleRef } from './compose-refs';

/**
 * `composeRefs`, memoised so the merged callback ref is stable between renders.
 * An unstable callback ref is detached and re-attached on every render (React
 * calls it with `null`, then the node), which is wasted work and breaks any ref
 * that does something on attach.
 *
 *   const inner = React.useRef<HTMLInputElement>(null);
 *   const ref = useComposedRefs(forwardedRef, inner);
 *   return <input ref={ref} ... />;
 */
export function useComposedRefs<T>(...refs: PossibleRef<T>[]): (node: T | null) => void {
  // The refs ARE the dependency list; their count is fixed per call site.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(composeRefs(...refs), refs);
}
