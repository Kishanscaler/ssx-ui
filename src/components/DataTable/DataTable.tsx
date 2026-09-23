'use client';

// Client: keeps sort, selection, page and page size (controlled or not) and
// attaches handlers; composes the client Checkbox, Select, Menu and Pagination.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';

import { cn } from '../../lib/cn';
import { useId } from '../../lib/use-id';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { EmptyState } from '../EmptyState';
import { IconButton } from '../IconButton';
import { Menu, MenuContent, MenuTrigger } from '../Menu';
import { Pagination } from '../Pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select';
import { Skeleton } from '../Skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableDensity,
} from '../Table';

/* ---------------------------------------------------------------------------
 * DataTable
 *
 * The working surface of an ops console: a toolbar slot, row selection with a
 * select-all that goes indeterminate, sortable columns, a per-row overflow
 * Menu, a bulk bar that appears only while rows are selected, and a footer
 * with the range, a page-size Select and Pagination. Use it when people ACT on
 * rows. Five read-only numbers are a Table, which this is built from.
 *
 *   <DataTable
 *     caption="Applicants to the Batch of 2029"
 *     columns={[
 *       { id: 'name', header: 'Applicant', accessor: 'name', rowHeader: true, sortable: true },
 *       { id: 'score', header: 'NSET score', accessor: 'score', numeric: true, sortable: true },
 *     ]}
 *     rows={applicants}
 *     selectable
 *     rowActions={(row) => <MenuItem>View application</MenuItem>}
 *     itemLabel="applicants"
 *   />
 *
 * No table library. The logic is small and lives here: a stable sort on the
 * column's `accessor` (or its `compare`), slicing to the page, and selection
 * as a list of row ids that survives paging and sorting. Every piece of state
 * is controlled OR uncontrolled (`sort` / `defaultSort` / `onSortChange`, and
 * the same for `selectedRowIds`, `page`, `pageSize`).
 *
 * Server data: `manualSorting` stops the local sort (you sort, from
 * `onSortChange`); `rowCount` means `rows` is already the current page of
 * `rowCount` rows (you page, from `onPageChange` / `onPageSizeChange`).
 *
 * From a Server Component, columns can only use a string `accessor` (a
 * function cannot cross the boundary); `cell`, `compare` and `rowActions`
 * need a client wrapper.
 *
 * The sort cycle is the HTML's: none → ascending → descending → ascending.
 * Sorting returns to page 1. A disabled row (`isRowDisabled`) cannot be
 * selected and its actions button is disabled. Menus portal, so nothing is
 * clipped by the frame and the table still scrolls sideways inside it.
 *
 * Narrow containers (responsive audit D1, D2, D4). The root is a CSS size
 * container; below 672px of its OWN width (a phone, or a narrow panel on a
 * desktop) `mobileLayout` decides:
 *   cards   (default) each row restyles into a card: the row-header column
 *           as its title with the checkbox and ⋯ beside it, every other
 *           column a label / value line (the column's `label`, else its
 *           string `header`). The header row becomes a bar with select-all
 *           and the sort buttons. It is the SAME table markup restyled by
 *           CSS (explicit table roles keep the semantics), so server
 *           rendering, selection, bulk actions, sorting and paging are
 *           untouched and there is no hydration switch.
 *   scroll  the table stays a table and scrolls sideways, with edge shadows.
 * Either way the ⋯ column is sticky to the trailing edge (always in reach)
 * and `pinFirstColumn` holds the checkbox and the first column at the start.
 * ------------------------------------------------------------------------- */

/**
 * Below a 672px container: `cards` stacks each row as a card of label / value
 * lines · `scroll` keeps the table and scrolls it sideways.
 */
export type DataTableMobileLayout = 'cards' | 'scroll';

/** A column's sort direction when it is the sorted column. */
export type DataTableSortDirection = 'ascending' | 'descending';

/** The sorted column and its direction. `null` = unsorted. */
export type DataTableSort = { columnId: string; direction: DataTableSortDirection };

