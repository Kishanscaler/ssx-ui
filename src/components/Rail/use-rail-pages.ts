'use client';

// Client: scroll and resize listeners that read the Rail's pages off its scroller.
import * as React from 'react';

import {
  RAIL_PENDING_MS,
  columnsInView,
  itemStep,
  jumpPos,
  maxPos,
  readPos,
  setWidth,
  writePos,
} from './rail-geometry';

/* ---------------------------------------------------------------------------
 * useRailPages (internal)
 *
 * A page is what the row shows at once: the columns that fit whole between
 * its content edge and the window's edge, measured from the row (so a phone
 * has more pages than a desktop), and measured again whenever the row or its
 * first item changes size (ResizeObserver; without one, on window resize).
 * The dots are pages; the arrows and the stepped autoplay move a page at a
 * time.
 *
 * Where the row is comes from its scroll position alone, so a swipe, a dot,
 * an arrow and the autoplay always agree:
 *   - `active`: the page on show, the nearest one (the row rests on its
 *     stops). State: it changes once a page.
 *   - A move the visitor asked for (`goTo`, `step`) lights its dot at once and
 *     holds it while the row travels (reading the row on the way lit every
 *     dot it passed: the dots juddered), until the row is there, at its end,
 *     or `RAIL_PENDING_MS` has passed.
 *   - A row that reaches its end before its last pages reach the start: the
 *     end is the last page, and a dot chosen there stays lit while the row
 *     stays there.
 *
 * Looped (the items repeated once, the copies marked `data-copy`): the
 * position wraps by one set's width, so the row runs on forever forwards;
 * stepping past the last page runs on into the copy and wraps, and stepping
 * back from the first jumps into the copy first. No smooth scrolling under
 * reduced motion.
 * ------------------------------------------------------------------------- */

export interface RailPagesOptions {
  /** The real columns (items, or items / 2 rounded up on two rows), copies not counted. */
  columns: number;
  /** The row repeats its items once (the copies carry `data-copy`). */
  loop: boolean;
  /** Move instantly, never smoothly. */
  reduced: boolean;
}

export interface RailPages {
  /** How many pages: one dot each. */
  pages: number;
  /** The page on show, 0-based. */
  active: number;
  /** At the row's start (never on a looped row). */
  atStart: boolean;
  /** At the row's end, or on its last page (never on a looped row). */
  atEnd: boolean;
  /** Scroll to a page. */
  goTo: (page: number) => void;
  /** Scroll a page on (1) or back (-1); a looped row wraps. */
  step: (dir: 1 | -1) => void;
}

interface State {
  per: number;
  active: number;
  atStart: boolean;
  atEnd: boolean;
}

const same = (a: State, b: State) =>
  a.per === b.per && a.active === b.active && a.atStart === b.atStart && a.atEnd === b.atEnd;

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function useRailPages(
  trackRef: React.RefObject<HTMLUListElement | null>,
  { columns, loop, reduced }: RailPagesOptions,
): RailPages {
  const cols = Math.max(1, columns);
  const [state, setState] = React.useState<State>({
    per: 1,
    active: 0,
    atStart: true,
    atEnd: cols <= 1,
  });
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const pending = React.useRef<{ index: number; until: number } | null>(null);
  const chosenAtEnd = React.useRef<number | null>(null);

  const pagesOf = (per: number) => Math.max(1, Math.ceil(cols / per));

  // The state last handed to React. Every change goes through `set`, which skips one that changes
  // nothing BEFORE calling setState: React can render a component once more for a same-value
  // update (its eager bail-out only applies to a fiber with no update queued), and the row is
  // measured on every scrolled frame. Only a change of page (or of the row's ends, or of its
  // pages) reaches React.
  const asked = React.useRef(state);
  const set = React.useCallback((next: State) => {
    if (same(asked.current, next)) return;
    asked.current = next;
    setState(next);
  }, []);

  const measure = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const step = itemStep(el);
    if (!step) return;
    const per = Math.min(columnsInView(el, step), cols);
    const pages = Math.max(1, Math.ceil(cols / per));
    const travel = step * per;
    const w = loop ? setWidth(el) : 0;
    let pos = readPos(el);
    // The seam: past one set's width the row is showing the copy, which is the start again.
    if (w && pos >= w) {
      pos -= w;
      jumpPos(el, pos);
    }
    const atEnd = !w && pos >= maxPos(el) - 1;
    const atStart = !w && pos <= 1;
    const at = pos / travel;
    const wrap = (i: number) => (w ? ((i % pages) + pages) % pages : Math.min(pages - 1, Math.max(0, i)));

    const going = pending.current;
    if (going) {
      const here = wrap(Math.round(at));
      if (here !== going.index && !atEnd && now() < going.until) {
        set({ per, active: going.index, atStart, atEnd });
        return;
      }
      pending.current = null;
      // A page chosen that the row can only reach by scrolling to its end: its dot stays lit.
      if (atEnd) {
        chosenAtEnd.current = going.index;
        set({ per, active: going.index, atStart, atEnd });
        return;
      }
    }
    if (!atEnd) chosenAtEnd.current = null;
    else if (chosenAtEnd.current !== null) {
      set({ per, active: Math.min(pages - 1, chosenAtEnd.current), atStart, atEnd });
      return;
    }
    if (atEnd) {
      set({ per, active: pages - 1, atStart, atEnd });
      return;
    }
    set({ per, active: wrap(Math.round(at)), atStart, atEnd });
  }, [trackRef, cols, loop, set]);

  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    let frame = 0;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };
    measure();
    el.addEventListener('scroll', schedule, { passive: true });
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(schedule);
      observer.observe(el);
      const first = el.firstElementChild;
      if (first) observer.observe(first);
    } else {
      window.addEventListener('resize', schedule);
    }
    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener('scroll', schedule);
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', schedule);
    };
  }, [trackRef, measure]);

  const travel = (el: HTMLElement) => itemStep(el) * stateRef.current.per;

  const goTo = React.useCallback(
    (page: number) => {
      const el = trackRef.current;
      if (!el) return;
      const pages = pagesOf(stateRef.current.per);
      const index = Math.min(pages - 1, Math.max(0, Math.floor(page) || 0));
      pending.current = { index, until: now() + RAIL_PENDING_MS };
      set({ ...asked.current, active: index });
      const target = index * travel(el);
      writePos(el, loop ? target : Math.min(target, maxPos(el)), !reduced);
    },
    [trackRef, cols, loop, reduced],
  );

  const step = React.useCallback(
    (dir: 1 | -1) => {
      const el = trackRef.current;
      if (!el) return;
      const { active, per } = stateRef.current;
      const pages = pagesOf(per);
      const w = loop ? setWidth(el) : 0;
      if (w && dir > 0 && active >= pages - 1) {
        // On into the copy's start, which the seam turns back into the row's start.
        pending.current = { index: 0, until: now() + RAIL_PENDING_MS };
        set({ ...asked.current, active: 0 });
        writePos(el, w, !reduced);
        return;
      }
      if (w && dir < 0 && active <= 0) {
        // Back from the start: into the copy first (the same picture), then back from there.
        jumpPos(el, readPos(el) + w);
        pending.current = { index: pages - 1, until: now() + RAIL_PENDING_MS };
        set({ ...asked.current, active: pages - 1 });
        writePos(el, (pages - 1) * travel(el), !reduced);
        return;
      }
      goTo(active + dir);
    },
    [trackRef, cols, loop, reduced, goTo],
  );

  return {
    pages: pagesOf(state.per),
    active: state.active,
    atStart: state.atStart,
    atEnd: state.atEnd,
    goTo,
    step,
  };
}
