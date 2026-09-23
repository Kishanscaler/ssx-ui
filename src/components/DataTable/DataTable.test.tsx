import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { MenuItem } from '../Menu';
import { DataTable, type DataTableColumn, type DataTableProps } from './DataTable';

/* jsdom has no pointer capture; Radix Select / Menu call these. */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
}

type Applicant = { id: string; name: string; score: number; stage: string; locked?: boolean };

const applicants: Applicant[] = [
  { id: 'SST-0416', name: 'Aarav Krishnan', score: 96, stage: 'Interview scheduled' },
  { id: 'SST-0733', name: 'Ishita Balasubramanian', score: 94, stage: 'Offer sent' },
  { id: 'SST-1187', name: 'Devansh Raghunathan', score: 89, stage: 'On hold' },
  { id: 'SSB-0042', name: 'Rehan Qureshi', score: 86, stage: 'Shortlisted' },
  { id: 'SST-1504', name: 'Tanvi Deshpande', score: 83, stage: 'Under review', locked: true },
];

const columns: DataTableColumn<Applicant>[] = [
  { id: 'name', header: 'Applicant', accessor: 'name', rowHeader: true, sortable: true },
  { id: 'stage', header: 'Stage', accessor: 'stage' },
  { id: 'score', header: 'NSET score', accessor: 'score', numeric: true, sortable: true },
];

function Pipeline(props: Partial<DataTableProps<Applicant>>) {
  return (
    <DataTable<Applicant>
      caption="Applicants to the Batch of 2029"
      columns={columns}
      rows={applicants}
      itemLabel="applicants"
      paginationLabel="Applicant pages"
      {...props}
    />
  );
}

const bodyNames = () =>
  screen
    .getAllByRole('rowheader')
    .map((th) => th.textContent);

