import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Stack } from './Stack';
import { Avatar, AvatarFallback } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Heading } from '../Heading';
import { Text } from '../Text';
import { Spec } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Layout/Stack',
  component: Stack,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The one-dimensional spacing primitive: the parent owns the gap between its children, which is',
          'why no child in this system carries a margin. A page is a Stack of Sections, a Section is a',
          'Stack of groups, a group is a Stack of lines. **If you are typing a margin, you wanted a Stack.**',
          '',
          'Five gaps: `2` 8px · `4` 16px (default) · `6` 24px · `8` 32px · `12` 48px. A column stretches',
          'its children; a row centres them. `as` picks a semantic element, `asChild` merges onto a child.',
        ].join('\n'),
      },
    },
  },
  args: { direction: 'vertical', gap: '4', justify: 'start', wrap: false },
  argTypes: {
    direction: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    gap: { control: 'inline-radio', options: ['2', '4', '6', '8', '12'] },
    align: { control: 'inline-radio', options: [undefined, 'start', 'center', 'end', 'stretch', 'baseline'] },
    justify: { control: 'inline-radio', options: ['start', 'center', 'end', 'between'] },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

const weeks = ['Week 5 · Graphs', 'Week 6 · Shortest paths', 'Week 7 · Dynamic programming'];
const Pills = ({ items = weeks }: { items?: string[] }) => (
  <>
    {items.map((w) => (
      <Badge key={w}>{w}</Badge>
    ))}
  </>
);

export const Playground: Story = {
  render: (args) => (
    <Stack {...args}>
      <Pills />
    </Stack>
  ),
};

/** The vertical ladder. Each level of a page picks one rung and the spacing below it is decided. */
export const VerticalGaps: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack direction="horizontal" wrap gap="8" align="start">
      {(['2', '4', '6', '8', '12'] as const).map((gap) => (
        <Spec key={gap} label={`gap="${gap}"${gap === '4' ? ' · default' : ''}`}>
          <Stack gap={gap} align="start">
            <Pills />
          </Stack>
        </Spec>
      ))}
    </Stack>
  ),
};

/** Rows centre their children on the cross axis: a toolbar, a person row, a pair of actions. */
export const Horizontal: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap="8">
      <Spec label='direction="horizontal" gap="2" · toolbar-tight' wide>
        <Stack direction="horizontal" gap="2" wrap>
          <Chip defaultSelected>DSA</Chip>
          <Chip>System Design</Chip>
          <Chip>Operating Systems</Chip>
          <Chip>Capstone</Chip>
        </Stack>
      </Spec>
      <Spec label='direction="horizontal" · 16px · the common case' wide>
        <Stack direction="horizontal">
          <Avatar>
            <AvatarFallback>AK</AvatarFallback>
          </Avatar>
          <Stack gap="2" className="flex-1">
            <Text>Aarav Krishnan</Text>
            <Text size="sm" tone="secondary">
              aarav.k@sst.scaler.com · Batch of 2029
            </Text>
          </Stack>
          <Button variant="secondary" size="sm">
            View profile
          </Button>
        </Stack>
      </Spec>
      <Spec label='direction="horizontal" gap="6" · separated actions' wide>
        <Stack direction="horizontal" gap="6" wrap>
          <Button>Publish module</Button>
          <Button variant="tertiary">Save as draft</Button>
        </Stack>
      </Spec>
    </Stack>
  ),
};

/** Vertical rhythm is composed, not authored: the outer Stack separates groups, the inner one lines. */
export const Nesting: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Spec label='gap="8" > gap="2"' wide>
      <Stack gap="8">
        <Stack gap="2">
          <Heading as="p" size="eyebrow">
            Cohort 7 · Bengaluru
          </Heading>
          <Heading as="h3" size="3">
            Data Structures &amp; Algorithms
          </Heading>
          <Text size="sm" tone="secondary">
            14 modules · 62 graded problems · mentor Ritika Bansal
          </Text>
        </Stack>
        <Stack gap="2">
          <Heading as="p" size="eyebrow">
            Cohort 7 · Bengaluru
          </Heading>
          <Heading as="h3" size="3">
            Advanced Data Structures &amp; Algorithms — Segment Trees with Lazy Propagation, Week 11 makeup
            track
          </Heading>
          <Text size="sm" tone="secondary">
            6 modules · 24 graded problems · mentor Devansh Rao
          </Text>
        </Stack>
      </Stack>
    </Spec>
  ),
};

const filters = [
  'Batch of 2029',
  'Cohort 7 · Bengaluru',
  'Merit scholarship applicants',
  'Interview scheduled',
  'Needs-based financial aid requested',
  'Documents pending with the registrar',
  'NSET score above 85',
];

/** `wrap` for a row whose length you do not control: a real applicant filter needs a second line. */
export const Wrap: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Spec label='direction="horizontal" gap="2" wrap' wide>
      <Stack direction="horizontal" gap="2" wrap>
        {filters.map((f, i) => (
          <Chip key={f} defaultSelected={i < 2}>
            {f}
          </Chip>
        ))}
      </Stack>
    </Spec>
  ),
};

/** `align="start"` puts the avatar with the FIRST line; `align="end"` sits a value and its unit on one edge. */
export const CrossAxisAlignment: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const person = (
      <>
        <Avatar>
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
        <Stack gap="2">
          <Text>Aarav Krishnan</Text>
          <Text size="sm" tone="secondary">
            Resubmitted 6 Mar 2026, 01:15 AM after the academic-integrity review cleared the original
            submission with no finding against it
          </Text>
        </Stack>
      </>
    );
    return (
      <Stack gap="8">
        <Spec label='align="start"' wide>
          <Stack direction="horizontal" align="start">
            {person}
          </Stack>
        </Spec>
        <Spec label="default (centred), for comparison" wide>
          <Stack direction="horizontal">{person}</Stack>
        </Spec>
        <Spec label='align="end" gap="2"' wide>
          <Stack direction="horizontal" gap="2" align="end" wrap>
            <Heading as="p" size="1" className="tabular-nums">
              ₹19,50,000
            </Heading>
            <Text size="sm" tone="secondary">
              median CTC, Batch of 2028
            </Text>
          </Stack>
        </Spec>
      </Stack>
    );
  },
};

/** `justify="between"`: label left, action right, with no spacer element. */
export const Between: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Spec label='direction="horizontal" justify="between"' wide>
      <Stack direction="horizontal" justify="between" wrap>
        <Stack gap="2">
          <Heading as="p" size="eyebrow">
            Week 6 · Data Structures &amp; Algorithms
          </Heading>
          <Text size="sm" tone="secondary">
            84 of 92 submissions graded
          </Text>
        </Stack>
        <Button variant="secondary" size="sm">
          Publish grades
        </Button>
      </Stack>
    </Spec>
  ),
};

/** `as="ul"` for a list that is spaced like a Stack. Each child is a real `<li>`. */
export const AsList: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Spec label='as="ol" gap="2"' wide>
      <Stack as="ol" gap="2" aria-label="Admission steps">
        {['Submit the application form', 'Sit the NSET', 'Personal interview', 'Offer and fee payment'].map(
          (s, i) => (
            <Text as="li" key={s}>
              {i + 1}. {s}
            </Text>
          ),
        )}
      </Stack>
    </Spec>
  ),
};
