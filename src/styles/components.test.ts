import { describe, expect, it } from 'vitest';

import componentsCss from './components.css?raw';

/**
 * Reduced motion for every loader, pinned against the stylesheet.
 *
 * jsdom evaluates neither `prefers-reduced-motion` nor cascade layers, so a
 * computed-style test would pass whatever the CSS said. The bug this guards
 * was a SPECIFICITY bug — the reduced-motion rule for the monogram body was
 * `[data-slot='spinner'] [data-part='body']` (0,2,0) and lost to the sm ink
 * rule and the md+ draw rules (0,4,0), so the mark kept animating (on a 1ms
 * cycle, since tokens.css collapses every duration to 1ms: a strobe). So this
 * parses the rules, computes selector specificity, and asserts the cascade
 * outcome directly: every animated loader rule is matched, inside the
 * reduced-motion media block AND under `[data-motion='reduce']`, by a rule of
 * at least its specificity that comes LATER and says `animation: none`.
 */

type Rule = { selector: string; body: string; media: string[]; index: number };

/** Flat list of style rules (not @keyframes frames), with their @media context. */
function parseRules(css: string): Rule[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: Rule[] = [];
  const stack: Array<{ kind: 'media' | 'keyframes' | 'block'; text: string }> = [];
  let buf = '';
  let index = 0;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src.charAt(i);
    if (ch === '{') {
      const head = buf.trim();
      buf = '';
      if (head.startsWith('@media')) stack.push({ kind: 'media', text: head });
      else if (head.startsWith('@keyframes')) stack.push({ kind: 'keyframes', text: head });
      else if (head.startsWith('@')) stack.push({ kind: 'block', text: head });
      else {
        // A style rule: read its body to the matching brace (no nesting inside).
        const close = src.indexOf('}', i);
        const body = src.slice(i + 1, close);
        if (!stack.some((s) => s.kind === 'keyframes')) {
          for (const selector of splitList(head)) {
            rules.push({
              selector: selector.replace(/\s+/g, ' ').trim(),
              body: body.replace(/\s+/g, ' ').trim(),
              media: stack.filter((s) => s.kind === 'media').map((s) => s.text),
              index: (index += 1),
            });
          }
        }
        i = close;
      }
    } else if (ch === '}') {
      stack.pop();
      buf = '';
    } else if (ch === ';' && buf.trim().startsWith('@')) {
      buf = '';
    } else {
      buf += ch;
    }
  }
  return rules;
}

