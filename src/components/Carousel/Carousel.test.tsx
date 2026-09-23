import { carouselVariants } from './Carousel';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Carousel, CarouselSlide, CarouselTrack } from './Carousel';
import { CarouselDots, CarouselNext, CarouselPrevious } from './CarouselControls';

/*
 * jsdom has no layout, so the track's geometry is faked: every
 * `[data-slot=carousel-track]` is 1000px wide showing, `scrollWidthOf` px of
 * content, and scrollBy / scrollTo move a backing scrollLeft and fire
 * `scroll` synchronously. requestAnimationFrame runs its callback at once, so
 * the controls' update lands inside the act() that fireEvent wraps.
 */
let scrollWidthOf = 2000;
const CLIENT = 1000;
const lefts = new WeakMap<Element, number>();
const isTrack = (el: Element) => el.getAttribute('data-slot') === 'carousel-track';
const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
const saved: Record<string, PropertyDescriptor | undefined> = {};

function setLeft(el: HTMLElement, value: number) {
  const max = Math.max(0, scrollWidthOf - CLIENT);
  lefts.set(el, Math.max(0, Math.min(max, value)));
  el.dispatchEvent(new Event('scroll'));
}

beforeEach(() => {
  scrollWidthOf = 2000;
  for (const key of ['scrollWidth', 'clientWidth', 'scrollLeft', 'scrollBy', 'scrollTo']) {
    saved[key] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, key) ??
      Object.getOwnPropertyDescriptor(Element.prototype, key);
  }
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return isTrack(this) ? scrollWidthOf : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return isTrack(this) ? CLIENT : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
    configurable: true,
    get(this: HTMLElement) {
      return lefts.get(this) ?? 0;
    },
    set(this: HTMLElement, v: number) {
      setLeft(this, v);
    },
  });
  proto.scrollBy = vi.fn(function scrollBy(this: HTMLElement, opts: ScrollToOptions) {
    setLeft(this, (lefts.get(this) ?? 0) + (opts.left ?? 0));
  });
  proto.scrollTo = vi.fn(function scrollTo(this: HTMLElement, opts: ScrollToOptions) {
    setLeft(this, opts.left ?? 0);
  });
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});

afterEach(() => {
  for (const [key, desc] of Object.entries(saved)) {
    if (desc) Object.defineProperty(HTMLElement.prototype, key, desc);
    else delete proto[key];
  }
  vi.unstubAllGlobals();
});

function Mentors(props: Partial<React.ComponentProps<typeof Carousel>>) {
  return (
    <Carousel label="Super Mentors for Cohort 7" {...props}>
      <CarouselPrevious label="Previous mentors" />
      <CarouselTrack>
        {['Nishant', 'Ritika', 'Kabir', 'Sanya', 'Aditya', 'Priyanka'].map((name) => (
          <CarouselSlide key={name}>
            <article>
              <button type="button">Book {name}</button>
            </article>
          </CarouselSlide>
        ))}
      </CarouselTrack>
      <CarouselNext label="Next mentors" />
      <CarouselDots label="Mentor pages" />
    </Carousel>
  );
}

const track = () => document.querySelector('[data-slot="carousel-track"]') as HTMLElement;
const prev = () => screen.getByRole('button', { name: /^Previous mentors/ });
const next = () => screen.getByRole('button', { name: /^Next mentors/ });

