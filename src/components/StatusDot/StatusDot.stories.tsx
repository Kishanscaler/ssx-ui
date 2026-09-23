import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatusDot, type StatusDotTone } from './StatusDot';
import { Badge } from '../Badge';
import { Heading } from '../Heading';
import { Text } from '../Text';
import { Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Atoms/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'An 8px presence marker that **always travels with a visible label** — it is `aria-hidden`,',
          'so the words carry the meaning. A dot with no text is a Badge. `brand` is selection, not',
          'health. `pulse` is for genuinely live state and stops under reduced motion.',
        ].join('\n'),
      },
    },
  },
  args: { tone: 'success', size: 'md', pulse: false },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'success', 'warning', 'danger', 'info', 'brand'] },
    size: { control: 'inline-radio', options: ['md', 'lg'] },
  },
  render: (args) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <StatusDot {...args} />
      <Text as="span">Submission open</Text>
    </span>
  ),
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

const Labelled = ({ children, ...dot }: React.ComponentProps<typeof StatusDot> & { children: React.ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
    <StatusDot {...dot} />
    {children}
  </span>
);

export const Playground: Story = {};

const TONES: Array<[StatusDotTone, string]> = [
  ['neutral', 'Application withdrawn'],
  ['success', 'Submission open'],
  ['warning', 'Closes in 2 hours'],
  ['danger', 'Live now'],
  ['info', 'Interview scheduled'],
  ['brand', 'Cohort 7 · Bengaluru (active)'],
];

export const Tones: Story = {
  render: () => (
    <Row>
      {TONES.map(([tone, label]) => (
        <Spec key={tone} label={tone}>
          <Labelled tone={tone}>
            <Text as="span">{label}</Text>
          </Labelled>
        </Spec>
      ))}
    </Row>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Row>
      <Spec label="md 8px — beside body text">
        <Labelled tone="success">
          <Text as="span" size="sm">
            Submission open
          </Text>
        </Labelled>
      </Spec>
      <Spec label="lg 10px — beside a heading">
        <Labelled tone="success" size="lg">
          <Heading as="h3" size="3">
            Submission open
          </Heading>
        </Labelled>
      </Spec>
      <Spec label="brand · lg">
        <Labelled tone="brand" size="lg">
          <Heading as="h3" size="3">
            Cohort 7 · Bengaluru
          </Heading>
        </Labelled>
      </Spec>
    </Row>
  ),
};

export const Pulse: Story = {
  render: () => (
    <Row>
      <Spec label="danger + pulse — a class in progress">
        <Labelled tone="danger" pulse>
          <Text as="span">Live now · System Design, Cohort 7</Text>
        </Labelled>
      </Spec>
      <Spec label="success + pulse">
        <Labelled tone="success" pulse>
          <Text as="span">Submission open</Text>
        </Labelled>
      </Spec>
      <Spec label="info + pulse">
        <Labelled tone="info" pulse>
          <Text as="span">Interview scheduled · panel joining</Text>
        </Labelled>
      </Spec>
      <Spec label="warning + pulse">
        <Labelled tone="warning" pulse>
          <Text as="span">Proctoring connection unstable</Text>
        </Labelled>
      </Spec>
    </Row>
  ),
};

/** A cohort switcher, where no status colour would be honest. */
export const BrandInSitu: Story = {
  render: () => (
    <Stack gap={12}>
      {(
        [
          ['brand', 'Cohort 7 · Bengaluru', 'brand', 'Current'],
          ['neutral', 'Cohort 6 · Bengaluru', 'default', 'Graduated'],
          ['neutral', 'Cohort 8 · Bengaluru (Batch of 2030)', 'default', 'Not started'],
        ] as const
      ).map(([dot, label, tone, status]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 480 }}>
          <StatusDot tone={dot} />
          <Text as="span" style={{ flex: 1 }}>
            {label}
          </Text>
          <Badge size="sm" tone={tone}>
            {status}
          </Badge>
        </div>
      ))}
    </Stack>
  ),
};
