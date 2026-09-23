import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Buildings } from '@phosphor-icons/react';

import { Avatar, AvatarFallback } from '../Avatar';
import { Badge } from '../Badge';
import { Chip, type ChipProps } from './Chip';

const meta = {
  title: 'Molecules/Chip',
  component: Chip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A compact control the user **operates**: a filter, an applied value, a choice. Chip vs Badge:',
          'a Chip is interactive, a Badge is a read-only label the system sets.',
          '',
          '**Selectable** (default): the whole chip is a `<button aria-pressed>`. **Removable** (`onRemove`):',
          'a static `<span>` whose only control is the ✕, named after the value it removes. Never both.',
          '',
          'Rows of chips with a shared keyboard model (multi-select filters, one-of-N) are',
          '`ToggleButtonGroup variant="chips"`.',
        ].join('\n'),
      },
    },
  },
  args: {
    children: 'Scholarship applicants',
    selected: false,
    disabled: false,
    withIcon: false,
    removable: false,
    removeLabel: '',
  } as ChipProps & { withIcon: boolean; removable: boolean },
  argTypes: {
    children: { control: 'text', description: 'The label.' },
    selected: { control: 'boolean' },
    defaultSelected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    removeLabel: { control: 'text' },
    icon: { control: false },
    selectedIcon: { control: false },
    avatar: { control: false },
    onSelectedChange: { control: false },
    onRemove: { control: false },
    // Story-only switches.
    withIcon: { control: 'boolean', description: 'Story only: a leading campus glyph (regular → fill).' },
    removable: { control: 'boolean', description: 'Story only: pass `onRemove`.' },
  } as Meta<typeof Chip>['argTypes'],
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;
type PlaygroundArgs = ChipProps & { withIcon: boolean; removable: boolean };

const Spec = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-semibold text-content-secondary">{label}</span>
    {children}
  </div>
);

/** Two-way: clicking the chip updates the `selected` control, and the control drives the chip. */
export const Playground: Story = {
  render: function PlaygroundStory(args) {
    const { withIcon, removable, removeLabel, ...rest } = args as PlaygroundArgs;
    const [, updateArgs] = useArgs<PlaygroundArgs>();
    return (
      <Chip
        {...rest}
        removeLabel={removeLabel || undefined}
        icon={withIcon ? <Buildings /> : undefined}
        selectedIcon={withIcon ? <Buildings weight="fill" /> : undefined}
        onSelectedChange={(selected) => updateArgs({ selected })}
        onRemove={removable ? () => updateArgs({ children: '(removed — reset the control)' }) : undefined}
      />
    );
  },
};

export const Filters: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Chip>Bengaluru</Chip>
      <Chip defaultSelected>Hyderabad</Chip>
      <Chip>Remote cohort</Chip>
      <Chip defaultSelected>Scholarship applicants</Chip>
    </div>
  ),
};

export const LeadingIconAndAvatar: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="rest · regular cut">
        <Chip icon={<Buildings />} selectedIcon={<Buildings weight="fill" />}>
          Bengaluru
        </Chip>
      </Spec>
      <Spec label="selected · fill cut">
        <Chip icon={<Buildings />} selectedIcon={<Buildings weight="fill" />} defaultSelected>
          Bengaluru
        </Chip>
      </Spec>
      <Spec label="avatar">
        <Chip
          avatar={
            <Avatar size="sm">
              <AvatarFallback>IR</AvatarFallback>
            </Avatar>
          }
        >
          Ishita Raghunathan
        </Chip>
      </Spec>
    </div>
  ),
};

export const Removable: Story = {
  render: function RemovableStory() {
    const [values, setValues] = React.useState([
      'Cohort 7 · Bengaluru',
      'Data Structures & Algorithms — Week 6',
      'Bengaluru — Electronic City Phase II residential campus, Block C',
    ]);
    return (
      <div className="flex flex-col gap-6">
        <div className="flex max-w-[480px] flex-wrap gap-2">
          {values.map((v) => (
            <Chip
              key={v}
              removeLabel={`Remove filter: ${v}`}
              onRemove={() => setValues((all) => all.filter((x) => x !== v))}
              className={v.length > 40 ? 'max-w-[320px]' : undefined}
            >
              {v}
            </Chip>
          ))}
          {values.length === 0 ? <span className="text-sm text-content-secondary">All filters removed.</span> : null}
        </div>
        <div className="flex flex-wrap gap-6">
          <Spec label="removable · selected">
            <Chip onRemove={() => {}} removeLabel="Remove filter: Scholarship applicants" selected>
              Scholarship applicants
            </Chip>
          </Spec>
          <Spec label="removable · disabled">
            <Chip onRemove={() => {}} disabled>
              Hostel allotment
            </Chip>
          </Spec>
        </div>
      </div>
    );
  },
};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="rest">
        <Chip>Assignment</Chip>
      </Spec>
      <Spec label="selected">
        <Chip defaultSelected>Assignment</Chip>
      </Spec>
      <Spec label="disabled">
        <Chip disabled>Live class · none this week</Chip>
      </Spec>
      <Spec label="disabled · selected">
        <Chip disabled defaultSelected>
          Quiz
        </Chip>
      </Spec>
    </div>
  ),
};

export const ChipVsBadge: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="chip · user-operated control">
        <Chip defaultSelected>Scholarship applicants</Chip>
      </Spec>
      <Spec label="badge · system-set label">
        <Badge tone="warning">In review</Badge>
      </Spec>
    </div>
  ),
};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-4">
      {[false, true].map((sel) => (
        <div key={String(sel)} className="flex flex-wrap items-center gap-3">
          <Chip defaultSelected={sel}>Hyderabad</Chip>
          <Chip defaultSelected={sel} icon={<Buildings />} selectedIcon={<Buildings weight="fill" />}>
            Bengaluru
          </Chip>
          <Chip defaultSelected={sel} disabled>
            Live class
          </Chip>
          <Chip onRemove={() => {}} selected={sel}>
            Cohort 7
          </Chip>
          <Chip
            defaultSelected={sel}
            avatar={
              <Avatar size="sm">
                <AvatarFallback>AK</AvatarFallback>
              </Avatar>
            }
          >
            Aarav Krishnan
          </Chip>
        </div>
      ))}
    </div>
  ),
};
