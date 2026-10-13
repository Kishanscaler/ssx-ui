import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { GlassPlate, type GlassPlateTone } from '../GlassPlate';
import { StatCard, type StatCardProps } from '../StatCard';

/* ---------------------------------------------------------------------------
 * StatGroup (marketing)
 *
 * A row of StatCards: the Innovation Lab's three, the internship's three
 * boxes, Placements' strip of four and its four on a plate over a photo, the
 * Why breaker's two. A grid, two columns on a phone and `columns` from `sm`.
 *
 *   <StatGroup columns={4} divided plate as="dl">
 *     <StatCard value="₹19L" label="average CTC" />
 *     …
 *
 * Width comes from the cell it sits in; the columns share it equally.
 *
 * FIGURES LEVEL. Each card spans five of the group's rows and lays its parts
 * on them (CSS subgrid: eyebrow, figure, label, description, source), so in a
 * row of cards every figure sits on one line, however many lines an eyebrow
 * or a label takes, and every source sits at one foot. Rows of cards are kept
 * apart by a 24px margin on the cards below the first row (by column count at
 * each width), not a row gap, which would also open between a card's parts.
 *
 *   - `divided` draws a hairline between the cells of a row (the placements
 *     plate's rules), the space either side of it equal (`gap-x-5` before it,
 *     `ps-5` after). No line between rows of cards, so a row that wraps on a
 *     phone (2 across) still reads: the first cell of every row has no rule,
 *     by column count at each width.
 *   - `plate` makes the group a GlassPlate (one element: the plate is the
 *     list, so `className`, the ref and `aria-*` land on it). The plate
 *     declares on-image ink, so the figures and labels inside go white and
 *     the rules take the glass edge; boxed cards drop their fill and padding
 *     there (the plate is the box). Its corners and 16×20 padding are the
 *     plate's. `plateTone="dark"` for a pale photo.
 *
 * Semantics (`as`): `ul` makes its StatCards `li`s; `dl` makes them term and
 * definition groups (each card a `div` of `dt` label and `dd` figure, which
 * HTML allows inside a `dl`), the placements plate's markup. Cards that set
 * their own `as` keep it in a `ul`.
 *
 * MARKERS, NOT MOTION. `data-slot="stat-group"`, `data-columns`,
 * `data-divided`, `data-plate` (its tone) on the root; the cards carry their
 * own. No wrapper per cell: the cards are the cells. A plated group also
 * carries GlassPlate's `data-tone` and `data-surface-ink`.
 *
 * Server component: no hooks, no handlers. React 16 safe.
 * ------------------------------------------------------------------------- */

/** Columns from `sm` up (2 below). */
export type StatGroupColumns = 2 | 3 | 4;
/** The root element. */
export type StatGroupElement = 'div' | 'ul' | 'dl' | 'section';

// Each card spans five of the group's rows and takes them as its own
// (subgrid), so the parts of a row of cards share lines: every figure on one
// line, every source at one foot. Where subgrid is not supported the
// declaration is dropped and each card keeps its own five rows.
const SUBGRID_CELLS = '*:row-span-5 *:grid-rows-subgrid';

// Rows of cards stay apart by a margin on every card below the first row (a
// row gap would also open between a card's own five rows), by the column
// count at each width.
const ROW_GAP_BELOW_SM = 'max-sm:*:nth-[n+3]:mt-6';
const ROW_GAP: Record<StatGroupColumns, string> = {
  2: 'sm:*:nth-[n+3]:mt-6',
  3: 'sm:*:nth-[n+4]:mt-6',
  4: 'sm:*:nth-[n+5]:mt-6',
};

