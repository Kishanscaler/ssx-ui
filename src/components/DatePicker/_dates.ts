/* ---------------------------------------------------------------------------
 * Date helpers shared by Calendar (one date) and RangeCalendar (a range).
 *
 * ISO `YYYY-MM-DD` strings throughout, the value DateInput carries. No date
 * library: the arithmetic is UTC day numbers, and the words come from
 * `Intl.DateTimeFormat` (cached per locale and options). Pure functions, no
 * React, so this module needs no directive. Not exported from the package.
 * ------------------------------------------------------------------------- */

export const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** `[year, month, day]` of a real ISO date, else `null`. */
export function parts(iso: string | null | undefined): [number, number, number] | null {
  const m = ISO.exec(iso ?? '');
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > daysIn(y, mo)) return null;
  return [y, mo, d];
}

export const toIso = (date: Date) =>
  `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
export const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

export function addDays(iso: string, n: number): string {
  const p = parts(iso)!;
  return toIso(utc(p[0], p[1], p[2] + n));
}

export function addMonths(iso: string, n: number): string {
  const [y, m, d] = parts(iso)!;
  const first = utc(y, m + n, 1);
  const ny = first.getUTCFullYear();
  const nm = first.getUTCMonth() + 1;
  return toIso(utc(ny, nm, Math.min(d, daysIn(ny, nm))));
}

/** 0 Sunday … 6 Saturday. */
export const weekday = (iso: string) => {
  const [y, m, d] = parts(iso)!;
  return utc(y, m, d).getUTCDay();
};
export const monthOf = (iso: string) => iso.slice(0, 7);
export const firstOf = (month: string) => `${month}-01`;

/** Whole days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: string, b: string): number {
  return Math.round((isoDate(b).getTime() - isoDate(a).getTime()) / 86400000);
}

/** Today in the viewer's time zone, as ISO. */
export function localToday(): string {
  const now = new Date();
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const formatters = new Map<string, Intl.DateTimeFormat>();
/** A cached formatter, always in UTC (the dates are UTC day numbers). */
export function fmt(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
    formatters.set(key, f);
  }
  return f;
}

export const isoDate = (iso: string) => {
  const [y, m, d] = parts(iso)!;
  return utc(y, m, d);
};
