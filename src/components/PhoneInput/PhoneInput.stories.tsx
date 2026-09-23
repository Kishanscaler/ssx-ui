import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PhoneInput } from './PhoneInput';

const meta = {
  title: 'Atoms/PhoneInput',
  component: PhoneInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A mobile number and its dial code captured as **one** value (E.164, `+919845021174`),',
          'through `value` / `onValueChange`. With `name`, a hidden input submits the E.164 string.',
          '',
          'The country picker **is** the Select atom (same trigger, listbox, check column, keyboard and',
          'type-ahead) sitting with a `type="tel"` field inside one bordered group: hover, focus and',
          'invalid are states of the group. India is the default country.',
          '',
          'The number groups itself from the country’s mask as you type (caret held on its digit);',
          'switching country re-groups rather than clears; a leading "+" parses the dial code and moves',
          'the selector (type `+971501234567`). `flag="auto"` probes for flag-emoji support and falls',
          'back to an ISO chip (Windows has no flag glyphs); the trigger is named in words either way.',
        ].join('\n'),
      },
    },
  },
  args: { 'aria-label': 'Guardian mobile', size: 'md', flag: 'auto', defaultCountry: 'IN' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    flag: { control: 'inline-radio', options: ['auto', 'emoji', 'iso'] },
    defaultCountry: { control: 'select', options: ['IN', 'US', 'AE', 'SG', 'GB', 'AU'] },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    'aria-invalid': { control: 'boolean', name: 'aria-invalid' },
  },
  decorators: [(Story) => <div style={{ maxWidth: 360 }}><Story /></div>],
} satisfies Meta<typeof PhoneInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 28, gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', width: 'min(1100px, 90vw)', alignItems: 'start' }}>
    {children}
  </div>
);

const Spec = ({ tag, label, htmlFor, children }: { tag: string; label: string; htmlFor: string; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
    <span style={{ font: '600 11px/1 var(--font-family-mono)', color: 'var(--content-secondary)', textTransform: 'uppercase' }}>{tag}</span>
    <label htmlFor={htmlFor} style={{ font: 'var(--font-weight-semibold) var(--font-size-sm)/1.4 var(--font-family-sans)' }}>
      {label}
    </label>
    {children}
  </div>
);

/** A live field with the E.164 readout the preview shows under it. */
function WithReadout({ id, label, tag, ...props }: React.ComponentProps<typeof PhoneInput> & { id: string; label: string; tag: string }) {
  const [e164, setE164] = React.useState(props.defaultValue ?? '');
  return (
    <Spec tag={tag} label={label} htmlFor={id}>
      <PhoneInput id={id} aria-describedby={`${id}-help`} {...props} onValueChange={(v) => setE164(v)} />
      <p id={`${id}-help`} className="text-sm text-content-secondary">
        Saved as <span className="tabular-nums">{e164 || '—'}</span>
      </p>
    </Spec>
  );
}

/** Every prop, live. */
export const Playground: Story = {};

/** Rest, filled, disabled, read-only, invalid. Hover and focus-within are live on the whole group. */
export const States: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <Grid>
      <WithReadout tag="rest · empty" label="Guardian mobile *" id="ph-rest" />
      <WithReadout tag="filled · grouped as you type" label="Guardian mobile *" id="ph-fill" defaultValue="+919845021174" />
      <Spec tag="disabled" label="Guardian mobile" htmlFor="ph-dis">
        <PhoneInput id="ph-dis" defaultValue="+919845021174" disabled />
      </Spec>
      <Spec tag="read-only" label="Guardian mobile" htmlFor="ph-ro">
        <PhoneInput id="ph-ro" defaultValue="+919845021174" readOnly />
      </Spec>
      <Spec tag="invalid · aria-invalid + error" label="Guardian mobile *" htmlFor="ph-inv">
        <PhoneInput id="ph-inv" defaultValue="+9198450" aria-invalid aria-describedby="ph-inv-err" />
        <p id="ph-inv-err" className="text-sm text-danger-content">
          Enter all 10 digits of the mobile number.
        </p>
      </Spec>
    </Grid>
  ),
};

/** The mask follows the country: US, UAE, UK, Singapore, Australia. */
export const GroupingFollowsTheCountry: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <Grid>
      <WithReadout tag="United States · +1" label="Guardian mobile" id="ph-us" defaultValue="+14155550132" />
      <WithReadout tag="United Arab Emirates · +971" label="Guardian mobile" id="ph-ae" defaultValue="+971501234567" />
      <WithReadout tag="United Kingdom · +44" label="Guardian mobile" id="ph-gb" defaultValue="+447700900461" />
      <WithReadout tag="Singapore · +65" label="Guardian mobile" id="ph-sg" defaultValue="+6591234567" />
      <WithReadout tag="Australia · +61" label="Guardian mobile" id="ph-au" defaultValue="+61412345678" />
    </Grid>
  ),
};

/** Flags are decoration: emoji where the platform has them, the ISO chip (what Windows sees) pinned on the right. */
export const FlagFallback: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <Grid>
      <Spec tag="flag emoji (pinned)" label="Guardian mobile" htmlFor="ph-flag-a">
        <PhoneInput id="ph-flag-a" flag="emoji" defaultValue="+971501234567" />
      </Spec>
      <Spec tag="ISO chip (pinned) · Windows fallback" label="Guardian mobile (overseas)" htmlFor="ph-flag-b">
        <PhoneInput id="ph-flag-b" flag="iso" defaultValue="+971501234567" />
      </Spec>
    </Grid>
  ),
};

/** 32 / 40 / 48px. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <PhoneInput key={size} aria-label={`Guardian mobile, ${size}`} size={size} defaultValue="+919845021174" />
      ))}
    </div>
  ),
};

/** The country list, held open: the Select listbox with flag, name and trailing dial code. */
export const CountryListOpen: Story = {
  parameters: { a11y: { test: 'off' } },
  render: () => {
    const Open = () => {
      const ref = React.useRef<HTMLDivElement>(null);
      React.useEffect(() => {
        const trigger = ref.current?.querySelector<HTMLButtonElement>('[data-slot=phone-input-country]');
        trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }, []);
      return (
        <div ref={ref} style={{ minHeight: 360 }}>
          <PhoneInput aria-label="Guardian mobile" defaultValue="+919845021174" />
        </div>
      );
    };
    return <Open />;
  },
};

/** Controlled E.164 value and country, beside uncontrolled. */
export const ControlledAndUncontrolled: Story = {
  decorators: [(Story) => <Story />],
  render: () => {
    const Demo = () => {
      const [value, setValue] = React.useState('+6591234567');
      const [country, setCountry] = React.useState('SG');
      return (
        <Grid>
          <Spec tag={`controlled · ${value || "''"} · ${country}`} label="Guardian mobile" htmlFor="ph-ctl">
            <PhoneInput id="ph-ctl" value={value} onValueChange={setValue} country={country} onCountryChange={setCountry} />
          </Spec>
          <WithReadout tag="uncontrolled · defaultCountry GB" label="Guardian mobile" id="ph-unc" defaultCountry="GB" />
        </Grid>
      );
    };
    return <Demo />;
  },
};
