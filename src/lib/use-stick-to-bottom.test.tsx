import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStickToBottom, type UseStickToBottomOptions } from './use-stick-to-bottom';

/* jsdom has no layout, so the scroller's metrics are driven by hand: the
   element registered here reports `m.sh` / `m.ch` / `m.top`, and a write to
   scrollTop is clamped the way a browser clamps it. ResizeObserver is a
   controllable stand-in, and frames run synchronously. */

type Metrics = { sh: number; ch: number; top: number };
const registry = new WeakMap<Element, Metrics>();
const saved: Record<string, PropertyDescriptor | undefined> = {};
const clamp = (m: Metrics, v: number) => Math.max(0, Math.min(v, m.sh - m.ch));

beforeAll(() => {
  for (const key of ['scrollHeight', 'clientHeight', 'scrollTop'] as const) {
    saved[key] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, key);
  }
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get() {
      return registry.get(this)?.sh ?? 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return registry.get(this)?.ch ?? 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
    configurable: true,
    get() {
      return registry.get(this)?.top ?? 0;
    },
    set(v: number) {
      const m = registry.get(this);
      if (m) m.top = clamp(m, v);
    },
  });
});

afterAll(() => {
  for (const [key, d] of Object.entries(saved)) {
    if (d) Object.defineProperty(HTMLElement.prototype, key, d);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
  }
});

let observers: Array<{ cb: ResizeObserverCallback; targets: Element[] }> = [];
const OriginalRO = globalThis.ResizeObserver;
const originalRaf = window.requestAnimationFrame;

beforeEach(() => {
  observers = [];
  globalThis.ResizeObserver = class {
    private entry: { cb: ResizeObserverCallback; targets: Element[] };
    constructor(cb: ResizeObserverCallback) {
      this.entry = { cb, targets: [] };
      observers.push(this.entry);
    }
    observe(el: Element) {
      this.entry.targets.push(el);
    }
    unobserve() {}
    disconnect() {
      observers = observers.filter((o) => o !== this.entry);
    }
  } as unknown as typeof ResizeObserver;
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  }) as typeof window.requestAnimationFrame;
});

afterEach(() => {
  globalThis.ResizeObserver = OriginalRO;
  window.requestAnimationFrame = originalRaf;
});

/** Content arrived: every observer fires. */
const resize = () =>
  act(() => {
    observers.forEach((o) => o.cb([], {} as ResizeObserver));
  });

function Harness({ metrics, options }: { metrics: Metrics; options?: UseStickToBottomOptions }) {
  const stick = useStickToBottom(options);
  return (
    <div
      data-testid="scroller"
      ref={(node) => {
        if (node) registry.set(node, metrics);
        stick.scrollRef(node);
      }}
    >
      <div data-testid="content" ref={stick.contentRef}>
        <button type="button" onClick={() => stick.scrollToBottom()}>
          latest
        </button>
        <input aria-label="draft" />
      </div>
      <output data-testid="state">{stick.isAtBottom ? 'bottom' : 'away'}</output>
    </div>
  );
}

const state = () => screen.getByTestId('state').textContent;
const scroller = () => screen.getByTestId('scroller');

/** The reader moved the scroll position (a drag, a pan): set it, then the scroll event. */
function readerScrollsTo(m: Metrics, top: number) {
  m.top = clamp(m, top);
  act(() => {
    fireEvent.scroll(scroller());
  });
}

