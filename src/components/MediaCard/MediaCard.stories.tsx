import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MediaCard, type MediaCardProps } from './MediaCard';
import { LOGOS, PHOTO, PHOTO_PALE } from '../PhotoFrame/_fixtures/marketing';
import { CardFooter } from '../Card';
import { Badge } from '../Badge';
import { Spec } from '../Icon/_fixtures/story-layout';

/** Auto-fill columns: the card takes its cell's width, never its own. */
const Grid = ({ children, min = 260 }: { children: React.ReactNode; min?: number }) => (
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

/** One cell of a rail: the width the page gives a card. */
const Cell = ({ children, width = 360 }: { children: React.ReactNode; width?: number }) => (
  <div style={{ maxWidth: width }}>{children}</div>
);

const NEWS = {
  ratio: '16:9',
  image: PHOTO,
  eyebrow: 'Economic Times',
  title: 'A business school where students ship products before they graduate',
  description:
    'The school’s first cohort spent its first term building and selling a product, then took a brief from a founder and defended it in front of the founding team. Its second has doubled in size.',
  descriptionLines: 3,
  href: 'https://example.com/news',
} satisfies MediaCardProps;

const SESSION = {
  ratio: '16:9',
  image: PHOTO,
  eyebrow: 'Founder, Bluepeak',
  title: 'Ankit Mehra',
  description: 'How a two-person team found its first hundred customers without a sales hire.',
  logos: [LOGOS[1]!],
  videoUrl: 'https://example.com/session',
} satisfies MediaCardProps;

const IMMERSION = {
  copy: 'plate',
  size: 'md',
  ratio: '4:3',
  image: PHOTO_PALE,
  title: 'Silicon Valley immersion',
  description: 'Two weeks with the founders and operators of the Bay Area’s AI companies.',
} satisfies MediaCardProps;

const PROJECT = {
  copy: 'overlay',
  ratio: '3:4',
  image: PHOTO,
  company: 'Northwind',
  title: 'Pricing a quick-commerce subscription',
  description: 'Size the market, model three price points and defend one to the founders.',
} satisfies MediaCardProps;

const meta = {
  title: 'Marketing/MediaCard',
  component: MediaCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Media, then copy: `Card` with the marketing slots (a glass **tag**, a **figure** on the blur, a **play**',
          'control, **logos**, a **company** line) and three places for the copy: **`below`** the media in a',
          '`CardBody` (news, sessions), on a glass **`plate`** over its foot (the immersion feature), or',
          '**`overlay`** on the photo over a progressive blur (live projects).',
          '',
          'Flat props, a blok’s fields; every optional slot omitted is a variant (no `image`: the frame’s ground;',
          'no `figure`: no blur under `below`). `size="md"` sets the title at the h1 role. `href` links the title;',
          'with `hrefLabel` an arrow link carries the words instead. `videoUrl` lays a play disc on the media;',
          '`playSlot` replaces it (an in-place player). Width comes from the cell. Markers, no motion:',
          '`data-slot="media-card[-part]"` and `data-part`.',
        ].join('\n'),
      },
    },
  },
  args: {
    copy: 'below',
    ratio: '4:3',
    size: 'sm',
    image: PHOTO,
    title: 'A business school where students ship products before they graduate',
    description: 'The first cohort built and sold a product in its first term.',
  },
  argTypes: {
    copy: { control: 'inline-radio', options: ['below', 'plate', 'overlay'] },
    ratio: { control: 'select', options: ['16:9', '4:3', '3:2', '1:1', '4:5', '3:4'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    descriptionLines: { control: 'inline-radio', options: [undefined, 2, 3] },
    as: { control: 'inline-radio', options: ['article', 'li', 'div'] },
    playSlot: { control: false },
    logos: { control: 'object' },
  },
  render: (args) => (
    <Cell>
      <MediaCard {...args} />
    </Cell>
  ),
} satisfies Meta<typeof MediaCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { eyebrow: 'Economic Times' },
};

/** In the news: 16:9, the outlet as the eyebrow, the line clamped to three lines, the title linked. */
export const News: Story = {
  args: NEWS,
  render: (args) => (
    <Grid>
      <MediaCard {...args} />
      <MediaCard {...args} title="Short headline" description="One line." />
      <MediaCard {...args} hrefLabel="Read on Economic Times" />
    </Grid>
  ),
};

