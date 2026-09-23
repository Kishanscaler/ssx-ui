import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DownloadSimple, UsersThree } from '@phosphor-icons/react';

import { Avatar, AvatarFallback } from '../Avatar';
import { Badge, type BadgeTone } from '../Badge';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Code } from '../Code';
import { EmptyState } from '../EmptyState';
import { MenuItem, MenuSeparator } from '../Menu';
import { SearchInput } from '../SearchInput';
import { DataTable, type DataTableColumn, type DataTableProps, type DataTableSort } from './DataTable';

/* ---- fixture: the admissions pipeline, Batch of 2029 ---------------------- */

type Applicant = {
  id: string;
  name: string;
  initials: string;
  programme: string;
  stage: string;
  tone: BadgeTone;
  score: number;
  activity: string;
  activityAt: number;
  locked?: boolean;
};

const BASE: Omit<Applicant, 'activityAt'>[] = [
  { id: 'SST-2029-0416', name: 'Aarav Krishnan', initials: 'AK', programme: 'B.Sc. Computer Science & AI — residential, Bengaluru', stage: 'Interview scheduled', tone: 'info', score: 96, activity: '6 Mar 2026, 10:04 AM' },
  { id: 'SST-2029-0733', name: 'Ishita Balasubramanian', initials: 'IB', programme: 'B.Sc. Computer Science & AI — residential, Bengaluru', stage: 'Offer sent', tone: 'success', score: 94, activity: '5 Mar 2026, 07:20 PM' },
  { id: 'SST-2029-1187', name: 'Devansh Raghunathan', initials: 'DR', programme: 'B.Sc. Computer Science & AI — residential, Bengaluru', stage: 'On hold — documents pending', tone: 'warning', score: 89, activity: '3 Mar 2026, 02:48 PM' },
  { id: 'SSB-2029-0042', name: 'Rehan Qureshi', initials: 'RQ', programme: 'AI-first business programme — SSB, hybrid', stage: 'Shortlisted', tone: 'default', score: 86, activity: '2 Mar 2026, 11:11 AM' },
  { id: 'SST-2029-1504', name: 'Tanvi Deshpande', initials: 'TD', programme: 'B.Sc. Computer Science & AI — locked while the academic-integrity review is open', stage: 'Under review', tone: 'danger', score: 83, activity: '28 Feb 2026, 04:32 PM', locked: true },
  { id: 'SST-2029-0218', name: 'Meher Iyengar', initials: 'MI', programme: 'B.Sc. Computer Science & AI — residential, Bengaluru', stage: 'Interview scheduled', tone: 'info', score: 91, activity: '27 Feb 2026, 09:15 AM' },
  { id: 'SSB-2029-0107', name: 'Kabir Malhotra', initials: 'KM', programme: 'AI-first business programme — SSB, hybrid', stage: 'Offer sent', tone: 'success', score: 88, activity: '26 Feb 2026, 06:40 PM' },
  { id: 'SST-2029-0901', name: 'Ananya Pillai', initials: 'AP', programme: 'B.Sc. Computer Science & AI — residential, Bengaluru', stage: 'Shortlisted', tone: 'default', score: 84, activity: '25 Feb 2026, 01:05 PM' },
  { id: 'SST-2029-1322', name: 'Vihaan Chatterjee', initials: 'VC', programme: 'B.Sc. Computer Science & AI — residential, Bengaluru', stage: 'On hold — fee plan pending', tone: 'warning', score: 81, activity: '24 Feb 2026, 11:50 AM' },
  { id: 'SSB-2029-0233', name: 'Saanvi Reddy', initials: 'SR', programme: 'AI-first business programme — SSB, hybrid', stage: 'Interview scheduled', tone: 'info', score: 79, activity: '23 Feb 2026, 03:30 PM' },
  { id: 'SST-2029-0655', name: 'Arjun Menon', initials: 'AM', programme: 'B.Sc. Computer Science & AI — residential, Bengaluru', stage: 'Shortlisted', tone: 'default', score: 77, activity: '22 Feb 2026, 10:10 AM' },
  { id: 'SST-2029-1440', name: 'Diya Kulkarni', initials: 'DK', programme: 'B.Sc. Computer Science & AI — residential, Bengaluru', stage: 'Offer sent', tone: 'success', score: 93, activity: '21 Feb 2026, 05:55 PM' },
];

const APPLICANTS: Applicant[] = BASE.map((a, i) => ({ ...a, activityAt: BASE.length - i }));

