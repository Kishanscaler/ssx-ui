import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Grid, GridItem } from './Grid';

describe('Grid', () => {
  it('defaults to the auto-fill recipe with a narrow-safe track floor', () => {
    const { container } = render(<Grid />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('data-slot', 'grid');
    expect(el).toHaveAttribute('data-columns', 'auto');
    expect(el).toHaveAttribute('data-gap', 'default');
    expect(el).toHaveClass('grid', 'gap-4', 'min-w-0');
    expect(el.className).toContain('grid-cols-[repeat(auto-fill,minmax(min(13.75rem,100%),1fr))]');
  });

  it('a fixed count is one column below md and the count from md', () => {
    (['2', '3', '4'] as const).forEach((columns) => {
      const { container, unmount } = render(<Grid columns={columns} />);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveClass('grid-cols-1', `md:grid-cols-${columns}`);
      expect(el).toHaveAttribute('data-columns', columns);
      unmount();
    });
    const { container } = render(<Grid columns={3} />);
    expect(container.firstChild).toHaveAttribute('data-columns', '3');
  });

  it('maps the three gutters', () => {
    const { container, rerender } = render(<Grid gap="tight" />);
    expect(container.firstChild).toHaveClass('gap-2');
    rerender(<Grid gap="roomy" />);
    expect(container.firstChild).toHaveClass('gap-8');
    expect(container.firstChild).toHaveAttribute('data-gap', 'roomy');
  });

  it('as="ul" with GridItem as="li" is a real list', () => {
    render(
      <Grid as="ul" columns="3" aria-label="Outcomes">
        <GridItem as="li">1,142 students</GridItem>
        <GridItem as="li">₹19,50,000 median CTC</GridItem>
      </Grid>,
    );
    const list = screen.getByRole('list', { name: 'Outcomes' });
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(list.firstChild).toHaveAttribute('data-slot', 'grid-item');
  });

  it('forwards the ref and lets className win', () => {
    const ref = React.createRef<HTMLElement>();
    const { container } = render(<Grid ref={ref} gap="default" className="gap-6" />);
    expect(ref.current).toBe(container.firstChild);
    expect(ref.current).toHaveClass('gap-6');
    expect(ref.current).not.toHaveClass('gap-4');
  });
});

describe('GridItem', () => {
  it('spans collapse to full width below md', () => {
    const { container, rerender } = render(<GridItem span="2" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('data-slot', 'grid-item');
    expect(el).toHaveAttribute('data-span', '2');
    expect(el).toHaveClass('col-span-full', 'md:col-span-2', 'min-w-0');
    rerender(<GridItem span={3} />);
    expect(el).toHaveClass('col-span-full', 'md:col-span-3');
    rerender(<GridItem span="full" />);
    expect(el).toHaveClass('col-span-full');
    expect(el).not.toHaveClass('md:col-span-3');
  });

  it('a single-track item has no span class', () => {
    const { container } = render(<GridItem />);
    expect(container.firstChild).toHaveAttribute('data-span', '1');
    expect((container.firstChild as HTMLElement).className).not.toContain('col-span');
  });

  it('asChild puts the span on the child', () => {
    render(
      <GridItem span="2" asChild>
        <article aria-label="GSoC 2026">14 SST students selected</article>
      </GridItem>,
    );
    const tile = screen.getByRole('article', { name: 'GSoC 2026' });
    expect(tile).toHaveAttribute('data-slot', 'grid-item');
    expect(tile).toHaveClass('md:col-span-2');
  });
});
