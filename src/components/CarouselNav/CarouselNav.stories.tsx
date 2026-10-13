import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { CarouselNav, type CarouselNavProps } from './CarouselNav';

const meta = {
  title: 'Marketing/CarouselNav',
  component: CarouselNav,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          "A carousel's controls: a pill of dots between two arrows. The current dot stretches into a track that",
          'fills: on a timer (`interval`, a CSS keyframe, frozen unless `running`, `onFillEnd` on its end), by value',
          '(`progress`, 0–1, a row that moves continuously), or simply full. Controlled: `Rail` drives it, and so can',
          'any carousel.',
          '',
          'Dots are buttons named "<itemName> N of count"; arrows "Previous / Next <itemName>", `aria-disabled` at',
          'the ends. Reduced motion: no fill animation, the current dot full. `tone="dark"` over a photo or a dark',
          'band (the on-image glass). No entrance animation: `data-shown` is always set, for the motion layer.',
        ].join('\n'),
      },
    },
  },
  args: {
    count: 5,
    active: 1,
    itemName: 'mentor',
    tone: 'light',
    running: false,
    atStart: false,
    atEnd: false,
    onSelect: () => {},
    onPrev: () => {},
    onNext: () => {},
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['light', 'dark'] },
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    interval: { control: 'number' },
  },
} satisfies Meta<typeof CarouselNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/** At rest: the current dot full. */
export const Default: Story = {};

/** A carousel driving it: the fill is the clock, and its end (`onFillEnd`) moves to the next slide. */
export const Timed: Story = {
  args: { interval: 3000, running: true },
  render: function Render(args: CarouselNavProps) {
    const [active, setActive] = React.useState(0);
    const last = args.count - 1;
    return (
      <CarouselNav
        {...args}
        active={active}
        onSelect={setActive}
        onPrev={() => setActive((i) => (i === 0 ? last : i - 1))}
        onNext={() => setActive((i) => (i === last ? 0 : i + 1))}
        onFillEnd={() => setActive((i) => (i === last ? 0 : i + 1))}
      />
    );
  },
};

/** The fill following a value (a ticker row's position through its page). */
export const Progress: Story = {
  args: { progress: 0.4 },
};

/** At the first slide of a row that does not loop: the previous arrow is aria-disabled. */
export const AtStart: Story = {
  args: { active: 0, atStart: true },
};

/** Many dots pack tighter, so the pill and arrows still fit a phone. */
export const ManyDots: Story = {
  args: { count: 14, active: 6 },
};

/** Arrows only (`dots={false}`). */
export const ArrowsOnly: Story = {
  args: { dots: false },
};

/** The dark tone over a dark band: brand and theme on one element make it a dark island. */
export const Dark: Story = {
  args: { tone: 'dark', interval: 4000, running: true },
  render: (args, { globals }) => (
    <div data-brand={String(globals.brand ?? 'sst')} data-theme="dark" className="bg-surface p-8">
      <CarouselNav {...args} />
    </div>
  ),
};
