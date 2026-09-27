import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Field, FieldControl, FieldError, FieldHelp, FieldLabel } from '../Field';
import { Input } from '../Input';
import { NumberInput } from '../NumberInput';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupControl,
  InputGroupInput,
  InputGroupText,
} from './InputGroup';

const EyeGlyph = () => (
  <svg viewBox="0 0 256 256" aria-hidden="true">
    <path d="M0 0h256v256H0z" />
  </svg>
);

/**
 * CONTRACT tests. The group draws the chrome and styles off its control's
 * state; the control keeps the value, the name and the ARIA; addons are
 * neither part of the value nor invisible to assistive technology.
 */
describe('InputGroup', () => {
  it('carries the styling hooks: a role=group root, the size, a data-slot per part', () => {
    render(
      <InputGroup size="lg" data-testid="group">
        <InputGroupAddon>
          <InputGroupText>₹</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Fee" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label="Clear">
            <EyeGlyph />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );
    const group = screen.getByTestId('group');
    expect(group).toHaveAttribute('role', 'group');
    expect(group).toHaveAttribute('data-slot', 'input-group');
    expect(group).toHaveAttribute('data-size', 'lg');
    expect(screen.getByLabelText('Fee')).toHaveAttribute('data-slot', 'input-group-control');
    expect(screen.getByText('₹')).toHaveAttribute('data-slot', 'input-group-text');
    const addons = group.querySelectorAll('[data-slot=input-group-addon]');
    expect(addons[0]).toHaveAttribute('data-align', 'inline-start');
    expect(addons[1]).toHaveAttribute('data-align', 'inline-end');
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveAttribute('data-slot', 'input-group-button');
  });

  it('draws the focus ring on the group, keyed to the control, and takes it off the control', () => {
    render(
      <InputGroup data-testid="group">
        <InputGroupInput aria-label="Scaler email" />
      </InputGroup>,
    );
    const group = screen.getByTestId('group').className;
    expect(group).toContain('has-[[data-slot=input-group-control]:focus-visible]:ring-halo');
    expect(group).toContain('has-[[data-slot=input-group-control][aria-invalid=true]]:border-danger');
    expect(group).toContain('rounded-md border border-field-border bg-field');
    const control = screen.getByLabelText('Scaler email').className.split(/\s+/);
    // The Input recipe's chrome is replaced, not stacked under ours.
    expect(control).toContain('border-0');
    expect(control).toContain('bg-transparent');
    expect(control).toContain('focus-visible:ring-0');
    expect(control).not.toContain('bg-field');
    expect(control).not.toContain('focus-visible:ring-halo');
  });

  it('keeps the 16px coarse-pointer field text on the control, at every size', () => {
    const { rerender } = render(
      <InputGroup size="sm">
        <InputGroupInput aria-label="Email" />
      </InputGroup>,
    );
    expect(screen.getByLabelText('Email').className).toContain('pointer-coarse:text-md');
    expect(screen.getByLabelText('Email')).toHaveAttribute('data-size', 'sm');
    rerender(
      <InputGroup size="md">
        <InputGroupInput aria-label="Email" />
      </InputGroup>,
    );
    expect(screen.getByLabelText('Email').className).toContain('pointer-coarse:text-md');
    expect(screen.getByLabelText('Email')).toHaveAttribute('data-size', 'md');
  });

  it('keeps addon text out of the value, and in the description', () => {
    render(
      <form data-testid="form">
        <InputGroup>
          <InputGroupInput name="email" aria-label="Scaler email" defaultValue="aarav.k" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>@scaler.com</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </form>,
    );
    const input = screen.getByLabelText('Scaler email') as HTMLInputElement;
    expect(input.value).toBe('aarav.k');
    const data = new FormData(screen.getByTestId('form') as HTMLFormElement);
    expect(data.get('email')).toBe('aarav.k');
    expect(input).toHaveAccessibleDescription('@scaler.com');
  });

  it('lets aria-hidden opt addon text out of the description', () => {
    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText aria-hidden="true">₹</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Fee (₹)" />
      </InputGroup>,
    );
    expect(screen.getByLabelText('Fee (₹)')).not.toHaveAttribute('aria-describedby');
  });

  it('wires a flat Field through the group: label, help, error and invalid land on the input', () => {
    render(
      <Field label="Monthly EMI" help="Paid on the 5th." error="Enter an amount above ₹0." controlId="emi">
        <InputGroup data-testid="group">
          <InputGroupAddon>
            <InputGroupText>₹</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput inputMode="numeric" />
        </InputGroup>
      </Field>,
    );
    const input = screen.getByLabelText('Monthly EMI');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('id', 'emi');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/₹.*Paid on the 5th\..*Enter an amount above ₹0\./);
    // The group holds none of the control's attributes.
    const group = screen.getByTestId('group');
    expect(group).not.toHaveAttribute('id');
    expect(group).not.toHaveAttribute('aria-describedby');
    expect(group).not.toHaveAttribute('aria-invalid');
  });

  it('wires a compound Field that wraps the control itself', () => {
    render(
      <Field required>
        <FieldLabel>Loan tenure</FieldLabel>
        <InputGroup>
          <FieldControl>
            <InputGroupInput inputMode="numeric" />
          </FieldControl>
          <InputGroupAddon align="inline-end">
            <InputGroupText>months</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <FieldHelp>Between 6 and 36.</FieldHelp>
        <FieldError>Choose 36 months or fewer.</FieldError>
      </Field>,
    );
    const input = screen.getByLabelText(/Loan tenure/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAccessibleDescription(/months.*Between 6 and 36\..*Choose 36 months or fewer\./);
  });

  it('propagates disabled to the control and the buttons; a button can opt back in', () => {
    render(
      <Field label="Referral code" disabled>
        <InputGroup>
          <InputGroupInput />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="text">Apply</InputGroupButton>
            <InputGroupButton size="text" disabled={false}>
              Help
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>,
    );
    expect(screen.getByLabelText('Referral code')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Help' })).not.toBeDisabled();
  });

  it('focuses the control when the addon is clicked, but not when its button is', () => {
    render(
      <InputGroup>
        <InputGroupAddon data-testid="addon">
          <InputGroupText>₹</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Fee" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="text">Copy</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );
    fireEvent.click(screen.getByText('₹'));
    expect(screen.getByLabelText('Fee')).toHaveFocus();
    const copy = screen.getByRole('button', { name: 'Copy' });
    copy.focus();
    fireEvent.click(copy);
    expect(copy).toHaveFocus();
  });

  it('does not focus a disabled control from the addon', () => {
    render(
      <InputGroup disabled>
        <InputGroupAddon>
          <InputGroupText>₹</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Fee" />
      </InputGroup>,
    );
    fireEvent.click(screen.getByText('₹'));
    expect(screen.getByLabelText('Fee')).not.toHaveFocus();
  });

  it('takes a NumberInput (no steppers) as its control, with the group size and Field wiring', () => {
    const values: Array<number | null> = [];
    render(
      <Field label="Minimum attendance" controlId="att">
        <InputGroup size="sm">
          <InputGroupControl>
            <NumberInput stepper={false} min={0} max={100} onValueChange={(v) => values.push(v)} />
          </InputGroupControl>
          <InputGroupAddon align="inline-end">
            <InputGroupText>%</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </Field>,
    );
    const input = screen.getByLabelText('Minimum attendance') as HTMLInputElement;
    expect(input).toHaveAttribute('id', 'att');
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('data-slot', 'input-group-control');
    expect(input).toHaveAttribute('data-size', 'sm');
    expect(input.className).toContain('border-0');
    fireEvent.change(input, { target: { value: '75' } });
    expect(values).toEqual([75]);
    expect(input.value).toBe('75');
    expect(input).toHaveAccessibleDescription('%');
  });

  it("lets the control's own props win over the group's", () => {
    render(
      <InputGroup id="group-id" aria-invalid>
        <InputGroupInput id="own-id" aria-invalid={false} aria-label="Coupon" />
      </InputGroup>,
    );
    const input = screen.getByLabelText('Coupon');
    expect(input).toHaveAttribute('id', 'own-id');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('does not pass a string size to a host <input>', () => {
    render(
      <InputGroup size="lg">
        <InputGroupControl>
          <input aria-label="Raw" />
        </InputGroupControl>
      </InputGroup>,
    );
    const input = screen.getByLabelText('Raw');
    expect(input).not.toHaveAttribute('size');
    expect(input).toHaveAttribute('data-slot', 'input-group-control');
  });

  it('sizes its buttons 4px inside the field', () => {
    const { rerender } = render(
      <InputGroup size="sm">
        <InputGroupInput aria-label="Search" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label="Clear">
            <EyeGlyph />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );
    expect(screen.getByRole('button', { name: 'Clear' }).className).toContain('size-6');
    rerender(
      <InputGroup size="lg">
        <InputGroupInput aria-label="Search" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label="Clear">
            <EyeGlyph />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );
    const lg = screen.getByRole('button', { name: 'Clear' });
    expect(lg).toHaveAttribute('data-size', 'icon');
    expect(lg.className).toContain('size-control-md');
    // A neutral button by default, with Button's touch hit area.
    expect(lg).toHaveAttribute('data-variant', 'neutral');
    expect(lg.className).toContain('touch-target');
  });

  it('forwards refs to the group and to the input', () => {
    const groupRef = React.createRef<HTMLDivElement>();
    const inputRef = React.createRef<HTMLInputElement>();
    render(
      <InputGroup ref={groupRef}>
        <InputGroupInput ref={inputRef} aria-label="Email" />
      </InputGroup>,
    );
    expect(groupRef.current?.getAttribute('data-slot')).toBe('input-group');
    expect(inputRef.current).toBe(screen.getByLabelText('Email'));
  });

  it('merges a caller className on the group', () => {
    render(
      <InputGroup className="max-w-xs" data-testid="group">
        <InputGroupInput aria-label="Email" />
      </InputGroup>,
    );
    expect(screen.getByTestId('group').className).toContain('max-w-xs');
  });

  it('leaves Input alone outside a group', () => {
    render(<Input aria-label="Email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('data-slot', 'input');
    expect(screen.getByLabelText('Email').className).toContain('bg-field');
  });
});
