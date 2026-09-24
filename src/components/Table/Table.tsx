import * as React from 'react';

import { cn } from '../../lib/cn';
import { TableScrollArea } from './TableScrollArea';
import { TableSortButton, type TableSortButtonProps, type TableSortDirection } from './TableSortButton';

/* ---------------------------------------------------------------------------
 * Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell,
 * TableCaption
 *
 * A plain semantic table for READING tabular data: the brand-coloured header
 * band, a zebra body, numerics right-aligned in tabular figures. The moment
 * people act on rows (select, bulk-act, page) it is a DataTable, which is
 * built from these parts.
 *
 *   <Table>
 *     <TableCaption>Week 6 marks for Cohort 7</TableCaption>
 *     <TableHeader>
 *       <TableRow>
 *         <TableHead scope="col">Student</TableHead>
 *         <TableHead scope="col" numeric sort="descending" onSortChange={…}>Score</TableHead>
 *       </TableRow>
 *     </TableHeader>
 *     <TableBody>
 *       <TableRow>
 *         <TableHead scope="row">Aarav Krishnan</TableHead>
 *         <TableCell numeric>92</TableCell>
 *       </TableRow>
 *     </TableBody>
 *   </Table>
 *
 * Every part is a server component. A sortable header (`sort` set) renders the
 * one client part, `TableSortButton`: a real <button> filling the cell, with
 * `aria-sort` on the <th> and the caret drawn from it.
 *
 * Table-level axes (`density`, `striped`, `pinFirstColumn`) are data
 * attributes on the <table>; the cells read them with `in-data-*` variants, so
 * no context (and no client boundary) is needed. `:where()` keeps those
 * ancestor checks at zero specificity, which is what lets selected beat hover
 * beat zebra in the HTML's order.
 *
 * The frame (`.tableWrap`: hairline border, large radius, horizontal scroll)
 * is part of `Table`; `framed={false}` drops it when the table sits inside a
 * larger frame, as in DataTable. Wide content scrolls INSIDE the frame; the
 * page never does.
 *
 * Small screens (responsive audit D1, T1–T3):
 *   - text cells wrap, down to a 128px floor per column, so a three-column
 *     table fits a phone instead of needing its widest line per cell
 *     (`cellWrap="nowrap"` restores one line per cell);
 *   - while the table scrolls, the side that hides columns shows an edge
 *     shadow, and the scroller becomes a named, focusable region (the one
 *     client part, `TableScrollArea`; the cues arrive on hydration);
 *   - a pinned first column has a hairline divider, casts the shadow once
 *     the table is scrolled, and is held to at most 45% of the viewport on a
 *     phone;
 *   - any cell can be `sticky="start" | "end"` (DataTable's ⋯ column).
 * The header row does not stick vertically: the box scrolls on x, which makes
 * it the sticky container for y too, so a sticky header would never move.
 * ------------------------------------------------------------------------- */

/** Row rhythm: `default` 12/16px cells · `compact` admin density, one rung tighter. */
export type TableDensity = 'default' | 'compact';

/** `wrap` text cells wrap (128px floor per column) · `nowrap` one line per cell, the table as wide as it needs. */
export type TableCellWrap = 'wrap' | 'nowrap';

/** Which edge a sticky cell holds to while the table scrolls sideways. */
export type TableCellSticky = 'start' | 'end';

export type TableProps = React.ComponentPropsWithoutRef<'table'> & {
  /**
   * `default` 12 × 16px cell padding · `compact` 8 × 12px and 14px text, for
   * admin consoles.
   *
   * @default 'default'
   */
  density?: TableDensity;
  /**
   * Zebra body rows (every even row on `surface-subtle`).
   *
   * @default true
   */
  striped?: boolean;
  /**
   * Keep the first column in place while the rest scrolls sideways (the
   * HTML's `.table--pinned`, for wide comparison tables).
   *
   * @default false
   */
  pinFirstColumn?: boolean;
  /**
   * Draw the frame around the table: hairline border, large radius, the
   * page surface. `false` when a larger frame already surrounds it.
   *
   * @default true
   */
  framed?: boolean;
  /**
   * `wrap`: text cells wrap, each column at least 128px, so a narrow screen
   * gets taller rows before it gets a sideways scroll. `nowrap`: every cell
   * on one line and the table as wide as its content (the 0.4 behaviour),
   * for dense numeric grids.
   *
   * @default 'wrap'
   */
  cellWrap?: TableCellWrap;
  /**
   * Paint every row on the page surface. Sticky cells (`sticky` on a cell)
   * need it so nothing shows through them; `pinFirstColumn` turns it on.
   *
   * @default false
   */
  opaqueRows?: boolean;
  /**
   * Names the scroll region while the table scrolls sideways, when there is
   * no `TableCaption` (a caption names it otherwise).
   *
   * @default 'Table'
   */
  scrollLabel?: string;
  /** Class for the scroll container around the `<table>`. */
  containerClassName?: string;
};

