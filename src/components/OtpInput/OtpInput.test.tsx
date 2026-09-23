import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { OtpInput, OtpInputGroup, OtpInputSlot } from './OtpInput';

const slots = (root: ParentNode = document) =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-slot=otp-input-slot]'));

describe('OtpInput', () => {
  it('is ONE labelled field over six aria-hidden boxes', () => {
    render(<OtpInput aria-label="Verification code" />);
    const input = screen.getByRole('textbox', { name: 'Verification code' });
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(input).toHaveAttribute('data-slot', 'otp-input-field');
    expect(input).toHaveAttribute('maxlength', '6');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    expect(slots()).toHaveLength(6);
    expect(document.querySelector('[data-slot=otp-input-group]')).toHaveAttribute('aria-hidden', 'true');
    expect(document.querySelector('[data-slot=otp-input]')).not.toBeNull();
  });

  it('mirrors the typed value into the boxes (uncontrolled)', () => {
    const onChange = vi.fn();
    render(<OtpInput aria-label="Verification code" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '284' } });
    expect(onChange).toHaveBeenLastCalledWith('284');
    const s = slots();
    expect(s.slice(0, 3).map((b) => b.textContent)).toEqual(['2', '8', '4']);
    expect(s[0]).toHaveAttribute('data-filled');
    expect(s[3]).not.toHaveAttribute('data-filled');
  });

  it('refuses non-digits on the way in', () => {
    const onChange = vi.fn();
    render(<OtpInput aria-label="Verification code" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '28a' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is controlled by `value` and fires onComplete at six digits', () => {
    const onComplete = vi.fn();
    function Controlled() {
      const [v, setV] = React.useState('28');
      return <OtpInput aria-label="Verification code" value={v} onChange={setV} onComplete={onComplete} />;
    }
    render(<Controlled />);
    expect(slots()[1]).toHaveTextContent('8');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '284193' } });
    expect(slots().map((b) => b.textContent).join('')).toBe('284193');
    expect(onComplete).toHaveBeenCalledWith('284193');
  });

  it('marks the box under the caret active while focused', () => {
    render(<OtpInput aria-label="Verification code" defaultValue="284" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.focus(input);
    fireEvent.select(input);
    const active = slots().filter((s) => s.hasAttribute('data-active'));
    expect(active).toHaveLength(1);
  });

  it('invalid restyles the WHOLE control, not one slot', () => {
    render(<OtpInput aria-label="Verification code" aria-invalid value="284190" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(document.querySelector('[data-slot=otp-input]')).toHaveAttribute('data-invalid');
    for (const s of slots()) expect(s.className).toContain('bg-danger-surface');
  });

  it('disabled: the field is disabled and every box takes the disabled fill', () => {
    render(<OtpInput aria-label="Verification code" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    for (const s of slots()) expect(s.className).toContain('bg-field-disabled');
  });

  it('verifying: read-only and busy, digits kept legible (not disabled)', () => {
    render(<OtpInput aria-label="Verification code" verifying value="284193" onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveAttribute('aria-busy', 'true');
    expect(input).not.toBeDisabled();
    for (const s of slots()) {
      expect(s.className).toContain('border-border-inert');
      expect(s.className).not.toContain('text-content-disabled');
    }
  });

  it('accepts a custom slot layout and maxLength', () => {
    render(
      <OtpInput aria-label="Code" maxLength={4}>
        <OtpInputGroup>
          <OtpInputSlot index={0} />
          <OtpInputSlot index={1} />
        </OtpInputGroup>
        <OtpInputGroup>
          <OtpInputSlot index={2} />
          <OtpInputSlot index={3} />
        </OtpInputGroup>
      </OtpInput>,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '4');
    expect(document.querySelectorAll('[data-slot=otp-input-group]')).toHaveLength(2);
    expect(slots()).toHaveLength(4);
  });

  it('forwards the ref to the real input and merges className on the root', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<OtpInput ref={ref} aria-label="Verification code" className="gap-4 w-full" name="otp" />);
    expect(ref.current).toBe(screen.getByRole('textbox'));
    expect(ref.current).toHaveAttribute('name', 'otp');
    const cls = (document.querySelector('[data-slot=otp-input]') as HTMLElement).className.split(/\s+/);
    expect(cls).toContain('w-full');
    expect(cls).not.toContain('w-max');
  });
});
