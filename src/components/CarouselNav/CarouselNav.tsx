'use client';

// Client: click handlers on the dots and arrows, and the fill's animationend.
import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * CarouselNav
 *
 * A carousel's controls, after Apple's media galleries: a pill of dots between
 * two square arrow buttons. The current dot stretches into a track that fills
 * while its slide plays. A dot goes to its slide; the arrows step one either
 * way. Controlled: it holds no position of its own (`Rail` drives it; a
 * breaker or any other carousel can too).
 *
 *   <CarouselNav count={5} active={i} itemName="mentor" onSelect={go}
 *     onPrev={back} onNext={on} atStart={i === 0} atEnd={i === 4}
 *     interval={6000} running={playing} />
 *
 * The fill, one of:
 *   - timed (`interval`, ms): a CSS keyframe over that long (`animate-ssx-
 *     carousel-nav-fill`, src/styles/batches/marketing.css), frozen while not
 *     `running`, restarted whenever `active` or `interval` changes.
 *     `onFillEnd` fires on its `animationend`, so a carousel can advance on
 *     the fill itself: then it stops off screen and under reduced motion with
 *     no timer to keep in step.
 *   - by value (`progress`, 0–1): `transform: scaleX(…)`, for a row that
 *     moves continuously (a ticker). The scale is
 *     `var(--ssx-carousel-nav-progress, <progress>)`: an ancestor that sets
 *     that custom property drives the fill without re-rendering the nav (Rail
 *     writes it on its nav every frame of a ticker); without one, the prop's
 *     value shows.
 *   - neither: the current dot simply shows full.
 *
 * Reduced motion (the OS, or a `data-motion="reduce"` ancestor): no fill
 * animation; the current dot is full (and `onFillEnd` never fires).
 *
 * No entrance. The page this came from sprang it up and split it open once on
 * screen; here it ships motion-free, `data-shown` always set, for the motion
 * layer to bind to if a page wants that moment back.
 *
 * WHICH CONTROLS (`controls`): `both` (the default) · `dots` (no arrows) ·
 * `arrows` (no dots: a row whose position needs no readout). An arrow also
 * needs its handler (`onPrev`, `onNext`).
 *
 * Accessibility: the dots are buttons named "<itemName> N of <count>", the
 * current one `aria-current="true"`, in a group named for the items. The
 * arrows are "Previous / Next <itemName>", `aria-disabled` at either end (a row
 * that does not loop) rather than `disabled`, so focus is not dropped when a
 * keyboard user pages to the end.
 *
 * Markers: `data-slot="carousel-nav"` (`data-tone`, `data-shown`) ·
 * `carousel-nav-arrow` (`data-direction="prev|next"`) · `carousel-nav-dots` ·
 * `carousel-nav-dot` (`data-active`) · `carousel-nav-fill`.
 * ------------------------------------------------------------------------- */

/** `light` on a page surface (the sunken pill) · `dark` over a photo or a dark band (on-image glass). */
export type CarouselNavTone = 'light' | 'dark';

/** Which controls show: `both` · `dots` (no arrows) · `arrows` (no dots). */
export type CarouselNavControls = 'dots' | 'arrows' | 'both';

/** The dots' pill and the arrows: one 40px material. */
const pill = cva('h-control-md rounded-md', {
  variants: {
    tone: {
      light: 'bg-surface-sunken',
      dark: 'bg-glass-on-image backdrop-blur-glass backdrop-saturate-(--glass-saturate)',
    },
  },
  defaultVariants: { tone: 'light' },
});

const arrowVariants = cva(
  [
    'grid size-control-md shrink-0 cursor-pointer place-items-center border-0 p-0 outline-none',
    'transition-colors duration-(--motion-duration-fast) ease-productive-in-out motion-reduce:transition-none',
    'focus-visible:ring-halo focus-visible:ring-focus-halo aria-disabled:cursor-default',
    // Right to left: the carets point the way the row runs.
    '[&_svg]:pointer-events-none [&_svg]:size-icon-sm rtl:[&_svg]:-scale-x-100',
  ],
  {
    variants: {
      tone: {
        light:
          'text-content not-aria-disabled:hover:bg-surface-raised-active aria-disabled:text-content-disabled',
        dark: 'text-on-image-ink not-aria-disabled:hover:bg-glass-on-image-hover aria-disabled:text-on-image-ink-secondary',
      },
    },
    defaultVariants: { tone: 'light' },
  },
);

