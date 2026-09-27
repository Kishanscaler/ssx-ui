'use client';

import * as React from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Slot } from '@radix-ui/react-slot';

import { composeRefs } from '../lib/compose-refs';
import {
  entrance,
  inViewStart,
  prefersReducedMotion,
  revealFrom,
  stagger,
  type MotionIntent,
  type MotionStagger,
  type RevealPreset,
} from './core';
import type { RevealTrigger } from './Reveal';
import { useMotion } from './use-motion';

export interface StaggerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render the child element (a `<ul>`, a Grid) instead of a `<div>`. Its direct children stagger. */
  asChild?: boolean;
  preset?: RevealPreset;
  trigger?: RevealTrigger;
  intent?: MotionIntent;
  /** The interval between siblings: `base` (60ms, cards and rows) or `tight` (30ms). */
  interval?: MotionStagger;
}

/**
 * Reveals its DIRECT children one after another (a list, a card grid), with
 * the same presets and intents as `Reveal`. Children keep their own layout;
 * nothing is wrapped. Under reduced motion they all simply appear.
 *
 *   <Stagger asChild trigger="in-view"><Grid>{cards}</Grid></Stagger>
 */
export const Stagger = React.forwardRef<HTMLDivElement, StaggerProps>(function Stagger(
  { asChild, preset = 'fade-up', trigger = 'mount', intent = 'productive', interval = 'base', ...props },
  forwardedRef,
) {
  const ref = React.useRef<HTMLDivElement>(null);
  useMotion(
    () => {
      const el = ref.current;
      if (!el || !el.children.length || prefersReducedMotion(el)) return;
      const vars: gsap.TweenVars = {
        ...revealFrom(preset),
        ...entrance(intent),
        stagger: stagger(interval, el),
        clearProps: 'transform,opacity,visibility',
      };
      if (trigger === 'in-view') {
        gsap.registerPlugin(ScrollTrigger);
        vars.scrollTrigger = { trigger: el, start: inViewStart, once: true };
      }
      gsap.from(Array.from(el.children), vars);
    },
    ref,
    [preset, trigger, intent, interval],
  );
  const Comp = asChild ? Slot : 'div';
  return <Comp ref={composeRefs(ref, forwardedRef)} data-slot="stagger" {...props} />;
});