// Every cell after the first in its row: a rule at its start, the gap's
// width of space after it. The first cell of each row, by the column count
// at each width, has neither.
const DIVIDED_CELLS = '*:border-s *:ps-5';
const FIRST_IN_ROW_BELOW_SM = 'max-sm:*:nth-[2n+1]:border-s-0 max-sm:*:nth-[2n+1]:ps-0';
const FIRST_IN_ROW: Record<StatGroupColumns, string> = {
  2: 'sm:*:nth-[2n+1]:border-s-0 sm:*:nth-[2n+1]:ps-0',
  3: 'sm:*:nth-[3n+1]:border-s-0 sm:*:nth-[3n+1]:ps-0',
  4: 'sm:*:nth-[4n+1]:border-s-0 sm:*:nth-[4n+1]:ps-0',
};

export const statGroupVariants = cva(['m-0 grid min-w-0 list-none grid-cols-2 gap-y-0 font-sans', SUBGRID_CELLS], {
  variants: {
    columns: {
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-3',
      4: 'sm:grid-cols-4',
    },
    divided: {
      true: 'gap-x-5',
      false: 'gap-x-6',
    },
  },
  defaultVariants: { columns: 4, divided: false },
});

export interface StatGroupProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Columns from `sm` up; two below.
   *
   * @default 4
   */
  columns?: StatGroupColumns;
  /**
   * A hairline between the cells of a row (none between rows).
   *
   * @default false
   */
  divided?: boolean;
  /**
   * Put the group on a GlassPlate: the placements figures on their photo.
   * The type inside goes white (on-image ink).
   *
   * @default false
   */
  plate?: boolean;
  /**
   * The plate's tone, with `plate`: `light` the on-image glass (a dark
   * photo) · `dark` the fixed dark plate (a pale one).
   *
   * @default 'light'
   */
  plateTone?: GlassPlateTone;
  /**
   * The element. `ul` for a list of figures (the cards become `li`s), `dl`
   * for figures and their labels as terms and definitions.
   *
   * @default 'div'
   */
  as?: StatGroupElement;
  /** The StatCards. */
  children?: React.ReactNode;
}

/** The StatCards, marked up for the list they are in. */
function cellsFor(as: StatGroupElement, children: React.ReactNode): React.ReactNode {
  if (as !== 'ul' && as !== 'dl') return children;
  return React.Children.map(children, (child) => {
    if (!React.isValidElement<StatCardProps>(child) || child.type !== StatCard) return child;
    if (as === 'dl') return React.cloneElement(child, { definition: true });
    return child.props.as ? child : React.cloneElement(child, { as: 'li' });
  });
}

export const StatGroup = React.forwardRef<HTMLElement, StatGroupProps>(function StatGroup(
  {
    className,
    columns = 4,
    divided = false,
    plate = false,
    plateTone = 'light',
    as = 'div',
    children,
    ...props
  },
  ref,
) {
  const cols: StatGroupColumns = columns in FIRST_IN_ROW ? columns : 4;
  const classes = cn(
    statGroupVariants({ columns: cols, divided }),
    // A plate brings its own padding; a bare list drops the UA's.
    !plate && 'p-0',
    ROW_GAP_BELOW_SM,
    ROW_GAP[cols],
    divided && [
      DIVIDED_CELLS,
      FIRST_IN_ROW_BELOW_SM,
      FIRST_IN_ROW[cols],
      plate
        ? '*:border-glass-on-image-hover'
        : '*:border-border-decorative in-data-[surface-ink=on-image]:*:border-glass-on-image-hover',
    ],
    className,
  );
  const markers = {
    'data-slot': 'stat-group',
    'data-columns': cols,
    'data-divided': divided || undefined,
    'data-plate': plate ? plateTone : undefined,
  };
  const cells = cellsFor(as, children);

  if (plate) {
    return (
      <GlassPlate ref={ref} as={as} tone={plateTone} {...markers} className={classes} {...props}>
        {cells}
      </GlassPlate>
    );
  }
  return React.createElement(as, { ref, ...markers, className: classes, ...props }, cells);
});
StatGroup.displayName = 'StatGroup';