const COLUMNS: DataTableColumn<Applicant>[] = [
  {
    id: 'name',
    header: 'Applicant',
    accessor: 'name',
    rowHeader: true,
    sortable: true,
    cell: (a) => (
      <span className="inline-flex items-center gap-2">
        <Avatar size="sm" aria-hidden="true">
          <AvatarFallback>{a.initials}</AvatarFallback>
        </Avatar>
        <span>{a.name}</span>
      </span>
    ),
  },
  { id: 'id', header: 'Application ID', accessor: 'id', cellClassName: 'whitespace-nowrap', cell: (a) => <Code>{a.id}</Code> },
  {
    id: 'programme',
    header: 'Programme',
    accessor: 'programme',
    // Text cells wrap by default (128px floor), so long programme names need no fixed measure.
  },
  { id: 'stage', header: 'Stage', accessor: 'stage', cell: (a) => <Badge tone={a.tone}>{a.stage}</Badge> },
  { id: 'score', header: 'NSET score', accessor: 'score', numeric: true, sortable: true },
  {
    id: 'activity',
    header: 'Last activity',
    accessor: 'activityAt',
    sortable: true,
    cellClassName: 'text-sm text-content-secondary tabular-nums',
    cell: (a) => a.activity,
  },
];

const rowActions = (a: Applicant) => (
  <>
    <MenuItem>View application</MenuItem>
    {a.stage.startsWith('Offer') ? <MenuItem>Resend the offer letter</MenuItem> : <MenuItem>Schedule an interview</MenuItem>}
    <MenuItem>Send a reminder email</MenuItem>
    <MenuSeparator />
    <MenuItem variant="danger">Withdraw application</MenuItem>
  </>
);

const bulkActions = () => (
  <>
    <Button variant="secondary" size="sm">
      Assign reviewer
    </Button>
    <Button variant="secondary" size="sm">
      Move stage
    </Button>
    <Button variant="danger" size="sm">
      Reject
    </Button>
  </>
);

function PipelineToolbar() {
  return (
    <>
      <SearchInput
        size="sm"
        aria-label="Search applicants by name or application ID"
        placeholder="Search name or SST-2029-…"
        className="w-full max-w-sm"
      />
      <Chip defaultSelected>Shortlisted</Chip>
      <Chip defaultSelected>Interview scheduled</Chip>
      <Chip>On hold</Chip>
      <span className="flex-1" aria-hidden="true" />
      <Button variant="secondary" size="sm">
        <DownloadSimple weight="bold" />
        Export
      </Button>
      <Button variant="tertiary" size="sm">
        Columns
      </Button>
    </>
  );
}

type Args = DataTableProps<Applicant>;

