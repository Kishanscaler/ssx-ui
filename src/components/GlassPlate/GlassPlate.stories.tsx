import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { GlassPlate, type GlassPlateInset, type GlassPlateTone } from './GlassPlate';
import { PHOTO, PHOTO_PALE } from '../PhotoFrame/_fixtures/marketing';
import { Figure } from '../Figure';
import { Heading } from '../Heading';
import { PhotoFrame } from '../PhotoFrame';
import { Text } from '../Text';
import { Spec } from '../Icon/_fixtures/story-layout';

const TONES: GlassPlateTone[] = ['light', 'dark'];
const INSETS: GlassPlateInset[] = ['none', 'foot'];

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'grid',
      gap: 'var(--space-6)',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
      alignItems: 'start',
    }}
  >
    {children}
  </div>
);

const Content = () => (
  <>
    <Figure value="₹1Cr+" size="sm" />
    <Text size="sm" tone="secondary">
      annual recurring revenue
    </Text>
  </>
);

const meta = {
  title: 'Marketing/GlassPlate',
  component: GlassPlate,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The plate or bar laid on a photo. `light` is the on-image glass (for a dark scene); `dark` the',
          'fixed dark plate a pale photo needs, the same in both themes (`--ssx-plate-on-photo`, falling',
          'back to `--surface-image-scrim`). It declares on-image ink, so the type inside is white.',
          '`inset="foot"` pins it to the foot of a PhotoFrame. Padding 16 by 20, corners `radius-lg`.',
        ].join('\n'),
      },
    },
  },
  args: { tone: 'light', inset: 'foot', blur: true, as: 'div' },
  argTypes: {
    tone: { control: 'inline-radio', options: TONES },
    inset: { control: 'inline-radio', options: INSETS },
    blur: { control: 'boolean' },
    as: { control: 'select', options: ['div', 'section', 'aside', 'footer', 'figure', 'dl', 'ul', 'blockquote'] },
  },
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <PhotoFrame src={args.tone === 'dark' ? PHOTO_PALE : PHOTO} ratio="4:5" scrim={false}>
        <GlassPlate {...args}>
          <Content />
        </GlassPlate>
      </PhotoFrame>
    </div>
  ),
} satisfies Meta<typeof GlassPlate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Both tones, in flow and at the foot, on a dark scene and on a pale one. */
export const ToneByInset: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid>
      {TONES.flatMap((tone) =>
        [PHOTO, PHOTO_PALE].flatMap((photo, p) =>
          INSETS.map((inset) => (
            <Spec key={`${tone}-${p}-${inset}`} label={`${tone} · inset ${inset} · ${p ? 'pale' : 'dark'} photo`}>
              <PhotoFrame src={photo} ratio="1:1" scrim={false}>
                {inset === 'foot' ? (
                  <GlassPlate tone={tone} inset="foot">
                    <Content />
                  </GlassPlate>
                ) : (
                  <div className="p-4">
                    <GlassPlate tone={tone}>
                      <Content />
                    </GlassPlate>
                  </div>
                )}
              </PhotoFrame>
            </Spec>
          )),
        ),
      )}
    </Grid>
  ),
};

/** `blur={false}`: no frost (a plate that moves over a scroller). */
export const NoBlur: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid>
      {TONES.map((tone) => (
        <Spec key={tone} label={`${tone} · no blur`}>
          <PhotoFrame src={PHOTO} ratio="1:1" scrim={false}>
            <GlassPlate tone={tone} blur={false} inset="foot">
              <Content />
            </GlassPlate>
          </PhotoFrame>
        </Spec>
      ))}
    </Grid>
  ),
};

/** Who said it: a heading and a line, as the breaker's profile plate. */
export const Profile: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <PhotoFrame src={PHOTO} ratio="16:9" scrim={false}>
        <GlassPlate tone="dark" inset="foot">
          <Heading as="p" size="3">
            Anupam Mittal
          </Heading>
          <Text size="sm" tone="secondary">
            Founder, Shaadi.com · Shark Tank India
          </Text>
        </GlassPlate>
      </PhotoFrame>
    </div>
  ),
};