describe('useStickToBottom', () => {
  it('opens pinned, on the end of the content', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    render(<Harness metrics={m} />);
    expect(m.top).toBe(600);
    expect(state()).toBe('bottom');
  });

  it('follows content while pinned: one jump to the end per resize', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    render(<Harness metrics={m} />);
    m.sh = 1300;
    resize();
    expect(m.top).toBe(900);
    m.sh = 1320;
    resize();
    expect(m.top).toBe(920);
    expect(state()).toBe('bottom');
  });

  it('observes both the content and the scroller', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    render(<Harness metrics={m} />);
    const targets = observers.flatMap((o) => o.targets);
    expect(targets).toContain(screen.getByTestId('content'));
    expect(targets).toContain(scroller());
  });

  it('releases when the reader scrolls up, and never pulls them back down', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    render(<Harness metrics={m} />);
    readerScrollsTo(m, 300);
    expect(state()).toBe('away');
    m.sh = 1600;
    resize();
    expect(m.top).toBe(300);
    m.sh = 2000;
    resize();
    expect(m.top).toBe(300);
  });

  it('re-engages when the reader scrolls back to within the threshold of the end', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    const onChange = vi.fn();
    render(<Harness metrics={m} options={{ onChange }} />);
    readerScrollsTo(m, 200);
    expect(onChange).toHaveBeenLastCalledWith(false);
    readerScrollsTo(m, 580); // 20px from the end, inside the 32px default
    expect(state()).toBe('bottom');
    expect(onChange).toHaveBeenLastCalledWith(true);
    m.sh = 1400;
    resize();
    expect(m.top).toBe(1000);
  });

  it('honours a custom threshold', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    render(<Harness metrics={m} options={{ threshold: 4 }} />);
    readerScrollsTo(m, 300);
    readerScrollsTo(m, 580);
    expect(state()).toBe('away');
    readerScrollsTo(m, 598);
    expect(state()).toBe('bottom');
  });

  it('a wheel turned upward releases at once, before any scroll event', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    render(<Harness metrics={m} />);
    act(() => {
      fireEvent.wheel(scroller(), { deltaY: -40 });
    });
    expect(state()).toBe('away');
    m.sh = 1200;
    resize();
    expect(m.top).toBe(600);
  });

  it('a wheel downward does not release', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    render(<Harness metrics={m} />);
    act(() => {
      fireEvent.wheel(scroller(), { deltaY: 40 });
    });
    expect(state()).toBe('bottom');
  });

  it('content that shrinks (clamping the scroll up) does not release', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    render(<Harness metrics={m} />);
    m.sh = 800;
    m.top = 400; // the browser clamps
    act(() => {
      fireEvent.scroll(scroller());
    });
    expect(state()).toBe('bottom');
  });

  it('an upward key releases, unless a control inside used it', async () => {
    vi.useFakeTimers();
    try {
      const m = { sh: 1000, ch: 400, top: 0 };
      render(<Harness metrics={m} />);
      const button = screen.getByRole('button', { name: 'latest' });
      // A roving-focus control inside prevents the arrow: nothing scrolls.
      button.addEventListener('keydown', (e) => e.preventDefault());
      act(() => {
        fireEvent.keyDown(button, { key: 'ArrowUp' });
        vi.runAllTimers();
      });
      expect(state()).toBe('bottom');
      act(() => {
        fireEvent.keyDown(scroller(), { key: 'PageUp' });
        vi.runAllTimers();
      });
      expect(state()).toBe('away');
    } finally {
      vi.useRealTimers();
    }
  });

  it('typing in a field inside the scroller is not scrolling', () => {
    vi.useFakeTimers();
    try {
      const m = { sh: 1000, ch: 400, top: 0 };
      render(<Harness metrics={m} />);
      act(() => {
        fireEvent.keyDown(screen.getByRole('textbox', { name: 'draft' }), { key: 'Home' });
        vi.runAllTimers();
      });
      expect(state()).toBe('bottom');
    } finally {
      vi.useRealTimers();
    }
  });

  it('holds still while a finger is on it, then decides where it was let go', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    render(<Harness metrics={m} />);
    act(() => {
      fireEvent.touchStart(scroller());
    });
    m.sh = 1200;
    resize();
    expect(m.top).toBe(600); // no programmatic scroll under the finger
    m.top = 800;
    act(() => {
      fireEvent.touchEnd(window);
    });
    expect(state()).toBe('bottom');
  });

  it('scrollToBottom re-engages and scrolls; smooth by default', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    render(<Harness metrics={m} />);
    const el = scroller();
    const scrollTo = vi.fn((opts: ScrollToOptions) => {
      m.top = clamp(m, opts.top ?? 0);
    });
    (el as unknown as { scrollTo: typeof scrollTo }).scrollTo = scrollTo;
    readerScrollsTo(m, 100);
    m.sh = 1500;
    fireEvent.click(screen.getByRole('button', { name: 'latest' }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 1100, behavior: 'smooth' });
    expect(state()).toBe('bottom');
  });

  it('scrollToBottom is instant under reduced motion', () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q })) as unknown as typeof window.matchMedia;
    try {
      const m = { sh: 1000, ch: 400, top: 0 };
      render(<Harness metrics={m} />);
      const scrollTo = vi.fn();
      (scroller() as unknown as { scrollTo: typeof scrollTo }).scrollTo = scrollTo;
      readerScrollsTo(m, 100);
      fireEvent.click(screen.getByRole('button', { name: 'latest' }));
      expect(scrollTo).not.toHaveBeenCalled();
      expect(m.top).toBe(600);
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  it('a data-motion="reduce" ancestor also means instant', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    render(
      <div data-motion="reduce">
        <Harness metrics={m} />
      </div>,
    );
    const scrollTo = vi.fn();
    (scroller() as unknown as { scrollTo: typeof scrollTo }).scrollTo = scrollTo;
    readerScrollsTo(m, 100);
    fireEvent.click(screen.getByRole('button', { name: 'latest' }));
    expect(scrollTo).not.toHaveBeenCalled();
    expect(m.top).toBe(600);
  });

  it('`initial: false` starts released and does not jump', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    render(<Harness metrics={m} options={{ initial: false }} />);
    expect(m.top).toBe(0);
    expect(state()).toBe('away');
  });

  it('cleans up its listeners and observers on unmount', () => {
    const m = { sh: 1000, ch: 400, top: 0 };
    const { unmount } = render(<Harness metrics={m} />);
    expect(observers.length).toBeGreaterThan(0);
    unmount();
    expect(observers).toHaveLength(0);
  });
});
