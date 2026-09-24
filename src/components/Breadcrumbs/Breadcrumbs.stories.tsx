import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Buildings, GraduationCap, House } from '@phosphor-icons/react';

import {
  Breadcrumbs,
  BreadcrumbsEllipsis,
  BreadcrumbsIconLabel,
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

/** Every level carries an icon, for the `display="icons"` / `"icons-text"` stories. */
const WITH_ICONS: BreadcrumbsItemData[] = [
  { label: 'Home', href: '#home', icon: <House /> },
  { label: 'Programmes', href: '#programmes', icon: <GraduationCap /> },
  { label: 'B.Sc CS & AI', href: '#bsc', icon: <Buildings /> },
  { label: 'Data Structures & Algorithms — Week 6' },
];

const meta = {
  title: 'Molecules/Breadcrumbs',
  component: Breadcrumbs,
  subcomponents: { BreadcrumbsItem, BreadcrumbsLink, BreadcrumbsSeparator, BreadcrumbsIconLabel, BreadcrumbsEllipsis },
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
          '',
          '`display="icons"` / `"icons-text"` swap every level but the current page for its `icon` (label',
          'kept as the accessible name and hover title); `homeIcon` swaps just the first level, independent',
          'of `display`. The current page always shows its full label.',
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
    display: 'text',
    'aria-label': 'Breadcrumb',
  },
  argTypes: {
    items: { control: 'object' },
    maxItems: { control: { type: 'number', min: 2, max: 10 } },
    autoCollapse: {
      control: 'boolean',
      description: 'Without maxItems: collapse the middle into "…" when the container is under 480px.',
      table: { defaultValue: { summary: 'true' } },
    },
    itemsBeforeCollapse: { control: { type: 'number', min: 0, max: 4 } },
    itemsAfterCollapse: { control: { type: 'number', min: 1, max: 4 } },
    truncate: { control: 'boolean' },
    display: { control: 'inline-radio', options: ['text', 'icons', 'icons-text'] },
    homeIcon: { control: false },
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

/**
 * "Only the current page has full text": `display="icons"` swaps every other
 * level for its `icon` alone — the label survives as the accessible name and
 * the hover `title` — and `"icons-text"` keeps both. A full icon-only trail
 * past one level reads poorly on its own, which is why `homeIcon` (below) is
 * usually the better default: "just Home as a glyph" is instantly
 * recognisable without needing a row of unlabelled icons to learn.
 */
export const IconVariants: Story = {
  name: 'Icon variants',
  render: () => (
    <Stack>
      <Spec label="display=&quot;text&quot; (default)" wide>
        <Breadcrumbs items={WITH_ICONS} />
      </Spec>
      <Spec label="display=&quot;icons&quot; — label kept as the accessible name + hover title" wide>
        <Breadcrumbs items={WITH_ICONS} display="icons" />
      </Spec>
      <Spec label="display=&quot;icons-text&quot;" wide>
        <Breadcrumbs items={WITH_ICONS} display="icons-text" />
      </Spec>
      <Spec label="homeIcon — just Home as a glyph, every other level stays text" wide>
        <Breadcrumbs items={SIX} homeIcon={<House />} />
      </Spec>
      <Spec label="homeIcon + display=&quot;icons-text&quot; — Home stays icon-only, the rest are icon+text" wide>
        <Breadcrumbs items={WITH_ICONS} display="icons-text" homeIcon={<House />} />
      </Spec>
    </Stack>
  ),
};

/** Compound API: `BreadcrumbsIconLabel` is the icon + accessible-name part. */
export const IconVariantsComposed: Story = {
  name: 'Icon variants · composed',
  render: () => (
    <div style={{ paddingBottom: 200 }}>
      <Breadcrumbs aria-label="Course path">
        <BreadcrumbsItem>
          <BreadcrumbsLink asChild>
            {/* In Next.js: <NextLink href="/"> */}
            <a href="#home">
              <BreadcrumbsIconLabel label="Home">
                <House />
              </BreadcrumbsIconLabel>
            </a>
          </BreadcrumbsLink>
        </BreadcrumbsItem>
        <BreadcrumbsItem>
          <BreadcrumbsLink href="#programmes">Programmes</BreadcrumbsLink>
        </BreadcrumbsItem>
        <BreadcrumbsItem current>B.Sc CS &amp; AI</BreadcrumbsItem>
      </Breadcrumbs>
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

/**
 * No `maxItems`: the trail collapses by itself when its CONTAINER is under
 * 480px (a container query), so the same six levels show in full in a wide
 * column and as Home / … / Semester 4 / current in a side panel or on a phone.
 */
export const AutoCollapse: Story = {
  name: 'Collapses by container width',
  render: () => (
    <div style={{ paddingBottom: 200 }}>
      <Stack>
        <Spec label="wide container: every level" wide>
          <Breadcrumbs items={SIX} />
        </Spec>
        <Spec label="a 360px panel: the middle collapses into …" wide>
          <div className="w-full max-w-[360px] rounded-md border border-border-decorative p-3">
            <Breadcrumbs items={SIX} />
          </div>
        </Spec>
      </Stack>
    </div>
  ),
};
