'use client';

// Client: a layout effect that measures the row to repeat it enough to fill the box.
import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { composeRefs } from '../../lib/compose-refs';
import { useMarqueeHover, type MarqueeHover } from './use-marquee-hover';
import { useMarqueeScrub } from './use-marquee-scrub';

/* ---------------------------------------------------------------------------
 * Marquee
 *
 * A row that slides past on a loop: a logo strip, a row of pills, a ticker of
 * outcomes. Pass the items as DIRECT children; the row owns the gap.
 *
 *   <Marquee aria-label="Hiring partners">
 *     {partners.map((p) => <img key={p.id} src={p.logo} alt={p.name} />)}
 *   </Marquee>
 *
 * How it stays seamless: the track is two identical halves and slides by half
 * its width, so the end of one half meets the start of the next. Each item
 * carries the gap AFTER it (the last one too), so the seam is gap-matched. Each
 * half repeats the row as often as it takes to cover the box (a five-pill row
 * is ~485px; a 1584px screen needs four of it), measured, and re-measured on
 * resize, so no gap ever opens at the trailing edge.
 *
 * Pace (`speed`): `slow` · `medium` (default) · `fast` · `ultrafast`, each twice
 * the one before (about 30 · 60 · 120 · 240px/s on a pill row). The token is the
 * time ONE item takes to pass (`--marquee-pace-*`), times the items in one half,
 * so a long row and a short one move at the same speed.
 *
 * By hand (`scrollable`, on by default): drag it with a mouse, swipe it with a
 * finger, scroll it sideways with a trackpad or shift + wheel, either way, for
 * as long as you like; a flick glides to a stop. It stays seamless because the
 * hand moves the animation's own clock (see `use-marquee-scrub.ts`). A tap or
 * click on an item inside still works; vertical page scrolling is untouched.
 *
 * Accessibility:
 *   - Only the first copy is exposed. Every repeat is `aria-hidden` and `inert`
 *     (no duplicate tab stops, no duplicate announcements).
 *   - Hovered, it brakes smoothly to a stop or to a crawl (`hover`); with focus
 *     inside it always brakes to a stop. It stops on `paused`, which is how a page wires its own
 *     pause button (WCAG 2.2.2 for motion that runs past five seconds).
 *   - Reduced motion (the OS, or a `data-motion="reduce"` ancestor): it never
 *     moves on its own and a flick does not glide; it still moves by hand.
 *   - Tabbing to an item out of view brings it into view.
 *
 * Right to left: it runs the other way, mirrored, and stays seamless.
 * ------------------------------------------------------------------------- */

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

// `contain: inline-size`: the box's width never depends on the row inside it.
// Without it, in a shrink-to-fit parent (a flex item, an inline-block) every
// repeat would widen the box, which would ask for another repeat, forever.
export const marqueeVariants = cva(
  'group/marquee relative flex min-w-0 overflow-hidden [contain:inline-size]',
  {
    variants: {
      // `pan-y`: the page keeps vertical scrolling; horizontal swipes come to the row.
      scrollable: {
        true: 'cursor-grab touch-pan-y data-scrubbing:cursor-grabbing data-scrubbing:select-none',
        false: '',
      },
      speed: {
        slow: '[--ssx-marquee-pace:var(--marquee-pace-slow)]',
        medium: '[--ssx-marquee-pace:var(--marquee-pace-medium)]',
        fast: '[--ssx-marquee-pace:var(--marquee-pace-fast)]',
        ultrafast: '[--ssx-marquee-pace:var(--marquee-pace-ultrafast)]',
      },
    },
    defaultVariants: { scrollable: true, speed: 'medium' },
  },
);

const trackVariants = cva(
  [
    'flex w-max shrink-0 animate-ssx-marquee rtl:[--ssx-marquee-to:50%]',
    'data-[direction=reverse]:[animation-direction:reverse]',
    'data-paused:[animation-play-state:paused] group-data-scrubbing/marquee:[animation-play-state:paused]',
    // The hover brake is eased in JS (use-marquee-hover); this is its fallback without the Web Animations API.
    'group-data-hover-hold/marquee:[animation-play-state:paused]',
    // Reduced motion: held still, not removed, so a hand can still move it.
    'motion-reduce:[animation-play-state:paused] in-data-[motion=reduce]:[animation-play-state:paused]',
  ],
);

