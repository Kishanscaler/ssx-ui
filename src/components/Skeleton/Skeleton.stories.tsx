import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Skeleton } from './Skeleton';
import { Avatar, AvatarFallback } from '../Avatar';
import { Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Skeleton when you know the **shape**, Spinner when you know only the wait. Every skeleton',
          'is `aria-hidden`; the container carries `aria-busy` and a visually hidden "Loading…". Width',
          'is `className`. Reduced motion: static.',
        ].join('\n'),
      },
    },
  },
  args: { shape: 'text', size: 'md' },
  argTypes: {
    shape: { control: 'inline-radio', options: ['text', 'title', 'circle', 'block'] },
    // `size` only feeds a compound variant for `shape="circle"` — every other
    // shape's height comes from the shape itself, so the control does
    // nothing until `circle` is picked. Scope it to when it matters instead
    // of leaving a dead control visible.
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'], if: { arg: 'shape', eq: 'circle' } },
  },
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <Skeleton {...args} className={args.shape === 'block' ? 'aspect-video w-full' : undefined} />
    </div>
  ),
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Lines: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={20}>
      <Spec label="text — 12px, a body line" wide>
        <Skeleton />
      </Spec>
      <Spec label="title — 20px, a heading line" wide>
        <Skeleton shape="title" />
      </Spec>
      {(['w-1/4', 'w-1/3', 'w-1/2', 'w-2/3', 'w-3/4', 'w-full'] as const).map((w) => (
        <Spec key={w} label={`className="${w}"`} wide>
          <Skeleton className={w} />
        </Spec>
      ))}
    </Stack>
  ),
};

export const Circles: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      <Spec label="circle · sm 28 — Avatar sm">
        <Skeleton shape="circle" size="sm" />
      </Spec>
      <Spec label="circle · md 40 — Avatar md">
        <Skeleton shape="circle" />
      </Spec>
      <Spec label="circle · lg 48 — Avatar lg">
        <Skeleton shape="circle" size="lg" />
      </Spec>
      <Spec label="beside the avatars they stand in for">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(['sm', 'md', 'lg'] as const).map((s) => (
            <Avatar key={s} size={s}>
              <AvatarFallback>AK</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </Spec>
    </Row>
  ),
};

/** A loading course card, shaped like the real one. */
export const ComposedCard: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      aria-busy="true"
      style={{
        maxWidth: 360,
        border: '1px solid var(--border-raised)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'var(--surface-raised)',
      }}
    >
      <Skeleton shape="block" className="aspect-video w-full rounded-none" />
      <div style={{ padding: 20, display: 'grid', gap: 10 }}>
        <Skeleton className="w-1/4" />
        <Skeleton shape="title" className="w-3/4" />
        <Skeleton />
        <Skeleton className="w-2/3" />
        <Skeleton className="w-1/3" />
      </div>
      <div style={{ padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center', borderTop: '1px solid var(--border-decorative)' }}>
        <Skeleton shape="circle" size="sm" />
        <div style={{ flex: 1 }}>
          <Skeleton className="w-1/2" />
        </div>
      </div>
      <span className="sr-only">Loading course card</span>
    </div>
  ),
};

export const ComposedRows: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ul aria-busy="true" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 16, maxWidth: 560 }}>
      {['w-1/2', 'w-3/4', 'w-2/3'].map((w) => (
        <li key={w} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton shape="circle" size="sm" />
          <div style={{ flex: 1 }}>
            <Skeleton className={w} />
          </div>
          <Skeleton className="w-1/4" />
        </li>
      ))}
    </ul>
  ),
};
