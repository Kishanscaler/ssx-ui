import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ShowcaseCard } from './ShowcaseCard';
import { PHOTO, PHOTO_PALE } from '../PhotoFrame/_fixtures/marketing';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

/* Stand-ins. The hexes are the stand-ins' artwork and a company's own colours (content). */
const svg = (body: string, w: number, h: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`)}`;

/** A wide startup banner: a white wordmark on a two-colour gradient, 1133 x 542 as the page's. */
const BANNER = svg(
  '<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#981619"/><stop offset="1" stop-color="#AF4446"/></linearGradient></defs>' +
    '<rect width="1133" height="542" fill="url(#b)"/>' +
    '<circle cx="330" cy="271" r="70" fill="none" stroke="#fff" stroke-width="22"/>' +
    '<text x="430" y="300" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="104" fill="#fff">gahan.ai</text>',
  1133,
  542,
);

const face = (bg: string, skin: string) =>
  svg(`<rect width="64" height="64" fill="${bg}"/><circle cx="32" cy="26" r="13" fill="${skin}"/><rect x="12" y="42" width="40" height="30" rx="15" fill="${skin}"/>`, 64, 64);

const AVATAR_A = face('#2E5E8C', '#E8B48A');
const AVATAR_B = face('#6B3E7A', '#C98E6B');
/** The channel mark: a monogram on white, as the page's SSB shield in a ringed circle. */
const CHANNEL = svg('<rect width="64" height="64" fill="#fff"/><path d="M20 14h24v22c0 8-6 13-12 15-6-2-12-7-12-15z" fill="#0E5B33"/>', 64, 64);

const meta = {
  title: 'Marketing/ShowcaseCard',
  component: ShowcaseCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A venture, a club or a challenge: a **square inset at the start** (a photo, a startup\'s two-colour',
          '**banner**, or the dark plate), a light glass **tag** at its top, a **figure** in white at its foot',
          '(with a figure the photo blurs toward its foot under a scrim; without one it is plain), a **play**',
          'disc with `videoUrl` (the family\'s dark glass disc, same tab, "Play: <title>"; `playSlot` replaces it);',
          'beside it the **title** (a link with `href`, named by the title), the **people** (32px photos, initials',
          'until there is one) with `peopleRole`, and at the foot, level with the figure, the **description** and,',
          'with `hrefLabel`, a quiet arrow link with those words (the title then stays plain). Every optional slot',
          'omitted is a variant; an empty string is unset.',
          '',
          'Width comes from the cell. The card is a size container: from 480px of its own width it is a row (the',
          'square two fifths); narrower it stacks, the media a 16:9 cut. Markers only, no motion.',
        ].join('\n'),
      },
    },
  },
  args: {
    title: 'Hummusapiens',
    tag: 'Food & beverage',
    image: PHOTO,
    figure: '₹50L',
    figureLabel: 'offered on Shark Tank India',
    people: [{ name: 'Aashish US', avatar: AVATAR_A }, { name: 'Moh Agarwal', avatar: AVATAR_B }],
    peopleRole: 'Cohort 1',
    description: 'Hummus in jars, made fresh and sold across Bengaluru’s cafés and stores.',
    href: 'https://example.com',
    titleAs: 'h3',
    as: 'article',
  },
  argTypes: {
    as: { control: 'inline-radio', options: ['article', 'li', 'div'] },
    titleAs: { control: 'inline-radio', options: ['h2', 'h3', 'h4'] },
    people: { control: 'object' },
    playSlot: { control: false },
  },
  decorators: [
    // The Rail's width, 38rem; the layout stories set their own (`parameters.ownWidth`).
    (Story, { parameters }) =>
      parameters.ownWidth ? (
        <Story />
      ) : (
        <div style={{ width: '100%', maxWidth: '38rem' }}>
          <Story />
        </div>
      ),
  ],
} satisfies Meta<typeof ShowcaseCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A student venture: photo, tag, figure on the blur, founders, the line, a link to its site. */
export const Venture: Story = {};

/** A startup with a wide logo banner: the square in its two colours, the banner across its middle. */
export const StartupBanner: Story = {
  args: {
    title: 'Gahan AI',
    tag: 'Defence tech',
    image: undefined,
    figure: undefined,
    figureLabel: undefined,
    banner: BANNER,
    bannerTop: '#981619',
    bannerBottom: '#AF4446',
    people: [{ name: 'Ravi Shankar' }, { name: 'Vikas Bansal' }],
    peopleRole: 'Ex-Google, ex-Microsoft',
    description: 'Computer vision for drones that see through cloud and smoke.',
  },
};

