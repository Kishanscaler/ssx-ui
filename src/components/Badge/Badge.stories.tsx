import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge, type BadgeTone } from './Badge';
import { Button } from '../Button';
import { Check, ClockCountdown, GraduationCap, Warning } from '../Icon/_fixtures/phosphor';
import { Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

const TONES: Array<[BadgeTone, string]> = [
  ['default', 'Draft'],
  ['brand', 'Batch of 2029'],
  ['accent', 'GSoC 2026'],
  ['highlight', 'New'],
  ['yellowSubtle', 'Early bird'],
  ['success', 'Placed'],
  ['warning', 'Fee overdue'],
  ['danger', 'Withdrawn'],
  ['info', 'Interview scheduled'],
  ['solid', 'Shortlisted'],
];

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Passive metadata: a badge **reports** a fact and is never clickable (Chip is the interactive',
          'one). `highlight` is the one badge allowed to shout, once per screen. Colour is not the',
          'message: the word carries it. Icons are children, 16px, bold weight.',
        ].join('\n'),
      },
    },
  },
  args: { children: 'Batch of 2029', tone: 'brand', size: 'md' },
  argTypes: {
    tone: { control: 'select', options: TONES.map(([t]) => t) },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    dot: { control: 'boolean' },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => (
    <Row>
      {TONES.map(([tone, label]) => (
        <Spec key={tone} label={tone}>
          <Badge tone={tone}>{label}</Badge>
        </Spec>
      ))}
    </Row>
  ),
};

export const WithDot: Story = {
  render: () => (
    <Row>
      {TONES.filter(([t]) => t !== 'yellowSubtle').map(([tone, label]) => (
        <Spec key={tone} label={`${tone} + dot`}>
          <Badge tone={tone} dot>
            {label}
          </Badge>
        </Spec>
      ))}
    </Row>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Row>
      <Spec label="success + check · bold, because 16px">
        <Badge tone="success">
          <Check weight="bold" />
          Submitted
        </Badge>
      </Spec>
      <Spec label="warning + warning">
        <Badge tone="warning">
          <Warning weight="bold" />
          Attendance below 75%
        </Badge>
      </Spec>
      <Spec label="info + deadline">
        <Badge tone="info">
          <ClockCountdown weight="bold" />
          Due in 6 hours
        </Badge>
      </Spec>
      <Spec label="brand + programme">
        <Badge tone="brand">
          <GraduationCap weight="bold" />
          SST
        </Badge>
      </Spec>
    </Row>
  ),
};

/** sm 18 / md 22 / lg 26. */
export const Sizes: Story = {
  render: () => (
    <Stack>
      <Row>
        <Spec label="sm">
          <Badge size="sm">Draft</Badge>
        </Spec>
        <Spec label="md (default)">
          <Badge>Draft</Badge>
        </Spec>
        <Spec label="lg">
          <Badge size="lg">Draft</Badge>
        </Spec>
        <Spec label="sm · brand">
          <Badge size="sm" tone="brand">
            Batch of 2029
          </Badge>
        </Spec>
        <Spec label="lg · success, with a dot">
          <Badge size="lg" tone="success" dot>
            Placed
          </Badge>
        </Spec>
        <Spec label="lg · a card-header badge">
          <Badge size="lg" tone="accent">
            GSoC 2026
          </Badge>
        </Spec>
      </Row>
      <Spec label="sm inside a sm toolbar — the size it exists for" wide>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm">
            Batch of 2029 <Badge size="sm" tone="brand">12,480</Badge>
          </Button>
          <Button variant="tertiary" size="sm">
            Shortlisted <Badge size="sm" tone="success">318</Badge>
          </Button>
          <Button variant="tertiary" size="sm">
            Interview scheduled <Badge size="sm" tone="info">64</Badge>
          </Button>
          <Button variant="tertiary" size="sm">
            Withdrawn <Badge size="sm" tone="danger">7</Badge>
          </Button>
        </div>
      </Spec>
    </Stack>
  ),
};

/** Storyblok gives strings. */
export const FromCmsStrings: Story = {
  args: { tone: 'yellowSubtle' as const, size: 'lg' as const, children: 'Early bird' },
};