export type DataTableColumn<TRow> = {
  /** Unique column id; also the `sort.columnId`. */
  id: string;
  /** Header content. For a column that needs no visible header, pass `<span className="sr-only">…</span>`. */
  header: React.ReactNode;
  /**
   * The value's label in the card layout ("NSET score").
   *
   * @default `header` when it is a string, else no label
   */
  label?: string;
  /**
   * The value of this column for a row: a key of the row, or a function. Used
   * to sort, and rendered as text when there is no `cell`.
   */
  accessor?: (keyof TRow & string) | ((row: TRow) => unknown);
  /** Renders the cell. Defaults to the accessor's value as text. */
  cell?: (row: TRow, rowIndex: number) => React.ReactNode;
  /** Makes the header a sort button. Sorts by `compare`, else by `accessor`. */
  sortable?: boolean;
  /** Custom ascending comparison for this column. */
  compare?: (a: TRow, b: TRow) => number;
  /** Right-align in tabular figures (header and cells). */
  numeric?: boolean;
  /** The column that names the row: rendered as `<th scope="row">` and used for the row's labels. */
  rowHeader?: boolean;
  /** Class for this column's header cell. */
  headerClassName?: string;
  /** Class for this column's body cells. */
  cellClassName?: string;
};

/** What `bulkActions` receives. */
export type DataTableBulkContext = {
  /** Ids of every selected row, across pages. */
  selectedRowIds: string[];
  /** Deselect everything. */
  clearSelection: () => void;
};

export type DataTableProps<TRow> = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Column definitions, in display order. */
  columns: DataTableColumn<TRow>[];
  /** The rows. With `rowCount`, only the current page. */
  rows: TRow[];
  /**
   * A stable id per row, for selection and keys.
   *
   * @default row.id when it is a string or number, else the row's index
   */
  getRowId?: (row: TRow, index: number) => string;
  /**
   * The row's name in labels: "Select {label}", "Actions for {label}".
   *
   * @default the `rowHeader` column's value, else "row {id}"
   */
  getRowLabel?: (row: TRow) => string;
  /** The table's accessible name (a visually hidden caption). Say what it holds and how it is sorted. */
  caption?: React.ReactNode;
  /**
   * Cell rhythm, passed to Table.
   *
   * @default 'default'
   */
  density?: TableDensity;
  /**
   * Zebra body rows.
   *
   * @default true
   */
  striped?: boolean;
  /**
   * Hold the checkbox and the first column in place while the rest scrolls
   * sideways (on a phone the pinned column is at most 45% of the width).
   *
   * @default false
   */
  pinFirstColumn?: boolean;
  /**
   * The layout below a 672px container (a phone, a narrow panel): `cards`
   * restyles each row as a stacked card; `scroll` keeps the table, scrolling
   * sideways. Use `scroll` for grids people compare across rows.
   *
   * @default 'cards'
   */
  mobileLayout?: DataTableMobileLayout;

  /** The sorted column (controlled). `null` = unsorted. Pair with `onSortChange`. */
  sort?: DataTableSort | null;
  /**
   * The sort when uncontrolled.
   *
   * @default null
   */
  defaultSort?: DataTableSort | null;
  /** Called when a sortable header is activated. */
  onSortChange?: (sort: DataTableSort | null) => void;
  /**
   * Do not sort locally: `rows` arrive sorted (server-side). The headers still
   * show and report the sort.
   *
   * @default false
   */
  manualSorting?: boolean;

  /**
   * A checkbox column, a select-all in the header, and the bulk bar.
   *
   * @default false
   */
  selectable?: boolean;
  /** Selected row ids (controlled). Pair with `onSelectedRowIdsChange`. */
  selectedRowIds?: string[];
  /**
   * Selected row ids when uncontrolled.
   *
   * @default []
   */
  defaultSelectedRowIds?: string[];
  /** Called with the new selection. */
  onSelectedRowIdsChange?: (ids: string[]) => void;
  /** A row that cannot be selected or acted on (locked, under review). */
  isRowDisabled?: (row: TRow) => boolean;
  /**
   * Buttons for the bulk bar, shown only while rows are selected. A "Clear
   * selection" button is always added after them.
   */
  bulkActions?: (context: DataTableBulkContext) => React.ReactNode;

  /**
   * A trailing ⋯ button per row opening a Menu of these items
   * (`MenuItem`s). Return `null` for a row with no actions.
   */
  rowActions?: (row: TRow) => React.ReactNode;

  /** Content of the toolbar above the table: search, filter chips, Export. */
  toolbar?: React.ReactNode;

  /**
   * Show the footer: range, rows-per-page and Pagination.
   *
   * @default true
   */
  paginated?: boolean;
  /** Current page, 1-based (controlled). Pair with `onPageChange`. */
  page?: number;
  /**
   * First page when uncontrolled.
   *
   * @default 1
   */
  defaultPage?: number;
  /** Called with the new page. */
  onPageChange?: (page: number) => void;
  /** Rows per page (controlled). Pair with `onPageSizeChange`. */
  pageSize?: number;
  /**
   * Rows per page when uncontrolled.
   *
   * @default 25
   */
  defaultPageSize?: number;
  /** Called with the new page size (and the page returns to 1). */
  onPageSizeChange?: (pageSize: number) => void;
  /**
   * Choices for the rows-per-page Select. An empty list hides it.
   *
   * @default [10, 25, 50]
   */
  pageSizeOptions?: number[];
  /** Total rows on the server. When set, `rows` is already the current page. */
  rowCount?: number;
  /**
   * Accessible name of the Pagination landmark ("Applicant pages").
   *
   * @default 'Table pages'
   */
  paginationLabel?: string;

  /**
   * Plural noun for the rows, in "Showing 1–25 of 1,284 applicants" and
   * "3 of 1,284 selected".
   *
   * @default 'rows'
   */
  itemLabel?: string;
  /**
   * Locale for the counts (Indian grouping by default: 1,28,400).
   *
   * @default 'en-IN'
   */
  locale?: string;

  /**
   * Skeleton rows in place of the body while data loads; the table is
   * `aria-busy`.
   *
   * @default false
   */
  loading?: boolean;
  /**
   * How many skeleton rows.
   *
   * @default 5
   */
  loadingRowCount?: number;
  /** Shown in the body when there are no rows. Defaults to an EmptyState "No results". */
  emptyState?: React.ReactNode;
};

