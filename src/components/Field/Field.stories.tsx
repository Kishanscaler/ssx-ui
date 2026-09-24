import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { NumberInput } from '../NumberInput';
import { OtpInput, OtpInputGroup, OtpInputSlot } from '../OtpInput';
import { PhoneInput } from '../PhoneInput';
import { RadioGroup, RadioGroupItem } from '../RadioGroup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select';
import { Switch } from '../Switch';
import { Textarea } from '../Textarea';
import {
  Field,
  FieldControl,
  FieldError,
  FieldHelp,
  FieldLabel,
  FieldSet,
  type FieldOrientation,
} from './Field';

const ORIENTATIONS: FieldOrientation[] = ['vertical', 'horizontal'];

const meta = {
  title: 'Molecules/Field',
  component: Field,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The composed form unit: label, required / optional marker, ONE control, help text and',
          'error, wired together (`htmlFor` / `id`, `aria-describedby`, `aria-invalid`,',
          '`aria-required`, `disabled`). Use it for every control a person types into or chooses',
          'from; a bare toolbar filter takes an `aria-label` instead.',
          '',
          '**Flat** — plain-string props, for a CMS blok: `<Field label help error required><Input /></Field>`.',
          '**Compound** — `FieldLabel`, `FieldControl`, `FieldHelp`, `FieldError`, when parts need to move.',
          'A Select is wired by wrapping its `SelectTrigger` in `FieldControl`.',
          '',
          'A **group** (checkbox list, radio group) is a `FieldSet` with a `legend`,',
          '`variant="choices"`, each option a `horizontal` Field. **Stacked fields** go in a',
          '`FieldSet` (24px apart); inside one Field the parts are 8px apart.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'The visible label. Given, Field renders the flat form.' },
    help: { control: 'text', description: 'Help text under the control, linked by `aria-describedby`.' },
    error: {
      control: 'text',
      description: 'Error message. Sets `aria-invalid` on the control and is linked by `aria-describedby`.',
    },
    required: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
      description: 'Draws `*` + visually hidden "(required)"; sets `aria-required`.',
    },
    optional: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
      description: 'Draws a quiet "Optional" after the label (a string replaces the word).',
    },
    disabled: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
      description: 'Forwarded to the control.',
    },
    invalid: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
      description: 'Marks the control invalid without a message.',
    },
    orientation: {
      control: 'select',
      options: ORIENTATIONS,
      table: { defaultValue: { summary: 'vertical' } },
      description: '`horizontal` is for one checkbox / radio / switch: control, then label.',
    },
    controlId: { control: 'text', description: "The control's id and the label's `htmlFor`. Generated when omitted." },
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- helpers -------------------------------------------------------- */

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', maxWidth: 1040, alignItems: 'start' }}>
    {children}
  </div>
);

const Spec = ({ tag, children }: { tag: string; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
    <span style={{ font: '600 12px/1 var(--font-family-sans)', color: 'var(--content-secondary)' }}>{tag}</span>
    {children}
  </div>
);

const Subhead = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-8 mb-4 font-sans type-eyebrow text-content-secondary">
    {children}
  </p>
);

/* ---------- stories -------------------------------------------------------- */

/** Every public prop, live, around an Input (a Checkbox when `horizontal`). */
export const Playground: Story = {
  args: {
    label: 'SST roll number',
    help: 'Printed on your admission letter, e.g. SST-2029-0416.',
    error: '',
    required: true,
    optional: false,
    disabled: false,
    invalid: false,
    orientation: 'vertical',
  },
  render: (args) => (
    <div style={{ maxWidth: 400 }}>
      <Field {...args}>{args.orientation === 'horizontal' ? <Checkbox /> : <Input defaultValue="SST-2029-0416" />}</Field>
    </div>
  ),
};

/** Label + control, and with help text. */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid>
      <Spec tag="rest · label + control">
        <Field label="Full name">
          <Input defaultValue="Aarav Krishnan" />
        </Field>
      </Spec>
      <Spec tag="with help text">
        <Field label="Scaler email" help="We send cohort announcements and the weekly DSA digest here.">
          <Input type="email" defaultValue="aarav.k@sst.scaler.com" />
        </Field>
      </Spec>
    </Grid>
  ),
};

export const RequiredVsOptional: Story = {
  parameters: { controls: { disable: true } },
  name: 'Required vs optional',
  render: () => (
    <Grid>
      <Spec tag="required">
        <Field label="SST roll number" required help="Printed on your admission letter, e.g. SST-2029-0416.">
          <Input defaultValue="SST-2029-0416" required />
        </Field>
      </Spec>
      <Spec tag="optional">
        <Field label="GitHub handle" optional help="Linked on your capstone and GSoC submissions.">
          <Input placeholder="aaravkrishnan" />
        </Field>
      </Spec>
    </Grid>
  ),
};

