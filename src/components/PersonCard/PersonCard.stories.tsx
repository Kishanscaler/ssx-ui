import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PersonCard } from './PersonCard';
import { LOGOS, PHOTO, PHOTO_PALE, SQUARE_LOGO } from '../PhotoFrame/_fixtures/marketing';

/**
 * The stand-in scene has its person a third of the way across: every
 * portrait crop keeps them in frame with this position.
 */
const PERSON = '37% 40%';

/**
 * A cell of a set width: the card takes its cell's width, never its own.
 * Inline styles: canvas, not component (kept out of the Tailwind scan).
 */
const Cell = ({ children, width }: { children: React.ReactNode; width: string }) => (
  <div style={{ width: `min(100%, ${width})` }}>{children}</div>
);

/** Cells side by side, wrapping: a row of cards at the page's widths. */
const Row = ({ children, min = '15rem' }: { children: React.ReactNode; min?: string }) => (
  <div
    style={{
      display: 'grid',
      gap: 'var(--space-4)',
      gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}, 100%), 1fr))`,
      alignItems: 'start',
    }}
  >
    {children}
  </div>
);

const meta = {
  title: 'Marketing/PersonCard',
  component: PersonCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A person: faculty, a mentor, an alumna, a creator. Three shapes (`layout`): **overlay** (the photo is',
          'the card, the copy at its foot over a progressive blur, white in both themes), **stacked** (the photo',
          'above the copy, on the card surface) and **split** (the photo beside the copy; a container query stacks',
          'it below 18rem of its own width). Every optional slot omitted is a variant: no `image` is the plate with',
          'the initials; `headline` leads when given and the name drops to a byline; the move renders only with',
          'both ends. Width comes from the cell. Markers (`data-slot="person-card[-part]"`, `data-part`), no motion.',
          '',
          "The SSB page's dark faculty and alumni cards are the split card in a dark island:",
          '`data-brand="ssb" data-theme="dark"` on it or an ancestor (see *Faculty, dark island*).',
        ].join('\n'),
      },
    },
  },
  decorators: [
    (Story, { parameters }) => <Cell width={(parameters.cellWidth as string | undefined) ?? '20rem'}>{Story()}</Cell>,
  ],
  args: {
    name: 'Priya Raman',
    role: 'VP Growth, Northwind',
    image: PHOTO,
    imagePosition: PERSON,
    layout: 'overlay',
    align: 'start',
    size: 'md',
    as: 'article',
  },
  argTypes: {
    layout: { control: 'inline-radio', options: ['overlay', 'stacked', 'split'] },
    align: { control: 'inline-radio', options: ['start', 'center'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    as: { control: 'inline-radio', options: ['article', 'li', 'div'] },
    logos: { control: 'object' },
    figures: { control: 'object' },
  },
} satisfies Meta<typeof PersonCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The faculty row's card: "Meet", the name, the role in capitals, the company's tile; left-aligned. */
export const MeetRow: Story = {
  args: { eyebrow: 'Meet', logos: [LOGOS[0]!] },
};

/** Two companies: two tiles side by side, each on its brand's colour. */
export const MeetRowTwoLogos: Story = {
  args: { eyebrow: 'Meet', role: 'Founder, Bluepeak · ex-Northwind', logos: [LOGOS[1]!, LOGOS[0]!] },
};

/** The phone's card: the same, centred (`align="center"`). */
export const MeetPhone: Story = {
  parameters: { cellWidth: '18rem' },
  args: { eyebrow: 'Meet', align: 'center', logos: [LOGOS[0]!] },
};

/** `stacked`: the photo above, then the name, role, logo and a line, on the card surface. */
export const MeetStacked: Story = {
  args: {
    layout: 'stacked',
    logos: [LOGOS[2]!],
    bio: 'Built the growth team from five to sixty; teaches the term on pricing and retention.',
  },
};

/** The mentors' compact card: `size="sm"`, four across a row. */
export const MentorCompact: Story = {
  parameters: { cellWidth: '13rem' },
  args: { size: 'sm', name: 'Arjun Mehta', role: 'Director, Bluepeak' },
};

/** A row of the compact cards, with and without a tile. */
export const MentorRow: Story = {
  parameters: { cellWidth: '60rem', controls: { disable: true } },
  render: (args) => (
    <Row min="12rem">
      <PersonCard {...args} size="sm" name="Arjun Mehta" role="Director, Bluepeak" />
      <PersonCard {...args} size="sm" name="Kavya Iyer" role="Head of Brand, Verdant" logos={[LOGOS[2]!]} />
      <PersonCard {...args} size="sm" name="Rohan Das" role="Partner, Halcyon" logos={[LOGOS[4]!]} />
      <PersonCard {...args} size="sm" name="Meera Nair" role="CPO, Prism Labs" image={undefined} />
    </Row>
  ),
};

/**
 * The faculty card: `split`, the course as the `headline`, "by" the name, a
 * rule, the credentials, the company's tile at the foot.
 */
export const Faculty: Story = {
  parameters: { cellWidth: '24rem' },
  args: {
    layout: 'split',
    headline: 'Pricing and Growth Strategy',
    role: 'VP Growth at Northwind; built its subscription business from zero to ₹400 Cr.',
    logos: [LOGOS[0]!],
  },
};

/** The faculty card in a dark island, as the SSB page draws it: the same card, the theme forced dark. */
export const FacultyDarkIsland: Story = {
  parameters: { cellWidth: '24rem' },
  args: { ...Faculty.args },
  render: (args, { globals }) => (
    <div data-brand={(globals.brand as string) ?? 'ssb'} data-theme="dark">
      <PersonCard {...args} />
    </div>
  ),
};

/**
 * The alumni card: `split`, the role now as the `headline`, the name under it
 * (`bylinePrefix=""`), then the move: after SSB (the company's mark) over
 * before SSB (a briefcase), joined by a caret.
 */
export const Alumni: Story = {
  parameters: { cellWidth: '24rem' },
  args: {
    layout: 'split',
    name: 'Ananya Gupta',
    role: undefined,
    headline: 'Brand Marketing at Prism Labs',
    bylinePrefix: '',
    moveFrom: 'Analyst, Deloitte',
    moveTo: 'Prism Labs',
    moveToLogo: SQUARE_LOGO,
    moveFromLabel: 'Before SSB',
    moveToLabel: 'After SSB',
  },
};

/** The split card in a narrow cell (16rem): it stacks, photo on top. */
export const SplitNarrow: Story = {
  parameters: { cellWidth: '16rem' },
  args: { ...Faculty.args },
};

/**
 * The creator card: `overlay`, centred, a solid "Creator" badge, the name,
 * the niche, and three achievements on a glass plate at the foot.
 */
export const Creator: Story = {
  parameters: { cellWidth: '20rem' },
  args: {
    align: 'center',
    badge: 'Creator',
    name: 'Paritosh Sinha',
    role: 'Personal finance',
    figures: [
      { value: '200K', label: 'Followers' },
      { value: '12M', label: 'Views' },
      { value: '40+', label: 'Brand deals' },
    ],
  },
};

/** The plainest card: `stacked`, a name and a role. */
export const Plain: Story = {
  args: { layout: 'stacked', name: 'Sanjay Kumar', role: 'Founding team' },
};

/** No `image`, overlay: the plate, the initials where the face would be. */
export const NoPhotoOverlay: Story = {
  args: { image: undefined, eyebrow: 'Meet', logos: [LOGOS[0]!] },
};

/** No `image`, stacked: the plate with the initials. */
export const NoPhotoStacked: Story = {
  args: { layout: 'stacked', image: undefined, logos: [LOGOS[2]!] },
};

/** No `image`, split: the plate with the initials, beside the copy. */
export const NoPhotoSplit: Story = {
  parameters: { cellWidth: '24rem' },
  args: { ...Alumni.args, image: undefined },
};

/** A pale photo, a field tag on it, and a link: the heading's link (named by the heading) covers the card. */
export const LinkedWithTag: Story = {
  args: {
    layout: 'stacked',
    image: PHOTO_PALE,
    imagePosition: '70% 40%',
    tag: 'Cohort 1',
    href: '#priya',
  },
};

/**
 * `hrefLabel`: the heading stays plain and a quiet arrow link with those
 * words sits at the copy's foot, stretched over the whole card, in every
 * layout (MediaCard's and ShowcaseCard's `hrefLabel` too).
 */
export const ActionLink: Story = {
  parameters: { cellWidth: '72rem', controls: { disable: true } },
  render: (args) => (
    <Row min="17rem">
      <PersonCard {...args} layout="overlay" eyebrow="Meet" href="#priya" hrefLabel="Read her story" />
      <PersonCard
        {...args}
        layout="stacked"
        logos={[LOGOS[0]!]}
        bio="A line or two about her."
        href="#priya"
        hrefLabel="Read her story"
      />
      <PersonCard
        {...args}
        layout="split"
        headline="Pricing and Growth Strategy"
        logos={[LOGOS[0]!]}
        href="#priya"
        hrefLabel="See the course"
      />
    </Row>
  ),
};

/** Every layout, side by side, on the same fields. */
export const Layouts: Story = {
  parameters: { cellWidth: '72rem', controls: { disable: true } },
  render: (args) => (
    <Row min="17rem">
      <PersonCard {...args} layout="overlay" eyebrow="Meet" logos={[LOGOS[0]!]} />
      <PersonCard {...args} layout="stacked" logos={[LOGOS[0]!]} bio="A line or two about her." />
      <PersonCard {...args} layout="split" headline="Pricing and Growth Strategy" logos={[LOGOS[0]!]} />
    </Row>
  ),
};
