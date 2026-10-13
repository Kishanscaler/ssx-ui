import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Rail, RailItem } from './index';
import { Card } from '../Card';
import { Container } from '../Container';
import { Heading } from '../Heading';
import { Text } from '../Text';

const mentors = [
  { name: 'Asha Rao', role: 'Product lead, fintech', line: 'Ran pricing for a payments app used by 40 million people.' },
  { name: 'Bilal Khan', role: 'Growth, consumer apps', line: 'Took a habit app from launch to its first million users.' },
  { name: 'Chitra Iyer', role: 'Strategy, consulting', line: 'Ten years advising retail and logistics leadership teams.' },
  { name: 'Dev Mehta', role: 'Founder, D2C brand', line: 'Built a snack brand into 2,000 stores in three years.' },
  { name: 'Esha Nair', role: 'Investor, early stage', line: 'Backs seed-stage founders in consumer and climate.' },
  { name: 'Farid Ali', role: 'Operations, quick commerce', line: 'Set up dark stores across six cities in a year.' },
  { name: 'Gauri Sen', role: 'Brand, media', line: 'Led campaigns for three of the country’s largest brands.' },
  { name: 'Hari Prasad', role: 'Data, AI products', line: 'Ships the models behind a large marketplace’s search.' },
];

const cards = (n = mentors.length) =>
  mentors.slice(0, n).map((m) => (
    <RailItem key={m.name}>
      <Card as="article" eyebrow={m.role} title={m.name} description={m.line} />
    </RailItem>
  ));

/** A section's header in the page's content column, as a page lays one above a bleeding Rail. */
const Header = ({ title, line }: { title: string; line: string }) => (
  <Container className="pb-8">
    <Heading as="h2" size="2">
      {title}
    </Heading>
    <Text tone="secondary">{line}</Text>
  </Container>
);

const meta = {
  title: 'Marketing/Rail',
  component: Rail,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'One horizontal scroller for every sideways row: free, stepped or ticking; one row or two;',
          'starting on the content column and running off the window\'s edge (`bleed`); with page dots and',
          'arrows under it (`nav`, a `CarouselNav`). A real `ul` scroller, so touch, trackpad and keyboard always work.',
          '',
          '**Width is the Rail\'s** (`itemWidth`: `sm` 20rem · `md` 24 · `lg` 30 · `xl` 38, each at most 82% of',
          'the viewport; `view` a share of the row with the next card peeking, `peek`). Cards fill their `RailItem`.',
          '',
          '**A dot is a page**: the columns the row shows at once, measured, so a phone has more pages than a desktop.',
          '',
          '**Autoplay**, never under reduced motion: `step` (a page every 6s; stops for good on a swipe, a dot or an',
          'arrow; pauses off screen, on a hidden tab, with focus inside; not on hover) or `ticker` (a 32px/s crawl over',
          'looped, inert copies; holds on focus, touch, off screen, `data-ssx-hold`, `data-paused`). Either brings a',
          'pause button (`rail-pause`, `aria-pressed`) into the nav, even with `nav="none"` (WCAG 2.2.2).',
          '',
          'The scroller is a tab stop, so the keyboard can scroll it when its cards hold nothing focusable.',
          '',
          'Place a bleeding Rail outside the page `Container` (it lines up with `Container width="default"`):',
          'it finds the content column itself.',
        ].join('\n'),
      },
    },
  },
  args: {
    label: 'Mentors',
    itemName: 'mentor',
    itemWidth: 'sm',
    rows: 1,
    bleed: true,
    loop: false,
    autoplay: 'none',
    nav: 'dots',
    navTone: 'light',
    snap: true,
  },
  argTypes: {
    itemWidth: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl', 'view'] },
    rows: { control: 'inline-radio', options: [1, 2] },
    autoplay: { control: 'inline-radio', options: ['none', 'step', 'ticker'] },
    nav: { control: 'inline-radio', options: ['none', 'dots', 'arrows', 'both'] },
    navTone: { control: 'inline-radio', options: ['light', 'dark'] },
    peek: { control: { type: 'range', min: 0, max: 0.4, step: 0.02 } },
  },
  decorators: [
    (Story) => (
      <div className="py-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Rail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A free scroller with page dots: swipe, drag a trackpad, or pick a page. */
export const FreeWithDots: Story = {
  render: (args) => (
    <>
      <Header title="Learn from operators" line="People who have run the thing you want to run." />
      <Rail {...args}>{cards()}</Rail>
    </>
  ),
};

/** Stepped autoplay with dots and arrows: a page every 6s, the current dot filling as it waits. */
export const SteppedAutoplay: Story = {
  args: { autoplay: 'step', nav: 'both', itemWidth: 'md' },
  render: (args) => (
    <>
      <Header title="Mentors" line="It moves on by itself until you take over." />
      <Rail {...args}>{cards()}</Rail>
    </>
  ),
};

/** A ticker: a slow crawl over looped copies (only the first set is exposed); the dots follow the row. */
export const Ticker: Story = {
  args: { autoplay: 'ticker', loop: true, nav: 'both' },
  render: (args) => (
    <>
      <Header title="Always moving" line="Holds still on focus, a touch, or off screen." />
      <Rail {...args}>{cards()}</Rail>
    </>
  ),
};

/** A ticker with no nav: the pause button still shows, since anything moving on its own must be stoppable. */
export const TickerPauseOnly: Story = {
  args: { autoplay: 'ticker', nav: 'none' },
  render: (args) => (
    <>
      <Header title="Logos" line="No dots or arrows; the pause button stays." />
      <Rail {...args}>{cards()}</Rail>
    </>
  ),
};

/** The phone stack: each card a share of the row, the next one peeking in, every swipe stopping on a card. */
export const PhoneStack: Story = {
  args: { itemWidth: 'view', peek: 0.14, autoplay: 'step', nav: 'dots' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (args) => (
    <>
      <Header title="On a phone" line="One card, the next peeking in." />
      <Rail {...args}>{cards(5)}</Rail>
    </>
  ),
};

/** Two rows, filled column by column: twice the cards in one fold. */
export const TwoRows: Story = {
  args: { rows: 2, nav: 'both' },
  render: (args) => (
    <>
      <Header title="Alumni" line="Two rows, swiped a column at a time." />
      <Rail {...args}>{cards()}</Rail>
    </>
  ),
};

/** Bleed on (the default) and off: on, the row starts on the content column and runs off the window; off, it stays in its box. */
export const Bleed: Story = {
  args: { nav: 'arrows' },
  render: (args) => (
    <div className="flex flex-col gap-16">
      <div>
        <Header title="bleed (default)" line="Starts on the column, runs off the window's edge." />
        <Rail {...args} label="Mentors, bleeding">
          {cards()}
        </Rail>
      </div>
      <Container>
        <div className="pb-8">
          <Heading as="h2" size="2">
            bleed=false
          </Heading>
          <Text tone="secondary">Inside the container, clipped at its edges.</Text>
        </div>
        <Rail {...args} bleed={false} label="Mentors, in the container">
          {cards()}
        </Rail>
      </Container>
    </div>
  ),
};

/** The dark nav over a dark band (the on-image glass). The band is a dark island: brand and theme on one element. */
export const DarkNav: Story = {
  args: { navTone: 'dark', nav: 'both', itemWidth: 'lg', autoplay: 'step' },
  render: (args, { globals }) => (
    <div data-brand={String(globals.brand ?? 'sst')} data-theme="dark" className="bg-surface py-12">
      <Rail {...args}>{cards()}</Rail>
    </div>
  ),
};
