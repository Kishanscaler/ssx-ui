'use client';

import * as React from 'react';
import { gsap } from 'gsap';
import { Slot } from '@radix-ui/react-slot';

import { composeRefs } from '../lib/compose-refs';
import type { MotionTrigger } from './attributes';
import {
  entrance,
  holdTransitions,
  motionTokens,
  prefersReducedMotion,
  revealClearProps,
  revealFrom,
  type MotionDuration,
  type MotionIntent,
  type RevealPreset,
} from './core';
import { wipeTimeline } from './section';
import { playEntrance } from './trigger';
import { useMotion } from './use-motion';

export type RevealTrigger = MotionTrigger;

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render the child element instead of a `<div>` (Radix Slot). */
  asChild?: boolean;
  /**
   * How it enters. `fade-up` rises by `motion.offset.reveal`; `scale` grows from `motion.scale.enter`;
   * `wipe` clips it open from the bottom (a card: its photo settles, its `data-part` text rises in;
   * always expressive, so `intent` does not apply).
   */
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
 * its entrance animates. Under reduced motion it simply appears; under a
 * `data-motion-hold` ancestor (a splash) it waits, hidden, for the release.
 *
 *   <Reveal trigger="in-view"><Card>…</Card></Reveal>
 */
export const Reveal = React.forwardRef<HTMLDivElement, RevealProps>(function Reveal(
  { asChild, preset = 'fade-up', trigger = 'mount', intent = 'productive', delay, ...props },
  forwardedRef,
) {
  const ref = React.useRef<HTMLDivElement>(null);
  useMotion(
    (context) => {
      const el = ref.current;
      if (!el || prefersReducedMotion(el)) return;
      const wait = delay ? motionTokens.duration[delay] : 0;
      if (preset === 'wipe') {
        const { timeline, revert } = wipeTimeline([el]);
        timeline.delay(wait);
        const cancel = playEntrance(timeline, el, trigger, context);
        return () => {
          cancel();
          revert();
        };
      }
      holdTransitions(el);
      const tween = gsap.from(el, {
        ...revealFrom(preset),
        ...entrance(intent),
        delay: wait,
        clearProps: revealClearProps,
        paused: true,
      });
      return playEntrance(tween, el, trigger, context);
    },
    ref,
    [preset, trigger, intent, delay],
  );
  const Comp = asChild ? Slot : 'div';
  return <Comp ref={composeRefs(ref, forwardedRef)} data-slot="reveal" {...props} />;
});
