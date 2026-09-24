import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table as TableIcon } from '@phosphor-icons/react';

import { Badge } from '../Badge';
import { EmptyState } from '../EmptyState';
import { Skeleton } from '../Skeleton';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  type TableProps,
} from './Table';
import { TableSortButton, type TableSortDirection } from './TableSortButton';

const meta = {
  title: 'Organisms/Table',
  component: Table,
  subcomponents: {
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
    TableCaption,
    TableSortButton,
  } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A plain semantic table for READING tabular data: the brand header band, a zebra body, numerics',
          'right-aligned in tabular figures (`numeric`). Server components throughout; a sortable header',
          '(`sort` on `TableHead`) renders the one client part, `TableSortButton`, with `aria-sort` on the',
          '`<th>`. The moment people select, bulk-act or page, it is a DataTable.',
        ].join(' '),
      },
    },
  },
  args: {
    density: 'default',
    striped: true,
    pinFirstColumn: false,
    framed: true,
    cellWrap: 'wrap',
    opaqueRows: false,
  },
  argTypes: {
    density: { control: 'inline-radio', options: ['default', 'compact'], description: 'Cell rhythm.' },
    striped: { control: 'boolean', description: 'Zebra body rows.' },
    pinFirstColumn: { control: 'boolean', description: 'Keep the first column in place while the rest scrolls.' },
    framed: { control: 'boolean', description: 'Hairline frame, radius and page surface around the table.' },
    cellWrap: {
      control: 'inline-radio',
      options: ['wrap', 'nowrap'],
      description: 'Text cells wrap (128px floor per column), or stay on one line with the table as wide as it needs.',
    },
    opaqueRows: { control: 'boolean', description: 'Paint rows on the page surface (for `sticky` cells).' },
    scrollLabel: { control: 'text', description: 'Names the scroll region when there is no caption.' },
    containerClassName: { control: 'text', description: 'Class for the scroll container.' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

type Mark = { name: string; assessment: React.ReactNode; submitted: string; score: number };

const MARKS: Mark[] = [
  {
    name: 'Aarav Krishnan',
    assessment: 'Data Structures & Algorithms — Week 6: balanced binary search trees, AVL rotations and augmented order-statistic trees',
    submitted: '4 Mar 2026, 11:42 PM',
    score: 92,
  },
  { name: 'Meher Iyengar', assessment: 'Data Structures & Algorithms — Week 6: balanced binary search trees', submitted: '4 Mar 2026, 09:07 PM', score: 88 },
  {
    name: 'Devansh Raghunathan',
    assessment: 'Data Structures & Algorithms — Week 6: resubmission after the plagiarism review cleared',
    submitted: '6 Mar 2026, 01:15 AM',
    score: 74,
  },
  { name: 'Ishita Balasubramanian', assessment: 'Data Structures & Algorithms — Week 6', submitted: '4 Mar 2026, 08:59 PM', score: 100 },
  {
    name: 'Rehan Qureshi',
    assessment: (
      <>
        Data Structures &amp; Algorithms — Week 6 <Badge tone="danger">Not submitted</Badge>
      </>
    ),
    submitted: '—',
    score: 0,
  },
];

const time = 'text-sm text-content-secondary tabular-nums';

function MarksSheet(props: TableProps) {
  return (
    <Table {...props}>
      <TableCaption>Week 6 marks for Cohort 7, Batch of 2029</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Student</TableHead>
          <TableHead scope="col">Assessment</TableHead>
          <TableHead scope="col">Submitted</TableHead>
          <TableHead scope="col" numeric>
            Score
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MARKS.map((m) => (
          <TableRow key={m.name}>
            <TableHead scope="row">{m.name}</TableHead>
            <TableCell>{m.assessment}</TableCell>
            <TableCell className={time}>{m.submitted}</TableCell>
            <TableCell numeric>{m.score}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead scope="row" colSpan={3}>
            Cohort median
          </TableHead>
          <TableCell numeric>88</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

/** The HTML's cohort marks sheet; every table-level axis is a control. */
export const Playground: Story = {
  render: (args) => <MarksSheet {...args} />,
};

/** `pinFirstColumn`: the parameter column stays put while the comparison scrolls sideways. */
export const Pinned: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <Table pinFirstColumn>
        <TableCaption>SST CS &amp; AI compared with SSB AI &amp; Business, by parameter</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Parameter</TableHead>
            <TableHead scope="col">SST — B.Sc. Computer Science &amp; Artificial Intelligence</TableHead>
            <TableHead scope="col">SSB — AI &amp; Business</TableHead>
            <TableHead scope="col">Lateral entry — Batch of 2028</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row">Duration</TableHead>
            <TableCell>4 years, residential, Bengaluru</TableCell>
            <TableCell>3 years, hybrid</TableCell>
            <TableCell>2 years, residential</TableCell>
          </TableRow>
          <TableRow>
            <TableHead scope="row">Defining experience</TableHead>
            <TableCell>50+ shipped projects and a full year of paid industry immersion inside a partner engineering team</TableCell>
            <TableCell>Six months building a startup, six months in a founder&apos;s office</TableCell>
            <TableCell>Capstone plus a single immersion semester</TableCell>
          </TableRow>
          <TableRow>
            <TableHead scope="row">Median CTC</TableHead>
            <TableCell numeric>₹19,50,000</TableCell>
            <TableCell numeric>₹17,20,000</TableCell>
            <TableCell numeric>₹15,80,000</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

/** `density="compact"`: admin density, the same table one rung tighter. */
export const Compact: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Table density="compact">
      <TableCaption>Week 6 marks, compact density</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Student</TableHead>
          <TableHead scope="col">Submitted</TableHead>
          <TableHead scope="col" numeric>
            Score
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MARKS.slice(0, 4).map((m) => (
          <TableRow key={m.name}>
            <TableHead scope="row">{m.name}</TableHead>
            <TableCell className={time}>{m.submitted}</TableCell>
            <TableCell numeric>{m.score}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/**
 * Sortable headers: `sort` + `onSortChange` on `TableHead`. The caret is drawn from
 * `aria-sort`; click a header (or Tab to it and press Enter) to cycle it. Table does not
 * reorder rows itself — that is the caller's (or DataTable's) job; this story sorts.
 */
export const Sortable: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [sort, setSort] = React.useState<{ id: 'name' | 'score'; dir: TableSortDirection }>({ id: 'score', dir: 'descending' });
    const rows = [...MARKS].sort((a, b) => {
      const r = sort.id === 'score' ? a.score - b.score : a.name.localeCompare(b.name);
      return sort.dir === 'descending' ? -r : r;
    });
    const dir = (id: 'name' | 'score') => (sort.id === id ? sort.dir : 'none');
    return (
      <Table>
        <TableCaption>Week 6 marks, sortable by student or score</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" sort={dir('name')} onSortChange={(d) => setSort({ id: 'name', dir: d })}>
              Student
            </TableHead>
            <TableHead scope="col">Submitted</TableHead>
            <TableHead scope="col" numeric sort={dir('score')} onSortChange={(d) => setSort({ id: 'score', dir: d })}>
              Score
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((m) => (
            <TableRow key={m.name}>
              <TableHead scope="row">{m.name}</TableHead>
              <TableCell className={time}>{m.submitted}</TableCell>
              <TableCell numeric>{m.score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
};

/** The three sort states side by side, as in the HTML. */
export const SortStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {(['none', 'ascending', 'descending'] as const).map((d) => (
        <Spec key={d} label={`sort · ${d}`}>
          <Table containerClassName="w-auto">
            <TableHeader>
              <TableRow>
                <TableHead scope="col" sort={d}>
                  {d === 'descending' ? 'NSET score' : 'Applicant'}
                </TableHead>
              </TableRow>
            </TableHeader>
          </Table>
        </Spec>
      ))}
    </div>
  ),
};

/** Selected and disabled rows (DataTable sets these from its selection). */
export const RowStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Table>
      <TableCaption>Row states</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Applicant</TableHead>
          <TableHead scope="col">Stage</TableHead>
          <TableHead scope="col" numeric>
            NSET score
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow selected>
          <TableHead scope="row">Aarav Krishnan</TableHead>
          <TableCell>
            <Badge tone="info">Interview scheduled</Badge>
          </TableCell>
          <TableCell numeric>96</TableCell>
        </TableRow>
        <TableRow>
          <TableHead scope="row">Ishita Balasubramanian</TableHead>
          <TableCell>
            <Badge tone="success">Offer sent</Badge>
          </TableCell>
          <TableCell numeric>94</TableCell>
        </TableRow>
        <TableRow selected>
          <TableHead scope="row">Devansh Raghunathan</TableHead>
          <TableCell>
            <Badge tone="warning">On hold — documents pending</Badge>
          </TableCell>
          <TableCell numeric>89</TableCell>
        </TableRow>
        <TableRow disabled>
          <TableHead scope="row">Tanvi Deshpande</TableHead>
          <TableCell>
            <Badge tone="danger">Under review</Badge>
          </TableCell>
          <TableCell numeric>83</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

/** Empty: an EmptyState inside the frame. Loading: Skeleton lines in the cells. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      <Spec label="empty" wide>
        <div className="rounded-lg border border-border-decorative bg-surface">
          <EmptyState
            icon={<TableIcon />}
            title="No submissions yet"
            description="Week 7 opens on 16 Mar 2026. Scores appear here as students submit."
          />
        </div>
      </Spec>
      <Spec label="loading" wide>
        <Table aria-busy="true">
          <TableCaption>Week 7 marks, loading</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Student</TableHead>
              <TableHead scope="col">Assessment</TableHead>
              <TableHead scope="col" numeric>
                Score
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ['w-2/3', 'w-full', 'w-1/3'],
              ['w-1/2', 'w-3/4', 'w-1/4'],
              ['w-3/4', 'w-2/3', 'w-1/3'],
            ].map((widths, r) => (
              <TableRow key={r}>
                {widths.map((w, c) => (
                  <TableCell key={c} className="w-1/3">
                    <Skeleton className={w} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Spec>
    </Stack>
  ),
};

/**
 * A 320px column (a phone). Text cells wrap before the table scrolls; once it does scroll, an edge
 * shadow marks the side that hides columns, the pinned column keeps a hairline and casts a shadow
 * (at most 45% of a phone), and the scroller is a focusable region named by the caption.
 */
export const Phone: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 24, maxWidth: 320 }}>
      <MarksSheet {...args} />
      <Table pinFirstColumn>
        <TableCaption>Fees by programme, pinned</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Programme</TableHead>
            <TableHead scope="col">Tuition</TableHead>
            <TableHead scope="col">Hostel</TableHead>
            <TableHead scope="col">Scholarship</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row">SST — CS &amp; AI</TableHead>
            <TableCell numeric>₹6,50,000</TableCell>
            <TableCell numeric>₹1,80,000</TableCell>
            <TableCell>Up to 100% on NSET rank</TableCell>
          </TableRow>
          <TableRow>
            <TableHead scope="row">SSB — AI &amp; Business</TableHead>
            <TableCell numeric>₹7,20,000</TableCell>
            <TableCell numeric>₹1,80,000</TableCell>
            <TableCell>Up to 50% on interview</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};
