'use client';

import * as React from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { Slot } from '@radix-ui/react-slot';

import { composeRefs } from '../lib/compose-refs';
import { prefersReducedMotion, type MotionIntent } from './core';
import { revealText, type TextRevealBy, type TextRevealPreset } from './text-reveal';
import type { RevealTrigger } from './Reveal';
import { playEntrance } from './trigger';
import { useMotion } from './use-motion';

export interface TextRevealProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Put the reveal on the child instead of a `<span>`, which is how it wraps a
   * `<Heading>`: `<TextReveal asChild><Heading as="h1" size="display">…</Heading></TextReveal>`.
   */
  asChild?: boolean;
  /**
   * How it enters:
   * `rise` (default) — each piece fades in and rises;
   * `blur` — each piece fades in, grows from `motion.scale.text` and sharpens
   * out of a motion blur (`motion.blur.text`);
   * `wipe` — word by word, a block of brand colour slides up over each word,
   * then the word slides in and pushes the block off the top; each word starts
   * `motion.stagger.wipe` (50ms) after the last, so they overlap tightly.
   * Recolour the block with `--ssx-text-wipe`;
   * `soft-wipe` — the same push, but the block is a brand gradient under a very
   * heavy blur (`motion.blur.wipe`), so a glow sweeps up through each word.
   * Recolour it with `--ssx-text-wipe-from` and `--ssx-text-wipe`.
   *
   * @default 'rise'
   */
  preset?: TextRevealPreset;
  /**
   * Reveal word by word (default), letter by letter, or line by line — several
   * words at a time, following the real line breaks. `wipe` and `soft-wipe` take
   * words or lines (letters become words).
   */
  by?: TextRevealBy;
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
  { asChild, preset = 'rise', by = 'words', trigger = 'mount', intent = 'expressive', ...props },
  forwardedRef,
) {
  const ref = React.useRef<HTMLElement>(null);
  useMotion(
    (context) => {
      const el = ref.current;
      if (!el || prefersReducedMotion(el)) return;
      gsap.registerPlugin(SplitText);
      const tween = revealText(SplitText, el, preset, by, intent);
      return playEntrance(tween, el, trigger, context);
    },
    ref,
    [preset, by, trigger, intent],
  );
  const Comp = asChild ? Slot : 'span';
  return <Comp ref={composeRefs(ref, forwardedRef)} data-slot="text-reveal" data-preset={preset} {...props} />;
});
