import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button';
import { Field, FieldSet } from '../Field';
import { Input } from '../Input';
import { InputGroup, InputGroupAddon, InputGroupControl, InputGroupInput, InputGroupText } from '../InputGroup';
import { NumberInput } from '../NumberInput';
import { RadioGroup, RadioGroupItem } from '../RadioGroup';
import { Form, type FormError } from './Form';
import { FormActions } from './FormActions';
import { FormErrorSummary } from './FormErrorSummary';

const meta = {
  title: 'Molecules/Form',
  component: Form,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A `<form>` that makes a failed submit land somewhere: the `FormErrorSummary` when one is rendered,',
          'otherwise the first `aria-invalid` field. It owns no values, rules or messages, so plain state,',
          'react-hook-form and server actions all work.',
          '',
          '**On submit:** native constraints on the controls (`required`, `type="email"`, `min`/`max`, `pattern`) are',
          'checked first (`constraintValidation`); a failure cancels the submit and calls `onInvalidSubmit(errors)`,',
          'or shows the browser message when there is no handler. Otherwise `onSubmit` runs, and after React commits',
          'what it set, focus moves to the summary or the first invalid field.',
          '',
          '**`noValidate` is on by default** — the browser bubbles are replaced by FieldError and the summary;',
          'the constraints are still checked. `noValidate={false}` hands validation back to the browser.',
          '',
          '**Async** (react-hook-form, server actions): the summary focuses itself when it appears, so render one.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    noValidate: { control: 'boolean', table: { defaultValue: { summary: 'true' } } },
    constraintValidation: { control: 'boolean', table: { defaultValue: { summary: 'true' } } },
    focusOnError: { control: 'boolean', table: { defaultValue: { summary: 'true' } } },
  },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- the application form ------------------------------------------ */

type Values = { name: string; email: string; track: string; fee: number | null };
type Errors = Partial<Record<'name' | 'email' | 'track' | 'fee', string>>;

function validate(v: Values): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = 'Enter your full name, as on your Class XII marksheet';
  if (!v.email.trim()) e.email = 'Enter the first part of your Scaler email';
  else if (/[@\s]/.test(v.email)) e.email = 'Enter only the part before @scaler.com';
  if (!v.track) e.track = 'Choose the track you are applying to';
  if (v.fee != null && v.fee > 195000) e.fee = 'Waivers go up to ₹1,95,000. Enter a smaller amount';
  return e;
}

const ORDER: Array<keyof Errors> = ['name', 'email', 'track', 'fee'];
const IDS: Record<keyof Errors, string> = { name: 'app-name', email: 'app-email', track: 'app-track', fee: 'app-fee' };

function toSummary(errors: Errors): FormError[] {
  return ORDER.filter((k) => errors[k]).map((k) => ({ fieldId: IDS[k], message: errors[k] }));
}

