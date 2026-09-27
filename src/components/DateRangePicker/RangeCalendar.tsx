'use client';

// Client: holds the visible months, the roving focus, the hovered day and the
// controllable range, watches the `sm` breakpoint, and attaches the grid's
// keyboard and pointer handlers.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva } from 'class-variance-authority';

import { announce, ensureAnnouncer } from '../../lib/announce';
import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { useId } from '../../lib/use-id';
import type { CalendarWeekStart } from '../DatePicker';
import {
  addDays,
  addMonths,
  daysBetween,
  daysIn,
  firstOf,
  fmt,
  isoDate,
  localToday,
  monthOf,
  pad,
  parts,
  utc,
  weekday,
} from '../DatePicker/_dates';
import { Divider } from '../Divider';
import { headingVariants } from '../Heading';
import { IconButton } from '../IconButton';
import { breakpoint } from '../../lib/scale.generated';

/* ---------------------------------------------------------------------------
 * RangeCalendar
 *
 * The month grid of the DateRangePicker, also usable on its own: a cohort's
 * start and end, an interview window, leave dates. Two ISO `YYYY-MM-DD`
 * strings, `{ from, to }`, `''` for a missing end. Same date model, words and
 * keyboard as `Calendar`; a separate component (not `Calendar mode="range"`)
 * so the single-date Calendar's `value: string` API is untouched.
 *
 * Choosing: the first press is the start; the second is the end (the range
 * is then complete and `onRangeSelect` fires); a press before the start
 * starts again from there; a press after a complete range starts a new one.
 * While the end is being chosen, the day under the pointer (or the keyboard
 * focus) previews the range with a dashed band.
 *
 * Drawing: the start and end are the solid brand fill (`aria-pressed`, as in
 * Calendar); the days between sit on a pale brand band that runs edge to edge
 * across a week and is capped (rounded) at each week's edges and at the
 * month's first and last day, so a range reads across week wraps. State is in
 * attributes: `data-range-start`, `data-range-end`, `data-in-range`,
 * `data-preview`, `data-preview-end`. A day's accessible name says "start
 * date", "end date" or "in range"; each pick is announced politely.
 *
 * Two months side by side from `sm` (672px), one on phones
 * (`numberOfMonths={2}`, the default). The second month is hidden with CSS
 * below `sm`, so a server render and the first paint agree; the keyboard
 * reads the same breakpoint to know which months are on screen.
 *
 * Keyboard, the APG date grid, as Calendar: one tab stop across both months;
 * ←/→ a day, ↑/↓ a week, PageUp/PageDown a month (Shift: a year), Home/End
 * the week, Enter/Space choose; the page turns when focus leaves the months
 * on screen; disabled days are skipped; focus stays in `min`…`max`.
 * ------------------------------------------------------------------------- */

/** A date range, as two ISO `YYYY-MM-DD` strings; `''` for a missing end. */
export interface DateRange {
  /** The first day, ISO. */
  from: string;
  /** The last day, ISO (the same as `from` for a one-day range). */
  to: string;
}

const EMPTY_RANGE: DateRange = { from: '', to: '' };

/** A range with real, ordered dates, or blanks. `to` without `from` is dropped. */
export function normalizeDateRange(range: Partial<DateRange> | null | undefined): DateRange {
  const from = parts(range?.from) ? (range!.from as string) : '';
  const to = parts(range?.to) ? (range!.to as string) : '';
  if (!from) return EMPTY_RANGE;
  if (to && to < from) return { from: to, to: from };
  return { from, to };
}

/**
 * "12 Oct – 3 Nov 2026", "12–18 Oct 2026", "28 Dec 2026 – 4 Jan 2027" in
 * `en-IN` (`Intl.DateTimeFormat#formatRange`, which knows each locale's
 * shared-part rules). `''` for no range; a start alone is "12 Oct 2026 – …".
 */
