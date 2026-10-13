import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatGroup } from './StatGroup';
import { StatCard } from '../StatCard';
import { INTERNSHIP, LAB, PLACEMENTS, WHY } from '../StatCard/_fixtures/stats';
import { PHOTO, PHOTO_PALE } from '../PhotoFrame/_fixtures/marketing';
import { PhotoFrame } from '../PhotoFrame';

const meta = {
  title: 'Marketing/StatGroup',
  component: StatGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A row of `StatCard`s: two columns on a phone, `columns` (2, 3 or 4) from `sm`. `divided` draws a hairline',
          'between the cells of a row (none between rows, so a row that wraps still reads). `plate` makes the group a',
          '`GlassPlate` (light, or `plateTone="dark"` for a pale photo): the type inside goes white. `as="ul"` makes',
          'the cards list items; `as="dl"` makes each a term (`dt` label) and definition (`dd` figure).',
          '',
          'Markers: `data-slot="stat-group"`, `data-columns`, `data-divided`, `data-plate`. The cards are the cells.',
        ].join('\n'),
      },
    },
  },
  args: { columns: 4, divided: false, plate: false, plateTone: 'light', as: 'div' },
  argTypes: {
    columns: { control: 'inline-radio', options: [2, 3, 4] },
    plateTone: { control: 'inline-radio', options: ['light', 'dark'] },
    as: { control: 'inline-radio', options: ['div', 'ul', 'dl', 'section'] },
  },
  render: (args) => (
    <StatGroup {...args}>
      {PLACEMENTS.slice(0, args.columns ?? 4).map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </StatGroup>
  ),
} satisfies Meta<typeof StatGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Four figures over their labels. */
export const Default: Story = {};

/** `divided`: a hairline between the cells of a row; on a phone, between the two of each row. */
export const Divided: Story = {
  args: { divided: true },
};

/** The Innovation Lab: three figures in the accent, a list. */
export const LabStats: Story = {
  args: { columns: 3, as: 'ul' },
  render: (args) => (
    <StatGroup {...args}>
      {LAB.map((s) => (
        <StatCard key={s.label} tone="brand" size="md" {...s} />
      ))}
    </StatGroup>
  ),
};

/** The internship: three grey boxes, an eyebrow over each figure. */
export const Internship: Story = {
  args: { columns: 3, as: 'ul' },
  render: (args) => (
    <StatGroup {...args}>
      {INTERNSHIP.map((s) => (
        <StatCard key={s.label} variant="boxed" {...s} />
      ))}
    </StatGroup>
  ),
};

/** Placements' figure strip: four over one-line captions, a hairline over each (Apple's spec row). */
export const FigureStrip: Story = {
  args: { columns: 4, as: 'ul' },
  render: (args) => (
    <StatGroup {...args}>
      {PLACEMENTS.map((s) => (
        <StatCard key={s.label} variant="ruled" size="lg" {...s} />
      ))}
    </StatGroup>
  ),
};

/** The strip, `boxed`: a step down (`md`), so a card's own figure above it leads. */
export const FigureStripBoxed: Story = {
  args: { columns: 4, as: 'ul' },
  render: (args) => (
    <StatGroup {...args}>
      {PLACEMENTS.map((s) => (
        <StatCard key={s.label} variant="boxed" {...s} />
      ))}
    </StatGroup>
  ),
};

/**
 * Placements on a photo: a `dl` of four on a light glass plate, divided, at
 * the foot of the scene. The plate inks everything white.
 */
export const PlacementsOnPhoto: Story = {
  args: { columns: 4, divided: true, plate: true, plateTone: 'light', as: 'dl' },
  render: (args) => (
    <PhotoFrame
      src={args.plateTone === 'dark' ? PHOTO_PALE : PHOTO}
      ratio="fill"
      scrim={false}
      style={{ minHeight: 'var(--size-panel-xs)', padding: 'var(--space-4)' }}
    >
      <StatGroup {...args}>
        {PLACEMENTS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </StatGroup>
    </PhotoFrame>
  ),
};

/** The same on a pale photo: `plateTone="dark"`, the fixed dark plate (the same in both themes). */
export const PlacementsOnPalePhoto: Story = {
  args: { columns: 4, divided: true, plate: true, plateTone: 'dark', as: 'dl' },
  render: PlacementsOnPhoto.render,
};

/**
 * The Why breaker's two spec figures: ruled, `lg`, a line and a source each,
 * on a scrimmed scene (which declares on-image ink). The lines run to
 * different lengths; the figures and the logos still sit level.
 */
export const WhyBreakerFigures: Story = {
  args: { columns: 2, as: 'ul' },
  render: (args) => (
    <PhotoFrame src={PHOTO} ratio="fill" scrim style={{ padding: 'var(--space-6)' }}>
      <div style={{ maxWidth: 560 }}>
        <StatGroup {...args}>
          {WHY.map((s) => (
            <StatCard key={s.value} variant="ruled" size="lg" {...s} />
          ))}
        </StatGroup>
      </div>
    </PhotoFrame>
  ),
};
