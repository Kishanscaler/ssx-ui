'use client';

import * as React from 'react';
import { gsap } from 'gsap';

import { registerSsxMotion } from './core';

/** `useLayoutEffect` in the browser (no first-paint flash), `useEffect` on the server (no warning). */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

/**
 * Run GSAP inside a React component, scoped and cleaned up.
 *
 * Every tween, timeline and ScrollTrigger created in `setup` is collected by a
 * `gsap.context` scoped to `scope`, so selector text (`'.item'`) only matches
 * inside the component, and all of it is reverted on unmount or when `deps`
 * change (StrictMode's double mount included). The SSX eases are registered
 * first, so `ease('productiveInOut')` is always valid inside `setup`.
 *
 * This is the SSX equivalent of `@gsap/react`'s `useGSAP`, which needs React 17;
 * this package supports React 16.12, so it ships its own.
 *
 *   const ref = React.useRef<HTMLDivElement>(null);
 *   useMotion(() => {
 *     gsap.from('.row', { ...entrance(), y: motionTokens.offset.enter, stagger: stagger('base') });
 *   }, ref);
 */
export function useMotion(
  setup: (context: gsap.Context) => void | (() => void),
  scope: React.RefObject<Element | null>,
  deps: React.DependencyList = [],
): void {
  const setupRef = React.useRef(setup);
  setupRef.current = setup;
  useIsomorphicLayoutEffect(() => {
    registerSsxMotion();
    const context = gsap.context((self) => setupRef.current(self), scope.current ?? undefined);
    return () => context.revert();
    // `deps` is the caller's contract, as with useEffect.
  }, deps);
}