export const Table = React.forwardRef<HTMLTableElement, TableProps>(function Table(
  {
    className,
    density = 'default',
    striped = true,
    pinFirstColumn = false,
    framed = true,
    cellWrap = 'wrap',
    opaqueRows = false,
    scrollLabel,
    containerClassName,
    ...props
  },
  ref,
) {
  return (
    <TableScrollArea framed={framed} pinned={pinFirstColumn} label={scrollLabel} className={containerClassName}>
      <table
        ref={ref}
        data-slot="table"
        data-density={density}
        data-striped={striped ? 'true' : 'false'}
        data-pinned={pinFirstColumn ? 'true' : 'false'}
        data-opaque={opaqueRows || pinFirstColumn ? 'true' : undefined}
        data-cell-wrap={cellWrap}
        className={cn(
          'group/table w-full border-separate border-spacing-0',
          cellWrap === 'nowrap' ? 'min-w-max' : '[--table-cell-min:8rem]',
          'font-sans text-base leading-body text-content',
          className,
        )}
        {...props}
      />
    </TableScrollArea>
  );
});
Table.displayName = 'Table';

/* ---- sections ------------------------------------------------------------- */

export type TableHeaderProps = React.ComponentPropsWithoutRef<'thead'>;

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  function TableHeader({ className, ...props }, ref) {
    return <thead ref={ref} data-slot="table-header" className={cn(className)} {...props} />;
  },
);
TableHeader.displayName = 'TableHeader';

export type TableBodyProps = React.ComponentPropsWithoutRef<'tbody'>;

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(
  { className, ...props },
  ref,
) {
  return <tbody ref={ref} data-slot="table-body" className={cn(className)} {...props} />;
});
TableBody.displayName = 'TableBody';

export type TableFooterProps = React.ComponentPropsWithoutRef<'tfoot'>;

export const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  function TableFooter({ className, ...props }, ref) {
    return <tfoot ref={ref} data-slot="table-footer" className={cn(className)} {...props} />;
  },
);
TableFooter.displayName = 'TableFooter';

/* ---- row ------------------------------------------------------------------ */

export type TableRowProps = React.ComponentPropsWithoutRef<'tr'> & {
  /**
   * A chosen row: `aria-selected="true"` and the brand-subtle fill, which
   * beats hover and zebra. (DataTable sets it from its selection.)
   *
   * @default false
   */
  selected?: boolean;
  /**
   * A row that cannot be acted on: its text takes the disabled ink.
   * Components with their own colour (a Badge) keep it.
   *
   * @default false
   */
  disabled?: boolean;
};

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { className, selected = false, disabled = false, ...props },
  ref,
) {
  return (
    <tr
      ref={ref}
      data-slot="table-row"
      data-state={selected ? 'selected' : undefined}
      data-disabled={disabled || undefined}
      aria-selected={selected ? true : undefined}
      className={cn(
        'transition-colors duration-(--motion-duration-instant) ease-productive-in-out motion-reduce:transition-none',
        // Sticky cells (a pinned column) need an opaque row to inherit.
        'in-data-[opaque=true]:bg-surface',
        'in-data-[striped=true]:even:bg-surface-subtle',
        'in-[tbody]:hover:bg-surface-hover',
        // Doubled class: selected must beat zebra and hover.
        '[&&[aria-selected=true]]:bg-surface-brand-subtle',
        'data-[disabled]:text-content-disabled',
        className,
      )}
      {...props}
    />
  );
});
TableRow.displayName = 'TableRow';

/* ---- cells ---------------------------------------------------------------- */

const cellBase = [
  'border-b border-border-decorative px-4 py-3 text-left align-middle',
  'in-data-[density=compact]:px-3 in-data-[density=compact]:py-2 in-data-[density=compact]:text-sm',
  // The per-column floor when cells wrap (set on the table; 0 with `nowrap`).
  'min-w-(--table-cell-min,0px)',
  // Cells paint their row's fill, so a sticky cell covers what scrolls under it.
  'bg-inherit',
  // Sticky start: the pinned first column, or `sticky="start"`.
  'in-data-[pinned=true]:first:sticky in-data-[pinned=true]:first:start-0 in-data-[pinned=true]:first:z-[1]',
  'data-[sticky=start]:sticky data-[sticky=start]:z-[1]',
  // Its trailing hairline, drawn once on the last sticky start cell of a row…
  'in-data-[pinned=true]:first:border-e in-data-[pinned=true]:first:border-e-border-decorative',
  '[&[data-sticky=start]:not(:has(+[data-sticky=start]))]:border-e [&[data-sticky=start]:not(:has(+[data-sticky=start]))]:border-e-border-decorative',
  // …and its shadow once columns have scrolled under it.
  'in-data-[overflow-start]:in-data-[pinned=true]:first:shadow-[6px_0_8px_-6px_var(--table-edge-shadow)]',
  'in-data-[overflow-start]:[&[data-sticky=start]:not(:has(+[data-sticky=start]))]:shadow-[6px_0_8px_-6px_var(--table-edge-shadow)]',
  // A phone keeps most of the width for the columns that scroll (T2).
  'max-sm:in-data-[pinned=true]:first:max-w-[45vw]',
  // Sticky end (DataTable's ⋯): while the table scrolls, a leading hairline, and
  // the shadow while more scrolls under it.
  'data-[sticky=end]:sticky data-[sticky=end]:end-0 data-[sticky=end]:z-[1]',
  'in-data-[overflow]:data-[sticky=end]:border-s in-data-[overflow]:data-[sticky=end]:border-s-border-decorative',
  'in-data-[overflow-end]:data-[sticky=end]:shadow-[-6px_0_8px_-6px_var(--table-edge-shadow)]',
];

