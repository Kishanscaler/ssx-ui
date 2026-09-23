'use client';

// Client: the controls measure the track, listen to its scroll and resize, and
// attach click handlers. The track and slides they drive stay server markup
// (Carousel.tsx); the controls find them through the DOM, not a context, so a
// Server Component can render the whole carousel.
import * as React from 'react';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { IconButton, type IconButtonProps } from '../IconButton';

/* ---------------------------------------------------------------------------
 * Carousel controls: CarouselPrevious, CarouselNext, CarouselDots.
 *
 * Each control finds the track of the carousel it sits in
 * (`[data-slot=carousel]` → its own `[data-slot=carousel-track]`, never a
 * nested carousel's) and reads the scroll position straight from it. The
 * scroll position IS the state: a swipe, a trackpad flick, a keyboard arrow on
 * the focused track and a click here all move the same scrollLeft, so there is
 * nothing to keep in sync.
 *
 * Paging is the HTML's: prev / next scroll the track by 80% of its width and
 * native scroll-snap settles on a slide edge. The dots are pages of that same
 * step, so a dot and an arrow press always agree on where page 2 is.
 * `scroll-behavior: smooth` on the track animates it; under reduced motion the
 * track is `scroll-auto` and the jump is instant.
 * ------------------------------------------------------------------------- */

/** How far one page moves, as a fraction of the track's visible width. */
const PAGE = 0.8;

type TrackState = {
  atStart: boolean;
  atEnd: boolean;
  /** Current page, 0-based. */
  page: number;
  /** Page count; 0 until measured (the server render). */
  pages: number;
};

const INITIAL: TrackState = { atStart: true, atEnd: false, page: 0, pages: 0 };

function findTrack(from: Element | null): HTMLElement | null {
  const root = from?.closest('[data-slot="carousel"]');
  if (!root) return null;
  const tracks = root.querySelectorAll<HTMLElement>('[data-slot="carousel-track"]');
  for (let i = 0; i < tracks.length; i += 1) {
    const track = tracks.item(i);
    if (track.closest('[data-slot="carousel"]') === root) return track;
  }
  return null;
}

/** +1 in a left-to-right track, -1 in a right-to-left one. */
function direction(track: HTMLElement): 1 | -1 {
  return typeof getComputedStyle === 'function' && getComputedStyle(track).direction === 'rtl' ? -1 : 1;
}

function measure(track: HTMLElement): TrackState {
  const max = Math.max(0, track.scrollWidth - track.clientWidth);
  // RTL tracks report a negative scrollLeft in every current engine.
  const left = Math.abs(track.scrollLeft);
  const step = track.clientWidth * PAGE;
  const atStart = left <= 1;
  const atEnd = left >= max - 1;
  const pages = max <= 1 || step <= 0 ? 1 : 1 + Math.ceil((max - 1) / step);
  const page = atEnd ? pages - 1 : Math.min(pages - 1, Math.round(left / (step || 1)));
  return { atStart, atEnd, page, pages };
}

function sameState(a: TrackState, b: TrackState) {
  return a.atStart === b.atStart && a.atEnd === b.atEnd && a.page === b.page && a.pages === b.pages;
}

function scrollTrack(track: HTMLElement, left: number, relative: boolean) {
  // No `behavior`: the track's own `scroll-behavior` decides (smooth, or
  // instant under reduced motion).
  if (relative) {
    if (typeof track.scrollBy === 'function') track.scrollBy({ left });
    else track.scrollLeft += left;
  } else if (typeof track.scrollTo === 'function') {
    track.scrollTo({ left });
  } else {
    track.scrollLeft = left;
  }
}

/**
 * Subscribes a control to its carousel's track. Returns the measured state
 * and the paging actions.
 */
