import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input, type InputSize } from './Input';

const SIZES: InputSize[] = ['sm', 'md', 'lg'];

const meta = {
  title: 'Atoms/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A single-line text field. It is a bare `<input>` — no wrapper element, no label',
          'prop, no help-text prop.',
          '',
          'That is deliberate and it is the shadcn/ui shape. A label is a separate element with',
          'its own `htmlFor`; help and error text are separate elements referenced by',
          '`aria-describedby`. Those belong to **Field**, which composes them. An Input that',
          'grows a `label` prop is an Input that can never be put inside anything else.',
          '',
          'Validity is `aria-invalid`, not an `invalid` boolean — the attribute is what assistive',
          'technology reads *and* what the red border keys off, so there is one source of truth',
          'instead of two that can disagree.',
          '',
          '`type` is the native attribute, untouched. Everything else on the props table comes',
          'free from `React.ComponentProps<"input">`, minus the legacy `size` attribute, which',
          'the size scale takes over.',
          '',
          'Use the **brand** and **theme** toolbar controls above to check any story across all',
          'four combinations — SST/SSB x light/dark.',
        ].join('\n'),
      },
    },
  },
  args: {
    placeholder: 'you@scaler.com',
    size: 'md',
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: SIZES,
      table: { defaultValue: { summary: 'md' } },
      description:
        'Control height: 32 / 40 / 48px, from `--size-control-*`. Horizontal padding is constant across the scale.',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'tel', 'url', 'number', 'date', 'file'],
      table: { defaultValue: { summary: 'text' } },
    },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    'aria-invalid': { control: 'boolean', name: 'aria-invalid' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- layout helpers for the matrix stories ------------------------- */

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 360 }}>
    {children}
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="m-0 font-sans type-eyebrow text-content-secondary">
    {children}
  </p>
);

const Case = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <Label>{label}</Label>
    {children}
  </div>
);

/* ---------- stories -------------------------------------------------------- */

/** Every prop, live. Start here. */
export const Playground: Story = {};

/** 32 / 40 / 48px. The same three control heights Button uses, so a field and a button sit level on one row. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      {SIZES.map((size) => (
        <Case key={size} label={size}>
          <Input size={size} placeholder="you@scaler.com" />
        </Case>
      ))}
    </Stack>
  ),
};

/**
 * The full state set, in one column so the border weights can be compared
 * directly. **Disabled** is a fill, not an opacity — fading a control also fades
 * the surface behind it, and on a raised card the result is unreadable.
 * **Read-only** is not disabled: it stays legible, selectable and copyable, and
 * says "this is a value, not a field" with a dashed edge instead of by dimming
 * text someone may still need to read.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      <Case label="default">
        <Input placeholder="you@scaler.com" />
      </Case>
      <Case label="filled">
        <Input defaultValue="priya.raman@scaler.com" />
      </Case>
      <Case label="invalid — aria-invalid, not a prop">
        <Input defaultValue="priya.raman@scaler" aria-invalid />
      </Case>
      <Case label="read-only">
        <Input defaultValue="SSX-2026-0418" readOnly />
      </Case>
      <Case label="disabled">
        <Input defaultValue="priya.raman@scaler.com" disabled />
      </Case>
      <Case label="disabled, empty">
        <Input placeholder="you@scaler.com" disabled />
      </Case>
    </Stack>
  ),
};

/**
 * `type` is the native attribute and is passed straight through — the keyboard a
 * phone shows, the validation a browser runs and the autofill a password manager
 * offers all depend on it being honest.
 *
 * `type="search"` suppresses the browser's own clear button. Chrome draws one
 * from an embedded image that picks up the platform accent, at a size CSS cannot
 * set, right where a Search field puts its own — two clear buttons, one of them
 * unstyleable.
 */
export const Types: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      <Case label="email">
        <Input type="email" placeholder="you@scaler.com" autoComplete="email" />
      </Case>
      <Case label="password">
        <Input type="password" defaultValue="correcthorsebattery" autoComplete="current-password" />
      </Case>
      <Case label="search">
        <Input type="search" defaultValue="data structures" placeholder="Search cohorts" />
      </Case>
      <Case label="tel">
        <Input type="tel" placeholder="+91 98765 43210" autoComplete="tel" />
      </Case>
      <Case label="number">
        <Input type="number" defaultValue={12} min={0} max={24} />
      </Case>
      <Case label="date">
        <Input type="date" defaultValue="2026-04-18" />
      </Case>
      <Case label="file">
        <Input type="file" />
      </Case>
    </Stack>
  ),
};

/**
 * What a real field looks like assembled by hand, before `Field` exists to do it
 * for you. Note what the Input itself does **not** know about: the label's
 * `htmlFor`, the `aria-describedby` wiring, the gap. That is the whole argument
 * for keeping them out of it.
 */
export const ComposedWithLabelAndHelp: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-2)', maxWidth: 360 }}>
      <label
        htmlFor="story-work-email"
        style={{
          font: 'var(--font-weight-semibold) var(--font-size-sm)/1.4 var(--font-family-sans)',
          color: 'var(--content-primary)',
        }}
      >
        Work email{' '}
        <span aria-hidden="true" style={{ color: 'var(--status-danger-content)' }}>
          *
        </span>
      </label>
      <Input
        id="story-work-email"
        type="email"
        required
        aria-describedby="story-work-email-help"
        placeholder="you@scaler.com"
      />
      <p
        id="story-work-email-help"
        style={{
          margin: 0,
          fontSize: 'var(--font-size-sm)',
          color: 'var(--content-secondary)',
        }}
      >
        We use this for your admission updates. It is never shared.
      </p>
    </div>
  ),
};

/** The same field, failing. The message is referenced by `aria-describedby`, so a screen reader reads the reason and not just "invalid". */
export const ComposedInvalid: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-2)', maxWidth: 360 }}>
      <label
        htmlFor="story-invalid-email"
        style={{
          font: 'var(--font-weight-semibold) var(--font-size-sm)/1.4 var(--font-family-sans)',
          color: 'var(--content-primary)',
        }}
      >
        Work email
      </label>
      <Input
        id="story-invalid-email"
        type="email"
        defaultValue="priya.raman@scaler"
        aria-invalid
        aria-describedby="story-invalid-email-error"
      />
      <p
        id="story-invalid-email-error"
        style={{
          margin: 0,
          fontSize: 'var(--font-size-sm)',
          color: 'var(--status-danger-content)',
        }}
      >
        Add a domain — this address is missing everything after the @.
      </p>
    </div>
  ),
};
