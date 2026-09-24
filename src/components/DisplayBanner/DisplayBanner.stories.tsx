import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  DisplayBanner,
  DisplayBannerActions,
  DisplayBannerArrowLink,
  DisplayBannerContent,
  DisplayBannerCountdown,
  DisplayBannerDescription,
  DisplayBannerEyebrow,
  DisplayBannerFinePrint,
  DisplayBannerMedia,
  DisplayBannerPanel,
  DisplayBannerTitle,
  DisplayBannerTitleMuted,
  type DisplayBannerLayout,
  type DisplayBannerMediaPlacement,
  type DisplayBannerSize,
  type DisplayBannerSurface,
  type DisplayBannerTone,
} from './DisplayBanner';
import { CollageArt, GiftArt, PhotoArt, QrArt, StackArt, UiMockArt } from './_fixtures/art';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Heading } from '../Heading';
import { Link } from '../Link';
import { Text } from '../Text';
import { Label } from '../Icon/_fixtures/story-layout';

const SURFACES: DisplayBannerSurface[] = ['subtle', 'solid', 'gradient', 'image', 'glass'];
const TONES: DisplayBannerTone[] = ['brand', 'accent1', 'accent2', 'neutral', 'inverse'];
const PLACEMENTS: DisplayBannerMediaPlacement[] = ['end', 'start', 'bottom', 'background', 'popout'];
const LAYOUTS: DisplayBannerLayout[] = ['stacked', 'split', 'wide'];
const SIZES: DisplayBannerSize[] = ['md', 'lg'];

/** A deadline ten days from when the story loads, so the countdown always runs. */
const IN_TEN_DAYS = new Date(Date.now() + 10 * 86400000 + 4 * 3600000).toISOString();

const ART = {
  none: undefined,
  gift: <GiftArt />,
  stack: <StackArt />,
  collage: <CollageArt />,
  ui: <UiMockArt />,
  photo: <PhotoArt />,
};

const meta = {
  title: 'Organisms/DisplayBanner',
  component: DisplayBanner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A marketing or announcement card: the promo on a Storyblok page, the feature tile in a bento grid, the',
          '"new cohort" strip on a dashboard. **The system ships the shell** (surface, slots, layout, contrast,',
          'reflow); **the site ships the artwork** (illustration, photo, copy) through `media` / `DisplayBannerMedia`.',
          '',
          '- `surface`: `subtle` tint · `solid` strong fill, on-solid ink · `gradient` the tone\'s tint washing into',
          '  the page (semantic tokens only) · `image` a photo under a scrim · `glass` a frosted content panel.',
          '- `tone`: `brand` · `accent1` · `accent2` · `neutral` · `inverse`.',
          '- `mediaPlacement`: `end` / `start` cropped flush at the edges · `bottom` bleeding off the bottom-end',
          '  corner · `background` behind the content (which gets a scrim) · `popout` breaking out of the top edge.',
          '- `layout`: `stacked` · `split` (side by side from a **36rem container**) · `wide` (from 48rem). Container',
          '  queries, so the same banner stacks in a grid cell or a sidebar.',
          '',
          'Contrast is the component\'s job, and **nothing is styled from outside**. On `solid`, `inverse` and `image`',
          'the banner declares the surface-ink contract on its inner layer (`data-surface-ink="on-brand-solid"`, …)',
          'and sets nothing else: Heading, Text, Link and Button each read it in their own recipe (the primary',
          'button becomes the fill\'s ink with the fill as its label, with its own hover, press and focus). Text over',
          'a photo always sits on a scrim that covers the whole content box, and glass is a panel measured against',
          'black and white artwork. Badges and Chips keep their own page colours.',
          '',
          '`href` (or `asChild` with a router link) makes the whole banner one link: one tab stop, the CTA drawn.',
        ].join('\n'),
      },
    },
  },
  args: {
    surface: 'subtle',
    tone: 'brand',
    mediaPlacement: 'end',
    layout: 'split',
    size: 'md',
    actionAppearance: 'button',
    eyebrow: 'Admissions open',
    title: 'Become a full-stack',
    titleMuted: 'AI engineer',
    description: 'A 12-month programme with live classes, 1:1 mentorship and placement support.',
    primaryAction: { label: 'Apply now', href: '#apply' },
    secondaryAction: { label: 'Download brochure', href: '#brochure' },
    finePrint: '',
    // A Storybook mapping key, resolved to an element by argTypes.media.mapping.
    media: 'stack',
  },
  argTypes: {
    surface: { control: 'inline-radio', options: SURFACES, table: { defaultValue: { summary: 'subtle' } } },
    tone: { control: 'inline-radio', options: TONES, table: { defaultValue: { summary: 'brand' } } },
    mediaPlacement: { control: 'inline-radio', options: PLACEMENTS, table: { defaultValue: { summary: 'end' } } },
    layout: { control: 'inline-radio', options: LAYOUTS, table: { defaultValue: { summary: 'split' } } },
    size: { control: 'inline-radio', options: SIZES, table: { defaultValue: { summary: 'md' } } },
    actionAppearance: { control: 'inline-radio', options: ['button', 'arrow'] },
    media: { control: 'select', options: Object.keys(ART), mapping: ART },
    eyebrow: { control: 'text' },
    title: { control: 'text' },
    titleMuted: { control: 'text' },
    description: { control: 'text' },
    finePrint: { control: 'text' },
    href: { control: 'text' },
    mediaSrc: { control: false },
    countdown: { control: false },
    asChild: { control: false },
    as: { control: false },
  },
} satisfies Meta<typeof DisplayBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

