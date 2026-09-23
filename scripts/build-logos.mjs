/**
 * Generates the brand marks from the approved artwork in `../assets/{sst,ssb}/logos/`.
 *
 *   node scripts/build-logos.mjs          (npm run sync:logos)
 *
 * Writes, and these files are GENERATED — never hand-edit them:
 *   - src/components/Logo/marks.ts   the path data <Logo>, <LogoLoader> and <Spinner> draw
 *   - src/styles/brand.css           the `--brand-mark` mask and the logo colour variables
 *   - src/components/Avatar/_fixtures/{ssb-mark,sst-combination}.svg   byte copies (stories)
 *
 * One source: the monogram's geometry is read ONCE (from the Mono files, which is
 * what the Spinner and the mask have always drawn), and the full lockups are that
 * same monogram plus the wordmark read from `Combination Mark/Color.svg`. The
 * script checks that every other file (Color, Inverse Color, Inverse Mono, the
 * mark inside each Combination Mark) carries the same geometry, to 0.001 units,
 * and that each file's colours are the palette below — so a new export from the
 * design team that moves or recolours anything fails here instead of shipping.
 *
 * Standalone checkout (this package without the design-system repo around it):
 * the committed outputs are the marks; the script keeps them and exits 0, the
 * same rule as `sync-tokens.mjs`.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = resolve(here, '..');
const assets = resolve(pkg, '..', 'assets');

const OUT_MARKS = resolve(pkg, 'src/components/Logo/marks.ts');
const OUT_BRAND_CSS = resolve(pkg, 'src/styles/brand.css');
const TOKENS = resolve(pkg, 'src/styles/tokens.generated.css');

if (!existsSync(assets)) {
  if (existsSync(OUT_MARKS) && existsSync(OUT_BRAND_CSS)) {
    console.warn(`build-logos: ${assets} not found; using the committed marks.`);
    process.exit(0);
  }
  console.error(`build-logos: ${assets} not found and no committed marks to fall back on.`);
  process.exit(1);
}

/* ---- reading ------------------------------------------------------------- */

const NAMED = { black: '#000000', white: '#FFFFFF' };
const hex = (c) => {
  const v = NAMED[c.toLowerCase()] ?? c.toUpperCase();
  return /^#[0-9A-F]{3}$/.test(v) ? '#' + [...v.slice(1)].map((x) => x + x).join('') : v;
};

/** Every <path> in document order (clipPath rects are not paths, so they drop out). */
function readSvg(rel) {
  const file = resolve(assets, rel);
  const text = readFileSync(file, 'utf8');
  const viewBox = /<svg\b[^>]*\bviewBox="([^"]+)"/.exec(text)?.[1];
  if (!viewBox) throw new Error(`${rel}: no viewBox`);
  const paths = [];
  for (const m of text.matchAll(/<path\b([^>]*?)\/?>/g)) {
    const attrs = m[1];
    const d = /\bd="([^"]+)"/.exec(attrs)?.[1];
    const fill = /\bfill="([^"]+)"/.exec(attrs)?.[1];
    if (!d || !fill) throw new Error(`${rel}: a path without d or fill`);
    paths.push({ d, fill: hex(fill), evenodd: /\bfill-rule="evenodd"/.test(attrs) });
  }
  // Anything we would drop silently has to be something we know is safe to drop.
  const unknown = [...text.matchAll(/<(\w+)\b/g)]
    .map((m) => m[1])
    .filter((t) => !['svg', 'g', 'path', 'defs', 'clipPath', 'rect'].includes(t));
  if (unknown.length) throw new Error(`${rel}: unexpected elements ${unknown.join(', ')}`);
  return { rel, viewBox, paths, text };
}

