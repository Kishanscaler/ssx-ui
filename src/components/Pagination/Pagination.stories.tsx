import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Pagination, type PaginationProps } from './Pagination';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Molecules/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Numbered movement through a result set whose size is known: prev / next, page numbers, and an',
          'ellipsis where a run is elided. Not for a feed. The rail keeps a constant slot count as you page',
          '(`paginationRange`, exported for DataTable), numbers are tabular, and each carries a full name',
          '("Page 18, current page"). Buttons by default; `hrefTemplate` / `getHref` (+ `linkAs`) make links.',
          'Prev / next at an end are `aria-disabled`, so focus is not dropped.',
        ].join('\n'),
      },
    },
  },
  args: {
    count: 42,
    page: 1,
    variant: 'default',
    adaptive: true,
    siblingCount: 1,
    boundaryCount: 1,
    disabled: false,
    'aria-label': 'Submissions pages',
    previousLabel: 'Previous page',
    nextLabel: 'Next page',
    pageLabel: 'Page {page}',
    currentPageLabel: 'Page {page}, current page',
    readoutLabel: 'Page {page} of {count}',
  },
  argTypes: {
    count: { control: { type: 'number', min: 1, max: 500 }, description: 'Total pages.' },
    page: { control: { type: 'number', min: 1 }, description: 'Current page (two-way bound in this story).' },
    defaultPage: { control: { type: 'number', min: 1 } },
    variant: { control: 'inline-radio', options: ['default', 'compact'] },
    adaptive: {
      control: 'boolean',
      description: 'Fit the container: drop sibling pages, then go compact, when the rail does not fit.',
      table: { defaultValue: { summary: 'true' } },
    },
    siblingCount: { control: { type: 'number', min: 0, max: 3 } },
    boundaryCount: { control: { type: 'number', min: 0, max: 3 } },
    disabled: { control: 'boolean' },
    hrefTemplate: { control: 'text' },
    'aria-label': { control: 'text' },
    previousLabel: { control: 'text' },
    nextLabel: { control: 'text' },
    pageLabel: { control: 'text' },
    currentPageLabel: { control: 'text' },
    readoutLabel: { control: 'text' },
    onPageChange: { action: 'pageChange', table: { category: 'Events' } },
    getHref: { control: false },
    linkAs: { control: false },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every control is live; `page` is bound both ways, so clicking the rail updates the control. */
export const Playground: Story = {
  render: function Render(args) {
    const [, updateArgs] = useArgs<PaginationProps>();
    return (
      <Pagination
        {...args}
        onPageChange={(page) => {
          updateArgs({ page });
          args.onPageChange?.(page);
        }}
      />
    );
  },
};

/** The HTML's three positions: first page (prev off), middle (ellipsis both sides), last page (next off). */
export const Positions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      <Spec label="page 1 of many · prev disabled">
        <Pagination count={42} defaultPage={1} aria-label="Submissions pages" />
      </Spec>
      <Spec label="middle page · ellipsis both sides">
        <Pagination count={128} defaultPage={18} aria-label="Applicant pages" />
      </Spec>
      <Spec label="last page · next disabled">
        <Pagination count={7} defaultPage={7} aria-label="Fee receipt pages" />
      </Spec>
      <Spec label="last of many">
        <Pagination count={42} defaultPage={42} aria-label="Roster pages" />
      </Spec>
    </Stack>
  ),
};

/** prev / readout / next, for a drawer, a card or a mobile roster. */
export const Compact: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      <Spec label="compact · prev / readout / next">
        <Pagination variant="compact" count={42} defaultPage={3} aria-label="Graded submissions pages, compact" />
      </Spec>
      <Spec label="compact · single page, both ends disabled">
        <Pagination variant="compact" count={1} aria-label="Hostel allotment pages, compact" />
      </Spec>
    </Stack>
  ),
};

/** `hrefTemplate` renders links (RSC- and CMS-safe); `linkAs` takes your router link. */
export const Links: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Spec label="links · hrefTemplate='#submissions-{page}'">
      <Pagination count={12} defaultPage={5} hrefTemplate="#submissions-{page}" aria-label="Submissions pages" />
    </Spec>
  ),
};

export const Density: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      <Spec label="siblingCount 2 · boundaryCount 2">
        <Pagination count={200} defaultPage={100} siblingCount={2} boundaryCount={2} aria-label="Wide pages" />
      </Spec>
      <Spec label="siblingCount 0">
        <Pagination count={200} defaultPage={100} siblingCount={0} aria-label="Narrow pages" />
      </Spec>
      <Spec label="disabled · while the next page loads">
        <Pagination count={42} defaultPage={3} disabled aria-label="Loading pages" />
      </Spec>
    </Stack>
  ),
};

/**
 * `adaptive` (on by default): the same Pagination in three containers. It
 * measures its container, not the viewport, and steps down only as far as it
 * must: the full rail, then no sibling pages, then the compact readout. It
 * never wraps, so no arrow is left alone on a second row.
 */
export const FitsItsContainer: Story = {
  parameters: { controls: { disable: true } },
  name: 'Fits its container',
  render: () => (
    <Stack>
      {[480, 280, 200].map((w) => (
        <Spec key={w} label={`${w}px container`}>
          <div className="w-full rounded-md border border-border-decorative p-2" style={{ maxWidth: w }}>
            <Pagination count={128} defaultPage={18} aria-label={`Pages, ${w}px`} />
          </div>
        </Spec>
      ))}
    </Stack>
  ),
};
