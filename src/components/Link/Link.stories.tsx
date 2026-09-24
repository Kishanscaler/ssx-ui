import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Link } from './Link';
import { Badge } from '../Badge';
import { Text } from '../Text';
import { Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Atoms/Link',
  component: Link,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Navigation: it changes where you are, not what is true. If activating it writes to a',
          'database, it is a Button wearing a link costume.',
          '',
          'Route with `asChild`: `<Link asChild><NextLink href="/apply">Apply</NextLink></Link>`.',
          '`visited` is a prop from your own data, not `:visited`. A disabled link is `aria-disabled`',
          'and has no `href`.',
          '',
          '`standalone`: a link with nothing else on its line (a card action, a footer link, "View all")',
          'gets an invisible ≥44px hit area on a coarse pointer (`touch-target`), same as Button. An',
          'inline link in running text must stay `false` — the hit area would spill onto neighbouring lines.',
        ].join('\n'),
      },
    },
  },
  args: { href: '#', children: 'View the Batch of 2029 curriculum', variant: 'default' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'quiet'] },
    external: { control: 'boolean' },
    visited: { control: 'boolean' },
    standalone: { control: 'boolean' },
    trailingIcon: { control: 'inline-radio', options: ['none', 'arrow', 'arrow-circle'] },
    asChild: { control: false },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      <Spec label="default">
        <Link href="#">View the Batch of 2029 curriculum</Link>
      </Spec>
      <Spec label="quiet — underline on hover only">
        <Link href="#" variant="quiet">
          Placement report 2025
        </Link>
      </Spec>
      <Spec label="external, trailing arrow">
        <Link href="#" external>
          Scaler School of Business admissions
        </Link>
      </Spec>
    </Row>
  ),
};

/** In running text — where a link must be underlined. */
export const Inline: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Spec label="inline" wide>
      <Text tone="secondary">
        Submissions for{' '}
        <Link href="#">
          Data Structures &amp; Algorithms — Module 4: Segment Trees, Fenwick Trees and Offline Query Processing
        </Link>{' '}
        close at 11:59 PM on 12 Mar 2026. Late work is capped at 60% unless you have an approved extension from
        your <Link href="#">programme mentor</Link>. Full policy is in the{' '}
        <Link href="#">SST Academic Handbook, Batch of 2029</Link>.
      </Text>
    </Spec>
  ),
};

/**
 * Stand-alone links — a card action, a footer link, "View all" — get an
 * invisible ≥44px hit area on a coarse pointer (`touch-target`), the same
 * as Button. Toggle the toolbar's Pointer control to "Touch" and inspect the
 * element: the drawn text stays 19px tall, the tappable box does not.
 */
export const Standalone: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      <Spec label="standalone — card footer action">
        <Link href="#" standalone>
          View all placements
        </Link>
      </Spec>
      <Spec label="inline — no hit area, so it cannot swallow the words beside it" wide>
        <Text tone="secondary">
          See the <Link href="#">placement report</Link> for the Batch of 2027.
        </Text>
      </Spec>
    </Stack>
  ),
};

export const Visited: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      <Row>
        <Spec label="visited — already opened">
          <Link href="#" visited>
            Week 5 · Graph traversal recap
          </Link>
        </Spec>
        <Spec label="unvisited, for comparison">
          <Link href="#">Week 6 · Segment trees</Link>
        </Spec>
      </Row>
      <Spec label="in situ — an LMS module index" wide>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {[
            ['Week 4 · Trees, tries and balanced BSTs', true, 'success', 'Completed'],
            ['Week 5 · Graph traversal, shortest paths', true, 'success', 'Completed'],
            ['Week 6 · Segment trees, Fenwick trees and offline query processing', false, 'info', 'In progress'],
            ['Week 7 · String algorithms and suffix structures', false, 'default', 'Locked'],
          ].map(([label, visited, tone, status]) => (
            <li key={label as string} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Link href="#" visited={visited as boolean} style={{ flex: 1 }}>
                {label as string}
              </Link>
              <Badge tone={tone as 'success'}>{status as string}</Badge>
            </li>
          ))}
        </ul>
      </Spec>
    </Stack>
  ),
};

/**
 * Over a photograph's scrim the region declares the surface-ink contract
 * (`data-surface-ink="on-image"`, which `Card variant="media"` sets for you)
 * and paints itself; Link and Text pick their own inks. Nothing re-points
 * their roles from outside.
 */
export const OnUnusualSurfaces: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row align="start">
      {(
        [
          ['on-image', 'bg-surface-image-scrim text-on-image-ink'],
        ] as const
      ).map(([ink, paint]) => (
        <Spec key={ink} label={`data-surface-ink="${ink}"`}>
          <div data-surface-ink={ink} className={`grid max-w-[22.5rem] gap-2 rounded-lg p-4 ${paint}`}>
            <Text size="sm" tone="secondary">
              ADMISSIONS · BATCH OF 2029
            </Text>
            <Text>
              Applications close on 30 Apr 2026. <Link href="#">Check your eligibility</Link> before you pay the
              ₹1,000 application fee.
            </Text>
            <Link href="#" variant="quiet" standalone trailingIcon="arrow-circle">
              Learn more
            </Link>
          </div>
        </Spec>
      ))}
    </Row>
  ),
};

/** `trailingIcon`: a small arrow, or the circled arrow of a feature-card CTA. */
export const TrailingIcon: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      <Spec label="arrow">
        <Link href="#" trailingIcon="arrow">
          All programmes
        </Link>
      </Spec>
      <Spec label="arrow-circle · quiet · standalone">
        <Link href="#" variant="quiet" standalone trailingIcon="arrow-circle">
          Learn more
        </Link>
      </Spec>
      <Spec label="arrow-circle · aria-disabled">
        <Link href="#" aria-disabled="true" trailingIcon="arrow-circle">
          Closed
        </Link>
      </Spec>
    </Row>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      <Spec label="rest">
        <Link href="#">Download offer letter</Link>
      </Spec>
      <Spec label="visited">
        <Link href="#" visited>
          Download offer letter
        </Link>
      </Spec>
      <Spec label="aria-disabled — inert, no href, announced">
        <Link href="#" aria-disabled="true">
          Download offer letter
        </Link>
      </Spec>
    </Row>
  ),
};

/** Routing: `asChild` puts every style on the router's own anchor. */
export const AsChild: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Link asChild>
      <a href="#apply" data-router="next/link stand-in">
        Apply now
      </a>
    </Link>
  ),
};

/** Storyblok gives strings. */
export const FromCmsStrings: Story = {
  args: { variant: 'quiet' as const, children: 'Placement report 2025', href: '#' },
};
