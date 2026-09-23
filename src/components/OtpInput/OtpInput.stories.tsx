import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Spinner } from '../Spinner';
import { OtpInput, OtpInputGroup, OtpInputSlot } from './OtpInput';

const meta = {
  title: 'Atoms/OtpInput',
  component: OtpInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A one-time code, typed or pasted. Six `aria-hidden` boxes over **one** real transparent',
          '`<input>` (`input-otp`): one label, one value, `autocomplete="one-time-code"` on the one',
          'field iOS / Android will fill, and the browser’s own paste, Backspace, arrows and undo.',
          'Non-digits are refused; a pasted SMS ("Your Scaler code is 284193") is stripped to digits.',
          '',
          'Invalid (`aria-invalid`) restyles the **whole** control. `verifying` keeps the digits legible',
          '(it is not disabled), goes read-only + `aria-busy`, and pairs with a `role="status"` line.',
          'Focus shows twice: a ring around the group, and the box under the caret.',
        ].join('\n'),
      },
    },
  },
  args: { 'aria-label': 'Verification code' },
  argTypes: {
    maxLength: { control: { type: 'number', min: 4, max: 8 } },
    disabled: { control: 'boolean' },
    verifying: { control: 'boolean' },
    'aria-invalid': { control: 'boolean', name: 'aria-invalid' },
  },
} satisfies Meta<typeof OtpInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start' }}>{children}</div>
);

const Spec = ({ tag, label, htmlFor, children }: { tag: string; label: string; htmlFor: string; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 8, justifyItems: 'start', alignContent: 'start', maxWidth: 360, minWidth: 0 }}>
    <span style={{ font: '600 11px/1 var(--font-family-mono)', color: 'var(--content-secondary)', textTransform: 'uppercase' }}>{tag}</span>
    <label htmlFor={htmlFor} style={{ font: 'var(--font-weight-semibold) var(--font-size-sm)/1.4 var(--font-family-sans)' }}>
      {label}
    </label>
    {children}
  </div>
);

const Help = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <p id={id} className="text-sm text-content-secondary">{children}</p>
);

/** Every prop, live. Type, paste, Backspace, arrows. */
export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <Row>
      <Spec tag="empty" label="Verification code" htmlFor="otp-empty">
        <OtpInput id="otp-empty" aria-describedby="otp-empty-help" />
        <Help id="otp-empty-help">Six digits, sent to +91 98450 21174. Expires in 10 minutes.</Help>
      </Spec>
      <Spec tag="partially filled · 3 of 6" label="Verification code" htmlFor="otp-partial">
        <OtpInput id="otp-partial" defaultValue="284" />
      </Spec>
      <Spec tag="complete · 6 of 6" label="Verification code" htmlFor="otp-complete">
        <OtpInput id="otp-complete" defaultValue="284193" />
      </Spec>
      <Spec tag="focused · caret on box 4" label="Verification code" htmlFor="otp-focus">
        <OtpInput id="otp-focus" defaultValue="284" autoFocus />
      </Spec>
      <Spec tag="invalid · wrong code" label="Verification code" htmlFor="otp-invalid">
        <OtpInput id="otp-invalid" defaultValue="284190" aria-invalid aria-describedby="otp-invalid-err" />
        <p id="otp-invalid-err" className="text-sm text-danger-content">
          That code is not right. Two attempts left before the code is reissued.
        </p>
      </Spec>
      <Spec tag="disabled" label="Verification code" htmlFor="otp-disabled">
        <OtpInput id="otp-disabled" disabled aria-describedby="otp-disabled-help" />
        <Help id="otp-disabled-help">Disabled until a code has actually been sent.</Help>
      </Spec>
    </Row>
  ),
};

/** Verifying: read-only + busy, digits at full contrast, inert edges, a status line beside it. */
export const Verifying: Story = {
  render: () => (
    <Row>
      <Spec tag="verifying · role=status + loader" label="Verification code" htmlFor="otp-verifying">
        <OtpInput id="otp-verifying" verifying defaultValue="284193" aria-describedby="otp-verifying-status" />
        <p id="otp-verifying-status" role="status" className="flex items-center gap-2 text-sm text-content-secondary">
          <Spinner size="sm" />
          Checking code…
        </p>
      </Spec>
      <Spec tag="complete · with resend" label="Verification code" htmlFor="otp-resend">
        <OtpInput id="otp-resend" defaultValue="284193" aria-describedby="otp-resend-help" />
        <Help id="otp-resend-help">A new code can be requested again in 00:24.</Help>
      </Spec>
    </Row>
  ),
};

/** Custom layout: `OtpInputGroup` / `OtpInputSlot`, e.g. a 3 + 3 split or a 4-digit code. */
export const CustomLayout: Story = {
  render: () => (
    <Row>
      <Spec tag="3 + 3" label="Verification code" htmlFor="otp-split">
        <OtpInput id="otp-split" className="gap-4">
          <OtpInputGroup>
            <OtpInputSlot index={0} />
            <OtpInputSlot index={1} />
            <OtpInputSlot index={2} />
          </OtpInputGroup>
          <OtpInputGroup>
            <OtpInputSlot index={3} />
            <OtpInputSlot index={4} />
            <OtpInputSlot index={5} />
          </OtpInputGroup>
        </OtpInput>
      </Spec>
      <Spec tag="maxLength 4" label="PIN from the email" htmlFor="otp-four">
        <OtpInput id="otp-four" maxLength={4} defaultValue="19" />
      </Spec>
    </Row>
  ),
};

/** Controlled with `onComplete`, beside uncontrolled. */
export const ControlledAndUncontrolled: Story = {
  render: () => {
    const Demo = () => {
      const [code, setCode] = React.useState('');
      const [done, setDone] = React.useState<string | null>(null);
      return (
        <Row>
          <Spec tag={`controlled · value = "${code}"`} label="Verification code" htmlFor="otp-ctl">
            <OtpInput
              id="otp-ctl"
              value={code}
              onChange={(v) => {
                setCode(v);
                setDone(null);
              }}
              onComplete={(v: string) => setDone(v)}
            />
            <Help id="otp-ctl-help">{done ? `onComplete(${done})` : 'Type or paste six digits.'}</Help>
          </Spec>
          <Spec tag="uncontrolled · defaultValue" label="Verification code" htmlFor="otp-unc">
            <OtpInput id="otp-unc" defaultValue="28" />
          </Spec>
        </Row>
      );
    };
    return <Demo />;
  },
};