describe('DataTable', () => {
  it('renders the columns and rows as a named table, in a frame with a footer', () => {
    render(<Pipeline />);
    const root = screen.getByRole('table', { name: 'Applicants to the Batch of 2029' }).closest('[data-slot="data-table"]');
    expect(root).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Applicant', 'Stage', 'NSET score']);
    expect(bodyNames()).toEqual(applicants.map((a) => a.name));
    expect(screen.getByText('Showing 1–5 of 5 applicants')).toHaveAttribute('data-slot', 'data-table-range');
    expect(screen.getByRole('navigation', { name: 'Applicant pages' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '96' })).toHaveAttribute('data-numeric', 'true');
  });

  it('sorts locally: none → ascending → descending, reported through onSortChange', () => {
    const onSortChange = vi.fn();
    render(<Pipeline onSortChange={onSortChange} />);
    const head = () => screen.getByRole('columnheader', { name: /NSET score/ });
    expect(head()).toHaveAttribute('aria-sort', 'none');
    fireEvent.click(within(head()).getByRole('button'));
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: 'score', direction: 'ascending' });
    expect(head()).toHaveAttribute('aria-sort', 'ascending');
    expect(bodyNames()[0]).toBe('Tanvi Deshpande');
    fireEvent.click(within(head()).getByRole('button'));
    expect(head()).toHaveAttribute('aria-sort', 'descending');
    expect(bodyNames()[0]).toBe('Aarav Krishnan');
    // Another column takes over; the first goes back to none.
    fireEvent.click(screen.getByRole('button', { name: 'Applicant' }));
    expect(head()).toHaveAttribute('aria-sort', 'none');
    expect(bodyNames()).toEqual([...applicants.map((a) => a.name)].sort());
    // A non-sortable column has no aria-sort.
    expect(screen.getByRole('columnheader', { name: 'Stage' })).not.toHaveAttribute('aria-sort');
  });

  it('with manualSorting reports the sort but leaves the order alone', () => {
    const onSortChange = vi.fn();
    render(<Pipeline manualSorting defaultSort={{ columnId: 'score', direction: 'ascending' }} onSortChange={onSortChange} />);
    expect(bodyNames()[0]).toBe('Aarav Krishnan');
    fireEvent.click(screen.getByRole('button', { name: 'NSET score' }));
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: 'score', direction: 'descending' });
    expect(bodyNames()[0]).toBe('Aarav Krishnan');
  });

  it('selects rows, with an indeterminate select-all and a bulk bar only while selected', () => {
    const onSelected = vi.fn();
    render(
      <Pipeline
        selectable
        isRowDisabled={(r) => Boolean(r.locked)}
        onSelectedRowIdsChange={onSelected}
        bulkActions={() => <button type="button">Move stage</button>}
      />,
    );
    const all = screen.getByRole('checkbox', { name: 'Select all rows on this page' });
    expect(all).toHaveAttribute('aria-checked', 'false');
    expect(document.querySelector('[data-slot="data-table-bulk-bar"]')).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'Select Tanvi Deshpande' })).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Aarav Krishnan' }));
    expect(onSelected).toHaveBeenLastCalledWith(['SST-0416']);
    expect(all).toHaveAttribute('aria-checked', 'mixed');
    expect(screen.getByRole('row', { name: /Aarav Krishnan/ })).toHaveAttribute('aria-selected', 'true');
    const bar = document.querySelector('[data-slot="data-table-bulk-bar"]') as HTMLElement;
    expect(within(bar).getByText('1 of 5 selected')).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: 'Move stage' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 of 5 selected');

    // Select-all takes every selectable row on the page (not the locked one).
    fireEvent.click(all);
    expect(onSelected).toHaveBeenLastCalledWith(['SST-0416', 'SST-0733', 'SST-1187', 'SSB-0042']);
    const deselect = screen.getByRole('checkbox', { name: 'Deselect all rows on this page' });
    expect(deselect).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(deselect);
    expect(onSelected).toHaveBeenLastCalledWith([]);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Rehan Qureshi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onSelected).toHaveBeenLastCalledWith([]);
    expect(document.querySelector('[data-slot="data-table-bulk-bar"]')).toBeNull();
  });

  it('controlled selection follows the prop', () => {
    const { rerender } = render(<Pipeline selectable selectedRowIds={['SST-0733']} />);
    expect(screen.getByRole('checkbox', { name: 'Select Ishita Balasubramanian' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Aarav Krishnan' }));
    // Not updated: the parent did not change the prop.
    expect(screen.getByRole('checkbox', { name: 'Select Aarav Krishnan' })).toHaveAttribute('aria-checked', 'false');
    rerender(<Pipeline selectable selectedRowIds={[]} />);
    expect(screen.getByRole('checkbox', { name: 'Select Ishita Balasubramanian' })).toHaveAttribute('aria-checked', 'false');
  });

  it('pages locally and resets to page 1 on sort', () => {
    const onPageChange = vi.fn();
    render(<Pipeline defaultPageSize={2} pageSizeOptions={[2, 5]} onPageChange={onPageChange} />);
    expect(bodyNames()).toEqual(['Aarav Krishnan', 'Ishita Balasubramanian']);
    expect(screen.getByText('Showing 1–2 of 5 applicants')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    expect(bodyNames()).toEqual(['Tanvi Deshpande']);
    expect(screen.getByText('Showing 5–5 of 5 applicants')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'NSET score' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    expect(bodyNames()).toEqual(['Tanvi Deshpande', 'Rehan Qureshi']);
  });

  it('changes the page size through the Select', () => {
    const onPageSizeChange = vi.fn();
    render(<Pipeline defaultPageSize={2} pageSizeOptions={[2, 5]} onPageSizeChange={onPageSizeChange} />);
    const trigger = screen.getByRole('combobox', { name: 'Rows' });
    expect(trigger).toHaveTextContent('2');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.click(screen.getByRole('option', { name: '5' }));
    expect(onPageSizeChange).toHaveBeenLastCalledWith(5);
    expect(bodyNames()).toHaveLength(5);
  });

  it('with rowCount treats rows as the current server page', () => {
    render(<Pipeline rowCount={1284} page={2} pageSize={5} />);
    expect(bodyNames()).toHaveLength(5);
    expect(screen.getByText('Showing 6–10 of 1,284 applicants')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 257' })).toBeInTheDocument();
  });

  it('opens a row Menu from a named ⋯ button; a disabled row has a disabled button', () => {
    render(
      <Pipeline
        isRowDisabled={(r) => Boolean(r.locked)}
        rowActions={(row) => <MenuItem>View {row.name}</MenuItem>}
      />,
    );
    expect(screen.getByRole('columnheader', { name: 'Row actions' })).toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Actions for Aarav Krishnan' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByRole('menuitem', { name: 'View Aarav Krishnan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for Tanvi Deshpande, unavailable', hidden: true })).toBeDisabled();
  });

  it('shows skeleton rows while loading and an EmptyState with no rows', () => {
    const { rerender } = render(<Pipeline loading loadingRowCount={3} />);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(document.querySelectorAll('[data-slot="data-table-loading-row"]')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('Loading applicants');
    rerender(<Pipeline rows={[]} />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('0 applicants')).toBeInTheDocument();
    rerender(<Pipeline rows={[]} emptyState={<p>No applicants for this filter</p>} />);
    expect(screen.getByText('No applicants for this filter')).toBeInTheDocument();
  });

  it('renders a toolbar slot, hides the footer when not paginated, forwards ref and className', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <DataTable<Applicant>
        ref={ref}
        columns={columns}
        rows={applicants}
        className="shadow-raised"
        toolbar={<span>1,284 applicants</span>}
        paginated={false}
      />,
    );
    expect(ref.current).toHaveAttribute('data-slot', 'data-table');
    expect(ref.current).toHaveClass('shadow-raised');
    expect(screen.getByText('1,284 applicants').parentElement).toHaveAttribute('data-slot', 'data-table-toolbar');
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});

describe('DataTable on narrow containers', () => {
  it('defaults to the card layout: explicit table roles and a label per value cell', () => {
    const { container } = render(<Pipeline selectable rowActions={() => <MenuItem>View</MenuItem>} />);
    const root = container.querySelector('[data-slot="data-table"]');
    expect(root).toHaveAttribute('data-mobile-layout', 'cards');
    expect(root).toHaveClass('@container');
    const table = screen.getByRole('table', { name: 'Applicants to the Batch of 2029' });
    expect(table).toHaveAttribute('role', 'table');
    const row = screen.getAllByRole('row')[1] as HTMLElement;
    expect(row).toHaveAttribute('role', 'row');
    // The title (row header) has no label; other columns carry theirs.
    expect(within(row).getByRole('rowheader')).not.toHaveAttribute('data-label');
    expect(within(row).getByRole('cell', { name: 'Interview scheduled' })).toHaveAttribute('data-label', 'Stage');
    expect(within(row).getByRole('cell', { name: '96' })).toHaveAttribute('data-label', 'NSET score');
    // The card bar's visible "Select all" names the same checkbox.
    const selectAll = screen.getByRole('checkbox', { name: 'Select all rows on this page' });
    expect(container.querySelector(`label[for="${selectAll.id}"]`)).toHaveTextContent('Select all');
  });

  it('`label` overrides the card label; a non-string header without one gets none', () => {
    render(
      <Pipeline
        columns={[
          { id: 'name', header: 'Applicant', accessor: 'name', rowHeader: true },
          { id: 'stage', header: <em>Stage</em>, accessor: 'stage' },
          { id: 'score', header: 'NSET score', label: 'Score', accessor: 'score', numeric: true },
        ]}
      />,
    );
    const row = screen.getAllByRole('row')[1] as HTMLElement;
    expect(within(row).getByRole('cell', { name: 'Interview scheduled' })).not.toHaveAttribute('data-label');
    expect(within(row).getByRole('cell', { name: '96' })).toHaveAttribute('data-label', 'Score');
  });

  it('`mobileLayout="scroll"` keeps the plain table: no card roles or labels', () => {
    const { container } = render(<Pipeline mobileLayout="scroll" selectable />);
    expect(container.querySelector('[data-slot="data-table"]')).toHaveAttribute('data-mobile-layout', 'scroll');
    expect(container.querySelector('table')).not.toHaveAttribute('role');
    expect(container.querySelector('[data-label]')).toBeNull();
    expect(screen.queryByText('Select all')).toBeNull();
  });

  it('keeps the ⋯ column sticky to the trailing edge, on opaque rows', () => {
    const { container } = render(<Pipeline rowActions={() => <MenuItem>View</MenuItem>} />);
    const cells = container.querySelectorAll('[data-slot="data-table-actions-cell"]');
    expect(cells).toHaveLength(applicants.length);
    cells.forEach((cell) => expect(cell).toHaveAttribute('data-sticky', 'end'));
    expect(container.querySelector('thead th:last-child')).toHaveAttribute('data-sticky', 'end');
    expect(container.querySelector('table')).toHaveAttribute('data-opaque', 'true');
  });

  it('`pinFirstColumn` pins the checkbox and the first column, header included', () => {
    const { container } = render(<Pipeline selectable pinFirstColumn />);
    const [headSelect, headName] = Array.from(container.querySelectorAll('thead th'));
    expect(headSelect).toHaveAttribute('data-sticky', 'start');
    expect(headName).toHaveAttribute('data-sticky', 'start');
    const row = screen.getAllByRole('row')[1] as HTMLElement;
    expect(row.querySelector('[data-slot="data-table-select-cell"]')).toHaveAttribute('data-sticky', 'start');
    expect(within(row).getByRole('rowheader')).toHaveAttribute('data-sticky', 'start');
    expect(within(row).getByRole('cell', { name: '96' })).not.toHaveAttribute('data-sticky');
    expect(container.querySelector('table')).toHaveAttribute('data-opaque', 'true');
  });

  it('selection, bulk actions and paging still work in the card layout', () => {
    const onSelected = vi.fn();
    render(
      <Pipeline
        selectable
        defaultPageSize={2}
        pageSizeOptions={[]}
        onSelectedRowIdsChange={onSelected}
        bulkActions={() => <button type="button">Move stage</button>}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Aarav Krishnan' }));
    expect(onSelected).toHaveBeenLastCalledWith(['SST-0416']);
    expect(screen.getByRole('button', { name: 'Move stage' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(bodyNames()).toEqual(['Devansh Raghunathan', 'Rehan Qureshi']);
  });
});
