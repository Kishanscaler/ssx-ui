import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Breadcrumbs,
  BreadcrumbsEllipsis,
  BreadcrumbsItem,
  BreadcrumbsLink,
  BreadcrumbsSeparator,
  type BreadcrumbsItemData,
} from './Breadcrumbs';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const SIX: BreadcrumbsItemData[] = [
  { label: 'Home', href: '#home' },
  { label: 'Programmes', href: '#programmes' },
  { label: 'B.Sc CS & AI', href: '#bsc' },
  { label: 'Year 2', href: '#year-2' },
  { label: 'Semester 4', href: '#semester-4' },
  { label: 'Data Structures & Algorithms — Week 6: Balanced Trees and Amortised Analysis' },
];

const meta = {
  title: 'Molecules/Breadcrumbs',
  component: Breadcrumbs,
  subcomponents: { BreadcrumbsItem, BreadcrumbsLink, BreadcrumbsSeparator, BreadcrumbsEllipsis },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The path from the root to where you are, the current page marked (`aria-current="page"`) and',
          'unlinked. A `<nav aria-label="Breadcrumb">` around an `<ol>`; separators are `aria-hidden`.',
          '`maxItems` collapses the middle into a Menu behind a "…" named for what it hides; `truncate`',
          'caps crumbs at 22ch with the full text kept in the DOM and a `title`. Server component.',
          'Routing: `BreadcrumbsLink asChild` or `linkAs`.',
        ].join('\n'),
      },
    },
  },
  args: {
    items: SIX,
    maxItems: 4,
    itemsBeforeCollapse: 1,
    itemsAfterCollapse: 2,
    truncate: false,
    'aria-label': 'Breadcrumb',
  },
  argTypes: {
    items: { control: 'object' },
    maxItems: { control: { type: 'number', min: 2, max: 10 } },
    itemsBeforeCollapse: { control: { type: 'number', min: 0, max: 4 } },
    itemsAfterCollapse: { control: { type: 'number', min: 1, max: 4 } },
    truncate: { control: 'boolean' },
    'aria-label': { control: 'text' },
    linkAs: { control: false },
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ paddingBottom: 200 }}>
      <Breadcrumbs {...args} />
    </div>
  ),
};

/** The HTML's depths: 3 levels, 5 levels, 6 collapsed to 4, and every crumb capped. */
export const Depths: Story = {
  render: () => (
    <div style={{ paddingBottom: 200 }}>
      <Stack>
        <Spec label="3 levels" wide>
          <Breadcrumbs items={SIX.slice(0, 2).concat({ label: 'B.Sc CS & AI' })} />
        </Spec>
        <Spec label="5 levels · aria-current on the last" wide>
          <Breadcrumbs items={SIX.slice(0, 4).concat({ label: 'Data Structures & Algorithms' })} />
        </Spec>
        <Spec label="truncated middle · 6 levels collapsed to 4" wide>
          <Breadcrumbs
            maxItems={4}
            items={SIX.map((item, i) => (i === SIX.length - 1 ? { ...item, truncate: true } : item))}
          />
        </Spec>
        <Spec label="every crumb capped · truncate" wide>
          <Breadcrumbs
            truncate
            items={[
              { label: 'Admissions operations console', href: '#ops' },
              { label: 'Batch of 2029 — January intake', href: '#batch' },
              { label: 'Aarav Krishnan — SST-2029-0416, scholarship review pending' },
            ]}
          />
        </Spec>
        <Spec label="two levels · minimum useful depth" wide>
          <Breadcrumbs items={[{ label: 'Admissions ops', href: '#ops' }, { label: 'Application SST-2029-0416' }]} />
        </Spec>
      </Stack>
    </div>
  ),
};

/** The parts, for a router link (`asChild`) or a hand-built trail. */
export const Composed: Story = {
  render: () => (
    <div style={{ paddingBottom: 200 }}>
      <Breadcrumbs aria-label="Course path">
        <BreadcrumbsItem>
          <BreadcrumbsLink asChild>
            {/* In Next.js: <NextLink href="/">Home</NextLink> */}
            <a href="#home">Home</a>
          </BreadcrumbsLink>
        </BreadcrumbsItem>
        <BreadcrumbsEllipsis
          items={[
            { label: 'Programmes', href: '#programmes' },
            { label: 'B.Sc CS & AI', href: '#bsc' },
          ]}
        />
        <BreadcrumbsItem>
          <BreadcrumbsLink href="#semester-4">Semester 4</BreadcrumbsLink>
        </BreadcrumbsItem>
        <BreadcrumbsItem current>Data Structures &amp; Algorithms</BreadcrumbsItem>
      </Breadcrumbs>
    </div>
  ),
};
