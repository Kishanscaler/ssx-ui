'use client';

// Client: the row's pages, its autoplay and its nav are state read off the scroller.
import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { prefersReducedMotion } from '../../motion/attributes';
import { CarouselNav, type CarouselNavControls, type CarouselNavTone } from '../CarouselNav/CarouselNav';
import { IconButton } from '../IconButton';
import { RailItem, type RailItemProps } from './RailItem';
import { railStepInterval, useRailAutoplay } from './use-rail-autoplay';
import { useRailPages } from './use-rail-pages';

/* ---------------------------------------------------------------------------
 * Rail
 *
 * One horizontal scroller for every sideways row on a marketing page: a row of
 * mentors, ventures, alumni, stories. Free or stepped; one row or two;
 * starting on the content column and running off the window's edge; with dots
 * and arrows under it. A real scroller throughout (`ul`, `overflow-x: auto`),
 * so a finger, a trackpad, shift + wheel and the keyboard always work.
 *
 * NOT FOR A CRAWL. A row that drifts past on its own (logos, a strip of
 * cards that never stops) is the main entry's `Marquee`, with the same cards
 * as its children: it measures how often to repeat them, brakes on hover,
 * scrubs by hand, and holds still under reduced motion. The Rail has no
 * ticker mode.
 *
 *   <Rail label="Mentors" itemName="mentor" itemWidth="md" nav="both" autoplay="step">
 *     {mentors.map((m) => (
 *       <RailItem key={m.id}><PersonCard {...m} /></RailItem>
 *     ))}
 *   </Rail>
 *
 * Children are `RailItem`s; anything else is wrapped in one. An item is
 * recognised by its marker, not only its type: under React Server Components a
 * `RailItem` rendered by a server page reaches this client component as the
 * plain `li data-slot="rail-item"` it renders, so a host `li` or any element
 * carrying `data-slot="rail-item"` is taken as an item as it is (wrapping it
 * again nested an `li` in an `li`).
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
 * is as wide as its parent and finds the column itself). It lines up only
 * with a `Container width="default"` (`--size-container-max`, 80rem): under a
 * `narrow` or `wide` container the row starts off that column. `bleed={false}`:
 * no inset, for a Rail inside a container or a card.
 *
 * ROWS (`rows={2}`): items fill column by column into two rows.
 *
 * LOOP (`loop`): the items render twice, the second set `aria-hidden`, `inert`
 * and `data-copy`, and the position wraps by one set's width, so the row runs
 * on forever forwards (a looped two-row Rail wants an even number of items):
 * the next arrow and the stepped autoplay go round from the last page to the
 * first instead of stopping. Copies are copies: give items no `id`.
 *
 * AUTOPLAY (`autoplay="step"`), never under reduced motion: one page on every
 * `interval` (6s), the current dot filling as it waits; it stops at the last
 * page unless looped, stops when the visitor takes over (a sideways swipe,
 * drag or wheel; a dot; an arrow; the pause button), and pauses off screen,
 * on a hidden tab, while focus is inside, and while the row or an ancestor
 * carries `data-ssx-hold` (the motion layer's entrance). Not on hover. See
 * use-rail-autoplay.ts for the detail.
 *
 * PAUSE (WCAG 2.2.2, Pause, Stop, Hide): whenever autoplay is on, the nav
 * carries a pause button (`rail-pause`), even with `nav="none"`: anything that
 * moves on its own for more than five seconds must be stoppable. The system's
 * `IconButton` (as the arrows are), named "Pause <itemName> rail",
 * `aria-pressed` while stopped; its glyph turns to play. It stops the stepping
 * (as a swipe does) and starts it again (from the first page if it had played
 * through). Not rendered under reduced motion, where nothing moves, nor on a
 * row with one page.
 *
 * NAV (`nav`): a `CarouselNav` under the row. A dot is a PAGE (the columns
 * the row shows at once, measured, so a phone has more of them); the arrows
 * step a page; both scroll the row with its own `scrollTo`, never
 * `scrollIntoView` (which scrolls the page too). `navTone="dark"` over a
 * photo or a dark band: the nav declares `data-surface-ink="on-image"`, so
 * the arrows and the pause button take IconButton's on-image inks.
 *
 * KEYBOARD: the scroller is a tab stop (`tabIndex={0}`, the system's focus
 * outline drawn inside its edge), so the row can be scrolled with the arrow
 * keys even when its cards hold nothing focusable. Its one accessible name is
 * `label` (`aria-label` on the `ul`).
 *
 * Props, `className`, `style` and the ref go to the scroller (`ul`), which is
 * named by `label`. Items with no width of their own: a card fills its item.
 *
 * Markers: `data-slot="rail"` (`data-item-width`, `data-rows`,
 * `data-autoplay`, `data-bleed`, `data-playing` while autoplay runs) ·
 * `rail-track` (the `ul`) · `rail-item` (`data-copy` on copies) · `rail-nav` ·
 * `rail-pause` (`aria-pressed`).
 * ------------------------------------------------------------------------- */

