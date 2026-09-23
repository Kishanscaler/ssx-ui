import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Field } from '../Field';
import { DateInput, DateInputButton, formatDateInputValue, parseDateInputText } from './DateInput';

const field = () => screen.getByRole('textbox') as HTMLInputElement;

/** Type as the browser does: the new raw value with the caret at `caret`, then `input`. */
function edit(el: HTMLInputElement, raw: string, caret = raw.length) {
  act(() => el.focus());
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  setter.call(el, raw);
  el.setSelectionRange(caret, caret);
  fireEvent.input(el);
}

function paste(el: HTMLInputElement, text: string) {
  fireEvent.paste(el, { clipboardData: { getData: () => text } });
}

describe('parseDateInputText / formatDateInputValue', () => {
  it('parses states and real dates, leap years included', () => {
    expect(parseDateInputText('')).toEqual({ iso: '', state: 'empty' });
    expect(parseDateInputText('04/03')).toEqual({ iso: '', state: 'partial' });
    expect(parseDateInputText('31/02/2026')).toEqual({ iso: '', state: 'invalid' });
    expect(parseDateInputText('29/02/2028')).toEqual({ iso: '2028-02-29', state: 'valid' });
    expect(parseDateInputText('29/02/2026').state).toBe('invalid');
    expect(parseDateInputText('27/03/2026')).toEqual({ iso: '2026-03-27', state: 'valid' });
  });
  it('formats ISO as DD/MM/YYYY, rejecting non-dates', () => {
    expect(formatDateInputValue('2026-03-27')).toBe('27/03/2026');
    expect(formatDateInputValue('2026-02-31')).toBe('');
    expect(formatDateInputValue('27/03/2026')).toBe('');
    expect(formatDateInputValue(undefined)).toBe('');
  });
});

