import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  MetadataDescription,
  MetadataItem,
  MetadataList,
  MetadataTerm,
  type MetadataListEntry,
  type MetadataListLayout,
} from './MetadataList';
import { Avatar, AvatarFallback } from '../Avatar';
import { Badge } from '../Badge';
import { Skeleton } from '../Skeleton';
import { Text } from '../Text';
import { Timestamp } from '../Timestamp';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const LAYOUTS: MetadataListLayout[] = ['inline', 'stacked'];

const RECORD: MetadataListEntry[] = [
  { term: 'Application ID', value: 'SST-2029-0416' },
  {
    term: 'Programme',
    value:
      'B.Sc. (Research) in Computer Science & Artificial Intelligence — 4-year residential undergraduate programme, Scaler School of Technology, awarded with BITS Pilani WILP credits',
  },
  { term: 'Cohort', value: 'Batch of 2029 · Cohort 7' },
  { term: 'Campus', value: 'Bengaluru — Electronic City Phase 1 (residential, hostel allotted)' },
  { term: 'Interview panel', value: '' },
];

const meta = {
  title: 'Molecules/MetadataList',
  component: MetadataList,
  subcomponents: { MetadataItem, MetadataTerm, MetadataDescription } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Key–value facts about one object, in a fixed order, read far more often than edited. A real `<dl>`.',
          'Not for editable fields. `inline` (the HTML’s `.meta`) holds terms at a 140px minimum so every value',
          'starts at the same x, and values wrap rather than truncate. `stacked` puts the term above the value',
          'for a narrow column. An unknown value is written out, never a blank cell (`emptyValue`).',
        ].join('\n'),
      },
    },
  },
  args: {
    layout: 'inline',
    items: RECORD,
    emptyValue: 'Not assigned yet',
  },
  argTypes: {
    layout: { control: 'select', options: LAYOUTS },
    items: { control: 'object' },
    emptyValue: { control: 'text' },
    className: { control: 'text' },
  },
  render: (args) => (
    <div style={{ maxWidth: 720 }}>
      <MetadataList {...args} />
    </div>
  ),
} satisfies Meta<typeof MetadataList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The HTML's `#metadata-list` student record. */
export const StudentRecord: Story = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <MetadataList aria-label="Student record">
        <MetadataItem term="Application ID">
          <span className="tabular-nums">SST-2029-0416</span>
        </MetadataItem>
        <MetadataItem
          term="Programme"
          value="B.Sc. (Research) in Computer Science & Artificial Intelligence — 4-year residential undergraduate programme, Scaler School of Technology, awarded with BITS Pilani WILP credits"
        />
        <MetadataItem term="Cohort" value="Batch of 2029 · Cohort 7" />
        <MetadataItem term="Campus" value="Bengaluru — Electronic City Phase 1 (residential, hostel allotted)" />
        <MetadataItem term="Submitted">
          <Timestamp date="2026-03-04T23:42:00+05:30" />
        </MetadataItem>
        <MetadataItem term="Status">
          <Badge tone="warning">In review</Badge>
        </MetadataItem>
        <MetadataItem>
          <MetadataTerm>Assigned reviewer</MetadataTerm>
          <MetadataDescription>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Avatar size="sm" aria-hidden="true">
                <AvatarFallback>MS</AvatarFallback>
              </Avatar>
              <span>
                Meera Subramaniam{' '}
                <Text as="span" size="sm" tone="secondary">
                  · Admissions Ops
                </Text>
              </span>
            </span>
          </MetadataDescription>
        </MetadataItem>
      </MetadataList>
    </div>
  ),
};

/** Not-yet-set values, never a blank cell. */
export const EmptyAndPending: Story = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <MetadataList>
        <MetadataItem term="Interview panel" value="Not assigned yet" valueTone="muted" />
        <MetadataItem term="Scholarship" value="Assessment pending" valueTone="muted" />
        <MetadataItem term="Offer letter" value="—" valueTone="muted" />
        <MetadataItem term="Loading">
          <Skeleton style={{ width: 160 }} />
          <span className="sr-only">Loading</span>
        </MetadataItem>
      </MetadataList>
    </div>
  ),
};

/** Both layouts side by side, for the brand × theme review. */
export const Layouts: Story = {
  render: () => (
    <Stack>
      {LAYOUTS.map((layout) => (
        <Spec key={layout} label={layout} wide>
          <div style={{ maxWidth: layout === 'stacked' ? 320 : 720 }}>
            <MetadataList layout={layout} items={RECORD} emptyValue="Not assigned yet" />
          </div>
        </Spec>
      ))}
    </Stack>
  ),
};
