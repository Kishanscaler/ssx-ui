'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { composeRefs } from '../lib/compose-refs';
import { motionSelector, prefersReducedMotion } from './attributes';

export interface MotionScopeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Put the scope on the child (a `<main>`, a layout's wrapper) instead of a `<div>`. */
  asChild?: boolean;
}

/**
 * Animates every `data-ssx-*` motion target inside it — server-rendered
 * blocks included — without wrapping any of them in a client component.
 *
 *   <MotionScope asChild><main>{children}</main></MotionScope>
 *   …
 *   <section {...motionProps({ reveal: 'fade-up', trigger: 'in-view' })}>   (a Server Component)
 *
 * It costs nothing on a page that has no target: it imports no GSAP itself,
 * and loads the runtime (`applyMotion`, GSAP core) only once a target is in
 * its subtree — at mount, or later, after a client-side navigation. Under
 * reduced motion it never loads it. Put it once, high in a layout.
 *
 * Pair it with `motionNoFlashScript` in `<head>` so nothing flashes before the
 * runtime arrives, and with `holdMotion()` / `data-motion-hold` to hold every
 * entrance behind a splash.
 */
export const MotionScope = React.forwardRef<HTMLDivElement, MotionScopeProps>(function MotionScope(
  { asChild, ...props },
  forwardedRef,
) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion(root)) return undefined;
    let cancelled = false;
    let stop: (() => void) | undefined;
    let watcher: MutationObserver | undefined;
    const hasTarget = () => root.matches(motionSelector) || root.querySelector(motionSelector) !== null;
    const start = () => {
      watcher?.disconnect();
      import('./markup').then(({ applyMotion }) => {
        if (!cancelled) stop = applyMotion(root);
      });
    };
    if (hasTarget()) start();
    else if (typeof MutationObserver !== 'undefined') {
      watcher = new MutationObserver(() => {
        if (hasTarget()) start();
      });
      watcher.observe(root, { childList: true, subtree: true });
    }
    return () => {
      cancelled = true;
      watcher?.disconnect();
      stop?.();
    };
  }, []);
  const Comp = asChild ? Slot : 'div';
  return <Comp ref={composeRefs(ref, forwardedRef)} data-slot="motion-scope" {...props} />;
});
