/**
 * @kishanscaler/ssx-ui/motion — the GSAP motion layer.
 *
 * Needs `gsap` (an optional peer dependency: `npm i gsap`). The main entry
 * never imports this, so an app that does not use it never loads GSAP.
 *
 * Re-exports only, no directive (see src/index.ts for why).
 */
export {
  duration,
  ease,
  entrance,
  inViewStart,
  motionTokens,
  prefersReducedMotion,
  registerSsxMotion,
  revealFrom,
  stagger,
} from './core';
export type {
  MotionDuration,
  MotionEasing,
  MotionIntent,
  MotionStagger,
  RegisterSsxMotionOptions,
  RevealPreset,
} from './core';

export { useMotion } from './use-motion';

export { Reveal } from './Reveal';
export type { RevealProps, RevealTrigger } from './Reveal';
export { Stagger } from './Stagger';
export type { StaggerProps } from './Stagger';
export { TextReveal } from './TextReveal';
export type { TextRevealProps } from './TextReveal';
export { CountUp } from './CountUp';
export type { CountUpProps } from './CountUp';
