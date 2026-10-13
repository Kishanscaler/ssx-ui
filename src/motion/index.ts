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

export {
  holdMotion,
  isMotionHeld,
  isRowHeld,
  motionAttributes,
  motionNoFlashScript,
  motionProps,
  motionSelector,
  whenMotionReleased,
} from './attributes';
export type { MotionMarkup, MotionTrigger, SectionPreset } from './attributes';
export { applyMotion } from './markup';
export type { ApplyMotionOptions } from './markup';

export { useMotion } from './use-motion';
export { useSectionEntrance } from './use-section-entrance';
export type { SectionEntranceOptions } from './use-section-entrance';

export { MotionScope } from './MotionScope';
export type { MotionScopeProps } from './MotionScope';

export { Reveal } from './Reveal';
export type { RevealProps, RevealTrigger } from './Reveal';
export { Stagger } from './Stagger';
export type { StaggerProps } from './Stagger';
export { TextReveal } from './TextReveal';
export type { TextRevealProps } from './TextReveal';
export { textRevealBys, textRevealPresets } from './text-reveal';
export type { TextRevealBy, TextRevealPreset } from './text-reveal';
export { CountUp } from './CountUp';
export type { CountUpEntrance, CountUpProps, CountUpSpeed } from './CountUp';