/* ---- helpers --------------------------------------------------------------- */

function valueOf<TRow>(column: DataTableColumn<TRow>, row: TRow): unknown {
  const { accessor } = column;
  if (typeof accessor === 'function') return accessor(row);
  if (typeof accessor === 'string') return (row as Record<string, unknown>)[accessor];
  return undefined;
}

function compareValues(a: unknown, b: unknown, collator: Intl.Collator): number {
  const empty = (v: unknown) => v == null || v === '';
  if (empty(a) || empty(b)) return empty(a) === empty(b) ? 0 : empty(a) ? 1 : -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return collator.compare(String(a), String(b));
}

function defaultRowId(row: unknown, index: number): string {
  const id = row != null && typeof row === 'object' ? (row as { id?: unknown }).id : undefined;
  return typeof id === 'string' || typeof id === 'number' ? String(id) : String(index);
}

const renderValue = (value: unknown): React.ReactNode => {
  if (value == null || typeof value === 'boolean') return null;
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
};

const SKELETON_WIDTHS = ['w-2/3', 'w-full', 'w-1/3', 'w-1/2', 'w-3/4', 'w-1/4'];

/** Phosphor 2.1.1 `dots-three` bold, the HTML's `#ph-more-bold`. */
function MoreGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M144,128a16,16,0,1,1-16-16A16,16,0,0,1,144,128ZM60,112a16,16,0,1,0,16,16A16,16,0,0,0,60,112Zm136,0a16,16,0,1,0,16,16A16,16,0,0,0,196,112Z" />
    </svg>
  );
}

/** Phosphor 2.1.1 `check` bold, the HTML's `#ph-check-bold`. */
function CheckGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" className="size-icon-sm shrink-0">
      <path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z" />
    </svg>
  );
}

const barClass = 'flex flex-wrap items-center gap-2 px-4 py-3 font-sans';