const meta = {
  title: 'Organisms/DataTable',
  component: DataTable as React.ComponentType<Args>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The working surface of an ops console: a toolbar slot, selection with an indeterminate select-all,',
          'sortable columns, a ⋯ Menu per row, a bulk bar that appears only while rows are selected, and a footer',
          'with the range, a rows-per-page Select and Pagination. Built from Table, Checkbox, Menu, Select,',
          'Pagination, EmptyState and Skeleton — no table library. Sort, selection, page and page size are each',
          'controlled or uncontrolled; `manualSorting` and `rowCount` hand sorting and paging to the server.',
        ].join(' '),
      },
    },
  },
  args: {
    columns: COLUMNS,
    rows: APPLICANTS,
    caption: 'Applicants to the Batch of 2029',
    density: 'default',
    striped: true,
    pinFirstColumn: false,
    mobileLayout: 'cards',
    selectable: true,
    selectedRowIds: ['SST-2029-0416'],
    sort: { columnId: 'score', direction: 'descending' },
    page: 1,
    pageSize: 5,
    pageSizeOptions: [5, 25, 50],
    paginated: true,
    manualSorting: false,
    loading: false,
    loadingRowCount: 5,
    itemLabel: 'applicants',
    paginationLabel: 'Applicant pages',
    locale: 'en-IN',
  },
  argTypes: {
    columns: { control: false, description: 'Column definitions.' },
    rows: { control: false, description: 'The rows.' },
    caption: { control: 'text', description: 'Accessible name (visually hidden caption).' },
    density: { control: 'inline-radio', options: ['default', 'compact'] },
    striped: { control: 'boolean' },
    pinFirstColumn: { control: 'boolean', description: 'Hold the checkbox and the first column while the rest scrolls sideways.' },
    mobileLayout: {
      control: 'inline-radio',
      options: ['cards', 'scroll'],
      description: 'Below a 672px container: stacked cards, or the table scrolling sideways.',
    },
    selectable: { control: 'boolean', description: 'Checkbox column, select-all and the bulk bar.' },
    selectedRowIds: { control: 'object', description: 'Selected row ids (two-way bound in this story).' },
    defaultSelectedRowIds: { control: 'object' },
    sort: { control: 'object', description: 'Sorted column (two-way bound in this story).' },
    defaultSort: { control: 'object' },
    manualSorting: { control: 'boolean' },
    page: { control: { type: 'number', min: 1 }, description: 'Current page (two-way bound in this story).' },
    defaultPage: { control: { type: 'number', min: 1 } },
    pageSize: { control: 'select', options: [5, 25, 50], description: 'Rows per page (two-way bound).' },
    defaultPageSize: { control: { type: 'number', min: 1 } },
    pageSizeOptions: { control: 'object' },
    rowCount: { control: { type: 'number', min: 0 }, description: 'Server total; `rows` is then the current page.' },
    paginated: { control: 'boolean' },
    paginationLabel: { control: 'text' },
    itemLabel: { control: 'text' },
    locale: { control: 'text' },
    loading: { control: 'boolean' },
    loadingRowCount: { control: { type: 'number', min: 1, max: 12 } },
    emptyState: { control: false },
    toolbar: { control: false },
    bulkActions: { control: false },
    rowActions: { control: false },
    getRowId: { control: false },
    getRowLabel: { control: false },
    isRowDisabled: { control: false },
    onSortChange: { action: 'sortChange', table: { category: 'Events' } },
    onSelectedRowIdsChange: { action: 'selectedRowIdsChange', table: { category: 'Events' } },
    onPageChange: { action: 'pageChange', table: { category: 'Events' } },
    onPageSizeChange: { action: 'pageSizeChange', table: { category: 'Events' } },
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The HTML's full assembly. Sort, selection, page and page size are bound both ways to the
 * controls, so clicking in the table updates them and editing them updates the table.
 */
export const Playground: Story = {
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <DataTable<Applicant>
        {...args}
        toolbar={<PipelineToolbar />}
        bulkActions={bulkActions}
        rowActions={rowActions}
        isRowDisabled={(a) => Boolean(a.locked)}
        onSortChange={(sort: DataTableSort | null) => {
          updateArgs({ sort });
          args.onSortChange?.(sort);
        }}
        onSelectedRowIdsChange={(selectedRowIds) => {
          updateArgs({ selectedRowIds });
          args.onSelectedRowIdsChange?.(selectedRowIds);
        }}
        onPageChange={(page) => {
          updateArgs({ page });
          args.onPageChange?.(page);
        }}
        onPageSizeChange={(pageSize) => {
          updateArgs({ pageSize });
          args.onPageSizeChange?.(pageSize);
        }}
      />
    );
  },
};

/** Uncontrolled: defaults only. Compact density, as in the admissions ops console. */
export const Uncontrolled: Story = {
  args: { density: 'compact' },
  render: (args) => (
    <DataTable<Applicant>
      columns={args.columns}
      rows={args.rows}
      caption="Applicants to the Batch of 2029, compact"
      density="compact"
      selectable
      defaultSort={{ columnId: 'score', direction: 'descending' }}
      defaultPageSize={5}
      pageSizeOptions={[5, 10, 25]}
      rowActions={rowActions}
      bulkActions={bulkActions}
      isRowDisabled={(a) => Boolean(a.locked)}
      itemLabel="applicants"
      paginationLabel="Applicant pages, compact"
    />
  ),
};

/** Server-side data: `rowCount` says there are 1,284; `rows` is the current page only. */
export const ServerPaged: Story = {
  render: function Render() {
    const [page, setPage] = React.useState(1);
    const [sort, setSort] = React.useState<DataTableSort | null>({ columnId: 'score', direction: 'descending' });
    // A stand-in for the fetch: the same five rows, relabelled per page.
    const rows = APPLICANTS.slice(0, 5).map((a) => ({ ...a, id: `${a.id}-p${page}` }));
    return (
      <DataTable<Applicant>
        columns={COLUMNS}
        rows={rows}
        caption="Applicants, paged on the server"
        rowCount={1284}
        page={page}
        onPageChange={setPage}
        pageSize={5}
        pageSizeOptions={[]}
        manualSorting
        sort={sort}
        onSortChange={setSort}
        selectable
        itemLabel="applicants"
        paginationLabel="Applicant pages, server"
      />
    );
  },
};

