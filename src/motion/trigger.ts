'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { whenMotionReleased, type MotionTrigger } from './attributes';
import { inViewStart } from './core';

/**
 * Plays a PAUSED entrance by its trigger, once any `data-motion-hold` above
 * `element` is released. The tween is created paused so its start state is
 * drawn at once (an element under a splash is already hidden, not visible and
 * then snapped away); `restart(true)` keeps its `delay`. Returns the cancel.
 *
 * Shared by `Reveal`, `Stagger`, `TextReveal` and `CountUp`. Client-only: it
 * only ever runs inside `useMotion`.
 */
export function playEntrance(
  tween: gsap.core.Animation,
  element: Element,
  trigger: MotionTrigger,
  context: gsap.Context,
): () => void {
  return whenMotionReleased(element, () =>
    context.add(() => {
      if (trigger !== 'in-view') {
        tween.restart(true);
        return;
      }
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.create({ trigger: element, start: inViewStart, once: true, onEnter: () => tween.restart(true) });
    }),
  );
}
