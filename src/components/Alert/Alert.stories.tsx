import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Alert, AlertActions, AlertDescription, AlertTitle, type AlertTone } from './Alert';
import { Button } from '../Button';
import { Link } from '../Link';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const TONES: AlertTone[] = ['info', 'success', 'warning', 'danger'];

/** Dismissing hides the alert; this brings it back, so the story can be replayed. */
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
  title: 'Molecules/Alert',
  component: Alert,
  subcomponents: { AlertTitle, AlertDescription, AlertActions } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'An inline, scoped message that belongs to the region it sits in — the form it blocks, the card it',
          'annotates. Do NOT stack three at the top of a page: that is a `Banner`, or a page doing too much.',
          '',
          '`danger` is `role="alert"` (interrupts); every other tone is `role="status"` (announced at the next',
          'pause); `role` overrides. Status is never colour alone: each tone has its own glyph shape and a title',
          'that names the state. The dismiss control is Button `neutral`, pinned to the corner.',
          '',
          'Flat fields (`title`, `description`, `actionLabel` + `actionHref`, `dismissible`) map onto a',
          'Storyblok blok; `AlertTitle` / `AlertDescription` / `AlertActions` compose the same DOM.',
        ].join('\n'),
      },
    },
  },
  args: {
    tone: 'info',
    title: 'Week 6 design review moves to Thursday',
    description:
      'Your slot is now 12 Mar 2026, 6:30 PM IST. Calendar invites have been resent to everyone in Cohort 7.',
    icon: undefined,
    actionLabel: '',
    actionHref: '',
    dismissible: false,
    dismissLabel: 'Dismiss',
  },
  argTypes: {
    tone: { control: 'select', options: TONES, description: 'Status tone; also picks the glyph and role.' },
    title: { control: 'text' },
    description: { control: 'text' },
    icon: {
      control: 'select',
      options: ['default', 'none'],
      mapping: { default: undefined, none: false },
      description: 'The tone glyph (default), your own svg, or `false`.',
    },
    actionLabel: { control: 'text' },
    actionHref: { control: 'text' },
    dismissible: { control: 'boolean' },
    dismissLabel: { control: 'text' },
    role: { control: 'select', options: [undefined, 'status', 'alert', 'note'] },
    className: { control: 'text' },
    action: { control: false },
    onAction: { control: false },
    onDismiss: { control: false },
  },
  render: (args) => (
    <div style={{ maxWidth: 640 }}>
      <Replay>{(key) => <Alert key={key} {...args} />}</Replay>
    </div>
  ),
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The HTML's `#alert` section, in its order. */
export const Statuses: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <Stack>
        <Spec label="info" wide>
          <Alert
            tone="info"
            title="Week 6 design review moves to Thursday"
            description="Your slot is now 12 Mar 2026, 6:30 PM IST. Calendar invites have been resent to everyone in Cohort 7."
          />
        </Spec>
        <Spec label="success" wide>
          <Alert
            tone="success"
            title="Seat confirmed · SST-2029-0416"
            description="Your place in the Batch of 2029 is held. Hostel preference opens on 2 May 2026."
          />
        </Spec>
        <Spec label="warning" wide>
          <Alert
            tone="warning"
            title="Second fee instalment due in 6 days"
            description="₹2,75,000 is payable by 30 Nov 2026. Seats are released back to the waitlist 72 hours after the deadline, and re-allocation cannot be reversed once the next candidate accepts."
          />
        </Spec>
        <Spec label="danger" wide>
          <Alert
            tone="danger"
            title="Document rejected · Class XII marksheet"
            description="The scan is cropped and the board seal is not visible. Re-upload a full-page scan before 18 Mar 2026."
          />
        </Spec>
      </Stack>
    </div>
  ),
};

export const WithoutIcon: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <Stack>
        <Spec label="danger · text only" wide>
          <Alert
            tone="danger"
            icon={false}
            title="Document rejected · Class XII marksheet"
            description="The scan is cropped and the board seal is not visible."
          />
        </Spec>
        <Spec label="info · single line, no title" wide>
          <Alert
            tone="info"
            icon={false}
            description="Grades for Week 5 are provisional until the moderation meeting on 9 Mar."
          />
        </Spec>
      </Stack>
    </div>
  ),
};

export const WithActions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <Replay>
        {(key) => (
          <Stack key={key}>
            <Spec label="dismissible" wide>
              <Alert
                tone="info"
                title="New: recordings now keep chapter markers"
                description="Jump straight to the segment you missed from any live class after 1 Mar 2026."
                dismissible
                dismissLabel="Dismiss this message about recordings"
              />
            </Spec>
            <Spec label="inline action link" wide>
              <Alert tone="warning">
                <AlertTitle>Second fee instalment due 30 Nov 2026</AlertTitle>
                <AlertDescription>
                  ₹2,75,000 outstanding. <Link href="#alert">Pay now</Link> or{' '}
                  <Link href="#alert">request the deferred plan</Link>.
                </AlertDescription>
              </Alert>
            </Spec>
            <Spec label="action button + dismiss" wide>
              <Alert
                tone="danger"
                title="Document rejected · Class XII marksheet"
                description="Re-upload a full-page scan before 18 Mar 2026."
                actionLabel="Re-upload document"
                onAction={() => {}}
                dismissible
                dismissLabel="Dismiss the document rejection message"
              />
            </Spec>
          </Stack>
        )}
      </Replay>
    </div>
  ),
};

/** Every tone, dismissible with an action, for the brand × theme review. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <Stack gap={16}>
        {TONES.map((tone) => (
          <Alert
            key={tone}
            tone={tone}
            title={`${tone.charAt(0).toUpperCase()}${tone.slice(1)} · Cohort 7`}
            description={
              <>
                Placement drive registrations close on 30 Sep. <Link href="#m">Read the policy</Link>.
              </>
            }
            actionLabel="Register"
            actionHref="#m"
            dismissible
          />
        ))}
      </Stack>
    </div>
  ),
};
