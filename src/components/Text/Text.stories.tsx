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
  parameters: { controls: { disable: true } },
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
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={20}>
      {(
        [
          ['xs', 'xs · caption 12px — fine print, legal, timestamps, counters (the floor)'],
          ['sm', 'sm · body-sm 13px — dense UI, table cells, help text'],
          ['base', 'base · body 16px — default body, the whole product'],
          ['md', 'md · body 16px — long-form reading: handbook, policy'],
          ['lg', 'lg · body-lg 16 → 18px at sm — marketing lede, directly under a hero'],
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

/**
 * Fine print — a disclaimer, a legal line, the T&C under a fee — is
 * `size="xs"`: the caption role, 12px. That is the floor. There is no 10px
 * size: under 12px, text on a phone held at arm's length stops being
 * reliably readable, and fine print is exactly the text a person is
 * accountable for having read. Make it quieter with `tone="secondary"`, never
 * smaller.
 */
export const FinePrint: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
      <Text>Total payable today: ₹25,000 (one-time admission fee).</Text>
      <Text size="xs" tone="secondary">
        The admission fee is non-refundable once the offer is accepted. Fees are inclusive of GST at 18%. Scholarship
        amounts are adjusted against the Year 1 tuition fee and are subject to the terms in the offer letter.
      </Text>
    </div>
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

/**
 * Tabular figures are not a polish item: a column of numbers gets
 * `tabular-nums`, which sets `font-variant-numeric: tabular-nums` so every
 * digit sits in the same advance width and a column of them lines up.
 *
 * `tone` and `size` in the Controls panel are wired to BOTH columns here (the
 * comparison itself — tabular vs not — is the point of the story, so it stays
 * fixed; `as` is forced to `li` by the list structure, so its control is
 * switched off rather than left to silently do nothing).
 */
export const TabularNumbers: Story = {
  argTypes: {
    // `table.disable` only hides a row from the Docs props table — the
    // Controls panel still showed a live `as` control that this render never
    // reads (it always renders `as="li"`). `control: false` is what actually
    // switches the control off; `children` and `htmlFor` are unused by this
    // render too.
    as: { control: false },
    children: { control: false },
    htmlFor: { control: false },
  },
  render: ({ tone, size }) => (
    <Row align="start">
      {[true, false].map((tabular) => (
        <Spec key={String(tabular)} label={tabular ? 'with tabular-nums' : 'without — digits jitter'}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, width: '100%', maxWidth: 320, display: 'grid', gap: 8 }}>
            {FEES.map(([k, v]) => (
              <Text as="li" key={k} tone={tone} size={size} style={{ display: 'flex', justifyContent: 'space-between' }}>
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
