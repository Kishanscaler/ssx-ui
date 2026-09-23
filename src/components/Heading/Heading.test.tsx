import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Heading } from './Heading';

describe('Heading', () => {
  it('level and size are independent', () => {
    render(
      <Heading as="h1" size="display">
        Four years. One production engineer.
      </Heading>,
    );
    const h = screen.getByRole('heading', { level: 1 });
    expect(h).toHaveAttribute('data-slot', 'heading');
    expect(h).toHaveAttribute('data-size', 'display');
    expect(h.className).toContain('text-(length:--type-display-size)');
  });

  it.each([
    ['h1', '1'],
    ['h2', '2'],
    ['h3', '3'],
    ['h4', '3'],
    ['h6', '3'],
  ] as const)('%s defaults to size %s', (as, size) => {
    render(<Heading as={as}>Title</Heading>);
    expect(screen.getByRole('heading')).toHaveAttribute('data-size', size);
  });

  it('a small size on a high level keeps the level', () => {
    render(
      <Heading as="h2" size="3">
        Segment trees
      </Heading>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('data-size', '3');
  });

  it('an eyebrow can stay out of the outline with as="p"', () => {
    render(<Heading as="p">Scaler School of Technology</Heading>);
    expect(screen.queryByRole('heading')).toBeNull();
    const el = screen.getByText('Scaler School of Technology');
    expect(el).toHaveAttribute('data-size', 'eyebrow');
    expect(el).toHaveClass('uppercase', 'text-content-secondary');
  });

  it('requires `as` in its type', () => {
    // @ts-expect-error `as` is required
    const el = <Heading>Untitled</Heading>;
    expect(el).toBeTruthy();
  });

  it('forwards the ref and merges className last', () => {
    const ref = React.createRef<HTMLHeadingElement>();
    render(
      <Heading as="h2" ref={ref} className="m-4">
        Section
      </Heading>,
    );
    expect(ref.current).toBe(screen.getByRole('heading'));
    expect(ref.current).toHaveClass('m-4');
    expect(ref.current).not.toHaveClass('m-0');
  });
});
