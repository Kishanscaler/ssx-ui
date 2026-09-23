import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextAlignCenter, TextAlignLeft, TextAlignRight } from '@phosphor-icons/react';

import {
  ToggleButtonGroup,
  ToggleButtonGroupItem,
  type ToggleButtonGroupSize,
  type ToggleButtonGroupVariant,
} from './ToggleButtonGroup';

type PlaygroundArgs = {
  type: 'single' | 'multiple';
  variant: ToggleButtonGroupVariant;
  size: ToggleButtonGroupSize;
  disabled: boolean;
  loop: boolean;
  'aria-label': string;
  value: string[];
};

const meta = {
  title: 'Molecules/ToggleButtonGroup',
  component: ToggleButtonGroup,
  subcomponents: { ToggleButtonGroupItem },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Toggles that belong together. `type="multiple"` (default): each member independently on or off —',
          'filters that narrow a list. `type="single"`: one pressed at a time; pressing it again releases it.',
          'Where exactly one must always win, use SegmentedControl.',
          '',
          'One Tab stop, arrow keys between members, Space / Enter toggles. `welded` is ButtonGroup\'s weld',
          'around ToggleButton\'s look; `chips` is a wrapping row of Chips. Neither is a new style.',
        ].join('\n'),
      },
    },
  },
  args: {
    type: 'multiple',
    variant: 'welded',
    size: 'sm',
    disabled: false,
    loop: true,
    'aria-label': 'Filter coursework by type',
    value: ['assignment', 'quiz'],
  } as PlaygroundArgs as unknown as Meta<typeof ToggleButtonGroup>['args'],
  argTypes: {
    type: { control: 'inline-radio', options: ['single', 'multiple'] },
    variant: { control: 'inline-radio', options: ['welded', 'chips'] satisfies ToggleButtonGroupVariant[] },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon-sm', 'icon-md', 'icon-lg'] satisfies ToggleButtonGroupSize[],
    },
    disabled: { control: 'boolean' },
    loop: { control: 'boolean' },
    'aria-label': { control: 'text' },
    value: {
      control: 'check',
      options: ['assignment', 'quiz', 'project', 'live'],
      description: 'Pressed values. `string[]` for multiple; for single the first one is used (`string`).',
    },
    defaultValue: { control: false },
    onValueChange: { control: false },
  } as Meta<typeof ToggleButtonGroup>['argTypes'],
} satisfies Meta<typeof ToggleButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const Spec = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-semibold text-content-secondary">{label}</span>
    {children}
  </div>
);

const coursework = (
  <>
    <ToggleButtonGroupItem value="assignment">Assignment</ToggleButtonGroupItem>
    <ToggleButtonGroupItem value="quiz">Quiz</ToggleButtonGroupItem>
    <ToggleButtonGroupItem value="project">Project</ToggleButtonGroupItem>
    <ToggleButtonGroupItem value="live">Live class</ToggleButtonGroupItem>
  </>
);

/** Two-way: pressing members updates the `value` control, and the control drives the group. */
export const Playground: Story = {
  render: function PlaygroundStory(args) {
    const { type, value, ...rest } = args as unknown as PlaygroundArgs;
    const [, updateArgs] = useArgs<PlaygroundArgs>();
    return type === 'single' ? (
      <ToggleButtonGroup
        {...rest}
        type="single"
        value={value[0] ?? ''}
        onValueChange={(v) => updateArgs({ value: v ? [v] : [] })}
      >
        {coursework}
      </ToggleButtonGroup>
    ) : (
      <ToggleButtonGroup {...rest} type="multiple" value={value} onValueChange={(v) => updateArgs({ value: v })}>
        {coursework}
      </ToggleButtonGroup>
    );
  },
};

export const MultiSelect: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Spec label="chips · 2 of 4 on (click to toggle)">
        <ToggleButtonGroup variant="chips" aria-label="Filter coursework by type" defaultValue={['assignment', 'quiz']}>
          {coursework}
        </ToggleButtonGroup>
      </Spec>
      <Spec label="welded group · same behaviour, denser surface">
        <ToggleButtonGroup size="sm" aria-label="Filter coursework by type" defaultValue={['assignment', 'quiz']}>
          {coursework}
        </ToggleButtonGroup>
      </Spec>
    </div>
  ),
};

