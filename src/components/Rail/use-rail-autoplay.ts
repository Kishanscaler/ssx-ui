'use client';

// Client: timers, a requestAnimationFrame loop, and the observers that pause them.
import * as React from 'react';

import { onSideways } from './on-sideways';
import { jumpPos, readPos, setWidth } from './rail-geometry';

/* ---------------------------------------------------------------------------
 * The Rail's autoplay (internal): `step` and `ticker`.
 *
 * STEP (useRailAutoplay): one page on every `interval`, the current dot
 * filling as it waits, stopping at the last page (or going round, looped).
 *   - It stops for good when the visitor takes over: a sideways swipe, drag,
 *     wheel or trackpad stroke on the row (onSideways; scrolling the page past
 *     it does not count), or a dot or an arrow.
 *   - It pauses (and picks up where it was, its dot's fill in step) while the
 *     row is off screen (IntersectionObserver, 40% in view; without one it
 *     counts as on screen), while the tab is hidden, and while focus is inside
 *     the row (a keyboard user is reading it).
 *   - Not on hover: a reader's pointer rests on the row, and a row with
 *     controls that stops under it read as broken (the SSB page, 2026-10-13).
 *   - Never under reduced motion (the Rail does not enable it).
 *
 * TICKER (useRailTicker): the row crawls at `speed` px/s, moved a little every
 * frame on a real scroller over the looped copies and wrapped by one set's
 * width, so swiping, a trackpad, the arrows and the dots all keep working on
 * it. It holds still while focus is inside, for `RAIL_TOUCH_HOLD_MS` after a
 * touch, press or wheel on it (`RAIL_MOVE_HOLD_MS` after a dot or arrow), off
 * screen, on a hidden tab, and while the row (or the Rail around it) carries
 * `data-ssx-hold` (the motion layer sets it while the cards wipe open) or
 * `data-paused` (a page's pause button). Under reduced motion it never starts:
 * the row is a plain scroller.
 * ------------------------------------------------------------------------- */

/** ms per page for `autoplay="step"`. No motion token is this long; Apple's galleries hold a slide about 6s. */
export const railStepInterval = 6000;
/** px/s for `autoplay="ticker"`: a slow crawl that can still be read (the SSB page's). */
export const railTickerSpeed = 32;
/** The ticker holds this long after a touch, press or wheel on it. */
export const RAIL_TOUCH_HOLD_MS = 2500;
/** The ticker holds this long after a dot or an arrow moved it. */
export const RAIL_MOVE_HOLD_MS = 1500;

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
  /** Counting down right now (playing, on screen, tab visible, no focus inside). */
  running: boolean;
  /** Stop for good (a dot or an arrow). */
  stop: () => void;
}

export function useRailAutoplay(
  trackRef: React.RefObject<HTMLUListElement | null>,
  { enabled, interval, active, pages, loop, atEnd, advance }: RailAutoplayOptions,
): RailAutoplay {
  const [playing, setPlaying] = React.useState(true);
  const visible = useInView(trackRef, 0.4, enabled);
  const hidden = usePageHidden(enabled);
  const focused = useFocusWithin(trackRef, enabled);
  const running = enabled && playing && visible && !hidden && !focused;

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
    const id = window.setTimeout(() => {
      remaining.current = interval;
      if (last) setPlaying(false);
      else advanceRef.current();
    }, Math.max(0, remaining.current));
    return () => {
      window.clearTimeout(id);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [running, active, interval, last]);

  const stop = React.useCallback(() => setPlaying(false), []);
  return { playing: enabled && playing, running, stop };
}

export interface RailTickerOptions {
  /** `autoplay="ticker"` and motion allowed. */
  enabled: boolean;
  /** px/s. */
  speed: number;
}

export function useRailTicker(
  trackRef: React.RefObject<HTMLUListElement | null>,
  rootRef: React.RefObject<HTMLElement | null>,
  { enabled, speed }: RailTickerOptions,
): { hold: (ms: number) => void } {
  const holdUntil = React.useRef(0);
  const visible = useInView(trackRef, 0, enabled);
  const hidden = usePageHidden(enabled);

  React.useEffect(() => {
    const el = trackRef.current;
    if (!enabled || !el || !visible || hidden) return undefined;
    const root = rootRef.current;
    const held = (attr: string) => el.hasAttribute(attr) || Boolean(root && root.hasAttribute(attr));

    let pos = readPos(el);
    let last = 0;
    let frame = 0;
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      const dt = last ? Math.min(time - last, 64) / 1000 : 0;
      last = time;
      const w = setWidth(el);
      const busy =
        !w ||
        el.contains(document.activeElement) ||
        time < holdUntil.current ||
        held('data-ssx-hold') ||
        held('data-paused');
      if (busy) {
        pos = readPos(el); // pick up wherever the visitor left it
        return;
      }
      pos += speed * dt;
      if (pos >= w) pos -= w;
      jumpPos(el, pos);
    };
    frame = requestAnimationFrame(tick);

    const touch = () => {
      holdUntil.current = performance.now() + RAIL_TOUCH_HOLD_MS;
    };
    el.addEventListener('pointerdown', touch);
    el.addEventListener('touchmove', touch, { passive: true });
    el.addEventListener('wheel', touch, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointerdown', touch);
      el.removeEventListener('touchmove', touch);
      el.removeEventListener('wheel', touch);
    };
  }, [trackRef, rootRef, enabled, speed, visible, hidden]);

  const hold = React.useCallback((ms: number) => {
    holdUntil.current = performance.now() + ms;
  }, []);
  return { hold };
}