/** Loading: skeleton rows, the table `aria-busy`, pagination disabled. */
export const Loading: Story = {
  render: (args) => (
    <DataTable<Applicant>
      columns={args.columns}
      rows={[]}
      caption="Applicants, loading"
      loading
      loadingRowCount={4}
      selectable
      rowActions={rowActions}
      itemLabel="applicants"
      paginationLabel="Applicant pages, loading"
    />
  ),
};

/** Empty: the default EmptyState, and a custom one. */
export const Empty: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <DataTable<Applicant>
        columns={args.columns}
        rows={[]}
        caption="Applicants, no match"
        toolbar={<SearchInput size="sm" aria-label="Search applicants" defaultValue="Zubin" className="max-w-sm" />}
        itemLabel="applicants"
        paginationLabel="Applicant pages, empty"
      />
      <DataTable<Applicant>
        columns={args.columns}
        rows={[]}
        caption="Waitlist, empty"
        paginated={false}
        emptyState={
          <EmptyState
            icon={<UsersThree />}
            title="Nobody on the waitlist"
            description="Applicants move here when the Batch of 2029 fills. Offers close on 30 Apr 2026."
          />
        }
      />
    </div>
  ),
};

/** Minimal: string accessors only, no selection, no actions — the shape a Server Component can pass. */
export const Minimal: Story = {
  render: () => (
    <DataTable<{ id: string; module: string; cohort: string; submissions: number }>
      caption="Module submissions by cohort"
      columns={[
        { id: 'module', header: 'Module', accessor: 'module', rowHeader: true, sortable: true },
        { id: 'cohort', header: 'Cohort', accessor: 'cohort', sortable: true },
        { id: 'submissions', header: 'Submissions', accessor: 'submissions', numeric: true, sortable: true },
      ]}
      rows={[
        { id: '1', module: 'Data Structures & Algorithms', cohort: 'Cohort 7', submissions: 412 },
        { id: '2', module: 'Operating Systems', cohort: 'Cohort 7', submissions: 388 },
        { id: '3', module: 'System Design I', cohort: 'Cohort 6', submissions: 1204 },
        { id: '4', module: 'Discrete Mathematics', cohort: 'Cohort 8', submissions: 96 },
      ]}
      itemLabel="modules"
      pageSizeOptions={[]}
      paginationLabel="Module pages"
      toolbar={<span className="text-sm text-content-secondary">4 modules</span>}
    />
  ),
};

/**
 * A phone-width container (320px). `mobileLayout="cards"` (the default): each row is a card —
 * checkbox, name and ⋯ on top, every other column a label / value line — and the header row is a
 * bar with select-all and the sort buttons. The switch follows the table's own width (a container
 * query), so the same thing happens in a narrow side panel on a desktop.
 */
export const PhoneCards: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <DataTable<Applicant>
        columns={COLUMNS}
        rows={APPLICANTS}
        caption="Applicants to the Batch of 2029, cards"
        selectable
        defaultSelectedRowIds={['SST-2029-0416']}
        defaultSort={{ columnId: 'score', direction: 'descending' }}
        defaultPageSize={5}
        pageSizeOptions={[5, 25]}
        rowActions={rowActions}
        bulkActions={bulkActions}
        isRowDisabled={(a) => Boolean(a.locked)}
        itemLabel="applicants"
        paginationLabel="Applicant pages, cards"
      />
    </div>
  ),
};

/**
 * The same 320px container with `mobileLayout="scroll"` and `pinFirstColumn`: the table keeps its
 * columns and scrolls sideways; the checkbox and name stay put (at most 45% of a phone), the ⋯
 * column stays on the trailing edge, and edge shadows show which side hides columns.
 */
export const PhoneScrollPinned: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <DataTable<Applicant>
        columns={COLUMNS}
        rows={APPLICANTS}
        caption="Applicants to the Batch of 2029, scrolling"
        mobileLayout="scroll"
        pinFirstColumn
        selectable
        defaultPageSize={5}
        pageSizeOptions={[5, 25]}
        rowActions={rowActions}
        itemLabel="applicants"
        paginationLabel="Applicant pages, scrolling"
      />
    </div>
  ),
};
