'use client';

// Client: the turn between slides (the active slide, its direction, the dot's fill as the clock),
// the clips played only on screen, and the page's brand read for the dark island.
import * as React from 'react';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { prefersReducedMotion } from '../../motion/attributes';
import { CarouselNav } from '../CarouselNav/CarouselNav';
import { Container } from '../Container';
import { useInView, usePageHidden } from '../Rail/use-rail-autoplay';
import { BreakerMedia, type BreakerShot } from './BreakerMedia';
import { BreakerSlide } from './BreakerSlide';
import type { BreakerMedia as BreakerMediaData, BreakerSlideData } from './types';
import { useBreakerBrand } from './use-breaker-brand';

/* ---------------------------------------------------------------------------
 * Breaker (marketing)
 *
 * The dark statement band between sections, after Apple's product blocks: a
 * clip full bleed with its subject on the left looking right, and on the right
 * where they look, the words in white over a progressive frost; the picture
 * melting into the page at the band's foot (no top fade). One slide is the Why
 * breaker (a remark, who said it, two spec figures); several are the
 * testimonial band (a person to a slide, a profile under each statement, the
 * page's dots under the copy, turning on its own).
 *
 *   <Breaker
 *     label="Why the traditional MBA doesn't work"
 *     slides={[{
 *       eyebrow: 'Why the traditional MBA doesn’t work',
 *       statement: '“If you’re 25 and going to an MBA college today, you must be some kind of idiot.”',
 *       attribution: '— Nikhil Kamath, Zerodha',
 *       figures: [{ value: '60%', label: 'of MBA students', description: '…', source: 'Forbes', sourceLogo }],
 *       media: { video: '/kamath.mp4', poster: '/kamath.webp', fit: 'height' },
 *     }]}
 *   />
 *
 * Composed, not redrawn: the words are a SectionHeader (eyebrow, display
 * title), who said it a Text footnote, who it is a ProfilePlate, the figures a
 * StatGroup of ruled StatCards, the dots a CarouselNav (`tone="dark"`). The
 * band takes the full width it is given (place it outside the page's
 * Container: it holds its own, so the words sit on the content column).
 *
 * THE PICTURE (BreakerMedia.tsx): each slide's `media`, a muted loop or a
 * still. A slide without one keeps the first slide's; no media at all is the
 * fixed dark plate. `fit="height"` draws the clip at the band's full height
 * from its start, feathered at its end into its own poster blurred (a still,
 * never a second video). On a phone the clip is framed at the band's top
 * (`--ssx-breaker-frame`) over its blurred poster to the foot, and the words
 * sit over its lower part on a frost rising behind them. The clip plays only
 * while its slide is on, the band on screen (IntersectionObserver, guarded),
 * the tab visible and motion allowed; it holds its frame otherwise.
 *
 * THE WORDS are a dark island: `data-theme="dark"` with `data-brand` on the
 * same element (`brand`, or the nearest ancestor's read on mount) and
 * `data-surface-ink="on-image"`, so everything in it inks itself white in both
 * themes, the eyebrow included (the on-image ink, not the brand green).
 * `media.bright` (a pale scene) darkens the frost (`data-bright`) and puts the
 * profile on the dark plate.
 *
 * HEIGHT: from `md` at least `--ssx-breaker-height` (clamp(30rem, 72svh,
 * 42rem)), the copy centred in it; below, the copy's own height under the
 * framed clip. Every slide shares one grid cell, so the band is as tall as its
 * longest slide and a turn never changes its height.
 *
 * THE TURN (several slides): the next slide when the active dot's fill ends
 * (`interval`, 7s; CarouselNav's `onFillEnd`), so it waits off screen, on a
 * hidden tab and under reduced motion (no fill then) with no timer to keep in
 * step. No pause under the pointer: a reader's pointer rests on the band, and
 * it looked stuck. A dot goes to its slide, the arrows step and wrap, a
 * sideways touch swipe steps (vertical swipes still scroll). After the first
 * turn the root carries `data-turned` and `data-direction` (`forward | back`),
 * and the incoming words, then the profile, slide in a step from that side
 * (the `ssx-breaker-in` keyframe, never under reduced motion).
 *
 * MARKERS, NOT MOTION. Root `data-slot="breaker"` (`data-count`,
 * `data-index`, `data-bright`, `data-turned`, `data-direction`); parts
 * `breaker-media` (`data-breaker-part="media"`), `breaker-stage`
 * (`data-breaker-stage`), `breaker-shot`, `breaker-haze`, `breaker-clip`,
 * `breaker-frost` (`data-layer="rise|side"`), `breaker-words`
 * (`data-breaker-part="words"`, the island), `breaker-slide`
 * (`data-active`), `breaker-say`, the SectionHeader's own `section-header-*`
 * parts (`data-part="eyebrow|headline"`), `breaker-attribution`, `breaker-profile`,
 * `breaker-figures` (each `data-breaker-part="…"` on the slide on show only),
 * `breaker-nav`. A page's scroll entrance binds to `data-breaker-part`.
 * ------------------------------------------------------------------------- */

