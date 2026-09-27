/* ---------------------------------------------------------------------------
 * URL allowlist and entity decoding (pure, no React)
 *
 * Markdown from a model or a user is untrusted. Nothing it contains becomes
 * markup: raw HTML renders as text, and a URL reaches an `href` / `src` only
 * when its scheme is on the allowlist below. Everything else renders as the
 * link's text (or the image's alt text).
 * ------------------------------------------------------------------------- */

/** Schemes a link may use. Relative URLs, `#fragment`s and `?query`s have none and are allowed. */
const LINK_SCHEMES = ['http', 'https', 'mailto', 'tel'];
/** Schemes an image may load from. No `data:`, no `blob:`. */
const IMAGE_SCHEMES = ['http', 'https'];

export type SafeUrl = {
  /** The URL to put in the attribute (entities decoded, trimmed). */
  url: string;
  /** Leaves this origin: `http(s)://…` or protocol-relative `//host`. */
  external: boolean;
};

function check(raw: string | null | undefined, schemes: string[]): SafeUrl | null {
  if (raw == null) return null;
  const url = decodeEntities(raw).trim();
  if (url === '') return null;
  // What a browser would read as the scheme. The URL parser drops ASCII tab
  // and newline anywhere and C0 controls and spaces at the ends, so
  // `java\tscript:` IS `javascript:`; strip them before looking.
  const probe = url.replace(/[\u0000- \u007f-\u009f]/g, '');
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(probe);
  if (scheme) {
    const name = (scheme[1] ?? '').toLowerCase();
    if (!schemes.includes(name)) return null;
    return { url, external: name === 'http' || name === 'https' };
  }
  // No scheme: relative, root-relative, `#x`, `?q`, or protocol-relative `//host`.
  // A backslash start (`/\host`) is treated by browsers as `//host`.
  return { url, external: /^[/\\]{2}/.test(probe) };
}

/** A link destination, or `null` when it must not be a link. */
export const safeLinkUrl = (raw: string | null | undefined) => check(raw, LINK_SCHEMES);

/** An image source, or `null` when the image must fall back to its alt text. */
export const safeImageUrl = (raw: string | null | undefined) => {
  const safe = check(raw, IMAGE_SCHEMES);
  // An image needs a resource: `#x` or `?q` alone is not one.
  return safe && !/^[#?]/.test(safe.url) ? safe : null;
};

/* ---- entities ------------------------------------------------------------- */

/**
 * The named entities an author (or a model) actually types. `marked`'s lexer
 * leaves `&amp;` as written, because its renderer emits HTML; we emit text,
 * so we decode. An unknown name stays as typed, which is what a browser does
 * with an unknown entity too.
 */
const NAMED: Partial<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  shy: '­',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  minus: '−',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  laquo: '«',
  raquo: '»',
  bull: '•',
  middot: '·',
  times: '×',
  divide: '÷',
  plusmn: '±',
  deg: '°',
  micro: 'µ',
  para: '¶',
  sect: '§',
  cent: '¢',
  pound: '£',
  euro: '€',
  yen: '¥',
  larr: '←',
  rarr: '→',
  uarr: '↑',
  darr: '↓',
  harr: '↔',
  lArr: '⇐',
  rArr: '⇒',
  le: '≤',
  ge: '≥',
  ne: '≠',
  asymp: '≈',
  infin: '∞',
  sum: '∑',
  radic: '√',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  sup2: '²',
  sup3: '³',
  check: '✓',
  cross: '✗',
};

const ENTITY = /&(#[0-9]{1,7}|#[xX][0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});/g;

function codePoint(n: number): string {
  // CommonMark: 0, surrogates and anything past U+10FFFF become U+FFFD.
  if (!Number.isFinite(n) || n === 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) return '�';
  return String.fromCodePoint(n);
}

export function decodeEntities(text: string): string {
  if (!text.includes('&')) return text;
  return text.replace(ENTITY, (whole, body: string) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X';
      return codePoint(parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10));
    }
    // Own keys only: `&constructor;` must not reach Object.prototype.
    return Object.prototype.hasOwnProperty.call(NAMED, body) ? (NAMED[body] ?? whole) : whole;
  });
}
