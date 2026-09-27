/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';

import tokensCss from './tokens.generated.css?raw';

/**
 * NOTHING IN A COMPONENT IS HARD-CODED (decided 2026-09-27).
 *
 * Every colour, length, radius, width, opacity, z-index, duration, ratio and
 * type size a component uses comes from the foundations (tokens/*.json ->
 * tokens.generated.css -> the theme.css bridge). This gate reads the source of
 * every component and fails on a value that did not.
 *
 * Why a test and not a lint: theme.css switches Tailwind's default scales off,
 * so an off-scale class (`p-7`, `max-w-md`, `blur-sm`) no longer compiles. That
 * is the point, but it fails SILENTLY: the class is simply missing from the CSS.
 * This is what makes the omission loud.
 *
 * What is NOT a hard-code, and so passes:
 *   - a token, or arithmetic over tokens with a structural factor
 *     (`calc(var(--radius-md)-var(--border-hair))`, `calc(var(--x)/2)`);
 *   - mechanics that are not design decisions: 0, 50% and 100%, `1lh`, the
 *     safe-area insets (`env(safe-area-inset-*, 0px)`), viewport units used as
 *     the viewport itself (`100vh`, `100dvh`, `100vw`), fr tracks, a Radix
 *     measured size, `rotate-90`/`rotate-180` (a chevron turning), `scale-0`/
 *     `scale-100` (a glyph appearing).
 * Anything else needs a token. If a genuinely new value is needed, add it to
 * tokens/ (a foundation step, or a tier-3 `component.*` token) - not here.
 */

const sources = import.meta.glob(['../components/**/*.{ts,tsx}', '../motion/**/*.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const files = Object.entries(sources).filter(
  ([f]) => !/\.(stories|test)\.tsx?$/.test(f) && !f.includes('/_fixtures/'),
);

/** Files allowed to hold a raw colour, and why. */
const RAW_COLOUR_ALLOWED: Record<string, string> = {
  '../components/Logo/marks.ts':
    "the logo artwork's own hexes: a token may be retuned for contrast, the logo may not (brand.css says the same)",
};

/** Space steps that exist, read from the tokens rather than restated. */
const SPACE_STEPS = new Set(
  [...tokensCss.matchAll(/--space-([a-z0-9-]+):/g)].map((m) => m[1]!.replace(/^(\d+)-(\d+)$/, '$1.$2')),
);

const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

/** Every whitespace-separated token inside a string literal. */
function classTokens(src: string): string[] {
  const out: string[] = [];
  for (const m of stripComments(src).matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)) {
    const str = m[1] ?? m[2] ?? m[3] ?? '';
    for (const tok of str.split(/\s+/)) if (tok && !tok.includes('${')) out.push(tok);
  }
  return out;
}

