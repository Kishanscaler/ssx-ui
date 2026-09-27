/* ---------------------------------------------------------------------------
 * Chat time helpers: pure functions, no directive, so the server and the
 * client print the same words (a fixed zone, no reader clock unless `now` is
 * passed).
 * ------------------------------------------------------------------------- */

import { formatAbsolute, type TimestampValue } from '../Timestamp';

const toDate = (value: TimestampValue) => (value instanceof Date ? value : new Date(value));

export type ChatTimeOptions = {
  /** @default 'en-IN' */
  locale?: string;
  /** @default 'Asia/Kolkata' */
  timeZone?: string;
};

/** The clock time alone: "11:42 PM" (English locales, fixed shape), else the locale's own. */
export function formatClockTime(
  value: TimestampValue,
  { locale = 'en-IN', timeZone = 'Asia/Kolkata' }: ChatTimeOptions = {},
): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  if (!/^en\b/i.test(locale)) {
    return new Intl.DateTimeFormat(locale, { timeZone, hour: 'numeric', minute: '2-digit' }).format(date);
  }
  // Timestamp's own English shape ("4 Mar 2026, 11:42 PM"), so the two agree
  // on AM/PM case and spacing whatever the ICU version.
  const absolute = formatAbsolute(date, true, { locale, timeZone });
  const comma = absolute.lastIndexOf(', ');
  return comma === -1 ? absolute : absolute.slice(comma + 2);
}

/** The calendar day in a zone, as `YYYY-MM-DD`; '' for an invalid date. */
export function dayKey(value: TimestampValue, timeZone = 'Asia/Kolkata'): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Whole days from `b` to `a`, by calendar day in the zone (so 11 PM to 1 AM is 1). */
function dayDiff(a: string, b: string): number {
  const toUtc = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
  };
  return Math.round((toUtc(a) - toUtc(b)) / 86400000);
}

export type ChatDayLabelOptions = ChatTimeOptions & {
  /** "Now" for Today / Yesterday. Without it, every day prints its date. */
  now?: TimestampValue;
  /** @default 'Today' */
  todayLabel?: string;
  /** @default 'Yesterday' */
  yesterdayLabel?: string;
};

/**
 * "Today", "Yesterday" (only when `now` is given, so a server render cannot
 * disagree with the reader's clock), else the date: "4 Mar 2026".
 */
export function formatChatDay(
  value: TimestampValue,
  {
    locale = 'en-IN',
    timeZone = 'Asia/Kolkata',
    now,
    todayLabel = 'Today',
    yesterdayLabel = 'Yesterday',
  }: ChatDayLabelOptions = {},
): string {
  if (now !== undefined) {
    const diff = dayDiff(dayKey(now, timeZone), dayKey(value, timeZone));
    if (diff === 0) return todayLabel;
    if (diff === 1) return yesterdayLabel;
  }
  return formatAbsolute(value, false, { locale, timeZone });
}
