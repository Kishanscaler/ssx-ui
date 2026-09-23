import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Link } from './Link';
import { Badge } from '../Badge';
import { Text } from '../Text';
import { Card, Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

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
        ].join('\n'),
      },
    },
  },
  args: { href: '#', children: 'View the Batch of 2029 curriculum', variant: 'default' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'quiet'] },
    external: { control: 'boolean' },
    visited: { control: 'boolean' },
    asChild: { control: false },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
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

export const Visited: Story = {
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

/** The surface carries the roles: the same plain Link on an inverse and a brand-solid card. */
export const OnUnusualSurfaces: Story = {
  render: () => (
    <Row align="start">
      {(
        [
          ['surface-inverse', 'var(--surface-inverse)', {
            '--content-primary': 'var(--content-inverse)',
            '--content-secondary': 'var(--content-inverse-secondary)',
            '--content-link': 'var(--content-link-inverse)',
            '--content-link-hover': 'var(--content-link-inverse-hover)',
          }],
          ['surface-brandSolid', 'var(--surface-brand-solid)', {
            '--content-primary': 'var(--content-on-brand-solid)',
            '--content-secondary': 'var(--content-on-brand-solid)',
            '--content-link': 'var(--content-link-on-brand-solid)',
            '--content-link-hover': 'var(--content-link-on-brand-solid)',
          }],
        ] as const
      ).map(([name, bg, roles]) => (
        <Spec key={name} label={`${name} (the surface molecule remaps the roles)`}>
          <Card style={{ ...(roles as React.CSSProperties), background: bg, color: 'var(--content-primary)', maxWidth: 360, border: 0 }}>
            <Text size="sm" tone="secondary">
              ADMISSIONS · BATCH OF 2029
            </Text>
            <p style={{ margin: 0 }}>
              Applications close on 30 Apr 2026. <Link href="#">Check your eligibility</Link> before you pay the
              ₹1,000 application fee.
            </p>
          </Card>
        </Spec>
      ))}
    </Row>
  ),
};

export const States: Story = {
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
