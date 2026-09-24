import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookOpen, FileText, Folder, GraduationCap } from '@phosphor-icons/react';

import { Badge } from '../Badge';
import { TreeList, TreeListItem, type TreeListProps } from './TreeList';

const meta = {
  title: 'Organisms/TreeList',
  component: TreeList,
  subcomponents: { TreeListItem } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A collapsible hierarchy (the curriculum, a file store). The APG tree: `role="tree"`, every node a real',
          '`<button role="treeitem">` with `aria-level`, `aria-expanded` on parents and `aria-selected` on the',
          'selected leaf; one tab stop, then ↑ ↓ → ← Home End and type-ahead. Parents expand, leaves select.',
          'Not for a flat set of filters.',
        ].join(' '),
      },
    },
  },
  args: {
    'aria-label': 'SST curriculum',
    expanded: ['y2', 's3', 'dsa'],
    selected: 'w6',
  },
  argTypes: {
    'aria-label': { control: 'text' },
    expanded: { control: 'object', description: 'Expanded parents (two-way bound in this story).' },
    defaultExpanded: { control: 'object' },
    selected: { control: 'text', description: 'Selected leaf (two-way bound in this story).' },
    defaultSelected: { control: 'text' },
    onExpandedChange: { action: 'expandedChange', table: { category: 'Events' } },
    onSelectedChange: { action: 'selectedChange', table: { category: 'Events' } },
    className: { control: 'text' },
  },
} satisfies Meta<typeof TreeList>;

export default meta;
type Story = StoryObj<typeof meta>;

function Curriculum({ selected }: { selected?: string | null }) {
  return (
    <TreeListItem value="y2" label="Year 2 — Batch of 2029" icon={<GraduationCap />} trailing={<Badge>2 semesters</Badge>}>
      <TreeListItem value="s3" label="Semester 3" icon={<Folder />}>
        <TreeListItem
          value="dsa"
          label="Data Structures & Algorithms"
          icon={<BookOpen />}
          trailing={<Badge tone="brand">14 weeks</Badge>}
        >
          <TreeListItem
            value="w5"
            label="Week 5 — Heaps & priority queues"
            icon={<FileText weight={selected === 'w5' ? 'fill' : 'regular'} />}
            trailing={<Badge tone="success">Graded</Badge>}
          />
          <TreeListItem
            value="w6"
            label="Week 6 — Balanced binary search trees, AVL rotations and augmented order-statistic trees"
            icon={<FileText weight={selected === 'w6' ? 'fill' : 'regular'} />}
            trailing={<Badge tone="warning">In review</Badge>}
          />
          <TreeListItem
            value="w7"
            disabled
            icon={<FileText />}
            label={
              <>
                Week 7 — Graphs I <span className="text-sm">· unlocks 16 Mar 2026</span>
              </>
            }
          />
        </TreeListItem>
        <TreeListItem value="os" label="Operating Systems" icon={<BookOpen />}>
          <TreeListItem value="os1" label="Week 1 — Processes & scheduling" icon={<FileText weight={selected === 'os1' ? 'fill' : 'regular'} />} />
          <TreeListItem value="os2" label="Week 2 — Threads & synchronisation" icon={<FileText weight={selected === 'os2' ? 'fill' : 'regular'} />} />
        </TreeListItem>
      </TreeListItem>
      <TreeListItem value="s4" label="Semester 4" icon={<Folder />} trailing={<Badge>Locked</Badge>}>
        <TreeListItem value="sd" label="System Design I" icon={<BookOpen />} />
      </TreeListItem>
    </TreeListItem>
  );
}

/**
 * The HTML's four-level curriculum: expanded, collapsed, leaf, selected, disabled and a wrapping label.
 * `expanded` and `selected` are bound both ways. Click in, then use the arrow keys.
 */
export const Playground: Story = {
  render: function Render(args) {
    const [, updateArgs] = useArgs<TreeListProps>();
    return (
      <div style={{ maxWidth: 720 }}>
        <TreeList
          {...args}
          onExpandedChange={(expanded) => {
            updateArgs({ expanded });
            args.onExpandedChange?.(expanded);
          }}
          onSelectedChange={(selected) => {
            updateArgs({ selected });
            args.onSelectedChange?.(selected);
          }}
        >
          <Curriculum selected={args.selected} />
        </TreeList>
      </div>
    );
  },
};

/** Uncontrolled, collapsed at first, nothing selected: the first node is the tab stop. */
export const Uncontrolled: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [selected, setSelected] = React.useState<string | null>(null);
    return (
      <div style={{ maxWidth: 720 }}>
        <TreeList aria-label="SST curriculum, collapsed" defaultExpanded={['y2']} onSelectedChange={setSelected}>
          <Curriculum selected={selected} />
        </TreeList>
      </div>
    );
  },
};

/**
 * Eight levels deep (a file store). In a tree narrower than 480px (a phone, a sidebar) each level
 * indents 12px, the indent stops after level 4 and deeper nodes show their level number; labels
 * wrap and the badge wraps under a long label instead of overlapping it.
 */
export const DeepNesting: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const levels = ['Capstone', 'Team 7', 'Milestone 3', 'Backend', 'services', 'payments', 'webhooks'];
    const ids = levels.map((_, i) => `d${i + 1}`);
    let node: React.ReactNode = (
      <TreeListItem
        value="d8"
        label="razorpay-webhook-signature-verification.test.ts"
        icon={<FileText weight="fill" />}
        trailing={<Badge tone="success">Passing</Badge>}
      />
    );
    for (let i = levels.length - 1; i >= 0; i -= 1) {
      node = (
        <TreeListItem value={ids[i] as string} label={levels[i]} icon={<Folder />}>
          {node}
        </TreeListItem>
      );
    }
    return (
      <div style={{ maxWidth: 720 }}>
        <TreeList aria-label="Capstone repository" defaultExpanded={ids} defaultSelected="d8">
          {node}
        </TreeList>
      </div>
    );
  },
};
