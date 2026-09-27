import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Grid · GridItem
 *
 * Two-dimensional layout in four fixed recipes: one that fills itself and
 * three with an explicit column count. Every one of them is ONE COLUMN on a
 * small screen; the multi-column arrangement is the enhancement a wide
 * viewport earns, never the default state.
 *
 *   <Grid>                   auto-fill, tracks of at least 220px (13.75rem)
 *   <Grid columns="3">       one column below `md` (1056px), three from `md`
 *   <Grid columns="4" gap="tight">   the admissions-ops density (8px)
 *   <GridItem span="2">      a bento hero tile, two tracks wide from `md`
 *
 * `md` is the single breakpoint of the whole grid story, as in the preview.
 * Nobody writes a media query at the call site.
 *
 * The auto recipe's track floor is `min(13.75rem, 100%)`, not a bare 220px:
 * inside a card or a 320px phone minus the gutter a bare 220px track would be
 * wider than the grid and overflow. The preview is silent on this; it is the
 * narrow-screen rule (docs/05 rule 11).
 *
 * SPANS LIVE ON THE CHILD (`GridItem`), because that is where a layout
 * decision belongs: nothing about the card inside knows it is two tracks
 * wide. `span="2"` and `"3"` apply from `md` and are full width below it,
 * so a span can never manufacture an implicit second track on a phone.
 * `span="full"` is `1 / -1` at every width. In the auto recipe a span is only
 * safe when the grid is wide enough for that many tracks.
 *
 * Polymorphism: `as` (a short list) or `asChild` (Radix Slot), the same rule
 * as Stack. `as="ul"` with `GridItem as="li"` gives a real list of cards.
 *
 * Server components: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

export const gridVariants = cva('grid min-w-0', {
  variants: {
    columns: {
      auto: 'grid-cols-[repeat(auto-fill,minmax(min(var(--size-panel-xs),100%),1fr))]',
      '2': 'grid-cols-1 md:grid-cols-2',
      '3': 'grid-cols-1 md:grid-cols-3',
      '4': 'grid-cols-1 md:grid-cols-4',
    },
    gap: {
      tight: 'gap-2',
      default: 'gap-4',
      roomy: 'gap-8',
    },
  },
  defaultVariants: { columns: 'auto', gap: 'default' },
});

export const gridItemVariants = cva('min-w-0', {
  variants: {
    span: {
      '1': '',
      '2': 'col-span-full md:col-span-2',
      '3': 'col-span-full md:col-span-3',
      full: 'col-span-full',
    },
  },
  defaultVariants: { span: '1' },
});

/** `auto` fills itself from the available width; a number is fixed from `md`. */
export type GridColumns = 'auto' | '2' | '3' | '4';
/** The gutter between tracks: `tight` 8px (ops) · `default` 16px (LMS) · `roomy` 32px (marketing). */
export type GridGap = 'tight' | 'default' | 'roomy';
/** How many tracks a GridItem takes. */
export type GridItemSpan = '1' | '2' | '3' | 'full';
/** The elements a Grid may render as without `asChild`. */
export type GridElement = 'div' | 'section' | 'ul' | 'ol' | 'dl';
/** The elements a GridItem may render as without `asChild`. */
export type GridItemElement = 'div' | 'li' | 'article' | 'section' | 'aside';

export type GridProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * The column recipe. `auto` derives the count from the width (tracks of at
   * least 220px). `2` / `3` / `4` are equal columns from `md` (1056px) and a
   * single column below it. Numbers are accepted too (`columns={3}`).
   *
   * @default 'auto'
   */
  columns?: GridColumns | 2 | 3 | 4;
  /**
   * The gutter, one per surface density: `tight` 8px for admissions ops,
   * `default` 16px for the student LMS, `roomy` 32px for marketing.
   *
   * @default 'default'
   */
  gap?: GridGap;
  /**
   * The element to render. `ul` / `ol` when the tiles are a list (pair with
   * `GridItem as="li"`). Ignored with `asChild`.
   *
   * @default 'div'
   */
  as?: GridElement;
  /**
   * Merge the Grid onto its single child instead of rendering an element.
   *
   * @default false
   */
  asChild?: boolean;
};

export type GridItemProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * Tracks to take. `2` / `3` apply from `md` and are full width below it;
   * `full` runs edge to edge at every width. Numbers are accepted too.
   *
   * @default '1'
   */
  span?: GridItemSpan | 1 | 2 | 3;
  /**
   * The element to render. `li` inside `<Grid as="ul">`. Ignored with
   * `asChild`.
   *
   * @default 'div'
   */
  as?: GridItemElement;
  /**
   * Put the span on the child you pass instead of wrapping it:
   * `<GridItem span="2" asChild><Card>...</Card></GridItem>`.
   *
   * @default false
   */
  asChild?: boolean;
};

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const s = String(value);
  return (allowed as readonly string[]).includes(s) ? (s as T) : fallback;
}

export const Grid = React.forwardRef<HTMLElement, GridProps>(function Grid(
  { className, columns: columnsProp = 'auto', gap = 'default', as = 'div', asChild = false, ...props },
  ref,
) {
  const columns = pick<GridColumns>(columnsProp, ['auto', '2', '3', '4'], 'auto');
  const Comp: React.ElementType = asChild ? Slot : as;
  return (
    <Comp
      ref={ref}
      data-slot="grid"
      data-columns={columns}
      data-gap={gap}
      className={cn(gridVariants({ columns, gap }), className)}
      {...props}
    />
  );
});
Grid.displayName = 'Grid';

export const GridItem = React.forwardRef<HTMLElement, GridItemProps>(function GridItem(
  { className, span: spanProp = '1', as = 'div', asChild = false, ...props },
  ref,
) {
  const span = pick<GridItemSpan>(spanProp, ['1', '2', '3', 'full'], '1');
  const Comp: React.ElementType = asChild ? Slot : as;
  return (
    <Comp
      ref={ref}
      data-slot="grid-item"
      data-span={span}
      className={cn(gridItemVariants({ span }), className)}
      {...props}
    />
  );
});
GridItem.displayName = 'GridItem';
