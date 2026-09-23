import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DotsThreeVertical } from '@phosphor-icons/react';

import {
  Card,
  CardBody,
  CardDescription,
  CardEyebrow,
  CardFooter,
  CardHeader,
  CardMedia,
  CardTitle,
  type CardElement,
  type CardVariant,
} from './Card';
import { Badge } from '../Badge';
import { IconButton } from '../IconButton';
import { Link } from '../Link';
import { Heading } from '../Heading';
import { Text } from '../Text';
import { Notebook } from '../Icon/_fixtures/phosphor';
import { Spec } from '../Icon/_fixtures/story-layout';

const STAND_IN = {
  sst: new URL('./_fixtures/stand-in-sst.svg', import.meta.url).href,
  ssb: new URL('./_fixtures/stand-in-ssb.svg', import.meta.url).href,
};

/** The HTML's `.grid`: auto-fill columns, so no card carries a width of its own. */
const Grid = ({ children, min = 260 }: { children: React.ReactNode; min?: number }) => (
  <div
    style={{
      display: 'grid',
      gap: 'var(--space-6)',
      gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`,
      alignItems: 'start',
    }}
  >
    {children}
  </div>
);

const VARIANTS: CardVariant[] = ['default', 'media'];
const ELEMENTS: CardElement[] = ['div', 'article', 'section', 'li', 'aside'];

const meta = {
  title: 'Molecules/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A bordered container that turns related facts into one object you can scan and lay out on a grid.',
          'Do NOT nest a card in a card. Padding lives on `CardBody` / `CardFooter`, never the root, so',
          '`CardMedia` runs edge to edge. No width is baked in: a Card takes its grid cell or Carousel slide.',
          '',
          'Compound API first (`CardMedia`, `CardBody`, `CardHeader`, `CardEyebrow`, `CardTitle`,',
          '`CardDescription`, `CardFooter`). The flat fields (`eyebrow`, `title`, `description`, `image`)',
          'build the same parts and map one-to-one onto a Storyblok blok. A card that goes somewhere is a',
          '`ClickableCard`.',
        ].join('\n'),
      },
    },
  },
  args: {
    variant: 'default',
    as: 'article',
    eyebrow: 'Module 06',
    title: 'Data Structures & Algorithms',
    description: 'Week 6 of 12 · Mentor Anshuman Singh',
    image: '',
    imageAlt: '',
    titleAs: 'h3',
  },
  argTypes: {
    variant: { control: 'select', options: VARIANTS, description: 'Surface treatment.' },
    as: { control: 'select', options: ELEMENTS },
    eyebrow: { control: 'text' },
    title: { control: 'text' },
    description: { control: 'text' },
    image: { control: 'text', description: 'Image URL. Empty: no media.' },
    imageAlt: { control: 'text' },
    titleAs: { control: 'select', options: ['h2', 'h3', 'h4', 'h5', 'h6'] },
    asChild: { control: 'boolean' },
    className: { control: 'text' },
  },
  render: (args, { globals }) => (
    <div style={{ maxWidth: 360 }}>
      <Card
        {...args}
        image={
          args.image || (args.variant === 'media' ? STAND_IN[(globals.brand as 'sst' | 'ssb') ?? 'sst'] : undefined)
        }
      />
    </div>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every variant the HTML's `#card` section shows, in its order. */
export const Variants: Story = {
  render: (_args, { globals }) => {
    const photo = STAND_IN[(globals.brand as 'sst' | 'ssb') ?? 'sst'];
    return (
      <Grid>
        <Spec label="base">
          <Card as="article">
            <CardBody>
              <CardEyebrow>Module 06</CardEyebrow>
              <CardTitle as="h4">Data Structures &amp; Algorithms</CardTitle>
              <CardDescription>Week 6 of 12 · Mentor Anshuman Singh</CardDescription>
            </CardBody>
          </Card>
        </Spec>

        <Spec label="with media">
          <Card as="article">
            <CardMedia alt="Cohort 7 orientation week on the Bengaluru campus" />
            <CardBody>
              <CardEyebrow>Campus life</CardEyebrow>
              <CardTitle as="h4">Orientation week · Cohort 7</CardTitle>
              <CardDescription>4–9 Aug 2026 · Bengaluru</CardDescription>
            </CardBody>
          </Card>
        </Spec>

        <Spec label="with footer">
          <Card as="article">
            <CardBody>
              <CardEyebrow>Assignment</CardEyebrow>
              <CardTitle as="h4">Red-black tree deletion</CardTitle>
              <CardDescription>Submitted 4 Mar 2026, 11:42 PM</CardDescription>
            </CardBody>
            <CardFooter>
              <Badge tone="success">Graded 92%</Badge>
              <Link href="#card" className="text-sm">
                View feedback
              </Link>
            </CardFooter>
          </Card>
        </Spec>

        <Spec label="with header actions">
          <Card as="article">
            <CardBody>
              <CardHeader>
                <CardTitle as="h4">Placement drive · Nov 2026</CardTitle>
                <IconButton
                  variant="tertiary"
                  size="sm"
                  aria-label="More actions for the November 2026 placement drive"
                >
                  <DotsThreeVertical weight="bold" />
                </IconButton>
              </CardHeader>
              <CardDescription>
                18 companies confirmed · Median CTC <span className="tabular-nums">₹19,50,000</span>
              </CardDescription>
            </CardBody>
          </Card>
        </Spec>

        <Spec label="variant=media · image behind, text on top">
          <Card
            as="article"
            variant="media"
            image={photo}
            eyebrow="Campus life"
            title="Residency week at the Electronic City campus"
            titleAs="p"
            description="4–9 Aug 2026 · open to the Batch of 2029"
          />
        </Spec>

        <Spec label="long title · wraps, never truncates">
          <Card
            as="article"
            eyebrow="Capstone track"
            title="Applied Systems Design & Distributed Computing — Capstone Track for the Batch of 2029, Bengaluru Campus"
            titleAs="h4"
            description="Year 4 · industry mentor allocated after the Week 6 design review"
          />
        </Spec>

        <Spec label="empty state inside a card">
          <Card as="article">
            <CardBody className="justify-items-center gap-3 px-6 py-12 text-center">
              <span
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--surface-brand-subtle)',
                  color: 'var(--content-brand)',
                  display: 'grid',
                  placeContent: 'center',
                }}
              >
                <Notebook size={48} aria-hidden />
              </span>
              <Heading as="h4" size="3">
                No submissions yet
              </Heading>
              <Text size="sm" tone="secondary">
                Cohort 7 has not submitted anything for this module.
              </Text>
            </CardBody>
          </Card>
        </Spec>
      </Grid>
    );
  },
};

