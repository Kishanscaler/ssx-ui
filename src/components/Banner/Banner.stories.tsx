import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Banner, type BannerAppearance, type BannerTone } from './Banner';
import { BannerCountdown } from './BannerCountdown';
import { Button } from '../Button';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const TONES: BannerTone[] = ['info', 'success', 'warning', 'danger', 'brand'];
const APPEARANCES: BannerAppearance[] = ['subtle', 'solid'];

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
          'readable measure, so on a narrow width the CTA drops to its own line, under the message.',
          '',
          '`appearance="solid"` is the tone’s strong fill with on-solid text, for the one notice that must not be',
          'missed. `shine` adds a slow sheen (never on `danger`, gone under reduced motion).',
          '',
          '**Timers are composition**, not a prop: put a `<BannerCountdown to="…" label="…" />` in the message.',
          'It renders a stable placeholder on the server, ticks after mount, and reads the deadline (`label`) to',
          'screen readers instead of the ticking digits.',
        ].join('\n'),
      },
    },
  },
  args: {
    tone: 'info',
    appearance: 'subtle',
    shine: false,
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
    appearance: {
      control: 'inline-radio',
      options: APPEARANCES,
      table: { defaultValue: { summary: 'subtle' } },
    },
    shine: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
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
  parameters: { controls: { disable: true } },
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
          Second fee instalment of <span className="tabular-nums">₹2,75,000</span> is due on 30 Nov 2026 — 6 days left.
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
  parameters: { controls: { disable: true } },
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

/**
 * Half width (one column on a phone): the CTA drops to its own line below the
 * message rather than being crushed, and never runs past the banner.
 */
export const NarrowWidth: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2">
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
  parameters: { controls: { disable: true } },
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

/** The strong fill of each tone, with on-solid text, a CTA and a close control. */
export const Solid: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={16}>
      {TONES.map((tone) => (
        <Banner
          key={tone}
          tone={tone}
          appearance="solid"
          message={`${tone} · Placement drive registrations close on 30 Sep. 18 companies confirmed so far.`}
          actionLabel="Register"
          actionHref="#m"
          dismissible
        />
      ))}
    </Stack>
  ),
};

/**
 * `shine`: a slow sheen across the banner, behind the text. Subtle and solid.
 * It is removed under reduced motion and never drawn on `danger`.
 */
export const Shine: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={16}>
      <Banner
        tone="brand"
        shine
        message="Applications for the Batch of 2030 are open. Scholarship test on 12 Oct."
        actionLabel="Apply now"
        actionHref="#s"
      />
      <Banner
        tone="brand"
        appearance="solid"
        shine
        message="Applications for the Batch of 2030 are open. Scholarship test on 12 Oct."
        actionLabel="Apply now"
        actionHref="#s"
        dismissible
      />
      <Banner
        tone="success"
        appearance="solid"
        shine
        message="Your seat in the Batch of 2029 is confirmed. Onboarding opens 2 May 2026."
      />
    </Stack>
  ),
};

/** Two days, four hours from when the story loads, so it always runs. */
const inTwoDays = () => Date.now() + (2 * 24 + 4) * 3600 * 1000 + 12 * 60 * 1000;

/**
 * A timer is composed, not configured: `<BannerCountdown>` in the message.
 * The server prints a placeholder; the digits tick after mount; a screen
 * reader hears the deadline (`label`), not the digits.
 */
export const WithCountdown: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [to] = React.useState(inTwoDays);
    const [soon] = React.useState(() => Date.now() + 75 * 1000);
    return (
      <Stack gap={16}>
        <Banner tone="brand" appearance="solid" shine actionLabel="Apply now" actionHref="#c" dismissible>
          Early-bird fee ends in <BannerCountdown to={to} label="in two days, at 11:59 PM IST" />. Save ₹25,000 on the
          Batch of 2030.
        </Banner>
        <Banner tone="warning" actionLabel="Pay now" actionHref="#c">
          Second fee instalment is due in{' '}
          <BannerCountdown to={soon} label="at the end of this minute" expiredText="now — pay to avoid a late fee" />.
        </Banner>
      </Stack>
    );
  },
};

/** Every tone × appearance, one line and three lines, for the alignment review. */
export const Alignment: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={16}>
      {APPEARANCES.map((appearance) => (
        <React.Fragment key={appearance}>
          <Banner
            appearance={appearance}
            tone="info"
            message="One line beside a CTA and a close."
            actionLabel="Status page"
            actionHref="#a"
            dismissible
          />
          <Banner appearance={appearance} tone="warning" message="One line, no CTA, with a close." dismissible />
          <Banner
            appearance={appearance}
            tone="brand"
            message="A long message that wraps to several lines on a phone: applications for the Batch of 2030 open on 1 Aug 2026, and registering your interest gets you the scholarship deadline before it is announced publicly."
            actionLabel="Register interest"
            actionHref="#a"
            dismissible
          />
        </React.Fragment>
      ))}
    </Stack>
  ),
};