export const OnePressedAtATime: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="type=single · welded">
        <ToggleButtonGroup type="single" aria-label="Grade view" defaultValue="letter">
          <ToggleButtonGroupItem value="percent">Percent</ToggleButtonGroupItem>
          <ToggleButtonGroupItem value="letter">Letter grade</ToggleButtonGroupItem>
          <ToggleButtonGroupItem value="percentile">Percentile</ToggleButtonGroupItem>
        </ToggleButtonGroup>
      </Spec>
      <Spec label="type=single · icon-only">
        <ToggleButtonGroup type="single" size="icon-md" aria-label="Text alignment" defaultValue="left">
          <ToggleButtonGroupItem value="left" aria-label="Align left">
            <TextAlignLeft />
          </ToggleButtonGroupItem>
          <ToggleButtonGroupItem value="center" aria-label="Align centre">
            <TextAlignCenter />
          </ToggleButtonGroupItem>
          <ToggleButtonGroupItem value="right" aria-label="Align right">
            <TextAlignRight />
          </ToggleButtonGroupItem>
        </ToggleButtonGroup>
      </Spec>
      <Spec label="type=single · chips">
        <ToggleButtonGroup type="single" variant="chips" aria-label="Application stage" defaultValue="all">
          <ToggleButtonGroupItem value="all">All applications</ToggleButtonGroupItem>
          <ToggleButtonGroupItem value="review">In review</ToggleButtonGroupItem>
          <ToggleButtonGroupItem value="interview">Interview scheduled</ToggleButtonGroupItem>
          <ToggleButtonGroupItem value="offer">Offer sent</ToggleButtonGroupItem>
        </ToggleButtonGroup>
      </Spec>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(['chips', 'welded'] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-start gap-x-10 gap-y-6">
          <Spec label={`${variant} · all off`}>
            <ToggleButtonGroup variant={variant} size="sm" aria-label="Filter coursework, nothing selected">
              <ToggleButtonGroupItem value="assignment">Assignment</ToggleButtonGroupItem>
              <ToggleButtonGroupItem value="quiz">Quiz</ToggleButtonGroupItem>
              <ToggleButtonGroupItem value="project">Project</ToggleButtonGroupItem>
            </ToggleButtonGroup>
          </Spec>
          <Spec label={`${variant} · all on`}>
            <ToggleButtonGroup
              variant={variant}
              size="sm"
              aria-label="Filter coursework, everything selected"
              defaultValue={['assignment', 'quiz', 'project']}
            >
              <ToggleButtonGroupItem value="assignment">Assignment</ToggleButtonGroupItem>
              <ToggleButtonGroupItem value="quiz">Quiz</ToggleButtonGroupItem>
              <ToggleButtonGroupItem value="project">Project</ToggleButtonGroupItem>
            </ToggleButtonGroup>
          </Spec>
          <Spec label={`${variant} · one disabled`}>
            <ToggleButtonGroup
              variant={variant}
              size="sm"
              aria-label="Filter coursework, one option unavailable"
              defaultValue={['assignment']}
            >
              <ToggleButtonGroupItem value="assignment">Assignment</ToggleButtonGroupItem>
              <ToggleButtonGroupItem value="quiz">Quiz</ToggleButtonGroupItem>
              <ToggleButtonGroupItem value="live" disabled>
                Live class · none this week
              </ToggleButtonGroupItem>
            </ToggleButtonGroup>
          </Spec>
        </div>
      ))}
    </div>
  ),
};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <ToggleButtonGroup key={size} size={size} aria-label={`Filters ${size}`} defaultValue={['quiz']}>
          {coursework}
        </ToggleButtonGroup>
      ))}
      <ToggleButtonGroup variant="chips" aria-label="Filters chips" defaultValue={['quiz']}>
        {coursework}
      </ToggleButtonGroup>
    </div>
  ),
};
