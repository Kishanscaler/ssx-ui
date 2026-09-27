'use client';

// Client: this module is a hook (state, effects, DOM listeners and observers).
import * as React from 'react';

/* ---------------------------------------------------------------------------
 * useStickToBottom
 *
 * Keeps a scroller pinned to its end while content arrives (a streaming chat
 * reply), and lets go the moment the reader scrolls up to read something
 * earlier. It never pulls them back down; they re-engage it by scrolling
 * back to the end (or by calling `scrollToBottom`, the "latest" button).
 *
 *   const { scrollRef, contentRef, isAtBottom, scrollToBottom } = useStickToBottom();
 *   <div ref={scrollRef} style={{ overflowY: 'auto' }}>
 *     <div ref={contentRef}>{messages}</div>
 *   </div>
 *
 * HOW IT DECIDES. One flag, `stuck`, starts true.
 *   - Content or scroller resizes (ResizeObserver on both) while stuck: the
 *     scroller jumps to the end, once per animation frame however many
 *     resizes land in it (one read of scrollHeight, one write of scrollTop:
 *     no layout thrash). Instant, never smooth: a smooth scroll per chunk
 *     would always be chasing the stream.
 *   - Released (stuck = false) only by something the READER did:
 *       a wheel turned upward, an upward keyboard scroll (ArrowUp, PageUp,
 *       Home, Shift+Space) in the scroller, or a scroll event whose
 *       scrollTop went DOWN while the content did not shrink (a drag of the
 *       scrollbar or a touch pan up). Our own jumps only ever move scrollTop
 *       up the page, so they can never release it; content that SHRINKS
 *       (a collapsed section) clamps scrollTop down without releasing it.
 *   - Re-engaged (stuck = true) whenever a scroll lands within `threshold`
 *     px of the end, however it got there.
 *   - While a finger or the scrollbar is held (touchstart / a mousedown on
 *     the scroller itself), no programmatic scroll is made: the reader is
 *     steering.
 *
 * `isAtBottom` is React state and changes only when the flag flips, so a
 * scroll re-renders nothing. `scrollToBottom()` re-engages and scrolls,
 * smoothly unless the reader prefers reduced motion (the media query, or a
 * `data-motion="reduce"` ancestor), or `{ behavior: 'auto' }`.
 *
 * THE SCROLLER can be any element, or the page: pass `document.documentElement`
 * (or `document.body`) through `scrollRef` and the listeners go on `window`.
 *
 * React 16.12-safe: useState, useEffect, useLayoutEffect (isomorphic), no
 * newer APIs. Nothing runs on the server.
 * ------------------------------------------------------------------------- */

export type StickToBottomBehavior = 'auto' | 'smooth';

export type UseStickToBottomOptions = {
  /**
   * How close to the end (px) still counts as "at the bottom". A little
   * slack, so a reader who scrolls back to within a line of the end is
   * pinned again.
   *
   * @default 32
   */
  threshold?: number;
  /**
   * Start pinned (a conversation opens on its latest message).
   *
   * @default true
   */
  initial?: boolean;
  /** Called whenever the pinned state flips. */
  onChange?: (atBottom: boolean) => void;
};

export type UseStickToBottomResult = {
  /** Attach to the scrolling element (or pass the page's root element). */
  scrollRef: (node: HTMLElement | null) => void;
  /** Attach to the element that grows as content arrives. */
  contentRef: (node: HTMLElement | null) => void;
  /** Pinned to the end: new content will keep it there. */
  isAtBottom: boolean;
  /** Re-engage and scroll to the end. Smooth unless reduced motion. */
  scrollToBottom: (options?: { behavior?: StickToBottomBehavior }) => void;
  /** Stop following, as if the reader had scrolled up. */
  release: () => void;
  /** The flag, read synchronously (for code that runs outside render). */
  isStuck: () => boolean;
};

/* `useLayoutEffect` warns during server rendering on React < 19. */
const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

const UP_KEYS = new Set(['ArrowUp', 'PageUp', 'Home']);

