import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is hidden from assistive tech; the container announces the wait', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el).toHaveAttribute('data-slot', 'skeleton');
    expect(el).toHaveAttribute('data-shape', 'text');
    expect(el).toHaveClass('h-3', 'bg-surface-active');
  });

  it('title is a 20px line', () => {
    const { container } = render(<Skeleton shape="title" />);
    expect(container.firstChild).toHaveClass('h-5');
  });

  it.each([
    ['sm', 'size-7'],
    ['md', 'size-control-md'],
    ['lg', 'size-control-lg'],
  ] as const)('circle %s matches the avatar (%s)', (size, cls) => {
    const { container } = render(<Skeleton shape="circle" size={size} />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('data-size', size);
    expect(el).toHaveClass('rounded-full', cls);
  });

  it('size is only emitted for circles', () => {
    const { container } = render(<Skeleton shape="text" size="lg" />);
    expect(container.firstChild).not.toHaveAttribute('data-size');
  });

  it('the shimmer stops under reduced motion', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('after:animate-ssx-shimmer', 'motion-reduce:after:hidden');
  });

  it('forwards the ref and merges className last', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(<Skeleton ref={ref} className="w-1/2" />);
    expect(ref.current).toBe(container.firstChild);
    expect(ref.current).toHaveClass('w-1/2');
    expect(ref.current).not.toHaveClass('w-full');
  });
});