/*
 * The card layout. Every class is behind `@max-[672px]:` (the root's own
 * width), so above it the table is untouched. Written out in full: Tailwind
 * only sees whole class names.
 */
const card = {
  table: '@max-[672px]:block',
  section: '@max-[672px]:block',
  // Header row → a bar: select-all, then the sortable columns as buttons.
  headRow: cn(
    '@max-[672px]:flex @max-[672px]:flex-wrap @max-[672px]:items-center @max-[672px]:gap-x-2 @max-[672px]:gap-y-3',
    '@max-[672px]:border-b @max-[672px]:border-border-decorative @max-[672px]:bg-surface-subtle @max-[672px]:px-4 @max-[672px]:py-2',
  ),
  headCell: cn(
    '@max-[672px]:static @max-[672px]:block @max-[672px]:w-auto! @max-[672px]:min-w-0! @max-[672px]:border-0! @max-[672px]:p-0 @max-[672px]:shadow-none!',
    '@max-[672px]:bg-transparent! @max-[672px]:text-content!',
  ),
  headHidden: '@max-[672px]:sr-only',
  sortButton: cn(
    '@max-[672px]:w-auto @max-[672px]:rounded-full @max-[672px]:border @max-[672px]:border-border-control',
    '@max-[672px]:bg-surface @max-[672px]:px-3 @max-[672px]:py-1 @max-[672px]:text-content',
    '@max-[672px]:hover:bg-surface-hover @max-[672px]:focus-visible:outline-border-focus @max-[672px]:focus-visible:outline-offset-2',
    // A 44px hit area on touch, keeping the chip's look (product decision 2).
    '@max-[672px]:touch-target',
  ),
  // Body row → a card: [checkbox] [title] [⋯] on top, then label / value lines.
  row: cn(
    '@max-[672px]:grid @max-[672px]:grid-cols-[auto_minmax(0,1fr)_auto] @max-[672px]:items-start @max-[672px]:gap-y-1',
    '@max-[672px]:border-b @max-[672px]:border-border-decorative @max-[672px]:px-4 @max-[672px]:py-3',
  ),
  cellReset: cn(
    '@max-[672px]:static @max-[672px]:block @max-[672px]:min-w-0 @max-[672px]:max-w-none',
    '@max-[672px]:w-auto! @max-[672px]:min-w-0! @max-[672px]:border-0! @max-[672px]:p-0 @max-[672px]:shadow-none!',
    '@max-[672px]:bg-transparent',
  ),
  select: '@max-[672px]:col-start-1 @max-[672px]:row-start-1 @max-[672px]:self-center @max-[672px]:pe-3 @max-[672px]:w-auto',
  title: '@max-[672px]:col-start-2 @max-[672px]:row-start-1 @max-[672px]:self-center @max-[672px]:[overflow-wrap:anywhere]',
  actions: '@max-[672px]:col-start-3 @max-[672px]:row-start-1 @max-[672px]:self-center @max-[672px]:ps-2 @max-[672px]:-me-2',
  field: cn(
    '@max-[672px]:col-[1/-1] @max-[672px]:flex! @max-[672px]:gap-3 @max-[672px]:text-left @max-[672px]:text-sm @max-[672px]:whitespace-normal',
    '@max-[672px]:[overflow-wrap:anywhere] @max-[672px]:[&>*]:min-w-0 @max-[672px]:[&>*]:shrink',
    // A long Badge wraps instead of running out of the card.
    '@max-[672px]:[&_[data-slot=badge]]:h-auto @max-[672px]:[&_[data-slot=badge]]:min-h-[22px] @max-[672px]:[&_[data-slot=badge]]:whitespace-normal',
    // The label, from `data-label`: MetadataList's term look.
    '@max-[672px]:before:w-2/5 @max-[672px]:before:shrink-0 @max-[672px]:before:text-content-secondary',
    '@max-[672px]:before:content-[attr(data-label)]',
  ),
  // Loading and empty rows are one block, not a card grid.
  plainRow: '@max-[672px]:flex @max-[672px]:flex-col @max-[672px]:gap-2 @max-[672px]:px-4 @max-[672px]:py-3',
};

