import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileCode, Folder } from '@phosphor-icons/react';

import { ResizeGroup, ResizeHandle, ResizePane } from './ResizeHandle';
import { Badge } from '../Badge';
import { CodeBlock } from '../Code';
import { Stack } from '../Stack';
import { StatusDot } from '../StatusDot';
import { Text } from '../Text';
import { TreeList, TreeListItem } from '../TreeList';
import { Spec } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Layout/ResizeHandle',
  component: ResizeGroup,
  subcomponents: { ResizePane, ResizeHandle } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A draggable divider that rebalances two adjacent panes. Use it only where the right split',
          'genuinely differs per person or per task (the capstone editor, the admissions reviewer), never',
          'as a substitute for choosing a good default. Markup order is load-bearing: `ResizePane`,',
          '`ResizeHandle`, `ResizePane`, as direct children of `ResizeGroup`. `value` is the start pane’s',
          'share in percent, clamped to 20–80 by default.',
          '',
          'The handle is a WAI-ARIA window splitter and owns all of its ARIA; you write only an',
          '`aria-label` saying what is resized. Keys: ← / → (↑ / ↓ when stacked) move 2%, Shift ± 10%,',
          'Home / End jump to the clamps, Enter collapses and restores when `collapsible`. Pointer drags',
          'use pointer capture; on touch the 8px handle has a 44px hit area.',
        ].join('\n'),
      },
    },
  },
  args: { direction: 'horizontal', defaultValue: 32, min: 20, max: 80, step: 2, largeStep: 10, collapsible: false, disabled: false },
  argTypes: {
    direction: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    onValueChange: { action: 'valueChange', table: { category: 'Events' } },
    onValueCommit: { action: 'valueCommit', table: { category: 'Events' } },
  },
} satisfies Meta<typeof ResizeGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const SEGMENT_TREE = `void update(int node, int lo, int hi, int l, int r, long add) {
  push(node, lo, hi);
  if (r < lo || hi < l) return;
  if (l <= lo && hi <= r) { lazy[node] += add; push(node, lo, hi); return; }
  int mid = (lo + hi) >>> 1;
  update(2 * node, lo, mid, l, r, add);
  update(2 * node + 1, mid + 1, hi, l, r, add);
  tree[node] = tree[2 * node] + tree[2 * node + 1];
}`;

const FileTree = () => (
  <div className="p-4">
    <TreeList aria-label="Capstone repository" defaultExpanded={['src', 'graphs']} defaultSelected="seg">
      <TreeListItem value="src" label="src" icon={<Folder />}>
        <TreeListItem value="graphs" label="graphs" icon={<Folder />}>
          <TreeListItem value="dijkstra" label="Dijkstra.java" icon={<FileCode />} />
          <TreeListItem value="seg" label="SegmentTreeLazyPropagation.java" icon={<FileCode />} />
        </TreeListItem>
        <TreeListItem value="main" label="Main.java" icon={<FileCode />} />
      </TreeListItem>
      <TreeListItem value="tests" label="tests" icon={<Folder />}>
        <TreeListItem value="dtest" label="DijkstraTest.java" icon={<FileCode />} />
      </TreeListItem>
    </TreeList>
  </div>
);

const EditorPane = () => (
  <div className="p-4">
    <Stack>
      <Stack direction="horizontal" gap="2" wrap>
        <Badge tone="brand">SegmentTreeLazyPropagation.java</Badge>
        <Text as="span" size="xs" tone="secondary">
          Autosaved 4 Mar 2026, 11:42 PM
        </Text>
      </Stack>
      <CodeBlock aria-label="SegmentTreeLazyPropagation.java">{SEGMENT_TREE}</CodeBlock>
      <Stack direction="horizontal" gap="2">
        <StatusDot tone="success" />
        <Text as="span" size="sm" tone="secondary">
          14 of 14 tests passing · submitted for Week 11 review
        </Text>
      </Stack>
    </Stack>
  </div>
);

/** Drag the divider, or Tab to it and use ← / →. The file tree genuinely widens. */
export const Playground: Story = {
  render: (args) => (
    <ResizeGroup {...args}>
      <ResizePane>
        <FileTree />
      </ResizePane>
      <ResizeHandle aria-label="Resize the capstone file tree" />
      <ResizePane>
        <EditorPane />
      </ResizePane>
    </ResizeGroup>
  ),
};

