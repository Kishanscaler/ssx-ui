import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Spinner } from './Spinner';
import componentsCss from '../../styles/components.css?raw';

/**
 * CONTRACT tests: the styling hooks, the announcement rules, the brand marks
 * and the className escape hatch. Not a snapshot of the SVG paths.
 */
describe('Spinner', () => {
  it('carries the shadcn styling hooks and defaults to sm', () => {
    const { container } = render(<Spinner />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-slot', 'spinner');
    expect(root).toHaveAttribute('data-size', 'sm');
  });

  it.each(['sm', 'md', 'lg', 'xl'] as const)('reflects size="%s" in data-size', (size) => {
    const { container } = render(<Spinner size={size} />);
    expect(container.firstElementChild).toHaveAttribute('data-size', size);
  });

  it('announces "Loading" as a status by default', () => {
    render(<Spinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('announces a specific label when given one', () => {
    render(<Spinner label="Loading applications" />);
    expect(screen.getByRole('status', { name: 'Loading applications' })).toBeInTheDocument();
  });

  it('is decorative with label={null}: no role, no name, hidden from AT', () => {
    const { container } = render(<Spinner label={null} />);
    const root = container.firstElementChild!;
    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('aria-label');
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('draws the six-dot grid at sm: six dots in one hidden grid, no brand marks', () => {
    const { container } = render(<Spinner />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-kind', 'dots');
    const grid = root.querySelector('[data-part="dots"]')!;
    expect(grid).toHaveAttribute('aria-hidden', 'true');
    // One grid, and every dot is a direct cell of it: 2 columns x 3 rows.
    expect(root.querySelectorAll('[data-part="dots"]')).toHaveLength(1);
    const dots = grid.querySelectorAll(':scope > [data-part="dot"]');
    expect(dots).toHaveLength(6);
    expect(root.querySelectorAll('[data-part="dot"]')).toHaveLength(6);
    expect(root.querySelector('svg')).toBeNull();
  });

  it.each(['md', 'lg', 'xl'] as const)('draws the monogram at size="%s"', (size) => {
    const { container } = render(<Spinner size={size} />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-kind', 'monogram');
    expect(root.querySelector('[data-part="dot"]')).toBeNull();
    expect(root.querySelectorAll('svg[data-brand-mark]')).toHaveLength(2);
  });

  it('lets kind override the size rule, for a md/lg Button\'s 16px monogram', () => {
    const { container } = render(<Spinner kind="monogram" />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-size', 'sm');
    expect(root).toHaveAttribute('data-kind', 'monogram');
    expect(root.querySelectorAll('svg[data-brand-mark]')).toHaveLength(2);
  });

  it.each([undefined, 'md'] as const)(
    'keeps the same status contract for both kinds (size=%s)',
    (size) => {
      render(<Spinner size={size} label="Loading applications" />);
      const status = screen.getByRole('status', { name: 'Loading applications' });
      expect(status).toHaveAttribute('data-slot', 'spinner');
    },
  );

  it('renders both brand marks, so [data-brand] up the tree can pick one', () => {
    const { container } = render(<Spinner size="md" />);
    const marks = container.querySelectorAll('svg[data-brand-mark]');
    expect([...marks].map((m) => m.getAttribute('data-brand-mark'))).toEqual(['sst', 'ssb']);
    for (const mark of marks) {
      expect(mark).toHaveAttribute('aria-hidden', 'true');
      for (const part of ['ghost', 'body', 'outer', 'inner']) {
        expect(mark.querySelector(`[data-part="${part}"]`)).not.toBeNull();
      }
    }
  });

  it('lets className override its size through cn', () => {
    const { container } = render(<Spinner size="md" className="size-6" />);
    const root = container.firstElementChild!;
    expect(root).toHaveClass('size-6');
    expect(root).not.toHaveClass('size-icon-lg');
  });

  it('passes native props and ref through to the root span', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} id="page-loader" data-testid="spinner" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(screen.getByTestId('spinner')).toHaveAttribute('id', 'page-loader');
  });
});

/**
 * jsdom does no layout, so the grid's SHAPE is pinned against the stylesheet:
 * two columns, three rows, and the six cells in clockwise order round the
 * outside. A regression to any other arrangement fails here.
 */
describe('Spinner dots geometry (components.css)', () => {
  const css = componentsCss.replace(/\s+/g, ' ');

  it('lays the dots out as a 2 x 3 grid', () => {
    expect(css).toContain('grid-template-columns: repeat(2, var(--ssx-dots-cell))');
    expect(css).toContain('grid-template-rows: repeat(3, var(--ssx-dots-cell))');
  });

  it('places the six dots clockwise from the top-left, a sixth of the cycle apart', () => {
    const cells = ['1 / 1', '1 / 2', '2 / 2', '3 / 2', '3 / 1', '2 / 1'];
    const phases = ['0', '0.1667', '0.3333', '0.5', '0.6667', '0.8333'];
    cells.forEach((cell, i) => {
      expect(css).toContain(
        `[data-part='dot']:nth-child(${i + 1}) { grid-area: ${cell}; --ssx-dot-phase: ${phases[i]}; }`,
      );
    });
    expect(css).not.toContain(":nth-child(7)");
  });
});