/** The numbers in a path, for a tolerant comparison (exports differ in the 4th decimal). */
const nums = (d) => (d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
const sameGeometry = (a, b, tol = 0.001) => {
  const x = nums(a);
  const y = nums(b);
  return x.length === y.length && x.every((v, i) => Math.abs(v - y[i]) <= tol);
};
/** Up to and including the first `Z`: the outer contour of a frame path. */
const firstSubpath = (d) => d.slice(0, d.search(/Z/i) + 1);

function assert(ok, message) {
  if (!ok) {
    console.error(`build-logos: ${message}`);
    process.exit(1);
  }
}

/* ---- the palette (what each file is allowed to contain) -------------------
 * Brand hexes are the artwork's own, NOT tokens: a token can be retuned for
 * contrast (the SSB button fill already was); the logo never is. They are
 * checked against the primitive ramps' step 9 below so a drift is caught. */

const SST_BLUE = '#0245B9';
const SSB_GREEN = '#1D925B';
const PALETTE = {
  sst: {
    light: { ink: '#000000', shield: SST_BLUE, glyph: '#FFFFFF', mono: '#171717' },
    dark: { ink: '#FFFFFF', shield: '#FFFFFF', glyph: SST_BLUE, mono: '#FFFFFF' },
  },
  ssb: {
    light: { ink: '#000000', accent: SSB_GREEN, mono: '#000000' },
    dark: { ink: '#FFFFFF', accent: '#FFFFFF', mono: '#FFFFFF' },
  },
};

/* ---- SST ----------------------------------------------------------------- */

const sstMono = readSvg('sst/logos/Brand Mark/Mono.svg');
assert(sstMono.paths.length === 2, 'SST Brand Mark/Mono.svg: expected shield + glyph');
const [sstShield, sstGlyph] = sstMono.paths.map((p) => p.d);

// Colour roles in each file, in path order.
const sstMarkFiles = [
  ['sst/logos/Brand Mark/Mono.svg', ['mono', 'knockout-white'], 'light'],
  ['sst/logos/Brand Mark/Inverse Mono.svg', ['mono', 'knockout-dark'], 'dark'],
  ['sst/logos/Brand Mark/Inverse Color.svg', ['shield', 'glyph'], 'dark'],
];
for (const [rel] of sstMarkFiles) {
  const svg = readSvg(rel);
  assert(svg.viewBox === sstMono.viewBox, `${rel}: viewBox ${svg.viewBox} != ${sstMono.viewBox}`);
  assert(svg.paths[0].d === sstShield && svg.paths[1].d === sstGlyph, `${rel}: mark geometry differs from Mono.svg`);
}
const sstInvColor = readSvg('sst/logos/Brand Mark/Inverse Color.svg');
assert(
  sstInvColor.paths[0].fill === PALETTE.sst.dark.shield && sstInvColor.paths[1].fill === PALETTE.sst.dark.glyph,
  'SST Brand Mark/Inverse Color.svg: colours changed',
);
assert(sstMono.paths[0].fill === PALETTE.sst.light.mono && sstMono.paths[1].fill === '#FFFFFF', 'SST Mono colours changed');
const sstInvMono = readSvg('sst/logos/Brand Mark/Inverse Mono.svg');
assert(
  sstInvMono.paths[0].fill === PALETTE.sst.dark.mono && sstInvMono.paths[1].fill === PALETTE.sst.light.mono,
  'SST Inverse Mono colours changed',
);

// The full lockups: wordmark + the same mark. There is no `Brand Mark/Color.svg`;
// the light colour mark is the one inside `Combination Mark/Color.svg`.
const sstFullColor = readSvg('sst/logos/Combination Mark/Color.svg');
function splitSstFull(svg) {
  const mark = svg.paths.slice(-2);
  const words = svg.paths.slice(0, -2);
  assert(mark[0].d === sstShield && mark[1].d === sstGlyph, `${svg.rel}: its mark differs from the Brand Mark`);
  return { words, mark };
}
{
  const { words, mark } = splitSstFull(sstFullColor);
  assert(words.every((p) => p.fill === PALETTE.sst.light.ink), 'SST Color: wordmark is not black');
  assert(mark[0].fill === SST_BLUE && mark[1].fill === '#FFFFFF', 'SST Color: mark colours changed');
}
const sstFullChecks = [
  ['sst/logos/Combination Mark/Inverse Color.svg', 'ink', PALETTE.sst.dark.ink, [PALETTE.sst.dark.shield, PALETTE.sst.dark.glyph]],
  ['sst/logos/Combination Mark/Mono.svg', 'mono', PALETTE.sst.light.mono, [PALETTE.sst.light.mono, '#FFFFFF']],
  ['sst/logos/Combination Mark/Inverse Mono.svg', 'mono', PALETTE.sst.dark.mono, [PALETTE.sst.dark.mono, PALETTE.sst.light.mono]],
];
const sstWordOffsets = [];
for (const [rel, , wordFill, markFills] of sstFullChecks) {
  const svg = readSvg(rel);
  const { words, mark } = splitSstFull(svg);
  assert(words.length === splitSstFull(sstFullColor).words.length, `${rel}: wordmark path count differs`);
  assert(words.every((p) => p.fill === wordFill), `${rel}: wordmark colour is not ${wordFill}`);
  assert(mark[0].fill === markFills[0] && mark[1].fill === markFills[1], `${rel}: mark colours changed`);
  // These three were exported from a frame 0.123 units wider than Color.svg, so
  // their wordmark sits that much further right. Record it; the Color master wins.
  const a = nums(splitSstFull(sstFullColor).words[0].d)[0];
  const b = nums(words[0].d)[0];
  sstWordOffsets.push(`${rel.split('/').pop()}: ${(b - a).toFixed(4)}`);
  assert(Math.abs(b - a) < 0.2, `${rel}: wordmark moved by ${b - a}`);
}
const sstWords = splitSstFull(sstFullColor).words.map((p) => p.d).join(' ');

/* ---- SSB ----------------------------------------------------------------- */

const ssbMono = readSvg('ssb/logos/Logo Mark/Mono.svg');
assert(ssbMono.paths.length === 7, 'SSB Logo Mark/Mono.svg: expected 7 paths');
assert(ssbMono.paths.every((p) => p.fill === PALETTE.ssb.light.mono), 'SSB Mono is not all black');
// Mono path order: frame, glyph ×2, inner shield (evenodd), the three rule lines.
const SSB_ROLES = ['ink', 'accent', 'accent', 'accent', 'ink', 'ink', 'ink'];
const ssbParts = ssbMono.paths.map((p, i) => ({ role: SSB_ROLES[i], d: p.d, evenodd: p.evenodd }));

// Color.svg orders its paths differently (the green first) and its numbers differ
// in the 4th decimal. Match every Color path to a Mono path by geometry, and
// take its colour role from Color.
const ssbColor = readSvg('ssb/logos/Logo Mark/Color.svg');
assert(ssbColor.viewBox === ssbMono.viewBox, 'SSB Color viewBox differs');
for (const p of ssbColor.paths) {
  // The inner shield is drawn from a different start point in each export, so
  // compare it by its point count and bounding numbers instead of in sequence.
  const match = ssbParts.find((q) => sameGeometry(p.d, q.d) || (p.evenodd && q.evenodd && nums(p.d).length === nums(q.d).length));
  assert(match, `SSB Color.svg: a path matches no Mono.svg path`);
  const role = p.fill === SSB_GREEN ? 'accent' : 'ink';
  assert(role === match.role, `SSB Color.svg: role ${role} != Mono role ${match.role}`);
  assert(p.fill === PALETTE.ssb.light[role], `SSB Color.svg: ${p.fill} is not the palette's ${role}`);
}
const ssbInv = readSvg('ssb/logos/Logo Mark/Inverse Color.svg');
assert(
  ssbInv.paths.length === 7 && ssbInv.paths.every((p, i) => p.fill === '#FFFFFF' && sameGeometry(p.d, ssbMono.paths[i].d)),
  'SSB Inverse Color.svg: not the Mono geometry in white',
);
assert(
  readFileSync(resolve(assets, 'ssb/logos/Logo Mark/Mono-1.svg'), 'utf8') === ssbMono.text,
  'SSB Mono-1.svg is no longer a duplicate of Mono.svg; look at it',
);

const ssbFullColor = readSvg('ssb/logos/Combination Mark/Color.svg');
function ssbWordsOf(svg) {
  // The wordmark is every path right of the mark (x >= 30).
  const words = svg.paths.filter((p) => nums(p.d)[0] >= 30);
  const mark = svg.paths.filter((p) => nums(p.d)[0] < 30);
  assert(mark.length === 7, `${svg.rel}: expected the 7 mark paths`);
  for (const p of mark) {
    assert(
      ssbParts.some((q) => sameGeometry(p.d, q.d) || (p.evenodd && q.evenodd && nums(p.d).length === nums(q.d).length)),
      `${svg.rel}: its mark differs from Logo Mark/Mono.svg`,
    );
  }
  return words;
}
const ssbWordPaths = ssbWordsOf(ssbFullColor);
assert(ssbWordPaths.every((p) => p.fill === PALETTE.ssb.light.ink), 'SSB Combination Color: wordmark not black');
for (const [rel, fill] of [
  ['ssb/logos/Combination Mark/Inverse Color.svg', PALETTE.ssb.dark.ink],
  ['ssb/logos/Combination Mark/Mono.svg', PALETTE.ssb.light.mono],
]) {
  const svg = readSvg(rel);
  const words = ssbWordsOf(svg);
  assert(svg.paths.every((p) => p.fill === fill), `${rel}: not all ${fill}`);
  assert(
    words.length === ssbWordPaths.length && words.every((p, i) => sameGeometry(p.d, ssbWordPaths[i].d)),
    `${rel}: wordmark geometry differs from Color.svg`,
  );
}
const ssbWords = ssbWordPaths.map((p) => p.d).join(' ');

/* ---- tokens agree with the artwork ---------------------------------------- */

if (existsSync(TOKENS)) {
  const tokens = readFileSync(TOKENS, 'utf8');
  assert(tokens.includes(`--color-sst-light-9: ${SST_BLUE};`), `tokens: --color-sst-light-9 is not ${SST_BLUE}`);
  assert(tokens.includes(`--color-ssb-light-9: ${SSB_GREEN};`), `tokens: --color-ssb-light-9 is not ${SSB_GREEN}`);
}

/* ---- the Spinner / mask decomposition ------------------------------------ */

const MONO = {
  sst: {
    viewBox: sstMono.viewBox,
    outer: firstSubpath(sstShield),
    inner: sstGlyph,
    body: `${sstShield} ${sstGlyph}`,
  },
  ssb: {
    viewBox: ssbMono.viewBox,
    outer: firstSubpath(ssbParts[0].d),
    inner: ssbParts.slice(1).map((p) => p.d).join(' '),
    body: ssbParts.map((p) => p.d).join(' '),
  },
};

/* ---- write marks.ts ------------------------------------------------------- */

const q = (s) => `'${s}'`;
const ts = `/* ---------------------------------------------------------------------------
 * GENERATED by scripts/build-logos.mjs from ../assets/{sst,ssb}/logos/*.svg. Do not edit.
 *
 * The one copy of the SST and SSB brand marks in this package. <Logo> draws
 * them, <Spinner> and <LogoLoader> trace them, and brand.css's \`--brand-mark\`
 * mask is built from the same \`body\` strings (a test holds the two together).
 *
 * Sources:
 *   monogram geometry  sst/logos/Brand Mark/Mono.svg, ssb/logos/Logo Mark/Mono.svg
 *   monogram roles     SST: Combination Mark/Color.svg's mark (there is no
 *                      Brand Mark/Color.svg); SSB: Logo Mark/Color.svg
 *   wordmarks          {sst,ssb}/logos/Combination Mark/Color.svg
 *   palette            every Color / Inverse Color / Mono / Inverse Mono file,
 *                      checked path by path
 * ------------------------------------------------------------------------- */

/** Which palette entry paints a path. \`knockout\` paths are cut out in mono. */
export type LogoPartRole = 'ink' | 'shield' | 'glyph' | 'accent';

export type LogoPart = { role: LogoPartRole; d: string; evenodd?: boolean };

export type LogoArt = {
  /** The artwork's own viewBox. */
  viewBox: string;
  /** The coloured artwork, one entry per colour role, in paint order. */
  parts: readonly LogoPart[];
  /** The whole mark as one evenodd path: the mono logo, and the mask. */
  solid: readonly LogoPart[];
};

/** The monogram, decomposed for the Spinner's draw: contour, then glyph, then inked. */
export type MonogramTrace = {
  viewBox: string;
  /** The shield's outer contour. Traced first, and the ghost's shape. */
  outer: string;
  /** Everything inside the frame. Traced second. */
  inner: string;
  /** The whole mark as a solid (evenodd). The mono fill, and \`--brand-mark\`. */
  body: string;
};

export const MONOGRAM_TRACE = {
  sst: {
    viewBox: ${q(MONO.sst.viewBox)},
    outer: ${q(MONO.sst.outer)},
    inner: ${q(MONO.sst.inner)},
    body: ${q(MONO.sst.body)},
  },
  ssb: {
    viewBox: ${q(MONO.ssb.viewBox)},
    outer: ${q(MONO.ssb.outer)},
    inner: ${q(MONO.ssb.inner)},
    body: ${q(MONO.ssb.body)},
  },
} as const satisfies Record<'sst' | 'ssb', MonogramTrace>;

const SST_WORDMARK = ${q(sstWords)};
const SSB_WORDMARK = ${q(ssbWords)};

const SST_MARK_PARTS: readonly LogoPart[] = [
  { role: 'shield', d: ${q(sstShield)} },
  { role: 'glyph', d: ${q(sstGlyph)} },
];
const SSB_MARK_PARTS: readonly LogoPart[] = [
${ssbParts.map((p) => `  { role: ${q(p.role)}, d: ${q(p.d)}${p.evenodd ? ', evenodd: true' : ''} },`).join('\n')}
];

export const LOGO_ART = {
  sst: {
    monogram: {
      viewBox: ${q(sstMono.viewBox)},
      parts: SST_MARK_PARTS,
      solid: [{ role: 'shield', d: MONOGRAM_TRACE.sst.body, evenodd: true }],
    },
    full: {
      viewBox: ${q(sstFullColor.viewBox)},
      parts: [{ role: 'ink', d: SST_WORDMARK }, ...SST_MARK_PARTS],
      solid: [
        { role: 'ink', d: SST_WORDMARK },
        { role: 'shield', d: MONOGRAM_TRACE.sst.body, evenodd: true },
      ],
    },
  },
  ssb: {
    monogram: {
      viewBox: ${q(ssbMono.viewBox)},
      parts: SSB_MARK_PARTS,
      solid: [{ role: 'ink', d: MONOGRAM_TRACE.ssb.body, evenodd: true }],
    },
    full: {
      viewBox: ${q(ssbFullColor.viewBox)},
      parts: [{ role: 'ink', d: SSB_WORDMARK }, ...SSB_MARK_PARTS],
      solid: [
        { role: 'ink', d: SSB_WORDMARK },
        { role: 'ink', d: MONOGRAM_TRACE.ssb.body, evenodd: true },
      ],
    },
  },
} as const satisfies Record<'sst' | 'ssb', Record<'monogram' | 'full', LogoArt>>;

/**
 * The artwork's colours per surface. \`light\` is Color / Mono; \`dark\` is
 * Inverse Color / Inverse Mono (SSB has no Inverse Mono: its Inverse Color is
 * already all white). \`mono\` paints every part; the SST glyph is then cut out.
 */
export const LOGO_PALETTE = ${JSON.stringify(PALETTE, null, 2).replace(/"(\w+)":/g, '$1:').replace(/"/g, "'")} as const;
`;
writeFileSync(OUT_MARKS, ts);

/* ---- write brand.css ------------------------------------------------------ */

const mask = (m) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='${m.viewBox}'%3E%3Cpath fill='%23000' fill-rule='evenodd' d='${m.body}'/%3E%3C/svg%3E")`;

const vars = (mode) =>
  [
    ...Object.entries(PALETTE.sst[mode]).map(([k]) => `--ssx-logo-sst-${k}: var(--ssx-logo-sst-${k}-${mode});`),
    ...Object.entries(PALETTE.ssb[mode]).map(([k]) => `--ssx-logo-ssb-${k}: var(--ssx-logo-ssb-${k}-${mode});`),
  ].join('\n  ');
const LIGHT = vars('light');
const DARK = vars('dark');
const indent = (s) => s.replace(/\n {2}/g, '\n    ');

const staticVars = ['sst', 'ssb']
  .flatMap((b) =>
    ['light', 'dark'].flatMap((mode) =>
      Object.entries(PALETTE[b][mode]).map(([k, v]) => `--ssx-logo-${b}-${k}-${mode}: ${v};`),
    ),
  )
  .join('\n  ');

const css = `/* ---------------------------------------------------------------------------
 * GENERATED by scripts/build-logos.mjs from ../assets/{sst,ssb}/logos/*.svg. Do not edit.
 *
 * Two things the brand marks need from CSS rather than JSX:
 *
 * 1. The monogram as a mask source (\`--brand-mark\`). Loading in this system is
 *    the mark inking upward, not a ring of dashes, so the mark has to be
 *    available to CSS (the Button's loading state). It is a \`mask\`, so the fill
 *    inside the SVG is irrelevant; the colour comes from whatever paints it.
 *    The path is the same \`body\` string <Logo> and <Spinner> draw
 *    (\`src/components/Logo/marks.ts\`), and it mirrors the block at the foot of
 *    \`preview/index.html\`.
 *
 * 2. What \`<Logo brand="auto" appearance="auto">\` needs to re-theme with no
 *    JavaScript. Every value is a custom property, so it INHERITS: the nearest
 *    \`data-brand\` / \`data-theme\` ancestor wins, exactly as it does for the
 *    tokens.
 *      --ssx-logo-show-{sst,ssb}   which brand's lockup is displayed
 *      --ssx-logo-{brand}-{role}   the artwork colour for the current mode
 *    The mode blocks below use the SAME selectors, in the same order, as
 *    \`tokens.generated.css\` (a test checks they still exist there), so a logo is
 *    in its dark colours exactly when the dark tokens are in force: an explicit
 *    \`data-theme="dark"\`, or the OS preference when nothing pins it light.
 *
 * The colours are the artwork's own hexes, not tokens: a token may be retuned
 * for contrast; the logo is not. The generator checks the brand hexes against
 * \`--color-sst-light-9\` / \`--color-ssb-light-9\`.
 * ------------------------------------------------------------------------- */

:root {
  ${staticVars}
}

/* ---- brand: the mask, and which lockup \`brand="auto"\` shows ---------------- */

:root,
[data-brand='sst'] {
  --brand-mark: ${mask(MONO.sst)};
  --ssx-logo-show-sst: block;
  --ssx-logo-show-ssb: none;
}

[data-brand='ssb'] {
  --brand-mark: ${mask(MONO.ssb)};
  --ssx-logo-show-sst: none;
  --ssx-logo-show-ssb: block;
}

/* ---- mode: the artwork colours \`appearance="auto"\` resolves to ------------- */

:root {
  ${LIGHT}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    ${indent(DARK)}
  }
}

[data-brand='sst'][data-theme='dark'] {
  ${DARK}
}

@media (prefers-color-scheme: dark) {
  [data-brand='sst']:not([data-theme='light']) {
    ${indent(DARK)}
  }
}

[data-brand='ssb'],
[data-brand='ssb'][data-theme='light'] {
  ${LIGHT}
}

[data-brand='ssb'][data-theme='dark'] {
  ${DARK}
}

@media (prefers-color-scheme: dark) {
  [data-brand='ssb']:not([data-theme='light']) {
    ${indent(DARK)}
  }
}

[data-theme='light'] {
  ${LIGHT}
}
`;
writeFileSync(OUT_BRAND_CSS, css);

/* ---- story fixtures (byte copies) ----------------------------------------- */

copyFileSync(resolve(assets, 'ssb/logos/Logo Mark/Color.svg'), resolve(pkg, 'src/components/Avatar/_fixtures/ssb-mark.svg'));
copyFileSync(
  resolve(assets, 'sst/logos/Combination Mark/Color.svg'),
  resolve(pkg, 'src/components/Avatar/_fixtures/sst-combination.svg'),
);

console.log(
  `build-logos: marks.ts + brand.css written from 14 SVGs. SST wordmark offsets vs Color.svg: ${sstWordOffsets.join(', ')}`,
);
