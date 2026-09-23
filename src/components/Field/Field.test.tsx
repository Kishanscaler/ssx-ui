import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { NumberInput } from '../NumberInput';
import { OtpInput, OtpInputGroup, OtpInputSlot } from '../OtpInput';
import { PhoneInput } from '../PhoneInput';
import { RadioGroup, RadioGroupItem } from '../RadioGroup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select';
import { Textarea } from '../Textarea';
import {
  Field,
  FieldControl,
  FieldError,
  FieldHelp,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from './Field';

const describedBy = (el: HTMLElement) => (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
const textOfIds = (el: HTMLElement) =>
  describedBy(el).map((id) => document.getElementById(id)?.textContent ?? `<missing ${id}>`);

describe('Field — flat form', () => {
  it('labels the control and links the help text', () => {
    render(
      <Field label="Scaler email" help="We send cohort announcements here.">
        <Input type="email" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Scaler email' });
    expect(textOfIds(input)).toEqual(['We send cohort announcements here.']);
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.getByText('Scaler email').closest('[data-slot=field-label]')).toHaveAttribute(
      'for',
      input.id,
    );
  });

  it('an error marks the control invalid and is linked after the help', () => {
    render(
      <Field label="SST roll number" help="Printed on your admission letter." error="Roll numbers are 13 characters.">
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'SST roll number' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(textOfIds(input)).toEqual(['Printed on your admission letter.', 'Roll numbers are 13 characters.']);
    const error = screen.getByText('Roll numbers are 13 characters.').closest('[data-slot=field-error]');
    expect(error).not.toBeNull();
    expect(error!.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('SST roll number').closest('[data-slot=field]')).toHaveAttribute('data-invalid', 'true');
  });

  it('required draws a hidden-from-AT star plus "(required)" and sets aria-required', () => {
    render(
      <Field label="SST roll number" required>
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'SST roll number (required)' });
    expect(input).toHaveAttribute('aria-required', 'true');
    const star = document.querySelector('[data-slot=field-required]');
    expect(star).toHaveAttribute('aria-hidden', 'true');
    expect(star).toHaveTextContent('*');
  });

  it('does not add aria-required when the control is natively required', () => {
    render(
      <Field label="Roll" required>
        <Input required />
      </Field>,
    );
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
    expect(input).not.toHaveAttribute('aria-required');
  });

  it('optional draws the word, or the string given', () => {
    const { rerender } = render(
      <Field label="GitHub handle" optional>
        <Input />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'GitHub handle Optional' })).toBeInTheDocument();
    rerender(
      <Field label="GitHub handle" optional="If you have one">
        <Input />
      </Field>,
    );
    expect(screen.getByText('If you have one')).toHaveAttribute('data-slot', 'field-optional');
  });

  it('forwards disabled to the control', () => {
    render(
      <Field label="Cohort" disabled>
        <Input defaultValue="Cohort 7" />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Cohort' })).toBeDisabled();
  });

  it("uses the child's own id and merges its aria-describedby", () => {
    render(
      <>
        <p id="outside">Also see the handbook.</p>
        <Field label="Email" help="Help">
          <Input id="email" aria-describedby="outside" />
        </Field>
      </>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.id).toBe('email');
    expect(textOfIds(input)).toEqual(['Also see the handbook.', 'Help']);
  });

  it('controlId sets the id', () => {
    render(
      <Field label="Email" controlId="the-email">
        <Input />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Email' }).id).toBe('the-email');
  });

  it('renders nothing for empty help / error, so no id dangles', () => {
    render(
      <Field label="Name" help="" error={null}>
        <Input />
      </Field>,
    );
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    expect(document.querySelector('[data-slot=field-help]')).toBeNull();
    expect(document.querySelector('[data-slot=field-error]')).toBeNull();
  });

  it('wires every text control atom', () => {
    render(
      <>
        <Field label="Why this elective?" help="150–300 words.">
          <Textarea />
        </Field>
        <Field label="Attempts" error="At most 5.">
          <NumberInput defaultValue={3} />
        </Field>
        <Field label="Mobile" help="Indian numbers only.">
          <PhoneInput />
        </Field>
        <Field label="Code" help="Sent to your email.">
          <OtpInput maxLength={4}>
            <OtpInputGroup>
              <OtpInputSlot index={0} />
              <OtpInputSlot index={1} />
              <OtpInputSlot index={2} />
              <OtpInputSlot index={3} />
            </OtpInputGroup>
          </OtpInput>
        </Field>
      </>,
    );
    expect(textOfIds(screen.getByRole('textbox', { name: 'Why this elective?' }))).toEqual(['150–300 words.']);
    const attempts = screen.getByRole('spinbutton', { name: 'Attempts' });
    expect(attempts).toHaveAttribute('aria-invalid', 'true');
    expect(textOfIds(attempts)).toEqual(['At most 5.']);
    expect(textOfIds(screen.getByRole('textbox', { name: 'Mobile' }))).toEqual(['Indian numbers only.']);
    expect(textOfIds(screen.getByRole('textbox', { name: 'Code' }))).toEqual(['Sent to your email.']);
  });

  it('wires a Select through FieldControl on the trigger', () => {
    render(
      <Field label="Elective track" help="Locked once registration closes." required>
        <Select defaultValue="ml">
          <FieldControl>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
          </FieldControl>
          <SelectContent>
            <SelectItem value="ml">Applied Machine Learning</SelectItem>
          </SelectContent>
        </Select>
      </Field>,
    );
    const trigger = screen.getByRole('combobox', { name: /Elective track/ });
    expect(trigger).toHaveAttribute('data-slot', 'select-trigger');
    expect(trigger).toHaveAttribute('aria-required', 'true');
    expect(textOfIds(trigger)).toEqual(['Locked once registration closes.']);
  });

  it('a horizontal Field puts a checkbox before its label, and the label toggles it', () => {
    render(
      <Field label="Data engineering" orientation="horizontal" help="Drive opens 14 Apr.">
        <Checkbox />
      </Field>,
    );
    const box = screen.getByRole('checkbox', { name: 'Data engineering' });
    const field = box.closest('[data-slot=field]')!;
    expect(field).toHaveAttribute('data-orientation', 'horizontal');
    expect(field.firstElementChild).toHaveAttribute('data-slot', 'field-control-box');
    expect(field.firstElementChild!.firstElementChild).toBe(box);
    expect(textOfIds(box)).toEqual(['Drive opens 14 Apr.']);
    fireEvent.click(screen.getByText('Data engineering'));
    expect(box).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Field — compound form', () => {
  it('wires FieldLabel, FieldControl, FieldHelp and FieldError the same way', () => {
    render(
      <Field required>
        <FieldLabel>SST roll number</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
        <FieldHelp>Printed on your admission letter.</FieldHelp>
        <FieldError>Roll numbers are 13 characters.</FieldError>
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'SST roll number (required)' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('data-slot', 'input');
    expect(textOfIds(input)).toEqual(['Printed on your admission letter.', 'Roll numbers are 13 characters.']);
  });

  it('drops the error link and invalid state when FieldError empties', () => {
    const { rerender } = render(
      <Field>
        <FieldLabel>Roll</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
        <FieldError>Too short.</FieldError>
      </Field>,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    rerender(
      <Field>
        <FieldLabel>Roll</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
        <FieldError>{null}</FieldError>
      </Field>,
    );
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
  });

  it('FieldControl forwards the ref to the control and keeps the child ref', () => {
    const outer = React.createRef<HTMLElement>();
    const inner = React.createRef<HTMLInputElement>();
    render(
      <Field>
        <FieldLabel>Name</FieldLabel>
        <FieldControl ref={outer}>
          <Input ref={inner} />
        </FieldControl>
      </Field>,
    );
    expect(outer.current).toBe(screen.getByRole('textbox'));
    expect(inner.current).toBe(screen.getByRole('textbox'));
  });
});

describe('Field — contract', () => {
  it('forwards the ref, merges className last and spreads props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Field ref={ref} label="Name" className="gap-4" data-testid="f">
        <Input />
      </Field>,
    );
    const field = screen.getByTestId('f');
    expect(ref.current).toBe(field);
    expect(field).toHaveAttribute('data-slot', 'field');
    expect(field).toHaveAttribute('data-orientation', 'vertical');
    expect(field.className).toContain('gap-4');
    expect(field.className).not.toContain('gap-2');
  });

  it('every part carries its data-slot', () => {
    render(
      <Field label="Name" help="Help" error="Error" optional>
        <Input />
      </Field>,
    );
    for (const slot of ['field', 'field-label', 'field-optional', 'field-help', 'field-error', 'field-error-text']) {
      expect(document.querySelector(`[data-slot=${slot}]`)).not.toBeNull();
    }
  });

  it('FieldError icon={null} drops the glyph', () => {
    render(
      <Field>
        <FieldError icon={null}>Bad</FieldError>
      </Field>,
    );
    expect(document.querySelector('[data-slot=field-error] svg')).toBeNull();
  });
});

describe('FieldSet', () => {
  it('is a named group with its help linked, for a checkbox list', () => {
    render(
      <FieldSet legend="Which placement drives?" help="Pick every track." variant="choices">
        <Field label="Product engineering" orientation="horizontal">
          <Checkbox defaultChecked />
        </Field>
        <Field label="Founder's office" orientation="horizontal" disabled>
          <Checkbox />
        </Field>
      </FieldSet>,
    );
    const group = screen.getByRole('group', { name: 'Which placement drives?' });
    expect(group.tagName).toBe('FIELDSET');
    expect(group).toHaveAttribute('data-slot', 'field-set');
    expect(group).toHaveAttribute('data-variant', 'choices');
    expect(textOfIds(group)).toEqual(['Pick every track.']);
    expect(screen.getByRole('checkbox', { name: "Founder's office" })).toBeDisabled();
  });

  it('wraps a RadioGroup, with a group error', () => {
    render(
      <FieldSet legend="Campus" error="Choose a campus." required variant="choices">
        <RadioGroup aria-label="Campus">
          <Field label="Bengaluru" orientation="horizontal">
            <RadioGroupItem value="blr" />
          </Field>
        </RadioGroup>
      </FieldSet>,
    );
    const group = screen.getByRole('group', { name: 'Campus (required)' });
    expect(group).toHaveAttribute('data-invalid', 'true');
    expect(textOfIds(group)).toEqual(['Choose a campus.']);
    expect(screen.getByRole('radio', { name: 'Bengaluru' })).toBeInTheDocument();
  });

  it('hideLegend keeps the name for AT only; stacked fields default to the 24px gap', () => {
    const ref = React.createRef<HTMLFieldSetElement>();
    render(
      <FieldSet ref={ref} legend="Guardian contact" hideLegend className="max-w-md">
        <Field label="Guardian name">
          <Input />
        </Field>
      </FieldSet>,
    );
    expect(screen.getByRole('group', { name: 'Guardian contact' })).toBe(ref.current);
    expect(document.querySelector('[data-slot=field-legend]')).toHaveClass('sr-only');
    expect(ref.current).toHaveClass('gap-6', 'max-w-md');
    expect(ref.current).toHaveAttribute('data-variant', 'fields');
  });

  it('FieldLegend renders on its own', () => {
    render(
      <fieldset>
        <FieldLegend required>Guardian</FieldLegend>
      </fieldset>,
    );
    expect(screen.getByRole('group', { name: 'Guardian (required)' })).toBeInTheDocument();
  });
});
