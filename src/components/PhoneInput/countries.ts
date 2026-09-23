/* ---------------------------------------------------------------------------
 * PhoneInput country table + pure formatting helpers. No React, no directive.
 *
 * The table is the preview's (IN, US, AE, SG, GB, AU), carried as data so an
 * app can pass its own list through `countries` without forking the atom. Move
 * to `libphonenumber-js/min` only if the list outgrows a mask table.
 * ------------------------------------------------------------------------- */

export type PhoneCountry = {
  /** ISO 3166-1 alpha-2, upper case. Also the Select value and the ISO-chip text. */
  iso: string;
  /** The country in words: the option label, type-ahead text and accessible name. */
  name: string;
  /** Dial code with its plus: `'+91'`. */
  dial: string;
  /** National number mask; `#` is a digit, anything else is inserted as typed. */
  mask: string;
  /** Maximum national digits. Extra digits are dropped. */
  max: number;
  /** A formatted example, used as the placeholder. */
  example: string;
};

/** India: the default country, and the fallback for an empty `countries`. */
export const INDIA: PhoneCountry = {
  iso: 'IN',
  name: 'India',
  dial: '+91',
  mask: '##### #####',
  max: 10,
  example: '98450 21174',
};

export const phoneCountries: readonly PhoneCountry[] = [
  INDIA,
  { iso: 'US', name: 'United States', dial: '+1', mask: '(###) ###-####', max: 10, example: '(415) 555-0132' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '+971', mask: '## ### ####', max: 9, example: '50 123 4567' },
  { iso: 'SG', name: 'Singapore', dial: '+65', mask: '#### ####', max: 8, example: '9123 4567' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44', mask: '#### ######', max: 10, example: '7700 900461' },
  { iso: 'AU', name: 'Australia', dial: '+61', mask: '### ### ###', max: 9, example: '412 345 678' },
];

export const digitsOnly = (s: string | null | undefined): string => (s || '').replace(/\D/g, '');

/**
 * Progressive masking: fill the `#` slots left to right and stop the moment
 * the digits run out, so "4" is "(4", not "(4  )    -    ". Digits past the
 * mask are appended rather than dropped.
 */
export function applyMask(digits: string, mask: string): string {
  if (!mask) return digits;
  let out = '';
  let i = 0;
  for (let k = 0; k < mask.length && i < digits.length; k += 1) {
    const c = mask.charAt(k);
    out += c === '#' ? digits.charAt(i++) : c;
  }
  return i < digits.length ? out + digits.slice(i) : out;
}

/** The string offset just after the n-th digit (so the caret stays on its digit). */
export function caretAfterNDigits(str: string, n: number): number {
  if (n <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < str.length; i += 1) {
    if (/\d/.test(str.charAt(i))) {
      seen += 1;
      if (seen === n) return i + 1;
    }
  }
  return str.length;
}

/** Regional-indicator pair for an ISO code: 'IN' -> 🇮🇳. */
export function flagEmoji(iso: string): string {
  const up = iso.toUpperCase();
  if (!/^[A-Z]{2}$/.test(up)) return '';
  return String.fromCodePoint(...Array.from(up, (c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/**
 * The country whose dial code prefixes `digits`. Longest dial code wins (so
 * +971 is not read as +9...), and `preferIso` wins a tie between countries
 * sharing a code.
 */
export function matchDial(
  digits: string,
  countries: readonly PhoneCountry[],
  preferIso?: string,
): PhoneCountry | undefined {
  let best: PhoneCountry | undefined;
  for (const c of countries) {
    const d = digitsOnly(c.dial);
    if (!d || !digits.startsWith(d)) continue;
    const bestLen = best ? digitsOnly(best.dial).length : -1;
    if (d.length > bestLen || (d.length === bestLen && c.iso === preferIso)) best = c;
  }
  return best;
}

/** E.164 (`+919845021174`) -> country + national digits. */
export function parseE164(
  value: string | null | undefined,
  countries: readonly PhoneCountry[],
  preferIso?: string,
): { country: PhoneCountry; national: string } | null {
  const digits = digitsOnly(value);
  if (!digits) return null;
  const country = matchDial(digits, countries, preferIso);
  if (!country) return null;
  return { country, national: digits.slice(digitsOnly(country.dial).length).slice(0, country.max) };
}

export function toE164(country: PhoneCountry, national: string): string {
  return national ? `+${digitsOnly(country.dial)}${national}` : '';
}
