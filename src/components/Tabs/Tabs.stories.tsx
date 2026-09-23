import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type TabsActivationMode,
  type TabsItemData,
  type TabsOrientation,
} from './Tabs';
import { Badge } from '../Badge';
import { Heading } from '../Heading';
import { Text } from '../Text';
import { BookOpen, Exam, Trophy } from '../Icon/_fixtures/phosphor';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const PanelStack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 'var(--space-2)' }}>{children}</div>
);
const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>{children}</div>
);

const Overview = () => (
  <PanelStack>
    <Heading as="h4" size="3">
      Four residential years in Bengaluru
    </Heading>
    <Text size="sm" tone="secondary">
      B.Sc in Computer Science &amp; Artificial Intelligence, awarded with BITS Pilani WILP. Cohort 7 starts 4 Aug
      2026 with 240 seats, taught by working engineers rather than career faculty.
    </Text>
    <Row>
      <Badge tone="brand">Batch of 2029</Badge>
      <Badge>240 seats</Badge>
      <Badge tone="success">Applications open</Badge>
    </Row>
  </PanelStack>
);
const Curriculum = () => (
  <PanelStack>
    <Heading as="h4" size="3">
      Eight semesters, 42 modules
    </Heading>
    <Text size="sm" tone="secondary">
      Year 1 lays down programming fundamentals and discrete mathematics. Year 2 is Data Structures &amp;
      Algorithms and Operating Systems. Year 3 splits into electives. Year 4 is a full-year capstone.
    </Text>
  </PanelStack>
);
const Placements = () => (
  <PanelStack>
    <Heading as="h4" size="3">
      Placement drive · Nov 2026
    </Heading>
    <Text size="sm" tone="secondary">
      Eligible from the end of Year 3. 18 companies confirmed for the winter drive, with a further 24 in the summer
      internship cycle.
    </Text>
  </PanelStack>
);

const PROGRAMME: TabsItemData[] = [
  { value: 'overview', label: 'Overview', content: <Overview /> },
  { value: 'curriculum', label: 'Curriculum', content: <Curriculum /> },
  { value: 'placements', label: 'Placements', content: <Placements /> },
];

const WORKSPACE: TabsItemData[] = [
  ['Overview', 'Data Structures & Algorithms — Week 6. Balanced trees, amortised analysis, and the Week 6 design review on 12 Mar 2026.'],
  ['Assignments', '3 open · next due 11 Mar 2026, 11:59 PM (Red-black tree deletion).'],
  ['Quizzes', 'Quiz 4 closes Friday. Best of 5 attempts counts toward the module grade.'],
  ['Live classes', 'Tue & Thu, 7:00–8:30 PM IST with Anshuman Singh.'],
  ['Recordings', '22 recordings · retained for 18 months after the cohort ends.'],
  ['Resources', 'Problem sets, reference implementations and the module reading list.'],
  ['Discussion', '148 threads · 6 unanswered, answered by mentors within a working day.'],
  ['Grades', 'Running grade 84.5% · published after each graded artefact.'],
].map(([label, text]) => ({
  value: (label as string).toLowerCase().replace(/\s+/g, '-'),
  label,
  content: (
    <Text size="sm" tone="secondary">
      {text}
    </Text>
  ),
}));

const MODES: TabsActivationMode[] = ['automatic', 'manual'];
const ORIENTATIONS: TabsOrientation[] = ['horizontal', 'vertical'];

const meta = {
  title: 'Molecules/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Parallel panels, exactly one visible. Peers only — a sequence is a Stepper, and never hide a',
          'required field in a tab. The ARIA tabs pattern from Radix: one tab stop, arrows / Home / End',
          'between tabs; `activationMode="manual"` moves focus without selecting (Enter / Space selects).',
          'Inactive panels are unmounted, so they are out of the accessibility tree. A long list scrolls.',
          '',
          'Compound API first; the flat `items` + `listLabel` form maps onto a Storyblok blok.',
        ].join('\n'),
      },
    },
  },
  args: {
    listLabel: 'B.Sc CS & AI programme details',
    activationMode: 'automatic',
    orientation: 'horizontal',
    defaultValue: 'overview',
    items: PROGRAMME,
  },
  argTypes: {
    listLabel: { control: 'text' },
    activationMode: { control: 'select', options: MODES },
    orientation: { control: 'select', options: ORIENTATIONS },
    defaultValue: { control: 'select', options: PROGRAMME.map((i) => i.value) },
    dir: { control: 'select', options: ['ltr', 'rtl'] },
    items: { control: false },
    className: { control: 'text' },
  },
  render: (args) => (
    <div style={{ maxWidth: 720 }}>
      <Tabs key={String(args.defaultValue)} {...args} />
    </div>
  ),
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The HTML's first specimen: three tabs on a programme page. Compound API. */
export const ThreeTabs: Story = {
  render: () => (
    <Spec label="programme page · click to switch" wide>
      <Tabs defaultValue="overview">
        <TabsList aria-label="B.Sc CS & AI programme details">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Overview />
        </TabsContent>
        <TabsContent value="curriculum">
          <Curriculum />
        </TabsContent>
        <TabsContent value="placements">
          <Placements />
        </TabsContent>
      </Tabs>
    </Spec>
  ),
};

/** Eight tabs in a narrow column: the list scrolls horizontally rather than wrapping. */
export const Overflow: Story = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Spec label="8 tabs · list scrolls horizontally" wide>
        <Tabs listLabel="Module workspace" items={WORKSPACE} />
      </Spec>
    </div>
  ),
};

/**
 * Not in the HTML specimen; composition the trigger supports. An icon is sized
 * for you; a count is a `Badge size="sm"`. A disabled tab is skipped by the arrows.
 */
export const IconsBadgesDisabled: Story = {
  render: () => (
    <Stack>
      <Tabs defaultValue="modules">
        <TabsList aria-label="Learner dashboard">
          <TabsTrigger value="modules">
            <BookOpen /> Modules
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            <Exam /> Quizzes <Badge size="sm" tone="brand">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="awards" disabled>
            <Trophy /> Awards
          </TabsTrigger>
        </TabsList>
        <TabsContent value="modules">
          <Text size="sm" tone="secondary">6 modules in progress.</Text>
        </TabsContent>
        <TabsContent value="quizzes">
          <Text size="sm" tone="secondary">3 quizzes due this week.</Text>
        </TabsContent>
      </Tabs>
    </Stack>
  ),
};

/** Manual activation: arrows move focus only; Enter or Space selects. */
export const ManualActivation: Story = { args: { activationMode: 'manual' } };

/** Vertical: Up / Down move between tabs, the bar sits on the leading edge. */
export const Vertical: Story = { args: { orientation: 'vertical' } };
