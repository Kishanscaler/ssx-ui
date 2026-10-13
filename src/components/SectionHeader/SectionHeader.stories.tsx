import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft } from '@phosphor-icons/react';

import { SectionHeader } from './SectionHeader';
import { Button } from '../Button';
import { Container } from '../Container';
import { IconButton } from '../IconButton';
import { Section } from '../Section';
import { ArrowRight, DownloadSimple } from '../Icon/_fixtures/phosphor';

const STAND_IN = {
  sst: new URL('../Card/_fixtures/stand-in-sst.svg', import.meta.url).href,
  ssb: new URL('../Card/_fixtures/stand-in-ssb.svg', import.meta.url).href,
};

const meta = {
  title: 'Marketing/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'The header a marketing section opens with: **eyebrow · title · description**, and an optional **aside**',
          '(arrows, a CTA) at the header\'s foot (`asideAt="end"`), centred on the title\'s line (`"title"`), or under',
          'the copy (`"below"`). Below `sm` the aside always follows the description.',
          '',
          'Flat props, a blok\'s fields: a `\\n` in `title` starts a new line block (a two-line turn), and',
          '`titleAccent` names a phrase in it to set in the accent colour (`--ssx-content-accent`, falling back to',
          '`--content-brand`). Every optional slot omitted is a variant. `titleSize="1"` with `titleAs="h3"` is a',
          'sub-section\'s heading inside a section.',
          '',
          'Markers, not motion: `data-slot="section-header[-part]"` and `data-part="header | eyebrow | headline | sub |',
          'controls"` (plus the transitional `data-enter`, the same values). Pair it with `Section` and `Container`;',
          'pass `titleId` and point the Section\'s `aria-labelledby` at it.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    (Story) => (
      <Section density="roomy">
        <Container>
          <Story />
        </Container>
      </Section>
    ),
  ],
  args: {
    eyebrow: 'Placements',
    title: 'Where our students go',
    description:
      'Our first cohort went into roles at India’s fastest-growing companies, from AI startups to the consulting majors.',
    titleAs: 'h2',
    titleSize: 'display',
    descriptionSize: 'lg',
    align: 'start',
    asideAt: 'end',
    spacing: 'md',
  },
  argTypes: {
    titleAs: { control: 'inline-radio', options: ['h1', 'h2', 'h3'] },
    titleSize: { control: 'inline-radio', options: ['display', '1'] },
    descriptionSize: { control: 'inline-radio', options: ['md', 'lg'] },
    align: { control: 'inline-radio', options: ['start', 'center'] },
    asideAt: { control: 'inline-radio', options: ['end', 'title', 'below'] },
    spacing: { control: 'inline-radio', options: ['sm', 'md'] },
    aside: { control: false },
  },
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const Arrows = () => (
  <div className="flex gap-2">
    <IconButton variant="secondary" aria-label="Previous story">
      <ArrowLeft />
    </IconButton>
    <IconButton variant="secondary" aria-label="Next story">
      <ArrowRight />
    </IconButton>
  </div>
);

const Report = () => (
  <Button variant="secondary" size="lg">
    Download the report
    <DownloadSimple />
  </Button>
);

/** Eyebrow, title and description: the page's section header. */
export const Default: Story = {};

/** Every slot omitted but the title. */
export const TitleOnly: Story = {
  args: { eyebrow: undefined, description: undefined },
};

/** No eyebrow: the title leads. */
export const WithoutEyebrow: Story = {
  args: { eyebrow: undefined },
};

/** No description: eyebrow and title. */
export const WithoutDescription: Story = {
  args: { description: undefined },
};

/** `asideAt="end"`: the carousel's arrows level with the header's foot, from `sm`. */
export const AsideAtEnd: Story = {
  args: { asideAt: 'end', aside: <Arrows /> },
};

/** `asideAt="title"`: the report CTA centred on the title's line, at the far end. */
export const AsideAtTitle: Story = {
  args: { asideAt: 'title', aside: <Report /> },
};

/** `asideAt="title"` with no eyebrow: the aside moves up to the title's row with it. */
export const AsideAtTitleWithoutEyebrow: Story = {
  args: { asideAt: 'title', eyebrow: undefined, aside: <Report /> },
};

/** `asideAt="below"`: the aside under the description at every width. */
export const AsideBelow: Story = {
  args: { asideAt: 'below', aside: <Report /> },
};

/** `align="center"`: the copy centred; an aside goes under it, centred. */
export const Centered: Story = {
  args: { align: 'center', aside: <Report /> },
};

/** `descriptionSize="md"`: the SSB page's quieter sub-line, at the body size. */
export const QuietDescription: Story = {
  args: { descriptionSize: 'md' },
};

/**
 * The two-line turn: `\n` in the title, the second line's last word in the
 * accent colour (Beyond Placements). No eyebrow, no description.
 */
export const TwoLineTurnWithAccent: Story = {
  args: {
    eyebrow: undefined,
    description: undefined,
    title: 'Students at SSB didn’t just build careers.\nThey built companies.',
    titleAccent: 'companies.',
    titleId: 'beyond-title',
  },
};

/**
 * `titleSize="1"`, `titleAs="h3"`, `spacing="sm"`: a sub-section's heading
 * inside a section (the Innovation Lab's startups), with its accent phrase.
 */
export const SubSection: Story = {
  args: {
    eyebrow: undefined,
    description: undefined,
    titleAs: 'h3',
    titleSize: '1',
    spacing: 'sm',
    title: 'Network with industry leaders\nincubated in our startup ecosystem.',
    titleAccent: 'industry leaders',
  },
};

/** Both title sizes, one over the other. */
export const TitleSizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <>
      <SectionHeader {...args} titleSize="display" titleAs="h2" />
      <SectionHeader {...args} titleSize="1" titleAs="h3" spacing="sm" />
    </>
  ),
};

/**
 * Over a photo: the region declares `data-surface-ink="on-image"` and paints
 * its scrim; the eyebrow and accent turn to the on-image ink, the title and
 * the sub-line pick their own on-image inks. Nothing re-points them.
 */
export const OnImage: Story = {
  args: {
    eyebrow: 'Why the traditional MBA doesn’t work',
    title: 'If you’re 25 and going to an MBA college today…',
    titleAccent: 'MBA college',
    description: 'Nikhil Kamath, at Zerodha’s fifteenth-anniversary AMA, October 2025.',
    aside: <Arrows />,
  },
  render: (args, { globals }) => {
    const photo = STAND_IN[(globals.brand as 'sst' | 'ssb') ?? 'sst'];
    return (
      <div
        data-surface-ink="on-image"
        className="relative isolate overflow-hidden rounded-lg bg-surface-inverse-sunken bg-cover bg-center px-6 pt-24 pb-6 text-on-image-ink"
        style={{ backgroundImage: `url(${JSON.stringify(photo)})` }}
      >
        <div
          aria-hidden
          className="absolute inset-0 z-below bg-linear-to-t from-surface-image-scrim from-50% to-transparent"
        />
        <SectionHeader {...args} spacing="sm" />
      </div>
    );
  },
};
