import * as React from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Rail, RailItem, type RailProps } from './index';

/* jsdom has no layout. Give the row what a page would: items ITEM px wide, laid
 * out ITEM apart (no gap in jsdom: Tailwind's classes are not compiled here), a
 * TRACK px-wide box, and a scroll position that scrollTo moves. */
const ITEM = 300;
const TRACK = 700;

const mentors = ['Asha', 'Bilal', 'Chitra', 'Dev', 'Esha', 'Farid'];

const Row = (props: Partial<RailProps>) => (
  <Rail label="Mentors" itemName="mentor" {...props}>
    {mentors.map((m) => (
      <RailItem key={m}>
        <a href={`#${m}`}>{m}</a>
      </RailItem>
    ))}
  </Rail>
);

const positions = new WeakMap<Element, number>();
const descriptors: Array<[object, string, PropertyDescriptor | undefined]> = [];
function define(target: object, key: string, descriptor: PropertyDescriptor) {
  descriptors.push([target, key, Object.getOwnPropertyDescriptor(target, key)]);
  Object.defineProperty(target, key, { configurable: true, ...descriptor });
}

const indexOf = (el: HTMLElement) => Array.prototype.indexOf.call(el.parentElement?.children ?? [], el);

let scrollTo: ReturnType<typeof vi.fn>;
let observers: Array<{ cb: IntersectionObserverCallback; el?: Element }> = [];

beforeAll(() => {
  // jsdom has no PointerEvent; a MouseEvent carrying the pointer fields stands in.
  if (typeof globalThis.PointerEvent === 'undefined') {
    class PointerEventStandIn extends MouseEvent {
      pointerId: number;
      pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
        this.pointerType = init.pointerType ?? 'mouse';
      }
    }
    globalThis.PointerEvent = PointerEventStandIn as unknown as typeof PointerEvent;
  }
});

