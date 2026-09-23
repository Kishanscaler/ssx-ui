import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { markScrollEdges, useScrollEdges } from './use-scroll-edges';

/** Gives an element fixed scroll geometry (jsdom has no layout). */
function geometry(el: HTMLElement, { scrollWidth, clientWidth, scrollLeft = 0 }: { scrollWidth: number; clientWidth: number; scrollLeft?: number }) {
  Object.defineProperty(el, 'scrollWidth', { configurable: true, get: () => scrollWidth });
  Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => clientWidth });
  Object.defineProperty(el, 'scrollLeft', { configurable: true, writable: true, value: scrollLeft });
}

const flags = (el: HTMLElement) =>
  ['data-overflow', 'data-overflow-start', 'data-overflow-end'].filter((n) => el.hasAttribute(n));

describe('markScrollEdges', () => {
  it('marks nothing when the content fits (1px of sub-pixel slack)', () => {
    const el = document.createElement('div');
    geometry(el, { scrollWidth: 301, clientWidth: 300 });
    markScrollEdges(el);
    expect(flags(el)).toEqual([]);
  });

  it('marks the end at the start, both in the middle, the start at the end', () => {
    const el = document.createElement('div');
    geometry(el, { scrollWidth: 600, clientWidth: 300, scrollLeft: 0 });
    markScrollEdges(el);
    expect(flags(el)).toEqual(['data-overflow', 'data-overflow-end']);
    el.scrollLeft = 150;
    markScrollEdges(el);
    expect(flags(el)).toEqual(['data-overflow', 'data-overflow-start', 'data-overflow-end']);
    el.scrollLeft = 300;
    markScrollEdges(el);
    expect(flags(el)).toEqual(['data-overflow', 'data-overflow-start']);
  });

  it('RTL: a negative scrollLeft counts by its magnitude', () => {
    const el = document.createElement('div');
    geometry(el, { scrollWidth: 600, clientWidth: 300, scrollLeft: -300 });
    markScrollEdges(el);
    expect(flags(el)).toEqual(['data-overflow', 'data-overflow-start']);
  });
});

function Scroller({ enabled = true }: { enabled?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useScrollEdges(ref, enabled);
  return (
    <div ref={ref} data-testid="scroller">
      <span>a</span>
    </div>
  );
}

describe('useScrollEdges', () => {
  it('re-measures on scroll, and clears the marks when disabled', () => {
    const { rerender } = render(<Scroller />);
    const el = screen.getByTestId('scroller');
    geometry(el, { scrollWidth: 600, clientWidth: 300, scrollLeft: 300 });
    // requestAnimationFrame batches the scroll; flush it.
    fireEvent.scroll(el);
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        expect(flags(el)).toEqual(['data-overflow', 'data-overflow-start']);
        rerender(<Scroller enabled={false} />);
        expect(flags(el)).toEqual([]);
        resolve();
      });
    });
  });
});
