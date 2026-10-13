import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PhotoFrame, type PhotoFrameBlur, type PhotoFrameRatio } from './PhotoFrame';
import { PHOTO, PHOTO_PALE } from './_fixtures/marketing';
import { Badge } from '../Badge';
import { StatCard } from '../StatCard';
import { StatGroup } from '../StatGroup';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const RATIOS: PhotoFrameRatio[] = ['16:9', '4:3', '3:2', '1:1', '4:5', '3:4', '9:16'];
const BLURS: PhotoFrameBlur[] = ['none', 'bottom', 'end'];

/** Auto-fill columns: the frame takes its cell's width, never its own. */
const Grid = ({ children, min = 220 }: { children: React.ReactNode; min?: number }) => (
  <div
    style={{
      display: 'grid',
      gap: 'var(--space-6)',
      gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`,
      alignItems: 'start',
    }}
  >
    {children}
  </div>
);

const meta = {
  title: 'Marketing/PhotoFrame',
  component: PhotoFrame,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A photo in a ratio, positioned, with an optional **progressive blur**: blurred copies of the',
          'photo revealed by gradients under a scrim (not `backdrop-filter`, which re-runs on scroll).',
          'No `src` shows the plate. Children sit on top: in-flow children settle at the foot, a tag',
          'positions itself. With a scrim (or on the plate) the frame declares on-image ink, so the',
          'Heading, Text and a StatCard inside turn white. Markers only, no motion: the photo and its',
          'copies are one `data-part="photo"` layer. The stories lay the public `StatCard` and',
          '`StatGroup plate` on it, as a page would.',
        ].join('\n'),
      },
    },
  },
  args: {
    src: PHOTO,
    alt: '',
    ratio: '4:3',
    blur: 'bottom',
    from: 0.4,
    placeholder: 'plate',
    priority: false,
  },
  argTypes: {
    ratio: { control: 'select', options: [...RATIOS, 'fill'] },
    blur: { control: 'inline-radio', options: BLURS },
    from: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    placeholder: { control: 'inline-radio', options: ['plate', 'sunken'] },
    scrim: { control: 'boolean' },
    position: { control: 'text' },
  },
  render: (args) => (
    <div style={{ maxWidth: 420 }}>
      <PhotoFrame {...args}>
        <StatCard value="₹50L" label="offered on Shark Tank India" size="sm" className="p-5" />
      </PhotoFrame>
    </div>
  ),
} satisfies Meta<typeof PhotoFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every ratio against every blur. `4:5` reads `--ssx-aspect-4-5` (no token yet) and falls back to 3:4. */
export const RatioByBlur: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={40}>
      {BLURS.map((blur) => (
        <Grid key={blur} min={180}>
          {RATIOS.map((ratio) => (
            <Spec key={ratio} label={`${ratio} · blur ${blur}`}>
              <PhotoFrame src={PHOTO} ratio={ratio} blur={blur}>
                <StatCard value="200K" label="followers" size="sm" className="p-4" />
              </PhotoFrame>
            </Spec>
          ))}
        </Grid>
      ))}
    </Stack>
  ),
};

/** `from` moves where the blur and the scrim begin: start it below any face. */
export const From: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid>
      {[0.2, 0.4, 0.6].map((from) => (
        <Spec key={from} label={`from ${from}`}>
          <PhotoFrame src={PHOTO} ratio="1:1" blur="bottom" from={from} />
        </Spec>
      ))}
    </Grid>
  ),
};

/** No `src`: the fixed dark plate (white type on it) or the page's sunken grey. */
export const Placeholder: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid>
      <Spec label="plate">
        <PhotoFrame ratio="1:1">
          <StatCard value="₹1Cr+" label="annual recurring revenue" size="sm" className="p-5" />
        </PhotoFrame>
      </Spec>
      <Spec label="sunken">
        <PhotoFrame ratio="1:1" placeholder="sunken">
          <StatCard value="12,000+" label="students taught" size="sm" className="p-5" />
        </PhotoFrame>
      </Spec>
    </Grid>
  ),
};

/** `fill` takes its parent's height: a card's media column. */
export const Fill: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ height: 320, maxWidth: 280 }}>
      <PhotoFrame src={PHOTO} ratio="fill" blur="bottom" />
    </div>
  ),
};

/**
 * The composition the cards build, from the public parts: a glass tag at the
 * top start, the figures on a `StatGroup plate` at the foot (`light` on a dark
 * scene, `dark` on a pale photo), and a plain `StatCard` where the photo blurs
 * toward its end.
 */
export const Composed: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid min={260}>
      <Spec label="light plate on a dark scene">
        <PhotoFrame src={PHOTO} ratio="4:5" blur="bottom" from={0.5}>
          <Badge tone="glass" className="absolute start-4 top-4">
            Food &amp; beverage
          </Badge>
          <div className="p-2">
            <StatGroup plate columns={2} as="dl">
              <StatCard value="₹50L" label="offered on Shark Tank" size="sm" />
              <StatCard value="₹1Cr+" label="annual revenue" size="sm" />
            </StatGroup>
          </div>
        </PhotoFrame>
      </Spec>
      <Spec label="dark plate on a pale photo">
        <PhotoFrame src={PHOTO_PALE} ratio="4:5" scrim={false}>
          <Badge tone="glassDark" className="absolute start-4 top-4">
            Highlight
          </Badge>
          <div className="p-2">
            <StatGroup plate plateTone="dark" columns={2} as="dl">
              <StatCard value="200K" label="followers on Instagram" size="sm" />
              <StatCard value="12" label="brand deals" size="sm" />
            </StatGroup>
          </div>
        </PhotoFrame>
      </Spec>
      <Spec label="blur end: a column of marks floats there">
        <PhotoFrame src={PHOTO} ratio="16:9" blur="end" from={0.45}>
          <StatCard value="50+" label="startups" size="sm" className="p-5" />
        </PhotoFrame>
      </Spec>
    </Grid>
  ),
};
