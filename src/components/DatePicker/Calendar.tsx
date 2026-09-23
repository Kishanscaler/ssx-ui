'use client';

// Client: holds the visible month, the roving focus and the controllable
// value, and attaches the grid's keyboard handler.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useId } from '../../lib/use-id';
import { Divider } from '../Divider';
import { headingVariants } from '../Heading';
import { IconButton } from '../IconButton';

/* ---------------------------------------------------------------------------
 * Calendar
 *
 * The month grid of the DatePicker, also usable on its own (the HTML's
 * "always-visible" calendar). One date, as an ISO `YYYY-MM-DD` string — the
 * same value DateInput carries. No date library: the arithmetic is UTC day
 * numbers, and the words come from `Intl.DateTimeFormat` in `en-IN`.
 *
 * The HTML's contract:
 *   - a chosen date is a pressed toggle (`aria-pressed="true"`, the solid
 *     brand fill), not a selected option;
 *   - today is `aria-current="date"` (a 1px brand ring);
 *   - a day with no slot is a NATIVE disabled button ("campus closed");
 *   - a day of the adjacent month is muted and disabled.
 *   - Sunday first (the HTML's S M T W T F S); `weekStartsOn="monday"` flips it.
 *
 * Keyboard, the APG date-picker grid: the grid is one tab stop (roving
 * tabindex). ←/→ a day, ↑/↓ a week, PageUp/PageDown a month (with Shift a
 * year), Home/End the start/end of the week, Enter/Space choose. Moving past
 * the month turns the page. A disabled day is skipped in the direction of
 * travel, and focus never leaves `min`…`max`.
 * ------------------------------------------------------------------------- */

/* ---- date helpers (UTC, ISO strings) -------------------------------------- */

const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

