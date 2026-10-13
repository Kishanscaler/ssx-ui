'use client';

// Client: the row's pages, its autoplay and its nav are state read off the scroller.
import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { prefersReducedMotion } from '../../motion/attributes';
import { CarouselNav, type CarouselNavTone } from '../CarouselNav/CarouselNav';
import { RailItem, type RailItemProps } from './RailItem';
import {
  RAIL_MOVE_HOLD_MS,
  railStepInterval,
  railTickerSpeed,
  RAIL_TOUCH_HOLD_MS,
  useRailAutoplay,
  useRailTicker,
} from './use-rail-autoplay';
import { useRailPages } from './use-rail-pages';

/* ---------------------------------------------------------------------------
 * Rail
 *
 * One horizontal scroller for every sideways row on a marketing page: a row of
 * mentors, ventures, alumni, stories. Free, stepped or ticking; one row or two;
 * starting on the content column and running off the window's edge; with dots
 * and arrows under it. A real scroller throughout (`ul`, `overflow-x: auto`),
 * so a finger, a trackpad, shift + wheel and the keyboard always work.
 *
 *   <Rail label="Mentors" itemName="mentor" itemWidth="md" nav="both" autoplay="step">
 *     {mentors.map((m) => (
 *       <RailItem key={m.id}><PersonCard {...m} /></RailItem>
 *     ))}
 *   </Rail>
 *
 * Children are `RailItem`s; anything else is wrapped in one.
 *
 * WIDTH (`itemWidth`) is the Rail's, not the card's: `sm` 20rem · `md` 24rem ·
 * `lg` 30rem · `xl` 38rem, each at most 82% of the viewport (a phone sees the
 * next card peek in) · `view` a share of the row's visible width, the rest
 * left for the next card to peek (`peek`, 0.14): the phone stack. Set through
 * `--ssx-rail-item-w` on the track; a page can override it there. The gap is
 * one token, `--space-4` (16px).
 *
 * BLEED (`bleed`, on by default): the row starts on the content column (the
 * page gutter plus the container's side margin, from `--space-gutter` and
 * `--size-container-max`) and runs off the window's inline-end edge; its stops
 * line up with the column. Place the Rail OUTSIDE the page's `Container` (it
 * is as wide as its parent and finds the column itself). `bleed={false}`: no
 * inset, for a Rail inside a container or a card.
 *
 * ROWS (`rows={2}`): items fill column by column into two rows.
 *
 * LOOP (`loop`): the items render twice, the second set `aria-hidden`, `inert`
 * and `data-copy`, and the position wraps by one set's width, so the row runs
 * on forever forwards (a looped two-row Rail wants an even number of items).
 * Copies are copies: give items no `id`.
 *
 * AUTOPLAY (`autoplay`), never under reduced motion:
 *   - `step`: one page on every `interval` (6s), the current dot filling as
 *     it waits; it stops at the last page unless looped, stops for good when
 *     the visitor takes over (a sideways swipe, drag or wheel; a dot; an
 *     arrow), and pauses off screen, on a hidden tab and while focus is
 *     inside. Not on hover.
 *   - `ticker`: a crawl at `speed` px/s (32) over the looped copies (it
 *     implies `loop`); holds on focus, a touch, off screen, a hidden tab, and
 *     while the row carries `data-ssx-hold` (the motion layer's entrance) or
 *     `data-paused` (a page's pause button). No snapping while it ticks.
 *   See use-rail-autoplay.ts for the detail.
 *
 * NAV (`nav`): a `CarouselNav` under the row. A dot is a PAGE (the columns
 * the row shows at once, measured, so a phone has more of them); the arrows
 * step a page; both scroll the row with its own `scrollTo`, never
 * `scrollIntoView` (which scrolls the page too). `navTone="dark"` over a
 * photo or a dark band.
 *
 * Props, `className`, `style` and the ref go to the scroller (`ul`), which is
 * named by `label`. Items with no width of their own: a card fills its item.
 *
 * Markers: `data-slot="rail"` (`data-item-width`, `data-rows`,
 * `data-autoplay`, `data-bleed`, `data-playing` while autoplay runs) ·
 * `rail-track` (the `ul`) · `rail-item` (`data-copy` on copies) · `rail-nav`.
 * ------------------------------------------------------------------------- */

export type RailItemWidth = 'sm' | 'md' | 'lg' | 'xl' | 'view';
export type RailAutoplayMode = 'none' | 'step' | 'ticker';
export type RailNav = 'none' | 'dots' | 'arrows' | 'both';

