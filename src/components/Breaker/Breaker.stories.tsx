import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Breaker } from './Breaker';
import { STUDIO, TENT, TESTIMONIALS, WHY_SLIDE } from './_fixtures/breaker';
import { Container } from '../Container';
import { SectionHeader } from '../SectionHeader';

/** A page's sections either side, so the band's foot is seen melting into the page. */
const OnAPage = ({ children }: { children: React.ReactNode }) => (
  <div>
    <Container className="py-12">
      <SectionHeader eyebrow="Alumni" title="Already in the roles" spacing="sm" className="mb-0 sm:mb-0" />
    </Container>
    {children}
    <Container className="py-12">
      <SectionHeader title="Nobody is preparing you for emerging roles" titleSize="1" spacing="sm" className="mb-0 sm:mb-0" />
    </Container>
  </div>
);

const meta = {
  title: 'Marketing/Breaker',
  component: Breaker,
  tags: ['autodocs'],
  parameters: {
    pageLevel: true,
    docs: {
      description: {
        component: [
          'The dark statement band between sections, after Apple\'s product blocks: a clip (or a still) full bleed,',
          'its subject on the left looking right; the words on the right in white over a progressive **frost**; the',
          'picture melting into the page at the band\'s foot only. **One slide** is the Why breaker (eyebrow, the',
          'statement at the display size, who said it, two spec figures). **Several** are the testimonial band: a',
          'person to a slide with a `ProfilePlate`, the page\'s dots under the copy, turning every `interval` (7s) when',
          'the active dot\'s fill ends, so it waits off screen and under reduced motion. No pause under the pointer.',
          '',
          '`media.fit="height"` draws the clip at the band\'s height, feathered into its own poster blurred (a still,',
          'never a second video). `media.bright` (a pale scene) darkens the frost. A slide without media keeps the',
          'first slide\'s; none at all is the dark plate. On a phone the clip is framed at the top over its blurred',
          'poster, and the words sit on a frost rising behind them.',
          '',
          'The words are a dark island (`data-brand` + `data-theme="dark"` + `data-surface-ink="on-image"` on one',
          'element), white in both themes. Composed: `SectionHeader`, `ProfilePlate`, `StatGroup` of ruled `StatCard`s,',
          '`CarouselNav`. Markers: `data-slot="breaker[-media|-stage|-shot|-haze|-clip|-frost|-words|-slide|-say|',
          '-attribution|-profile|-figures|-nav]"`, `data-breaker-part="media|words|attribution|profile|figures"`.',
        ].join('\n'),
      },
    },
  },
  args: {
    label: 'Why the traditional MBA doesn’t work',
    slides: [WHY_SLIDE],
    itemName: 'slide',
    interval: 7000,
  },
  argTypes: {
    slides: { control: false },
    as: { control: 'inline-radio', options: ['section', 'div'] },
    brand: { control: 'inline-radio', options: ['sst', 'ssb'] },
    interval: { control: { type: 'number', step: 500 } },
  },
  render: (args) => (
    <OnAPage>
      <Breaker {...args} />
    </OnAPage>
  ),
} satisfies Meta<typeof Breaker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Why breaker: one slide, the still at the band's height, who said it, two spec figures. */
export const WhyBreaker: Story = {};

/** The testimonial band: three people, the dots under the copy; the second scene is pale (`bright`), the third has no media of its own and keeps the first slide's. */
export const TestimonialBand: Story = {
  args: {
    label: 'Founders and investors on the students',
    itemName: 'person',
    slides: TESTIMONIALS,
  },
};

/** Opened on the pale scene: `media.bright` darkens the frost and puts the profile on the dark plate. */
export const Bright: Story = {
  args: {
    label: 'Founders and investors on the students',
    itemName: 'person',
    slides: TESTIMONIALS,
    defaultIndex: 1,
  },
};

/** `fit="cover"` (the default): the still fills the band. */
export const Cover: Story = {
  args: {
    slides: [{ ...WHY_SLIDE, media: { poster: STUDIO, position: '30% 50%', bright: true } }],
  },
};

/** No media at all: the fixed dark plate under the words. */
export const WithoutMedia: Story = {
  args: {
    label: 'What investors see on campus',
    slides: [
      {
        eyebrow: 'What investors see on campus',
        statement: '“The ideas students shared were grounded in reality.”',
        attribution: '— Sidhant Goyal, Investor',
      },
    ],
  },
};

/** Every optional slot omitted: the statement alone, over a pale still. */
export const StatementOnly: Story = {
  args: {
    label: 'A statement',
    slides: [{ statement: 'Students at SSB didn’t just build careers. They built companies.', media: { poster: TENT, bright: true } }],
  },
};

/** On a phone: the still framed at the top, the words and figures on a frost rising behind them. */
export const Phone: Story = {
  globals: { viewport: { value: 'mobile', isRotated: false } },
};

/** The testimonial band on a phone. */
export const PhoneTestimonial: Story = {
  args: TestimonialBand.args,
  globals: { viewport: { value: 'mobile', isRotated: false } },
};
