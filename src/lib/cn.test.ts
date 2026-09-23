import { describe, expect, it } from 'vitest';

import themeCss from '../styles/theme.css?raw';
import { cn, ssxScales } from './cn';

/**
 * `cn` must resolve conflicts on OUR scales the way it does on Tailwind's:
 * the later class wins and the earlier one is dropped. Without the config in
 * `cn.ts`, tailwind-merge keeps both and the CSS source order decides, which
 * is how a consumer's `className` silently fails to override a component.
 */
describe('cn: our scales override and are overridden', () => {
  it.each([
    // spacing namespace: control and icon sizes
    ['h-control-md', 'h-12', 'h-12'],
    ['h-12', 'h-control-md', 'h-control-md'],
    ['h-control-sm', 'h-control-lg', 'h-control-lg'],
    ['min-w-control-md', 'min-w-0', 'min-w-0'],
    ['size-icon-sm', 'size-6', 'size-6'],
    ['size-control-md', 'size-icon-2xl', 'size-icon-2xl'],
    ['w-touch-min', 'w-full', 'w-full'],
    ['p-4', 'p-control-sm', 'p-control-sm'],
    // type
    ['text-base', 'text-md', 'text-md'],
    ['text-md', 'text-lg', 'text-lg'],
    ['font-regular', 'font-bold', 'font-bold'],
    ['font-semibold', 'font-regular', 'font-regular'],
    ['tracking-snug', 'tracking-wide', 'tracking-wide'],
    ['leading-body', 'leading-tight', 'leading-tight'],
    ['leading-none', 'leading-heading', 'leading-heading'],
    // radius, shadow, ease, z
    ['rounded-md', 'rounded-full', 'rounded-full'],
    ['shadow-raised', 'shadow-overlay', 'shadow-overlay'],
    ['shadow-raised', 'shadow-none', 'shadow-none'],
    ['ease-productive-in-out', 'ease-overshoot', 'ease-overshoot'],
    ['ease-linear', 'ease-expressive-entrance', 'ease-expressive-entrance'],
    ['z-overlay', 'z-10', 'z-10'],
    ['z-10', 'z-tooltip', 'z-tooltip'],
    // colours: semantic names are grouped as colours by default
    ['bg-surface', 'bg-surface-raised', 'bg-surface-raised'],
    ['text-content-secondary', 'text-content', 'text-content'],
  ])('cn(%j, %j) === %j', (a, b, expected) => {
    expect(cn(a, b)).toBe(expected);
  });

  it('does not merge across groups that only share a prefix', () => {
    // font size vs text colour
    expect(cn('text-md', 'text-content-secondary')).toBe('text-md text-content-secondary');
    // shadow size vs shadow colour
    expect(cn('shadow-raised', 'shadow-border-focus')).toBe('shadow-raised shadow-border-focus');
    // height vs width
    expect(cn('h-control-md', 'w-control-md')).toBe('h-control-md w-control-md');
  });

  it('keeps variant-prefixed classes separate from the base class', () => {
    expect(cn('h-control-md', 'md:h-control-lg')).toBe('h-control-md md:h-control-lg');
    expect(cn('md:h-control-md', 'md:h-12')).toBe('md:h-12');
  });
});

/**
 * Drift guard. Every custom name `theme.css` gives Tailwind must be known to
 * `cn`. Add a token to `theme.css` and forget `cn.ts`, and this fails.
 */
describe('cn: config matches theme.css', () => {
  const inline = themeCss.slice(themeCss.indexOf('@theme inline'));
  const names = (prefix: string) =>
    [...inline.matchAll(new RegExp(`--${prefix}-([a-z0-9-]+(?:\\\\\\.[0-9]+)?)\\s*:`, 'g'))].map(
      (m) => m[1]!,
    );

  const isNumeric = (n: string) => /^[0-9]/.test(n) || n === 'px';

  it.each([
    ['spacing', ssxScales.spacing, (n: string) => !isNumeric(n)],
    ['text', ssxScales.text, () => true],
    ['font-weight', ssxScales.fontWeight, () => true],
    ['tracking', ssxScales.tracking, () => true],
    ['leading', ssxScales.leading, () => true],
    ['radius', ssxScales.radius, () => true],
    ['ease', ssxScales.ease, () => true],
    ['shadow', ssxScales.shadow, () => true],
    ['z-index', ssxScales.z, () => true],
  ] as const)('--%s-*', (prefix, configured, keep) => {
    const declared = names(prefix).filter(keep);
    expect(declared.length).toBeGreaterThan(0);
    expect([...configured].sort()).toEqual([...new Set(declared)].sort());
  });
});