// The widths: `sm` is a panel token; 24 / 30 / 38rem have no token yet (a token request in
// src/marketing/README.md), so they are counted in the scale's rem (`--space-4`). On a phone each
// is held to 82% of the viewport, so the next card peeks in. Two steps (`--ssx-rail-item`, then
// `--ssx-rail-item-w`), never a calc nested in a min(): the legacy consumer's PostCSS rejects that.
export const railTrackVariants = cva(
  [
    'm-0 min-w-0 list-none gap-4 overflow-x-auto overscroll-x-contain pt-0 pb-2',
    '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    'touch-pan-x touch-pan-y',
  ],
  {
    variants: {
      itemWidth: {
        sm: '[--ssx-rail-item:var(--size-panel-sm)] [--ssx-rail-item-w:min(var(--ssx-rail-item),calc(100vw_*_0.82))]',
        md: '[--ssx-rail-item:calc(var(--space-4)_*_24)] [--ssx-rail-item-w:min(var(--ssx-rail-item),calc(100vw_*_0.82))]',
        lg: '[--ssx-rail-item:calc(var(--space-4)_*_30)] [--ssx-rail-item-w:min(var(--ssx-rail-item),calc(100vw_*_0.82))]',
        xl: '[--ssx-rail-item:calc(var(--space-4)_*_38)] [--ssx-rail-item-w:min(var(--ssx-rail-item),calc(100vw_*_0.82))]',
        // A share of the row's content box (the visible column): `100%` resolves on the item.
        view: '[--ssx-rail-item-w:calc(100%_*_(1_-_var(--ssx-rail-peek,0.14)))]',
      },
      rows: {
        1: 'flex',
        2: 'grid grid-flow-col grid-rows-[repeat(2,auto)] auto-cols-(--ssx-rail-item-w)',
      },
      // The column's start: the container's side margin, then the gutter. `100%` resolves in the
      // padding, against the Rail's width.
      bleed: {
        true: [
          '[--ssx-rail-margin:max(0px,calc((100%_-_var(--size-container-max))_/_2))]',
          '[--ssx-rail-inset:calc(var(--ssx-rail-margin)_+_var(--space-gutter))]',
          'ps-(--ssx-rail-inset) pe-(--ssx-rail-inset) scroll-px-(--ssx-rail-inset)',
        ],
        false: 'ps-0 pe-0',
      },
      snap: {
        true: 'snap-x snap-mandatory',
        false: '',
      },
    },
    defaultVariants: { itemWidth: 'sm', rows: 1, bleed: true, snap: true },
  },
);

export interface RailProps extends React.HTMLAttributes<HTMLUListElement> {
  /** The row's accessible name ("Mentors"). */
  label: string;
  /** One item, for the controls' names: "mentor" gives "mentor 2 of 5", "Next mentor". */
  itemName: string;
  /**
   * Each item's width: `sm` 20rem · `md` 24rem · `lg` 30rem · `xl` 38rem (each at
   * most 82% of the viewport) · `view` a share of the row's visible width (`peek`).
   *
   * @default 'sm'
   */
  itemWidth?: RailItemWidth;
  /**
   * `itemWidth="view"` only: the share of the row's width left for the next card to peek in.
   *
   * @default 0.14
   */
  peek?: number;
  /**
   * Two rows, filled column by column.
   *
   * @default 1
   */
  rows?: 1 | 2;
  /**
   * Start on the content column and run off the inline-end edge of the window.
   * Place the Rail outside the page's `Container`.
   *
   * @default true
   */
  bleed?: boolean;
  /**
   * Repeat the items once (inert copies) so the row wraps seamlessly. `autoplay="ticker"` implies it.
   *
   * @default false
   */
  loop?: boolean;
  /**
   * `step` a page every `interval` · `ticker` a continuous crawl at `speed` · `none`.
   * Never under reduced motion.
   *
   * @default 'none'
   */
  autoplay?: RailAutoplayMode;
  /**
   * `autoplay="step"`: ms per page.
   *
   * @default 6000 (railStepInterval)
   */
  interval?: number;
  /**
   * `autoplay="ticker"`: px per second.
   *
   * @default 32 (railTickerSpeed)
   */
  speed?: number;
  /**
   * The controls under the row: page dots, arrows, both, or none.
   *
   * @default 'none'
   */
  nav?: RailNav;
  /**
   * The controls' tone: `light` on a page surface, `dark` over a photo or a dark band.
   *
   * @default 'light'
   */
  navTone?: CarouselNavTone;
  /**
   * Snap to each item's start. Off while a ticker runs.
   *
   * @default true
   */
  snap?: boolean;
}

/** A copy is invisible to assistive tech and unreachable by keyboard. `inert` is set on the node so React 16 and 19 agree. */
const inertRef = (node: HTMLLIElement | null) => {
  if (node) node.setAttribute('inert', '');
};

