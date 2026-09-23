import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ProgressBar } from './ProgressBar';

const indicator = (el: HTMLElement) => el.querySelector('[data-slot="progress-bar-indicator"]') as HTMLElement;

describe('ProgressBar', () => {
  it('is a named progressbar with min, max and now', () => {
    render(<ProgressBar aria-label="Module 4 of 12 complete" value={33} />);
    const bar = screen.getByRole('progressbar', { name: 'Module 4 of 12 complete' });
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuenow', '33');
    expect(bar).toHaveAttribute('data-slot', 'progress-bar');
    expect(bar).toHaveAttribute('data-state', 'loading');
    expect(indicator(bar).style.transform).toBe('translateX(-67%)');
  });

  it('works in its own units: 4 of 12 fills a third', () => {
    render(<ProgressBar aria-label="Year 1" min={0} max={12} value={4} aria-valuetext="Module 4 of 12 complete" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '12');
    expect(bar).toHaveAttribute('aria-valuenow', '4');
    expect(bar).toHaveAttribute('aria-valuetext', 'Module 4 of 12 complete');
    const x = parseFloat(indicator(bar).style.transform.replace('translateX(', ''));
    expect(x).toBeCloseTo(-66.667, 2);
  });

  it('supports a non-zero min', () => {
    render(<ProgressBar aria-label="Credits" min={12} max={24} value={18} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '12');
    expect(indicator(bar).style.transform).toBe('translateX(-50%)');
  });

  it('clamps out-of-range values', () => {
    const { rerender } = render(<ProgressBar aria-label="x" value={140} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-state', 'complete');
    rerender(<ProgressBar aria-label="x" value={-5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('is indeterminate with no value, and omits aria-valuenow', () => {
    render(<ProgressBar aria-label="Uploading transcript.pdf" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).toHaveAttribute('data-state', 'indeterminate');
    expect(indicator(bar).className).toContain('animate-ssx-progress-indeterminate');
    expect(indicator(bar).className).toContain('motion-reduce:animate-none');
  });

  it('lets className win over the recipe', () => {
    render(<ProgressBar aria-label="x" value={1} className="h-1" />);
    const cls = screen.getByRole('progressbar').className;
    expect(cls).toContain('h-1');
    expect(cls).not.toContain('h-2');
  });

  it('forwards a ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ProgressBar ref={ref} aria-label="x" value={1} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