const NO_CONTROLS = { controls: { disable: true } } as const;

/** One-column grid that becomes N columns; `minmax(0,1fr)` so nothing forces a width at 320. */
const Grid = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`grid grid-cols-[minmax(0,1fr)] gap-4 ${className}`}>{children}</div>
);

/* ---- Playground ------------------------------------------------------------ */

export const Playground: Story = {
  render: (args) => (
    <div className="mx-auto max-w-[72rem]">
      <DisplayBanner {...args} finePrint={args.finePrint || undefined} href={args.href || undefined} />
    </div>
  ),
};

/* ---- one story per surface -------------------------------------------------- */

function SurfaceRow({ surface }: { surface: DisplayBannerSurface }) {
  const tones: DisplayBannerTone[] = surface === 'image' ? ['brand'] : TONES;
  return (
    <Grid className="sm:grid-cols-2 lg:grid-cols-3">
      {tones.map((tone) => (
        <div key={tone} className="grid min-w-0 gap-2">
          <Label>{surface === 'image' ? 'image (tone ignored)' : `${surface} · ${tone}`}</Label>
          <DisplayBanner
            surface={surface}
            tone={tone}
            layout="stacked"
            mediaPlacement={surface === 'glass' || surface === 'image' ? 'background' : 'bottom'}
            eyebrow="Scaler School of Technology"
            title="Gamification"
            titleMuted="Marketing"
            description="Design loops people come back to, then measure them."
            primaryAction={{ label: 'Apply now', href: '#apply' }}
            secondaryAction={{ label: 'Syllabus', href: '#syllabus' }}
            media={
              surface === 'image' || (surface === 'glass' && tone === 'brand') ? (
                <PhotoArt />
              ) : surface === 'glass' ? (
                <StackArt />
              ) : (
                <UiMockArt />
              )
            }
            className="h-full"
          />
        </div>
      ))}
    </Grid>
  );
}

export const Subtle: Story = { parameters: NO_CONTROLS, render: () => <SurfaceRow surface="subtle" /> };
export const Solid: Story = { parameters: NO_CONTROLS, render: () => <SurfaceRow surface="solid" /> };
export const Gradient: Story = { parameters: NO_CONTROLS, render: () => <SurfaceRow surface="gradient" /> };
export const Image: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <Grid className="md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <DisplayBanner
        surface="image"
        layout="split"
        size="lg"
        eyebrow="Campus open day"
        title="See the Bengaluru campus"
        titleMuted="Saturday, 12 October"
        description="Tour the labs, sit in on a class and meet the founding faculty. Parents welcome."
        primaryAction={{ label: 'Book a slot', href: '#book' }}
        secondaryAction={{ label: 'Directions', href: '#map' }}
        media={<PhotoArt />}
      />
      <SurfaceRowSingleImage />
    </Grid>
  ),
};
function SurfaceRowSingleImage() {
  return (
    <DisplayBanner
      surface="image"
      layout="stacked"
      title="A title long enough to run to three or four lines, which still sits on the scrim"
      description="The scrim covers the whole content box and fades out beyond it, however tall the copy gets."
      primaryAction={{ label: 'Read more', href: '#more' }}
      media={<PhotoArt />}
    />
  );
}
export const Glass: Story = { parameters: NO_CONTROLS, render: () => <SurfaceRow surface="glass" /> };

/* ---- popout ------------------------------------------------------------------ */

