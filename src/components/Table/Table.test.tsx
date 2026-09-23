import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

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