const groupVariants = cva('flex shrink-0 items-center', {
  variants: {
    gap: {
      '2': 'gap-2 pe-2',
      '4': 'gap-4 pe-4',
      '6': 'gap-6 pe-6',
      '8': 'gap-8 pe-8',
      '12': 'gap-12 pe-12',
    },
  },
  defaultVariants: { gap: '8' },
});

/** The `--space-*` rung between items (and at the seam): `2` 8px · `4` 16px · `6` 24px · `8` 32px · `12` 48px. */
export type MarqueeGap = '2' | '4' | '6' | '8' | '12';
/** The pace, each twice the one before: about 30 · 60 · 120 · 240px/s on a pill row. */
export type MarqueeSpeed = 'slow' | 'medium' | 'fast' | 'ultrafast';
/** `forward` runs toward the inline start (leftward in LTR); `reverse` the other way. */
export type MarqueeDirection = 'forward' | 'reverse';
export type { MarqueeHover };

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The gap between items, and at the seam where the row repeats.
   *
   * @default '8'
   */
  gap?: MarqueeGap;
  /**
   * How fast it runs. `ultrafast` is for short tickers, not for anything
   * people need to read.
   *
   * @default 'medium'
   */
  speed?: MarqueeSpeed;
  /**
   * Which way it runs.
   *
   * @default 'forward'
   */
  direction?: MarqueeDirection;
  /**
   * What the pointer does to it. It always brakes smoothly
   * (`motion.duration.slowest`, eased) and picks back up when the pointer leaves:
   * `pause` brakes to a stop · `slow` brakes to a crawl and keeps moving
   * (`--marquee-hover-rate`, a quarter of full speed) · `none` ignores the
   * pointer. Focus inside always brakes to a stop, whatever this says.
   *
   * @default 'pause'
   */
  hover?: MarqueeHover;
  /** Stop it. Wire a pause button to this. An empty row never moves. */
  paused?: boolean;
  /**
   * Let people move it by hand: drag, swipe, trackpad or shift + wheel.
   *
   * @default true
   */
  scrollable?: boolean;
}

/** Makes a repeat invisible to assistive tech and unreachable by keyboard. `inert` is set on the node so React 16 and 19 agree. */
const inertRef = (node: HTMLDivElement | null) => {
  node?.setAttribute('inert', '');
};

export const Marquee = React.forwardRef<HTMLDivElement, MarqueeProps>(function Marquee(
  {
    className,
    style,
    children,
    gap = '8',
    direction = 'forward',
    speed = 'medium',
    hover = 'pause',
    paused = false,
    scrollable = true,
    ...props
  },
  forwardedRef,
) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const firstRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [copies, setCopies] = React.useState(1);
  const items = React.Children.toArray(children).length;

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    const first = firstRef.current;
    if (!root || !first) return undefined;
    const measure = () => {
      const row = first.offsetWidth;
      if (!row || !first.firstChild) return;
      // Never more than the viewport needs: the backstop for a browser without
      // inline-size containment (Chrome before 105), where the box could grow.
      const box = Math.min(root.clientWidth, root.ownerDocument.documentElement.clientWidth || root.clientWidth);
      const next = Math.max(1, Math.ceil(box / row));
      setCopies((current) => (current === next ? current : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(first);
    return () => observer.disconnect();
  }, []);

  useMarqueeScrub(rootRef, trackRef, scrollable && items > 0);
  useMarqueeHover(rootRef, trackRef, hover, items > 0);

  const groups = Array.from({ length: copies * 2 }, (_, i) => (
    <div
      key={i}
      ref={i === 0 ? firstRef : inertRef}
      data-slot="marquee-group"
      aria-hidden={i === 0 ? undefined : true}
      className={groupVariants({ gap })}
    >
      {children}
    </div>
  ));

  return (
    <div
      ref={composeRefs(rootRef, forwardedRef)}
      data-slot="marquee"
      data-speed={speed}
      className={cn(marqueeVariants({ scrollable, speed }), className)}
      style={{ ...style, ['--ssx-marquee-items' as string]: items * copies }}
      {...props}
    >
      <div
        ref={trackRef}
        data-slot="marquee-track"
        data-direction={direction}
        data-paused={paused || !items ? '' : undefined}
        className={trackVariants()}
      >
        {groups}
      </div>
    </div>
  );
});
Marquee.displayName = 'Marquee';
