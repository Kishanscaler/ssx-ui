import { calendarVariants } from './Calendar';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Field } from '../Field';
import { Calendar } from './Calendar';
import { DatePicker } from './DatePicker';

/* jsdom has no pointer capture. */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
}

const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
const focusDay = (iso: string) =>
  act(() => {
    day(iso).focus();
  });
const title = () => document.querySelector('[data-slot="calendar-title"]')!;
const key = (k: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(document.activeElement as Element, { key: k, ...init });

describe('Calendar', () => {
  it('draws the month in en-IN, Sunday first, with the HTML day states', () => {
    render(
      <Calendar
        today="2026-03-12"
        defaultValue="2026-03-18"
        disabledDaysOfWeek={[0, 6]}
        getDateDescription={(iso) => (iso < '2026-03-12' ? 'no slots' : undefined)}
        min="2026-03-12"
      />,
    );
    expect(title()).toHaveTextContent('March 2026');
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument();
    const heads = screen.getAllByRole('columnheader');
    expect(heads).toHaveLength(7);
    expect(heads[0]).toHaveTextContent('Sunday');
    expect(heads[1]).toHaveTextContent('Monday');

    expect(day('2026-03-18')).toHaveAttribute('aria-pressed', 'true');
    expect(day('2026-03-18')).toHaveAccessibleName('18 March 2026, selected');
    expect(day('2026-03-12')).toHaveAttribute('aria-current', 'date');
    expect(day('2026-03-12')).toHaveAccessibleName('12 March 2026, today');
    expect(day('2026-03-13')).toHaveAttribute('aria-pressed', 'false');
    expect(day('2026-03-14')).toBeDisabled(); // Saturday
    expect(day('2026-03-10')).toBeDisabled(); // before min
    expect(day('2026-03-10')).toHaveAccessibleName('10 March 2026, no slots');
    // The adjacent month fills the last week, muted and disabled.
    expect(day('2026-04-01')).toBeDisabled();
    expect(day('2026-04-01')).toHaveAccessibleName('1 April 2026, next month');
    expect(day('2026-04-01')).toHaveAttribute('data-outside', '');
    // One tab stop: the chosen day.
    const stops = Array.from(document.querySelectorAll('[data-slot="calendar-day"]')).filter(
      (b) => b.getAttribute('tabindex') === '0',
    );
    expect(stops).toEqual([day('2026-03-18')]);
  });

  it('weekStartsOn="monday" puts Monday first', () => {
    render(<Calendar today="2026-03-12" weekStartsOn="monday" />);
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Monday');
    // 1 March 2026 is a Sunday: six days of February lead the first week.
    expect(day('2026-02-23')).toHaveAttribute('data-outside', '');
  });

  it('arrow keys move by day and week, PageUp/PageDown by month, Home/End by week', () => {
    render(<Calendar today="2026-03-12" defaultValue="2026-03-18" />);
    focusDay('2026-03-18');
    key('ArrowRight');
    expect(day('2026-03-19')).toHaveFocus();
    key('ArrowDown');
    expect(day('2026-03-26')).toHaveFocus();
    key('ArrowLeft');
    expect(day('2026-03-25')).toHaveFocus();
    key('ArrowUp');
    expect(day('2026-03-18')).toHaveFocus();
    key('Home');
    expect(day('2026-03-15')).toHaveFocus();
    key('End');
    expect(day('2026-03-21')).toHaveFocus();
    key('PageDown');
    expect(title()).toHaveTextContent('April 2026');
    expect(day('2026-04-21')).toHaveFocus();
    key('PageUp', { shiftKey: true });
    expect(title()).toHaveTextContent('April 2025');
    expect(day('2025-04-21')).toHaveFocus();
    key('PageDown', { shiftKey: true });
    key('PageUp');
    expect(day('2026-03-21')).toHaveFocus();
    // Past the end of the month turns the page.
    focusDay('2026-03-31');
    key('ArrowRight');
    expect(title()).toHaveTextContent('April 2026');
    expect(day('2026-04-01')).toHaveFocus();
  });

  it('skips disabled days in the direction of travel and stays within min/max', () => {
    render(
      <Calendar today="2026-03-12" defaultValue="2026-03-13" disabledDaysOfWeek={[0, 6]} max="2026-03-20" />,
    );
    focusDay('2026-03-13');
    key('ArrowRight'); // Sat 14, Sun 15 closed
    expect(day('2026-03-16')).toHaveFocus();
    key('ArrowLeft');
    expect(day('2026-03-13')).toHaveFocus();
    focusDay('2026-03-20');
    key('ArrowRight'); // past max: stays
    expect(day('2026-03-20')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  it('Enter / click chooses; the month buttons turn the page', () => {
    const onValueChange = vi.fn();
    render(<Calendar today="2026-03-12" onValueChange={onValueChange} />);
    fireEvent.click(day('2026-03-20'));
    expect(onValueChange).toHaveBeenCalledWith('2026-03-20');
    expect(day('2026-03-20')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(title()).toHaveTextContent('April 2026');
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(title()).toHaveTextContent('February 2026');
  });

  it('merges className last and forwards the ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Calendar ref={ref} today="2026-03-12" className="w-full" />);
    expect(ref.current).toHaveAttribute('data-slot', 'calendar');
    expect(ref.current?.className).toContain('w-full');
    expect(ref.current?.className).not.toContain('w-[17.5rem]');
  });
});

describe('DatePicker', () => {
  it('opens on the button, focuses the chosen day, and a pick fills the field and closes', async () => {
    const onValueChange = vi.fn();
    render(
      <Field label="Interview date" help="Weekends are closed.">
        <DatePicker
          defaultValue="2026-03-18"
          today="2026-03-12"
          calendarLabel="Choose an interview date"
          onValueChange={onValueChange}
        />
      </Field>,
    );
    const input = screen.getByLabelText('Interview date') as HTMLInputElement;
    expect(input.value).toBe('18/03/2026');
    expect(input).toHaveAccessibleDescription('Weekends are closed.');
    const button = screen.getByRole('button', { name: 'Open the calendar' });
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');

    fireEvent.click(button);
    const dialog = await screen.findByRole('dialog', { name: 'Choose an interview date' });
    await waitFor(() => expect(day('2026-03-18')).toHaveFocus());
    expect(dialog).toContainElement(day('2026-03-18'));

    key('ArrowRight');
    act(() => {
      (document.activeElement as HTMLButtonElement).click();
    });
    expect(onValueChange).toHaveBeenCalledWith('2026-03-19');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(input.value).toBe('19/03/2026');
    expect(button).toHaveFocus();
  });

  it('typing a date moves the calendar to it', async () => {
    render(<DatePicker aria-label="Deadline" today="2026-03-12" />);
    const input = screen.getByRole('textbox', { name: 'Deadline' });
    fireEvent.change(input, { target: { value: '05/06/2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open the calendar' }));
    await screen.findByRole('dialog');
    expect(title()).toHaveTextContent('June 2026');
    expect(day('2026-06-05')).toHaveAttribute('aria-pressed', 'true');
  });

  it('Escape closes and returns focus to the button', async () => {
    render(<DatePicker aria-label="Deadline" defaultOpen today="2026-03-12" />);
    await screen.findByRole('dialog', { name: 'Choose a date' });
    await waitFor(() => expect(day('2026-03-12')).toHaveFocus());
    key('Escape');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('presets pick their date and close', async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Interview date"
        defaultOpen
        today="2026-03-12"
        presets={[{ label: 'Next open slot', value: '2026-03-13' }]}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Next open slot' }));
    expect(onValueChange).toHaveBeenCalledWith('2026-03-13');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('disabled: the field and the button are disabled, and it cannot open', () => {
    render(<DatePicker aria-label="Interview date" defaultValue="2026-03-18" disabled defaultOpen />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Open the calendar' })).toBeDisabled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('an error from the Field marks the field invalid', () => {
    render(
      <Field label="Interview date" error="That date does not exist. Use DD/MM/YYYY.">
        <DatePicker />
      </Field>,
    );
    expect(screen.getByLabelText('Interview date')).toHaveAttribute('aria-invalid', 'true');
  });

  it('className on the root, ref on the text input', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<DatePicker ref={ref} aria-label="d" className="max-w-xs" />);
    expect(ref.current?.tagName).toBe('INPUT');
    const root = document.querySelector('[data-slot="date-picker"]')!;
    expect(root.className).toContain('max-w-xs');
    expect(root).toContainElement(ref.current);
  });
});

describe('Calendar on touch', () => {
  it('is 320px wide on a coarse pointer, so each day is a 44px target', () => {
    expect(calendarVariants()).toContain('pointer-coarse:w-[20rem]');
  });
});
