import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconButton } from './IconButton';
import {
  ArrowClockwise,
  Bell,
  DotsThree,
  DownloadSimple,
  MagnifyingGlass,
  Plus,
  Star,
  Trash,
  X,
} from '../Icon/_fixtures/phosphor';
import { Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Atoms/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A Button whose whole label is an icon, for dense toolbars and row actions. It is `Button`',
          'with a square size — same variants, states and loading — and `aria-label` is **required** by',
          'its type. Use the bold weight at `sm`. Never for a destructive action a user meets for the',
          'first time. A pressed toggle is ToggleButton, not this.',
        ].join('\n'),
      },
    },
  },
  args: { 'aria-label': 'Add student to Cohort 7', variant: 'primary', size: 'md', children: <Plus /> },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'tertiary', 'danger', 'neutral'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    children: { control: false },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      <Spec label="primary">
        <IconButton variant="primary" aria-label="Add student to Cohort 7">
          <Plus />
        </IconButton>
      </Spec>
      <Spec label="secondary">
        <IconButton variant="secondary" aria-label="Search students">
          <MagnifyingGlass />
        </IconButton>
      </Spec>
      <Spec label="tertiary">
        <IconButton variant="tertiary" aria-label="Download transcript">
          <DownloadSimple />
        </IconButton>
      </Spec>
      <Spec label="danger">
        <IconButton variant="danger" aria-label="Delete submission">
          <Trash />
        </IconButton>
      </Spec>
      <Spec label="neutral">
        <IconButton variant="neutral" aria-label="Dismiss">
          <X />
        </IconButton>
      </Spec>
    </Row>
  ),
};

const GLYPHS = [
  ['primary', Plus, 'Add module'],
  ['secondary', Bell, 'Notifications'],
  ['tertiary', X, 'Close panel'],
  ['danger', Trash, 'Delete submission'],
] as const;

/** sm 32 / md 40 / lg 48 — bold glyph at sm. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      {GLYPHS.map(([variant, G, label]) =>
        (['sm', 'md', 'lg'] as const).map((size) => (
          <Spec key={variant + size} label={`${variant} · ${size}`}>
            <IconButton variant={variant} size={size} aria-label={label}>
              <G weight={size === 'sm' ? 'bold' : 'regular'} />
            </IconButton>
          </Spec>
        )),
      )}
    </Row>
  ),
};

/** The "More actions" affordance, and a row toolbar with context in every name. */
export const Overflow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      <Spec label="tertiary · overflow">
        <IconButton variant="tertiary" aria-label="More actions for Aarav Krishnan">
          <DotsThree />
        </IconButton>
      </Spec>
      <Spec label="secondary · overflow">
        <IconButton variant="secondary" aria-label="More actions for Aarav Krishnan">
          <DotsThree />
        </IconButton>
      </Spec>
      <Spec label="in a row, with context">
        <div style={{ display: 'inline-flex', gap: 4 }}>
          <IconButton variant="tertiary" size="sm" aria-label="Star Aarav Krishnan">
            <Star weight="bold" />
          </IconButton>
          <IconButton variant="tertiary" size="sm" aria-label="Download Aarav Krishnan's transcript">
            <DownloadSimple weight="bold" />
          </IconButton>
          <IconButton variant="tertiary" size="sm" aria-label="More actions for Aarav Krishnan">
            <DotsThree weight="bold" />
          </IconButton>
        </div>
      </Spec>
    </Row>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      <Row>
        <Spec label="rest">
          <IconButton variant="secondary" aria-label="Refresh applicant list">
            <ArrowClockwise />
          </IconButton>
        </Spec>
        <Spec label="loading">
          <IconButton variant="primary" loading aria-label="Refreshing applicant list">
            <ArrowClockwise />
          </IconButton>
        </Spec>
        <Spec label="disabled">
          <IconButton variant="secondary" disabled aria-label="Refresh applicant list">
            <ArrowClockwise />
          </IconButton>
        </Spec>
      </Row>
    </Stack>
  ),
};