beforeEach(() => {
  define(HTMLElement.prototype, 'offsetWidth', {
    get(this: HTMLElement) {
      return this.dataset.slot === 'rail-item' ? ITEM : 0;
    },
  });
  define(HTMLElement.prototype, 'offsetLeft', {
    get(this: HTMLElement) {
      return this.dataset.slot === 'rail-item' ? indexOf(this) * ITEM : 0;
    },
  });
  define(Element.prototype, 'clientWidth', {
    get(this: HTMLElement) {
      return this.dataset?.slot === 'rail-track' ? TRACK : 0;
    },
  });
  define(Element.prototype, 'scrollWidth', {
    get(this: HTMLElement) {
      return this.dataset?.slot === 'rail-track' ? this.children.length * ITEM : 0;
    },
  });
  define(Element.prototype, 'scrollLeft', {
    get(this: Element) {
      return positions.get(this) ?? 0;
    },
    set(this: Element, v: number) {
      positions.set(this, v);
    },
  });
  scrollTo = vi.fn(function (this: Element, opts: ScrollToOptions) {
    positions.set(this, opts.left ?? 0);
  });
  define(Element.prototype, 'scrollTo', { value: scrollTo, writable: true });

  observers = [];
  globalThis.IntersectionObserver = class {
    cb: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb;
    }
    observe(el: Element) {
      observers.push({ cb: this.cb, el });
      this.cb([{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry], this as never);
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  for (const [target, key, d] of descriptors.reverse()) {
    if (d) Object.defineProperty(target, key, d);
    else delete (target as Record<string, unknown>)[key];
  }
  descriptors.length = 0;
  delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const track = () => document.querySelector<HTMLUListElement>('[data-slot="rail-track"]')!;
const root = () => document.querySelector<HTMLElement>('[data-slot="rail"]')!;

describe('Rail', () => {
  it('renders its markers and data attributes', () => {
    render(<Row itemWidth="md" rows={2} autoplay="none" />);
    expect(root()).toHaveAttribute('data-item-width', 'md');
    expect(root()).toHaveAttribute('data-rows', '2');
    expect(root()).toHaveAttribute('data-autoplay', 'none');
    expect(root()).toHaveAttribute('data-bleed');
    const list = screen.getByRole('list', { name: 'Mentors' });
    expect(list).toBe(track());
    expect(list.querySelectorAll('[data-slot="rail-item"]')).toHaveLength(mentors.length);
    expect(document.querySelector('[data-slot="rail-nav"]')).toBeNull();
  });

  it('wraps a child that is not a RailItem in one', () => {
    render(
      <Rail label="Logos" itemName="logo">
        <span>One</span>
        <span>Two</span>
      </Rail>,
    );
    const items = track().querySelectorAll('[data-slot="rail-item"]');
    expect(items).toHaveLength(2);
    expect(items[0]!.tagName).toBe('LI');
  });

  it('takes a child that is already an item (a server-rendered RailItem: a plain li) as it is', () => {
    // Under React Server Components a RailItem reaches the client Rail already rendered: a host
    // `li` carrying its marker. Wrapping it again nested an `li` in an `li`.
    render(
      <Rail label="Logos" itemName="logo" loop>
        <li data-slot="rail-item">One</li>
        <li data-slot="rail-item">Two</li>
      </Rail>,
    );
    const items = Array.from(track().querySelectorAll<HTMLElement>('[data-slot="rail-item"]'));
    expect(items).toHaveLength(4);
    for (const li of items) {
      expect(li.parentElement).toBe(track());
      expect(li.querySelector('[data-slot="rail-item"]')).toBeNull();
    }
    expect(items.filter((li) => li.hasAttribute('data-copy'))).toHaveLength(2);
  });

  it('sets the item width as a custom property on the track', () => {
    const { rerender } = render(<Row itemWidth="md" />);
    expect(track().className).toContain('[--ssx-rail-item:calc(var(--space-4)_*_24)]');
    expect(track().className).toContain('[--ssx-rail-item-w:min(var(--ssx-rail-item),calc(100vw_*_0.82))]');
    rerender(<Row itemWidth="sm" />);
    expect(track().className).toContain('[--ssx-rail-item:var(--size-panel-sm)]');
    rerender(<Row itemWidth="view" peek={0.2} />);
    expect(track().className).toContain('[--ssx-rail-item-w:calc(100%_*_(1_-_var(--ssx-rail-peek,0.14)))]');
    expect(track().style.getPropertyValue('--ssx-rail-peek')).toBe('0.2');
    rerender(<Row bleed={false} />);
    expect(track().className).toContain('ps-0');
    expect(track().className).not.toContain('ps-(--ssx-rail-inset)');
  });

  it('loops with copies that are hidden, inert and marked', () => {
    render(<Row loop />);
    const items = Array.from(track().querySelectorAll<HTMLElement>('[data-slot="rail-item"]'));
    expect(items).toHaveLength(mentors.length * 2);
    const copies = items.filter((li) => li.hasAttribute('data-copy'));
    expect(copies).toHaveLength(mentors.length);
    for (const c of copies) {
      expect(c).toHaveAttribute('aria-hidden', 'true');
      expect(c).toHaveAttribute('inert');
    }
    // One tab stop and one list item per mentor, not per copy.
    expect(screen.getAllByRole('link')).toHaveLength(mentors.length);
    expect(screen.getAllByRole('listitem')).toHaveLength(mentors.length);
  });

  it('renders a CarouselNav with one dot per measured page', () => {
    render(<Row nav="both" />);
    // 700px of row over 300px items: 2 in view, so 6 items make 3 pages.
    expect(document.querySelector('[data-slot="rail-nav"] [data-slot="carousel-nav"]')).not.toBeNull();
    expect(document.querySelectorAll('[data-slot="carousel-nav-dot"]')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'mentor 1 of 3' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Previous mentor' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('a dot scrolls the track itself to its page', () => {
    render(<Row nav="dots" />);
    fireEvent.click(screen.getByRole('button', { name: 'mentor 2 of 3' }));
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo.mock.contexts[0]).toBe(track());
    expect(scrollTo.mock.calls[0]![0]).toMatchObject({ left: 2 * ITEM, behavior: 'smooth' });
    expect(screen.getByRole('button', { name: 'mentor 2 of 3' })).toHaveAttribute('aria-current', 'true');
  });

  it('steps a page every interval, and stops when the visitor moves the row sideways', () => {
    vi.useFakeTimers();
    render(<Row autoplay="step" interval={4000} nav="dots" />);
    expect(root()).toHaveAttribute('data-playing');
    const fill = document.querySelector('[data-slot="carousel-nav-fill"]')!;
    expect(fill).toHaveAttribute('data-timed');
    expect(fill).not.toHaveAttribute('data-paused');

    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(scrollTo).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo.mock.calls[0]![0]).toMatchObject({ left: 2 * ITEM });

    // A mouse press on the row: the visitor has taken over, for good.
    fireEvent.pointerDown(track(), { pointerType: 'mouse' });
    expect(root()).not.toHaveAttribute('data-playing');
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('a dot or an arrow stops the stepping too, and the current dot then shows full', () => {
    vi.useFakeTimers();
    render(<Row autoplay="step" nav="both" />);
    fireEvent.click(screen.getByRole('button', { name: 'Next mentor' }));
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-slot="carousel-nav-fill"]')).not.toHaveAttribute('data-timed');
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('ticks only with motion: under reduced motion it is a plain scroller', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    const { unmount } = render(<Row autoplay="ticker" />);
    expect(root()).toHaveAttribute('data-playing');
    expect(raf).toHaveBeenCalled();
    // The ticker implies the loop.
    expect(track().querySelectorAll('[data-copy]')).toHaveLength(mentors.length);
    // No snapping while it ticks.
    expect(track().className).not.toContain('snap-mandatory');
    unmount();
    raf.mockClear();

    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }));
    render(<Row autoplay="ticker" />);
    expect(root()).not.toHaveAttribute('data-playing');
    expect(raf).not.toHaveBeenCalled();
    raf.mockRestore();
  });

  it("holds the stepping while the row carries data-ssx-hold (the motion layer's entrance)", async () => {
    vi.useFakeTimers();
    render(
      <div data-testid="section">
        <Row autoplay="step" interval={4000} nav="dots" />
      </div>,
    );
    // The hold set on the row, as the motion layer does while its cards wipe open.
    await act(async () => {
      track().setAttribute('data-ssx-hold', '');
    });
    expect(document.querySelector('[data-slot="carousel-nav-fill"]')).toHaveAttribute('data-paused');
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(scrollTo).not.toHaveBeenCalled();

    // Released: it picks up and steps a page one interval later.
    await act(async () => {
      track().removeAttribute('data-ssx-hold');
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(scrollTo).toHaveBeenCalledTimes(1);

    // On an ancestor too.
    await act(async () => {
      screen.getByTestId('section').setAttribute('data-ssx-hold', '');
    });
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('a ticker does not re-render the Rail on every frame; the fill follows a custom property', () => {
    let frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    // The probe: a Profiler round the Rail counts every commit in which it rendered. (A component
    // probe inside an item would not see them: its props object survives the Rail's re-keying, so
    // React bails out on it, while the Rail itself and every item still re-render.)
    let renders = 0;
    const onRender = () => {
      renders += 1;
    };
    for (const nav of ['none', 'both'] as const) {
      const { unmount } = render(
        <React.Profiler id="rail" onRender={onRender}>
          <Rail label="Logos" itemName="logo" autoplay="ticker" nav={nav}>
            {mentors.map((m) => (
              <RailItem key={m}>{m}</RailItem>
            ))}
          </Rail>
        </React.Profiler>,
      );
      expect(root()).toHaveAttribute('data-playing');
      const before = renders;
      for (let i = 1; i <= 30; i += 1) {
        act(() => {
          const run = frames;
          frames = [];
          for (const cb of run) cb(i * 16);
          fireEvent.scroll(track());
        });
      }
      // The row moved (30 frames at 32px/s), inside its first page, with no render of the cards.
      expect(track().scrollLeft).toBeGreaterThan(10);
      expect(renders - before).toBe(0);
      if (nav === 'both') {
        const nav = document.querySelector<HTMLElement>('[data-slot="rail-nav"]')!;
        const progress = parseFloat(nav.style.getPropertyValue('--ssx-carousel-nav-progress'));
        expect(progress).toBeGreaterThan(0);
        expect(progress).toBeCloseTo(track().scrollLeft / (2 * ITEM), 2);
      }
      unmount();
    }
  });

  it('maps nav onto the CarouselNav controls: dots alone, arrows alone, or both', () => {
    const { rerender } = render(<Row nav="dots" />);
    const dots = () => document.querySelectorAll('[data-slot="carousel-nav-dot"]');
    const arrows = () => document.querySelectorAll('[data-slot="carousel-nav-arrow"]');
    expect(dots()).toHaveLength(3);
    expect(arrows()).toHaveLength(0);
    rerender(<Row nav="arrows" />);
    expect(dots()).toHaveLength(0);
    expect(arrows()).toHaveLength(2);
    rerender(<Row nav="both" />);
    expect(dots()).toHaveLength(3);
    expect(arrows()).toHaveLength(2);
  });

  it('the scroller is a tab stop with one accessible name', () => {
    render(<Row />);
    expect(track()).toHaveAttribute('tabindex', '0');
    expect(track()).toHaveAttribute('aria-label', 'Mentors');
    expect(track()).not.toHaveAttribute('aria-labelledby');
    expect(track().className).toContain('focus-visible:outline-border-focus');
  });

  it('a ticker carries a pause button even with nav="none" (WCAG 2.2.2), which stops and starts the crawl', () => {
    let frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    let t = 0;
    const run = (n: number) => {
      for (let i = 0; i < n; i += 1) {
        t += 16;
        act(() => {
          const due = frames;
          frames = [];
          for (const cb of due) cb(t);
        });
      }
    };

    render(<Row autoplay="ticker" nav="none" />);
    const pause = screen.getByRole('button', { name: 'Pause mentor rail' });
    expect(pause).toHaveAttribute('data-slot', 'rail-pause');
    expect(pause.closest('[data-slot="rail-nav"]')).not.toBeNull();
    expect(pause).toHaveAttribute('aria-pressed', 'false');
    expect(document.querySelector('[data-slot="carousel-nav"]')).toBeNull();

    run(10);
    const moved = track().scrollLeft;
    expect(moved).toBeGreaterThan(0);

    fireEvent.click(pause);
    expect(pause).toHaveAttribute('aria-pressed', 'true');
    expect(root()).not.toHaveAttribute('data-playing');
    run(30);
    expect(track().scrollLeft).toBe(moved);

    fireEvent.click(pause);
    expect(pause).toHaveAttribute('aria-pressed', 'false');
    expect(root()).toHaveAttribute('data-playing');
    run(10);
    expect(track().scrollLeft).toBeGreaterThan(moved);
  });

  it('on a stepping row the pause button stops the stepping and starts it again', () => {
    vi.useFakeTimers();
    render(<Row autoplay="step" interval={4000} nav="dots" />);
    const pause = screen.getByRole('button', { name: 'Pause mentor rail' });
    expect(pause).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(pause);
    expect(pause).toHaveAttribute('aria-pressed', 'true');
    expect(root()).not.toHaveAttribute('data-playing');
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(scrollTo).not.toHaveBeenCalled();

    fireEvent.click(pause);
    expect(pause).toHaveAttribute('aria-pressed', 'false');
    expect(root()).toHaveAttribute('data-playing');
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('no pause button without autoplay, or under reduced motion', () => {
    const { unmount } = render(<Row nav="both" />);
    expect(document.querySelector('[data-slot="rail-pause"]')).toBeNull();
    unmount();
    render(
      <div data-motion="reduce">
        <Row autoplay="ticker" nav="none" />
      </div>,
    );
    expect(document.querySelector('[data-slot="rail-pause"]')).toBeNull();
    expect(document.querySelector('[data-slot="rail-nav"]')).toBeNull();
  });

  it('never steps under reduced motion (data-motion="reduce" on an ancestor)', () => {
    vi.useFakeTimers();
    render(
      <div data-motion="reduce">
        <Row autoplay="step" nav="dots" />
      </div>,
    );
    expect(root()).not.toHaveAttribute('data-playing');
    expect(document.querySelector('[data-slot="carousel-nav-fill"]')).not.toHaveAttribute('data-timed');
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
