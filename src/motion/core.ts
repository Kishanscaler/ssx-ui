/**
 * SSX motion for GSAP: the token scale, registered as GSAP eases, with the
 * reduced-motion rule the CSS side already follows.
 *
 * GSAP is an OPTIONAL peer dependency. Only `@kishanscaler/ssx-ui/motion`
 * imports it; the main entry and every component stay CSS-animated, so an app
 * that never imports this entry never loads GSAP.
 *
 * The rules, in the order they matter:
 *   1. Every duration, curve, distance and interval comes from `motionTokens`
 *      (generated from tokens/primitive.scales.json, the same source as the
 *      `--motion-*` custom properties). No number is written in a tween.
 *   2. Motion is chosen by INTENT (`productive`, `expressive`), not by value.
 *      Productive is the default. Expressive is for onboarding, empty states,
 *      success and marketing moments — never an error, a decline or a
 *      destructive confirm.
 *   3. Reduced motion is honoured twice, like the CSS: the OS setting, and an
 *      app-level `data-motion="reduce"` ancestor. Under either, a primitive
 *      renders its end state and never tweens.
 *
 * No hooks here, no directive: safe to import from a Server Component.
 */
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

import { motionTokens } from './tokens.generated';

export { motionTokens };

export type MotionDuration = keyof typeof motionTokens.duration;
export type MotionEasing = keyof typeof motionTokens.easing;
export type MotionStagger = keyof typeof motionTokens.stagger;
export type MotionIntent = 'productive' | 'expressive';

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** The GSAP ease registered for an SSX curve: `ease('productiveInOut')` -> `'ssx-productive-in-out'`. */
export function ease(name: MotionEasing): string {
  return `ssx-${kebab(name)}`;
}

let registered = false;

export interface RegisterSsxMotionOptions {
  /**
   * Also set `gsap.defaults()` to the productive entrance (duration `normal`,
   * ease `ssx-productive-in-out`), so the app's own bare `gsap.to()` calls
   * follow the system. Off by default: it changes a global the app owns.
   */
  defaults?: boolean;
}

/**
 * Registers every SSX curve as a named GSAP ease (`ssx-productive-in-out`,
 * `ssx-expressive-entrance`, `ssx-overshoot`, ...). Idempotent; every
 * primitive calls it, and an app that tweens by hand calls it once.
 */
export function registerSsxMotion(options: RegisterSsxMotionOptions = {}): typeof gsap {
  if (!registered) {
    gsap.registerPlugin(CustomEase);
    for (const [name, points] of Object.entries(motionTokens.easing)) {
      CustomEase.create(ease(name as MotionEasing), points.join(','));
    }
    registered = true;
  }
  if (options.defaults) {
    gsap.defaults({ duration: motionTokens.duration.normal, ease: ease('productiveInOut') });
  }
  return gsap;
}

/**
 * True when motion should not run: the OS asks for reduced motion, or the
 * element sits under an app-level `data-motion="reduce"` (the same two sources
 * the CSS loaders and the Button shine read).
 */
export function prefersReducedMotion(element?: Element | null): boolean {
  if (element && typeof element.closest === 'function' && element.closest('[data-motion="reduce"]')) return true;
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** A duration step in seconds, or 0 under reduced motion. */
export function duration(name: MotionDuration, element?: Element | null): number {
  return prefersReducedMotion(element) ? 0 : motionTokens.duration[name];
}

/** A stagger interval in seconds, or 0 under reduced motion. */
export function stagger(name: MotionStagger, element?: Element | null): number {
  return prefersReducedMotion(element) ? 0 : motionTokens.stagger[name];
}

/**
 * Motion by intent (Atlassian's `motion.popup.enter` idea): the duration and
 * curve an entrance takes. Pass to a tween: `gsap.from(el, { ...entrance('productive'), y })`.
 */
export function entrance(intent: MotionIntent = 'productive'): { duration: number; ease: string } {
  return intent === 'expressive'
    ? { duration: motionTokens.duration.slower, ease: ease('expressiveEntrance') }
    : { duration: motionTokens.duration.slow, ease: ease('productiveEntrance') };
}

/** How an element enters: the FROM state of a reveal. */
export type RevealPreset = 'fade-up' | 'fade' | 'scale';

export function revealFrom(preset: RevealPreset): gsap.TweenVars {
  switch (preset) {
    case 'fade':
      return { autoAlpha: 0 };
    case 'scale':
      return { autoAlpha: 0, scale: motionTokens.scale.enter };
    default:
      return { autoAlpha: 0, y: motionTokens.offset.reveal };
  }
}

/** The ScrollTrigger `start` for an in-view reveal: the element's top, a token's height above the fold. */
export const inViewStart = `top bottom-=${motionTokens.viewport.enter}`;
