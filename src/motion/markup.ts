/**
 * The markup motion RUNTIME: arms every `data-ssx-*` element under a root with
 * the same tokens, presets and gates as `Reveal`, `Stagger` and `TextReveal`.
 *
 *   import { applyMotion } from '@kishanscaler/ssx-ui/motion';
 *   const stop = applyMotion(document.body);   // a Rails page, a plain script
 *
 * In React, `<MotionScope>` loads this file lazily, only on a page that has a
 * motion target, so a page without one never downloads GSAP.
 *
 * Why it exists: a server-rendered CMS block tree cannot wrap arbitrary
 * children in client components without shipping them on every page, so the
 * blocks carry attributes and one runtime animates them.
 *
 * What it does, per element:
 *   - reduced motion (OS or a `data-motion="reduce"` ancestor): marks it
 *     `done` and leaves it alone;
 *   - otherwise draws its start state at once (CSS transitions off while it
 *     plays — see `holdTransitions`), marks it `armed`, and plays it on its
 *     trigger once any `data-motion-hold` above it is released. `in-view` uses
 *     an IntersectionObserver, not ScrollTrigger, so a page of entrances costs
 *     GSAP core only;
 *   - a text reveal loads GSAP SplitText on demand, so a page with no text
 *     reveal never downloads it;
 *   - `wipe` (a reveal or a stagger) clips cards open from the bottom while
 *     their parts settle and rise (`section.ts`, shared with the components);
 *   - a section header (`data-ssx-section="header"`) plays its eyebrow,
 *     headline by lines and sub/controls in turn. It loads ScrollTrigger (its
 *     in-view start, `clamp(top 85%)`, must stay reachable at a page's foot,
 *     which an IntersectionObserver cannot promise) and SplitText on demand.
 * Elements added later (a client-side navigation, a lazy block) are armed as
 * they arrive; elements removed are reverted.
 *
 * No hooks, no directive: importable anywhere. It does need a DOM.
 */
import { gsap } from 'gsap';

import { motionAttributes, motionSelector, whenMotionReleased, type MotionTrigger } from './attributes';
import { cardsOnScreen, sectionHeaderParts, sectionHeaderStart, sectionHeaderTimeline, wipeTimeline } from './section';
import { revealText, textRevealBys, textRevealPresets, type TextRevealBy, type TextRevealPreset } from './text-reveal';
import {
  entrance,
  holdTransitions,
  motionTokens,
  prefersReducedMotion,
  registerSsxMotion,
  revealClearProps,
  revealFrom,
  stagger,
  type MotionDuration,
  type MotionIntent,
  type MotionStagger,
  type RevealPreset,
} from './core';

export interface ApplyMotionOptions {
  /**
   * Keep watching the root and arm motion targets added later (and revert
   * removed ones). Off for a one-shot pass over static HTML.
   *
   * @default true
   */
  observe?: boolean;
}

const noop = () => {};
const PRESETS: readonly RevealPreset[] = ['fade-up', 'fade', 'scale', 'wipe'];

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

const durations = Object.keys(motionTokens.duration) as MotionDuration[];
const intervals = Object.keys(motionTokens.stagger) as MotionStagger[];

/** The in-view rule as an IntersectionObserver margin: `motion.viewport.enter` above the bottom edge. */
const inViewMargin = `0px 0px -${motionTokens.viewport.enter} 0px`;

function onceInView(element: Element, play: () => void): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    play();
    return noop;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      play();
    },
    { rootMargin: inViewMargin },
  );
  observer.observe(element);
  return () => observer.disconnect();
}

