import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Marquee } from './Marquee';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Logo } from '../Logo';
import { Stack } from '../Stack';
import { Text } from '../Text';

const meta = {
  title: 'Motion/Marquee',
  component: Marquee,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A row that slides past on a loop: a logo strip, a row of pills. Pass the items as **direct children**.',
          'It repeats the row as often as it takes to cover the box, so no gap opens at the trailing edge, and',
          'moves at its `speed` however long the row is: `slow` · `medium` (default) · `fast` · `ultrafast`, each twice',
          'the one before (about 30 · 60 · 120 · 240px/s on a pill row).',
          '',
          '**By hand:** drag it, swipe it, or scroll it sideways with a trackpad (or shift + wheel), either way,',
          'forever; a flick glides to a stop. Taps and clicks on items still work, and vertical scrolling is untouched.',
          '',
          '**Hover:** it brakes smoothly — to a stop (`hover="pause"`, default) or to a crawl it keeps moving at',
          '(`hover="slow"`) — and picks back up when the pointer leaves. Focus inside always brakes it to a stop.',
          '',
          'Only the first copy is exposed to assistive tech; repeats are `aria-hidden` and `inert`. `paused` stops',
          'it (wire a pause button to it). Under reduced motion it never moves on its own, but still moves by hand.',
          'CSS-animated (the hand and the brake drive the CSS animation\'s own clock): no GSAP.',
        ].join('\n'),
      },
    },
  },
  args: { gap: '8', speed: 'medium', direction: 'forward', hover: 'pause', paused: false, scrollable: true },
  argTypes: {
    gap: { control: 'inline-radio', options: ['2', '4', '6', '8', '12'] },
    direction: { control: 'inline-radio', options: ['forward', 'reverse'] },
    speed: { control: 'inline-radio', options: ['slow', 'medium', 'fast', 'ultrafast'] },
    hover: { control: 'inline-radio', options: ['pause', 'slow', 'none'] },
  },
} satisfies Meta<typeof Marquee>;

export default meta;
type Story = StoryObj<typeof meta>;

const topics = ['Data structures', 'System design', 'Machine learning', 'Product analytics', 'Cloud'];

/** Five pills: about 485px of row, repeated to fill a wide screen. */
export const PillRow: Story = {
  render: (args) => (
    <Marquee {...args} aria-label="What you will learn">
      {topics.map((t) => (
        <Badge key={t} size="lg">
          {t}
        </Badge>
      ))}
    </Marquee>
  ),
};

/** The four speeds, side by side. */
export const Speeds: Story = {
  render: (args) => (
    <Stack gap="6">
      {(['slow', 'medium', 'fast', 'ultrafast'] as const).map((speed) => (
        <Stack key={speed} gap="2">
          <Text size="sm" tone="secondary">
            speed=&quot;{speed}&quot;
          </Text>
          <Marquee {...args} speed={speed} aria-label={`Topics, ${speed}`}>
            {topics.map((t) => (
              <Badge key={t} size="lg">
                {t}
              </Badge>
            ))}
          </Marquee>
        </Stack>
      ))}
    </Stack>
  ),
};

/** `hover="slow"`: brakes to a crawl under the pointer and keeps moving, instead of stopping. */
export const SlowOnHover: Story = {
  args: { hover: 'slow' },
  render: (args) => (
    <Marquee {...args} aria-label="What you will learn">
      {topics.map((t) => (
        <Badge key={t} size="lg">
          {t}
        </Badge>
      ))}
    </Marquee>
  ),
};

/** A logo strip. Two rows running opposite ways is the usual hero arrangement. */
export const LogoStrip: Story = {
  render: (args) => (
    <Stack gap="6">
      <Marquee {...args} aria-label="Our schools">
        {Array.from({ length: 4 }, (_, i) => (
          <Logo key={i} brand={i % 2 ? 'ssb' : 'sst'} size="lg" />
        ))}
      </Marquee>
      <Marquee {...args} direction="reverse" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <Logo key={i} brand={i % 2 ? 'sst' : 'ssb'} size="lg" />
        ))}
      </Marquee>
    </Stack>
  ),
};

/** The page owns the pause: anything that moves for more than five seconds needs one (WCAG 2.2.2). */
export const WithPauseButton: Story = {
  render: (args) => {
    const [paused, setPaused] = React.useState(false);
    return (
      <Stack gap="4" align="start">
        <Marquee {...args} paused={paused} className="w-full" aria-label="What you will learn">
          {topics.map((t) => (
            <Badge key={t} size="lg">
              {t}
            </Badge>
          ))}
        </Marquee>
        <Button variant="secondary" size="sm" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? 'Play' : 'Pause'}
        </Button>
      </Stack>
    );
  },
};

/** Under `data-motion="reduce"` (or the OS setting) it never moves on its own; drag or swipe it by hand. */
export const ReducedMotion: Story = {
  render: (args) => (
    <div data-motion="reduce">
      <Stack gap="2">
        <Text size="sm" tone="secondary">
          data-motion=&quot;reduce&quot;: still on its own; drag, swipe or scroll it sideways.
        </Text>
        <Marquee {...args} aria-label="What you will learn">
          {topics.map((t) => (
            <Badge key={t} size="lg">
              {t}
            </Badge>
          ))}
        </Marquee>
      </Stack>
    </div>
  ),
};
