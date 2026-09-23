import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './Table';

function Marks(props: Partial<React.ComponentProps<typeof Table>> & { onSort?: (d: string) => void; sort?: 'none' | 'ascending' | 'descending' }) {
  const { onSort, sort = 'descending', ...rest } = props;
  return (
    <Table {...rest}>
      <TableCaption>Week 6 marks for Cohort 7</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Student</TableHead>
          <TableHead scope="col" numeric sort={sort} onSortChange={onSort}>
            Score
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableHead scope="row">Aarav Krishnan</TableHead>
          <TableCell numeric>92</TableCell>
        </TableRow>
        <TableRow selected>
          <TableHead scope="row">Meher Iyengar</TableHead>
          <TableCell numeric>88</TableCell>
        </TableRow>
        <TableRow disabled>
          <TableHead scope="row">Tanvi Deshpande</TableHead>
          <TableCell numeric>83</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead scope="row">Cohort median</TableHead>
          <TableCell numeric>88</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

describe('Table', () => {
  it('renders semantic parts with data-slots, named by its caption', () => {
    render(<Marks />);
    const table = screen.getByRole('table', { name: 'Week 6 marks for Cohort 7' });
    expect(table).toHaveAttribute('data-slot', 'table');
    expect(table).toHaveAttribute('data-density', 'default');
    expect(table).toHaveAttribute('data-striped', 'true');
    expect(table).toHaveAttribute('data-pinned', 'false');
    expect(table.parentElement).toHaveAttribute('data-slot', 'table-container');
    expect(table.parentElement).toHaveAttribute('data-framed', 'true');
    expect(table.querySelector('thead')).toHaveAttribute('data-slot', 'table-header');
    expect(table.querySelector('tbody')).toHaveAttribute('data-slot', 'table-body');
    expect(table.querySelector('tfoot')).toHaveAttribute('data-slot', 'table-footer');
    expect(table.querySelector('caption')).toHaveAttribute('data-slot', 'table-caption');
    expect(table.querySelector('caption')).toHaveClass('sr-only');
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getAllByRole('rowheader')).toHaveLength(4);
    expect(screen.getAllByRole('cell')[0]).toHaveAttribute('data-slot', 'table-cell');
  });

  it('marks numeric cells and selected / disabled rows', () => {
    render(<Marks />);
    const cell = screen.getAllByRole('cell')[0]!;
    expect(cell).toHaveAttribute('data-numeric', 'true');
    expect(cell).toHaveClass('text-right', 'tabular-nums');
    const selected = screen.getByRole('row', { name: /Meher Iyengar/ });
    expect(selected).toHaveAttribute('aria-selected', 'true');
    expect(selected).toHaveAttribute('data-state', 'selected');
    expect(screen.getByRole('row', { name: /Aarav/ })).not.toHaveAttribute('aria-selected');
    expect(screen.getByRole('row', { name: /Tanvi/ })).toHaveAttribute('data-disabled', 'true');
  });

  it('a sortable head is aria-sort with a real button that asks for the next direction', () => {
    const onSort = vi.fn();
    const { rerender } = render(<Marks sort="descending" onSort={onSort} />);
    const head = screen.getByRole('columnheader', { name: /Score/ });
    expect(head).toHaveAttribute('aria-sort', 'descending');
    expect(head).toHaveAttribute('data-sortable', 'true');
    const button = within(head).getByRole('button', { name: 'Score' });
    expect(button).toHaveAttribute('data-slot', 'table-sort-button');
    expect(button).toHaveAttribute('type', 'button');
    fireEvent.click(button);
    expect(onSort).toHaveBeenLastCalledWith('ascending');
    rerender(<Marks sort="ascending" onSort={onSort} />);
    fireEvent.click(screen.getByRole('button', { name: 'Score' }));
    expect(onSort).toHaveBeenLastCalledWith('descending');
    rerender(<Marks sort="none" onSort={onSort} />);
    expect(screen.getByRole('columnheader', { name: /Score/ })).toHaveAttribute('aria-sort', 'none');
    fireEvent.click(screen.getByRole('button', { name: 'Score' }));
    expect(onSort).toHaveBeenLastCalledWith('ascending');
    // A head without `sort` is not sortable.
    expect(screen.getByRole('columnheader', { name: 'Student' })).not.toHaveAttribute('aria-sort');
  });

  it('passes density, stripes, pinning and the frame through', () => {
    render(<Marks density="compact" striped={false} pinFirstColumn framed={false} />);
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('data-density', 'compact');
    expect(table).toHaveAttribute('data-striped', 'false');
    expect(table).toHaveAttribute('data-pinned', 'true');
    expect(table.parentElement).not.toHaveAttribute('data-framed');
    expect(table.parentElement).not.toHaveClass('border');
  });

  it('forwards refs and puts className last', () => {
    const tableRef = React.createRef<HTMLTableElement>();
    const rowRef = React.createRef<HTMLTableRowElement>();
    const cellRef = React.createRef<HTMLTableCellElement>();
    render(
      <Table ref={tableRef} className="w-auto" containerClassName="max-h-40">
        <TableBody>
          <TableRow ref={rowRef}>
            <TableCell ref={cellRef} className="px-8">
              x
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(tableRef.current?.tagName).toBe('TABLE');
    expect(tableRef.current).toHaveClass('w-auto');
    expect(tableRef.current).not.toHaveClass('w-full');
    expect(tableRef.current?.parentElement).toHaveClass('max-h-40');
    expect(rowRef.current?.tagName).toBe('TR');
    expect(cellRef.current).toHaveClass('px-8');
    expect(cellRef.current).not.toHaveClass('px-4');
  });

  it('shows the caption when asked', () => {
    render(
      <Table>
        <TableCaption visuallyHidden={false}>Fee plans</TableCaption>
      </Table>,
    );
    expect(screen.getByText('Fee plans')).not.toHaveClass('sr-only');
  });
});

describe('Table on narrow screens', () => {
  const size = (el: HTMLElement, scrollWidth: number, clientWidth: number) => {
    Object.defineProperty(el, 'scrollWidth', { configurable: true, value: scrollWidth });
    Object.defineProperty(el, 'clientWidth', { configurable: true, value: clientWidth });
  };

  it('wraps text cells by default (128px floor); `cellWrap="nowrap"` keeps one line per cell', () => {
    const { rerender } = render(<Marks />);
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('data-cell-wrap', 'wrap');
    expect(table).not.toHaveClass('min-w-max');
    rerender(<Marks cellWrap="nowrap" />);
    expect(screen.getByRole('table')).toHaveClass('min-w-max');
    expect(screen.getByRole('table')).toHaveAttribute('data-cell-wrap', 'nowrap');
  });

  it('draws the frame around the scroller, with the edge-fade parts', () => {
    const { container } = render(<Marks />);
    const frame = container.querySelector('[data-slot="table-frame"]');
    expect(frame).toHaveClass('rounded-lg', 'border');
    expect(frame?.querySelector('[data-slot="table-container"]')).toContainElement(screen.getByRole('table'));
    expect(frame?.querySelector('[data-slot="table-fade-start"]')).toHaveAttribute('aria-hidden', 'true');
    expect(frame?.querySelector('[data-slot="table-fade-end"]')).toHaveAttribute('aria-hidden', 'true');
    // A pinned first column draws its own start shadow.
    const pinned = render(<Marks pinFirstColumn />);
    expect(pinned.container.querySelector('[data-slot="table-fade-start"]')).toBeNull();
  });

  it('a table that fits is not a region and not a tab stop', () => {
    render(<Marks />);
    const scroller = screen.getByRole('table').parentElement as HTMLElement;
    expect(scroller).not.toHaveAttribute('role');
    expect(scroller).not.toHaveAttribute('tabindex');
    expect(scroller).not.toHaveAttribute('data-overflow');
  });

  it('while it scrolls, the scroller is a focusable region named by the caption, with edge flags', async () => {
    // Measure before the first layout effect: patch the prototype for this render.
    const sw = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
    const cw = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get: () => 900 });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 300 });
    try {
      render(<Marks />);
      const scroller = screen.getByRole('region', { name: 'Week 6 marks for Cohort 7' });
      expect(scroller).toHaveAttribute('data-slot', 'table-container');
      expect(scroller).toHaveAttribute('tabindex', '0');
      expect(scroller).toHaveAttribute('data-overflow');
      expect(scroller).toHaveAttribute('data-overflow-end');
      expect(scroller).not.toHaveAttribute('data-overflow-start');
      expect(scroller.closest('[data-slot="table-frame"]')).toHaveAttribute('data-overflow-end');
      scroller.scrollLeft = 200;
      fireEvent.scroll(scroller);
      await waitFor(() => expect(scroller).toHaveAttribute('data-overflow-start'));
    } finally {
      if (sw) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', sw);
      if (cw) Object.defineProperty(HTMLElement.prototype, 'clientWidth', cw);
    }
  });

  it('names an uncaptioned scrolling table from `scrollLabel`', async () => {
    render(
      <Table scrollLabel="Fee comparison">
        <TableBody>
          <TableRow>
            <TableCell>Fee</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const scroller = screen.getByRole('table').parentElement as HTMLElement;
    size(scroller, 900, 300);
    fireEvent.scroll(scroller);
    await waitFor(() => expect(screen.getByRole('region', { name: 'Fee comparison' })).toBe(scroller));
  });

  it('`sticky` holds a cell to an edge; `opaqueRows` paints the rows for it', () => {
    render(
      <Table opaqueRows>
        <TableBody>
          <TableRow>
            <TableHead scope="row" sticky="start">
              Aarav
            </TableHead>
            <TableCell sticky="end">⋯</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('table')).toHaveAttribute('data-opaque', 'true');
    expect(screen.getByRole('rowheader')).toHaveAttribute('data-sticky', 'start');
    expect(screen.getByRole('cell')).toHaveAttribute('data-sticky', 'end');
  });
});
