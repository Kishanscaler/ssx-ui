/**
 * The markup motion CONTRACT: the attributes `applyMotion()` / `<MotionScope>`
 * read, the no-flash head script, and the two gates every primitive honours
 * (reduced motion, and a splash's hold).
 *
 * No GSAP in this file, on purpose. `<MotionScope>` imports it to decide
 * whether a page needs motion at all, and loads GSAP only when it does; a
 * Server Component imports it to write the attributes.
 *
 *   <section data-ssx-reveal="fade-up" data-ssx-trigger="in-view">…</section>
 *   <ul data-ssx-stagger="fade-up" data-ssx-interval="base">…</ul>
 *   <h1 data-ssx-text-reveal="words">Learn to build</h1>
 *
 * The same presets, triggers, intents and steps as `Reveal`, `Stagger` and
 * `TextReveal`, as strings. `motionProps()` writes them with types.
 *
 * No hooks, no directive: safe to import from a Server Component.
 */
import type { MotionDuration, MotionIntent, MotionStagger, RevealPreset } from './core';
import type { TextRevealBy, TextRevealPreset } from './text-reveal';

/** `mount`: as soon as the script arms it. `in-view`: once, when it scrolls `motion.viewport.enter` into view. */
export type MotionTrigger = 'mount' | 'in-view';

/** Every attribute in the contract. Authors write the first eight; the runtime writes `state`. */
export const motionAttributes = {
  /** A block that enters: `fade-up` (default when empty) · `fade` · `scale`. */
  reveal: 'data-ssx-reveal',
  /** A parent whose DIRECT children enter one after another, with a preset. */
  stagger: 'data-ssx-stagger',
  /** A headline revealed `words` (default), `chars` or `lines`. Loads GSAP SplitText on demand. */
  text: 'data-ssx-text-reveal',
  /** How a text reveal enters: `rise` (default) · `blur` · `wipe` (brand-colour wipe) · `soft-wipe` (blurred gradient wipe). */
  textPreset: 'data-ssx-text-preset',
  /** `mount` (default) · `in-view`. */
  trigger: 'data-ssx-trigger',
  /** `productive` (default; `expressive` for a text reveal) · `expressive`. */
  intent: 'data-ssx-intent',
  /** A duration step to wait before entering: `instant` … `slowest`. */
  delay: 'data-ssx-delay',
  /** The stagger step between siblings: `base` (default) · `tight`. */
  interval: 'data-ssx-interval',
  /** Written by the runtime: `armed` (start state set, waiting) · `done`. Never author it. */
  state: 'data-ssx-motion',
  /** On any ancestor (usually `<html>`): hold every entrance until it is removed. A splash sets it. */
  hold: 'data-motion-hold',
  /** On `<html>`, set by `motionNoFlashScript`: hide motion targets until the script arms them. */
  pending: 'data-ssx-motion-pending',
} as const;

/** Matches every element the runtime animates. */
export const motionSelector = '[data-ssx-reveal],[data-ssx-stagger],[data-ssx-text-reveal]';

/** What `motionProps()` takes. One of `reveal`, `stagger` or `text`, plus its modifiers. */
export interface MotionMarkup {
  reveal?: RevealPreset;
  stagger?: RevealPreset;
  text?: TextRevealBy;
  textPreset?: TextRevealPreset;
  trigger?: MotionTrigger;
  intent?: MotionIntent;
  delay?: MotionDuration;
  interval?: MotionStagger;
}

/**
 * The contract's attributes as props, typed:
 *   <Card {...motionProps({ reveal: 'fade-up', trigger: 'in-view' })}>…</Card>
 * Works in a Server Component; nothing animates until a `<MotionScope>` (or
 * `applyMotion()`) above it arms it.
 */
export function motionProps(markup: MotionMarkup): Record<string, string> {
  const props: Record<string, string> = {};
  for (const key of Object.keys(markup) as Array<keyof MotionMarkup>) {
    const value = markup[key];
    if (value) props[motionAttributes[key]] = value;
  }
  return props;
}

/**
 * The no-flash recipe, part one: an inline script for `<head>`, BEFORE the
 * first paint. It marks `<html>` so that `components.css` hides every motion
 * target until the runtime has set its start state. Part two is in the CSS:
 * past `--motion-fallback-reveal` the content fades in anyway, so a blocked
 * or failed script never leaves the page blank. Under reduced motion it does
 * nothing, and nothing is hidden.
 *
 *   <html suppressHydrationWarning>
 *     <head><script dangerouslySetInnerHTML={{ __html: motionNoFlashScript }} /></head>
 *
 * `suppressHydrationWarning` because the script adds an attribute React did not render.
 */
export const motionNoFlashScript =
  "(function(d){try{if(!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))" +
  "d.documentElement.setAttribute('data-ssx-motion-pending','')}catch(e){}})(document)";

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

/** True while the element sits under a `data-motion-hold` ancestor (a splash is playing). */
export function isMotionHeld(element?: Element | null): boolean {
  return Boolean(element && typeof element.closest === 'function' && element.closest(`[${motionAttributes.hold}]`));
}

/**
 * Hold every entrance on the page (or under `element`) until the returned
 * function is called. For a splash, an intro, a cookie wall: anything that
 * covers the page while it would otherwise be playing its entrances.
 *
 *   const release = holdMotion();
 *   splash.then(release);
 *
 * The attribute can equally be server-rendered (`<html data-motion-hold>`)
 * and removed by whatever owns the cover.
 */
export function holdMotion(element?: Element): () => void {
  const target = element ?? (typeof document !== 'undefined' ? document.documentElement : undefined);
  if (!target) return () => {};
  target.setAttribute(motionAttributes.hold, '');
  return () => target.removeAttribute(motionAttributes.hold);
}

/**
 * Run `start` now, or — under a `data-motion-hold` ancestor — as soon as the
 * last hold above `element` is removed. Returns a cancel.
 */
export function whenMotionReleased(element: Element, start: () => void): () => void {
  if (!isMotionHeld(element) || typeof MutationObserver === 'undefined') {
    start();
    return () => {};
  }
  const observer = new MutationObserver(() => {
    if (isMotionHeld(element)) return;
    observer.disconnect();
    start();
  });
  observer.observe(element.ownerDocument.documentElement, {
    attributes: true,
    attributeFilter: [motionAttributes.hold],
    subtree: true,
  });
  return () => observer.disconnect();
}
