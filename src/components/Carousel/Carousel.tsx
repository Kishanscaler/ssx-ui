import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Card } from '../Card';
import { ClickableCard } from '../ClickableCard';
import { CarouselDots, CarouselNext, CarouselPrevious } from './CarouselControls';

/* ---------------------------------------------------------------------------
 * Carousel
 *
 * A horizontally scrolling rail for a browsable set where order is not
 * meaningful: Super Mentors, alumni outcomes, campus life. Do NOT hide
 * anything essential inside one: content past the fold is content most people
 * never see.
 *
 *   <Carousel label="Super Mentors for Cohort 7">
 *     <CarouselPrevious label="Previous mentors" />
 *     <CarouselTrack>
 *       <CarouselSlide><Card title="Nishant Bhaskar" … /></CarouselSlide>
 *       …
 *     </CarouselTrack>
 *     <CarouselNext label="Next mentors" />
 *     <CarouselDots label="Mentor pages" />
 *   </Carousel>
 *
 * It is native CSS scroll-snap, not a script that moves slides: the track is
 * an ordinary horizontal scroller (`scroll-snap-type: x mandatory`, every
 * slide snaps at its start), so touch swipe, trackpad, a shift-wheel and the
 * arrow keys on the focused track all work with no JavaScript at all, and the
 * track, the slides and their content are server-rendered. Only the controls
 * are client code (`CarouselControls.tsx`); they read the scroll position from
 * the track.
 *
 * Accessibility follows the APG carousel pattern, minus rotation (this one
 * never auto-advances): the root is a `region` with
 * `aria-roledescription="carousel"` and your `label`; each slide is a `group`
 * with `aria-roledescription="slide"` and an "n of m" label; the arrows are
 * disabled at the ends and say so in their name. The track itself is
 * focusable, so a keyboard user can scroll it with the arrow keys.
 *
 * Slides per view: `perView` sets `--carousel-slide-size` on the root, which
 * every slide takes as its basis. `auto` is the HTML's
 * `clamp(240px, 32%, 320px)`; `2` / `3` / `4` step up across the breakpoints
 * (one and a peek on a phone). Any other width: set `--carousel-slide-size`
 * yourself in `style` or `className`.
 *
 * Server component: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

/** String union, so a Storyblok option value can be passed straight in. */
export type CarouselPerView = 'auto' | '1' | '2' | '3' | '4';

export const carouselVariants = cva(
  [
    'relative min-w-0 font-sans',
    // Touch, with overlay arrows (N-12): a grid whose first row is the track
    // (and anything else you put in), the second ‹ dots ›, so no arrow
    // covers a slide.
    'pointer-coarse:has-[>[data-placement=overlay]]:grid pointer-coarse:has-[>[data-placement=overlay]]:grid-cols-[auto_minmax(0,1fr)_auto]',
    'pointer-coarse:has-[>[data-placement=overlay]]:items-center pointer-coarse:has-[>[data-placement=overlay]]:gap-x-2',
    'pointer-coarse:has-[>[data-placement=overlay]]:[&>*]:col-span-3',
    'pointer-coarse:has-[>[data-placement=overlay]]:[&>[data-slot=carousel-previous]]:col-span-1 pointer-coarse:has-[>[data-placement=overlay]]:[&>[data-slot=carousel-previous]]:col-start-1 pointer-coarse:has-[>[data-placement=overlay]]:[&>[data-slot=carousel-previous]]:row-start-2 pointer-coarse:has-[>[data-placement=overlay]]:[&>[data-slot=carousel-previous]]:mt-3',
    'pointer-coarse:has-[>[data-placement=overlay]]:[&>[data-slot=carousel-next]]:col-span-1 pointer-coarse:has-[>[data-placement=overlay]]:[&>[data-slot=carousel-next]]:col-start-3 pointer-coarse:has-[>[data-placement=overlay]]:[&>[data-slot=carousel-next]]:row-start-2 pointer-coarse:has-[>[data-placement=overlay]]:[&>[data-slot=carousel-next]]:mt-3',
    'pointer-coarse:has-[>[data-placement=overlay]]:[&>[data-slot=carousel-dots]]:col-span-1 pointer-coarse:has-[>[data-placement=overlay]]:[&>[data-slot=carousel-dots]]:col-start-2 pointer-coarse:has-[>[data-placement=overlay]]:[&>[data-slot=carousel-dots]]:row-start-2 pointer-coarse:has-[>[data-placement=overlay]]:[&>[data-slot=carousel-dots]]:mt-3',
  ],
  {
    variants: {
      perView: {
        // The HTML's `.carousel__slide { flex: 0 0 clamp(240px, 32%, 320px) }`.
        auto: '[--carousel-slide-size:clamp(15rem,32%,20rem)]',
        '1': '[--carousel-slide-size:100%]',
        // One and a peek on a phone, then N across. The gap is `--space-4`.
        '2': ['[--carousel-slide-size:85%]', 'sm:[--carousel-slide-size:calc((100%_-_var(--space-4))/2)]'],
        '3': [
          '[--carousel-slide-size:85%]',
          'sm:[--carousel-slide-size:calc((100%_-_var(--space-4))/2)]',
          'md:[--carousel-slide-size:calc((100%_-_2*var(--space-4))/3)]',
        ],
        '4': [
          '[--carousel-slide-size:85%]',
          'sm:[--carousel-slide-size:calc((100%_-_var(--space-4))/2)]',
          'md:[--carousel-slide-size:calc((100%_-_2*var(--space-4))/3)]',
          'lg:[--carousel-slide-size:calc((100%_-_3*var(--space-4))/4)]',
        ],
      },
    },
    defaultVariants: { perView: 'auto' },
  },
);

/* ---- Slide ---------------------------------------------------------------- */

