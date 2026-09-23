import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SegmentedControl, SegmentedControlItem, type SegmentedControlProps } from './SegmentedControl';

const meta = {
  title: 'Molecules/SegmentedControl',
  component: SegmentedControl,
  subcomponents: { SegmentedControlItem },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A single-select switch on a sunken track: exactly one segment is always active. It filters the',
          '**same** content (Tabs switch between different contents). At most four segments, two words each.',
          '',
          'A radio group: Tab lands on the checked segment, arrows / Home / End move **and** select, disabled',
          'segments are skipped. Pressing the active segment again keeps it. The raised pill travels to the',
          'chosen segment (`--motion-duration-normal`, productive easing); no travel under reduced motion.',
          'Never disable the active segment.',
        ].join('\n'),
      },
    },
  },
  args: {
    'aria-label': 'Filter submissions by status',
    value: 'all',
    disabled: false,
    loop: true,
  },
  argTypes: {
    value: { control: 'select', options: ['all', 'submitted', 'graded'] },
    defaultValue: { control: 'select', options: ['all', 'submitted', 'graded'] },
    disabled: { control: 'boolean' },
    loop: { control: 'boolean' },
    'aria-label': { control: 'text' },
    onValueChange: { control: false },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

const Spec = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-semibold text-content-secondary">{label}</span>
    {children}
  </div>
);

/** Two-way: choosing a segment updates the `value` control, and the control moves the pill. */
export const Playground: Story = {
  render: function PlaygroundStory(args) {
    const [, updateArgs] = useArgs<SegmentedControlProps>();
    return (
      <SegmentedControl {...args} onValueChange={(value) => updateArgs({ value })}>
        <SegmentedControlItem value="all">All</SegmentedControlItem>
        <SegmentedControlItem value="submitted">Submitted</SegmentedControlItem>
        <SegmentedControlItem value="graded">Graded</SegmentedControlItem>
      </SegmentedControl>
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="2-way · one active">
        <SegmentedControl aria-label="Roster density" defaultValue="compact">
          <SegmentedControlItem value="compact">Compact</SegmentedControlItem>
          <SegmentedControlItem value="comfortable">Comfortable</SegmentedControlItem>
        </SegmentedControl>
      </Spec>
      <Spec label="3-way · one active">
        <SegmentedControl aria-label="Filter submissions by status" defaultValue="all">
          <SegmentedControlItem value="all">All</SegmentedControlItem>
          <SegmentedControlItem value="submitted">Submitted</SegmentedControlItem>
          <SegmentedControlItem value="graded">Graded</SegmentedControlItem>
        </SegmentedControl>
      </Spec>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="middle segment active">
        <SegmentedControl aria-label="Filter submissions, submitted selected" defaultValue="submitted">
          <SegmentedControlItem value="all">All</SegmentedControlItem>
          <SegmentedControlItem value="submitted">Submitted</SegmentedControlItem>
          <SegmentedControlItem value="graded">Graded</SegmentedControlItem>
        </SegmentedControl>
      </Spec>
      <Spec label="one segment disabled">
        <SegmentedControl aria-label="Filter submissions, grading not open" defaultValue="all">
          <SegmentedControlItem value="all">All</SegmentedControlItem>
          <SegmentedControlItem value="submitted">Submitted</SegmentedControlItem>
          <SegmentedControlItem value="graded" disabled>
            Graded
          </SegmentedControlItem>
        </SegmentedControl>
      </Spec>
      <Spec label="two segments disabled">
        <SegmentedControl aria-label="Filter submissions, grading and moderation not open" defaultValue="all">
          <SegmentedControlItem value="all">All</SegmentedControlItem>
          <SegmentedControlItem value="graded" disabled>
            Graded
          </SegmentedControlItem>
          <SegmentedControlItem value="moderated" disabled>
            Moderated
          </SegmentedControlItem>
        </SegmentedControl>
      </Spec>
    </div>
  ),
};

/** Controlled from outside: the pill travels when the value changes, whoever changed it. */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [view, setView] = React.useState('all');
    return (
      <div className="flex flex-col gap-3">
        <SegmentedControl aria-label="Filter submissions by status" value={view} onValueChange={setView}>
          <SegmentedControlItem value="all">All</SegmentedControlItem>
          <SegmentedControlItem value="submitted">Submitted</SegmentedControlItem>
          <SegmentedControlItem value="graded">Graded</SegmentedControlItem>
        </SegmentedControl>
        <span className="text-sm text-content-secondary">Showing: {view}</span>
      </div>
    );
  },
};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-4">
      {(['compact', 'comfortable', 'spacious'] as const).map((v) => (
        <SegmentedControl key={v} aria-label={`Density ${v}`} defaultValue={v}>
          <SegmentedControlItem value="compact">Compact</SegmentedControlItem>
          <SegmentedControlItem value="comfortable">Comfortable</SegmentedControlItem>
          <SegmentedControlItem value="spacious">Spacious</SegmentedControlItem>
          <SegmentedControlItem value="off" disabled>
            Off
          </SegmentedControlItem>
        </SegmentedControl>
      ))}
    </div>
  ),
};