export function formatDateRange(range: Partial<DateRange> | null | undefined, locale = 'en-IN'): string {
  const { from, to } = normalizeDateRange(range);
  if (!from) return '';
  const f = fmt(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  if (!to) return `${f.format(isoDate(from))} – …`;
  const rangeFormat = (f as Intl.DateTimeFormat & { formatRange?: (a: Date, b: Date) => string }).formatRange;
  if (typeof rangeFormat === 'function') return rangeFormat.call(f, isoDate(from), isoDate(to));
  // Before formatRange (Safari < 14.1): write the shared year once.
  if (from === to) return f.format(isoDate(from));
  if (from.slice(0, 4) === to.slice(0, 4)) {
    const short = fmt(locale, { day: 'numeric', month: 'short' });
    return `${short.format(isoDate(from))} – ${f.format(isoDate(to))}`;
  }
  return `${f.format(isoDate(from))} – ${f.format(isoDate(to))}`;
}

/* ---- the `sm` breakpoint --------------------------------------------------- */

// Keep in step with `--breakpoint-sm` (theme.css): the second month is
// `max-sm:hidden`, and the keyboard must agree with what is drawn.
const WIDE_QUERY = `(min-width: ${breakpoint.sm}px)`;

function useWide(): boolean {
  // Wide until measured, so the server render and the first client render agree.
  const [wide, setWide] = React.useState(true);
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia(WIDE_QUERY);
    const update = () => setWide(mql.matches);
    update();
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, []);
  return wide;
}

/* ---- glyphs ---------------------------------------------------------------- */

/** Phosphor 2.1.1 `caret-left` / `caret-right` bold (Calendar's). */
const CHEVRON = {
  prev: 'M168.49,199.51a12,12,0,0,1-17,17l-80-80a12,12,0,0,1,0-17l80-80a12,12,0,0,1,17,17L97,128Z',
  next: 'M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z',
} as const;

/* ---- recipes --------------------------------------------------------------- */

export const rangeCalendarVariants = cva('relative w-max max-w-full font-sans text-content');

/** One month column: Calendar's 280px (320px on touch, 44px days). */
const monthClass = 'w-(--calendar-width) max-w-full pointer-coarse:w-(--calendar-width-coarse)';

export const rangeCalendarDayVariants = cva([
  'relative grid aspect-square w-full place-content-center rounded-md border-0 bg-transparent p-0',
  'font-sans text-sm leading-flat font-regular text-content tabular-nums',
  'cursor-pointer transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',
  'enabled:hover:bg-surface-hover',
  // Today: Calendar's 1px brand ring.
  'aria-[current=date]:ring aria-[current=date]:ring-border-brand aria-[current=date]:ring-inset',
  // On the band: brand ink, so the run of days reads as one thing.
  'data-[in-range]:text-content-brand data-[in-range]:enabled:hover:bg-surface-brand-subtle',
  // The day the pointer would end on: a dashed brand edge.
  'data-[preview-end]:border data-[preview-end]:border-dashed data-[preview-end]:border-border-brand',
  // Start and end: Calendar's chosen day, the solid brand fill.
  'aria-pressed:bg-action-primary aria-pressed:font-bold aria-pressed:text-action-primary-fg',
  'aria-pressed:enabled:hover:bg-action-primary-hover',
  'disabled:cursor-not-allowed disabled:bg-transparent disabled:text-content-disabled',
  'outline-none focus-visible:outline-focus focus-visible:outline-offset-focus-tight focus-visible:outline-solid focus-visible:outline-border-focus',
]);

/* ---- component ------------------------------------------------------------- */

/** String union, so a Storyblok option value can be passed straight in. */
export type RangeCalendarMonths = 1 | 2;

