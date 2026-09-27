import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { At, CalendarBlank, Copy, Eye, EyeSlash, Link as LinkGlyph, MagnifyingGlass, X } from '@phosphor-icons/react';

import { Field } from '../Field';
import { Kbd } from '../Kbd';
import { NumberInput } from '../NumberInput';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupControl,
  InputGroupInput,
  InputGroupText,
  type InputGroupSize,
} from './InputGroup';

const SIZES: InputGroupSize[] = ['sm', 'md', 'lg'];

const meta = {
  title: 'Molecules/InputGroup',
  component: InputGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'One field with things attached: a leading icon, a unit (₹, %, "months", "@scaler.com"), a trailing',
          'action (clear, show password, copy). The **group** draws the field chrome — border, focus ring,',
          'invalid, disabled, read-only — keyed to its control with `has-[[data-slot=input-group-control]…]`,',
          'and the control drops its own, so the ring goes round the unit and the action too.',
          '',
          '- `InputGroupAddon align="inline-start" | "inline-end"` holds an icon, `InputGroupText` or buttons. A click',
          '  on it focuses the field. Visual side comes from `align`; put a trailing action after the control in the markup.',
          '- `InputGroupText` is not part of the value, and IS in the control’s `aria-describedby`',
          '  (`aria-hidden` opts out when the label already says it).',
          '- `InputGroupButton` is a neutral Button, 4px inside the field at every size, disabled with it.',
          '- `InputGroupInput` is Input as the control; `InputGroupControl` does the same for any one control',
          '  (`NumberInput stepper={false}`).',
          '',
          'Inside a flat `<Field label>` the group forwards the id, `aria-*` and `disabled` to its control.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: SIZES,
      table: { defaultValue: { summary: 'md' } },
      description: 'Height and type size: 32 / 40 / 48px. The control, addon text and buttons follow it.',
    },
    disabled: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
      description: 'Disables the control and every InputGroupButton.',
    },
  },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- helpers -------------------------------------------------------- */

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'grid',
      gap: 24,
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
      maxWidth: 1040,
      alignItems: 'start',
    }}
  >
    {children}
  </div>
);

const Spec = ({ tag, children }: { tag: string; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 12, alignContent: 'start', minWidth: 0 }}>
    <span style={{ font: '600 12px/1 var(--font-family-sans)', color: 'var(--content-secondary)' }}>{tag}</span>
    {children}
  </div>
);