/** Arms one element. Returns its revert. */
function arm(element: HTMLElement): () => void {
  const { state } = motionAttributes;
  if (prefersReducedMotion(element)) {
    element.setAttribute(state, 'done');
    return noop;
  }

  const isSection = element.getAttribute(motionAttributes.section) === 'header';
  // A section sequence is a scroll moment: in view unless the author says `mount`.
  const trigger = pick<MotionTrigger>(
    element.getAttribute(motionAttributes.trigger),
    ['mount', 'in-view'],
    isSection ? 'in-view' : 'mount',
  );
  const isText = element.hasAttribute(motionAttributes.text);
  const intent = pick<MotionIntent>(
    element.getAttribute(motionAttributes.intent),
    ['productive', 'expressive'],
    isText ? 'expressive' : 'productive',
  );
  const delayStep = element.getAttribute(motionAttributes.delay);
  const delay = delayStep && (durations as string[]).includes(delayStep) ? motionTokens.duration[delayStep as MotionDuration] : 0;

  const context = gsap.context(noop);
  let stopHold = noop;
  let stopView = noop;
  let undo = noop;
  let cancelled = false;

  /**
   * Arm a paused animation, then play it on the trigger once released. `watch`
   * is how `in-view` is detected: an IntersectionObserver unless the caller
   * brings its own (a section header's ScrollTrigger).
   */
  const ready = (animation: gsap.core.Animation, watch = onceInView) => {
    animation.eventCallback('onComplete', () => element.setAttribute(state, 'done'));
    element.setAttribute(state, 'armed');
    const play = () => context.add(() => animation.restart(true));
    stopHold = whenMotionReleased(element, () => {
      if (trigger === 'in-view') stopView = watch(element, play);
      else play();
    });
  };
  /** The `wipe` preset over `cards` (each clipped open, its parts settling and rising). */
  const wipe = (cards: Element[], gap?: number, row?: Element) => {
    context.add(() => {
      const built = wipeTimeline(cards, { gap, row });
      undo = built.revert;
      if (delay) built.timeline.delay(delay);
      ready(built.timeline);
    });
  };
  /** Draw the start state, then play on the trigger once released. */
  const run = (targets: Element[], vars: gsap.TweenVars) => {
    if (cancelled) return;
    context.add(() => {
      holdTransitions(targets);
      ready(gsap.from(targets, { ...vars, ...entrance(intent), delay, clearProps: revealClearProps, paused: true }));
    });
  };

  if (isSection) {
    // Hidden while ScrollTrigger (and SplitText, for a headline) load; the parts take over once built.
    context.add(() => gsap.set(element, { autoAlpha: 0 }));
    element.setAttribute(state, 'armed');
    const parts = sectionHeaderParts(element);
    Promise.all([
      import('gsap/ScrollTrigger'),
      parts.headline ? import('gsap/SplitText').catch(() => null) : null,
    ])
      .then(([{ ScrollTrigger }, split]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        if (split) gsap.registerPlugin(split.SplitText);
        context.add(() => {
          const built = sectionHeaderTimeline(parts, split ? split.SplitText : null);
          undo = built.revert;
          gsap.set(element, { clearProps: 'opacity,visibility' });
          if (delay) built.timeline.delay(delay);
          ready(built.timeline, (target, play) => {
            const vars: ScrollTrigger.Vars = { trigger: target, start: sectionHeaderStart, once: true };
            // Assigned, not an `onEnter` key: this module is server-safe, and the
            // directive check reads an `on*:` key as a React event handler.
            vars.onEnter = play;
            const st = ScrollTrigger.create(vars);
            return () => st.kill();
          });
        });
      })
      .catch(() => {
        // No ScrollTrigger (an old GSAP): the header simply appears.
        context.revert();
        element.setAttribute(state, 'done');
      });
  } else if (isText) {
    // Hidden while SplitText loads; the words take over once it has split.
    context.add(() => gsap.set(element, { autoAlpha: 0 }));
    element.setAttribute(state, 'armed');
    const by = pick<TextRevealBy>(element.getAttribute(motionAttributes.text), textRevealBys, 'words');
    const preset = pick<TextRevealPreset>(element.getAttribute(motionAttributes.textPreset), textRevealPresets, 'rise');
    import('gsap/SplitText')
      .then(({ SplitText }) => {
        if (cancelled) return;
        gsap.registerPlugin(SplitText);
        context.add(() => {
          const animation = revealText(SplitText, element, preset, by, intent);
          gsap.set(element, { autoAlpha: 1 });
          if (delay) animation.delay(delay);
          ready(animation);
        });
      })
      .catch(() => {
        // No SplitText (an old GSAP): the line simply appears.
        context.revert();
        element.setAttribute(state, 'done');
      });
  } else if (element.hasAttribute(motionAttributes.stagger)) {
    const children = Array.from(element.children);
    if (!children.length) element.setAttribute(state, 'done');
    else {
      const interval = pick(element.getAttribute(motionAttributes.interval), intervals, 'base');
      const preset = pick(element.getAttribute(motionAttributes.stagger), PRESETS, 'fade-up');
      // A wipe's cards open one and a half intervals apart, and the row holds still until they land.
      if (preset === 'wipe') wipe(cardsOnScreen(children), stagger(interval, element) * 1.5, element);
      else run(children, { ...revealFrom(preset), stagger: stagger(interval, element) });
    }
  } else {
    const preset = pick(element.getAttribute(motionAttributes.reveal), PRESETS, 'fade-up');
    if (preset === 'wipe') wipe([element]);
    else run([element], revealFrom(preset));
  }

  return () => {
    cancelled = true;
    stopHold();
    stopView();
    context.revert();
    undo();
    element.removeAttribute(state);
  };
}

/**
 * Arms every motion target under `root` (and `root` itself, if it is one).
 * Returns a function that stops watching and reverts everything it armed.
 */
export function applyMotion(root: ParentNode = document, options: ApplyMotionOptions = {}): () => void {
  registerSsxMotion();
  const armed = new Map<Element, () => void>();

  const scan = (node: Node) => {
    if (!(node instanceof Element)) return;
    const found = node.matches(motionSelector) ? [node] : [];
    found.push(...Array.from(node.querySelectorAll(motionSelector)));
    for (const element of found) {
      if (armed.has(element) || element.hasAttribute(motionAttributes.state)) continue;
      armed.set(element, arm(element as HTMLElement));
    }
  };
  if (root instanceof Element) scan(root);
  else Array.from(root.children).forEach(scan);

  let observer: MutationObserver | undefined;
  if (options.observe !== false && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver((records) => {
      for (const record of records) record.addedNodes.forEach(scan);
      armed.forEach((revert, element) => {
        if (element.isConnected) return;
        revert();
        armed.delete(element);
      });
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  return () => {
    observer?.disconnect();
    armed.forEach((revert) => revert());
    armed.clear();
  };
}