const selectCellClass = 'w-(--data-table-select-w) min-w-(--data-table-select-w)';
/** The pinned first column: after the select column when there is one; together at most 45% of a phone. */
const pinnedCellClass = (selectable: boolean) =>
  cn(
    // Held narrow on a phone, so long names wrap (or clip) inside it.
    'max-sm:overflow-hidden max-sm:break-words',
    selectable
    ? 'start-(--data-table-select-w) max-sm:min-w-0 max-sm:max-w-[calc(45vw-var(--data-table-select-w))]'
    : 'start-0 max-sm:max-w-[45vw]',
  );

/* ---- component ------------------------------------------------------------- */

function DataTableImpl<TRow>(
  {
    className,
    columns,
    rows,
    getRowId = defaultRowId,
    getRowLabel,
    caption,
    density = 'default',
    striped = true,
    pinFirstColumn = false,
    mobileLayout = 'cards',
    sort: sortProp,
    defaultSort = null,
    onSortChange,
    manualSorting = false,
    selectable = false,
    selectedRowIds: selectedProp,
    defaultSelectedRowIds,
    onSelectedRowIdsChange,
    isRowDisabled,
    bulkActions,
    rowActions,
    toolbar,
    paginated = true,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    pageSize: pageSizeProp,
    defaultPageSize = 25,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50],
    rowCount,
    paginationLabel = 'Table pages',
    itemLabel = 'rows',
    locale = 'en-IN',
    loading = false,
    loadingRowCount = 5,
    emptyState,
    ...props
  }: DataTableProps<TRow>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const pageSizeId = useId();
  const selectAllId = useId();
  const cards = mobileLayout !== 'scroll';
  const c = (cls: string | undefined) => (cards ? cls : undefined);
  const role = (r: string) => (cards ? r : undefined);

  const [sortState, setSort] = useControllableState<DataTableSort | null>({
    prop: sortProp,
    defaultProp: defaultSort,
    onChange: onSortChange,
    caller: 'DataTable',
  });
  const sort = sortState ?? null;

  const [selectedState, setSelected] = useControllableState<string[]>({
    prop: selectedProp,
    defaultProp: defaultSelectedRowIds ?? [],
    onChange: onSelectedRowIdsChange,
    caller: 'DataTable',
  });
  const selected = selectedState ?? [];
  const selectedSet = React.useMemo(() => new Set(selected), [selected]);

  const [pageState, setPage] = useControllableState<number>({
    prop: pageProp,
    defaultProp: defaultPage,
    onChange: onPageChange,
    caller: 'DataTable',
  });
  const [pageSizeState, setPageSize] = useControllableState<number>({
    prop: pageSizeProp,
    defaultProp: defaultPageSize,
    onChange: onPageSizeChange,
    caller: 'DataTable',
  });

  const numberFormat = React.useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const fmt = (n: number) => numberFormat.format(n);

  // Stable sort, locally unless the server sorts.
  const sortedRows = React.useMemo(() => {
    const indexed = rows.map((row, index) => ({ row, index }));
    if (manualSorting || !sort) return indexed;
    const column = columns.find((c) => c.id === sort.columnId);
    if (!column) return indexed;
    const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
    const sign = sort.direction === 'descending' ? -1 : 1;
    return [...indexed].sort((a, b) => {
      const result = column.compare
        ? column.compare(a.row, b.row)
        : compareValues(valueOf(column, a.row), valueOf(column, b.row), collator);
      return result * sign || a.index - b.index;
    });
  }, [rows, columns, sort, manualSorting, locale]);

  const manualPaging = rowCount != null;
  const total = manualPaging ? Math.max(0, rowCount as number) : rows.length;
  const pageSize = paginated ? Math.max(1, Math.floor(pageSizeState ?? defaultPageSize) || 1) : Math.max(total, 1);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Math.floor(pageState ?? 1) || 1), pageCount);

  const pageRows =
    manualPaging || !paginated ? sortedRows : sortedRows.slice((page - 1) * pageSize, page * pageSize);
  const offset = (page - 1) * pageSize;

  const rowHeaderColumn = columns.find((col) => col.rowHeader);
  // The card's title: the row-header column, else the first.
  const titleColumn = rowHeaderColumn ?? columns[0];
  const pinnedColumn = pinFirstColumn ? columns[0] : undefined;
  const labelOf = (column: DataTableColumn<TRow>) =>
    column.label ?? (typeof column.header === 'string' ? column.header : undefined);
  const anySortable = columns.some((col) => col.sortable);
  const labelFor = (row: TRow, id: string) => {
    if (getRowLabel) return getRowLabel(row);
    const value = rowHeaderColumn ? valueOf(rowHeaderColumn, row) : undefined;
    return value != null && value !== '' ? String(value) : `row ${id}`;
  };

  const pageEntries = pageRows.map(({ row, index }) => {
    const id = getRowId(row, index);
    return { row, id, disabled: isRowDisabled ? isRowDisabled(row) : false };
  });
  const selectableOnPage = pageEntries.filter((e) => !e.disabled);
  const selectedOnPage = selectableOnPage.filter((e) => selectedSet.has(e.id)).length;
  const allOnPage = selectableOnPage.length > 0 && selectedOnPage === selectableOnPage.length;
  const headerChecked: boolean | 'indeterminate' = allOnPage ? true : selectedOnPage > 0 ? 'indeterminate' : false;

  const toggleRow = (id: string, on: boolean) => {
    const next = selected.filter((x) => x !== id);
    setSelected(on ? [...next, id] : next);
  };
  const togglePage = () => {
    const pageIds = selectableOnPage.map((e) => e.id);
    if (allOnPage) setSelected(selected.filter((x) => !pageIds.includes(x)));
    else setSelected([...selected, ...pageIds.filter((x) => !selectedSet.has(x))]);
  };
  const clearSelection = () => setSelected([]);

  const changeSort = (column: DataTableColumn<TRow>, direction: DataTableSortDirection) => {
    setSort({ columnId: column.id, direction });
    if (page !== 1) setPage(1);
  };

  const hasActions = rowActions != null;
  const columnCount = columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);
  const selectedCount = selected.length;

  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + pageRows.length, total);
  const selectionText = `${fmt(selectedCount)} of ${fmt(total)} selected`;

  let body: React.ReactNode;
  if (loading) {
    body = Array.from({ length: Math.max(1, loadingRowCount) }, (_, r) => (
      <TableRow key={`loading-${r}`} data-slot="data-table-loading-row" role={role('row')} className={c(card.plainRow)}>
        {Array.from({ length: columnCount }, (_, i) => (
          <TableCell key={i} role={role('cell')} className={c(card.cellReset)}>
            <Skeleton shape="text" className={SKELETON_WIDTHS[(r + i) % SKELETON_WIDTHS.length]} />
          </TableCell>
        ))}
      </TableRow>
    ));
  } else if (pageEntries.length === 0) {
    body = (
      <TableRow
        data-slot="data-table-empty-row"
        role={role('row')}
        className={cn('in-[tbody]:hover:bg-transparent', c('@max-[672px]:block'))}
      >
        <TableCell
          colSpan={columnCount}
          role={role('cell')}
          className={cn('p-0 in-data-[density=compact]:p-0', c('@max-[672px]:block @max-[672px]:border-0'))}
        >
          {emptyState ?? (
            <EmptyState
              title="No results"
              description={`No ${itemLabel} match. Clear a filter or search for something else.`}
            />
          )}
        </TableCell>
      </TableRow>
    );
  } else {
    body = pageEntries.map(({ row, id, disabled }, r) => {
      const isSelected = selectable && selectedSet.has(id);
      const label = labelFor(row, id);
      const actions = hasActions ? rowActions(row) : null;
      return (
        <TableRow
          key={id}
          data-row-id={id}
          selected={isSelected}
          disabled={disabled}
          role={role('row')}
          className={c(card.row)}
        >
          {selectable ? (
            <TableCell
              data-slot="data-table-select-cell"
              role={role('cell')}
              sticky={pinFirstColumn ? 'start' : undefined}
              className={cn(selectCellClass, pinFirstColumn && 'start-0', c(card.cellReset), c(card.select))}
            >
              <Checkbox
                checked={isSelected}
                disabled={disabled}
                onCheckedChange={(v) => toggleRow(id, v === true)}
                aria-label={`Select ${label}`}
                className="align-middle"
              />
            </TableCell>
          ) : null}
          {columns.map((column) => {
            const content = column.cell ? column.cell(row, offset + r) : renderValue(valueOf(column, row));
            const pinned = column === pinnedColumn;
            const isTitle = column === titleColumn;
            const shared = {
              numeric: column.numeric,
              sticky: pinned ? ('start' as const) : undefined,
              'data-label': cards && !isTitle ? labelOf(column) : undefined,
              className: cn(
                pinned && pinnedCellClass(selectable),
                c(card.cellReset),
                c(isTitle ? card.title : card.field),
                column.cellClassName,
              ),
            };
            return column.rowHeader ? (
              <TableHead key={column.id} scope="row" role={role('rowheader')} {...shared}>
                {content}
              </TableHead>
            ) : (
              <TableCell key={column.id} role={role('cell')} {...shared}>
                {content}
              </TableCell>
            );
          })}
          {hasActions ? (
            <TableCell
              data-slot="data-table-actions-cell"
              role={role('cell')}
              sticky="end"
              className={cn('w-px min-w-0', c(card.cellReset), c(card.actions))}
            >
              {actions == null || actions === false ? null : disabled ? (
                <IconButton variant="tertiary" size="sm" disabled aria-label={`Actions for ${label}, unavailable`}>
                  <MoreGlyph />
                </IconButton>
              ) : (
                <Menu>
                  <MenuTrigger asChild>
                    <IconButton variant="tertiary" size="sm" aria-label={`Actions for ${label}`}>
                      <MoreGlyph />
                    </IconButton>
                  </MenuTrigger>
                  <MenuContent align="end" aria-label={`Actions for ${label}`}>
                    {actions}
                  </MenuContent>
                </Menu>
              )}
            </TableCell>
          ) : null}
        </TableRow>
      );
    });
  }

  const showPageSize = paginated && pageSizeOptions.length > 0;
  const pageSizeChoices = pageSizeOptions.includes(pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pageSize].sort((a, b) => a - b);

  return (
    <div
      ref={ref}
      data-slot="data-table"
      data-density={density}
      data-mobile-layout={mobileLayout}
      className={cn(
        // A size container: the card layout follows the table's own width.
        '@container w-full',
        'min-w-0 max-w-full overflow-hidden rounded-lg border border-border-decorative bg-surface font-sans text-content',
        // The select column's width, which a pinned first column sits after.
        '[--data-table-select-w:50px] data-[density=compact]:[--data-table-select-w:42px]',
        className,
      )}
      {...props}
    >
      {toolbar != null && toolbar !== false ? (
        <div data-slot="data-table-toolbar" className={cn(barClass, 'border-b border-border-decorative')}>
          {toolbar}
        </div>
      ) : null}

      {/* Announced on every change; the visible bar below is not a live region,
          so its buttons are not read out each time the count moves. */}
      <span role="status" data-slot="data-table-status" className="sr-only">
        {loading ? `Loading ${itemLabel}` : selectable && selectedCount > 0 ? selectionText : ''}
      </span>

      {selectable && selectedCount > 0 ? (
        <div
          data-slot="data-table-bulk-bar"
          className={cn(
            'flex flex-wrap items-center gap-3 px-4 py-2 font-sans text-sm',
            'border-b border-border-brand bg-surface-brand-subtle text-content-brand',
          )}
        >
          <CheckGlyph />
          <span data-slot="data-table-selection-count" className="font-bold tabular-nums">
            {selectionText}
          </span>
          <span className="flex-1" aria-hidden="true" />
          {bulkActions ? bulkActions({ selectedRowIds: selected, clearSelection }) : null}
          <Button variant="tertiary" size="sm" onClick={clearSelection}>
            Clear selection
          </Button>
        </div>
      ) : null}

      <Table
        framed={false}
        density={density}
        striped={striped}
        opaqueRows={hasActions || pinFirstColumn}
        aria-busy={loading || undefined}
        role={role('table')}
        className={c(card.table)}
      >
        {caption != null && caption !== '' ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader
          role={role('rowgroup')}
          // No rows (or still loading): nothing to select or sort, so no bar.
          className={c((selectable || anySortable) && !loading && pageEntries.length > 0 ? card.section : card.headHidden)}
        >
          <TableRow role={role('row')} className={c(card.headRow)}>
            {selectable ? (
              <TableHead
                scope="col"
                role={role('columnheader')}
                sticky={pinFirstColumn ? 'start' : undefined}
                className={cn(
                  selectCellClass,
                  pinFirstColumn && 'start-0',
                  c(card.headCell),
                  c('@max-[672px]:inline-flex @max-[672px]:items-center @max-[672px]:gap-2 @max-[672px]:me-2'),
                )}
              >
                <Checkbox
                  id={selectAllId}
                  checked={headerChecked}
                  disabled={loading || selectableOnPage.length === 0}
                  onCheckedChange={togglePage}
                  aria-label={allOnPage ? 'Deselect all rows on this page' : 'Select all rows on this page'}
                  className="align-middle"
                />
                {cards ? (
                  // The card bar's visible name for select-all; hidden in the table.
                  <label
                    htmlFor={selectAllId}
                    aria-hidden="true"
                    className="hidden cursor-pointer text-sm font-semibold @max-[672px]:inline"
                  >
                    Select all
                  </label>
                ) : null}
              </TableHead>
            ) : null}
            {columns.map((column) => {
              const direction = sort && sort.columnId === column.id ? sort.direction : 'none';
              const pinned = column === pinnedColumn;
              return (
                <TableHead
                  key={column.id}
                  scope="col"
                  role={role('columnheader')}
                  numeric={column.numeric}
                  sticky={pinned ? 'start' : undefined}
                  className={cn(
                    pinned && pinnedCellClass(selectable),
                    c(card.headCell),
                    c(column.sortable ? undefined : card.headHidden),
                    column.headerClassName,
                  )}
                  sort={column.sortable ? direction : undefined}
                  onSortChange={column.sortable ? (next) => changeSort(column, next) : undefined}
                  sortButtonProps={column.sortable && cards ? { className: card.sortButton } : undefined}
                >
                  {column.header}
                </TableHead>
              );
            })}
            {hasActions ? (
              <TableHead
                scope="col"
                role={role('columnheader')}
                sticky="end"
                className={cn('w-px min-w-0', c(card.headCell), c(card.headHidden))}
              >
                <span className="sr-only">Row actions</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody role={role('rowgroup')} className={c(card.section)}>
          {body}
        </TableBody>
      </Table>

      {paginated ? (
        <div data-slot="data-table-footer" className={cn(barClass, 'gap-x-4')}>
          <p
            data-slot="data-table-range"
            // Narrow: the range takes its own line; Rows and Pagination share the next.
            className="m-0 text-sm text-content-secondary tabular-nums @max-[672px]:basis-full"
          >
            {total === 0
              ? `0 ${itemLabel}`
              : `Showing ${fmt(start)}–${fmt(end)} of ${fmt(total)} ${itemLabel}`}
          </p>
          <span className="flex-1 @max-[672px]:hidden" aria-hidden="true" />
          {showPageSize ? (
            <span className="inline-flex items-center gap-2">
              <label htmlFor={pageSizeId} className="text-sm font-semibold text-content">
                Rows
              </label>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  if (page !== 1) setPage(1);
                }}
              >
                <SelectTrigger id={pageSizeId} size="sm" className="w-auto min-w-[4.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeChoices.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {String(n)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </span>
          ) : null}
          <Pagination
            count={pageCount}
            page={page}
            onPageChange={setPage}
            disabled={loading}
            aria-label={paginationLabel}
            className="ms-auto"
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Generic over the row type: `<DataTable<Applicant> columns={…} rows={…} />`
 * (inferred from `rows` in practice).
 */
export const DataTable = React.forwardRef(DataTableImpl) as (<TRow>(
  props: DataTableProps<TRow> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement | null) & { displayName?: string };
DataTable.displayName = 'DataTable';
