'use client';

// Client: a layout effect that measures the scroller and listens to it.
import * as React from 'react';

import { cn } from '../../lib/cn';
import { useId } from '../../lib/use-id';

/* ---------------------------------------------------------------------------
 * TableScrollArea (internal)
 *
 * The one client part of a plain Table: the box that scrolls a wide table
 * sideways INSIDE its frame, and the cues that make that scroll findable.
 *
 *   data-overflow        the table is wider than the box (it scrolls)
 *   data-overflow-start  something is hidden before the inline start
 *   data-overflow-end    something is hidden past the inline end
 *
 * The frame paints an edge shadow only on a side that hides something; a
 * pinned first column draws its own shadow instead of the start one. While
 * the box scrolls it is also a keyboard stop and a named region
 * (`role="region"`, `tabindex="0"`, named by the table's caption or
 * `label`), so a keyboard user can reach and arrow through it (T3). A table
 * that fits is not a region and not a tab stop.
 *
 * The attributes are written straight onto the element, not through state,
 * so scrolling never re-renders. Server-rendered markup is the plain scroller;
 * the cues arrive with hydration. React 16.12-safe: plain effects, with a
 * window `resize` fallback where ResizeObserver is missing.
 * ------------------------------------------------------------------------- */

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

function flag(el: HTMLElement, name: string, on: boolean) {
  if (on === el.hasAttribute(name)) return;
  if (on) el.setAttribute(name, '');
  else el.removeAttribute(name);
}

function attr(el: HTMLElement, name: string, value: string | null) {
  if (el.getAttribute(name) === value) return;
  if (value == null) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

export type TableScrollAreaProps = {
  /** Draw the frame (hairline border, large radius, the page surface). */
  framed: boolean;
  /** The first column is pinned: it draws the start shadow itself. */
  pinned: boolean;
  /** Names the region when there is no caption. */
  label?: string;
  /** Class for the scroll container (Table's `containerClassName`). */
  className?: string;
  children: React.ReactNode;
};

const fadeBase = cn(
  'pointer-events-none absolute inset-y-0 z-[3] w-6 opacity-0',
  // A soft shadow from the edge inward, in the scrim ink so it reads in dark mode too.
  'from-(--table-edge-shadow) to-transparent',
  'transition-opacity duration-(--motion-duration-fast) ease-productive-in-out motion-reduce:transition-none',
);

export function TableScrollArea({ framed, pinned, label, className, children }: TableScrollAreaProps) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const captionId = `${useId()}-caption`;

  useIsoLayoutEffect(() => {
    const el = scrollRef.current;
    const frame = frameRef.current;
    if (!el || !frame) return undefined;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const max = el.scrollWidth - el.clientWidth;
      // 1px of slack: sub-pixel widths leave a fraction that is not overflow.
      const overflow = max > 1;
      const pos = Math.abs(el.scrollLeft); // negative in RTL
      for (const node of [el, frame]) {
        flag(node, 'data-overflow', overflow);
        flag(node, 'data-overflow-start', overflow && pos > 1);
        flag(node, 'data-overflow-end', overflow && pos < max - 1);
      }
      // A scroller is a stop and a named region only while it scrolls.
      let name: string | null = null;
      let labelledBy: string | null = null;
      if (overflow) {
        const caption = el.querySelector('caption');
        if (caption && (caption.textContent ?? '').trim() !== '') {
          if (!caption.id) caption.id = captionId;
          labelledBy = caption.id;
        } else {
          name = label ?? 'Table';
        }
      }
      attr(el, 'role', overflow ? 'region' : null);
      attr(el, 'tabindex', overflow ? '0' : null);
      attr(el, 'aria-labelledby', labelledBy);
      attr(el, 'aria-label', name);
    };
    const schedule = () => {
      if (typeof requestAnimationFrame === 'undefined') measure();
      else if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    el.addEventListener('scroll', schedule, { passive: true } as AddEventListenerOptions);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(schedule);
      ro.observe(el);
      const table = el.firstElementChild;
      if (table) ro.observe(table);
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', schedule);
    }
    return () => {
      el.removeEventListener('scroll', schedule);
      if (ro) ro.disconnect();
      else if (typeof window !== 'undefined') window.removeEventListener('resize', schedule);
      if (raf && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf);
    };
  });

  return (
    <div
      ref={frameRef}
      data-slot="table-frame"
      data-framed={framed || undefined}
      className={cn(
        'group/table-frame relative w-full max-w-full min-w-0',
        // The edge-shadow ink: the scrim on light; on dark a black shadow
        // vanishes into the surface, so a faint light edge instead.
        '[--table-edge-shadow:color-mix(in_srgb,var(--surface-overlay-scrim)_32%,transparent)]',
        'dark:[--table-edge-shadow:color-mix(in_srgb,var(--color-content)_22%,transparent)]',
        framed && 'overflow-hidden rounded-lg border border-border-decorative bg-surface',
      )}
    >
      <div
        ref={scrollRef}
        data-slot="table-container"
        data-framed={framed || undefined}
        className={cn(
          'relative w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain',
          'outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-border-focus/50',
          framed && 'rounded-[inherit]',
          className,
        )}
      >
        {children}
      </div>
      {pinned ? null : (
        <span
          aria-hidden="true"
          data-slot="table-fade-start"
          className={cn(
            fadeBase,
            'start-0 bg-linear-to-r rtl:bg-linear-to-l',
            'group-data-[overflow-start]/table-frame:opacity-100',
            // A sticky start column draws its own shadow.
            'group-has-[[data-sticky=start]]/table-frame:hidden',
          )}
        />
      )}
      <span
        aria-hidden="true"
        data-slot="table-fade-end"
        className={cn(
          fadeBase,
          'end-0 bg-linear-to-l rtl:bg-linear-to-r',
          'group-data-[overflow-end]/table-frame:opacity-100',
          'group-has-[[data-sticky=end]]/table-frame:hidden',
        )}
      />
    </div>
  );
}
