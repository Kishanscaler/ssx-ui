import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Figure, type FigureSize, type FigureTone } from './Figure';
import { PHOTO } from '../PhotoFrame/_fixtures/marketing';
import { GlassPlate } from '../GlassPlate';
import { PhotoFrame } from '../PhotoFrame';
import { Text } from '../Text';
import { Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

const SIZES: FigureSize[] = ['sm', 'md', 'lg'];
const TONES: FigureTone[] = ['default', 'brand'];
const VALUES = ['₹1Cr+', '$2M+', '60%', '200K', '12,000+', '3×'];

const meta = {
  title: 'Marketing/Figure',
  component: Figure,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A figure with its unit glyphs (₹ $ % + × L Cr K M, any letters) a step down in the secondary',
          'ink, a leading currency at the digits’ top. One element, one value: it copies and reads as',
          'written. Tabular figures. `sm` h2 · `md` h1 · `lg` billboard-sm. `brand` sets it in the',
          'accent (`--ssx-content-accent`, falling back to `--content-brand`). White on a photo.',
        ].join('\n'),
      },
    },
  },
  args: { value: '₹1Cr+', size: 'md', tone: 'default', units: true, as: 'p' },
  argTypes: {
    size: { control: 'inline-radio', options: SIZES },
    tone: { control: 'inline-radio', options: TONES },
    units: { control: 'boolean' },
    as: { control: 'select', options: ['p', 'span', 'div', 'dd', 'dt', 'strong'] },
  },
} satisfies Meta<typeof Figure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every size in both tones, over the usual units. */
export const SizeByTone: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={32}>
      {TONES.flatMap((tone) =>
        SIZES.map((size) => (
          <Spec key={`${tone}-${size}`} label={`${size} · ${tone}`} wide>
            <Row align="start">
              {VALUES.map((value) => (
                <Figure key={value} value={value} size={size} tone={tone} />
              ))}
            </Row>
          </Spec>
        )),
      )}
    </Stack>
  ),
};

/** `units={false}`: the value set as one run. */
export const WithoutUnits: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row align="start">
      <Spec label="units">
        <Figure value="₹19L" size="lg" />
      </Spec>
      <Spec label="units={false}">
        <Figure value="₹19L" size="lg" units={false} />
      </Spec>
    </Row>
  ),
};

/**
 * On a photo: white, units in the on-image secondary ink. The `brand` tone
 * goes white there too (units included), as SectionHeader's accent does.
 */
export const OnAPhoto: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row align="start">
      {(['default', 'brand'] as const).map((tone) => (
        <Spec key={tone} label={`tone="${tone}"`}>
          <div style={{ width: 320, maxWidth: '100%' }}>
            <PhotoFrame src={PHOTO} ratio="1:1" blur="bottom" from={0.45}>
              <GlassPlate inset="foot">
                <Figure value="₹50L" size="md" tone={tone} />
                <Text size="sm" tone="secondary">
                  offered on Shark Tank India
                </Text>
              </GlassPlate>
            </PhotoFrame>
          </div>
        </Spec>
      ))}
    </Row>
  ),
};