function isPageScroller(el: HTMLElement): boolean {
  return typeof document !== 'undefined' && (el === document.documentElement || el === document.body);
}

/** The element whose scrollTop / scrollHeight describe the scroll. */
function metricsOf(el: HTMLElement): HTMLElement {
  if (isPageScroller(el)) return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
  return el;
}

function distanceFromBottom(el: HTMLElement): number {
  const m = metricsOf(el);
  return m.scrollHeight - m.scrollTop - m.clientHeight;
}

/** Something between the wheel's target and the scroller can still scroll up. */
function innerScrollerTakes(from: EventTarget | null, scroller: HTMLElement): boolean {
  let el = from instanceof Element ? from : null;
  while (el && el !== scroller && el !== document.body) {
    if (el.scrollTop > 0 && el.scrollHeight > el.clientHeight) {
      const { overflowY } = getComputedStyle(el);
      if (overflowY === 'auto' || overflowY === 'scroll') return true;
    }
    el = el.parentElement;
  }
  return false;
}

export function prefersReducedMotion(from?: Element | null): boolean {
  if (from && typeof from.closest === 'function' && from.closest('[data-motion="reduce"]')) return true;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const frame = (cb: () => void): (() => void) => {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    const id = window.requestAnimationFrame(cb);
    return () => window.cancelAnimationFrame(id);
  }
  const id = setTimeout(cb, 16);
  return () => clearTimeout(id);
};