export type RailItemWidth = 'sm' | 'md' | 'lg' | 'xl' | 'view';
export type RailAutoplayMode = 'none' | 'step';
export type RailNav = 'none' | 'dots' | 'arrows' | 'both';

// The widths: `sm` is a panel token; 24 / 30 / 38rem have no token yet (a token request in
// src/marketing/README.md), so they are counted in the scale's rem (`--space-4`). On a phone each
// is held to 82% of the viewport, so the next card peeks in. Two steps (`--ssx-rail-item`, then
// `--ssx-rail-item-w`), so the min() takes a plain var() and a calc() over a viewport unit, never
// a calc() over a var() inside it (`min(calc(var(--x) * 24), ...)`): the legacy consumer's PostCSS
// rejects a nested calc(var()) (contract rule 7). `view`'s share (`peek`, 0.14) is a design value
// with no token yet either (a token request in the README).
export const railTrackVariants = cva(
  [
    'm-0 min-w-0 list-none gap-4 overflow-x-auto overscroll-x-contain pt-0 pb-2',
    '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    'touch-pan-x touch-pan-y',
    // A tab stop (the keyboard scrolls it), its focus drawn inside its edge: a bleeding row runs
    // to the window's edge and a section may clip what is outside it.
    'outline-none focus-visible:outline-focus focus-visible:-outline-offset-focus focus-visible:outline-solid focus-visible:outline-border-focus',
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
   * A design value with no token yet (a token request in the marketing README).
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
   * Repeat the items once (inert copies) so the row wraps seamlessly: the arrows and the stepped
   * autoplay go round from the last page to the first.
   *
   * @default false
   */
  loop?: boolean;
  /**
   * `step` a page every `interval` · `none`. Never under reduced motion. `step` brings a pause
   * button (`rail-pause`) into the nav, even with `nav="none"` (WCAG 2.2.2). For a continuous
   * crawl, use `Marquee` (main entry) instead of a Rail.
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
   * The controls under the row: page dots, arrows, both, or none. (Autoplay's pause button
   * shows whatever this is.)
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
   * Snap to each item's start.
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

/**
 * Already an item: a `RailItem`, or one a server rendered. Under React Server Components a server
 * page's `RailItem` arrives here as the host `li` it renders, so it is recognised by its marker
 * (`data-slot="rail-item"`), or as any `li`, not by identity.
 */
function isItem(child: React.ReactNode): child is ItemElement {
  if (!React.isValidElement(child)) return false;
  if (child.type === RailItem || child.type === 'li') return true;
  const props = child.props as { 'data-slot'?: unknown } | null;
  return Boolean(props) && props!['data-slot'] === 'rail-item';
}

/** Phosphor 2.1.1 `pause` bold. */
function PauseGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M200,28H160a20,20,0,0,0-20,20V208a20,20,0,0,0,20,20h40a20,20,0,0,0,20-20V48A20,20,0,0,0,200,28Zm-4,176H164V52h32ZM96,28H56A20,20,0,0,0,36,48V208a20,20,0,0,0,20,20H96a20,20,0,0,0,20-20V48A20,20,0,0,0,96,28ZM92,204H60V52H92Z" />
    </svg>
  );
}

