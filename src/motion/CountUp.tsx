'use client';

import * as React from 'react';
import { gsap } from 'gsap';

import { cn } from '../lib/cn';
import { VisuallyHidden } from '../components/VisuallyHidden';
import { ease, holdTransitions, motionTokens, prefersReducedMotion } from './core';
import type { RevealTrigger } from './Reveal';
import { playEntrance } from './trigger';
import { useMotion } from './use-motion';

export interface CountUpProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The number it lands on. This is what renders on the server, and what a screen reader reads. */
  value: number;
  /** Where it counts from. */
  from?: number;
  /** How the number is written at every step. Default: the locale's grouping, whole numbers. */
  format?: (value: number) => string;
  trigger?: RevealTrigger;
  /**
   * `none`: the digits count, nothing else moves. `fade-scale`: every digit is
   * its own piece. A digit that ticks over after sitting still pops in on its
   * own (fades in, grows from `motion.scale.count`, sharpens from
   * `motion.blur.count`); a digit changing too fast to read stays blurred (motion
   * blur) and sharpens as the count slows. Slightly expressive: for a landing
   * page's stats or a success screen.
   *
   * @default 'none'
   */
  entrance?: CountUpEntrance;
  /**
   * How long it counts: `medium` (`motion.count.medium`, 800ms) or `slow`
   * (`motion.count.slow`, 1600ms, for the one hero figure in a section).
   *
   * @default 'medium'
   */
  speed?: CountUpSpeed;
}

/** `none` counts only; `fade-scale` pops each digit in on its own, with motion blur while it races. */
export type CountUpEntrance = 'none' | 'fade-scale';
/** How long it counts: `medium` 800ms · `slow` 1600ms. */
export type CountUpSpeed = 'medium' | 'slow';

const defaultFormat = (n: number) => Math.round(n).toLocaleString();

/**
 * A figure that counts up to its value (a stat on a landing page, a result on
 * a success screen), over `motion.count.*` (`speed`) on the expressive
 * entrance. With `entrance="fade-scale"` each digit moves on its own (see
 * `digitSlots` below). The FINAL value is the accessible text from the first render; the
 * counting digits beside it are hidden from assistive tech, so a screen reader
 * never hears the intermediate numbers. Tabular figures, so it does not jitter.
 * Under reduced motion it shows the value and never counts.
 */
/**
 * `entrance="fade-scale"`: the figure as one inline-block piece per character,
 * aligned from the RIGHT (the units stay the units as the number grows a
 * place, and a new place pops in on the left). On each write, only the pieces
 * whose character changed move:
 *
 *   settled (unchanged for `duration.normal`)  pops: fades in, grows from
 *     `motion.scale.count`, sharpens from `motion.blur.count`;
 *   racing (changed again sooner)              full strength but blurred to
 *     `motion.blur.count`, sharpening over `duration.normal` — so a digit
 *     spinning faster than it can be read reads as motion blur, and comes into
 *     focus as the count decelerates onto its value.
 *
 * Transforms, opacity and filter only: no layout moves. Tabular figures keep
 * every digit one width.
 */
function digitSlots(host: HTMLElement) {
  const pieces: HTMLSpanElement[] = [];
  const lastChange: number[] = [];
  const settleMs = motionTokens.duration.normal * 1000;
  const blur = `blur(${motionTokens.blur.count})`;
  const sharp = 'blur(0px)';
  const settle = { duration: motionTokens.duration.normal, ease: ease('expressiveEntrance'), overwrite: true };

  const atRest = {
    autoAlpha: 1,
    scale: 1, // mechanic: full size
    filter: sharp,
  };
  const pop = (piece: HTMLSpanElement) =>
    gsap.fromTo(piece, { autoAlpha: 0, scale: motionTokens.scale.count, filter: blur }, { ...atRest, ...settle });
  const race = (piece: HTMLSpanElement) =>
    gsap.fromTo(piece, { ...atRest, filter: blur }, { filter: sharp, ...settle });

  let started = false;
  host.textContent = '';
  return {
    write(text: string, now: number) {
      const chars = Array.from(text);
      const fresh = new Set<HTMLSpanElement>();
      while (pieces.length < chars.length) {
        const piece = host.ownerDocument.createElement('span');
        // Inline, not a utility class: consumers' Tailwind scans components/, not motion/.
        holdTransitions(piece);
        gsap.set(piece, { display: 'inline-block', autoAlpha: 0 });
        host.insertBefore(piece, host.firstChild);
        pieces.unshift(piece);
        fresh.add(piece);
        // A new place mid-count (9 -> 10) pops in at once; before the start, it waits.
        if (started) pop(piece);
        lastChange.unshift(started ? now : -Infinity);
      }
      while (pieces.length > chars.length) {
        pieces.shift()!.remove();
        lastChange.shift();
      }
      chars.forEach((char, i) => {
        const piece = pieces[i]!;
        if (piece.textContent === char) return;
        piece.textContent = char;
        // A new piece's first character is its arrival, not a change: it has already popped (or waits for `show()`).
        if (fresh.has(piece) || !Number.isFinite(lastChange[i]!)) return;
        (now - lastChange[i]! < settleMs ? race : pop)(piece);
        lastChange[i] = now;
      });
    },
    /** The count has started: pop every piece that is still waiting. */
    show(now: number) {
      started = true;
      pieces.forEach((piece, i) => {
        if (Number.isFinite(lastChange[i]!)) return;
        pop(piece);
        lastChange[i] = now;
      });
    },
    revert(final: string) {
      gsap.killTweensOf(pieces);
      host.textContent = final;
    },
  };
}

export const CountUp = React.forwardRef<HTMLSpanElement, CountUpProps>(function CountUp(
  {
    value,
    from = 0,
    format = defaultFormat,
    trigger = 'mount',
    entrance = 'none',
    speed = 'medium',
    className,
    ...props
  },
  forwardedRef,
) {
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const digitsRef = React.useRef<HTMLSpanElement>(null);
  const formatRef = React.useRef(format);
  formatRef.current = format;
  useMotion(
    (context) => {
      const digits = digitsRef.current;
      if (!digits || prefersReducedMotion(digits)) return;
      const counter = { n: from };
      const slots = entrance === 'fade-scale' ? digitSlots(digits) : null;
      const write = () => {
        const text = formatRef.current(counter.n);
        if (slots) slots.write(text, performance.now());
        else digits.textContent = text;
      };
      write();
      const tween = gsap.to(counter, {
        n: value,
        duration: motionTokens.count[speed],
        ease: ease('expressiveEntrance'),
        paused: true,
        onStart: () => slots?.show(performance.now()),
        onUpdate: write,
        onComplete: () => {
          counter.n = value;
          write();
        },
      });
      const cancel = playEntrance(tween, digits, trigger, context);
      return () => {
        cancel();
        if (slots) slots.revert(formatRef.current(value));
        else digits.textContent = formatRef.current(value);
      };
    },
    rootRef,
    [value, from, trigger, entrance, speed],
  );
  return (
    <span
      ref={forwardedRef}
      data-slot="count-up"
      data-entrance={entrance}
      data-speed={speed}
      className={cn('tabular-nums', className)}
      {...props}
    >
      <span ref={rootRef}>
        <span ref={digitsRef} aria-hidden="true">
          {format(value)}
        </span>
      </span>
      <VisuallyHidden>{format(value)}</VisuallyHidden>
    </span>
  );
});