/** A recorded session: the speaker as the title, their role as the eyebrow, one logo, a play disc. */
export const Session: Story = {
  args: SESSION,
  render: (args) => (
    <Grid>
      <MediaCard {...args} />
      <MediaCard {...args} title="Priya Raman" eyebrow="Partner, Verdant" logos={[LOGOS[2]!]} description="Short." />
    </Grid>
  ),
};

/**
 * `playSlot`: the page's own control in place of the disc (here a stand-in
 * button; the page swaps a player into the media).
 */
export const PlaySlot: Story = {
  args: {
    ...SESSION,
    playSlot: (
      <button type="button" className="size-full cursor-pointer" aria-label="Play Ankit Mehra here">
        <Badge tone="glassDark">Play in place</Badge>
      </button>
    ),
  },
};

/** The immersion feature: `copy="plate"`, `size="md"`, 4:3. A pale photo: the plate is the fixed dark one. */
export const ImmersionFeature: Story = {
  args: IMMERSION,
  render: (args) => (
    <Grid min={320}>
      <MediaCard {...args} />
      <MediaCard {...args} image={PHOTO} title="Bengaluru founders’ week" />
    </Grid>
  ),
};

/** A live project: `copy="overlay"`, 3:4, the company over a hairline above the brief. */
export const LiveProject: Story = {
  args: PROJECT,
  render: (args) => (
    <Grid min={240}>
      <MediaCard {...args} />
      <MediaCard {...args} image={PHOTO_PALE} company="Bluepeak" title="Launching in tier-2 cities" />
      <MediaCard {...args} image={undefined} company="Verdant" title="No photo yet: the plate" />
    </Grid>
  ),
};

/** A glass tag on the photo's corner, in every copy placement. */
export const WithTag: Story = {
  render: () => (
    <Grid>
      <MediaCard {...NEWS} tag="Highlight" />
      <MediaCard {...IMMERSION} size="sm" tag="Immersion" />
      <MediaCard {...PROJECT} tag="Consulting" />
    </Grid>
  ),
};

/** A figure: on the media's foot over a blur under `below`; with the copy on a plate or the photo. */
export const WithFigure: Story = {
  render: () => (
    <Grid>
      <MediaCard {...NEWS} figure="₹50L" figureLabel="offered on Shark Tank India" />
      <MediaCard {...IMMERSION} size="sm" figure="12" figureLabel="founders met" />
      <MediaCard {...PROJECT} figure="3×" figureLabel="the pilot’s conversion" />
    </Grid>
  ),
};

/** No image: the sunken ground under copy `below`, the fixed dark plate under white copy. */
export const NoImage: Story = {
  render: () => (
    <Grid>
      <MediaCard {...NEWS} image={undefined} />
      <MediaCard {...IMMERSION} size="sm" image={undefined} />
      <MediaCard {...PROJECT} image={undefined} />
    </Grid>
  ),
};

/** `sm` against `md`, in each placement: the title at the h3 role, then the h1. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid min={300}>
      {(['below', 'plate', 'overlay'] as const).map((copy) =>
        (['sm', 'md'] as const).map((size) => (
          <Spec key={`${copy}-${size}`} label={`${copy} · ${size}`}>
            <MediaCard
              copy={copy}
              size={size}
              ratio="4:3"
              image={copy === 'plate' ? PHOTO_PALE : PHOTO}
              eyebrow={copy === 'below' ? 'Immersion' : undefined}
              title="Silicon Valley immersion"
              description="Two weeks with the founders and operators of the Bay Area’s AI companies."
            />
          </Spec>
        )),
      )}
    </Grid>
  ),
};

/** Logos at the foot (under `below` they line up across a row), and `children` after the flat parts. */
export const LogosAndFooter: Story = {
  render: () => (
    <Grid>
      <MediaCard {...SESSION} logos={LOGOS.slice(0, 3)} videoUrl={undefined} />
      <MediaCard {...SESSION} description="A shorter line." videoUrl={undefined}>
        <CardFooter>
          <Badge tone="brand">Recorded</Badge>
        </CardFooter>
      </MediaCard>
      <MediaCard {...PROJECT} logos={LOGOS.slice(0, 3)} />
    </Grid>
  ),
};

/**
 * A phone's column (360px): each placement as a rail shows it there. Pick
 * Mobile S (320) in the toolbar to see it at the narrowest.
 */
export const Phone: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ maxWidth: 360, display: 'grid', gap: 'var(--space-6)' }}>
      <MediaCard {...NEWS} />
      <MediaCard {...SESSION} />
      <MediaCard {...IMMERSION} />
      <MediaCard {...PROJECT} ratio="4:5" />
    </div>
  ),
};
