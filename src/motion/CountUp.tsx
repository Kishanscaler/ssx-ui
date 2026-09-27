'use client';

import * as React from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { cn } from '../lib/cn';
import { VisuallyHidden } from '../components/VisuallyHidden';
import { ease, inViewStart, motionTokens, prefersReducedMotion } from './core';
import type { RevealTrigger } from './Reveal';
import { useMotion } from './use-motion';

export interface CountUpProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The number it lands on. This is what renders on the server, and what a screen reader reads. */
  value: number;
  /** Where it counts from. */
  from?: number;
  /** How the number is written at every step. Default: the locale's grouping, whole numbers. */
  format?: (value: number) => string;
  trigger?: RevealTrigger;
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString();

/**
 * A figure that counts up to its value (a stat on a landing page, a result on
 * a success screen), over `motion.duration.slowest` on the expressive
 * entrance. The FINAL value is the accessible text from the first render; the
 * counting digits beside it are hidden from assistive tech, so a screen reader
 * never hears the intermediate numbers. Tabular figures, so it does not jitter.
 * Under reduced motion it shows the value and never counts.
 */
export const CountUp = React.forwardRef<HTMLSpanElement, CountUpProps>(function CountUp(
  { value, from = 0, format = defaultFormat, trigger = 'mount', className, ...props },
  forwardedRef,
) {
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const digitsRef = React.useRef<HTMLSpanElement>(null);
  const formatRef = React.useRef(format);
  formatRef.current = format;
  useMotion(
    () => {
      const digits = digitsRef.current;
      if (!digits || prefersReducedMotion(digits)) return;
      const counter = { n: from };
      const write = () => {
        digits.textContent = formatRef.current(counter.n);
      };
      write();
      const vars: gsap.TweenVars = {
        n: value,
        duration: motionTokens.duration.slowest,
        ease: ease('expressiveEntrance'),
        onUpdate: write,
        onComplete: () => {
          digits.textContent = formatRef.current(value);
        },
      };
      if (trigger === 'in-view') {
        gsap.registerPlugin(ScrollTrigger);
        vars.scrollTrigger = { trigger: digits, start: inViewStart, once: true };
      }
      gsap.to(counter, vars);
      return () => {
        digits.textContent = formatRef.current(value);
      };
    },
    rootRef,
    [value, from, trigger],
  );
  return (
    <span ref={forwardedRef} data-slot="count-up" className={cn('tabular-nums', className)} {...props}>
      <span ref={rootRef}>
        <span ref={digitsRef} aria-hidden="true">
          {format(value)}
        </span>
      </span>
      <VisuallyHidden>{format(value)}</VisuallyHidden>
    </span>
  );
});