function parts(iso: string | null | undefined): [number, number, number] | null {
  const m = ISO.exec(iso ?? '');
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > daysIn(y, mo)) return null;
  return [y, mo, d];
}
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const toIso = (date: Date) =>
  `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

function addDays(iso: string, n: number): string {
  const p = parts(iso)!;
  return toIso(utc(p[0], p[1], p[2] + n));
}
function addMonths(iso: string, n: number): string {
  const [y, m, d] = parts(iso)!;
  const first = utc(y, m + n, 1);
  const ny = first.getUTCFullYear();
  const nm = first.getUTCMonth() + 1;
  return toIso(utc(ny, nm, Math.min(d, daysIn(ny, nm))));
}
const weekday = (iso: string) => {
  const [y, m, d] = parts(iso)!;
  return utc(y, m, d).getUTCDay();
};
const monthOf = (iso: string) => iso.slice(0, 7);
const firstOf = (month: string) => `${month}-01`;

/** Today in the viewer's time zone, as ISO. */
function localToday(): string {
  const now = new Date();
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function fmt(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
    formatters.set(key, f);
  }
  return f;
}
const isoDate = (iso: string) => {
  const [y, m, d] = parts(iso)!;
  return utc(y, m, d);
};

/* ---- glyphs --------------------------------------------------------------- */

/** Phosphor 2.1.1 `caret-left` / `caret-right` bold (MIT; the preview's `ph-chevron-*-bold`). */
const CHEVRON = {
  prev: 'M168.49,199.51a12,12,0,0,1-17,17l-80-80a12,12,0,0,1,0-17l80-80a12,12,0,0,1,17,17L97,128Z',
  next: 'M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z',
} as const;

/* ---- component ------------------------------------------------------------ */

/** String union, so a Storyblok option value can be passed straight in. */
export type CalendarWeekStart = 'sunday' | 'monday';

// Touch: 320px wide, so every day cell is a 44px target (dense 2px-apart
// cells cannot take invisible hit areas without overlapping).
export const calendarVariants = cva('w-[280px] max-w-full font-sans text-content pointer-coarse:w-[320px]');

export const calendarDayVariants = cva([
  'grid aspect-square w-full place-content-center rounded-md border-0 bg-transparent p-0',
  'font-sans text-sm leading-none font-regular text-content tabular-nums',
  'cursor-pointer transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',
  'enabled:hover:bg-surface-hover',
  // Today: a 1px brand ring (`.is-today`, `[aria-current=date]`).
  'aria-[current=date]:ring-1 aria-[current=date]:ring-border-brand aria-[current=date]:ring-inset',
  // Chosen: the solid brand fill, bold (`.is-selected`, `aria-pressed`).
  'aria-pressed:bg-action-primary aria-pressed:font-bold aria-pressed:text-action-primary-fg',
  'aria-pressed:enabled:hover:bg-action-primary-hover',
  // No slot / out of range / the adjacent month: the disabled ink, no fill.
  'disabled:cursor-not-allowed disabled:bg-transparent disabled:text-content-disabled',
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid focus-visible:outline-border-focus',
]);

export type CalendarProps = Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'defaultValue' | 'onSelect' | 'onChange'
> & {
  /** The chosen date, ISO `YYYY-MM-DD`, `''` for none (controlled). */
  value?: string;
  /**
   * The initial date (uncontrolled).
   *
   * @default ''
   */
  defaultValue?: string;
  /** Called with the new ISO date when the choice changes. */
  onValueChange?: (value: string) => void;
  /** Called on every choice, including the date already chosen (a DatePicker closes on it). */
  onDateSelect?: (value: string) => void;
  /** The month on screen, `YYYY-MM` (controlled). */
  month?: string;
  /** The first month on screen, `YYYY-MM` (uncontrolled). Defaults to the chosen date's, else today's. */
  defaultMonth?: string;
  /** Called with the new `YYYY-MM` when the page turns. */
  onMonthChange?: (month: string) => void;
  /** The earliest date that can be chosen, ISO. */
  min?: string;
  /** The latest date that can be chosen, ISO. */
  max?: string;
  /** Dates that cannot be chosen, ISO ("campus closed", a full slot). */
  disabledDates?: string[];
  /** Weekdays that cannot be chosen: 0 Sunday … 6 Saturday (`[0, 6]`: weekends are closed). */
  disabledDaysOfWeek?: number[];
  /** Any other rule: return `true` to disable the date. */
  isDateDisabled?: (date: string) => boolean;
  /**
   * Extra words for a day's accessible name, after the date: "no slots",
   * "campus closed", "3 slots left".
   */
  getDateDescription?: (date: string) => string | undefined;
  /**
   * The first column. The HTML (and the Indian academic calendar) starts on
   * Sunday.
   *
   * @default 'sunday'
   */
  weekStartsOn?: CalendarWeekStart;
  /**
   * Today, ISO. Defaults to the viewer's local date; pass it to pin a story,
   * a test or a server render.
   */
  today?: string;
  /**
   * The locale for month, weekday and day names.
   *
   * @default 'en-IN'
   */
  locale?: string;
  /**
   * Draw the adjacent months' days (muted, disabled) to fill the first and
   * last weeks.
   *
   * @default true
   */
  showOutsideDays?: boolean;
  /**
   * Move focus to the active day when the calendar mounts. The DatePicker sets
   * it so the grid takes focus when the popover opens.
   *
   * @default false
   */
  autoFocus?: boolean;
  /**
   * The previous-month button's name.
   *
   * @default 'Previous month'
   */
  previousMonthLabel?: string;
  /**
   * The next-month button's name.
   *
   * @default 'Next month'
   */
  nextMonthLabel?: string;
  /** Under the grid, after a divider: shortcut chips ("Next open slot", "This week"). */
  footer?: React.ReactNode;
};

type Day = { iso: string; outside: 'previous' | 'next' | null };

export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  {
    className,
    value: valueProp,
    defaultValue = '',
    onValueChange,
    onDateSelect,
    month: monthProp,
    defaultMonth,
    onMonthChange,
    min,
    max,
    disabledDates,
    disabledDaysOfWeek,
    isDateDisabled,
    getDateDescription,
    weekStartsOn = 'sunday',
    today: todayProp,
    locale = 'en-IN',
    showOutsideDays = true,
    autoFocus = false,
    previousMonthLabel = 'Previous month',
    nextMonthLabel = 'Next month',
    footer,
    ...props
  },
  ref,
) {
  const [value, setValue] = useControllableState<string>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange,
    caller: 'Calendar',
  });
  const selected = parts(value) ? (value as string) : '';

  const [today] = React.useState(() => (parts(todayProp) ? (todayProp as string) : localToday()));
  const todayIso = parts(todayProp) ? (todayProp as string) : today;

  const [month, setMonth] = useControllableState<string>({
    prop: monthProp,
    defaultProp: defaultMonth ?? monthOf(selected || todayIso),
    onChange: onMonthChange,
    caller: 'Calendar',
  });
  const visible = /^\d{4}-\d{2}$/.test(month ?? '') ? (month as string) : monthOf(todayIso);

  const disabledSet = React.useMemo(() => new Set(disabledDates ?? []), [disabledDates]);
  const isDisabled = (iso: string) =>
    (min != null && iso < min) ||
    (max != null && iso > max) ||
    disabledSet.has(iso) ||
    (disabledDaysOfWeek?.includes(weekday(iso)) ?? false) ||
    (isDateDisabled?.(iso) ?? false);

  // The roving focus: one day is the grid's tab stop.
  const firstEnabledIn = (m: string): string | null => {
    const [y, mo] = m.split('-').map(Number) as [number, number];
    for (let d = 1; d <= daysIn(y, mo); d += 1) {
      const iso = `${m}-${pad(d)}`;
      if (!isDisabled(iso)) return iso;
    }
    return null;
  };
  const pickActive = (m: string): string => {
    if (selected && monthOf(selected) === m && !isDisabled(selected)) return selected;
    if (monthOf(todayIso) === m && !isDisabled(todayIso)) return todayIso;
    return firstEnabledIn(m) ?? firstOf(m);
  };
  const [focusedState, setFocused] = React.useState<string>(() => pickActive(visible));
  const focused = monthOf(focusedState) === visible ? focusedState : pickActive(visible);

  const gridRef = React.useRef<HTMLTableElement>(null);
  const wantFocus = React.useRef(autoFocus);
  React.useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
  });

  const titleId = `${useId()}-title`;
  const weekStart = weekStartsOn === 'monday' ? 1 : 0;

  // The weeks on screen.
  const first = firstOf(visible);
  const lead = (weekday(first) - weekStart + 7) % 7;
  const [vy, vm] = visible.split('-').map(Number) as [number, number];
  const count = daysIn(vy, vm);
  const cells: Day[] = [];
  for (let i = lead; i > 0; i -= 1) cells.push({ iso: addDays(first, -i), outside: 'previous' });
  for (let d = 1; d <= count; d += 1) cells.push({ iso: `${visible}-${pad(d)}`, outside: null });
  const last = `${visible}-${pad(count)}`;
  for (let i = 1; cells.length % 7 !== 0; i += 1) cells.push({ iso: addDays(last, i), outside: 'next' });
  const weeks: Day[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const weekdays = Array.from({ length: 7 }, (_, i) => {
    // 2023-01-01 was a Sunday.
    const date = utc(2023, 1, 1 + ((weekStart + i) % 7));
    return {
      short: fmt(locale, { weekday: 'narrow' }).format(date),
      long: fmt(locale, { weekday: 'long' }).format(date),
    };
  });

  const turnTo = (m: string) => {
    if (m !== visible) setMonth(m);
  };
  const minMonth = min ? monthOf(min) : null;
  const maxMonth = max ? monthOf(max) : null;
  const prevMonth = monthOf(addMonths(first, -1));
  const nextMonth = monthOf(addMonths(first, 1));

  const moveTo = (target: string, step: number) => {
    let iso = target;
    if (min != null && iso < min) iso = min;
    if (max != null && iso > max) iso = max;
    // Skip disabled days in the direction of travel, staying in range.
    for (let i = 0; i < 400 && isDisabled(iso); i += 1) {
      const next = addDays(iso, step);
      if ((min != null && next < min) || (max != null && next > max)) return;
      iso = next;
    }
    if (isDisabled(iso)) return;
    wantFocus.current = true;
    setFocused(iso);
    turnTo(monthOf(iso));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
    const from = focused;
    let target: string | null = null;
    let step = 1;
    switch (event.key) {
      case 'ArrowLeft':
        target = addDays(from, -1);
        step = -1;
        break;
      case 'ArrowRight':
        target = addDays(from, 1);
        break;
      case 'ArrowUp':
        target = addDays(from, -7);
        step = -1;
        break;
      case 'ArrowDown':
        target = addDays(from, 7);
        break;
      case 'PageUp':
        target = event.shiftKey ? addMonths(from, -12) : addMonths(from, -1);
        break;
      case 'PageDown':
        target = event.shiftKey ? addMonths(from, 12) : addMonths(from, 1);
        break;
      case 'Home':
        target = addDays(from, -((weekday(from) - weekStart + 7) % 7));
        break;
      case 'End':
        target = addDays(from, 6 - ((weekday(from) - weekStart + 7) % 7));
        step = -1;
        break;
      default:
        return;
    }
    event.preventDefault();
    moveTo(target, step);
  };

  const choose = (iso: string) => {
    setFocused(iso);
    setValue(iso);
    onDateSelect?.(iso);
  };

  const long = fmt(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div ref={ref} data-slot="calendar" className={cn(calendarVariants(), className)} {...props}>
      <div data-slot="calendar-head" className="mb-2 flex items-center justify-between gap-2">
        <IconButton
          variant="tertiary"
          size="sm"
          aria-label={previousMonthLabel}
          data-slot="calendar-previous"
          disabled={minMonth != null && prevMonth < minMonth}
          onClick={() => {
            setFocused(addMonths(focused, -1));
            turnTo(prevMonth);
          }}
        >
          <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
            <path d={CHEVRON.prev} />
          </svg>
        </IconButton>
        <span
          id={titleId}
          data-slot="calendar-title"
          aria-live="polite"
          className={cn(headingVariants({ size: '3' }), 'text-content')}
        >
          {fmt(locale, { month: 'long', year: 'numeric' }).format(isoDate(first))}
        </span>
        <IconButton
          variant="tertiary"
          size="sm"
          aria-label={nextMonthLabel}
          data-slot="calendar-next"
          disabled={maxMonth != null && nextMonth > maxMonth}
          onClick={() => {
            setFocused(addMonths(focused, 1));
            turnTo(nextMonth);
          }}
        >
          <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
            <path d={CHEVRON.next} />
          </svg>
        </IconButton>
      </div>
      {/* 2px between cells (`gap: 2px`), without the outer spacing a table adds. */}
      <div className="-m-0.5">
        <table
          ref={gridRef}
          role="grid"
          aria-labelledby={titleId}
          data-slot="calendar-grid"
          className="w-full table-fixed border-separate border-spacing-0.5"
          onKeyDown={onKeyDown}
        >
          <thead>
            <tr>
              {weekdays.map((day) => (
                <th
                  key={day.long}
                  scope="col"
                  abbr={day.long}
                  data-slot="calendar-weekday"
                  className="py-1 text-center text-xs font-semibold text-content-secondary"
                >
                  <span aria-hidden="true">{day.short}</span>
                  <span className="sr-only">{day.long}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week[0]?.iso} data-slot="calendar-week">
                {week.map(({ iso, outside }) => {
                  if (outside && !showOutsideDays) return <td key={iso} role="gridcell" />;
                  const off = outside != null || isDisabled(iso);
                  const isToday = iso === todayIso;
                  const isSelected = !outside && iso === selected;
                  const description = getDateDescription?.(iso);
                  const label = [
                    long.format(isoDate(iso)),
                    isToday ? 'today' : null,
                    isSelected ? 'selected' : null,
                    outside ? `${outside} month` : description || null,
                  ]
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <td key={iso} role="gridcell" className="p-0">
                      <button
                        type="button"
                        data-slot="calendar-day"
                        data-date={iso}
                        data-outside={outside ? '' : undefined}
                        data-today={isToday ? '' : undefined}
                        disabled={off}
                        tabIndex={!off && iso === focused ? 0 : -1}
                        aria-pressed={off ? undefined : isSelected}
                        aria-current={isToday && !outside ? 'date' : undefined}
                        aria-label={label}
                        className={calendarDayVariants()}
                        onClick={() => choose(iso)}
                        onFocus={() => setFocused(iso)}
                      >
                        {Number(iso.slice(8))}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer != null ? (
        <>
          <Divider className="my-4" />
          <div data-slot="calendar-footer" className="flex flex-wrap items-center gap-2">
            {footer}
          </div>
        </>
      ) : null}
    </div>
  );
});
Calendar.displayName = 'Calendar';
