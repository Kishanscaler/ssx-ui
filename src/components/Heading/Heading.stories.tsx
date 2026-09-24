import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Heading } from './Heading';
import { Button } from '../Button';
import { Text } from '../Text';
import { Card, Spec, Stack } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Atoms/Heading',
  component: Heading,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Four sizes plus an eyebrow. **Level is not size**: `as` (h1–h6, required) is the outline;',
          '`size` is the look. Never skip a level to get a smaller font. `display` is once per page.',
          'There is no size 4 — below 18px a heading reads as bold body copy.',
        ].join('\n'),
      },
    },
  },
  // No `size` here: leaving it unset lets it derive from `as` (h1→'1',
  // h2→'2', h3-h6→'3', p→'eyebrow'), same as an app that never passes it.
  // Pinning both in the default args (the previous state of this story) is
  // exactly what hid the level/size split: changing `as` in Controls changed
  // only the tag, never what you could see, because `size` stayed fixed at
  // '1' underneath it. Pick `size` explicitly in Controls to see the
  // decoupling the other way — level unchanged, rank different.
  args: { as: 'h2', children: 'Batch of 2029 · Admissions' },
  argTypes: {
    as: { control: 'inline-radio', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'] },
    size: { control: 'inline-radio', options: ['eyebrow', 'display', '1', '2', '3'] },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * The two axes are independent. Left column: `as` changes (the outline
 * level, invisible on the page) while `size` stays `'2'` — the text looks
 * identical, only the rendered tag changes (check devtools). Right column:
 * `as` stays `h2` while `size` changes — the look changes, the outline does
 * not.
 */
export const LevelVsSize: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
      <Stack gap={12}>
        <Text size="sm" tone="secondary">
          Same size (&apos;2&apos;), level changes — look does not
        </Text>
        <Heading as="h1" size="2">
          Admissions
        </Heading>
        <Heading as="h2" size="2">
          Admissions
        </Heading>
        <Heading as="h3" size="2">
          Admissions
        </Heading>
      </Stack>
      <Stack gap={12}>
        <Text size="sm" tone="secondary">
          Same level (h2), size changes — outline does not
        </Text>
        <Heading as="h2" size="1">
          Admissions
        </Heading>
        <Heading as="h2" size="2">
          Admissions
        </Heading>
        <Heading as="h2" size="3">
          Admissions
        </Heading>
      </Stack>
    </div>
  ),
};

export const Scale: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={20}>
      <Spec label="eyebrow — 12px, caps, tracked">
        <Heading as="p" size="eyebrow">
          Scaler School of Technology
        </Heading>
      </Spec>
      <Spec label="display — one per page, hero only">
        <Heading as="h1" size="display">
          Four years. One production engineer.
        </Heading>
      </Spec>
      <Spec label="1 — page title">
        <Heading as="h2" size="1">
          Batch of 2029 · Admissions
        </Heading>
      </Spec>
      <Spec label="2 — section">
        <Heading as="h3" size="2">
          Data Structures &amp; Algorithms — Week 6
        </Heading>
      </Spec>
      <Spec label="3 — card and panel titles">
        <Heading as="h4" size="3">
          Segment trees: range queries in logarithmic time
        </Heading>
      </Spec>
    </Stack>
  ),
};

export const HeroInSitu: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Card style={{ maxWidth: 720 }}>
      <Heading as="p" size="eyebrow">
        Undergraduate · CS &amp; AI · Bengaluru
      </Heading>
      <Heading as="h2" size="display">
        Four years. One production engineer.
      </Heading>
      <Text tone="secondary">
        A residential four-year programme in Computer Science and Artificial Intelligence, taught by engineers who
        have shipped at scale. Applications for the Batch of 2029 close on 30 Apr 2026.
      </Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Button>Apply now</Button>
        <Button variant="tertiary">Download transcript</Button>
      </div>
    </Card>
  ),
};

export const PageHeaderLongTitle: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 4, maxWidth: 720 }}>
      <Heading as="p" size="eyebrow">
        Admissions ops console
      </Heading>
      <Heading as="h1" size="1">
        Interview scheduling — Cohort 7, Bengaluru — pending panel confirmation for 42 applicants
      </Heading>
      <Text tone="secondary">Last updated 4 Mar 2026, 11:42 PM</Text>
    </div>
  ),
};

/** Storyblok gives strings: level and size are two separate single-option fields. */
export const FromCmsStrings: Story = {
  args: { as: 'h2' as const, size: '3' as const, children: 'Where the last cohort went' },
};