describe('Carousel', () => {
  it('is a named carousel region of "n of m" slides', () => {
    render(<Mentors />);
    const region = screen.getByRole('region', { name: 'Super Mentors for Cohort 7' });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    expect(region).toHaveAttribute('data-slot', 'carousel');
    expect(region).toHaveAttribute('data-per-view', 'auto');
    const slides = screen.getAllByRole('group', { name: /of 6$/ });
    expect(slides).toHaveLength(6);
    expect(slides[0]).toHaveAccessibleName('1 of 6');
    expect(slides[5]).toHaveAccessibleName('6 of 6');
    slides.forEach((s) => expect(s).toHaveAttribute('aria-roledescription', 'slide'));
  });

  it('wraps any direct track child in a slide', () => {
    render(
      <Carousel label="Campus life">
        <CarouselTrack>
          <div>Hostel</div>
          <div>Library</div>
        </CarouselTrack>
      </Carousel>,
    );
    const slides = screen.getAllByRole('group');
    expect(slides.map((s) => s.getAttribute('aria-label'))).toEqual(['1 of 2', '2 of 2']);
    expect(slides[0]).toHaveAttribute('data-slot', 'carousel-slide');
  });

  it('the track is focusable, so the arrow keys scroll it natively', () => {
    render(<Mentors />);
    expect(track()).toHaveAttribute('tabindex', '0');
    track().focus();
    expect(document.activeElement).toBe(track());
  });

  it('at the start: previous is dead and says so, next is live', () => {
    render(<Mentors />);
    expect(prev()).toBeDisabled();
    expect(prev()).toHaveAccessibleName('Previous mentors, already at the start');
    expect(prev()).toHaveAttribute('data-slot', 'carousel-previous');
    expect(next()).toBeEnabled();
    expect(next()).toHaveAccessibleName('Next mentors');
  });

  it('next scrolls by 80% of the width; at the end next is dead and previous live', () => {
    render(<Mentors />);
    fireEvent.click(next());
    expect(proto.scrollBy).toHaveBeenCalledWith({ left: 800 });
    expect(track().scrollLeft).toBe(800);
    expect(prev()).toBeEnabled();
    expect(next()).toBeEnabled();
    fireEvent.click(next());
    expect(track().scrollLeft).toBe(1000);
    expect(next()).toBeDisabled();
    expect(next()).toHaveAccessibleName('Next mentors, already at the end');
    fireEvent.click(prev());
    expect(proto.scrollBy).toHaveBeenLastCalledWith({ left: -800 });
    expect(track().scrollLeft).toBe(200);
  });

  it('follows a scroll that did not come from the buttons (swipe, trackpad, keys)', () => {
    render(<Mentors />);
    act(() => {
      track().scrollLeft = 1000;
    });
    expect(next()).toBeDisabled();
    expect(prev()).toBeEnabled();
  });

  it('hands focus to the other arrow when the focused one goes dead', () => {
    render(<Mentors />);
    next().focus();
    fireEvent.click(next());
    fireEvent.click(next());
    expect(next()).toBeDisabled();
    expect(document.activeElement).toBe(prev());
  });

  it('dots: one per page of the same step, the current one marked, a click goes there', () => {
    render(<Mentors />);
    const group = screen.getByRole('group', { name: 'Mentor pages' });
    expect(group).toHaveAttribute('data-slot', 'carousel-dots');
    // 1000px of overflow in 800px steps: pages at 0, 800 and the end.
    const dots = screen.getAllByRole('button', { name: /^Page \d of 3$/ });
    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveAttribute('aria-current', 'true');
    fireEvent.click(dots[2] as HTMLElement);
    expect(proto.scrollTo).toHaveBeenLastCalledWith({ left: 1000 });
    expect(screen.getByRole('button', { name: 'Page 3 of 3' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Page 1 of 3' })).not.toHaveAttribute('aria-current');
    fireEvent.click(screen.getByRole('button', { name: 'Page 2 of 3' }));
    expect(proto.scrollTo).toHaveBeenLastCalledWith({ left: 800 });
  });

  it('nothing to scroll: both arrows dead, no dots', () => {
    scrollWidthOf = 1000;
    render(<Mentors />);
    expect(prev()).toBeDisabled();
    expect(next()).toBeDisabled();
    expect(screen.queryAllByRole('button', { name: /^Page/ })).toHaveLength(0);
    expect(document.querySelector('[data-slot="carousel-dots"]')).toHaveAttribute('hidden');
  });

  it('forwards refs and merges className', () => {
    const root = React.createRef<HTMLDivElement>();
    const trackRef = React.createRef<HTMLDivElement>();
    const nextRef = React.createRef<HTMLButtonElement>();
    render(
      <Carousel ref={root} label="x" className="relative mt-8" perView="3">
        <CarouselTrack ref={trackRef} className="gap-6">
          <div>a</div>
        </CarouselTrack>
        <CarouselNext ref={nextRef} className="-right-4" />
      </Carousel>,
    );
    expect(root.current).toHaveAttribute('data-slot', 'carousel');
    expect(root.current).toHaveAttribute('data-per-view', '3');
    expect(root.current?.className).toContain('mt-8');
    expect(trackRef.current?.className).toContain('gap-6');
    expect(trackRef.current?.className).not.toMatch(/\bgap-4\b/);
    expect(nextRef.current).toHaveAttribute('data-slot', 'carousel-next');
    expect(nextRef.current?.className).toContain('-right-4');
    expect(nextRef.current?.className).not.toContain('-right-3');
  });

  it('flat form: builds cards, arrows and dots from items', () => {
    render(
      <Carousel
        label="Super Mentors"
        previousLabel="Previous mentors"
        nextLabel="Next mentors"
        dotsLabel="Mentor pages"
        items={[
          { title: 'Nishant Bhaskar', description: 'Staff Software Engineer · Google' },
          { title: 'Ritika Menon', href: '/mentors/ritika' },
        ]}
      />,
    );
    expect(screen.getAllByRole('group', { name: /of 2$/ })).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Nishant Bhaskar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ritika Menon/ })).toHaveAttribute('href', '/mentors/ritika');
    expect(prev()).toBeDisabled();
    expect(screen.getByRole('group', { name: 'Mentor pages' })).toBeInTheDocument();
  });

  it('flat form: controls and dots can be turned off', () => {
    render(<Carousel label="Campus" controls={false} dots={false} items={[{ title: 'Hostel' }]} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(document.querySelector('[data-slot="carousel-dots"]')).toBeNull();
  });
});

describe('Carousel on touch (N-12)', () => {
  it('overlay arrows say so, and drop below the track on a coarse pointer', () => {
    render(
      <Carousel label="Mentors">
        <CarouselPrevious />
        <CarouselTrack>
          <div>A</div>
        </CarouselTrack>
        <CarouselNext placement="inline" />
      </Carousel>,
    );
    const prev = document.querySelector('[data-slot="carousel-previous"]') as HTMLElement;
    expect(prev).toHaveAttribute('data-placement', 'overlay');
    expect(prev.className).toContain('pointer-coarse:static');
    const next = document.querySelector('[data-slot="carousel-next"]') as HTMLElement;
    expect(next).toHaveAttribute('data-placement', 'inline');
    expect(next.className).not.toContain('pointer-coarse:static');
    expect(carouselVariants()).toContain('pointer-coarse:has-[>[data-placement=overlay]]:grid');
  });
});