export function useStickToBottom(options: UseStickToBottomOptions = {}): UseStickToBottomResult {
  const { threshold = 32, initial = true, onChange } = options;
  // State, not refs: the effects must re-run when the nodes first exist.
  const [scroller, setScroller] = React.useState<HTMLElement | null>(null);
  const [content, setContent] = React.useState<HTMLElement | null>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(initial);

  const stuck = React.useRef(initial);
  const holding = React.useRef(false);
  const cancelFrame = React.useRef<(() => void) | null>(null);
  const latest = React.useRef({ threshold, onChange });
  latest.current = { threshold, onChange };

  const setStuck = React.useCallback((next: boolean) => {
    if (stuck.current === next) return;
    stuck.current = next;
    setIsAtBottom(next);
    latest.current.onChange?.(next);
  }, []);

  /** Jump to the end on the next frame (coalesced). */
  const pin = React.useCallback(() => {
    if (!scroller || cancelFrame.current) return;
    let ran = false;
    const cancel = frame(() => {
      ran = true;
      cancelFrame.current = null;
      if (!stuck.current || holding.current) return;
      const m = metricsOf(scroller);
      const end = m.scrollHeight - m.clientHeight;
      if (end - m.scrollTop > 0.5) m.scrollTop = end;
    });
    // (A frame that ran synchronously leaves nothing pending.)
    if (!ran) cancelFrame.current = cancel;
  }, [scroller]);

  const scrollToBottom = React.useCallback(
    (opts: { behavior?: StickToBottomBehavior } = {}) => {
      if (!scroller) return;
      setStuck(true);
      const m = metricsOf(scroller);
      const top = m.scrollHeight - m.clientHeight;
      const behavior = opts.behavior ?? (prefersReducedMotion(scroller) ? 'auto' : 'smooth');
      if (behavior === 'smooth' && typeof m.scrollTo === 'function') {
        m.scrollTo({ top, behavior: 'smooth' });
      } else {
        m.scrollTop = top;
      }
    },
    [scroller, setStuck],
  );

  const release = React.useCallback(() => setStuck(false), [setStuck]);

  // Land on the end at mount (and when a new scroller is attached).
  useIsoLayoutEffect(() => {
    if (!scroller || !stuck.current) return;
    const m = metricsOf(scroller);
    m.scrollTop = m.scrollHeight - m.clientHeight;
  }, [scroller]);

  // The reader's input: scroll, wheel, keys, touch, scrollbar drags.
  React.useEffect(() => {
    if (!scroller) return undefined;
    const target: HTMLElement | Window = isPageScroller(scroller) ? window : scroller;
    const m0 = metricsOf(scroller);
    let lastTop = m0.scrollTop;
    let lastHeight = m0.scrollHeight;
    let active = true;

    const onScroll = () => {
      const m = metricsOf(scroller);
      const top = m.scrollTop;
      const height = m.scrollHeight;
      if (m.scrollHeight - top - m.clientHeight <= latest.current.threshold) {
        setStuck(true);
      } else if (top < lastTop - 1 && height >= lastHeight) {
        // Moved up the page, and not because the content shrank.
        setStuck(false);
      }
      lastTop = top;
      lastHeight = height;
    };
    // A smooth scroll to the end that something cut short (a focus scroll,
    // a layout shift) while still pinned: finish the job.
    const onScrollEnd = () => {
      if (stuck.current && !holding.current && distanceFromBottom(scroller) > latest.current.threshold) pin();
    };
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY >= 0 || metricsOf(scroller).scrollTop <= 0) return;
      // A wheel over something that scrolls on its own (the composer's
      // textarea, a long code block) moves that, not the conversation.
      if (innerScrollerTakes(event.target, scroller)) return;
      setStuck(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      // Only keys that scroll THIS scroller: a keypress in a text field
      // inside it (the composer) is typing, not scrolling.
      const el = event.target as HTMLElement | null;
      if (el && el !== scroller && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (!(UP_KEYS.has(event.key) || (event.key === ' ' && event.shiftKey))) return;
      // After the event has run its course: a control inside that used the
      // key (arrow keys between the thumbs, a menu) prevented it, and then
      // nothing scrolled. React handles the event at its root, after us.
      setTimeout(() => {
        if (active && !event.defaultPrevented) setStuck(false);
      }, 0);
    };
    const hold = () => {
      holding.current = true;
    };
    const letGo = () => {
      if (!holding.current) return;
      holding.current = false;
      // Where the reader let go decides it: at the end, pinned again.
      if (distanceFromBottom(scroller) <= latest.current.threshold) setStuck(true);
    };
    const onMouseDown = (event: MouseEvent) => {
      // A press on the scroller itself, not its content, is the scrollbar.
      if (event.target === scroller) hold();
    };

    const passive = { passive: true } as AddEventListenerOptions;
    target.addEventListener('scroll', onScroll, passive);
    target.addEventListener('scrollend', onScrollEnd, passive);
    target.addEventListener('wheel', onWheel as EventListener, passive);
    target.addEventListener('keydown', onKeyDown as EventListener);
    target.addEventListener('touchstart', hold, passive);
    target.addEventListener('mousedown', onMouseDown as EventListener, passive);
    window.addEventListener('touchend', letGo, passive);
    window.addEventListener('touchcancel', letGo, passive);
    window.addEventListener('mouseup', letGo, passive);
    return () => {
      active = false;
      target.removeEventListener('scroll', onScroll);
      target.removeEventListener('scrollend', onScrollEnd);
      target.removeEventListener('wheel', onWheel as EventListener);
      target.removeEventListener('keydown', onKeyDown as EventListener);
      target.removeEventListener('touchstart', hold);
      target.removeEventListener('mousedown', onMouseDown as EventListener);
      window.removeEventListener('touchend', letGo);
      window.removeEventListener('touchcancel', letGo);
      window.removeEventListener('mouseup', letGo);
    };
  }, [scroller, setStuck, pin]);

  // Content arriving, or the scroller changing size: follow, if pinned.
  React.useEffect(() => {
    if (!scroller || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      if (stuck.current) pin();
    });
    if (content) observer.observe(content);
    if (!isPageScroller(scroller)) observer.observe(scroller);
    return () => observer.disconnect();
  }, [scroller, content, pin]);

  React.useEffect(
    () => () => {
      cancelFrame.current?.();
      cancelFrame.current = null;
    },
    [],
  );

  const isStuck = React.useCallback(() => stuck.current, []);

  return { scrollRef: setScroller, contentRef: setContent, isAtBottom, scrollToBottom, release, isStuck };
}