/** A club: photo, tag, title, line. No figure (so no blur), no people, no link. */
export const Club: Story = {
  args: {
    title: 'The Debate Society',
    tag: 'Club',
    image: PHOTO_PALE,
    figure: undefined,
    figureLabel: undefined,
    people: undefined,
    peopleRole: undefined,
    href: undefined,
    description: 'Weekly motions, inter-college rounds and a parliamentary final every term.',
  },
};

/** A challenge: a play disc linking to the video, the channel as the person, its facts as the role line. */
export const Challenge: Story = {
  args: {
    title: 'Sell a pen to a VC in 60 seconds',
    tag: 'Challenge 04',
    image: PHOTO,
    figure: '3.2K',
    figureLabel: 'views in the first week',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    people: [{ name: 'Scaler School of Business', avatar: CHANNEL }],
    peopleRole: '761 views · 10 months ago · 4:12',
    href: undefined,
    description: 'Students pitch an everyday object to a working investor, live, on the clock.',
  },
};

/** `hrefLabel`: the title stays plain and a quiet arrow link with those words sits at the foot. */
export const ActionLink: Story = {
  args: { hrefLabel: 'Visit Hummusapiens' },
};

/** The play disc on a pale photo and on the plate: the dark glass reads on both. */
export const PlayOnPale: Story = {
  args: {
    ...Challenge.args,
    image: PHOTO_PALE,
  },
};

/** `playSlot` replaces the default disc: the page's own lightbox button. */
export const CustomPlaySlot: Story = {
  args: {
    ...Challenge.args,
    playSlot: (
      <button
        type="button"
        style={{
          padding: 'var(--space-2) var(--space-4)',
          borderRadius: 'var(--radius-full)',
          background: 'var(--glass-surface)',
          color: 'var(--content-primary)',
          border: 0,
          font: 'inherit',
          cursor: 'pointer',
        }}
      >
        Watch the clip
      </button>
    ),
  },
};

/** No photo and no banner: the fixed dark plate, the figure in white on it. */
export const NoPhoto: Story = {
  args: { image: undefined, figure: '₹1Cr+', figureLabel: 'annual recurring revenue', title: 'Gredo' },
};

/** No tag. */
export const NoTag: Story = { args: { tag: undefined } };

/** No figure: the photo is plain, no blur, no scrim. */
export const NoFigure: Story = { args: { figure: undefined, figureLabel: undefined } };

/** No people: the description still sits at the foot. Initials stand in for missing photos meanwhile. */
export const NoPeople: Story = { args: { people: undefined, peopleRole: undefined } };

/** Initials until there is a photo: they keep clear of a neighbour rather than overlap it. */
export const Initials: Story = {
  args: {
    people: [{ name: 'Mayank Kelwani' }, { name: 'Sanskriti Deshmukh', avatar: AVATAR_B }, { name: 'Ravi Kumar' }],
    peopleRole: 'Cohort 1',
  },
};

/** At the Rail's width (38rem), three cards: the page's row. */
export const RailWidth: Story = {
  parameters: { controls: { disable: true }, ownWidth: true },
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', paddingBottom: 'var(--space-4)' }}>
      {[Venture.args, StartupBanner.args, Challenge.args].map((args, i) => (
        <div key={i} style={{ flex: '0 0 38rem', maxWidth: '100%', display: 'flex' }}>
          <ShowcaseCard {...meta.args} {...args} />
        </div>
      ))}
    </div>
  ),
};

/** On a phone (360px): the card stacks, its media a 16:9 cut over the copy. */
export const Phone: Story = {
  parameters: { controls: { disable: true }, ownWidth: true },
  render: () => (
    <Stack gap={24}>
      {[Venture.args, StartupBanner.args, Club.args, NoPhoto.args].map((args, i) => (
        <Spec key={i} label={['venture', 'banner', 'club', 'plate'][i]!}>
          <div style={{ width: 360, maxWidth: '100%' }}>
            <ShowcaseCard {...meta.args} {...args} />
          </div>
        </Spec>
      ))}
    </Stack>
  ),
};
