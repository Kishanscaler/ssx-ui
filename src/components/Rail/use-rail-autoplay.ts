'use client';

// Client: a timer, and the observers that pause it.
import * as React from 'react';

import { isRowHeld, motionAttributes } from '../../motion/attributes';
import { onSideways } from './on-sideways';

/* ---------------------------------------------------------------------------
 * The Rail's autoplay (internal): `step`.
 *
 * (A continuous crawl is not a Rail mode: that is `Marquee`, which measures
 * its repeats, brakes on hover, scrubs by hand and honours reduced motion.)
 *
 * STEP (useRailAutoplay): one page on every `interval`, the current dot
 * filling as it waits, stopping at the last page (or going round, looped).
 *   - It stops for good when the visitor takes over: a sideways swipe, drag,
 *     wheel or trackpad stroke on the row (onSideways; scrolling the page past
 *     it does not count), or a dot or an arrow.
 *   - It pauses (and picks up where it was, its dot's fill in step) while the
 *     row is off screen (IntersectionObserver, 40% in view; without one it
 *     counts as on screen), while the tab is hidden, while focus is inside
 *     the row (a keyboard user is reading it), and while the row or an
 *     ancestor carries `data-ssx-hold` (the motion layer's entrance: the cards
 *     open on the margin first; `isRowHeld`, watched by a MutationObserver and
 *     checked again when the wait ends, for a browser without one).
 *   - The Rail's pause button stops it (`stop`) and starts it again (`play`).
 *   - Not on hover: a reader's pointer rests on the row, and a row with
 *     controls that stops under it read as broken (the SSB page, 2026-10-13).
 *   - Never under reduced motion (the Rail does not enable it).
 *
 * `useInView` and `usePageHidden` are shared with the Breaker's turn.
 * ------------------------------------------------------------------------- */

/** ms per page for `autoplay="step"`. No motion token is this long; Apple's galleries hold a slide about 6s. */
export const railStepInterval = 6000;
/** A step whose wait ended under a hold looks again this often (a browser with no MutationObserver). */
const RAIL_HOLD_RECHECK_MS = 250;

/** Whether `ref` is on screen (at least `threshold` of it). Without IntersectionObserver: always. */
export function useInView(ref: React.RefObject<Element | null>, threshold: number, enabled: boolean): boolean {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setVisible(entry.isIntersecting);
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, enabled]);
  return visible;
}

/** Whether the tab is hidden. */
export function usePageHidden(enabled: boolean): boolean {
  const [hidden, setHidden] = React.useState(false);
  React.useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined;
    const read = () => setHidden(Boolean(document.hidden));
    read();
    document.addEventListener('visibilitychange', read);
    return () => document.removeEventListener('visibilitychange', read);
  }, [enabled]);
  return hidden;
}

/** Whether focus is inside `ref`. */
function useFocusWithin(ref: React.RefObject<HTMLElement | null>, enabled: boolean): boolean {
  const [focused, setFocused] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return undefined;
    const onIn = () => setFocused(true);
    const onOut = (e: FocusEvent) => {
      if (e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return;
      setFocused(false);
    };
    el.addEventListener('focusin', onIn);
    el.addEventListener('focusout', onOut);
    return () => {
      el.removeEventListener('focusin', onIn);
      el.removeEventListener('focusout', onOut);
    };
  }, [ref, enabled]);
  return focused;
}

/**
 * Whether the row (or an ancestor) carries the motion layer's row hold, `data-ssx-hold`. Watched
 * with a MutationObserver on the document, filtered to that one attribute; without one it reads
 * once (the step timer checks again when its wait ends).
 */
function useRowHeld(ref: React.RefObject<HTMLElement | null>, enabled: boolean): boolean {
  const [held, setHeld] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return undefined;
    const read = () => setHeld(isRowHeld(el));
    read();
    if (typeof MutationObserver === 'undefined') return undefined;
    const observer = new MutationObserver(read);
    observer.observe(el.ownerDocument.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: [motionAttributes.rowHold],
    });
    return () => observer.disconnect();
  }, [ref, enabled]);
  return held;
}

export interface RailAutoplayOptions {
  /** `autoplay="step"`, more than one page, and motion allowed. */
  enabled: boolean;
  interval: number;
  active: number;
  pages: number;
  loop: boolean;
  atEnd: boolean;
  /** Move one page on (a looped row wraps). */
  advance: () => void;
}

export interface RailAutoplay {
  /** Still playing: the visitor has not taken over and it has not played through. */
  playing: boolean;
  /** Counting down right now (playing, on screen, tab visible, no focus inside, no row hold). */
  running: boolean;
  /** Stop (a dot, an arrow, the pause button). */
  stop: () => void;
  /** Play again (the pause button). */
  play: () => void;
}

export function useRailAutoplay(
  trackRef: React.RefObject<HTMLUListElement | null>,
  { enabled, interval, active, pages, loop, atEnd, advance }: RailAutoplayOptions,
): RailAutoplay {
  const [playing, setPlaying] = React.useState(true);
  const visible = useInView(trackRef, 0.4, enabled);
  const hidden = usePageHidden(enabled);
  const focused = useFocusWithin(trackRef, enabled);
  const held = useRowHeld(trackRef, enabled);
  const running = enabled && playing && visible && !hidden && !focused && !held;

  // The visitor moving the row sideways takes over.
  React.useEffect(() => {
    const el = trackRef.current;
    if (!enabled || !el) return undefined;
    return onSideways(el, () => setPlaying(false));
  }, [trackRef, enabled]);

  const advanceRef = React.useRef(advance);
  advanceRef.current = advance;
  const last = !loop && (atEnd || active >= pages - 1);

  // What is left of this page's wait, so a pause (off screen, a hidden tab) resumes where it was,
  // in step with the dot's fill, which is frozen meanwhile. Declared before the timer: on a new page
  // React runs the timer's cleanup, then this, then the timer, which then waits a full interval.
  const remaining = React.useRef(interval);
  React.useEffect(() => {
    remaining.current = interval;
  }, [active, interval]);

  React.useEffect(() => {
    if (!running) return undefined;
    const started = Date.now();
    let id = 0;
    const fire = () => {
      // Held since the observer last looked (or there is none): wait for the hold to go.
      if (isRowHeld(trackRef.current)) {
        id = window.setTimeout(fire, RAIL_HOLD_RECHECK_MS);
        return;
      }
      remaining.current = interval;
      if (last) setPlaying(false);
      else advanceRef.current();
    };
    id = window.setTimeout(fire, Math.max(0, remaining.current));
    return () => {
      window.clearTimeout(id);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [trackRef, running, active, interval, last]);

  const stop = React.useCallback(() => setPlaying(false), []);
  const play = React.useCallback(() => setPlaying(true), []);
  return { playing: enabled && playing, running, stop, play };
}