export const Popout: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <Grid className="max-w-[60rem] gap-8">
      <DisplayBanner
        surface="solid"
        tone="accent1"
        mediaPlacement="popout"
        title="Refer a friend, get ₹5,000"
        description="For every friend who joins the Batch of 2027. No limit on referrals."
        primaryAction={{ label: 'Refer now', href: '#refer' }}
        media={<GiftArt />}
      />
      <DisplayBanner
        surface="subtle"
        tone="brand"
        layout="stacked"
        mediaPlacement="popout"
        title="Scholarship test"
        description="Stacked, the art sits above the content and still breaks the top edge."
        primaryAction={{ label: 'Register', href: '#register' }}
        media={<GiftArt />}
        className="max-w-[24rem]"
      />
    </Grid>
  ),
};

/* ---- feature cards: red, white, blue -------------------------------------------- */

export const FeatureCards: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <Grid className="sm:grid-cols-3">
      {(
        [
          ['solid', 'accent2', 'Gamification', 'Marketing'],
          ['subtle', 'neutral', 'Product', 'Analytics'],
          ['solid', 'brand', 'Growth', 'Engineering'],
        ] as const
      ).map(([surface, tone, a, b]) => (
        <DisplayBanner
          key={tone}
          surface={surface}
          tone={tone}
          layout="stacked"
          mediaPlacement="end"
          title={a}
          titleMuted={b}
          actionAppearance="arrow"
          primaryAction={{ label: 'Learn more', href: `#${tone}` }}
          media={<StackArt />}
        />
      ))}
    </Grid>
  ),
};

/* ---- wide hero ----------------------------------------------------------------- */

export const HeroWide: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <DisplayBanner
      surface="gradient"
      tone="brand"
      layout="wide"
      size="lg"
      eyebrow="Scaler School of Business"
      title="Lead teams that ship"
      titleMuted="A PGP in management and technology"
      description="Eighteen months, six industry immersions, and a cohort of 120 operators."
      primaryAction={{ label: 'Apply for 2027', href: '#apply' }}
      secondaryAction={{ label: 'Talk to admissions', href: '#talk' }}
      media={<CollageArt />}
    />
  ),
};

/* ---- bento grid --------------------------------------------------------------- */

export const BentoGrid: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DisplayBanner
        className="sm:col-span-2"
        tone="brand"
        layout="split"
        mediaPlacement="end"
        eyebrow="Dashboard"
        title="Every class, one timeline"
        description="Live sessions, recordings and assignments in the order you meet them."
        actionAppearance="arrow"
        primaryAction={{ label: 'Take the tour', href: '#tour' }}
        media={<UiMockArt />}
      />
      <DisplayBanner
        className="sm:row-span-2"
        tone="accent1"
        layout="stacked"
        mediaPlacement="bottom"
        title="Mock interviews"
        description="With engineers from the companies you are targeting."
        media={<UiMockArt accent="fill-accent2" />}
      />
      <DisplayBanner
        tone="accent2"
        layout="stacked"
        mediaPlacement="bottom"
        title="Contest leaderboard"
        media={<UiMockArt accent="fill-accent1" />}
      />
      <DisplayBanner
        tone="neutral"
        layout="stacked"
        mediaPlacement="bottom"
        title="Career coach"
        description="Weekly 1:1s."
        media={<UiMockArt />}
      />
    </div>
  ),
};

/* ---- tall cards: 4-up ------------------------------------------------------------ */

export const TallCards: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <Grid className="sm:grid-cols-2 lg:grid-cols-4">
      {(
        [
          ['brand', 'Live classes', 'Four evenings a week, with the instructor on camera.'],
          ['accent1', 'Assignments', 'Auto-graded, with hints that do not give it away.'],
          ['accent2', 'Doubt support', 'A TA on the problem within 30 minutes, 9 AM to midnight.'],
          ['inverse', 'Placements', 'Referrals to 1,200+ partner companies.'],
        ] as const
      ).map(([tone, title, description]) => (
        <DisplayBanner
          key={tone}
          surface={tone === 'inverse' ? 'solid' : 'subtle'}
          tone={tone}
          layout="stacked"
          mediaPlacement="bottom"
          title={title}
          description={description}
          media={<UiMockArt />}
          className="min-h-[26rem]"
        />
      ))}
    </Grid>
  ),
};

/* ---- wide strip with glass sub-cards -------------------------------------------------- */