/** Invalid (error linked by aria-describedby) and disabled. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid>
      <Spec tag="invalid · error linked by aria-describedby">
        <Field
          label="SST roll number"
          required
          error="Roll numbers are 13 characters — check the four digits after the batch year."
        >
          <Input defaultValue="SST-2029-41" required />
        </Field>
      </Spec>
      <Spec tag="disabled">
        <Field label="Cohort" disabled help="Cohort is assigned by admissions ops and cannot be edited here.">
          <Input defaultValue="Cohort 7 · Bengaluru" />
        </Field>
      </Spec>
    </Grid>
  ),
};

/** Select (via FieldControl on the trigger), Textarea, NumberInput, PhoneInput, OtpInput. */
export const AroundOtherControls: Story = {
  parameters: { controls: { disable: true } },
  name: 'Field around other controls',
  render: () => (
    <Grid>
      <Spec tag="select">
        <Field label="Elective track" required help="Locked once Year 2 registration closes on 14 Apr 2026.">
          <Select defaultValue="ml">
            <FieldControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FieldControl>
            <SelectContent>
              <SelectItem value="ds">Distributed Systems</SelectItem>
              <SelectItem value="ml">Applied Machine Learning</SelectItem>
              <SelectItem value="pe">Product Engineering</SelectItem>
              <SelectItem value="qf">Quantitative Finance</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Spec>
      <Spec tag="textarea">
        <Field label="Why this elective?" help="150–300 words. Your mentor reads this before the allocation call.">
          <Textarea defaultValue="I want to take the distributed systems path because my capstone is a multi-region job scheduler and I need the consistency material before the Week 6 design review." />
        </Field>
      </Spec>
      <Spec tag="number input">
        <Field label="Quiz attempts" help="Best of 5 attempts counts toward the module grade.">
          <NumberInput defaultValue={3} min={1} max={5} />
        </Field>
      </Spec>
      <Spec tag="phone input">
        <Field label="Guardian mobile" required help="We call this number only for hostel emergencies.">
          <PhoneInput defaultValue="9845021174" />
        </Field>
      </Spec>
      <Spec tag="otp input · invalid">
        <Field label="Verification code" error="That code has expired — request a new one.">
          <OtpInput maxLength={6}>
            <OtpInputGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <OtpInputSlot key={i} index={i} />
              ))}
            </OtpInputGroup>
          </OtpInput>
        </Field>
      </Spec>
      <Spec tag="switch · horizontal">
        <Field label="Email me the weekly DSA digest" orientation="horizontal" help="Sent every Sunday, 9:00 AM IST.">
          <Switch defaultChecked />
        </Field>
      </Spec>
    </Grid>
  ),
};

/** fieldset + legend, each option a horizontal Field. */
export const CheckboxGroup: Story = {
  parameters: { controls: { disable: true } },
  name: 'Checkbox group · fieldset + legend',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <FieldSet
        variant="choices"
        legend="Which placement drives should we shortlist you for?"
        help="Pick every track you would accept an offer in. You can change this until the drive opens."
      >
        <Field label="Product engineering (SDE-1)" orientation="horizontal">
          <Checkbox defaultChecked />
        </Field>
        <Field label="Applied AI / ML engineering" orientation="horizontal">
          <Checkbox defaultChecked />
        </Field>
        <Field label="Data engineering" orientation="horizontal">
          <Checkbox />
        </Field>
        <Field label="Founder's office (SSB only)" orientation="horizontal" disabled>
          <Checkbox />
        </Field>
      </FieldSet>
    </div>
  ),
};

/** A RadioGroup inside a choices FieldSet, with a group-level error. */
export const RadioGroupInFieldSet: Story = {
  parameters: { controls: { disable: true } },
  name: 'Radio group · group error',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <FieldSet variant="choices" legend="Preferred campus" required error="Choose a campus to continue.">
        <RadioGroup aria-invalid>
          <Field label="Bengaluru" orientation="horizontal">
            <RadioGroupItem value="blr" />
          </Field>
          <Field label="Pune" orientation="horizontal">
            <RadioGroupItem value="pune" />
          </Field>
          <Field label="Hyderabad" orientation="horizontal">
            <RadioGroupItem value="hyd" />
          </Field>
        </RadioGroup>
      </FieldSet>
    </div>
  ),
};

/** Two fields in a form column: 24px apart; the legend is for AT only. */
export const StackedFields: Story = {
  parameters: { controls: { disable: true } },
  name: 'Stacked fields',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <FieldSet legend="Guardian contact" hideLegend>
        <Field label="Guardian name" required>
          <Input defaultValue="Sushmita Krishnan" required />
        </Field>
        <Field label="Guardian mobile" required>
          <Input type="tel" defaultValue="+91 98450 21174" required />
        </Field>
      </FieldSet>
    </div>
  ),
};

/** The compound form: the same DOM, parts placed by hand. */
export const Compound: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [value, setValue] = React.useState('SST-2029-41');
    const error = value.length === 13 ? null : 'Roll numbers are 13 characters — check the four digits after the batch year.';
    return (
      <div style={{ maxWidth: 400 }}>
        <Field required>
          <FieldLabel>SST roll number</FieldLabel>
          <FieldControl>
            <Input value={value} onChange={(e) => setValue(e.target.value)} required />
          </FieldControl>
          <FieldHelp>Type 13 characters to clear the error.</FieldHelp>
          <FieldError>{error}</FieldError>
        </Field>
      </div>
    );
  },
};

/** The whole preview section on one page, for four-way brand × theme review. */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ maxWidth: 1040 }}>
      <Subhead>Anatomy</Subhead>
      {Anatomy.render!({} as never, {} as never)}
      <Subhead>Required vs optional</Subhead>
      {RequiredVsOptional.render!({} as never, {} as never)}
      <Subhead>States</Subhead>
      {States.render!({} as never, {} as never)}
      <Subhead>Field around other controls</Subhead>
      {AroundOtherControls.render!({} as never, {} as never)}
      <Subhead>Checkbox group · fieldset + legend</Subhead>
      {CheckboxGroup.render!({} as never, {} as never)}
      <Subhead>Radio group · group error</Subhead>
      {RadioGroupInFieldSet.render!({} as never, {} as never)}
      <Subhead>Stacked fields</Subhead>
      {StackedFields.render!({} as never, {} as never)}
    </div>
  ),
};
