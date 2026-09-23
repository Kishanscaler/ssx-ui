import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { StatusDot, type StatusDotTone } from './StatusDot';

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

  it('pulse animates, and stops under reduced motion', () => {
    const { container, rerender } = render(<StatusDot tone="danger" pulse />);
    expect(container.firstChild).toHaveAttribute('data-pulse');
    expect(container.firstChild).toHaveClass('animate-ssx-pulse', 'motion-reduce:animate-none');
    rerender(<StatusDot tone="danger" />);
    expect(container.firstChild).not.toHaveAttribute('data-pulse');
    expect(container.firstChild).not.toHaveClass('animate-ssx-pulse');
  });

  it('forwards the ref and merges className last', () => {
    const ref = React.createRef<HTMLSpanElement>();
    const { container } = render(<StatusDot ref={ref} className="size-3" />);
    expect(ref.current).toBe(container.firstChild);
    expect(ref.current).toHaveClass('size-3');
    expect(ref.current).not.toHaveClass('size-2');
  });
});
