import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { StatGroup } from './StatGroup';
import { StatCard } from '../StatCard';
import * as marketing from '../../marketing';

const slot = (root: ParentNode, name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const all = (root: ParentNode, name: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`));

const FOUR = [
  ['₹19L', 'average CTC'],
  ['₹1.2Cr', 'highest CTC'],
  ['3×', 'average hike'],
  ['200+', 'recruiters'],
] as const;

const cards = (n = 4) => FOUR.slice(0, n).map(([v, l]) => <StatCard key={l} value={v} label={l} />);

describe('StatGroup', () => {
  let errors: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('is a grid of its cards with its markers; two columns below sm, four from it by default', () => {
    const { container } = render(<StatGroup>{cards()}</StatGroup>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveAttribute('data-slot', 'stat-group');
    expect(root).toHaveAttribute('data-columns', '4');
    expect(root).not.toHaveAttribute('data-divided');
    expect(root).not.toHaveAttribute('data-plate');
    expect(root).toHaveClass('grid', 'grid-cols-2', 'sm:grid-cols-4', 'gap-x-6', 'gap-y-0');
    // The cards share the group's rows (subgrid), so their figures line up.
    expect(root).toHaveClass('*:row-span-5', '*:grid-rows-subgrid');
    // The cards are the cells: no wrapper per child.
    expect(Array.from(root.children).every((c) => c.getAttribute('data-slot') === 'stat-card')).toBe(true);
    expect(slot(container, 'glass-plate')).toBeNull();
  });

  it.each([
    [2, 'sm:grid-cols-2', 'sm:*:nth-[n+3]:mt-6'],
    [3, 'sm:grid-cols-3', 'sm:*:nth-[n+4]:mt-6'],
    [4, 'sm:grid-cols-4', 'sm:*:nth-[n+5]:mt-6'],
  ] as const)('columns={%s} sets %s, and the space above every card below the first row', (columns, cls, rowGap) => {
    const { container } = render(<StatGroup columns={columns}>{cards(columns)}</StatGroup>);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-columns', String(columns));
    expect(root).toHaveClass('grid-cols-2', cls, 'max-sm:*:nth-[n+3]:mt-6', rowGap);
  });

  it.each([
    [2, 'sm:*:nth-[2n+1]:border-s-0'],
    [3, 'sm:*:nth-[3n+1]:border-s-0'],
    [4, 'sm:*:nth-[4n+1]:border-s-0'],
  ] as const)('divided with %s columns: a rule before every cell but the first of each row', (columns, firstInRow) => {
    const { container } = render(
      <StatGroup columns={columns} divided>
        {cards(columns)}
      </StatGroup>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-divided');
    expect(root).toHaveClass(
      '*:border-s',
      '*:ps-5',
      'gap-x-5',
      'max-sm:*:nth-[2n+1]:border-s-0',
      firstInRow,
      '*:border-border-decorative',
    );
  });

  it('plate: the group is a GlassPlate with its tone, its rules the glass edge', () => {
    const { container } = render(
      <StatGroup plate divided>
        {cards()}
      </StatGroup>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-slot', 'stat-group');
    expect(root).toHaveAttribute('data-plate', 'light');
    expect(root).toHaveAttribute('data-tone', 'light');
    expect(root).toHaveAttribute('data-surface-ink', 'on-image');
    expect(root).toHaveClass('bg-glass-on-image', 'rounded-lg', 'px-5', 'py-4', 'grid', '*:border-glass-on-image-hover');
    expect(root).not.toHaveClass('p-0', '*:border-border-decorative');
  });

  it('plateTone="dark" is the fixed dark plate', () => {
    const { container } = render(
      <StatGroup plate plateTone="dark">
        {cards()}
      </StatGroup>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-plate', 'dark');
    expect(root).toHaveAttribute('data-tone', 'dark');
    expect(root).toHaveClass('bg-(--ssx-plate-on-photo,var(--surface-image-scrim))');
  });

  it('as="ul" makes its StatCards list items, unless a card names its own element', () => {
    const { container } = render(
      <StatGroup as="ul" columns={3}>
        <StatCard value="$1B+" label="a" />
        <StatCard value="₹10Cr+" label="b" />
        <StatCard as="li" value="$2M+" label="c" />
      </StatGroup>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('UL');
    expect(root).toHaveClass('list-none', 'p-0', 'm-0');
    expect(all(root, 'stat-card').map((c) => c.tagName)).toEqual(['LI', 'LI', 'LI']);
  });

  it('as="dl" makes its StatCards term-and-definition groups', () => {
    const { container } = render(
      <StatGroup as="dl" plate divided>
        {cards()}
      </StatGroup>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DL');
    for (const card of all(root, 'stat-card')) {
      expect(card.tagName).toBe('DIV');
      expect(Array.from(card.children).map((c) => c.tagName)).toEqual(['DT', 'DD']);
    }
  });

  it('leaves children that are not StatCards alone', () => {
    const { container } = render(
      <StatGroup as="ul">
        <li data-testid="own">mine</li>
      </StatGroup>,
    );
    expect(container.querySelector('[data-testid="own"]')!.tagName).toBe('LI');
  });

  it('forwards its ref, className and attributes to the root, plated or not', () => {
    for (const plate of [false, true]) {
      const ref = React.createRef<HTMLElement>();
      const { container, unmount } = render(
        <StatGroup ref={ref} plate={plate} className="mt-8" aria-label="Placements">
          {cards()}
        </StatGroup>,
      );
      expect(ref.current).toBe(container.firstElementChild);
      expect(ref.current).toHaveClass('mt-8');
      expect(ref.current).toHaveAttribute('aria-label', 'Placements');
      unmount();
    }
  });

  it.each([
    ['sst', 'light'],
    ['sst', 'dark'],
    ['ssb', 'light'],
    ['ssb', 'dark'],
  ] as const)('renders under data-brand="%s" data-theme="%s", setting neither', (brand, theme) => {
    const { container } = render(
      <div data-brand={brand} data-theme={theme}>
        <StatGroup as="dl" columns={4} divided plate>
          {cards()}
        </StatGroup>
      </div>,
    );
    const root = slot(container, 'stat-group')!;
    expect(root.querySelectorAll('[data-brand], [data-theme]')).toHaveLength(0);
    expect(all(root, 'stat-card')).toHaveLength(4);
  });

  it('is exported from the marketing entry', () => {
    expect(marketing.StatGroup).toBe(StatGroup);
    expect(typeof marketing.statGroupVariants).toBe('function');
  });
});