export const WideStrip: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <DisplayBanner surface="gradient" tone="inverse" layout="wide">
      <DisplayBannerContent>
        <DisplayBannerTitle>Placement season is here</DisplayBannerTitle>
        <DisplayBannerDescription>
          The 2026 drive opens with 140 companies. Update your profile before the first shortlist.
        </DisplayBannerDescription>
        <DisplayBannerActions>
          <Button asChild>
            <a href="#profile">Update profile</a>
          </Button>
          <Button asChild variant="tertiary">
            <a href="#companies">See companies</a>
          </Button>
        </DisplayBannerActions>
      </DisplayBannerContent>
      <DisplayBannerMedia inset>
        <div className="grid w-full grid-cols-[minmax(0,1fr)] gap-3 @min-[28rem]/display-banner:grid-cols-3">
          {(
            [
              ['140', 'companies'],
              ['₹24 L', 'median CTC'],
              ['92%', 'placed'],
            ] as const
          ).map(([n, l]) => (
            <DisplayBannerPanel key={l}>
              <Heading as="p" size="3">
                {n}
              </Heading>
              <Text size="sm" tone="secondary">
                {l}
              </Text>
            </DisplayBannerPanel>
          ))}
        </div>
      </DisplayBannerMedia>
    </DisplayBanner>
  ),
};

/* ---- glass strip with a QR code ------------------------------------------------------ */

export const GlassQr: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <DisplayBanner surface="glass" tone="brand" layout="wide" mediaPlacement="start">
      <DisplayBannerMedia inset>
        <DisplayBannerPanel className="w-[9rem] p-3">
          <QrArt aria-label="QR code: download the Scaler app" className="block size-full" />
        </DisplayBannerPanel>
      </DisplayBannerMedia>
      <DisplayBannerContent>
        <DisplayBannerEyebrow>Scaler app</DisplayBannerEyebrow>
        <DisplayBannerTitle>Classes in your pocket</DisplayBannerTitle>
        <DisplayBannerDescription>Scan to install on iOS or Android. Offline recordings included.</DisplayBannerDescription>
      </DisplayBannerContent>
    </DisplayBanner>
  ),
};

/* ---- tall photo card with chips on the photo ------------------------------------------ */

export const PhotoWithChips: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <Grid className="max-w-[48rem] sm:grid-cols-2">
      <DisplayBanner surface="image" layout="stacked" className="min-h-[28rem]">
        <DisplayBannerContent>
          <DisplayBannerTitle as="h3">Student life in Bengaluru</DisplayBannerTitle>
          <DisplayBannerDescription>Hostels, clubs and a 24-hour library, ten minutes from the metro.</DisplayBannerDescription>
          <DisplayBannerActions>
            <DisplayBannerArrowLink href="#life">Explore campus</DisplayBannerArrowLink>
          </DisplayBannerActions>
        </DisplayBannerContent>
        <DisplayBannerMedia>
          <PhotoArt />
          <div className="absolute start-4 top-4 flex flex-wrap gap-2">
            <Badge tone="highlight">New campus</Badge>
            <Badge>Residential</Badge>
          </div>
        </DisplayBannerMedia>
      </DisplayBanner>
      <DisplayBanner
        surface="glass"
        tone="neutral"
        layout="stacked"
        mediaPlacement="background"
        className="min-h-[28rem]"
        title="Clubs"
        description="Robotics, debate, a film society and 30 more."
        media={<PhotoArt />}
      />
    </Grid>
  ),
};

/* ---- linked --------------------------------------------------------------------- */

export const Linked: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <Grid className="sm:grid-cols-2">
      <DisplayBanner
        href="#programme"
        surface="subtle"
        tone="accent2"
        layout="stacked"
        mediaPlacement="end"
        title="Data science"
        titleMuted="with GenAI"
        description="The whole card is one link: one tab stop, hover lift, the focus ring."
        actionAppearance="arrow"
        primaryAction={{ label: 'View programme' }}
        media={<StackArt />}
      />
      <DisplayBanner
        href="#event"
        surface="solid"
        tone="brand"
        layout="stacked"
        mediaPlacement="end"
        eyebrow="Masterclass"
        title="System design, live"
        description="The CTA is drawn, not a control: the banner is the link."
        primaryAction={{ label: 'Save my seat' }}
        media={<StackArt />}
      />
    </Grid>
  ),
};

/* ---- countdown + fine print ---------------------------------------------------------- */

export const Countdown: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <Grid className="max-w-[64rem] md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <DisplayBanner
        surface="solid"
        tone="brand"
        layout="split"
        mediaPlacement="end"
        eyebrow="Early-bird fee"
        title="Save ₹40,000 on the 2027 batch"
        countdownTo={IN_TEN_DAYS}
        countdownLabel="ten days from now"
        countdownText="Offer ends in"
        primaryAction={{ label: 'Reserve my seat', href: '#reserve' }}
        finePrint="Applies to the full-fee plan only. Cannot be combined with a scholarship."
        media={<GiftArt />}
        mediaFit="contain"
      />
      <DisplayBanner surface="subtle" tone="accent1" layout="stacked" mediaPlacement="end" className="min-h-[22rem]">
        <DisplayBannerContent>
          <DisplayBannerTitle as="h3">Scholarship test</DisplayBannerTitle>
          <DisplayBannerCountdown to={IN_TEN_DAYS} label="ten days from now">
            Registration closes in
          </DisplayBannerCountdown>
          <DisplayBannerActions>
            <Button asChild>
              <a href="#register">Register free</a>
            </Button>
          </DisplayBannerActions>
          <DisplayBannerFinePrint>Fine print sits at the bottom of the content, however tall the card is.</DisplayBannerFinePrint>
        </DisplayBannerContent>
      </DisplayBanner>
    </Grid>
  ),
};

