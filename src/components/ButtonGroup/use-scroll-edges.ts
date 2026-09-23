'use client';

// Client: a layout effect that measures a scroller and listens to it.
import * as React from 'react';

/* ---------------------------------------------------------------------------
 * useScrollEdges (internal)
 *
 * Marks a horizontal scroller with where it can still scroll, so CSS can draw
 * an edge fade only on the side that hides something:
 *
 *   data-overflow        the content is wider than the box (it scrolls)
 *   data-overflow-start  something is hidden before the inline start
 *   data-overflow-end    something is hidden past the inline end
 *
 * The attributes are written straight onto the element, not through state, so
 * scrolling never re-renders the component. React does not manage them, so a
 * re-render leaves them alone. It re-measures on scroll, when the box or any
 * direct child resizes (ResizeObserver) and when children are added or removed
 * (MutationObserver). RTL works: `scrollLeft` runs negative there, so its
 * magnitude is used. `scrollFadeClass` (ButtonGroup) paints the fade.
 *
 * React 16.12-safe: plain effects, no React 18 API.
 * ------------------------------------------------------------------------- */

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/** Toggles a boolean data attribute without touching the DOM when it is unchanged. */
function flag(el: HTMLElement, name: string, on: boolean) {
  if (on === el.hasAttribute(name)) return;
  if (on) el.setAttribute(name, '');
  else el.removeAttribute(name);
}

/** Writes the three overflow attributes for `el`'s current scroll position. */
export function markScrollEdges(el: HTMLElement) {
  const max = el.scrollWidth - el.clientWidth;
  // 1px of slack: sub-pixel widths leave a fraction that is not real overflow.
  const overflow = max > 1;
  const pos = Math.abs(el.scrollLeft);
  flag(el, 'data-overflow', overflow);
  flag(el, 'data-overflow-start', overflow && pos > 1);
  flag(el, 'data-overflow-end', overflow && pos < max - 1);
}

/**
 * Keeps `data-overflow*` on the element in `ref` in step with its horizontal
 * scroll. Pass `enabled: false` (a vertical tab list, say) to clear them.
 */
export function useScrollEdges(ref: React.RefObject<HTMLElement | null>, enabled = true) {
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!enabled) {
      flag(el, 'data-overflow', false);
      flag(el, 'data-overflow-start', false);
      flag(el, 'data-overflow-end', false);
      return undefined;
    }

    let frame = 0;
    const measure = () => {
      frame = 0;
      markScrollEdges(el);
    };
    const schedule = () => {
      if (typeof requestAnimationFrame === 'undefined') measure();
      else if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    el.addEventListener('scroll', schedule, { passive: true } as AddEventListenerOptions);

    let ro: ResizeObserver | undefined;
    const observeChildren = () => {
      if (!ro) return;
      ro.disconnect();
      ro.observe(el);
      Array.prototype.forEach.call(el.children, (child: Element) => ro?.observe(child));
    };
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(schedule);
      observeChildren();
    }
    let mo: MutationObserver | undefined;
    if (typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(() => {
        observeChildren();
        schedule();
      });
      mo.observe(el, { childList: true });
    }

    return () => {
      el.removeEventListener('scroll', schedule);
      ro?.disconnect();
      mo?.disconnect();
      if (frame && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(frame);
    };
  }, [ref, enabled]);
}
