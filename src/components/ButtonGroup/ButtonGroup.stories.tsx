import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextAlignCenter, TextAlignLeft, TextAlignRight } from '@phosphor-icons/react';

import { Button, type ButtonSize } from '../Button';
import { IconButton } from '../IconButton';
import { ToggleButton } from '../ToggleButton';
import { ButtonGroup } from './ButtonGroup';

const meta = {
  title: 'Molecules/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Two to five related actions welded into one control, sharing a single border seam. Use it',
          'when the actions operate on the same object. Never mix a destructive action with safe ones.',
          '',
          'Members are ordinary `Button` / `IconButton` / `ToggleButton` atoms (a pressed member is a',
          '`ToggleButton`). Always `role="group"`; give it an `aria-label` so it is announced',
          '("Grade view, group") before its members. Members do not lift on hover inside the group.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    'aria-label': {
      control: 'text',
      description: 'What the group is for, announced before its members.',
    },
    role: {
      control: 'select',
      options: ['group', 'toolbar'],
      table: { defaultValue: { summary: 'group' } },
      description: '`toolbar` only if you also give it toolbar arrow-key behaviour.',
    },
    className: { control: 'text' },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

type PlaygroundArgs = React.ComponentProps<typeof ButtonGroup> & {
  count?: number;
  size?: Extract<ButtonSize, 'sm' | 'md' | 'lg'>;
  disabledIndex?: number;
};

const LABELS = ['Roster', 'Attendance', 'Mentors', 'Hostel', 'Fees'];

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start' }}>{children}</div>
);
const Spec = ({ tag, children }: { tag: string; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 12, alignContent: 'start', justifyItems: 'start' }}>
    <span style={{ font: '600 12px/1 var(--font-family-sans)', color: 'var(--content-secondary)' }}>{tag}</span>
    {children}
  </div>
);

/** The group's own props, plus story-only knobs for the members (count, size, a disabled member). */
export const Playground: StoryObj<PlaygroundArgs> = {
  args: { 'aria-label': 'Cohort roster actions', role: 'group', count: 3, size: 'md', disabledIndex: -1 },
  argTypes: {
    count: { control: { type: 'range', min: 2, max: 5 }, description: 'Story only: number of members.' },
    size: { control: 'select', options: ['sm', 'md', 'lg'], description: 'Story only: the members’ Button size.' },
    disabledIndex: {
      control: { type: 'range', min: -1, max: 4 },
      description: 'Story only: which member is disabled (-1 for none).',
    },
  },
  render: ({ count = 3, size = 'md', disabledIndex = -1, ...args }) => (
    <ButtonGroup {...args}>
      {LABELS.slice(0, count).map((l, i) => (
        <Button key={l} variant="secondary" size={size} disabled={i === disabledIndex}>
          {l}
        </Button>
      ))}
    </ButtonGroup>
  ),
};

export const SizesOfGroup: Story & { render: () => React.ReactElement } = {
  parameters: { controls: { disable: true } },
  name: 'Sizes of group',
  render: () => (
    <Row>
      <Spec tag="2 buttons">
        <ButtonGroup aria-label="Submission actions">
          <Button variant="secondary">Preview</Button>
          <Button variant="secondary">Download</Button>
        </ButtonGroup>
      </Spec>
      <Spec tag="3 buttons">
        <ButtonGroup aria-label="Grade sheet actions">
          <Button variant="secondary">Export CSV</Button>
          <Button variant="secondary">Publish</Button>
          <Button variant="secondary">Archive</Button>
        </ButtonGroup>
      </Spec>
      <Spec tag="5 buttons">
        <ButtonGroup aria-label="Cohort roster actions">
          {LABELS.map((l) => (
            <Button key={l} variant="secondary">
              {l}
            </Button>
          ))}
        </ButtonGroup>
      </Spec>
    </Row>
  ),
};

/** One member pressed (a ToggleButton set), a disabled member, a loading member. */
export const States: Story & { render: () => React.ReactElement } = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [view, setView] = React.useState('letter');
    return (
      <Row>
        <Spec tag='one member pressed · aria-pressed="true"'>
          <ButtonGroup aria-label="Grade view">
            {[
              ['percent', 'Percent'],
              ['letter', 'Letter grade'],
              ['percentile', 'Percentile'],
            ].map(([v, l]) => (
              <ToggleButton key={v} pressed={view === v} onPressedChange={() => setView(v!)}>
                {l}
              </ToggleButton>
            ))}
          </ButtonGroup>
        </Spec>
        <Spec tag="disabled member">
          <ButtonGroup aria-label="Transcript actions">
            <Button variant="secondary">Preview</Button>
            <Button variant="secondary" disabled>
              Publish
            </Button>
            <Button variant="secondary">Export CSV</Button>
          </ButtonGroup>
        </Spec>
        <Spec tag="loading member">
          <ButtonGroup aria-label="Attendance actions">
            <Button variant="secondary">Mark all</Button>
            <Button variant="secondary" loading>
              Syncing
            </Button>
          </ButtonGroup>
        </Spec>
      </Row>
    );
  },
};

export const IconOnlyMembers: Story & { render: () => React.ReactElement } = {
  parameters: { controls: { disable: true } },
  name: 'Icon-only members',
  render: () => {
    const [align, setAlign] = React.useState('left');
    const items = [
      ['left', 'Align left', <TextAlignLeft key="l" className="size-icon-sm" />],
      ['center', 'Align centre', <TextAlignCenter key="c" className="size-icon-sm" />],
      ['right', 'Align right', <TextAlignRight key="r" className="size-icon-sm" />],
    ] as const;
    return (
      <Row>
        <Spec tag="toggle set (one pressed)">
          <ButtonGroup aria-label="Text alignment">
            {items.map(([v, l, icon]) => (
              <ToggleButton key={v} size="icon-md" aria-label={l} pressed={align === v} onPressedChange={() => setAlign(v)}>
                {icon}
              </ToggleButton>
            ))}
          </ButtonGroup>
        </Spec>
        <Spec tag="plain icon buttons">
          <ButtonGroup aria-label="Text alignment, actions">
            {items.map(([v, l, icon]) => (
              <IconButton key={v} variant="secondary" aria-label={l}>
                {icon}
              </IconButton>
            ))}
          </ButtonGroup>
        </Spec>
      </Row>
    );
  },
};

/** The whole preview section on one page, for four-way brand × theme review. */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 40 }}>
      <SizesDemo />
      <StatesDemo />
      <IconsDemo />
    </div>
  ),
};

function SizesDemo() {
  return SizesOfGroup.render();
}
function StatesDemo() {
  return States.render();
}
function IconsDemo() {
  return IconOnlyMembers.render();
}