/** The flat fields: what a Storyblok blok passes. Same parts as the compound form. */
export const FlatFields: Story = {
  render: () => (
    <Grid>
      <Card eyebrow="Module 06" title="Data Structures & Algorithms" description="Week 6 of 12" />
      <Card
        eyebrow="Campus life"
        title="Orientation week · Cohort 7"
        description="4–9 Aug 2026 · Bengaluru"
        image={STAND_IN.sst}
        imageAlt="Cohort 7 orientation week on the Bengaluru campus"
      >
        <CardFooter>
          <Badge tone="brand">Batch of 2029</Badge>
        </CardFooter>
      </Card>
    </Grid>
  ),
};

/**
 * Cards in a row share a height (the body grows), so footers line up — the
 * behaviour a Carousel track relies on. No card sets a width.
 */
export const EqualHeightRow: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'stretch' }}>
      {[
        ['Assignment', 'Red-black tree deletion', 'Submitted 4 Mar 2026, 11:42 PM'],
        ['Quiz', 'Quiz 4 · Balanced trees', 'Closes Friday. Best of 5 attempts counts toward the module grade.'],
        ['Project', 'Week 6 design review', '12 Mar 2026'],
      ].map(([eyebrow, title, description]) => (
        <div key={title} style={{ flex: '0 0 260px', display: 'flex' }}>
          <Card as="article" eyebrow={eyebrow} title={title} description={description} className="w-full">
            <CardFooter>
              <Link href="#card" className="text-sm">
                Open
              </Link>
            </CardFooter>
          </Card>
        </div>
      ))}
    </div>
  ),
};
