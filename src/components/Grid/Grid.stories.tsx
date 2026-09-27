import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Grid, GridItem } from './Grid';
import { Badge } from '../Badge';
import { Card, CardBody } from '../Card';
import { Heading } from '../Heading';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Spec } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Layout/Grid',
  component: Grid,
  subcomponents: { GridItem } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Two-dimensional layout in four fixed recipes: `auto` fills itself (tracks of at least 220px),',
          '`2` / `3` / `4` are equal columns from `md` (1056px). **Every recipe is one column on a small',
          'screen**; the multi-column arrangement is the enhancement a wide viewport earns. Gutters are the',
          'three surface densities: `tight` 8px (ops) · `default` 16px (LMS) · `roomy` 32px (marketing).',
          'A span lives on the child, `GridItem`, and collapses to full width below `md` with the columns.',
        ].join('\n'),
      },
    },
  },
  args: { columns: 'auto', gap: 'default' },
  argTypes: {
    columns: { control: 'inline-radio', options: ['auto', '2', '3', '4'] },
    gap: { control: 'inline-radio', options: ['tight', 'default', 'roomy'] },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

const modules = [
  ['Module 01', 'Arrays & Hashing', '18 problems'],
  ['Module 02', 'Two Pointers', '12 problems'],
  ['Module 03', 'Binary Search', '15 problems'],
  ['Module 04', 'Graphs & Traversals', '21 problems'],
  ['Module 05', 'Dynamic Programming', '27 problems'],
  ['Module 06', 'Segment Trees', '9 problems'],
] as const;

const ModuleCards = () => (
  <>
    {modules.map(([eyebrow, title, description]) => (
      <Card key={eyebrow} eyebrow={eyebrow} title={title} description={description} />
    ))}
  </>
);

export const Playground: Story = {
  render: (args) => (
    <Grid {...args}>
      <ModuleCards />
    </Grid>
  ),
};

/** `columns="auto"`: the count is derived from the width, not declared. Resize the canvas. */
export const Auto: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Spec label="auto-fill · minmax(220px, 1fr)" wide>
      <Grid>
        <ModuleCards />
      </Grid>
    </Spec>
  ),
};

/** Two, three and four equal columns from `md`; a single column below it. */
export const FixedColumns: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap="8">
      <Spec label='columns="2" · side-by-side comparison' wide>
        <Grid columns="2">
          <Card
            eyebrow="SST · Batch of 2029"
            title="4-year residential UG in CS & AI"
            description="Bengaluru campus · 1,100 hours of instruction · median CTC ₹19,50,000"
          />
          <Card
            eyebrow="SSB · Cohort 4"
            title="AI-first business programme"
            description="Case studies, GTM strategy, financial analysis · founder's office placements"
          />
        </Grid>
      </Spec>
      <Spec label='columns="3" · the marketing default' wide>
        <Grid columns="3">
          {(
            [
              ['1,142', 'Students across SST cohorts 5, 6 and 7'],
              ['₹19,50,000', 'Median CTC, Batch of 2028 placement drive'],
              ['41', 'GSoC 2026 selections from SST and SSB combined'],
            ] as const
          ).map(([v, d]) => (
            <Card key={v}>
              <CardBody>
                <Heading as="p" size="2" className="tabular-nums">
                  {v}
                </Heading>
                <Text size="sm" tone="secondary">
                  {d}
                </Text>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </Spec>
      <Spec label='columns="4" · dense admin metrics' wide>
        <Grid columns="4">
          {(
            [
              ['Applications', '4,318', 'info', 'Open'],
              ['Screened', '2,907', 'success', 'On track'],
              ['Interviews', '861', 'warning', 'Behind'],
              ['Offers', '214', 'brand', 'Rolling'],
            ] as const
          ).map(([k, v, tone, status]) => (
            <Card key={k}>
              <CardBody>
                <Heading as="p" size="eyebrow">
                  {k}
                </Heading>
                <Heading as="p" size="3" className="tabular-nums">
                  {v}
                </Heading>
                <Badge tone={tone} className="self-start">
                  {status}
                </Badge>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </Spec>
    </Stack>
  ),
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border-decorative bg-surface p-4">
    <Stack gap="2">
      <Heading as="p" size="eyebrow">
        {label}
      </Heading>
      <Heading as="p" size="3" className="tabular-nums">
        {value}
      </Heading>
    </Stack>
  </div>
);

/** The three gutters are the three surface densities. */
export const Gutters: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap="8">
      {(
        [
          ['tight', '8px · the admissions ops density'],
          ['default', '16px · the student LMS density'],
          ['roomy', '32px · the marketing density'],
        ] as const
      ).map(([gap, label]) => (
        <Spec key={gap} label={`columns="3" gap="${gap}" · ${label}`} wide>
          <Grid columns="3" gap={gap}>
            <Stat label="Applications" value="4,318" />
            <Stat label="Screened" value="2,907" />
            <Stat label="Offers" value="214" />
          </Grid>
        </Spec>
      ))}
    </Stack>
  ),
};

/** A bento: a `span="2"` hero tile, a `span="3"` band and a `span="full"` footer across a four-column grid. */
export const Spans: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid columns="4">
      <GridItem span="2" asChild>
        <Card
          eyebrow="Google Summer of Code 2026"
          title="14 SST students selected from 15,000+ global applicants"
          titleAs="h3"
          description="This tile takes two of the four tracks. Nothing about the card knows that: the span lives on the grid child."
        />
      </GridItem>
      <Card eyebrow="Hiring partners" title="1,200+" />
      <Card eyebrow="Highest CTC" title="₹1.24 Cr" />
      <GridItem span="3" asChild>
        <Card eyebrow="Industry immersion" description='Three tracks wide: span="3".' />
      </GridItem>
      <Card eyebrow="GSoC" title="41" />
      <GridItem span="full" asChild>
        <Card
          eyebrow="Placement report"
          description='Edge to edge across every track, whatever the track count: span="full" is grid-column 1 / -1.'
        />
      </GridItem>
    </Grid>
  ),
};

/** `as="ul"` with `GridItem as="li"`: a grid of cards that is announced as a list of six. */
export const AsList: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid as="ul" columns="3" aria-label="Term 3 modules">
      {modules.map(([eyebrow, title, description]) => (
        <GridItem as="li" key={eyebrow} className="flex">
          <Card eyebrow={eyebrow} title={title} description={description} className="flex-1" />
        </GridItem>
      ))}
    </Grid>
  ),
};
