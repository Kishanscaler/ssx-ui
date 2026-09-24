import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { StatusDot, type StatusDotTone } from './StatusDot';
import componentsCss from '../../styles/components.css?raw';

const TONES: StatusDotTone[] = ['neutral', 'success', 'warning', 'danger', 'info', 'brand'];

describe('StatusDot', () => {
  it('is aria-hidden: the adjacent label carries the meaning', () => {
    const { container } = render(<StatusDot />);
    const dot = container.firstChild as HTMLElement;
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot).toHaveAttribute('data-slot', 'status-dot');
    expect(dot).toHaveAttribute('data-tone', 'neutral');
    expect(dot).toHaveAttribute('data-size', 'md');
    expect(dot).toHaveClass('size-2');
  });

  it.each(TONES)('tone %s', (tone) => {
    const { container } = render(<StatusDot tone={tone} />);
    expect(container.firstChild).toHaveAttribute('data-tone', tone);
  });

  it('lg is 10px', () => {
    const { container } = render(<StatusDot size="lg" />);
    expect(container.firstChild).toHaveClass('size-2.5');
  });

  it('pulse sets data-pulse and the stacking context the ring (components.css) needs', () => {
    const { container, rerender } = render(<StatusDot tone="danger" pulse />);
    expect(container.firstChild).toHaveAttribute('data-pulse');
    // The animation itself (the dot's scale, the ring's ::before) lives in
    // `components.css`, keyed off `data-pulse` — these two classes are what
    // let a negative `z-index` on that ring stay BEHIND the dot's own paint.
    expect(container.firstChild).toHaveClass('relative', 'isolate');
    rerender(<StatusDot tone="danger" />);
    expect(container.firstChild).not.toHaveAttribute('data-pulse');
    expect(container.firstChild).not.toHaveClass('relative', 'isolate');
  });

  it('forwards the ref and merges className last', () => {
    const ref = React.createRef<HTMLSpanElement>();
    const { container } = render(<StatusDot ref={ref} className="size-3" />);
    expect(ref.current).toBe(container.firstChild);
    expect(ref.current).toHaveClass('size-3');
    expect(ref.current).not.toHaveClass('size-2');
  });
});

/**
 * jsdom does no layout or animation, so the pulse ring is pinned against the
 * stylesheet: a dot that scales, a `::before` ring that grows past it and
 * fades, and both switched off — the ring pseudo-element removed entirely,
 * not just its animation — under reduced motion (the OS media query and an
 * app-level `data-motion="reduce"` ancestor).
 */
describe('StatusDot pulse (components.css)', () => {
  const css = componentsCss.replace(/\s+/g, ' ');

  it('scales the dot and grows a same-tone ring past it, fading to nothing', () => {
    expect(css).toContain("[data-slot='status-dot'][data-pulse] {");
    expect(css).toContain('animation: ssx-status-dot-pulse');
    expect(css).toContain("[data-slot='status-dot'][data-pulse]::before {");
    expect(css).toContain('background-color: inherit');
    expect(css).toContain('animation: ssx-status-dot-ring');
    expect(css).toMatch(/@keyframes ssx-status-dot-ring \{ 0% \{ transform: scale\(1\); opacity: 0\.55; \} 100% \{ transform: scale\(2\.5\); opacity: 0; \} \}/);
  });

  it('holds a static dot and removes the ring under reduced motion', () => {
    for (const prefix of ['@media (prefers-reduced-motion: reduce) {', "[data-motion='reduce']"]) {
      expect(css).toContain(prefix);
    }
    expect(css).toMatch(/\[data-slot='status-dot'\]\[data-pulse\] \{ animation: none; transform: none; \}/);
    expect(css).toMatch(/\[data-slot='status-dot'\]\[data-pulse\]::before \{ content: none; \}/);
    expect(css).toContain("[data-motion='reduce'] [data-slot='status-dot'][data-pulse] { animation: none; transform: none; }");
    expect(css).toContain("[data-motion='reduce'] [data-slot='status-dot'][data-pulse]::before { content: none; }");
  });
});
