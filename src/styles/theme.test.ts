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