/** ms per slide; the dot's fill is the clock. The SSB band's 7s. */
export const breakerInterval = 7000;

/** The root element. */
export type BreakerElement = 'section' | 'div';
/** The brand the dark island repeats beside its theme. */
export type BreakerBrand = 'sst' | 'ssb';

export interface BreakerProps extends React.HTMLAttributes<HTMLElement> {
  /** One slide: the Why breaker. Several: the testimonial band, turning on `interval`. */
  slides: BreakerSlideData[];
  /**
   * ms per slide; the active dot's fill is the clock.
   *
   * @default 7000 (breakerInterval)
   */
  interval?: number;
  /**
   * Which slide shows first.
   *
   * @default 0
   */
  defaultIndex?: number;
  /** The band's accessible name ("Founders and investors on SSB's students"). */
  label: string;
  /**
   * One slide, for the controls' names: "person" gives "person 2 of 3", "Next person".
   *
   * @default 'slide'
   */
  itemName?: string;
  /**
   * The brand the words' dark island carries beside `data-theme="dark"`. Omit it and the nearest
   * `data-brand` ancestor's is read on mount (server markup then carries none until hydration;
   * the on-image inks hold either way).
   */
  brand?: BreakerBrand;
  /**
   * The root element: `section` (a region named by `label`), or `div` (a group) inside a section
   * of the page's own.
   *
   * @default 'section'
   */
  as?: BreakerElement;
}

const hasMedia = (media: BreakerMediaData | undefined): media is BreakerMediaData =>
  Boolean(media && (media.video || media.poster));

/** The px a touch must travel sideways (and more than it does vertically) to turn the band. */
const SWIPE_MIN = 48;