/**
 * One square control in the nav's material (an arrow's look). Internal: Rail draws its pause
 * button with it, so the two sit as one set. Not exported from the package.
 */
export const carouselNavControlClass = (tone: CarouselNavTone) => cn(pill({ tone }), arrowVariants({ tone }));

/** A dot's button: a 40px-tall tap target round the 8px dot; tighter as the dots multiply. */
const dotVariants = cva(
  [
    'group/dot relative flex h-full cursor-pointer items-center border-0 bg-transparent py-0 outline-none',
    'rounded-sm focus-visible:ring-halo focus-visible:ring-focus-halo',
  ],
  {
    variants: {
      density: { roomy: 'px-1.5', snug: 'px-1', tight: 'px-0.5' },
    },
    defaultVariants: { density: 'roomy' },
  },
);

/** The visible dot; the current one stretches into the fill's track (40px, 24px on a phone). */
const trackVariants = cva(
  [
    'relative block h-2 overflow-hidden rounded-full',
    'transition-[width,background-color] duration-(--motion-duration-slow) ease-productive-in-out motion-reduce:transition-none',
  ],
  {
    variants: {
      tone: {
        light: 'bg-border-inert',
        dark: 'bg-on-image-ink-secondary',
      },
      current: {
        true: 'w-10 max-sm:w-6',
        false: 'w-2',
      },
    },
    compoundVariants: [
      { tone: 'light', current: false, className: 'group-hover/dot:bg-content-disabled' },
      { tone: 'dark', current: false, className: 'group-hover/dot:bg-on-image-ink' },
    ],
    defaultVariants: { tone: 'light', current: false },
  },
);

const fillVariants = cva('pointer-events-none absolute inset-0 block origin-left rtl:origin-right', {
  variants: {
    tone: {
      light: 'bg-surface-brand-solid',
      dark: 'bg-on-image-ink',
    },
    timed: {
      // Reduced motion: no animation, so the fill rests at its full, untransformed size.
      true: 'animate-ssx-carousel-nav-fill motion-reduce:animate-none in-data-[motion=reduce]:animate-none data-paused:[animation-play-state:paused]',
      false: '',
    },
  },
  defaultVariants: { tone: 'light', timed: false },
});

/** Phosphor 2.1.1 `caret-left` bold (as Pagination draws it). */
function CaretLeft() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M168.49,199.51a12,12,0,0,1-17,17l-80-80a12,12,0,0,1,0-17l80-80a12,12,0,0,1,17,17L97,128Z" />
    </svg>
  );
}

/** Phosphor 2.1.1 `caret-right` bold. */
function CaretRight() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z" />
    </svg>
  );
}

export interface CarouselNavProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** How many slides (or pages). Below 2 nothing renders. */
  count: number;
  /** The current slide, 0-based. */
  active: number;
  /** One item, for the controls' names: "mentor" gives "mentor 2 of 5", "Next mentor". */
  itemName: string;
  /** A dot was chosen. */
  onSelect: (index: number) => void;
  /** Step back. Without it there is no previous arrow. */
  onPrev?: () => void;
  /** Step on. Without it there is no next arrow. */
  onNext?: () => void;
  /** At the first slide of a row that does not loop: the previous arrow is `aria-disabled`. */
  atStart?: boolean;
  /** At the last slide of a row that does not loop: the next arrow is `aria-disabled`. */
  atEnd?: boolean;
  /**
   * It is moving right now; a timed fill runs only then (frozen otherwise).
   *
   * @default false
   */
  running?: boolean;
  /** ms per slide: the current dot fills over this long. */
  interval?: number;
  /**
   * 0–1: the current dot's fill follows this value (a row that moves continuously). Wins over
   * `interval`. An ancestor's `--ssx-carousel-nav-progress` custom property, when set, wins over
   * the value, so a caller can drive the fill every frame without re-rendering.
   */
  progress?: number;
  /**
   * `light` on a page surface · `dark` over a photo or a dark band.
   *
   * @default 'light'
   */
  tone?: CarouselNavTone;
  /** The timed fill reached its end (its `animationend`). Never fires under reduced motion. */
  onFillEnd?: () => void;
  /**
   * Which controls show: `both` · `dots` (no arrows) · `arrows` (no dots: a row whose position
   * needs no readout). An arrow also needs its handler (`onPrev` / `onNext`).
   *
   * @default 'both'
   */
  controls?: CarouselNavControls;
}