export type CarouselSlideProps = React.ComponentPropsWithoutRef<'div'> & {
  /**
   * 0-based position. `CarouselTrack` fills this in for its direct children;
   * set it only when you render slides through your own wrapper.
   */
  index?: number;
  /** Slide count, for the "n of m" label. Filled in by `CarouselTrack`. */
  total?: number;
};

/**
 * One slide: a `group` with `aria-roledescription="slide"`, labelled "n of
 * m" unless you pass your own `aria-label`. Its child (a Card) fills the
 * slide's height, so every card in the rail shares one height.
 */
export const CarouselSlide = React.forwardRef<HTMLDivElement, CarouselSlideProps>(function CarouselSlide(
  { className, index, total, ...props },
  ref,
) {
  const label = index != null && total != null ? `${index + 1} of ${total}` : undefined;
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      data-slot="carousel-slide"
      className={cn(
        'flex min-w-0 shrink-0 grow-0 basis-(--carousel-slide-size) snap-start flex-col',
        '[&>*]:flex-1',
        className,
      )}
      {...props}
    />
  );
});
CarouselSlide.displayName = 'CarouselSlide';

/* ---- Track ---------------------------------------------------------------- */

export type CarouselTrackProps = React.ComponentPropsWithoutRef<'div'>;

/**
 * The scroller. Every direct child becomes a slide: a `CarouselSlide` is
 * numbered, anything else is wrapped in one. Focusable (`tabIndex=0`), so the
 * arrow keys scroll it.
 */
export const CarouselTrack = React.forwardRef<HTMLDivElement, CarouselTrackProps>(function CarouselTrack(
  { className, children, tabIndex = 0, ...props },
  ref,
) {
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const total = items.length;
  return (
    <div
      ref={ref}
      data-slot="carousel-track"
      tabIndex={tabIndex}
      className={cn(
        'flex gap-4 overflow-x-auto overscroll-x-contain pb-2',
        'snap-x snap-mandatory scroll-smooth motion-reduce:scroll-auto',
        'rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus',
        className,
      )}
      {...props}
    >
      {items.map((child, index) => {
        if (child.type === CarouselSlide) {
          const slide = child as React.ReactElement<CarouselSlideProps>;
          return React.cloneElement(slide, {
            index: slide.props.index ?? index,
            total: slide.props.total ?? total,
          });
        }
        return (
          <CarouselSlide key={child.key ?? index} index={index} total={total}>
            {child}
          </CarouselSlide>
        );
      })}
    </div>
  );
});
CarouselTrack.displayName = 'CarouselTrack';

/* ---- Root ----------------------------------------------------------------- */

/** One card in the flat form. */
export interface CarouselItemData {
  /** The card title. */
  title: string;
  /** Kicker line above the title. */
  eyebrow?: string;
  /** One or two lines under the title. */
  description?: string;
  /** Image URL, a 16:9 media band above the body. */
  image?: string;
  /** Alt text for `image`; empty when the title already says what it shows. */
  imageAlt?: string;
  /** Set: the whole card is a link (a `ClickableCard`). */
  href?: string;
}

export type CarouselProps = React.ComponentPropsWithoutRef<'div'> & {
  /**
   * The carousel's accessible name ("Super Mentors for Cohort 7"). Required
   * in practice: a region without a name is not announced as a landmark.
   */
  label?: string;
  /**
   * Slides per view. `auto` is the HTML's `clamp(240px, 32%, 320px)`; `2`,
   * `3`, `4` step up from one-and-a-peek on a phone to N across; `1` is
   * full-width.
   *
   * @default 'auto'
   */
  perView?: CarouselPerView;
  /**
   * Flat form: the cards, each a `Card` (or a `ClickableCard` with `href`).
   * With `items` set the Carousel builds its own track and controls; leave it
   * unset for the compound API.
   */
  items?: CarouselItemData[];
  /**
   * Flat form: draw the prev / next arrows.
   *
   * @default true
   */
  controls?: boolean;
  /**
   * Flat form: draw the page dots.
   *
   * @default true
   */
  dots?: boolean;
  /**
   * Flat form: the previous arrow's name ("Previous mentors").
   *
   * @default 'Previous slides'
   */
  previousLabel?: string;
  /**
   * Flat form: the next arrow's name ("Next mentors").
   *
   * @default 'Next slides'
   */
  nextLabel?: string;
  /**
   * Flat form: the dots group's name ("Mentor pages").
   *
   * @default 'Slide pages'
   */
  dotsLabel?: string;
};

/**
 * The region. Compound: put `CarouselPrevious`, `CarouselTrack`,
 * `CarouselNext` and `CarouselDots` inside, in that order (the HTML's). Flat:
 * pass `items`.
 */
export const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(function Carousel(
  {
    className,
    label,
    perView = 'auto',
    items,
    controls = true,
    dots = true,
    previousLabel,
    nextLabel,
    dotsLabel,
    children,
    ...props
  },
  ref,
) {
  let content: React.ReactNode = children;
  if (items) {
    content = (
      <>
        {controls ? <CarouselPrevious label={previousLabel} /> : null}
        <CarouselTrack>
          {items.map(({ href, ...fields }, i) =>
            href ? <ClickableCard key={i} href={href} {...fields} /> : <Card key={i} {...fields} />,
          )}
        </CarouselTrack>
        {controls ? <CarouselNext label={nextLabel} /> : null}
        {dots ? <CarouselDots label={dotsLabel} /> : null}
        {children}
      </>
    );
  }
  return (
    <div
      ref={ref}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      data-slot="carousel"
      data-per-view={perView}
      className={cn(carouselVariants({ perView }), className)}
      {...props}
    >
      {content}
    </div>
  );
});
Carousel.displayName = 'Carousel';
