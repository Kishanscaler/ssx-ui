'use client';

import * as React from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Slot } from '@radix-ui/react-slot';

import { composeRefs } from '../lib/compose-refs';
import { entrance, inViewStart, motionTokens, prefersReducedMotion, stagger, type MotionIntent } from './core';
import type { RevealTrigger } from './Reveal';
import { useMotion } from './use-motion';

export interface TextRevealProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Put the reveal on the child instead of a `<span>`, which is how it wraps a
   * `<Heading>`: `<TextReveal asChild><Heading as="h1" size="display">…</Heading></TextReveal>`.
   */
  asChild?: boolean;
  /** Reveal word by word (default) or character by character. */
  by?: 'words' | 'chars';
  trigger?: RevealTrigger;
  /** Default `expressive`: a text reveal is a moment, not product feedback. */
  intent?: MotionIntent;
}

/**
 * A headline that rises into place word by word (or character by character),
 * using GSAP SplitText with the SSX tokens: `motion.offset.enter` of travel,
 * the `tight` stagger. SplitText's `aria: 'auto'` keeps it one accessible
 * string: the element carries the full text as its label and the split pieces
 * are hidden from assistive tech. Under reduced motion nothing is split.
 *
 * For headlines and short marketing lines. Never on body copy, an error or a
 * live-updating value.
 */
export const TextReveal = React.forwardRef<HTMLElement, TextRevealProps>(function TextReveal(
  { asChild, by = 'words', trigger = 'mount', intent = 'expressive', ...props },
  forwardedRef,
) {
  const ref = React.useRef<HTMLElement>(null);
  useMotion(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion(el)) return;
      gsap.registerPlugin(SplitText);
      const split = SplitText.create(el, { type: by === 'chars' ? 'words,chars' : 'words', aria: 'auto' });
      const vars: gsap.TweenVars = {
        autoAlpha: 0,
        y: motionTokens.offset.enter,
        ...entrance(intent),
        stagger: stagger('tight', el),
      };
      if (trigger === 'in-view') {
        gsap.registerPlugin(ScrollTrigger);
        vars.scrollTrigger = { trigger: el, start: inViewStart, once: true };
      }
      gsap.from(by === 'chars' ? split.chars : split.words, vars);
    },
    ref,
    [by, trigger, intent],
  );
  const Comp = asChild ? Slot : 'span';
  return <Comp ref={composeRefs(ref, forwardedRef)} data-slot="text-reveal" {...props} />;
});