function useCarouselTrack(nodeRef: React.RefObject<HTMLElement | null>) {
  const [state, setState] = React.useState<TrackState>(INITIAL);
  const trackRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const track = findTrack(nodeRef.current);
    trackRef.current = track;
    if (!track) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      const next = measure(track);
      setState((prev) => (sameState(prev, next) ? prev : next));
    };
    const schedule = () => {
      if (frame) return;
      frame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(update) : 0;
      if (!frame) update();
    };

    update();
    track.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    observer?.observe(track);
    return () => {
      track.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
      if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
    };
  }, [nodeRef]);

  const step = React.useCallback((dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    scrollTrack(track, dir * direction(track) * track.clientWidth * PAGE, true);
  }, []);

  const goTo = React.useCallback((page: number, pages: number) => {
    const track = trackRef.current;
    if (!track) return;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    const target = page >= pages - 1 ? max : Math.min(max, page * track.clientWidth * PAGE);
    scrollTrack(track, target * direction(track), false);
  }, []);

  return { state, step, goTo };
}

/**
 * When a control becomes disabled while it has focus (the last press reached
 * the end), hand focus to its partner rather than dropping it on <body>.
 * `hadFocus` is set on focus and cleared on a real move elsewhere; a blur
 * caused by the button disabling itself has no `relatedTarget`.
 */
function useKeepFocus(
  nodeRef: React.RefObject<HTMLElement | null>,
  hadFocus: React.MutableRefObject<boolean>,
  disabled: boolean,
  partner: 'prev' | 'next',
) {
  React.useEffect(() => {
    const node = nodeRef.current;
    if (!disabled || !node || !hadFocus.current || typeof document === 'undefined') return;
    const active = document.activeElement;
    if (active !== node && active !== document.body && active !== null) return;
    const root = node.closest('[data-slot="carousel"]');
    const slot = partner === 'prev' ? 'carousel-previous' : 'carousel-next';
    const other = root?.querySelector<HTMLElement>(`[data-slot="${slot}"]:not(:disabled)`);
    (other ?? findTrack(node))?.focus();
  }, [disabled, hadFocus, nodeRef, partner]);
}

/* ---- Previous / Next ------------------------------------------------------ */

export type CarouselButtonProps = Omit<IconButtonProps, 'aria-label' | 'size' | 'variant'> & {
  /**
   * The accessible name. Name what moves ("Previous mentors"). When the
   * track is at that end, ", already at the start" / ", already at the end"
   * is appended, as in the HTML.
   *
   * @default 'Previous slides' / 'Next slides'
   */
  label?: string;
  /**
   * The button's placement. `overlay` hangs it on the track's edge, 12px
   * outside, at 40% of the carousel's height (the HTML). `inline` leaves it in
   * the flow, for a caller who places the controls in a header row.
   *
   * @default 'overlay'
   */
  placement?: CarouselButtonPlacement;
};

/** String union, so a Storyblok option value can be passed straight in. */
export type CarouselButtonPlacement = 'overlay' | 'inline';

/** Phosphor 2.1.1 `caret-left` / `caret-right` regular (MIT), 20px in a 40px button. */
const CARET = {
  prev: 'M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z',
  next: 'M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z',
} as const;

/** The shared arrow. Not exported: the two named components below are the API. */
const CarouselArrow = React.forwardRef<HTMLButtonElement, CarouselButtonProps & { kind: 'prev' | 'next' }>(
  function CarouselArrow(
    {
      kind,
      className,
      label = kind === 'prev' ? 'Previous slides' : 'Next slides',
      placement = 'overlay',
      children,
      onClick,
      onFocus,
      onBlur,
      disabled: disabledProp,
      ...props
    },
    forwardedRef,
  ) {
    const isPrev = kind === 'prev';
    const innerRef = React.useRef<HTMLButtonElement>(null);
    const ref = useComposedRefs(forwardedRef, innerRef);
    const hadFocus = React.useRef(false);
    const { state, step } = useCarouselTrack(innerRef);
    const atEdge = isPrev ? state.atStart : state.atEnd;
    const disabled = disabledProp || atEdge;
    useKeepFocus(innerRef, hadFocus, atEdge, isPrev ? 'next' : 'prev');

    return (
      <IconButton
        ref={ref}
        variant="secondary"
        size="md"
        // The organism's part name replaces Button's `button` slot here.
        data-slot={isPrev ? 'carousel-previous' : 'carousel-next'}
        data-placement={placement}
        aria-label={atEdge ? `${label}, already at the ${isPrev ? 'start' : 'end'}` : label}
        disabled={disabled}
        className={cn(
          // The HTML's round, raised arrow.
          'rounded-full shadow-raised',
          placement === 'overlay' && 'absolute top-[40%] z-raised',
          placement === 'overlay' && (isPrev ? '-left-3' : '-right-3'),
          // Touch (N-12): an overlay arrow would sit on the slide's text, and
          // a swipe is the gesture anyway. It drops below the track, into the
          // row the Carousel lays out with the dots.
          placement === 'overlay' && 'pointer-coarse:static pointer-coarse:shadow-none',
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) step(isPrev ? -1 : 1);
        }}
        onFocus={(event) => {
          hadFocus.current = true;
          onFocus?.(event);
        }}
        onBlur={(event) => {
          if (event.relatedTarget) hadFocus.current = false;
          onBlur?.(event);
        }}
        {...props}
      >
        {children ?? (
          <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
            <path d={CARET[kind]} />
          </svg>
        )}
      </IconButton>
    );
  },
);
CarouselArrow.displayName = 'CarouselArrow';

