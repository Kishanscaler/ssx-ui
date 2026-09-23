import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch, SwitchStatus } from './Switch';

const meta = {
  title: 'Atoms/Switch',
  component: Switch,
  subcomponents: { SwitchStatus },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'An immediate on/off setting: it applies the moment it is flipped. A value committed on',
          'submit is a **Checkbox**. Radix renders `<button role="switch">`, so it announces on/off.',
          '',
          '`pending` is an optimistic write in flight: `aria-busy`, the disabled dimming, no pointer',
          'response and no toggling — but still focusable. Put a `<SwitchStatus pending>` at the',
          'end of the row; it reserves its box when idle, so the row never jumps.',
        ].join('\n'),
      },
    },
  },
  args: { 'aria-label': 'Email notifications' },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

const Spec = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-semibold text-content-secondary">{label}</span>
    {children}
  </div>
);

/** The HTML `.switch` row: track, label, then the status slot. */
function Row({
  id,
  children,
  pending,
  disabled,
  strong,
  ...props
}: React.ComponentProps<typeof Switch> & { id: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-base text-content">
      <Switch id={id} pending={pending} disabled={disabled} {...props} />
      <label
        htmlFor={id}
        className={
          disabled
            ? 'cursor-not-allowed text-content-disabled'
            : pending
              ? 'cursor-progress text-content-secondary'
              : strong
                ? 'cursor-pointer text-sm font-semibold'
                : 'cursor-pointer'
        }
      >
        {children}
      </label>
      <SwitchStatus pending={pending} label={`Saving ${String(children).toLowerCase()}`} />
    </span>
  );
}

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="off">
        <Row id="sw-1">Email notifications</Row>
      </Spec>
      <Spec label="on">
        <Row id="sw-2" defaultChecked>Show my profile to recruiters</Row>
      </Spec>
      <Spec label="disabled · off">
        <Row id="sw-3" disabled>Weekend mentor office hours</Row>
      </Spec>
      <Spec label="disabled · on">
        <Row id="sw-4" disabled defaultChecked>Two-factor authentication (enforced)</Row>
      </Spec>
    </div>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <div className="grid max-w-2xl gap-6">
      <div className="grid gap-2">
        <Row id="sw-h1" defaultChecked strong aria-describedby="sw-h1-help">
          Show my profile to recruiters
        </Row>
        <p id="sw-h1-help" className="m-0 text-sm text-content-secondary">
          Your name, cohort, capstone project and DSA contest rating become visible to the 340
          companies registered for the Batch of 2029 placement drive. Off by default until you
          complete Module 8.
        </p>
      </div>
      <div className="grid gap-2">
        <Row id="sw-h2" strong aria-describedby="sw-h2-help">
          Email notifications
        </Row>
        <p id="sw-h2-help" className="m-0 text-sm text-content-secondary">
          A single digest at 7:00 AM IST covering assignment deadlines and mentor replies.
        </p>
      </div>
    </div>
  ),
};

export const Pending: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="rest">
        <Row id="sw-p1" defaultChecked>Recruiter visibility</Row>
      </Spec>
      <Spec label="pending · awaiting the server">
        <Row id="sw-p2" defaultChecked pending>Recruiter visibility</Row>
      </Spec>
      <Spec label="pending · longer label">
        <Row id="sw-p3" pending>
          Share my capstone repository with the Batch of 2029 placement committee
        </Row>
      </Spec>
    </div>
  ),
};

/** Controlled, optimistic: flips at once, writes for 1.5s, then settles. */
export const Optimistic: Story = {
  render: function OptimisticStory() {
    const [on, setOn] = React.useState(false);
    const [pending, setPending] = React.useState(false);
    return (
      <Row
        id="sw-opt"
        checked={on}
        pending={pending}
        onCheckedChange={(v) => {
          setOn(v);
          setPending(true);
          window.setTimeout(() => setPending(false), 1500);
        }}
      >
        Recruiter visibility
      </Row>
    );
  },
};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="off"><Switch aria-label="off" /></Spec>
      <Spec label="on"><Switch aria-label="on" defaultChecked /></Spec>
      <Spec label="disabled · off"><Switch aria-label="disabled off" disabled /></Spec>
      <Spec label="disabled · on"><Switch aria-label="disabled on" disabled defaultChecked /></Spec>
      <Spec label="pending · off"><Switch aria-label="pending off" pending /></Spec>
      <Spec label="pending · on"><Switch aria-label="pending on" pending defaultChecked /></Spec>
    </div>
  ),
};
