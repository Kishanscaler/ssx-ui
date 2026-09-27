'use client';

import * as React from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Slot } from '@radix-ui/react-slot';

import { composeRefs } from '../lib/compose-refs';
import {
  entrance,
  inViewStart,
  motionTokens,
  prefersReducedMotion,
  revealFrom,
  type MotionDuration,
  type MotionIntent,
  type RevealPreset,
} from './core';
import { useMotion } from './use-motion';

export type RevealTrigger = 'mount' | 'in-view';

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render the child element instead of a `<div>` (Radix Slot). */
  asChild?: boolean;
  /** How it enters. `fade-up` rises by `motion.offset.reveal`; `scale` grows from `motion.scale.enter`. */
  preset?: RevealPreset;
  /** `mount`: as soon as it renders. `in-view`: once, when it scrolls `motion.viewport.enter` into view. */
  trigger?: RevealTrigger;
  /** `productive` (default) for product UI; `expressive` for onboarding, empty states, success, marketing. */
  intent?: MotionIntent;
  /** Wait one duration step before entering (a hero's second line after its first). */
  delay?: MotionDuration;
}

/**
 * Fades a block in (and up, or up from a smaller scale) with the SSX motion
 * tokens. The content is in the DOM and readable from the first render; only
 * its entrance animates. Under reduced motion it simply appears.
 *
 *   <Reveal trigger="in-view"><Card>…</Card></Reveal>
 */
export const Reveal = React.forwardRef<HTMLDivElement, RevealProps>(function Reveal(
  { asChild, preset = 'fade-up', trigger = 'mount', intent = 'productive', delay, ...props },
  forwardedRef,
) {
  const ref = React.useRef<HTMLDivElement>(null);
  useMotion(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion(el)) return;
      const vars: gsap.TweenVars = {
        ...revealFrom(preset),
        ...entrance(intent),
        delay: delay ? motionTokens.duration[delay] : 0,
        clearProps: 'transform,opacity,visibility',
      };
      if (trigger === 'in-view') {
        gsap.registerPlugin(ScrollTrigger);
        vars.scrollTrigger = { trigger: el, start: inViewStart, once: true };
      }
      gsap.from(el, vars);
    },
    ref,
    [preset, trigger, intent, delay],
  );
  const Comp = asChild ? Slot : 'div';
  return <Comp ref={composeRefs(ref, forwardedRef)} data-slot="reveal" {...props} />;
});
