import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AspectRatio, AspectRatioFill, type AspectRatioRatio } from './AspectRatio';
import { Badge } from '../Badge';
import { Grid } from '../Grid';
import { Skeleton } from '../Skeleton';
import { Spinner } from '../Spinner';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Spec } from '../Icon/_fixtures/story-layout';

const photo = new URL('../Card/_fixtures/stand-in-sst.svg', import.meta.url).href;

const meta = {
  title: 'Layout/AspectRatio',
  component: AspectRatio,
  subcomponents: { AspectRatioFill } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Reserves the exact box a piece of media will occupy before it has loaded, so nothing below it',
          'jumps when the bytes arrive. Six ratios, and that is the whole set: `16:9` video · `4:3` slides ·',
          '`1:1` avatars and tiles · `3:2` photography · `21:9` marketing hero · `9:16` vertical reels. A',
          'direct `<img>`, `<video>` or `<iframe>` fills the box (`object-fit: cover`); anything else goes in',
          '`AspectRatioFill`. A Card already has a media slot: use this for media that is not a card’s.',
        ].join('\n'),
      },
    },
  },
  args: { ratio: '16:9' },
  argTypes: { ratio: { control: 'inline-radio', options: ['16:9', '4:3', '1:1', '3:2', '21:9', '9:16'] } },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

const Slot = ({ ratio, caption }: { ratio: AspectRatioRatio; caption: string }) => (
  <AspectRatio ratio={ratio}>
    <AspectRatioFill className="gap-2 p-5">
      <Badge tone="info">{ratio.replace(':', ' : ')}</Badge>
      <Text size="sm" tone="secondary" className="text-center">
        {caption}
      </Text>
    </AspectRatioFill>
  </AspectRatio>
);

export const Playground: Story = {
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <AspectRatio {...args}>
        <img src={photo} alt="Electronic City campus at dusk" />
      </AspectRatio>
    </div>
  ),
};

/** The six ratios. */
export const Ratios: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid columns="3">
      <Spec label='ratio="16:9" · video, lecture capture' wide>
        <Slot ratio="16:9" caption="Operating Systems — Week 9 lecture recording, 1h 42m" />
      </Spec>
      <Spec label='ratio="4:3" · slides, screenshots' wide>
        <Slot ratio="4:3" caption="System Design deck — Sharding & Replication, 41 slides" />
      </Spec>
      <Spec label='ratio="1:1" · avatars, thumbnails' wide>
        <Slot ratio="1:1" caption="Mentor portrait — Ritika Bansal" />
      </Spec>
      <Spec label='ratio="3:2" · photography' wide>
        <Slot ratio="3:2" caption="Convocation, Batch of 2028 — Electronic City campus" />
      </Spec>
      <Spec label='ratio="21:9" · the marketing hero band' wide>
        <Slot ratio="21:9" caption="Landing hero — a letterbox band" />
      </Spec>
      <Spec label='ratio="9:16" · vertical reels' wide>
        <Slot ratio="9:16" caption="“A day in Cohort 7” — 48s vertical, cross-posted to Reels and Shorts" />
      </Spec>
    </Grid>
  ),
};

/** A direct `<img>` fills the box and covers: a 16:10 photograph in a 1:1 tile crops, it does not letterbox. */
export const WithImage: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid columns="3">
      {(['16:9', '1:1', '9:16'] as const).map((ratio) => (
        <Spec key={ratio} label={`ratio="${ratio}" · <img> child`} wide>
          <AspectRatio ratio={ratio}>
            <img src={photo} alt="Electronic City campus at dusk" />
          </AspectRatio>
        </Spec>
      ))}
    </Grid>
  ),
};

/** Loading, pending and failed media all hold the final footprint. */
export const LoadingStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid columns="3">
      <Spec label="skeleton inside a reserved 16:9 box" wide>
        <AspectRatio ratio="16:9" aria-busy="true">
          <AspectRatioFill className="justify-items-stretch p-5">
            <Stack gap="2">
              <Skeleton shape="title" className="w-1/2" />
              <Skeleton />
              <Skeleton className="w-2/3" />
            </Stack>
          </AspectRatioFill>
        </AspectRatio>
      </Spec>
      <Spec label="spinner inside a reserved 4:3 box" wide>
        <AspectRatio ratio="4:3">
          <AspectRatioFill>
            <Stack direction="horizontal" gap="2" role="status">
              <Spinner size="sm" />
              <Text size="sm" tone="secondary">
                Transcoding…
              </Text>
            </Stack>
          </AspectRatioFill>
        </AspectRatio>
      </Spec>
      <Spec label="empty / failed media, same footprint" wide>
        <AspectRatio ratio="1:1">
          <AspectRatioFill className="gap-2">
            <Badge tone="danger">Unavailable</Badge>
            <Text size="sm" tone="secondary">
              Recording removed
            </Text>
          </AspectRatioFill>
        </AspectRatio>
      </Spec>
    </Grid>
  ),
};

/** `asChild`: the box is the thumbnail link itself. */
export const AsLink: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <AspectRatio asChild ratio="16:9">
        <a
          href="#lecture-9"
          className="outline-none focus-visible:ring-[3px] focus-visible:ring-border-focus/50"
        >
          <img src={photo} alt="Play: Operating Systems, Week 9 lecture" />
        </a>
      </AspectRatio>
    </div>
  ),
};
