import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Banner, type BannerTone } from './Banner';
import { Button } from '../Button';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const TONES: BannerTone[] = ['info', 'success', 'warning', 'danger', 'brand'];

/** Dismissing hides the banner; this brings it back, so the story can be replayed. */
function Replay({ children }: { children: (key: number) => React.ReactNode }) {
  const [key, setKey] = React.useState(0);
  return (
    <Stack gap={12}>
      {children(key)}
      <div>
        <Button size="sm" variant="tertiary" onClick={() => setKey((k) => k + 1)}>
          Reset story
        </Button>
      </div>
    </Stack>
  );
}

const meta = {
  title: 'Molecules/Banner',
  component: Banner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A page-level notice, edge to edge above the content, for something true of the whole session or',
          'account: outages, deadlines, impersonation. One at a time; never feedback about a single control',
          '(that is an `Alert`). Square corners, one hairline along the bottom.',
          '',
          'Tones are the banner’s own (`brand` is product news, no status meaning). The CTA is a small',
          '**secondary** button — its contrast is constant on every tint. The row wraps: the message keeps a',
          'readable measure, so on a narrow width the CTA drops to its own line.',
        ].join('\n'),
      },
    },
  },
  args: {
    tone: 'info',
    message:
      'Scheduled maintenance on Sunday 15 Mar, 2:00–4:00 AM IST. Submissions made during this window may be delayed.',
    icon: undefined,
    actionLabel: 'Status page',
    actionHref: '#banner',
    dismissible: false,
    dismissLabel: 'Dismiss',
  },
  argTypes: {
    tone: { control: 'select', options: TONES },
    message: { control: 'text' },
    icon: {
      control: 'select',
      options: ['default', 'none'],
      mapping: { default: undefined, none: false },
    },
    actionLabel: { control: 'text' },
    actionHref: { control: 'text' },
    dismissible: { control: 'boolean' },
    dismissLabel: { control: 'text' },
    role: { control: 'select', options: [undefined, 'status', 'alert'] },
    className: { control: 'text' },
    action: { control: false },
    onAction: { control: false },
    onDismiss: { control: false },
  },
  render: (args) => <Replay>{(key) => <Banner key={key} {...args} />}</Replay>,
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The HTML's `#banner` section, in its order. */
export const Statuses: Story = {
  render: () => (
    <Stack>
      <Spec label="info" wide>
        <Banner
          tone="info"
          message="Scheduled maintenance on Sunday 15 Mar, 2:00–4:00 AM IST. Submissions made during this window may be delayed."
          actionLabel="Status page"
          actionHref="#banner"
        />
      </Spec>
      <Spec label="success" wide>
        <Banner tone="success" message="Your seat in the Batch of 2029 is confirmed. Onboarding opens 2 May 2026." />
      </Spec>
      <Spec label="warning" wide>
        <Banner tone="warning" actionLabel="Pay now" actionHref="#banner">
          Second fee instalment of <span className="tabular-nums">₹2,75,000</span> is due on 30 Nov 2026 — 6 days
          left.
        </Banner>
      </Spec>
      <Spec label="danger" wide>
        <Banner tone="danger" actionLabel="End impersonation" actionHref="#banner">
          You are viewing the faculty portal as <strong>aarav.k@sst.scaler.com</strong>. Everything you do is recorded
          against your own admin account.
        </Banner>
      </Spec>
      <Spec label="brand" wide>
        <Banner
          tone="brand"
          message="Applications for the Batch of 2030 open on 1 Aug 2026. Register your interest to get the scholarship deadline before it is announced publicly."
          actionLabel="Register interest"
          actionHref="#banner"
        />
      </Spec>
    </Stack>
  ),
};

export const Dismissible: Story = {
  render: () => (
    <Replay>
      {(key) => (
        <Spec key={key} label="info · with a close control" wide>
          <Banner
            tone="info"
            message="Placement drive registrations for November 2026 close on 30 Sep. 18 companies confirmed so far, with a further 24 expected in the summer internship cycle."
            actionLabel="Register"
            actionHref="#banner"
            dismissible
            dismissLabel="Dismiss the placement drive banner"
          />
        </Spec>
      )}
    </Replay>
  ),
};

/** Half width: the CTA drops to its own line rather than being crushed. */
export const NarrowWidth: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--space-6)' }}>
      <Banner tone="warning" actionLabel="Pay now" actionHref="#banner">
        Second fee instalment of <span className="tabular-nums">₹2,75,000</span> is due on 30 Nov 2026 — 6 days left.
      </Banner>
      <Banner tone="danger" actionLabel="End impersonation" actionHref="#banner">
        You are viewing the faculty portal as <strong>aarav.k@sst.scaler.com</strong>.
      </Banner>
    </div>
  ),
};

/** Every tone, with a CTA and a dismiss, for the brand × theme review. */
export const Matrix: Story = {
  render: () => (
    <Stack gap={16}>
      {TONES.map((tone) => (
        <Banner
          key={tone}
          tone={tone}
          message={`${tone} · Placement drive registrations close on 30 Sep.`}
          actionLabel="Register"
          actionHref="#m"
          dismissible
        />
      ))}
    </Stack>
  ),
};
