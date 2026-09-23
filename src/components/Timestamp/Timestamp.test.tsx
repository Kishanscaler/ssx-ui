import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';

import { Timestamp } from './Timestamp';
import { formatAbsolute, formatRelative } from './format';

const SUBMITTED = '2026-03-04T23:42:00+05:30';
const TWO_HOURS_LATER = new Date('2026-03-05T01:42:00+05:30').getTime();

afterEach(() => {
  vi.useRealTimers();
});

describe('formatAbsolute / formatRelative', () => {
  it('prints the HTML shape in en-IN / IST, whatever the host zone', () => {
    expect(formatAbsolute(SUBMITTED)).toBe('4 Mar 2026, 11:42 PM');
    expect(formatAbsolute(SUBMITTED, false)).toBe('4 Mar 2026');
    // "Sep", not ICU's "Sept"; midnight is 12 AM.
    expect(formatAbsolute('2026-09-10T00:05:00+05:30')).toBe('10 Sep 2026, 12:05 AM');
    expect(formatAbsolute('2026-09-10T12:00:00+05:30')).toBe('10 Sep 2026, 12:00 PM');
    expect(formatAbsolute(SUBMITTED, true, { timeZone: 'UTC' })).toBe('4 Mar 2026, 6:12 PM');
    expect(formatAbsolute('not a date')).toBe('');
  });

  it('relative buckets', () => {
    const now = new Date(SUBMITTED).getTime();
    expect(formatRelative(now - 10 * 1000, now)).toBe('now');
    expect(formatRelative(now - 5 * 60 * 1000, now)).toBe('5 minutes ago');
    expect(formatRelative(now - 2 * 3600 * 1000, now)).toBe('2 hours ago');
    expect(formatRelative(now + 6 * 3600 * 1000, now)).toBe('in 6 hours');
    expect(formatRelative(now - 24 * 3600 * 1000, now)).toBe('yesterday');
    expect(formatRelative(now - 4 * 24 * 3600 * 1000, now)).toBe('4 days ago');
  });
});

describe('Timestamp', () => {
  it('absolute: a <time> with dateTime, tabular figures, secondary ink', () => {
    const { container } = render(<Timestamp date={SUBMITTED} />);
    const time = container.querySelector('time')!;
    expect(time).toHaveAttribute('data-slot', 'timestamp');
    expect(time).toHaveAttribute('data-format', 'absolute');
    expect(time).toHaveAttribute('data-tone', 'default');
    expect(time).toHaveAttribute('dateTime', SUBMITTED);
    expect(time).toHaveTextContent('4 Mar 2026, 11:42 PM');
    expect(time.className).toContain('tabular-nums');
    expect(time.className).toContain('text-content-secondary');
  });

  it('date: date-only text and an ISO date dateTime for a Date input', () => {
    const { container } = render(<Timestamp format="date" date={new Date(SUBMITTED)} />);
    const time = container.querySelector('time')!;
    expect(time).toHaveTextContent(/^4 Mar 2026$/);
    expect(time).toHaveAttribute('dateTime', '2026-03-04');
  });

  it('SSR: the server renders the absolute text, never a relative guess', () => {
    const html = renderToString(<Timestamp date={SUBMITTED} format="relative" />);
    expect(html).toContain('4 Mar 2026, 11:42 PM');
    expect(html).not.toContain('ago');
    const both = renderToString(<Timestamp date={SUBMITTED} format="both" />);
    expect(both).toContain('4 Mar 2026, 11:42 PM');
    expect(both).not.toContain('timestamp-absolute');
  });

  it('SSR with `now`: the relative text renders on the server too', () => {
    const html = renderToString(<Timestamp date={SUBMITTED} format="relative" now={TWO_HOURS_LATER} />);
    expect(html).toContain('2 hours ago');
  });

  it('relative after mount, with the absolute in title', () => {
    vi.useFakeTimers();
    vi.setSystemTime(TWO_HOURS_LATER);
    render(<Timestamp date={SUBMITTED} format="relative" />);
    const time = screen.getByText('2 hours ago');
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('title', '4 Mar 2026, 11:42 PM');
  });

  it('both: relative in the <time>, " · absolute" after it', () => {
    vi.useFakeTimers();
    vi.setSystemTime(TWO_HOURS_LATER);
    const { container } = render(<Timestamp date={SUBMITTED} format="both" />);
    const group = container.querySelector('[data-slot="timestamp-group"]')!;
    expect(group.querySelector('time')).toHaveTextContent('2 hours ago');
    expect(group.querySelector('[data-slot="timestamp-absolute"]')).toHaveTextContent('· 4 Mar 2026, 11:42 PM');
  });

  it('ticks while live, and freezes with live={false}', () => {
    vi.useFakeTimers();
    const start = new Date(SUBMITTED).getTime() + 2 * 60 * 1000;
    vi.setSystemTime(start);
    render(
      <>
        <Timestamp date={SUBMITTED} format="relative" data-testid="live" />
        <Timestamp date={SUBMITTED} format="relative" live={false} data-testid="frozen" />
      </>,
    );
    expect(screen.getByTestId('live')).toHaveTextContent('2 minutes ago');
    act(() => {
      vi.setSystemTime(start + 3 * 60 * 1000);
      vi.advanceTimersByTime(30 * 1000);
    });
    expect(screen.getByTestId('live')).toHaveTextContent('5 minutes ago');
    expect(screen.getByTestId('frozen')).toHaveTextContent('2 minutes ago');
  });

  it('tone, children override, ref and className', () => {
    const ref = React.createRef<HTMLTimeElement>();
    render(
      <Timestamp ref={ref} date={SUBMITTED} tone="danger" className="text-xs">
        Overdue since 28 Feb 2026, 11:59 PM
      </Timestamp>,
    );
    expect(ref.current).toHaveTextContent('Overdue since 28 Feb 2026, 11:59 PM');
    expect(ref.current).toHaveAttribute('data-tone', 'danger');
    expect(ref.current!.className).toContain('text-danger-content');
    expect(ref.current!.className).toContain('text-xs');
    expect(ref.current!.className).not.toContain('text-sm');
  });
});