/* ---- every CTA on every fill ------------------------------------------------------ */

const FILLS = [
  ['solid', 'brand', 'on-brand-solid'],
  ['solid', 'accent1', 'on-accent1-solid'],
  ['solid', 'accent2', 'on-accent2-solid'],
  ['solid', 'inverse', 'on-inverse'],
  ['gradient', 'inverse', 'on-inverse'],
  ['image', 'brand', 'on-image'],
] as const;

/**
 * Compound usage, no extra props: a plain `<Button>`, `<Button variant="secondary">`,
 * `<Button variant="tertiary">` and a `<Link>` inside `DisplayBannerActions` on each fill.
 * Each reads `data-surface-ink` in its own recipe; hover, press and focus change visibly.
 */
export const ActionsOnEveryFill: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <Grid className="sm:grid-cols-2 lg:grid-cols-3">
      {FILLS.map(([surface, tone, ink]) => (
        <div key={`${surface}-${tone}`} className="grid min-w-0 gap-2">
          <Label>{`${surface} · ${tone} → data-surface-ink="${ink}"`}</Label>
          <DisplayBanner surface={surface} tone={tone} layout="stacked" className="h-full">
            <DisplayBannerContent>
              <DisplayBannerEyebrow>New cohort</DisplayBannerEyebrow>
              <DisplayBannerTitle as="h3">
                Full-stack <DisplayBannerTitleMuted>with GenAI</DisplayBannerTitleMuted>
              </DisplayBannerTitle>
              <DisplayBannerDescription>
                Twelve months, live classes, and a <Link href="#syllabus">published syllabus</Link>.
              </DisplayBannerDescription>
              <DisplayBannerActions>
                <Button>Apply now</Button>
                <Button variant="secondary">Brochure</Button>
                <Button variant="tertiary">Later</Button>
                <Button disabled>Closed</Button>
              </DisplayBannerActions>
              <DisplayBannerArrowLink href="#more">Learn more</DisplayBannerArrowLink>
            </DisplayBannerContent>
            {surface === 'image' ? (
              <DisplayBannerMedia>
                <PhotoArt />
              </DisplayBannerMedia>
            ) : null}
          </DisplayBanner>
        </div>
      ))}
    </Grid>
  ),
};

/**
 * The contract outside a banner: any section can declare its fill. The section sets
 * its own background and `data-surface-ink`; the components do the rest.
 */
export const SurfaceInkContract: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <section
      data-surface-ink="on-inverse"
      className="grid gap-3 rounded-2xl bg-surface-inverse p-6 text-on-inverse-ink"
    >
      <Heading as="h3" size="eyebrow">
        A consumer hero
      </Heading>
      <Heading as="h2">Not a DisplayBanner</Heading>
      <Text tone="secondary">
        The section paints itself and declares <code>data-surface-ink=&quot;on-inverse&quot;</code>. Nothing else.
      </Text>
      <div className="flex flex-wrap items-center gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Link href="#x" trailingIcon="arrow">
          A link
        </Link>
      </div>
    </section>
  ),
};

/* ---- compound anatomy -------------------------------------------------------------- */

export const Compound: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <DisplayBanner surface="subtle" tone="neutral" layout="split" mediaPlacement="end">
      <DisplayBannerContent>
        <DisplayBannerEyebrow>Eyebrow</DisplayBannerEyebrow>
        <DisplayBannerTitle>
          Title <DisplayBannerTitleMuted>with a muted line</DisplayBannerTitleMuted>
        </DisplayBannerTitle>
        <DisplayBannerDescription>Description, the Text secondary role.</DisplayBannerDescription>
        <DisplayBannerActions>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
        </DisplayBannerActions>
        <DisplayBannerFinePrint>Fine print, the 12px caption role.</DisplayBannerFinePrint>
      </DisplayBannerContent>
      <DisplayBannerMedia>
        <UiMockArt />
      </DisplayBannerMedia>
    </DisplayBanner>
  ),
};