export const Breaker = React.forwardRef<HTMLElement, BreakerProps>(function Breaker(
  {
    slides,
    interval = breakerInterval,
    defaultIndex = 0,
    label,
    itemName = 'slide',
    brand,
    as = 'section',
    className,
    onPointerDown,
    onPointerUp,
    ...props
  },
  forwardedRef,
) {
  const rootRef = React.useRef<HTMLElement>(null);
  const ref = useComposedRefs(rootRef, forwardedRef);
  const list = slides || [];
  const count = list.length;
  const many = count > 1;

  const [active, setActive] = React.useState(() =>
    Math.min(Math.max(0, Math.floor(defaultIndex) || 0), Math.max(0, count - 1)),
  );
  const [turn, setTurn] = React.useState<'none' | 'forward' | 'back'>('none');
  const current = Math.min(active, Math.max(0, count - 1));

  // Motion is decided on the client: `unknown` until read, so nothing turns or plays before it is.
  const [motion, setMotion] = React.useState<'unknown' | 'full' | 'reduced'>('unknown');
  React.useEffect(() => {
    setMotion(prefersReducedMotion(rootRef.current) ? 'reduced' : 'full');
  }, []);
  const inView = useInView(rootRef, 0.35, count > 0);
  const hidden = usePageHidden(count > 0);
  const live = inView && !hidden;
  const pageBrand = useBreakerBrand(rootRef, brand);

  // Slides not on show are inert (set on the node, so React 16 and 19 agree).
  const slideNodes = React.useRef<Array<HTMLDivElement | null>>([]);
  React.useEffect(() => {
    slideNodes.current.forEach((node, i) => {
      if (!node) return;
      if (i === current) node.removeAttribute('inert');
      else node.setAttribute('inert', '');
    });
  }, [current, count]);

  const swipe = React.useRef<{ x: number; y: number } | null>(null);

  if (!count) return null;

  const go = (step: 1 | -1) => {
    setTurn(step < 0 ? 'back' : 'forward');
    setActive((i) => (Math.min(i, count - 1) + step + count) % count);
  };
  const show = (i: number) => {
    if (i === current) return;
    setTurn(i < current ? 'back' : 'forward');
    setActive(i);
  };

  // The shots: one per slide with media of its own; a slide without keeps the first slide's, or
  // the plate when the first has none either.
  const own = list.map((s) => (hasMedia(s.media) ? s.media : undefined));
  const shots: BreakerShot[] = [];
  const shotOf: number[] = [];
  let plateShot = -1;
  list.forEach((_, i) => {
    if (own[i]) {
      shotOf[i] = shots.length;
      shots.push({ key: `slide-${i}`, media: own[i] });
    } else if (i > 0 && own[0]) {
      shotOf[i] = shotOf[0]!;
    } else {
      if (plateShot < 0) {
        plateShot = shots.length;
        shots.push({ key: 'plate' });
      }
      shotOf[i] = plateShot;
    }
  });
  const activeShot = shotOf[current] ?? 0;
  const bright = Boolean(shots[activeShot]?.media?.bright);

  const playing = live && motion === 'full';
  const timed = many && motion === 'full' && interval > 0;

  return React.createElement(
    as,
    {
      ref,
      'data-slot': 'breaker',
      'data-count': count,
      'data-index': current,
      'data-bright': bright ? '' : undefined,
      'data-turned': turn !== 'none' ? '' : undefined,
      'data-direction': turn !== 'none' ? turn : undefined,
      role: as === 'div' ? 'group' : undefined,
      'aria-label': label,
      'aria-roledescription': many ? 'carousel' : undefined,
      className: cn(
        'relative isolate overflow-hidden bg-page font-sans',
        '[--ssx-breaker-fade:var(--space-20)] md:[--ssx-breaker-fade:var(--space-24)]',
        'md:grid md:min-h-(--ssx-breaker-height)',
        many && 'touch-pan-y',
        className,
      ),
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        if (onPointerDown) onPointerDown(e);
        if (many && e.pointerType !== 'mouse') swipe.current = { x: e.clientX, y: e.clientY };
      },
      onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
        if (onPointerUp) onPointerUp(e);
        const from = swipe.current;
        swipe.current = null;
        if (!from) return;
        const dx = e.clientX - from.x;
        if (!(Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(e.clientY - from.y))) return;
        // Swiping toward the inline start brings the next slide.
        const rtl = typeof getComputedStyle === 'function' && getComputedStyle(e.currentTarget).direction === 'rtl';
        go((dx < 0) !== rtl ? 1 : -1);
      },
      ...props,
    },
    <BreakerMedia shots={shots} active={activeShot} playing={playing} />,
    <Container data-slot="breaker-inner" className="relative md:flex md:items-center">
      <div
        data-slot="breaker-copy"
        className={cn(
          'min-w-0 pt-[calc(var(--ssx-breaker-frame)*var(--ssx-breaker-words-at))] pb-(--ssx-breaker-fade)',
          'md:grid md:w-full md:grid-cols-[minmax(0,1fr)_min(var(--ssx-breaker-words-share),var(--size-panel-lg))] md:pt-12',
        )}
      >
        <div
          data-slot="breaker-words"
          data-breaker-part="words"
          data-brand={pageBrand}
          data-theme="dark"
          data-surface-ink="on-image"
          className="min-w-0 text-on-image-ink md:col-start-2"
        >
          <div
            data-slot="breaker-slides"
            className="grid"
            // Announced when a reader turns it; quiet while it turns by itself.
            aria-live={many ? (timed && live ? 'off' : 'polite') : undefined}
          >
            {list.map((slide, i) => (
              <BreakerSlide
                key={i}
                ref={(node: HTMLDivElement | null) => {
                  slideNodes.current[i] = node;
                }}
                slide={slide}
                active={i === current}
                index={i}
                count={count}
                bright={Boolean(shots[shotOf[i] ?? 0]?.media?.bright)}
              />
            ))}
          </div>
          {many ? (
            <div data-slot="breaker-nav" className="mt-8">
              <CarouselNav
                count={count}
                active={current}
                itemName={itemName}
                onSelect={show}
                onPrev={() => go(-1)}
                onNext={() => go(1)}
                running={live}
                // The fill is the clock: a slide turns when it ends. None under reduced motion.
                interval={timed ? interval : undefined}
                onFillEnd={() => go(1)}
                tone="dark"
                className="justify-start"
              />
            </div>
          ) : null}
        </div>
      </div>
    </Container>,
  );
});
Breaker.displayName = 'Breaker';