function PasswordField({ size }: { size?: InputGroupSize }) {
  const [shown, setShown] = React.useState(false);
  return (
    <Field label="Portal password" help="At least 12 characters.">
      <InputGroup size={size}>
        <InputGroupInput type={shown ? 'text' : 'password'} defaultValue="cohort-seven-2026" autoComplete="current-password" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={shown ? 'Hide password' : 'Show password'}
            aria-pressed={shown}
            onClick={() => setShown((s) => !s)}
          >
            {shown ? <EyeSlash /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

function ClearableSearch() {
  const [value, setValue] = React.useState('Aarav');
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <InputGroup>
      <InputGroupAddon>
        <MagnifyingGlass />
      </InputGroupAddon>
      <InputGroupInput
        ref={ref}
        type="search"
        aria-label="Search cohort roster"
        placeholder="Name, applicant ID or email"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label="Clear search"
            onClick={() => {
              setValue('');
              ref.current?.focus();
            }}
          >
            <X weight="bold" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

/* ---------- stories -------------------------------------------------------- */

/** The group's own props, live, around a ₹ fee. */
export const Playground: Story = {
  args: { size: 'md', disabled: false },
  render: (args) => (
    <div style={{ maxWidth: 400 }}>
      <Field label="Scholarship amount" help="Up to ₹19,50,000, in steps of ₹500." controlId="pg-fee">
        <InputGroup {...args}>
          <InputGroupAddon>
            <InputGroupText>₹</InputGroupText>
          </InputGroupAddon>
          <InputGroupControl>
            <NumberInput stepper={false} min={0} max={1950000} step={500} defaultValue={195000} />
          </InputGroupControl>
        </InputGroup>
      </Field>
    </div>
  ),
};

/** Units and affixes. Addon text is never part of the value, and is read as the field's description. */
export const Units: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid>
      <Spec tag="prefix · ₹ (NumberInput, no steppers)">
        <Field label="Semester fee waiver requested" help="Full programme fee is ₹19,50,000.">
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>₹</InputGroupText>
            </InputGroupAddon>
            <InputGroupControl>
              <NumberInput stepper={false} min={0} max={1950000} step={500} defaultValue={195000} />
            </InputGroupControl>
          </InputGroup>
        </Field>
      </Spec>
      <Spec tag="suffix · %">
        <Field label="Minimum attendance to sit the endsem" help="Cohort 7 policy floor is 75%.">
          <InputGroup>
            <InputGroupControl>
              <NumberInput stepper={false} min={0} max={100} defaultValue={75} />
            </InputGroupControl>
            <InputGroupAddon align="inline-end">
              <InputGroupText>%</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </Spec>
      <Spec tag="suffix · a word">
        <Field label="EMI tenure" help="6 to 36 months, at 0% interest.">
          <InputGroup>
            <InputGroupControl>
              <NumberInput stepper={false} min={6} max={36} defaultValue={12} />
            </InputGroupControl>
            <InputGroupAddon align="inline-end">
              <InputGroupText>months</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </Spec>
      <Spec tag="suffix · a domain">
        <Field label="Scaler email" help="We create the mailbox when you accept the offer.">
          <InputGroup>
            <InputGroupInput defaultValue="aarav.krishnan" autoComplete="off" spellCheck={false} />
            <InputGroupAddon align="inline-end">
              <InputGroupText>@scaler.com</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </Spec>
      <Spec tag="both · ₹ and /month">
        <Field label="Monthly stipend">
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>₹</InputGroupText>
            </InputGroupAddon>
            <InputGroupControl>
              <NumberInput stepper={false} min={0} defaultValue={35000} />
            </InputGroupControl>
            <InputGroupAddon align="inline-end">
              <InputGroupText>/month</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </Spec>
      <Spec tag="leading icon">
        <Field label="Personal email">
          <InputGroup>
            <InputGroupAddon>
              <At />
            </InputGroupAddon>
            <InputGroupInput type="email" placeholder="you@example.com" autoComplete="email" />
          </InputGroup>
        </Field>
      </Spec>
    </Grid>
  ),
};

/** Trailing actions: a toggle, a clear, a copy, a text button, a keyboard hint. */
export const Actions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid>
      <Spec tag="show password (a toggle: aria-pressed)">
        <PasswordField />
      </Spec>
      <Spec tag="leading icon + clear">
        <ClearableSearch />
      </Spec>
      <Spec tag="read-only + copy">
        <Field label="Referral link" help="Share it; you both get ₹5,000 off.">
          <InputGroup>
            <InputGroupAddon>
              <LinkGlyph />
            </InputGroupAddon>
            <InputGroupInput readOnly defaultValue="scaler.com/r/aarav-k7" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton aria-label="Copy referral link">
                <Copy />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </Spec>
      <Spec tag="text button">
        <Field label="Coupon code">
          <InputGroup>
            <InputGroupInput defaultValue="EARLYBIRD26" autoCapitalize="characters" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="text" variant="secondary">
                Apply
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </Spec>
      <Spec tag="trailing calendar">
        <Field label="Interview date" help="Format DD/MM/YYYY.">
          <InputGroup>
            <InputGroupInput inputMode="numeric" placeholder="DD/MM/YYYY" defaultValue="27/03/2026" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton aria-label="Choose interview date from calendar">
                <CalendarBlank />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </Spec>
      <Spec tag="keyboard hint">
        <InputGroup>
          <InputGroupAddon>
            <MagnifyingGlass />
          </InputGroupAddon>
          <InputGroupInput type="search" aria-label="Search the learning platform" placeholder="Search courses, problems…" />
          <InputGroupAddon align="inline-end">
            <Kbd>⌘K</Kbd>
          </InputGroupAddon>
        </InputGroup>
      </Spec>
    </Grid>
  ),
};

/** Input's heights: 32 / 40 / 48px. Addon text, icons and buttons scale with the group. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid>
      {SIZES.map((size) => (
        <Spec key={size} tag={size}>
          <InputGroup size={size}>
            <InputGroupAddon>
              <InputGroupText>₹</InputGroupText>
            </InputGroupAddon>
            <InputGroupControl>
              <NumberInput stepper={false} aria-label={`Fee, ${size}`} defaultValue={275000} />
            </InputGroupControl>
            <InputGroupAddon align="inline-end">
              <InputGroupButton aria-label={`Clear fee, ${size}`}>
                <X weight="bold" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <PasswordField size={size} />
        </Spec>
      ))}
    </Grid>
  ),
};

/** Invalid, disabled and read-only are the control's attributes, drawn by the group. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid>
      <Spec tag="invalid (Field error)">
        <Field label="Semester fee waiver requested" error="Waivers go up to ₹19,50,000. Enter a smaller amount.">
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>₹</InputGroupText>
            </InputGroupAddon>
            <InputGroupControl>
              <NumberInput stepper={false} clampOnBlur={false} max={1950000} defaultValue={2500000} />
            </InputGroupControl>
          </InputGroup>
        </Field>
      </Spec>
      <Spec tag="disabled (Field disabled)">
        <Field label="Interview date" help="Locked once the offer letter is issued." disabled>
          <InputGroup>
            <InputGroupInput defaultValue="27/03/2026" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton aria-label="Change interview date">
                <CalendarBlank />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </Spec>
      <Spec tag="read-only">
        <Field label="Application fee paid">
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>₹</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput readOnly defaultValue="1,500" />
          </InputGroup>
        </Field>
      </Spec>
      <Spec tag="focus (click into the field)">
        <Field label="Scaler email">
          <InputGroup>
            <InputGroupInput defaultValue="aarav.krishnan" />
            <InputGroupAddon align="inline-end">
              <InputGroupText>@scaler.com</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </Spec>
    </Grid>
  ),
};

/** At 320px the value field shrinks; units, icons and buttons keep their size. */
export const Narrow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 24, maxWidth: 288 }}>
      <Field label="Scaler email">
        <InputGroup>
          <InputGroupInput defaultValue="aarav.krishnan.cohort7" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>@scaler.com</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <PasswordField />
    </div>
  ),
};