describe('DateInput', () => {
  it('is a numeric text field built on Input, with the format as placeholder', () => {
    const { container } = render(<DateInput aria-label="Interview date" size="sm" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-slot', 'date-input');
    expect(root).toHaveAttribute('data-size', 'sm');
    expect(field()).toHaveAttribute('data-slot', 'date-input-field');
    expect(field()).toHaveAttribute('type', 'text');
    expect(field()).toHaveAttribute('inputmode', 'numeric');
    expect(field()).toHaveAttribute('autocomplete', 'off');
    expect(field()).toHaveAttribute('maxlength', '10');
    expect(field()).toHaveAttribute('placeholder', 'DD/MM/YYYY');
    expect(field()).toHaveClass('h-control-sm', 'tabular-nums');
  });

  it('shows an ISO defaultValue as DD/MM/YYYY', () => {
    render(<DateInput aria-label="d" defaultValue="2026-03-27" />);
    expect(field().value).toBe('27/03/2026');
  });

  it('types the separators for you and drops non-digits', () => {
    render(<DateInput aria-label="d" />);
    edit(field(), '04');
    expect(field().value).toBe('04');
    edit(field(), '043');
    expect(field().value).toBe('04/3');
    edit(field(), '04/03a2');
    expect(field().value).toBe('04/03/2');
  });

  it('reports the ISO value once complete and real, "" otherwise; onTextChange on every edit', () => {
    const onValueChange = vi.fn();
    const onTextChange = vi.fn();
    render(<DateInput aria-label="d" onValueChange={onValueChange} onTextChange={onTextChange} />);
    edit(field(), '0403202');
    expect(onTextChange).toHaveBeenLastCalledWith('04/03/202', 'partial');
    expect(onValueChange).not.toHaveBeenCalled();
    edit(field(), '04032026');
    expect(field().value).toBe('04/03/2026');
    expect(onValueChange).toHaveBeenLastCalledWith('2026-03-04');
    expect(onTextChange).toHaveBeenLastCalledWith('04/03/2026', 'valid');
    edit(field(), '31022026');
    expect(onValueChange).toHaveBeenLastCalledWith('');
    expect(onTextChange).toHaveBeenLastCalledWith('31/02/2026', 'invalid');
  });

  it('restores the caret by digit position when editing the middle', () => {
    render(<DateInput aria-label="d" defaultValue="2026-03-04" />);
    // Caret after "04/0", type "1": raw "04/013/2026" with the caret after the 1.
    edit(field(), '04/013/2026', 5);
    expect(field().value).toBe('04/01/3202');
    // 4 digits before the caret → straight after the typed "1", not at the end.
    expect(field().selectionStart).toBe(5);
  });

  it('Backspace steps over a separator onto the digit behind it', () => {
    render(<DateInput aria-label="d" defaultValue="2026-03-04" />);
    act(() => field().focus());
    field().setSelectionRange(3, 3); // just after "04/"
    fireEvent.keyDown(field(), { key: 'Backspace' });
    expect(field().selectionStart).toBe(2);
    field().setSelectionRange(2, 2); // just before "/"
    fireEvent.keyDown(field(), { key: 'Delete' });
    expect(field().selectionStart).toBe(3);
  });

  it('paste honours the grouping: 4-3-2026, 04.03.2026 and ISO year-first', () => {
    const onValueChange = vi.fn();
    render(<DateInput aria-label="d" onValueChange={onValueChange} />);
    paste(field(), '4-3-2026');
    expect(field().value).toBe('04/03/2026');
    paste(field(), '2026-12-25');
    expect(field().value).toBe('25/12/2026');
    expect(onValueChange).toHaveBeenLastCalledWith('2026-12-25');
    paste(field(), '1.2.2027');
    expect(field().value).toBe('01/02/2027');
  });

  it('controlled: an outside value replaces the draft, a half-typed draft survives ""', () => {
    const { rerender } = render(<DateInput aria-label="d" value="" onValueChange={() => {}} />);
    edit(field(), '0403');
    expect(field().value).toBe('04/03');
    rerender(<DateInput aria-label="d" value="" onValueChange={() => {}} />);
    expect(field().value).toBe('04/03');
    rerender(<DateInput aria-label="d" value="2026-03-27" onValueChange={() => {}} />);
    expect(field().value).toBe('27/03/2026');
    rerender(<DateInput aria-label="d" value="" onValueChange={() => {}} />);
    expect(field().value).toBe('');
  });

  it('submits the ISO value under `name` through a hidden input', () => {
    const { container } = render(<DateInput aria-label="d" name="interview" defaultValue="2026-03-27" />);
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden.name).toBe('interview');
    expect(hidden.value).toBe('2026-03-27');
    expect(field()).not.toHaveAttribute('name');
  });

  it('trailing DateInputButton: named, tertiary, follows the field disabled', () => {
    const { rerender } = render(
      <DateInput aria-label="d" trailing={<DateInputButton aria-label="Choose interview date from calendar" />} />,
    );
    const button = screen.getByRole('button', { name: 'Choose interview date from calendar' });
    expect(button).toHaveAttribute('data-slot', 'date-input-button');
    expect(button).toHaveAttribute('data-variant', 'tertiary');
    expect(button).toBeEnabled();
    expect(field()).toHaveClass('pe-10');
    rerender(
      <DateInput aria-label="d" disabled trailing={<DateInputButton aria-label="Change interview date" />} />,
    );
    expect(screen.getByRole('button', { name: 'Change interview date' })).toBeDisabled();
    expect(field()).toBeDisabled();
  });

  it('wires into a Field: label, required, error → aria-invalid + describedby', () => {
    render(
      <Field label="Interview date" required error="31 February 2026 is not a real date. Use DD/MM/YYYY.">
        <DateInput defaultValue="" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: /Interview date/ });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAccessibleDescription(/not a real date/);
  });

  it('forwards the ref to the input, className to the root', () => {
    const ref = React.createRef<HTMLInputElement>();
    const { container } = render(<DateInput ref={ref} aria-label="d" className="max-w-xs custom" id="d1" />);
    expect(ref.current).toBe(field());
    expect(container.firstElementChild).toHaveClass('max-w-xs', 'custom');
    expect(field()).toHaveAttribute('id', 'd1');
  });
});