/** Scrolls the track back one page (80% of its width). Disabled at the start. */
export const CarouselPrevious = React.forwardRef<HTMLButtonElement, CarouselButtonProps>(
  function CarouselPrevious(props, ref) {
    return <CarouselArrow ref={ref} kind="prev" {...props} />;
  },
);
CarouselPrevious.displayName = 'CarouselPrevious';

/** Scrolls the track on one page (80% of its width). Disabled at the end. */
export const CarouselNext = React.forwardRef<HTMLButtonElement, CarouselButtonProps>(function CarouselNext(
  props,
  ref,
) {
  return <CarouselArrow ref={ref} kind="next" {...props} />;
});
CarouselNext.displayName = 'CarouselNext';

/* ---- Dots ----------------------------------------------------------------- */

export type CarouselDotsProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> & {
  /**
   * The group's accessible name ("Mentor pages").
   *
   * @default 'Slide pages'
   */
  label?: string;
};

/**
 * One dot per page; the current page's dot is the wide brand pill
 * (`aria-current="true"`), and each dot is a button named "Page n of m".
 * Rendered empty on the server and filled once the track is measured, since
 * the page count depends on the rendered width.
 */
export const CarouselDots = React.forwardRef<HTMLDivElement, CarouselDotsProps>(function CarouselDots(
  { className, label = 'Slide pages', ...props },
  forwardedRef,
) {
  const innerRef = React.useRef<HTMLDivElement>(null);
  const ref = useComposedRefs(forwardedRef, innerRef);
  const { state, goTo } = useCarouselTrack(innerRef);
  const { page, pages } = state;

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      data-slot="carousel-dots"
      hidden={pages <= 1}
      className={cn(
        'mt-4 flex flex-wrap justify-center gap-2',
        // Touch: 24px apart, so each dot's 24×44 target stands alone. 44 wide
        // would wrap an 8-page rail at 320 (between the arrows); 24 is WCAG
        // 2.5.8's minimum, and the height is the full 44.
        'pointer-coarse:gap-4',
        className,
      )}
      {...props}
    >
      {pages > 1
        ? Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              data-slot="carousel-dot"
              aria-label={`Page ${i + 1} of ${pages}`}
              aria-current={i === page ? 'true' : undefined}
              onClick={() => goTo(i, pages)}
              className={cn(
                'relative h-2 w-2 cursor-pointer rounded-full border-0 bg-border-strong p-0',
                // A 24px-tall target around an 8px dot; 24×44 on a touch device
                // (the dot's own `::after`, so not `touch-target`, which is `::before`).
                "after:absolute after:-inset-x-1 after:-inset-y-2 after:content-['']",
                'pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-[18px]',
                'transition-[background-color,width] duration-[var(--motion-duration-normal)] ease-productive-in-out',
                'motion-reduce:transition-none',
                'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus',
                'aria-[current=true]:w-5 aria-[current=true]:bg-action-primary',
              )}
            />
          ))
        : null}
    </div>
  );
});
CarouselDots.displayName = 'CarouselDots';