/** Split a selector list on top-level commas. */
function splitList(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of list) {
    if (ch === '(' || ch === '[') depth += 1;
    if (ch === ')' || ch === ']') depth -= 1;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

type Spec = [number, number, number];
const add = (a: Spec, b: Spec): Spec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const cmp = (a: Spec, b: Spec) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

/** Selectors Level 4 specificity, for the subset this stylesheet uses. */
function specificity(sel: string): Spec {
  let s: Spec = [0, 0, 0];
  let i = 0;
  const readParen = () => {
    let depth = 0;
    const start = i;
    for (; i < sel.length; i += 1) {
      if (sel.charAt(i) === '(') depth += 1;
      if (sel.charAt(i) === ')') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    i += 1;
    return sel.slice(start + 1, i - 1);
  };
  while (i < sel.length) {
    const ch = sel.charAt(i);
    if (ch === '[') {
      i = sel.indexOf(']', i) + 1;
      s = add(s, [0, 1, 0]);
    } else if (ch === '#') {
      i += 1;
      while (i < sel.length && /[\w-]/.test(sel.charAt(i))) i += 1;
      s = add(s, [1, 0, 0]);
    } else if (ch === '.') {
      i += 1;
      while (i < sel.length && /[\w-]/.test(sel.charAt(i))) i += 1;
      s = add(s, [0, 1, 0]);
    } else if (ch === ':' && sel.charAt(i + 1) === ':') {
      i += 2;
      while (i < sel.length && /[\w-]/.test(sel.charAt(i))) i += 1;
      s = add(s, [0, 0, 1]);
    } else if (ch === ':') {
      i += 1;
      let name = '';
      while (i < sel.length && /[\w-]/.test(sel.charAt(i))) name += sel.charAt(i++);
      if (sel.charAt(i) === '(') {
        const arg = readParen();
        if (name === 'where') continue;
        if (name === 'not' || name === 'is' || name === 'has') {
          const best = splitList(arg).map(specificity).sort(cmp).pop() ?? [0, 0, 0];
          s = add(s, best);
          continue;
        }
      }
      s = add(s, [0, 1, 0]);
    } else if (/[a-zA-Z]/.test(ch)) {
      while (i < sel.length && /[\w-]/.test(sel.charAt(i))) i += 1;
      s = add(s, [0, 0, 1]);
    } else {
      i += 1;
    }
  }
  return s;
}

const REDUCE = '@media (prefers-reduced-motion: reduce)';
const rules = parseRules(componentsCss);
const plain = rules.filter((r) => r.media.length === 0);
const reduced = rules.filter((r) => r.media.includes(REDUCE));

/** The loader rules that start a loop: a spinner selector with a named animation. */
const animated = plain.filter(
  (r) => r.selector.startsWith("[data-slot='spinner']") && /animation: (?!none)/.test(r.body),
);

describe('specificity() — the calculator the tests below rely on', () => {
  it('counts attributes, :not() arguments, pseudo-classes and elements', () => {
    expect(specificity("[data-slot='spinner'] [data-part='body']")).toEqual([0, 2, 0]);
    expect(
      specificity("[data-slot='spinner'][data-kind='monogram'][data-size='sm'] [data-part='body']"),
    ).toEqual([0, 4, 0]);
    expect(
      specificity("[data-slot='spinner'][data-kind='monogram']:not([data-size='sm']) [data-part='body']"),
    ).toEqual([0, 4, 0]);
    expect(specificity("[data-part='dot']:nth-child(1)")).toEqual([0, 2, 0]);
    expect(specificity('a:where(.x)::after')).toEqual([0, 0, 2]);
  });
});

describe('loaders under reduced motion (components.css)', () => {
  it('finds the animated loader rules: the dots, the sm ink, and the md+ draw', () => {
    const sels = animated.map((r) => r.selector);
    expect(sels).toContain("[data-slot='spinner'][data-kind='dots'] [data-part='dot']");
    expect(sels).toContain(
      "[data-slot='spinner'][data-kind='monogram'][data-size='sm'] [data-part='body']",
    );
    for (const part of ['body', 'outer', 'inner']) {
      expect(sels).toContain(
        `[data-slot='spinner'][data-kind='monogram']:not([data-size='sm']) [data-part='${part}']`,
      );
    }
  });

  const winsOver = (candidates: Rule[], base: Rule) =>
    candidates.some(
      (r) =>
        /animation: none/.test(r.body) &&
        r.index > base.index &&
        cmp(specificity(r.selector), specificity(base.selector)) >= 0 &&
        // it must target the same element: the base selector, maybe with an ancestor prefixed
        (r.selector === base.selector || r.selector.endsWith(` ${base.selector}`)),
    );

  it.each(animated.map((r) => [r.selector, r] as const))(
    'the reduced-motion media rule stops %s (same element, >= specificity, later)',
    (_sel, base) => {
      expect(winsOver(reduced, base)).toBe(true);
    },
  );

  it.each(animated.map((r) => [r.selector, r] as const))(
    '[data-motion="reduce"] stops %s too',
    (_sel, base) => {
      const forced = plain.filter((r) => r.selector.startsWith("[data-motion='reduce'] "));
      expect(winsOver(forced, base)).toBe(true);
    },
  );

  it('no longer relies on the short selector that lost the cascade', () => {
    expect(reduced.map((r) => r.selector)).not.toContain("[data-slot='spinner'] [data-part='body']");
  });

  const frame = (list: Rule[], sel: string) => list.find((r) => r.selector.endsWith(sel))?.body ?? '';
  const SM_BODY = "[data-slot='spinner'][data-kind='monogram'][data-size='sm'] [data-part='body']";
  const MD = "[data-slot='spinner'][data-kind='monogram']:not([data-size='sm'])";

  it.each([
    ['the media query', reduced],
    ['[data-motion="reduce"]', plain.filter((r) => r.selector.startsWith("[data-motion='reduce'] "))],
  ] as const)('holds a visibly UNFINISHED frame under %s', (_label, list) => {
    // sm (Button loading md/lg): the silhouette half-inked, not full.
    expect(frame(list, SM_BODY)).toContain('clip-path: inset(50% 0 0 0)');
    expect(frame(list, SM_BODY)).toContain('opacity: 1');
    // md+ (Spinner md+, LogoLoader): contour traced, glyph half-traced, not inked.
    expect(frame(list, `${MD} [data-part='outer']`)).toContain('stroke-dashoffset: 0;');
    expect(frame(list, `${MD} [data-part='inner']`)).toContain('stroke-dashoffset: 0.5');
    expect(frame(list, `${MD} [data-part='body']`)).toContain('opacity: 0');
    // dots: the leading dot lit, the rest at 0.45 (unchanged).
    expect(frame(list, "[data-kind='dots'] [data-part='dot']")).toContain('opacity: 0.45');
    expect(frame(list, "[data-kind='dots'] [data-part='dot']:nth-child(1)")).toContain('opacity: 1');
  });

  it('never hides the ghost contour under reduced motion, so the frame reads as a shape', () => {
    const all = [...reduced, ...plain.filter((r) => r.selector.startsWith("[data-motion='reduce'] "))];
    expect(all.some((r) => r.selector.includes("[data-part='ghost']"))).toBe(false);
  });
});
