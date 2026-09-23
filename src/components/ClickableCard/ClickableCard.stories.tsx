import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ClickableCard } from './ClickableCard';
import { CardBody, CardDescription, CardEyebrow, CardMedia, CardTitle, type CardVariant } from '../Card';
import { Spec } from '../Icon/_fixtures/story-layout';

const STAND_IN = {
  sst: new URL('../Card/_fixtures/stand-in-sst.svg', import.meta.url).href,
  ssb: new URL('../Card/_fixtures/stand-in-ssb.svg', import.meta.url).href,
};

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'grid',
      gap: 'var(--space-6)',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      alignItems: 'start',
    }}
  >
    {children}
  </div>
);

/** A stand-in for `next/link`: forwards its ref to an <a>, as next/link does. */
const RouterLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
  function RouterLink(props, ref) {
    return <a ref={ref} {...props} />;
  },
);

const VARIANTS: CardVariant[] = ['default', 'media'];

const meta = {
  title: 'Molecules/ClickableCard',
  component: ClickableCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A card whose whole surface is ONE target to ONE destination. `href` renders an `<a>`, no `href` a',
          '`<button type="button">`, `asChild` styles your own link (`next/link`).',
          '',
          '**Never put anything interactive inside** — no Button, Link or IconButton. Nested interactive',
          'elements are invalid HTML and ambiguous to click. A card with its own actions is a `Card`.',
          '',
          'Hover: `border-brand` + a 2px lift (the Button\'s motion). Under reduced motion only the colour',
          'changes. `variant="media"` deepens its scrim instead.',
        ].join('\n'),
      },
    },
  },
  args: {
    variant: 'default',
    href: '#clickable-card',
    eyebrow: 'Module 06',
    title: 'Data Structures & Algorithms',
    description: 'Week 6 of 12 · 3 assignments open',
    image: '',
    imageAlt: '',
    titleAs: 'h3',
    target: '',
    disabled: false,
  },
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    href: { control: 'text', description: 'Empty: renders a <button>.' },
    target: { control: 'select', options: ['', '_self', '_blank'] },
    rel: { control: 'text' },
    eyebrow: { control: 'text' },
    title: { control: 'text' },
    description: { control: 'text' },
    image: { control: 'text' },
    imageAlt: { control: 'text' },
    titleAs: { control: 'select', options: ['h2', 'h3', 'h4', 'h5', 'h6', 'p'] },
    disabled: { control: 'boolean', description: 'Button form only.' },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    asChild: { control: 'boolean' },
    className: { control: 'text' },
  },
  render: ({ href, target, image, ...args }, { globals }) => (
    <div style={{ maxWidth: 360 }}>
      <ClickableCard
        {...args}
        href={href || undefined}
        target={target || undefined}
        image={image || (args.variant === 'media' ? STAND_IN[(globals.brand as 'sst' | 'ssb') ?? 'sst'] : undefined)}
      />
    </div>
  ),
} satisfies Meta<typeof ClickableCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The HTML's `#clickable-card` elements, plus the media card's clickable form. */
export const Elements: Story = {
  render: (_args, { globals }) => (
    <Grid>
      <Spec label="rest · <a> for navigation">
        <ClickableCard href="#clickable-card">
          <CardBody>
            <CardEyebrow>Module 06</CardEyebrow>
            <CardTitle as="h4">Data Structures &amp; Algorithms</CardTitle>
            <CardDescription>Week 6 of 12 · 3 assignments open</CardDescription>
          </CardBody>
        </ClickableCard>
      </Spec>
      <Spec label="rest · <button> for an in-page action">
        <ClickableCard
          eyebrow="Mentor slot"
          title="Book 1:1 with Naman Bhalla"
          titleAs="h4"
          description="Next free slot Thu 12 Mar, 6:30 PM IST"
        />
      </Spec>
      <Spec label="with media · whole surface is the target">
        <ClickableCard href="#clickable-card">
          <CardMedia alt="Students at the Cohort 7 capstone showcase" />
          <CardBody>
            <CardTitle as="h4">Capstone showcase 2026</CardTitle>
            <CardDescription>41 projects · judged by 12 industry engineers</CardDescription>
          </CardBody>
        </ClickableCard>
      </Spec>
      <Spec label="variant=media · hover deepens the scrim">
        <ClickableCard
          variant="media"
          href="#clickable-card"
          image={STAND_IN[(globals.brand as 'sst' | 'ssb') ?? 'sst']}
          eyebrow="Placement report"
          title="Where the Batch of 2028 went"
          titleAs="p"
          description="104 of 118 placed · median CTC ₹32 LPA"
        />
      </Spec>
      <Spec label="disabled · <button>">
        <ClickableCard
          disabled
          eyebrow="Mentor slot"
          title="No slots this week"
          titleAs="h4"
          description="Booking reopens Mon 16 Mar"
        />
      </Spec>
    </Grid>
  ),
};

/** `asChild` over a router link. The package never imports `next/link`; you pass it in. */
export const AsChildRouterLink: Story = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <ClickableCard asChild eyebrow="Module 07" title="Operating Systems" description="Starts 16 Mar 2026">
        <RouterLink href="#modules/os" />
      </ClickableCard>
    </div>
  ),
};
