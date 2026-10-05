import * as React from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Marquee } from './Marquee';

const topics = ['Data structures', 'System design', 'Machine learning', 'Product analytics', 'Cloud'];
const Row = (props: React.ComponentProps<typeof Marquee>) => (
  <Marquee aria-label="Topics" {...props}>
    {topics.map((t) => (
      <a key={t} href={`#${t}`}>
        {t}
      </a>
    ))}
  </Marquee>
);

/** jsdom has no layout: give the box and the row the widths a real page would. */
function withWidths(box: number, row: number) {
  const client = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const offset = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset.slot === 'marquee' ? box : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset.slot === 'marquee-group' ? row : 0;
    },
  });
  return () => {
    if (client) Object.defineProperty(HTMLElement.prototype, 'clientWidth', client);
    if (offset) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offset);
  };
}

// jsdom has no PointerEvent; a MouseEvent carrying the pointer fields stands in.
beforeAll(() => {
  if (typeof globalThis.PointerEvent !== 'undefined') return;
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
});

let restore: (() => void) | undefined;
afterEach(() => {
  restore?.();
  restore = undefined;
});

const groups = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>('[data-slot="marquee-group"]'));

describe('Marquee', () => {
  it('is two identical halves: one exposed copy, every repeat hidden and inert', () => {
    render(<Row />);
    const root = screen.getByLabelText('Topics');
    expect(root).toHaveAttribute('data-slot', 'marquee');
    const [first, ...repeats] = groups(root);
    expect(repeats).toHaveLength(1);
    expect(first).not.toHaveAttribute('aria-hidden');
    expect(first).not.toHaveAttribute('inert');
    for (const r of repeats) {
      expect(r).toHaveAttribute('aria-hidden', 'true');
      expect(r).toHaveAttribute('inert');
    }
    // One tab stop per item, not one per copy.
    expect(screen.getAllByRole('link')).toHaveLength(topics.length);
  });

  it('repeats the row until each half covers the box, and paces the loop by item count', () => {
    restore = withWidths(1584, 485);
    render(<Row />);
    const root = screen.getByLabelText('Topics');
    // ceil(1584 / 485) = 4 rows per half, two halves.
    expect(groups(root)).toHaveLength(8);
    expect(root.style.getPropertyValue('--ssx-marquee-items')).toBe(String(topics.length * 4));
    expect(screen.getAllByRole('link')).toHaveLength(topics.length);
  });

  it('carries the gap after every item, the seam included', () => {
    render(<Row gap="4" />);
    for (const g of groups(screen.getByLabelText('Topics'))) {
      expect(g.className).toContain('gap-4');
      expect(g.className).toContain('pe-4');
    }
  });

  it('stops on `paused` and while a hand is on it, and stands still under reduced motion', () => {
    const { rerender } = render(<Row />);
    const track = screen.getByLabelText('Topics').querySelector<HTMLElement>('[data-slot="marquee-track"]')!;
    expect(track.className).toContain('animate-ssx-marquee');
    // Held still, not removed, so a hand can still move it.
    expect(track.className).toContain('motion-reduce:[animation-play-state:paused]');
    expect(track.className).toContain('in-data-[motion=reduce]:[animation-play-state:paused]');
    expect(track.className).toContain('group-data-scrubbing/marquee:[animation-play-state:paused]');
    expect(track).not.toHaveAttribute('data-paused');

    rerender(<Row paused />);
    expect(track).toHaveAttribute('data-paused');
  });

  it('four speeds, each a pace token; medium by default', () => {
    const { rerender } = render(<Row />);
    const root = screen.getByLabelText('Topics');
    expect(root).toHaveAttribute('data-speed', 'medium');
    expect(root.className).toContain('[--ssx-marquee-pace:var(--marquee-pace-medium)]');
    for (const speed of ['slow', 'fast', 'ultrafast'] as const) {
      rerender(<Row speed={speed} />);
      expect(root).toHaveAttribute('data-speed', speed);
      expect(root.className).toContain(`[--ssx-marquee-pace:var(--marquee-pace-${speed})]`);
    }
  });

  it('runs either way, mirrored in RTL', () => {
    render(<Row direction="reverse" />);
    const track = screen.getByLabelText('Topics').querySelector('[data-slot="marquee-track"]')!;
    expect(track).toHaveAttribute('data-direction', 'reverse');
    expect(track.className).toContain('rtl:[--ssx-marquee-to:50%]');
  });

  it('forwards its ref and merges className and style', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Marquee ref={ref} aria-label="Topics" className="my-2" style={{ color: 'currentColor' }}>
        {topics.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </Marquee>,
    );
    expect(ref.current).toBe(screen.getByLabelText('Topics'));
    expect(ref.current!.className).toContain('my-2');
    expect(ref.current!.style.color).toBe('currentcolor');
    expect(ref.current!.style.getPropertyValue('--ssx-marquee-items')).toBe(String(topics.length));
  });

  describe('by hand', () => {
    const LOOP = 36000;
    /** jsdom has no Web Animations API: stand in for the track's CSSAnimation. */
    function setup(props: Partial<React.ComponentProps<typeof Marquee>> = {}) {
      restore = withWidths(1000, 500);
      const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!;
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        get(this: HTMLElement) {
          return this.dataset.slot === 'marquee-track' ? 2000 : width.get!.call(this);
        },
      });
      const anim = { currentTime: 0, playbackRate: 1, effect: { getComputedTiming: () => ({ duration: LOOP }) } };
      const getAnimations = () => [anim];
      Object.defineProperty(HTMLElement.prototype, 'getAnimations', { configurable: true, value: getAnimations });
      const prev = restore;
      restore = () => {
        prev();
        delete (HTMLElement.prototype as { getAnimations?: unknown }).getAnimations;
      };
      render(<Row {...props} />);
      const root = screen.getByLabelText('Topics');
      return { root, anim };
    }
    // half = 1000px of track = one loop (36s): 1px of hand is 36ms of clock.
    const MS_PER_PX = LOOP / 1000;

    it('a drag moves the clock with the hand, wrapped to one loop, and pauses the row meanwhile', () => {
      const { root, anim } = setup();
      expect(root.className).toContain('touch-pan-y');
      expect(root.className).toContain('cursor-grab');
      fireEvent.pointerDown(root, { button: 0, pointerId: 1, clientX: 300 });
      // Under the 8px slop: still a press, nothing moves.
      fireEvent.pointerMove(root, { pointerId: 1, clientX: 304 });
      expect(anim.currentTime).toBe(0);
      expect(root).not.toHaveAttribute('data-scrubbing');
      // 96px left of the press: the row follows the whole way (forward in LTR), no jump at the slop.
      fireEvent.pointerMove(root, { pointerId: 1, clientX: 204 });
      expect(root).toHaveAttribute('data-scrubbing');
      expect(anim.currentTime).toBeCloseTo(96 * MS_PER_PX);
      // 300px right: past the start, so it wraps back round the loop, never negative.
      fireEvent.pointerMove(root, { pointerId: 1, clientX: 504 });
      expect(anim.currentTime).toBeCloseTo(LOOP - 204 * MS_PER_PX);
      fireEvent.pointerUp(root, { pointerId: 1, clientX: 504 });
      expect(root).not.toHaveAttribute('data-scrubbing');
    });

    it('the click that ends a drag is eaten; a plain click still lands', () => {
      const { root } = setup();
      const link = screen.getAllByRole('link')[0]!;
      let clicks = 0;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        clicks += 1;
      });
      fireEvent.pointerDown(link, { button: 0, pointerId: 1, clientX: 300 });
      fireEvent.pointerMove(link, { pointerId: 1, clientX: 200 });
      fireEvent.pointerUp(link, { pointerId: 1, clientX: 200 });
      fireEvent.click(link);
      expect(clicks).toBe(0);
      fireEvent.pointerDown(link, { button: 0, pointerId: 2, clientX: 300 });
      fireEvent.pointerUp(link, { pointerId: 2, clientX: 300 });
      fireEvent.click(link);
      expect(clicks).toBe(1);
      expect(root).toBeInTheDocument();
    });

    it('a sideways trackpad scroll moves it; a vertical wheel is left to the page', () => {
      const { root, anim } = setup();
      const vertical = fireEvent.wheel(root, { deltaX: 0, deltaY: 40 });
      expect(vertical).toBe(true);
      expect(anim.currentTime).toBe(0);
      const sideways = fireEvent.wheel(root, { deltaX: 50, deltaY: 4 });
      expect(sideways).toBe(false); // default prevented: no browser back-swipe
      expect(anim.currentTime).toBeCloseTo(50 * MS_PER_PX);
      fireEvent.wheel(root, { deltaX: 0, deltaY: 20, shiftKey: true });
      expect(anim.currentTime).toBeCloseTo(70 * MS_PER_PX);
    });

    it('reverse runs the clock the other way, so the row still follows the hand', () => {
      const { root, anim } = setup({ direction: 'reverse' });
      fireEvent.pointerDown(root, { button: 0, pointerId: 1, clientX: 300 });
      fireEvent.pointerMove(root, { pointerId: 1, clientX: 200 });
      expect(anim.currentTime).toBeCloseTo(LOOP - 100 * MS_PER_PX);
    });

    it('scrollable={false} leaves it alone', () => {
      const { root, anim } = setup({ scrollable: false });
      expect(root.className).not.toContain('cursor-grab');
      fireEvent.pointerDown(root, { button: 0, pointerId: 1, clientX: 300 });
      fireEvent.pointerMove(root, { pointerId: 1, clientX: 100 });
      expect(anim.currentTime).toBe(0);
    });

    it('hover and focus brake it to a stop and release it; a finger does not', () => {
      // jsdom has no token CSS, so the brake is instant here; its curve is checked in the browser.
      const { root, anim } = setup();
      fireEvent.pointerEnter(root, { pointerType: 'touch' });
      expect(anim.playbackRate).toBe(1);
      fireEvent.pointerEnter(root, { pointerType: 'mouse' });
      expect(anim.playbackRate).toBe(0);
      fireEvent.pointerLeave(root, { pointerType: 'mouse' });
      expect(anim.playbackRate).toBe(1);
      const link = screen.getAllByRole('link')[0]!;
      fireEvent.focusIn(link);
      expect(anim.playbackRate).toBe(0);
      fireEvent.focusOut(link, { relatedTarget: screen.getAllByRole('link')[1] });
      expect(anim.playbackRate).toBe(0);
      fireEvent.focusOut(link, { relatedTarget: document.body });
      expect(anim.playbackRate).toBe(1);
    });

    it('hover="slow" brakes to the crawl rate and keeps moving; focus still stops it', () => {
      const { root, anim } = setup({ hover: 'slow' });
      root.style.setProperty('--marquee-hover-rate', '0.25');
      fireEvent.pointerEnter(root, { pointerType: 'mouse' });
      expect(anim.playbackRate).toBe(0.25);
      fireEvent.focusIn(screen.getAllByRole('link')[0]!);
      expect(anim.playbackRate).toBe(0);
      fireEvent.focusOut(screen.getAllByRole('link')[0]!, { relatedTarget: document.body });
      expect(anim.playbackRate).toBe(0.25);
      fireEvent.pointerLeave(root, { pointerType: 'mouse' });
      expect(anim.playbackRate).toBe(1);
    });

    it('hover="none" ignores the pointer, but focus still stops it', () => {
      const { root, anim } = setup({ hover: 'none' });
      fireEvent.pointerEnter(root, { pointerType: 'mouse' });
      expect(anim.playbackRate).toBe(1);
      fireEvent.focusIn(screen.getAllByRole('link')[0]!);
      expect(anim.playbackRate).toBe(0);
    });
  });
});