/** Phosphor 2.1.1 `play` bold. */
function PlayGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M234.49,111.07,90.41,22.94A20,20,0,0,0,60,39.87V216.13a20,20,0,0,0,30.41,16.93l144.08-88.13a19.82,19.82,0,0,0,0-33.86ZM84,208.85V47.15L216.16,128Z" />
    </svg>
  );
}

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

  const items = React.Children.toArray(children).map((child, i) =>
    isItem(child) ? (
      child
    ) : (
      <RailItem key={(React.isValidElement(child) && child.key) || `item-${i}`}>{child}</RailItem>
    ),
  ) as ItemElement[];
  const copies = loop
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

  const pages = useRailPages(trackRef, { columns, loop, reduced: motion === 'reduced' });
  const auto = useRailAutoplay(trackRef, {
    enabled: autoplay === 'step' && motion === 'full' && pages.pages > 1,
    interval,
    active: pages.active,
    pages: pages.pages,
    loop,
    atEnd: pages.atEnd,
    advance: () => pages.step(1),
  });

  // The visitor choosing a page takes over: the stepping stops for good.
  const select = (page: number) => {
    auto.stop();
    pages.goTo(page);
  };
  const move = (dir: 1 | -1) => {
    auto.stop();
    pages.step(dir);
  };

  // The pause button: whenever something moves on its own (WCAG 2.2.2), whatever `nav` is.
  const pausable = autoplay === 'step' && motion !== 'reduced' && pages.pages > 1;
  const stopped = motion === 'full' && !auto.playing;
  const togglePause = () => {
    if (auto.playing) {
      auto.stop();
      return;
    }
    // Played through to the end of a row that does not loop: start again from the first page.
    if (!loop && (pages.atEnd || pages.active >= pages.pages - 1)) pages.goTo(0);
    auto.play();
  };

  const showNav = nav !== 'none' && pages.pages > 1;
  const controls: CarouselNavControls = nav === 'none' ? 'both' : nav;

  return (
    <div
      ref={rootRef}
      data-slot="rail"
      data-item-width={itemWidth}
      data-rows={rows}
      data-autoplay={autoplay}
      data-bleed={bleed ? '' : undefined}
      data-playing={auto.running ? '' : undefined}
      className="min-w-0"
    >
      <ul
        ref={ref}
        data-slot="rail-track"
        aria-label={label}
        tabIndex={0}
        className={cn(
          railTrackVariants({ itemWidth, rows, bleed, snap }),
          className,
        )}
        style={itemWidth === 'view' ? { ['--ssx-rail-peek' as string]: peek, ...style } : style}
        {...props}
      >
        {items}
        {copies}
      </ul>
      {showNav || pausable ? (
        <div
          data-slot="rail-nav"
          // Over a photo or a dark band: the pause button (IconButton) inks itself for it, as the arrows do.
          data-surface-ink={navTone === 'dark' ? 'on-image' : undefined}
          className="mt-8 flex items-center justify-center gap-2 max-sm:mt-6"
        >
          {showNav ? (
            <CarouselNav
              count={pages.pages}
              active={pages.active}
              itemName={itemName}
              onSelect={select}
              onPrev={() => move(-1)}
              onNext={() => move(1)}
              controls={controls}
              atStart={!loop && pages.atStart}
              atEnd={!loop && pages.atEnd}
              running={auto.running}
              // A timed fill only while the stepping still plays: once the visitor has taken over, or
              // it has played through (or never runs: reduced motion), the current dot simply shows full.
              interval={autoplay === 'step' && auto.playing ? interval : undefined}
              tone={navTone}
            />
          ) : null}
          {pausable ? (
            <IconButton
              variant="secondary"
              size="md"
              data-slot="rail-pause"
              aria-label={`Pause ${itemName} rail`}
              aria-pressed={stopped}
              onClick={togglePause}
            >
              {stopped ? <PlayGlyph /> : <PauseGlyph />}
            </IconButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
Rail.displayName = 'Rail';
