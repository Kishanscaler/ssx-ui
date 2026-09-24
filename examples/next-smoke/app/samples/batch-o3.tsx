import type { Samples } from './types';

/**
 * Batch O3 (organisms O3) samples. Only the batch O3 agent edits this file. See ./index.tsx.
 * Rendered in a SERVER Component: Table and List are server components (a
 * sortable TableHead renders the client TableSortButton); DataTable, TreeList
 * and Toolbar are client references given only serialisable props (DataTable
 * columns use string accessors).
 */
const samples: Samples = {
  Table: (ui) => (
    <>
      <ui.Table>
        <ui.TableCaption>Week 6 marks for Cohort 7</ui.TableCaption>
        <ui.TableHeader>
          <ui.TableRow>
            <ui.TableHead scope="col">Student</ui.TableHead>
            <ui.TableHead scope="col" numeric sort="descending">
              Score
            </ui.TableHead>
          </ui.TableRow>
        </ui.TableHeader>
        <ui.TableBody>
          <ui.TableRow selected>
            <ui.TableHead scope="row">Aarav Krishnan</ui.TableHead>
            <ui.TableCell numeric>92</ui.TableCell>
          </ui.TableRow>
        </ui.TableBody>
        <ui.TableFooter>
          <ui.TableRow>
            <ui.TableHead scope="row">Cohort median</ui.TableHead>
            <ui.TableCell numeric>88</ui.TableCell>
          </ui.TableRow>
        </ui.TableFooter>
      </ui.Table>
      <ui.TableSortButton direction="ascending">Applicant</ui.TableSortButton>
    </>
  ),
  TableHeader: 'Table',
  TableBody: 'Table',
  TableFooter: 'Table',
  TableRow: 'Table',
  TableHead: 'Table',
  TableCell: 'Table',
  TableCaption: 'Table',
  TableSortButton: 'Table',
  DataTable: (ui) => (
    <ui.DataTable
      caption="Applicants to the Batch of 2029"
      columns={[
        { id: 'name', header: 'Applicant', accessor: 'name', rowHeader: true, sortable: true },
        { id: 'score', header: 'NSET score', accessor: 'score', numeric: true, sortable: true },
      ]}
      rows={[
        { id: 'SST-2029-0416', name: 'Aarav Krishnan', score: 96 },
        { id: 'SST-2029-0733', name: 'Ishita Balasubramanian', score: 94 },
      ]}
      defaultSort={{ columnId: 'score', direction: 'descending' }}
      selectable
      defaultSelectedRowIds={['SST-2029-0416']}
      itemLabel="applicants"
      paginationLabel="Applicant pages"
    />
  ),
  List: (ui) => (
    <ui.List aria-label="Week 6 submissions">
      <ui.ListItem selected>
        <ui.ListItemLeading>MI</ui.ListItemLeading>
        <ui.ListItemContent>
          <ui.ListItemTitle meta="SST-2029-0733">Meher Iyengar</ui.ListItemTitle>
          <ui.ListItemDescription>Submitted 4 Mar 2026, 09:07 PM</ui.ListItemDescription>
        </ui.ListItemContent>
        <ui.ListItemTrailing>
          <ui.Badge tone="warning">In review</ui.Badge>
        </ui.ListItemTrailing>
      </ui.ListItem>
    </ui.List>
  ),
  ListItem: 'List',
  ListItemLeading: 'List',
  ListItemContent: 'List',
  ListItemTitle: 'List',
  ListItemDescription: 'List',
  ListItemTrailing: 'List',
  TreeList: (ui) => (
    <ui.TreeList aria-label="SST curriculum" defaultExpanded={['s3']} defaultSelected="w6">
      <ui.TreeListItem value="s3" label="Semester 3">
        <ui.TreeListItem value="w5" label="Week 5 — Heaps & priority queues" />
        <ui.TreeListItem value="w6" label="Week 6 — Balanced binary search trees" />
      </ui.TreeListItem>
    </ui.TreeList>
  ),
  TreeListItem: 'TreeList',
  Toolbar: (ui) => (
    <ui.Toolbar aria-label="Lecture note formatting">
      <ui.ToolbarGroup aria-label="Text style">
        <ui.ToolbarToggle aria-label="Bold" defaultPressed>
          B
        </ui.ToolbarToggle>
      </ui.ToolbarGroup>
      <ui.ToolbarSeparator />
      <ui.ToolbarSpacer />
      <ui.IconButton variant="tertiary" size="sm" aria-label="More note actions">
        …
      </ui.IconButton>
    </ui.Toolbar>
  ),
  // overflow="menu": server and first client render show every item; the
  // ⋯ is there (hidden until something moves in).
  ToolbarOverflow: (ui) => (
    <ui.Toolbar aria-label="Lecture note actions" overflow="menu">
      <ui.ToolbarItem>
        <ui.IconButton variant="tertiary" size="sm" aria-label="Share">
          S
        </ui.IconButton>
      </ui.ToolbarItem>
      <ui.ToolbarOverflow aria-label="More note actions" />
    </ui.Toolbar>
  ),
  ToolbarGroup: 'Toolbar',
  ToolbarSeparator: 'Toolbar',
  ToolbarSpacer: 'Toolbar',
  ToolbarToggle: 'Toolbar',
};

export default samples;
