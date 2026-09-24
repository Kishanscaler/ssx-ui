/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';

import themeCss from './theme.css?raw';
import tokensCss from './tokens.generated.css?raw';

/**
 * Breakpoints in `theme.css` are literal values (a `var()` is invalid inside a
 * media query). They must stay equal to the generated tokens, which come from
 * `tokens/primitive.scales.json`.
 */
describe('theme.css breakpoints', () => {
  const read = (css: string) =>
    Object.fromEntries(
      [...css.matchAll(/--breakpoint-([a-z0-9]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]),
    );

  it('match tokens.generated.css exactly', () => {
    const tokens = read(tokensCss);
    const theme = read(themeCss);
    expect(Object.keys(tokens).length).toBeGreaterThan(0);
    expect(theme).toEqual(tokens);
  });

  it('never use var() (invalid in a media query)', () => {
    expect(themeCss).not.toMatch(/--breakpoint-[a-z0-9]+:\s*var\(/);
  });
});

/**
 * The `type-*` role utilities read the composite tokens. The eyebrow is the
 * one role with a visible tracking, and it is what makes an eyebrow read as
 * one: every eyebrow-style label in the package uses `type-eyebrow`.
 */
describe('theme.css type roles', () => {
  const utility = (name: string) => {
    const m = themeCss.match(new RegExp(`@utility ${name}\\s*\\{([^}]*)\\}`));
    return m ? m[1]! : '';
  };

  it('every role in tokens.generated.css has a utility that reads all its parts', () => {
    const roles = [...new Set([...tokensCss.matchAll(/--type-([a-z0-9-]+)-size:/g)].map((m) => m[1]!))];
    expect(roles.length).toBeGreaterThan(10);
    for (const r of roles) {
      const body = utility(`type-${r}`);
      expect(body, `@utility type-${r}`).toContain(`font-size: var(--type-${r}-size)`);
      expect(body).toContain(`line-height: var(--type-${r}-lh)`);
      expect(body).toContain(`letter-spacing: var(--type-${r}-tracking)`);
    }
  });

  it('the eyebrow is uppercase with the 0.08em tracking and its weight', () => {
    const body = utility('type-eyebrow');
    expect(body).toContain('letter-spacing: var(--type-eyebrow-tracking)');
    expect(body).toContain('font-weight: var(--type-eyebrow-weight)');
    expect(body).toContain('text-transform: uppercase');
    expect(tokensCss).toMatch(/--type-eyebrow-tracking:\s*0\.08em;/);
  });

  it('no component or story spells an eyebrow by hand (tracking-wide + uppercase)', () => {
    const files = import.meta.glob('../components/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    const offenders = Object.entries(files)
      .filter(([, src]) => /uppercase/.test(src) && /tracking-wide|letterSpacing/.test(src))
      .map(([f]) => f);
    expect(offenders).toEqual([]);
  });
});

/** Sizes are rem so a reader's font-size setting scales them (audit S7). */
describe('tokens are rem, hairlines and breakpoints are px', () => {
  const value = (name: string) => tokensCss.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();

  it.each([
    ['space-4', '1rem'],
    ['font-size-base', '0.9375rem'],
    ['size-control-md', '2.5rem'],
    ['size-touch-min', '2.75rem'],
    ['radius-lg', '0.5rem'],
    ['type-body-size', '1rem'],
    ['space-gutter', '1rem'],
  ])('--%s is %s', (name, expected) => {
    expect(value(name)).toBe(expected);
  });

  it.each([
    ['border-hair', '1px'],
    ['space-px', '1px'],
    ['radius-full', '9999px'],
    ['breakpoint-sm', '672px'],
  ])('--%s stays %s', (name, expected) => {
    expect(value(name)).toBe(expected);
  });

  it('the gutter steps to 24px (1.5rem) at sm', () => {
    const desktop = tokensCss.slice(tokensCss.indexOf('@media (min-width: 672px)'));
    expect(desktop).toMatch(/--space-gutter:\s*1\.5rem;/);
  });
});