type ItemElement = React.ReactElement<RailItemProps & React.RefAttributes<HTMLLIElement>>;

export const Rail = React.forwardRef<HTMLUListElement, RailProps>(function Rail(
  {
    label,
    itemName,
    itemWidth = 'sm',
    peek = 0.14,
    rows = 1,
    bleed = true,
    loop = false,
    autoplay = 'none',
    interval = railStepInterval,
    speed = railTickerSpeed,
    nav = 'none',
    navTone = 'light',
    snap = true,
    className,
    style,
    children,
    ...props
  },
  forwardedRef,
) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLUListElement>(null);
  const ref = useComposedRefs(trackRef, forwardedRef);

  // Motion is decided on the client: `unknown` until read, so nothing starts before it is.
  const [motion, setMotion] = React.useState<'unknown' | 'full' | 'reduced'>('unknown');
  React.useEffect(() => {
    setMotion(prefersReducedMotion(rootRef.current) ? 'reduced' : 'full');
  }, []);

  const ticker = autoplay === 'ticker';
  const looped = loop || ticker;

  const items = React.Children.toArray(children).map((child, i) =>
    React.isValidElement(child) && child.type === RailItem ? (
      (child as ItemElement)
    ) : (
      <RailItem key={(React.isValidElement(child) && child.key) || `item-${i}`}>{child}</RailItem>
    ),
  ) as ItemElement[];
  const copies = looped
    ? items.map((item, i) =>
        React.cloneElement(item, {
          key: `copy-${i}`,
          ref: inertRef,
          'aria-hidden': true,
          'data-copy': '',
        } as Partial<RailItemProps> & React.Attributes & React.RefAttributes<HTMLLIElement>),
      )
    : null;
  const columns = rows === 2 ? Math.ceil(items.length / 2) : items.length;

  const pages = useRailPages(trackRef, {
    columns,
    loop: looped,
    mode: ticker ? 'floor' : 'nearest',
    reduced: motion === 'reduced',
  });
  const auto = useRailAutoplay(trackRef, {
    enabled: autoplay === 'step' && motion === 'full' && pages.pages > 1,
    interval,
    active: pages.active,
    pages: pages.pages,
    loop: looped,
    atEnd: pages.atEnd,
    advance: () => pages.step(1),
  });
  const ticking = ticker && motion === 'full';
  const tick = useRailTicker(trackRef, rootRef, { enabled: ticking, speed });

  // The visitor choosing a page: a ticker holds a moment and carries on; a stepping row stops for good.
  const select = (page: number) => {
    if (ticker) tick.hold(RAIL_TOUCH_HOLD_MS);
    else auto.stop();
    pages.goTo(page);
  };
  const move = (dir: 1 | -1) => {
    if (ticker) tick.hold(RAIL_MOVE_HOLD_MS);
    else auto.stop();
    pages.step(dir);
  };

  const arrows = nav === 'arrows' || nav === 'both';
  const dots = nav === 'dots' || nav === 'both';

  return (
    <div
      ref={rootRef}
      data-slot="rail"
      data-item-width={itemWidth}
      data-rows={rows}
      data-autoplay={autoplay}
      data-bleed={bleed ? '' : undefined}
      data-playing={auto.running || ticking ? '' : undefined}
      className="min-w-0"
    >
      <ul
        ref={ref}
        data-slot="rail-track"
        aria-label={label}
        className={cn(
          railTrackVariants({ itemWidth, rows, bleed, snap: snap && !ticker }),
          className,
        )}
        style={itemWidth === 'view' ? { ['--ssx-rail-peek' as string]: peek, ...style } : style}
        {...props}
      >
        {items}
        {copies}
      </ul>
      {nav !== 'none' && pages.pages > 1 ? (
        <div data-slot="rail-nav" className="mt-8 max-sm:mt-6">
          <CarouselNav
            count={pages.pages}
            active={pages.active}
            itemName={itemName}
            onSelect={select}
            onPrev={arrows ? () => move(-1) : undefined}
            onNext={arrows ? () => move(1) : undefined}
            dots={dots}
            atStart={!looped && pages.atStart}
            atEnd={!looped && pages.atEnd}
            running={auto.running}
            // A timed fill only while the stepping still plays: once the visitor has taken over, or
            // it has played through (or never runs: reduced motion), the current dot simply shows full.
            interval={autoplay === 'step' && auto.playing ? interval : undefined}
            progress={ticking ? pages.progress : undefined}
            tone={navTone}
          />
        </div>
      ) : null}
    </div>
  );
});
Rail.displayName = 'Rail';
