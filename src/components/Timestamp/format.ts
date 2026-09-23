/* ---------------------------------------------------------------------------
 * Timestamp formatting: pure functions, no directive, so a Server Component
 * (or a CSV export) can print exactly what <Timestamp> prints.
 * ------------------------------------------------------------------------- */

/** A `Date`, epoch milliseconds, or an ISO string (give it an offset). */
export type TimestampValue = Date | number | string;

const SHORT_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function toDate(value: TimestampValue): Date {
  return value instanceof Date ? value : new Date(value);
}

/** The date's calendar parts in a zone. */
function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
  };
}

export type FormatTimestampOptions = {
  /** @default 'en-IN' */
  locale?: string;
  /** @default 'Asia/Kolkata' */
  timeZone?: string;
};

/** "4 Mar 2026, 11:42 PM" (`withTime`) or "4 Mar 2026". */
export function formatAbsolute(
  value: TimestampValue,
  withTime = true,
  { locale = 'en-IN', timeZone = 'Asia/Kolkata' }: FormatTimestampOptions = {},
): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  if (!/^en\b/i.test(locale)) {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    }).format(date);
  }
  const p = zonedParts(date, timeZone);
  const day = `${p.day} ${SHORT_MONTH[p.month - 1]} ${p.year}`;
  if (!withTime) return day;
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  const period = p.hour < 12 ? 'AM' : 'PM';
  return `${day}, ${h12}:${String(p.minute).padStart(2, '0')} ${period}`;
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "2 hours ago", "yesterday", "in 6 hours", "now". */
export function formatRelative(
  value: TimestampValue,
  now: TimestampValue = Date.now(),
  { locale = 'en-IN' }: Pick<FormatTimestampOptions, 'locale'> = {},
): string {
  const date = toDate(value);
  const ref = toDate(now);
  if (Number.isNaN(date.getTime()) || Number.isNaN(ref.getTime())) return '';
  const seconds = (date.getTime() - ref.getTime()) / 1000;
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (abs < 45) return rtf.format(0, 'second');
  for (const [unit, size] of UNITS) {
    // Round into the unit once it is ~90% of one (45 min -> "1 hour").
    if (abs >= size * 0.9 || unit === 'minute') {
      return rtf.format(Math.round(seconds / size) || Math.sign(seconds), unit);
    }
  }
  return rtf.format(0, 'second');
}

/** An ISO `dateTime` value: the string as given, or the date (in `timeZone`) for `date`. */
export function machineValue(value: TimestampValue, dateOnly: boolean, timeZone: string): string {
  if (typeof value === 'string') return value;
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  if (!dateOnly) return date.toISOString();
  const p = zonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** How long until the relative text can next change, or null to stop ticking. */
export function nextTick(value: TimestampValue, now: number): number | null {
  const abs = Math.abs(toDate(value).getTime() - now);
  if (abs < 3600 * 1000) return 30 * 1000;
  if (abs < 24 * 3600 * 1000) return 60 * 1000;
  return null;
}