/** `md:hover:[&_svg]:h-4` -> variants ['md','hover','[&_svg]'], utility 'h-4'. */
function split(tok: string): { variants: string[]; utility: string } {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < tok.length; i++) {
    const c = tok[i];
    if (c === '[' || c === '(') depth++;
    else if (c === ']' || c === ')') depth--;
    else if (c === ':' && depth === 0) {
      parts.push(tok.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(tok.slice(start));
  const utility = parts.pop()!.replace(/^!|!$/g, '');
  return { variants: parts, utility };
}

/** A literal design value inside an arbitrary `[...]`, after mechanics are removed. */
function literalIn(value: string): string | null {
  const v = value
    .replace(/env\([^()]*\)/g, 'ENV') // safe-area insets, with their 0px fallback
    .replace(/var\((--[a-z0-9-]+)(,[^()]*)?\)/g, 'VAR') // tokens, with any fallback
    .replace(/\b100(vh|dvh|svh|lvh|vw|dvw|%)/g, 'FULL')
    .replace(/\b50%/g, 'HALF')
    .replace(/(^|[^\d.])0%/g, '$1ZERO')
    .replace(/\b0(px|rem|%)?\b/g, 'ZERO')
    .replace(/\b1lh\b/g, 'LINE')
    .replace(/\d+(\.\d+)?fr\b/g, 'FR');
  // `(?![a-z])`, not `\b`: `%` is not a word character, so `\b` after it only
  // matched before a letter and `min(85%,...)` slipped through.
  const lit = v.match(/#[0-9a-f]{3,8}\b|\b(rgb|hsl|oklch|oklab)a?\(|-?\d*\.?\d+(px|rem|em|ch|vh|dvh|svh|vw|dvw|%|deg|ms|s)(?![a-z])/i);
  return lit ? lit[0] : null;
}

/** Arbitrary values whose content is structural, never a design value. */
const STRUCTURAL_ARBITRARY =
  /^-?(transition|content|grid-cols|grid-rows|col|row|list|shrink|grow|flex|order|mask|inset-shadow)-\[/;

function problems(utility: string, variants: string[]): string | null {
  for (const v of variants) {
    const inner = v.match(/\[(.*)\]/)?.[1];
    if (inner && !/^(data|aria)-/.test(v) && literalIn(inner)) return `variant ${v} has ${literalIn(inner)}`;
  }

  const arb = utility.match(/^(-?[a-z0-9-]+?)-\[(.+)\]$/);
  if (arb) {
    const [, name, value] = arb as unknown as [string, string, string];
    if (/^(data|aria|has|not|supports)$/.test(name)) return null;
    if (/^-?(z|opacity|text|leading|tracking|font|rounded|shadow|duration|delay|ease|blur|backdrop-blur|backdrop-saturate|aspect|ring|outline|border|decoration|underline-offset)$/.test(name) && /^-?\d/.test(value))
      return `arbitrary ${name} value`;
    if (STRUCTURAL_ARBITRARY.test(utility) && !/\d(px|rem|em|ch)\b/.test(value)) return null;
    // A CSS system colour is the platform's requirement under forced colours
    // (Windows High Contrast), so it is allowed there and nowhere else.
    if (/^(Canvas|CanvasText|LinkText|ButtonFace|ButtonText|Highlight|HighlightText|GrayText|currentColor)$/i.test(value))
      return variants.includes('forced-colors') ? null : `system colour ${value}`;
    if (/color-mix/.test(value) && /\d+%/.test(value.replace(/var\([^()]*\)/g, ''))) return 'color-mix with a literal percentage';
    const lit = literalIn(value);
    return lit ? `literal ${lit}` : null;
  }

  // Off-scale spacing: `p-7` no longer compiles, so it must not be written.
  const sp = utility.match(
    /^-?(p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|gap|gap-x|gap-y|space-x|space-y|w|h|size|min-w|min-h|max-w|max-h|top|bottom|left|right|start|end|inset|inset-x|inset-y|translate-x|translate-y|basis|indent|scroll-p[xytblrse]?|scroll-m[xytblrse]?)-(\d+(\.\d+)?)$/,
  );
  if (sp && !SPACE_STEPS.has(sp[2]!)) return `off-scale step ${sp[2]}`;

  if (/^(opacity)-\d+$/.test(utility) && !/^opacity-(0|100)$/.test(utility)) return 'numeric opacity';
  if (/^-?z-\d+$/.test(utility) && utility !== 'z-0') return 'numeric z-index';
  if (/^(duration|delay)-\d+$/.test(utility) && !/-0$/.test(utility)) return 'numeric duration';
  if (/^(border|border-[xytblrse]|ring|ring-offset|outline|outline-offset|divide-[xy]|decoration|underline-offset|stroke)-\d+$/.test(utility) && !/-0$/.test(utility))
    return 'numeric width';
  if (/^(scale|scale-[xy])-\d+$/.test(utility) && !/^scale(-[xy])?-(0|100)$/.test(utility)) return 'numeric scale';
  if (/^rotate-\d+$/.test(utility) && !/^rotate-(0|90|180)$/.test(utility)) return 'numeric rotation';
  if (/^leading-(none|\d+)$/.test(utility)) return 'Tailwind leading (use leading-flat and the leading-* tokens)';
  if (/^(bg|text|border|border-[xytblrse]|ring|outline|fill|stroke|shadow|from|via|to|decoration|divide|placeholder|caret|accent)-[a-z-]+\/\d+$/.test(utility))
    return 'colour alpha modifier with a literal percentage';
  return null;
}

describe('components take every value from the foundations', () => {
  it('found the component sources', () => {
    expect(files.length).toBeGreaterThan(100);
    expect(SPACE_STEPS.has('4')).toBe(true);
  });

  it('no hard-coded value in a class string', () => {
    const offenders: string[] = [];
    for (const [file, src] of files) {
      for (const tok of new Set(classTokens(src))) {
        const { variants, utility } = split(tok);
        if (!/^-?[a-z@[]/.test(utility) && !variants.length) continue;
        const why = problems(utility, variants);
        if (why) offenders.push(`${file.replace('../components/', '')}: ${tok}  (${why})`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('no raw colour outside the declared exceptions', () => {
    const offenders = files
      .filter(([f]) => !(f in RAW_COLOUR_ALLOWED))
      .flatMap(([f, src]) =>
        [...stripComments(src).matchAll(/#[0-9a-fA-F]{6,8}\b|\b(rgba?|hsla?|oklch)\(\s*\d/g)].map((m) => `${f}: ${m[0]}`),
      );
    expect(offenders).toEqual([]);
  });

  it('no pixel number passed to a positioning prop (read the scale from lib/scale.generated)', () => {
    const offenders = files.flatMap(([f, src]) =>
      [...stripComments(src).matchAll(/\b(sideOffset|alignOffset|collisionPadding|arrowPadding)=\{\s*[1-9]\d*\s*\}/g)].map(
        (m) => `${f}: ${m[0]}`,
      ),
    );
    expect(offenders).toEqual([]);
  });
});
