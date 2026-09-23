import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { PhoneInput } from './PhoneInput';
import { applyMask, flagEmoji, parseE164, phoneCountries } from './countries';

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
}

const tel = () => screen.getByRole('textbox', { name: 'Guardian mobile' }) as HTMLInputElement;
const trigger = () => screen.getByRole('combobox', { hidden: true });
const type = (value: string) => fireEvent.change(tel(), { target: { value } });

describe('PhoneInput helpers', () => {
  it('masks progressively and appends overflow', () => {
    expect(applyMask('4', '(###) ###-####')).toBe('(4');
    expect(applyMask('9845021174', '##### #####')).toBe('98450 21174');
    expect(applyMask('98450211745', '##### #####')).toBe('98450 211745');
  });

  it('builds flag emoji from the ISO code', () => {
    expect(flagEmoji('IN')).toBe('\u{1F1EE}\u{1F1F3}');
    expect(flagEmoji('x')).toBe('');
  });

  it('parses E.164, longest dial code first', () => {
    expect(parseE164('+971501234567', phoneCountries)).toMatchObject({
      country: { iso: 'AE' },
      national: '501234567',
    });
    expect(parseE164('', phoneCountries)).toBeNull();
  });
});

describe('PhoneInput', () => {
  it('is one group: a named country combobox and a tel field, India by default', () => {
    const { container } = render(<PhoneInput aria-label="Guardian mobile" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-slot', 'phone-input');
    expect(root).toHaveAttribute('data-size', 'md');
    expect(tel()).toHaveAttribute('type', 'tel');
    expect(tel()).toHaveAttribute('inputmode', 'tel');
    expect(tel()).toHaveAttribute('autocomplete', 'tel-national');
    expect(tel()).toHaveAttribute('placeholder', '98450 21174');
    expect(trigger()).toHaveAccessibleName('Country dial code: +91 India');
    expect(trigger()).toHaveAttribute('data-slot', 'phone-input-country');
    // The flag is decoration only.
    expect(root.querySelector('[data-slot=phone-input-flag]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('groups as you type and reports E.164 with its parts', () => {
    const onValueChange = vi.fn();
    render(<PhoneInput aria-label="Guardian mobile" onValueChange={onValueChange} />);
    type('9845021174');
    expect(tel().value).toBe('98450 21174');
    expect(onValueChange).toHaveBeenLastCalledWith('+919845021174', {
      country: 'IN',
      national: '9845021174',
      e164: '+919845021174',
    });
  });

  it('drops digits past the country maximum', () => {
    render(<PhoneInput aria-label="Guardian mobile" />);
    type('984502117499');
    expect(tel().value).toBe('98450 21174');
  });

  it('a leading + parses the dial code and moves the selector', () => {
    const onCountryChange = vi.fn();
    render(<PhoneInput aria-label="Guardian mobile" onCountryChange={onCountryChange} />);
    type('+97');
    expect(tel().value).toBe('+97');
    type('+971501234567');
    expect(tel().value).toBe('50 123 4567');
    expect(onCountryChange).toHaveBeenLastCalledWith('AE');
    expect(trigger()).toHaveAccessibleName('Country dial code: +971 United Arab Emirates');
  });

  it('picking a country re-groups the digits instead of clearing them', () => {
    const onValueChange = vi.fn();
    render(<PhoneInput aria-label="Guardian mobile" defaultValue="+919845021174" onValueChange={onValueChange} />);
    expect(tel().value).toBe('98450 21174');
    fireEvent.keyDown(trigger(), { key: 'Enter' });
    const us = screen.getByRole('option', { name: /United States/ });
    fireEvent.keyDown(us, { key: 'Enter' });
    expect(tel().value).toBe('(984) 502-1174');
    expect(onValueChange).toHaveBeenLastCalledWith('+19845021174', expect.objectContaining({ country: 'US' }));
    expect(tel().placeholder).toBe('(415) 555-0132');
  });

  it('the country list is the Select listbox, with type-ahead text in words', () => {
    render(<PhoneInput aria-label="Guardian mobile" />);
    fireEvent.keyDown(trigger(), { key: 'Enter' });
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('data-slot', 'select-content');
    expect(screen.getAllByRole('option')).toHaveLength(6);
    expect(screen.getByRole('option', { name: /India/ })).toHaveAttribute('data-state', 'checked');
  });

  it('is controlled by an E.164 value, and a foreign dial code moves the country', () => {
    function Controlled() {
      const [v, setV] = React.useState('+6591234567');
      return (
        <>
          <PhoneInput aria-label="Guardian mobile" value={v} onValueChange={setV} />
          <output data-testid="out">{v}</output>
        </>
      );
    }
    render(<Controlled />);
    expect(tel().value).toBe('9123 4567');
    expect(trigger()).toHaveAccessibleName(/Singapore/);
    type('9123 45');
    expect(screen.getByTestId('out')).toHaveTextContent('+65912345');
  });

  it('submits E.164 through a hidden input when named', () => {
    const { container } = render(
      <PhoneInput aria-label="Guardian mobile" name="guardian_phone" defaultValue="+447700900461" />,
    );
    const hidden = container.querySelector('input[type=hidden]') as HTMLInputElement;
    expect(hidden).toHaveAttribute('name', 'guardian_phone');
    expect(hidden.value).toBe('+447700900461');
    expect(tel()).not.toHaveAttribute('name');
  });

  it('flag="iso" pins the ISO chip (the Windows fallback)', () => {
    const { container } = render(<PhoneInput aria-label="Guardian mobile" flag="iso" defaultCountry="AE" />);
    const flag = container.querySelector('[data-slot=phone-input-flag]');
    expect(flag).toHaveAttribute('data-mode', 'iso');
    expect(flag).toHaveTextContent('AE');
  });

  it('invalid and disabled are states of the whole group', () => {
    const { container, rerender } = render(<PhoneInput aria-label="Guardian mobile" aria-invalid />);
    const root = container.firstElementChild as HTMLElement;
    expect(tel()).toHaveAttribute('aria-invalid', 'true');
    expect(root).toHaveAttribute('data-invalid');
    rerender(<PhoneInput aria-label="Guardian mobile" disabled />);
    expect(root).toHaveAttribute('data-disabled');
    expect(tel()).toBeDisabled();
    expect(trigger()).toBeDisabled();
  });

  it('read-only: legible, focusable, and the country list never opens', () => {
    const { container } = render(<PhoneInput aria-label="Guardian mobile" readOnly defaultValue="+919845021174" />);
    expect(container.firstElementChild).toHaveAttribute('data-readonly');
    expect(tel()).toHaveAttribute('readonly');
    expect(trigger()).toBeEnabled();
    fireEvent.keyDown(trigger(), { key: 'Enter' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(tel().value).toBe('98450 21174');
  });

  it('forwards the ref to the tel input and merges className on the root', () => {
    const ref = React.createRef<HTMLInputElement>();
    const { container } = render(<PhoneInput ref={ref} aria-label="Guardian mobile" className="h-12 max-w-sm" />);
    expect(ref.current).toBe(tel());
    const cls = (container.firstElementChild as HTMLElement).className.split(/\s+/);
    expect(cls).toContain('h-12');
    expect(cls).not.toContain('h-control-md');
  });
});

describe('PhoneInput on touch devices', () => {
  it('floors the number text at 16px on a coarse pointer', () => {
    const { container } = render(<PhoneInput size="sm" aria-label="Phone" />);
    const root = container.querySelector('[data-slot=phone-input]') as HTMLElement;
    expect(root.className.split(/\s+/)).toEqual(expect.arrayContaining(['text-sm', 'pointer-coarse:text-md']));
  });
});
