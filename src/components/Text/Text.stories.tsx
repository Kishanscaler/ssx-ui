import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from './Text';
import { Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Atoms/Text',
  component: Text,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Body copy and its colour roles. The tone is a **job**, not a shade — pick it by what the text',
          'is for. A heading is a `Heading`, not a bold `Text`. Tabular figures: `className="tabular-nums"`.',
        ].join('\n'),
      },
    },
  },
  args: { children: 'Every SST student ships a production capstone before graduating.', tone: 'primary', size: 'base' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['primary', 'secondary', 'brand', 'disabled', 'link'] },
    size: { control: 'inline-radio', options: ['xs', 'sm', 'base', 'md', 'lg'] },
    as: { control: 'inline-radio', options: ['p', 'span', 'div', 'label', 'li'] },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => (
    <Stack gap={20}>
      <Spec label="primary — the thing itself">
        <Text tone="primary">Aarav Krishnan · SST-2029-0416</Text>
      </Spec>
      <Spec label="secondary — supporting detail you still expect people to read">
        <Text tone="secondary">Submitted 4 Mar 2026, 11:42 PM · Cohort 7 · Bengaluru</Text>
      </Spec>
      <Spec label="brand — a brand-weighted value inside running text">
        <Text tone="brand">Median CTC, Batch of 2028 — ₹19,50,000</Text>
      </Spec>
      <Spec label="disabled — present but not currently actionable">
        <Text tone="disabled">Capstone review unlocks after Week 20</Text>
      </Spec>
      <Spec label="link — link-coloured text that is NOT a link">
        <Text tone="link">₹19,50,000 median CTC</Text>
      </Spec>
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack gap={20}>
      {(
        [
          ['xs', 'xs 12px — legal, timestamps, counters'],
          ['sm', 'sm 13px — dense UI, table cells, help text'],
          ['base', 'base 16px (the body role) — default body, the whole product'],
          ['md', 'md 16px — long-form reading: handbook, policy'],
          ['lg', 'lg 18px — marketing lede, directly under a hero'],
        ] as const
      ).map(([size, label]) => (
        <Spec key={size} label={label}>
          <Text size={size}>Every SST student ships a production capstone before graduating.</Text>
        </Spec>
      ))}
      <Spec label="in situ — a lede at lg dropping into body at base" wide>
        <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
          <Text size="lg" tone="secondary">
            A four-year residential undergraduate degree in Computer Science and Artificial Intelligence, built
            with the engineers who run production systems at scale.
          </Text>
          <Text>
            Students join a Bengaluru cohort of roughly 120, live on campus, and ship real software from the first
            term. The Batch of 2029 opens for applications on 14 January 2026 and closes on 30 April 2026.
          </Text>
        </div>
      </Spec>
    </Stack>
  ),
};

const FEES = [
  ['Tuition fee — Year 1', '₹4,50,000'],
  ['Hostel & mess — annual', '₹1,20,000'],
  ['One-time admission fee', '₹25,000'],
  ['Median CTC — Batch of 2028', '₹19,50,000'],
  ['Highest CTC — Batch of 2028', '₹1,04,00,000'],
  ['Applications received', '12,480'],
];

/** Tabular figures are not a polish item: a column of numbers gets `tabular-nums`. */
export const TabularNumbers: Story = {
  render: () => (
    <Row align="start">
      {[true, false].map((tabular) => (
        <Spec key={String(tabular)} label={tabular ? 'with tabular-nums' : 'without — digits jitter'}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, width: '100%', maxWidth: 320, display: 'grid', gap: 8 }}>
            {FEES.map(([k, v]) => (
              <Text as="li" key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{k}</span>
                <span className={tabular ? 'tabular-nums' : undefined}>{v}</span>
              </Text>
            ))}
          </ul>
        </Spec>
      ))}
    </Row>
  ),
};

/** Storyblok gives strings: `tone` and `size` straight from the blok. */
export const FromCmsStrings: Story = {
  args: { tone: 'secondary' as const, size: 'sm' as const, children: 'Last synced from the admissions console 6 minutes ago' },
};