export type RangeCalendarProps = Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'defaultValue' | 'onSelect' | 'onChange'
> & {
  /** The range (controlled). `{ from: '', to: '' }` for none; `to: ''` while the end is being chosen. */
  value?: DateRange;
  /**
   * The initial range (uncontrolled).
   *
   * @default { from: '', to: '' }
   */
  defaultValue?: DateRange;
  /** Called on every pick with the new range, including a start without an end yet. */
  onValueChange?: (range: DateRange) => void;
  /** Called when a pick completes a range (both ends chosen). A DateRangePicker closes on it. */
  onRangeSelect?: (range: DateRange) => void;
  /** The first month on screen, `YYYY-MM` (controlled). */
  month?: string;
  /** The first month on screen, `YYYY-MM` (uncontrolled). Defaults to the start's month, else today's. */
  defaultMonth?: string;
  /** Called with the new first `YYYY-MM` when the page turns. */
  onMonthChange?: (month: string) => void;
  /**
   * Months side by side: `2` shows two from `sm` (672px) and one on phones.
   *
   * @default 2
   */
  numberOfMonths?: RangeCalendarMonths;
  /** The earliest date that can be chosen, ISO. */
  min?: string;
  /** The latest date that can be chosen, ISO. */
  max?: string;
  /** Dates that cannot be chosen as a start or an end, ISO. A range may still span them. */
  disabledDates?: string[];
  /** Weekdays that cannot be chosen: 0 Sunday … 6 Saturday. A range may still span them. */
  disabledDaysOfWeek?: number[];
  /** Any other rule: return `true` to disable the date. */
  isDateDisabled?: (date: string) => boolean;
  /** Extra words for a day's accessible name, after the date and its range role. */
  getDateDescription?: (date: string) => string | undefined;
  /**
   * The shortest range, in nights (`to` − `from`). While the end is being
   * chosen, days closer to the start are unavailable. `0` allows a one-day range.
   *
   * @default 0
   */
  minNights?: number;
  /** The longest range, in nights. While the end is being chosen, days further out are unavailable. */
  maxNights?: number;
  /**
   * The first column.
   *
   * @default 'sunday'
   */
  weekStartsOn?: CalendarWeekStart;
  /** Today, ISO. Defaults to the viewer's local date; pass it to pin a story, a test or a server render. */
  today?: string;
  /**
   * The locale for month, weekday and day names.
   *
   * @default 'en-IN'
   */
  locale?: string;
  /**
   * Draw the adjacent months' days (muted, disabled). Off by default: with
   * two months side by side they would repeat.
   *
   * @default false
   */
  showOutsideDays?: boolean;
  /**
   * Move focus to the active day when the calendar mounts (the DateRangePicker sets it).
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
  /** Under the grids, after a divider: preset chips, a note, an action. */
  footer?: React.ReactNode;
};

type Day = { iso: string; outside: 'previous' | 'next' | null; col: number };

