import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Spinner } from './Spinner';
import { Button } from '../Button';
import { Card, Label, Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Atoms/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'For a wait whose shape you do not know. Anything under about 300ms should show nothing;',
          'if you know how much is left, use ProgressBar.',
          '',
          '**The rule: small sizes use the dots loader; bigger sizes use the monogram.** `sm` (16px)',
          'is six dots in a 2 × 3 grid, lit clockwise round the outside (the same loader a pending Switch shows); `md` (24), `lg` (40) and `xl` (64) are the monogram',
          'drawing itself. Below about 20px the traced mark is a smudge, so the small size does not',
          'try. Both draw in `currentColor`, run forward only, and hold still under reduced motion.',
          'The `role="status"` / `label` contract is the same for both.',
        ].join('\n'),
      },
    },
  },
  args: { size: 'sm' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    kind: {
      control: 'inline-radio',
      options: [undefined, 'dots', 'monogram'],
      description: 'Leave unset: the size decides. Exists for a md/lg Button.',
    },
    label: { control: 'text' },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Mirrors the HTML preview's "Sizes" row: the six-dot grid at sm, the monogram above. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      <Spec label="sm — 16, the six-dot grid">
        <Spinner size="sm" />
      </Spec>
      <Spec label="md — 24, the monogram">
        <Spinner size="md" />
      </Spec>
      <Spec label="lg — 40">
        <Spinner size="lg" />
      </Spec>
      <Spec label="xl — 64">
        <Spinner size="xl" />
      </Spec>
    </Row>
  ),
};

/**
 * `<Button loading>` follows the same rule: `sm` / `icon-sm` get the six-dot grid,
 * `md` / `lg` / `icon-md` / `icon-lg` get the monogram (at 16px that is the
 * solid silhouette inking upward, as the HTML `.btn.is-loading` draws it).
 */
export const InAButton: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      <Row>
        <Spec label="sm — dots">
          <Button size="sm" loading>
            Save draft
          </Button>
        </Spec>
        <Spec label="icon-sm — dots">
          <Button size="icon-sm" loading aria-label="Refreshing applicant list" />
        </Spec>
        <Spec label="md — monogram">
          <Button size="md" loading>
            Apply now
          </Button>
        </Spec>
        <Spec label="lg — monogram">
          <Button size="lg" loading>
            Submitting your application
          </Button>
        </Spec>
        <Spec label="icon-md — monogram">
          <Button size="icon-md" loading aria-label="Refreshing applicant list" />
        </Spec>
      </Row>
    </Stack>
  ),
};

export const InlineWithText: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <Spinner label={null} />
      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--content-secondary)' }}>
        Syncing attendance from the Bengaluru campus…
      </span>
    </span>
  ),
};

/** No colour modifier: both kinds draw in currentColor, so the surface decides. */
export const OnSurfaces: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row align="start">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Label>normal surface</Label>
        <Card>
          <Row>
            <Spinner />
            <Spinner size="md" />
          </Row>
        </Card>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Label>brand fill</Label>
        <Card style={{ background: 'var(--surface-brand-solid)', color: 'var(--content-on-brand-solid)' }}>
          <Row>
            <Spinner />
            <Spinner size="md" />
          </Row>
        </Card>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Label>surface-inverse</Label>
        <Card style={{ background: 'var(--surface-inverse)', color: 'var(--content-inverse)' }}>
          <Row>
            <Spinner />
            <Spinner size="md" />
          </Row>
        </Card>
      </div>
    </Row>
  ),
};