export const CarouselNav = React.forwardRef<HTMLDivElement, CarouselNavProps>(function CarouselNav(
  {
    className,
    count,
    active,
    itemName,
    onSelect,
    onPrev,
    onNext,
    atStart = false,
    atEnd = false,
    running = false,
    interval,
    progress,
    tone = 'light',
    onFillEnd,
    controls = 'both',
    ...props
  },
  ref,
) {
  if (!(count >= 2)) return null;
  const total = Math.floor(count);
  const current = Math.min(Math.max(0, Math.floor(active) || 0), total - 1);
  // Many dots: tighter, so the pill and its arrows still fit a phone.
  const density = total > 10 ? 'tight' : total > 7 ? 'snug' : 'roomy';
  const article = /^[aeiou]/i.test(itemName) ? 'an' : 'a';
  const dots = controls !== 'arrows';
  const arrows = controls !== 'dots';

  const fill = () => {
    if (progress !== undefined) {
      const p = Math.min(1, Math.max(0, Number(progress) || 0));
      return (
        <span
          data-slot="carousel-nav-fill"
          className={fillVariants({ tone })}
          style={{ transform: `scaleX(var(--ssx-carousel-nav-progress, ${p}))` }}
        />
      );
    }
    if (interval && interval > 0) {
      return (
        <span
          // Re-keyed on every change, so the fill starts again with its slide.
          key={`${current}-${interval}`}
          data-slot="carousel-nav-fill"
          data-timed=""
          data-paused={running ? undefined : ''}
          className={fillVariants({ tone, timed: true })}
          style={{ ['--ssx-carousel-nav-interval' as string]: `${interval}ms` }}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) onFillEnd?.();
          }}
        />
      );
    }
    return <span data-slot="carousel-nav-fill" className={fillVariants({ tone })} />;
  };

  return (
    <div
      ref={ref}
      data-slot="carousel-nav"
      data-tone={tone}
      data-shown=""
      className={cn('flex items-center justify-center gap-2', className)}
      {...props}
    >
      {arrows && onPrev ? (
        <button
          type="button"
          data-slot="carousel-nav-arrow"
          data-direction="prev"
          aria-label={`Previous ${itemName}`}
          aria-disabled={atStart || undefined}
          className={cn(pill({ tone }), arrowVariants({ tone }))}
          onClick={() => {
            if (!atStart) onPrev();
          }}
        >
          <CaretLeft />
        </button>
      ) : null}
      {dots ? (
        <div
          data-slot="carousel-nav-dots"
          role="group"
          aria-label={`Choose ${article} ${itemName}`}
          className={cn(pill({ tone }), 'flex items-center px-1.5')}
        >
          {Array.from({ length: total }, (_, i) => {
            const on = i === current;
            return (
              <button
                key={i}
                type="button"
                data-slot="carousel-nav-dot"
                data-active={on ? '' : undefined}
                aria-label={`${itemName} ${i + 1} of ${total}`}
                aria-current={on ? 'true' : undefined}
                className={dotVariants({ density })}
                onClick={() => onSelect(i)}
              >
                <span className={trackVariants({ tone, current: on })}>{on ? fill() : null}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {arrows && onNext ? (
        <button
          type="button"
          data-slot="carousel-nav-arrow"
          data-direction="next"
          aria-label={`Next ${itemName}`}
          aria-disabled={atEnd || undefined}
          className={cn(pill({ tone }), arrowVariants({ tone }))}
          onClick={() => {
            if (!atEnd) onNext();
          }}
        >
          <CaretRight />
        </button>
      ) : null}
    </div>
  );
});
CarouselNav.displayName = 'CarouselNav';
