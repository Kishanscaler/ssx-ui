import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ANNOUNCER_SELECTOR } from '../../lib/announce';
import { Field } from '../Field';
import { DateRangePicker } from './DateRangePicker';
import { RangeCalendar, formatDateRange, normalizeDateRange } from './RangeCalendar';

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
const titles = () =>
  Array.from(document.querySelectorAll('[data-slot="range-calendar-title"]')).map((t) => t.textContent);
const key = (k: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(document.activeElement as Element, { key: k, ...init });

describe('formatDateRange / normalizeDateRange', () => {
  // ICU sets thin spaces around the dash; compare with plain spaces.
  const f = (range: { from: string; to: string }) => formatDateRange(range).replace(/\s/g, ' ');
  it('writes the range in en-IN with the shared parts once', () => {
    expect(f({ from: '2026-10-12', to: '2026-11-03' })).toBe('12 Oct – 3 Nov 2026');
    expect(f({ from: '2026-10-12', to: '2026-10-18' })).toBe('12–18 Oct 2026');
    expect(f({ from: '2026-12-28', to: '2027-01-04' })).toBe('28 Dec 2026 – 4 Jan 2027');
    expect(f({ from: '2026-10-12', to: '' })).toBe('12 Oct 2026 – …');
    expect(f({ from: '', to: '' })).toBe('');
  });

  it('orders the ends and drops what is not a date', () => {
    expect(normalizeDateRange({ from: '2026-11-03', to: '2026-10-12' })).toEqual({
      from: '2026-10-12',
      to: '2026-11-03',
    });
    expect(normalizeDateRange({ from: '2026-02-31', to: '2026-03-01' })).toEqual({ from: '', to: '' });
    expect(normalizeDateRange(undefined)).toEqual({ from: '', to: '' });
  });
});

describe('RangeCalendar', () => {
  it('draws two named month grids with one tab stop', () => {
    render(<RangeCalendar today="2026-10-05" />);
    expect(titles()).toEqual(['October 2026', 'November 2026']);
    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
    const stops = Array.from(document.querySelectorAll('[data-slot="range-calendar-day"]')).filter(
      (b) => b.getAttribute('tabindex') === '0',
    );
    expect(stops).toEqual([day('2026-10-05')]);
    expect(day('2026-10-05')).toHaveAccessibleName('5 October 2026, today');
    // Outside days are off by default: no duplicate 1 November in October.
    expect(document.querySelectorAll('[data-date="2026-11-01"]')).toHaveLength(1);
  });

  it('numberOfMonths={1} draws one month', () => {
    render(<RangeCalendar today="2026-10-05" numberOfMonths={1} />);
    expect(titles()).toEqual(['October 2026']);
  });

  it('first press is the start, second the end; before the start restarts', () => {
    const onValueChange = vi.fn();
    const onRangeSelect = vi.fn();
    render(<RangeCalendar today="2026-10-05" onValueChange={onValueChange} onRangeSelect={onRangeSelect} />);
    fireEvent.click(day('2026-10-12'));
    expect(onValueChange).toHaveBeenLastCalledWith({ from: '2026-10-12', to: '' });
    expect(day('2026-10-12')).toHaveAttribute('data-range-start', '');
    expect(day('2026-10-12')).toHaveAttribute('aria-pressed', 'true');
    expect(day('2026-10-12')).toHaveAccessibleName('12 October 2026, start date');
    expect(document.querySelector('[data-slot="range-calendar"]')).toHaveAttribute('data-choosing', 'end');

    fireEvent.click(day('2026-10-08'));
    expect(onValueChange).toHaveBeenLastCalledWith({ from: '2026-10-08', to: '' });
    expect(onRangeSelect).not.toHaveBeenCalled();

    fireEvent.click(day('2026-11-03'));
    expect(onValueChange).toHaveBeenLastCalledWith({ from: '2026-10-08', to: '2026-11-03' });
    expect(onRangeSelect).toHaveBeenCalledWith({ from: '2026-10-08', to: '2026-11-03' });
    expect(day('2026-11-03')).toHaveAttribute('data-range-end', '');
    expect(day('2026-11-03')).toHaveAccessibleName('3 November 2026, end date');
    expect(day('2026-10-20')).toHaveAttribute('data-in-range', '');
    expect(day('2026-10-20')).toHaveAttribute('aria-pressed', 'false');
    expect(day('2026-10-20')).toHaveAccessibleName('20 October 2026, in range');
    expect(day('2026-10-07')).not.toHaveAttribute('data-in-range');

    // A press after a complete range starts a new one.
    fireEvent.click(day('2026-10-25'));
    expect(onValueChange).toHaveBeenLastCalledWith({ from: '2026-10-25', to: '' });
  });

  it('a one-day range is start and end at once', () => {
    render(<RangeCalendar today="2026-10-05" defaultValue={{ from: '2026-10-12', to: '' }} />);
    fireEvent.click(day('2026-10-12'));
    expect(day('2026-10-12')).toHaveAccessibleName('12 October 2026, start and end date');
  });

  it('hovering previews the range while the end is being chosen', () => {
    render(<RangeCalendar today="2026-10-05" defaultValue={{ from: '2026-10-12', to: '' }} />);
    fireEvent.mouseEnter(day('2026-10-16'));
    expect(day('2026-10-16')).toHaveAttribute('data-preview-end', '');
    expect(day('2026-10-14')).toHaveAttribute('data-preview', '');
    expect(day('2026-10-14')).not.toHaveAttribute('data-in-range');
    expect(day('2026-10-17')).not.toHaveAttribute('data-preview');
    // The band runs across the week wrap (Sat 17 → Sun 18 with a later end).
    fireEvent.mouseEnter(day('2026-10-20'));
    expect(day('2026-10-18')).toHaveAttribute('data-preview', '');
    // Before the start there is nothing to preview.
    fireEvent.mouseEnter(day('2026-10-09'));
    expect(document.querySelector('[data-preview-end]')).toBeNull();
    fireEvent.mouseEnter(day('2026-10-20'));
    fireEvent.mouseLeave(document.querySelector('[data-slot="range-calendar"]')!);
    expect(document.querySelector('[data-preview]')).toBeNull();
  });

  it('the keyboard focus previews as well, and Enter chooses', () => {
    const onRangeSelect = vi.fn();
    render(
      <RangeCalendar
        today="2026-10-05"
        defaultValue={{ from: '2026-10-12', to: '' }}
        onRangeSelect={onRangeSelect}
      />,
    );
    focusDay('2026-10-12');
    key('ArrowRight');
    key('ArrowRight');
    expect(day('2026-10-14')).toHaveFocus();
    expect(day('2026-10-14')).toHaveAttribute('data-preview-end', '');
    fireEvent.click(day('2026-10-14')); // Enter / Space on a button is a click
    expect(onRangeSelect).toHaveBeenCalledWith({ from: '2026-10-12', to: '2026-10-14' });
  });

  it('arrows move by day and week across both months; the page turns past the second', () => {
    render(<RangeCalendar today="2026-10-05" />);
    focusDay('2026-10-31');
    key('ArrowRight');
    expect(day('2026-11-01')).toHaveFocus();
    expect(titles()).toEqual(['October 2026', 'November 2026']);
    key('ArrowDown');
    expect(day('2026-11-08')).toHaveFocus();
    key('PageDown');
    expect(titles()).toEqual(['November 2026', 'December 2026']);
    expect(day('2026-12-08')).toHaveFocus();
    key('Home');
    expect(day('2026-12-06')).toHaveFocus();
    key('End');
    expect(day('2026-12-12')).toHaveFocus();
    key('PageUp', { shiftKey: true });
    expect(titles()).toEqual(['December 2025', 'January 2026']);
    expect(day('2025-12-12')).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(titles()).toEqual(['January 2026', 'February 2026']);
  });

  it('min / max and disabled days bind the grid; a range may span a closed day', () => {
    const onRangeSelect = vi.fn();
    render(
      <RangeCalendar
        today="2026-10-05"
        min="2026-10-05"
        max="2026-11-20"
        disabledDaysOfWeek={[0, 6]}
        onRangeSelect={onRangeSelect}
      />,
    );
    expect(day('2026-10-02')).toBeDisabled();
    expect(day('2026-10-10')).toBeDisabled(); // Saturday
    expect(day('2026-11-23')).toBeDisabled(); // past max
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    focusDay('2026-10-09');
    key('ArrowRight'); // skips Sat 10, Sun 11
    expect(day('2026-10-12')).toHaveFocus();
    fireEvent.click(day('2026-10-09'));
    fireEvent.click(day('2026-10-13'));
    expect(onRangeSelect).toHaveBeenCalledWith({ from: '2026-10-09', to: '2026-10-13' });
    expect(day('2026-10-10')).toHaveAttribute('data-in-range', '');
  });

  it('minNights / maxNights limit the end while it is being chosen', () => {
    render(
      <RangeCalendar
        today="2026-10-05"
        defaultValue={{ from: '2026-10-12', to: '' }}
        minNights={3}
        maxNights={10}
      />,
    );
    expect(day('2026-10-13')).toBeDisabled();
    expect(day('2026-10-14')).toBeDisabled();
    expect(day('2026-10-15')).toBeEnabled();
    expect(day('2026-10-22')).toBeEnabled();
    expect(day('2026-10-23')).toBeDisabled();
    // Before the start is still a restart, so it stays enabled.
    expect(day('2026-10-08')).toBeEnabled();
  });

  it('announces the start and the finished range', async () => {
    vi.useFakeTimers();
    try {
      render(<RangeCalendar today="2026-10-05" />);
      fireEvent.click(day('2026-10-12'));
      act(() => {
        vi.advanceTimersByTime(150);
      });
      const region = document.querySelector(ANNOUNCER_SELECTOR)!;
      expect(region).toHaveTextContent('Start date 12 October 2026. Now choose the end date.');
      fireEvent.click(day('2026-11-03'));
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(region).toHaveTextContent('12 October 2026 to 3 November 2026 selected.');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('DateRangePicker', () => {
  const trigger = () => screen.getByRole('combobox');

  it('is a combobox button wired by Field, showing the range', () => {
    render(
      <Field label="Cohort dates" help="Weekdays only.">
        <DateRangePicker today="2026-10-05" defaultValue={{ from: '2026-10-12', to: '2026-11-03' }} />
      </Field>,
    );
    expect(trigger()).toHaveAccessibleName('Cohort dates');
    expect(trigger()).toHaveAccessibleDescription('Weekdays only.');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveTextContent('12 Oct – 3 Nov 2026');
    expect(trigger()).not.toHaveAttribute('data-placeholder');
  });

  it('shows the placeholder when empty', () => {
    render(<DateRangePicker aria-label="Dates" placeholder="Choose cohort dates" />);
    expect(trigger()).toHaveTextContent('Choose cohort dates');
    expect(trigger()).toHaveAttribute('data-placeholder', '');
  });

  it('opens on the start day, commits on the second pick, closes and returns focus', async () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        aria-label="Interview window"
        today="2026-10-05"
        defaultValue={{ from: '2026-10-12', to: '2026-10-16' }}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(trigger());
    const dialog = await screen.findByRole('dialog', { name: 'Choose a start and end date' });
    expect(dialog).toBeInTheDocument();
    await waitFor(() => expect(day('2026-10-12')).toHaveFocus());
    fireEvent.click(day('2026-10-19'));
    expect(onValueChange).not.toHaveBeenCalled(); // a draft until complete
    expect(trigger()).toHaveTextContent('12–16 Oct 2026');
    fireEvent.click(day('2026-10-23'));
    expect(onValueChange).toHaveBeenCalledWith({ from: '2026-10-19', to: '2026-10-23' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(trigger()).toHaveTextContent('19–23 Oct 2026');
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('closing half-way keeps the value', async () => {
    render(
      <DateRangePicker aria-label="Dates" today="2026-10-05" defaultValue={{ from: '2026-10-12', to: '2026-10-16' }} />,
    );
    fireEvent.click(trigger());
    await screen.findByRole('dialog');
    fireEvent.click(day('2026-10-20'));
    key('Escape');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(trigger()).toHaveTextContent('12–16 Oct 2026');
    fireEvent.click(trigger());
    await screen.findByRole('dialog');
    expect(day('2026-10-12')).toHaveAttribute('data-range-start', '');
    expect(day('2026-10-16')).toHaveAttribute('data-range-end', '');
  });

  it('presets pick their range and close; the matching one is pressed', async () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        aria-label="Dates"
        today="2026-10-05"
        onValueChange={onValueChange}
        presets={[
          { label: 'Next 7 days', value: { from: '2026-10-05', to: '2026-10-11' } },
          { label: 'Next cohort', value: { from: '2026-11-02', to: '2027-04-30' } },
        ]}
      />,
    );
    fireEvent.click(trigger());
    await screen.findByRole('dialog');
    const preset = screen.getByRole('button', { name: 'Next cohort' });
    expect(preset).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(preset);
    expect(onValueChange).toHaveBeenCalledWith({ from: '2026-11-02', to: '2027-04-30' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(trigger());
    await screen.findByRole('dialog');
    expect(screen.getByRole('button', { name: 'Next cohort' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('posts name[from] and name[to]', () => {
    const { container } = render(
      <form>
        <DateRangePicker aria-label="Dates" name="cohort" defaultValue={{ from: '2026-10-12', to: '2026-11-03' }} />
      </form>,
    );
    const data = new FormData(container.querySelector('form')!);
    expect(data.get('cohort[from]')).toBe('2026-10-12');
    expect(data.get('cohort[to]')).toBe('2026-11-03');
  });

  it('controlled: shows `value`; a half range is not shown', () => {
    const { rerender } = render(<DateRangePicker aria-label="Dates" value={{ from: '2026-10-12', to: '' }} />);
    expect(trigger()).toHaveAttribute('data-placeholder', '');
    rerender(<DateRangePicker aria-label="Dates" value={{ from: '2026-12-28', to: '2027-01-04' }} />);
    expect(trigger()).toHaveTextContent('28 Dec 2026 – 4 Jan 2027');
  });

  it('invalid, disabled and size reach the button; ref is the button', () => {
    const ref = React.createRef<HTMLButtonElement>();
    const { unmount } = render(
      <Field label="Dates" error="Choose the cohort dates.">
        <DateRangePicker ref={ref} size="lg" />
      </Field>,
    );
    expect(ref.current).toBe(trigger());
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(trigger()).toHaveAttribute('data-size', 'lg');
    unmount();
    render(
      <Field label="Dates" disabled>
        <DateRangePicker />
      </Field>,
    );
    expect(trigger()).toBeDisabled();
  });
});
