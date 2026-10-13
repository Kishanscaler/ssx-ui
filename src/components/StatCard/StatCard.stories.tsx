import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatCard, type StatCardSize, type StatCardVariant } from './StatCard';
import { FORBES, INTERNSHIP, WHY } from './_fixtures/stats';
import { LIVE_PROJECT } from '../_fixtures/photos';
import { PhotoFrame } from '../PhotoFrame';
import { Spec } from '../Icon/_fixtures/story-layout';

/**
 * A dark scene (a laptop and a price chart): the figures here run from the
 * frame's top, above where the scrim starts, so the photo itself must be dark.
 */
const DARK_SCENE = LIVE_PROJECT;

const VARIANTS: StatCardVariant[] = ['plain', 'ruled', 'boxed'];
const SIZES: StatCardSize[] = ['sm', 'md', 'lg'];

/** Specimens side by side, each taking a cell's width. */
const Cells = ({ children, min = 220 }: { children: React.ReactNode; min?: number }) => (
  <div
    style={{
      display: 'grid',
      gap: 'var(--space-6)',
      gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`,
      alignItems: 'stretch',
    }}
  >
    {children}
  </div>
);

const meta = {
  title: 'Marketing/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'One figure and what it counts: **eyebrow · figure · label · description · source**, top to bottom.',
          'The figure is a `Figure` (`size` and `tone` go to it: units a step down, the accent in `brand`); the',
          'label is `Text sm secondary`, so on a photo it takes the on-image ink by itself. `plain`, `ruled` (a',
          'hairline over it) or `boxed` (the sunken surface, 20px in; no fill on a photo or a plate). Every optional',
          'slot omitted is a variant. The source row sits at the cell\'s foot, so logos line up in a `StatGroup`.',
          '',
          'Markers: `data-slot="stat-card[-eyebrow|-value|-label|-description|-source]"`, `data-part="eyebrow |',
          'figure | subline | description | logos"`, and `data-variant`, `data-size`, `data-tone` on the root.',
        ].join('\n'),
      },
    },
  },
  args: {
    value: '₹19L',
    label: 'average CTC, founding cohort',
    variant: 'plain',
    size: 'md',
    tone: 'default',
    as: 'div',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: VARIANTS },
    size: { control: 'inline-radio', options: SIZES },
    tone: { control: 'inline-radio', options: ['default', 'brand'] },
    as: { control: 'inline-radio', options: ['div', 'li', 'article'] },
    sourceLogo: { control: false },
    definition: { control: false },
  },
  render: (args) => (
    <div style={{ maxWidth: 280 }}>
      <StatCard {...args} />
    </div>
  ),
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The figure over its label. */
export const Default: Story = {};

/** The three shapes on the same figure. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Cells>
      {VARIANTS.map((variant) => (
        <Spec key={variant} label={variant}>
          <StatCard variant={variant} value="52%+" label="In Product and Founder’s Office" />
        </Spec>
      ))}
    </Cells>
  ),
};

/** `sm` h2 · `md` h1 · `lg` billboard-sm; the units a step down each. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Cells>
      {SIZES.map((size) => (
        <Spec key={size} label={`size ${size}`}>
          <StatCard size={size} value="₹1.2Cr" label="highest CTC" />
        </Spec>
      ))}
    </Cells>
  ),
};

/** `tone="brand"`: the Innovation Lab's figures in the accent, units included. */
export const BrandTone: Story = {
  args: { tone: 'brand', value: '$1B+', label: 'Combined valuations' },
};

/** `boxed` with an eyebrow: one of the internship's boxes. */
export const BoxedWithEyebrow: Story = {
  args: { variant: 'boxed', ...INTERNSHIP[0]! },
};

/**
 * `ruled` at `lg` with a description and a source (logo and note): one of the
 * Why breaker's spec figures, on a scrimmed photo, where everything inks white.
 */
export const WithSourceOnPhoto: Story = {
  args: { variant: 'ruled', size: 'lg', ...WHY[0]! },
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <PhotoFrame src={DARK_SCENE} ratio="fill" scrim style={{ padding: 'var(--space-6)' }}>
        <StatCard {...args} />
      </PhotoFrame>
    </div>
  ),
};

/** A source as words, with no logo; then a note alone. */
export const SourceWithoutLogo: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Cells>
      <Spec label="source text + note">
        <StatCard variant="ruled" value="60%" label="of MBA students" source="Forbes India" sourceNote="2026" />
      </Spec>
      <Spec label="logo, a different source name">
        <StatCard variant="ruled" value="60%" label="of MBA students" source="Forbes, 2026" sourceLogo={FORBES} />
      </Spec>
    </Cells>
  ),
};

/** Every shape on a photo: `boxed` drops its fill there (the photo, or a plate, is the box). */
export const OnPhoto: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PhotoFrame src={DARK_SCENE} ratio="fill" scrim style={{ padding: 'var(--space-6)' }}>
      <Cells min={160}>
        {VARIANTS.map((variant) => (
          <StatCard key={variant} variant={variant} eyebrow={variant} value="3×" label="average salary hike" />
        ))}
      </Cells>
    </PhotoFrame>
  ),
};
