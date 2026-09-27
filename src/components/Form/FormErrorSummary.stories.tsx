import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field } from '../Field';
import { Input } from '../Input';
import { FormErrorSummary } from './FormErrorSummary';

const meta = {
  title: 'Molecules/FormErrorSummary',
  component: FormErrorSummary,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The list of errors at the top of a form after a failed submit (GOV.UK error summary): a count heading,',
          'one link per error to `#fieldId`; following a link focuses the field and scrolls its label into view.',
          'Errors are data: `[{ fieldId, message }]` or `{ [fieldId]: message }`. Empty, it renders nothing.',
          'It focuses itself when errors appear (`autoFocus`), and its body is `role="alert"`. Danger Alert styling.',
          'Repeat each message beside its field (FieldError), in the same words.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    headingAs: {
      control: 'inline-radio',
      options: ['h2', 'h3', 'h4', 'h5', 'h6'],
      table: { defaultValue: { summary: 'h2' } },
    },
    autoFocus: { control: 'boolean', table: { defaultValue: { summary: 'true' } } },
    title: { control: 'text' },
    description: { control: 'text' },
  },
} satisfies Meta<typeof FormErrorSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

const ERRORS = [
  { fieldId: 'es-name', message: 'Enter your full name, as on your Class XII marksheet' },
  { fieldId: 'es-email', message: 'Enter only the part before @scaler.com' },
  { fieldId: 'es-fee', message: 'Waivers go up to ₹1,95,000. Enter a smaller amount' },
];

/** Three problems, linked to the fields below. */
export const Default: Story = {
  args: { errors: ERRORS, autoFocus: false, description: 'Fix these to submit your application.' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24, maxWidth: 560 }}>
      <FormErrorSummary {...args} />
      <Field label="Full name" controlId="es-name" error={ERRORS[0]!.message}>
        <Input />
      </Field>
      <Field label="Scaler email" controlId="es-email" error={ERRORS[1]!.message}>
        <Input defaultValue="aarav@gmail.com" />
      </Field>
      <Field label="Scholarship waiver requested (₹)" controlId="es-fee" error={ERRORS[2]!.message}>
        <Input inputMode="numeric" defaultValue="250000" />
      </Field>
    </div>
  ),
};

/** One problem: the singular heading. */
export const Single: Story = {
  args: { errors: { 'es-one': 'Upload your Class XII marksheet as a PDF under 5 MB' }, autoFocus: false },
};

/** A form-level error has no field to link to, so it is listed as text. */
export const FormLevelError: Story = {
  args: {
    autoFocus: false,
    title: 'Your payment did not go through',
    errors: [
      { message: 'The bank declined ₹1,500. No money has left your account.' },
      { fieldId: 'es-upi', message: 'Check the UPI ID and try again' },
    ],
  },
};

/** A long unbroken message still wraps at 320px. */
export const Narrow: Story = {
  args: {
    autoFocus: false,
    errors: [
      { fieldId: 'es-n1', message: 'Enter an email like aarav.krishnan.cohort7@sst.scaler.com' },
      { fieldId: 'es-n2', message: 'Enter the 13-character roll number, e.g. SST-2029-0416' },
    ],
  },
  render: (args) => (
    <div style={{ maxWidth: 288 }}>
      <FormErrorSummary {...args} />
    </div>
  ),
};