function ApplicationForm({
  initial = { name: '', email: '', track: '', fee: null },
  initialErrors = {},
  sticky = false,
  latency = 0,
}: {
  initial?: Values;
  initialErrors?: Errors;
  sticky?: boolean;
  /** Simulate a server round trip (a server action). */
  latency?: number;
}) {
  const [values, setValues] = React.useState<Values>(initial);
  const [errors, setErrors] = React.useState<Errors>(initialErrors);
  const [sent, setSent] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  return (
    <Form
      aria-label="SST application"
      // A sticky form fills its panel (a drawer, a sheet), so its bar spans it.
      style={{ maxWidth: sticky ? undefined : 560 }}
      onSubmit={(event) => {
        event.preventDefault();
        setSent(false);
        const run = () => {
          const next = validate(values);
          setErrors(next);
          setPending(false);
          if (Object.keys(next).length === 0) setSent(true);
        };
        if (latency) {
          setPending(true);
          window.setTimeout(run, latency);
        } else run();
      }}
    >
      <FormErrorSummary errors={toSummary(errors)} description="Fix these to submit your application." />
      {sent ? (
        <p role="status" className="m-0 type-body text-success-content">
          Application submitted. We will email you within 2 working days.
        </p>
      ) : null}
      <FieldSet legend="About you">
        <Field label="Full name" controlId={IDS.name} error={errors.name} required>
          <Input autoComplete="name" value={values.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field
          label="Scaler email"
          controlId={IDS.email}
          help="We create the mailbox when you accept the offer."
          error={errors.email}
          required
        >
          <InputGroup>
            <InputGroupInput
              autoComplete="off"
              spellCheck={false}
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>@scaler.com</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </FieldSet>
      <FieldSet legend="Track" hideLegend variant="choices" error={errors.track}>
        <p className="m-0 type-label text-content">Which track are you applying to?</p>
        <RadioGroup
          id={IDS.track}
          aria-label="Track"
          aria-invalid={errors.track ? true : undefined}
          value={values.track}
          onValueChange={(v) => set('track', v)}
        >
          <Field label="Software engineering" orientation="horizontal">
            <RadioGroupItem value="swe" />
          </Field>
          <Field label="Data science and AI" orientation="horizontal">
            <RadioGroupItem value="ds" />
          </Field>
        </RadioGroup>
      </FieldSet>
      <Field
        label="Scholarship waiver requested"
        controlId={IDS.fee}
        optional
        help="Up to ₹1,95,000 of the ₹19,50,000 programme fee."
        error={errors.fee}
      >
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>₹</InputGroupText>
          </InputGroupAddon>
          <InputGroupControl>
            <NumberInput
              stepper={false}
              min={0}
              step={500}
              clampOnBlur={false}
              value={values.fee}
              onValueChange={(v) => set('fee', v)}
            />
          </InputGroupControl>
        </InputGroup>
      </Field>
      <FormActions sticky={sticky}>
        <Button variant="secondary">Save draft</Button>
        <Button type="submit" loading={pending}>
          Submit application
        </Button>
      </FormActions>
    </Form>
  );
}

/** Submit it empty: focus goes to the summary; each link focuses its field. */
export const ApplicationFormStory: Story = {
  name: 'Application form',
  parameters: { controls: { disable: true } },
  render: () => <ApplicationForm />,
};

/** After a failed submit: three problems, listed and linked, each repeated beside its field. */
export const FailedSubmit: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ApplicationForm
      initial={{ name: 'Aarav Krishnan', email: 'aarav@gmail.com', track: '', fee: 250000 }}
      initialErrors={validate({ name: 'Aarav Krishnan', email: 'aarav@gmail.com', track: '', fee: 250000 })}
    />
  ),
};

/**
 * A server round trip (1.2s): the errors arrive after the submit handler has
 * returned, and the summary focuses itself when it appears.
 */
export const AsyncValidation: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ApplicationForm latency={1200} />,
};

/** Native constraints only: `required` and `type="email"` on the controls, messages from `onInvalidSubmit`. */
export const NativeConstraints: Story = {
  args: { noValidate: true, constraintValidation: true, focusOnError: true },
  render: function Render(args) {
    const [errors, setErrors] = React.useState<FormError[]>([]);
    const messageFor = (id: string) => {
      const e = errors.find((x) => x.fieldId === id);
      if (!e) return undefined;
      return id === 'nc-mail' ? 'Enter an email address like name@example.com' : 'Enter your 6-digit pincode';
    };
    const summary = errors.map((e) => ({ fieldId: e.fieldId, message: messageFor(e.fieldId ?? '') ?? e.message }));
    return (
      <Form
        {...args}
        aria-label="Hostel address"
        style={{ maxWidth: 480 }}
        onInvalidSubmit={setErrors}
        onSubmit={(event) => {
          event.preventDefault();
          setErrors([]);
        }}
      >
        <FormErrorSummary errors={summary} />
        <Field label="Parent's email" controlId="nc-mail" error={messageFor('nc-mail')}>
          <Input type="email" required autoComplete="email" />
        </Field>
        <Field label="Pincode" controlId="nc-pin" error={messageFor('nc-pin')}>
          <Input inputMode="numeric" pattern="[0-9]{6}" required autoComplete="postal-code" />
        </Field>
        <FormActions>
          <Button type="submit">Save address</Button>
        </FormActions>
      </Form>
    );
  },
};

/** A long form in a scroll container: the actions stay pinned to its bottom until the form ends. */
export const StickyActions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    // A padded scroll container that declares its padding (the scroll-pad
    // contract, as SideDrawer / Dialog / BottomSheet bodies do), so the bar
    // sticks flush to its visible bottom and sides.
    <div
      style={{
        height: 420,
        overflow: 'auto',
        border: '1px solid var(--border-decorative)',
        padding: 16,
        ['--scroll-pad-x' as string]: '16px',
        ['--scroll-pad-bottom' as string]: '16px',
      }}
    >
      <ApplicationForm sticky />
    </div>
  ),
};