type StickyProp = {
  /**
   * Hold this cell to an edge while the table scrolls sideways: `start` (a
   * pinned identity column; give later ones a `start-*` offset) or `end` (a
   * row-actions column). Mark the cell in every row, the header too, and set
   * `opaqueRows` on the Table so nothing shows through.
   */
  sticky?: TableCellSticky;
};

export type TableHeadProps = React.ComponentPropsWithoutRef<'th'> & StickyProp & {
  /**
   * Right-align in tabular figures: scores, fees, counts.
   *
   * @default false
   */
  numeric?: boolean;
  /**
   * Makes the column sortable: `aria-sort` on the cell and a real button
   * inside it, with the caret drawn from this value. Leave unset for a
   * column that does not sort.
   */
  sort?: TableSortDirection;
  /**
   * Called with the direction a click on the sort button asks for
   * (`ascending` from `none` / `descending`; `descending` from `ascending`).
   */
  onSortChange?: TableSortButtonProps['onSortChange'];
  /** Extra props for the sort button (a `className`, an `aria-describedby`). */
  sortButtonProps?: Omit<TableSortButtonProps, 'direction' | 'onSortChange' | 'children'>;
};

/**
 * A header cell. In `TableHeader` it is on the brand band; in a body row
 * (`scope="row"`) it is the row's bold name.
 */
export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
  { className, numeric = false, sort, onSortChange, sortButtonProps, sticky, children, ...props },
  ref,
) {
  const sortable = sort !== undefined;
  return (
    <th
      ref={ref}
      data-slot="table-head"
      data-sticky={sticky}
      data-numeric={numeric || undefined}
      data-sortable={sortable || undefined}
      aria-sort={sortable ? sort : undefined}
      className={cn(
        cellBase,
        'font-bold',
        'in-[thead]:bg-surface-brand-solid in-[thead]:text-content-on-brand-solid',
        'in-[thead]:text-sm in-[thead]:font-semibold in-[thead]:whitespace-nowrap',
        numeric && 'min-w-0 text-right tabular-nums',
        sortable && 'p-0 in-data-[density=compact]:p-0 select-none',
        className,
      )}
      {...props}
    >
      {sortable ? (
        <TableSortButton direction={sort} onSortChange={onSortChange} {...sortButtonProps}>
          {children}
        </TableSortButton>
      ) : (
        children
      )}
    </th>
  );
});
TableHead.displayName = 'TableHead';

export type TableCellProps = React.ComponentPropsWithoutRef<'td'> & StickyProp & {
  /**
   * Right-align in tabular figures: scores, fees, counts.
   *
   * @default false
   */
  numeric?: boolean;
};

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { className, numeric = false, sticky, ...props },
  ref,
) {
  return (
    <td
      ref={ref}
      data-slot="table-cell"
      data-sticky={sticky}
      data-numeric={numeric || undefined}
      className={cn(cellBase, numeric && 'min-w-0 whitespace-nowrap text-right tabular-nums', className)}
      {...props}
    />
  );
});
TableCell.displayName = 'TableCell';

export type TableCaptionProps = React.ComponentPropsWithoutRef<'caption'> & {
  /**
   * Keep the caption for assistive tech only, as the HTML does: the table's
   * heading usually already says what it is.
   *
   * @default true
   */
  visuallyHidden?: boolean;
};

/** The table's accessible name. Say what it holds and how it is sorted. */
export const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  function TableCaption({ className, visuallyHidden = true, ...props }, ref) {
    return (
      <caption
        ref={ref}
        data-slot="table-caption"
        className={cn(
          visuallyHidden
            ? 'sr-only'
            : 'caption-top px-4 py-3 text-left font-sans text-sm text-content-secondary',
          className,
        )}
        {...props}
      />
    );
  },
);
TableCaption.displayName = 'TableCaption';

export type { TableSortDirection };