/** `direction="vertical"`: an editor above a test console. Drag the bar, or focus it and press ↑ / ↓. */
export const RowSplitter: Story = {
  args: { direction: 'vertical', defaultValue: 55 },
  render: (args) => (
    <ResizeGroup {...args} className="h-[26rem]">
      <ResizePane>
        <div className="p-4">
          <Stack gap="2">
            <Stack direction="horizontal" gap="2" wrap>
              <Badge tone="brand">DijkstraTest.java</Badge>
              <Text as="span" size="xs" tone="secondary">
                Run 6 Mar 2026, 01:15 AM
              </Text>
            </Stack>
            <CodeBlock aria-label="DijkstraTest.java">{`@Test void shortestPathAcrossDisconnectedComponents() {
  Graph g = Graph.of(6);
  g.edge(0, 1, 4); g.edge(1, 2, 3);
  assertEquals(Long.MAX_VALUE, Dijkstra.run(g, 0)[5]);
}`}</CodeBlock>
          </Stack>
        </div>
      </ResizePane>
      <ResizeHandle aria-label="Resize the test console" />
      <ResizePane>
        <div className="p-4">
          <Stack gap="2">
            <Stack direction="horizontal" gap="2">
              <StatusDot tone="success" />
              <Text as="span" size="sm" tone="secondary">
                14 of 14 tests passing in 0.41s
              </Text>
            </Stack>
            <CodeBlock aria-label="Test output">{`BUILD SUCCESSFUL in 2s
14 tests completed, 0 failed
> Task :capstone:test`}</CodeBlock>
          </Stack>
        </div>
      </ResizePane>
    </ResizeGroup>
  ),
};

/** `collapsible`: focus the handle and press Enter to collapse the applicant list; Enter again restores it. */
export const Collapsible: Story = {
  args: { collapsible: true, defaultValue: 40 },
  render: (args) => (
    <ResizeGroup {...args}>
      <ResizePane>
        <div className="p-4">
          <Stack gap="2" as="ul" aria-label="Round 2 applicants">
            {['Aarav Krishnan', 'Meera Subramaniam', 'Kabir Malhotra', 'Ishita Rao'].map((n) => (
              <Text as="li" key={n} size="sm">
                {n}
              </Text>
            ))}
          </Stack>
        </div>
      </ResizePane>
      <ResizeHandle aria-label="Resize the applicant list" />
      <ResizePane>
        <div className="p-4">
          <Stack gap="2">
            <Text>Aarav Krishnan · NSET 91</Text>
            <Text size="sm" tone="secondary">
              Interview scheduled for 12 Mar 2026. Needs-based aid requested; documents with the registrar.
            </Text>
          </Stack>
        </div>
      </ResizePane>
    </ResizeGroup>
  ),
};

/** Controlled: the split lives in your state, here shown as a readout and committed on release. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [value, setValue] = React.useState(35);
    const [saved, setSaved] = React.useState(35);
    return (
      <Stack>
        <Text size="sm" tone="secondary" role="status">
          Live: {Math.round(value)}% · saved for this reviewer: {Math.round(saved)}%
        </Text>
        <ResizeGroup value={value} onValueChange={setValue} onValueCommit={setSaved}>
          <ResizePane>
            <div className="p-4">
              <Text size="sm">Applicant list</Text>
            </div>
          </ResizePane>
          <ResizeHandle aria-label="Resize the applicant list" />
          <ResizePane>
            <div className="p-4">
              <Text size="sm">Application detail</Text>
            </div>
          </ResizePane>
        </ResizeGroup>
      </Stack>
    );
  },
};

/** `disabled`: the split is fixed, the handle leaves the tab order and ignores the pointer. */
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <Spec label="disabled · a locked review layout" wide>
      <ResizeGroup {...args}>
        <ResizePane>
          <div className="p-4">
            <Text size="sm">Rubric</Text>
          </div>
        </ResizePane>
        <ResizeHandle aria-label="Resize the rubric" />
        <ResizePane>
          <div className="p-4">
            <Text size="sm">Submission</Text>
          </div>
        </ResizePane>
      </ResizeGroup>
    </Spec>
  ),
};