export const RangeCalendar = React.forwardRef<HTMLDivElement, RangeCalendarProps>(function RangeCalendar(
  {
    className,
    value: valueProp,
    defaultValue = EMPTY_RANGE,
    onValueChange,
    onRangeSelect,
    month: monthProp,
    defaultMonth,
    onMonthChange,
    numberOfMonths = 2,
    min,
    max,
    disabledDates,
    disabledDaysOfWeek,
    isDateDisabled,
    getDateDescription,
    minNights = 0,
    maxNights,
    weekStartsOn = 'sunday',
    today: todayProp,
    locale = 'en-IN',
    showOutsideDays = false,
    autoFocus = false,
    previousMonthLabel = 'Previous month',
    nextMonthLabel = 'Next month',
    footer,
    onMouseLeave,
    ...props
  },
  ref,
) {
  const [valueState, setValue] = useControllableState<DateRange>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange,
    caller: 'RangeCalendar',
  });
  const { from, to } = normalizeDateRange(valueState);
  const choosingEnd = from !== '' && to === '';

  React.useEffect(() => {
    ensureAnnouncer();
  }, []);

  const [today] = React.useState(() => (parts(todayProp) ? (todayProp as string) : localToday()));
  const todayIso = parts(todayProp) ? (todayProp as string) : today;

  const [month, setMonth] = useControllableState<string>({
    prop: monthProp,
    defaultProp: defaultMonth ?? monthOf(from || todayIso),
    onChange: onMonthChange,
    caller: 'RangeCalendar',
  });
  const visible = /^\d{4}-\d{2}$/.test(month ?? '') ? (month as string) : monthOf(todayIso);

  const wide = useWide();
  const drawn = numberOfMonths === 2 ? 2 : 1;
  const shown = drawn === 2 && wide ? 2 : 1;
  const months = Array.from({ length: drawn }, (_, i) => monthOf(addMonths(firstOf(visible), i)));
  const lastShown = months[shown - 1] ?? visible;
  const onScreen = (iso: string) => monthOf(iso) >= visible && monthOf(iso) <= lastShown;

  const disabledSet = React.useMemo(() => new Set(disabledDates ?? []), [disabledDates]);
  const isRuleDisabled = (iso: string) =>
    (min != null && iso < min) ||
    (max != null && iso > max) ||
    disabledSet.has(iso) ||
    (disabledDaysOfWeek?.includes(weekday(iso)) ?? false) ||
    (isDateDisabled?.(iso) ?? false);
  // While the end is being chosen: too short or too long from the start.
  const isLengthBlocked = (iso: string) => {
    if (!choosingEnd || iso <= from) return false;
    const nights = daysBetween(from, iso);
    return nights < minNights || (maxNights != null && nights > maxNights);
  };
  const isDisabled = (iso: string) => isRuleDisabled(iso) || isLengthBlocked(iso);

  /* ---- roving focus ------------------------------------------------------ */

  const firstEnabledIn = (m: string): string | null => {
    const [y, mo] = m.split('-').map(Number) as [number, number];
    for (let d = 1; d <= daysIn(y, mo); d += 1) {
      const iso = `${m}-${pad(d)}`;
      if (!isDisabled(iso)) return iso;
    }
    return null;
  };
  const pickActive = (): string => {
    if (from && onScreen(from) && !isDisabled(from)) return from;
    if (onScreen(todayIso) && !isDisabled(todayIso)) return todayIso;
    return firstEnabledIn(visible) ?? firstOf(visible);
  };
  const [focusedState, setFocused] = React.useState<string>(() => pickActive());
  const focused = onScreen(focusedState) ? focusedState : pickActive();

  const rootRef = React.useRef<HTMLDivElement>(null);
  const wantFocus = React.useRef(autoFocus);
  React.useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    rootRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
  });
  const setRootRef = useComposedRefs(ref, rootRef);

  const [hovered, setHovered] = React.useState<string | null>(null);
  const previewEnd = choosingEnd && hovered && hovered > from && !isDisabled(hovered) ? hovered : null;

  const baseId = useId();
  const weekStart = weekStartsOn === 'monday' ? 1 : 0;

  const turnTo = (m: string) => {
    if (m !== visible) setMonth(m);
  };
  const minMonth = min ? monthOf(min) : null;
  const maxMonth = max ? monthOf(max) : null;
  const prevMonth = monthOf(addMonths(firstOf(visible), -1));
  const nextMonth = monthOf(addMonths(firstOf(visible), 1));

  const moveTo = (target: string, step: number) => {
    let iso = target;
    if (min != null && iso < min) iso = min;
    if (max != null && iso > max) iso = max;
    for (let i = 0; i < 400 && isDisabled(iso); i += 1) {
      const next = addDays(iso, step);
      if ((min != null && next < min) || (max != null && next > max)) return;
      iso = next;
    }
    if (isDisabled(iso)) return;
    wantFocus.current = true;
    setFocused(iso);
    if (choosingEnd) setHovered(iso);
    const m = monthOf(iso);
    if (m < visible) turnTo(m);
    else if (m > lastShown) turnTo(monthOf(addMonths(firstOf(m), -(shown - 1))));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
    const at = focused;
    let target: string | null = null;
    let step = 1;
    switch (event.key) {
      case 'ArrowLeft':
        target = addDays(at, -1);
        step = -1;
        break;
      case 'ArrowRight':
        target = addDays(at, 1);
        break;
      case 'ArrowUp':
        target = addDays(at, -7);
        step = -1;
        break;
      case 'ArrowDown':
        target = addDays(at, 7);
        break;
      case 'PageUp':
        target = event.shiftKey ? addMonths(at, -12) : addMonths(at, -1);
        break;
      case 'PageDown':
        target = event.shiftKey ? addMonths(at, 12) : addMonths(at, 1);
        break;
      case 'Home':
        target = addDays(at, -((weekday(at) - weekStart + 7) % 7));
        break;
      case 'End':
        target = addDays(at, 6 - ((weekday(at) - weekStart + 7) % 7));
        step = -1;
        break;
      default:
        return;
    }
    event.preventDefault();
    moveTo(target, step);
  };

  const long = fmt(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  const choose = (iso: string) => {
    setFocused(iso);
    if (!choosingEnd || iso < from) {
      // A first press, a press after a complete range, or before the start: a new start.
      setValue({ from: iso, to: '' });
      setHovered(null);
      announce(`Start date ${long.format(isoDate(iso))}. Now choose the end date.`);
      return;
    }
    if (iso === from && minNights > 0) return;
    const range = { from, to: iso };
    setValue(range);
    setHovered(null);
    announce(`${long.format(isoDate(from))} to ${long.format(isoDate(iso))} selected.`);
    onRangeSelect?.(range);
  };

  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const date = utc(2023, 1, 1 + ((weekStart + i) % 7));
    return {
      short: fmt(locale, { weekday: 'narrow' }).format(date),
      long: fmt(locale, { weekday: 'long' }).format(date),
    };
  });

  const monthTitle = fmt(locale, { month: 'long', year: 'numeric' });

  const renderMonth = (m: string, index: number) => {
    const titleId = `${baseId}-title-${index}`;
    const first = firstOf(m);
    const lead = (weekday(first) - weekStart + 7) % 7;
    const [vy, vm] = m.split('-').map(Number) as [number, number];
    const count = daysIn(vy, vm);
    const cells: Day[] = [];
    for (let i = lead; i > 0; i -= 1) cells.push({ iso: addDays(first, -i), outside: 'previous', col: 0 });
    for (let d = 1; d <= count; d += 1) cells.push({ iso: `${m}-${pad(d)}`, outside: null, col: 0 });
    const last = `${m}-${pad(count)}`;
    for (let i = 1; cells.length % 7 !== 0; i += 1) cells.push({ iso: addDays(last, i), outside: 'next', col: 0 });
    cells.forEach((cell, i) => {
      cell.col = i % 7;
    });
    const weeks: Day[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    // The band's reach: the chosen range, else the preview.
    const bandEnd = to || previewEnd || '';
    const previewing = !to && previewEnd != null;

    return (
      <div
        key={m}
        data-slot="range-calendar-month"
        data-month={m}
        className={cn(monthClass, index > 0 && 'max-sm:hidden')}
      >
        <div data-slot="range-calendar-head" className="mb-2 flex h-8 items-center justify-center">
          <span
            id={titleId}
            data-slot="range-calendar-title"
            aria-live={index === 0 ? 'polite' : undefined}
            className={cn(headingVariants({ size: '3' }), 'text-content')}
          >
            {monthTitle.format(isoDate(first))}
          </span>
        </div>
        <div className="-my-0.5">
          <table
            role="grid"
            aria-labelledby={titleId}
            data-slot="range-calendar-grid"
            className="w-full table-fixed border-separate border-spacing-x-0 border-spacing-y-0.5"
            onKeyDown={onKeyDown}
          >
            <thead>
              <tr>
                {weekdays.map((day) => (
                  <th
                    key={day.long}
                    scope="col"
                    abbr={day.long}
                    data-slot="range-calendar-weekday"
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
                <tr key={week[0]?.iso} data-slot="range-calendar-week">
                  {week.map(({ iso, outside, col }) => {
                    if (outside && !showOutsideDays) return <td key={iso} role="gridcell" className="p-0" />;
                    const off = outside != null || isDisabled(iso);
                    const isToday = iso === todayIso;
                    const inMonth = !outside;
                    const isStart = inMonth && iso === from;
                    const isEnd = inMonth && to !== '' && iso === to;
                    const between = inMonth && from !== '' && bandEnd !== '' && iso > from && iso < bandEnd;
                    const isPreviewEnd = inMonth && previewing && iso === previewEnd;
                    const inRange = !previewing && between;
                    const inPreview = previewing && (between || isPreviewEnd);

                    // The band: from the start's centre to the end's centre,
                    // capped at the week's and the month's edges.
                    const rowStart = col === 0 || iso.endsWith('-01');
                    const rowEnd = col === 6 || iso === last;
                    const spans = bandEnd !== '' && bandEnd > from;
                    let band: string | null = null;
                    if (inMonth && spans) {
                      if (isStart && !rowEnd) band = 'start-1/2 end-0';
                      else if ((isEnd || isPreviewEnd) && !rowStart) band = 'start-0 end-1/2';
                      else if (between) band = 'inset-x-0';
                    }

                    const description = getDateDescription?.(iso);
                    const role =
                      isStart && isEnd
                        ? 'start and end date'
                        : isStart
                          ? 'start date'
                          : isEnd
                            ? 'end date'
                            : inRange
                              ? 'in range'
                              : null;
                    const label = [
                      long.format(isoDate(iso)),
                      isToday ? 'today' : null,
                      inMonth ? role : null,
                      outside ? `${outside} month` : description || null,
                    ]
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <td key={iso} role="gridcell" className="relative p-0">
                        {band ? (
                          <span
                            aria-hidden="true"
                            data-slot="range-calendar-band"
                            data-preview={previewing ? '' : undefined}
                            className={cn(
                              'pointer-events-none absolute inset-y-0',
                              band,
                              previewing
                                ? 'border-y border-dashed border-border-brand'
                                : 'bg-surface-brand-subtle',
                              rowStart && !isStart && 'rounded-s-md',
                              rowStart && !isStart && previewing && 'border-s',
                              rowEnd && !isEnd && !isPreviewEnd && 'rounded-e-md',
                              rowEnd && !isEnd && !isPreviewEnd && previewing && 'border-e',
                            )}
                          />
                        ) : null}
                        <button
                          type="button"
                          data-slot="range-calendar-day"
                          data-date={iso}
                          data-outside={outside ? '' : undefined}
                          data-today={isToday ? '' : undefined}
                          data-range-start={isStart ? '' : undefined}
                          data-range-end={isEnd ? '' : undefined}
                          data-in-range={inRange ? '' : undefined}
                          data-preview={inPreview ? '' : undefined}
                          data-preview-end={isPreviewEnd ? '' : undefined}
                          disabled={off}
                          tabIndex={!off && iso === focused ? 0 : -1}
                          aria-pressed={off ? undefined : isStart || isEnd}
                          aria-current={isToday && inMonth ? 'date' : undefined}
                          aria-label={label}
                          className={rangeCalendarDayVariants()}
                          onClick={() => choose(iso)}
                          onFocus={() => {
                            setFocused(iso);
                            if (choosingEnd) setHovered(iso);
                          }}
                          onMouseEnter={() => {
                            if (choosingEnd) setHovered(iso);
                          }}
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
      </div>
    );
  };

  return (
    <div
      ref={setRootRef}
      data-slot="range-calendar"
      data-months={drawn}
      data-choosing={choosingEnd ? 'end' : 'start'}
      className={cn(rangeCalendarVariants(), className)}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        setHovered(null);
      }}
      {...props}
    >
      <IconButton
        variant="tertiary"
        size="sm"
        aria-label={previousMonthLabel}
        data-slot="range-calendar-previous"
        className="absolute start-0 top-0 z-lift"
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
      <IconButton
        variant="tertiary"
        size="sm"
        aria-label={nextMonthLabel}
        data-slot="range-calendar-next"
        className="absolute end-0 top-0 z-lift"
        disabled={maxMonth != null && lastShown >= maxMonth}
        onClick={() => {
          setFocused(addMonths(focused, 1));
          turnTo(nextMonth);
        }}
      >
        <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
          <path d={CHEVRON.next} />
        </svg>
      </IconButton>
      <div data-slot="range-calendar-months" className="flex gap-6">
        {months.map(renderMonth)}
      </div>
      {footer != null ? (
        <>
          <Divider className="my-4" />
          <div data-slot="range-calendar-footer" className="flex flex-wrap items-center gap-2">
            {footer}
          </div>
        </>
      ) : null}
    </div>
  );
});
RangeCalendar.displayName = 'RangeCalendar';
