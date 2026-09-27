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
    // the page gutter
    ['px-4', 'px-gutter', 'px-gutter'],
    ['px-gutter', 'px-6', 'px-6'],
    // type
    ['text-base', 'text-md', 'text-md'],
    ['text-md', 'text-lg', 'text-lg'],
    ['font-regular', 'font-bold', 'font-bold'],
    ['font-semibold', 'font-regular', 'font-regular'],
    ['tracking-snug', 'tracking-wide', 'tracking-wide'],
    ['leading-body', 'leading-tight', 'leading-tight'],
    ['leading-flat', 'leading-heading', 'leading-heading'],
    // radius, shadow, ease, z
    ['rounded-md', 'rounded-full', 'rounded-full'],
    ['shadow-raised', 'shadow-overlay', 'shadow-overlay'],
    ['shadow-raised', 'shadow-none', 'shadow-none'],
    ['ease-productive-in-out', 'ease-overshoot', 'ease-overshoot'],
    ['ease-linear', 'ease-expressive-entrance', 'ease-expressive-entrance'],
    ['z-overlay', 'z-10', 'z-10'],
    ['z-10', 'z-tooltip', 'z-tooltip'],
    // widths are widths, not colours (the default reads `border-thick` as a colour)
    ['border-hair', 'border-thick', 'border-thick'],
    ['border-s-thick', 'border-s-heavy', 'border-s-heavy'],
    ['ring-thick', 'ring-halo', 'ring-halo'],
    ['outline-focus', 'outline-0', 'outline-0'],
    ['outline-offset-focus', 'outline-offset-focus-tight', 'outline-offset-focus-tight'],
    ['decoration-hair', 'decoration-thick', 'decoration-thick'],
    // opacity, aspect, blur, panel widths, indicators, the half-steps
    ['opacity-muted', 'opacity-100', 'opacity-100'],
    ['aspect-video', 'aspect-photo', 'aspect-photo'],
    ['w-panel-sm', 'w-full', 'w-full'],
    ['max-w-panel-md', 'max-w-panel-lg', 'max-w-panel-lg'],
    ['size-indicator-sm', 'size-control-xs', 'size-control-xs'],
    ['gap-1.5', 'gap-2.5', 'gap-2.5'],
    ['text-2xs', 'text-xs', 'text-xs'],
    ['z-lift', 'z-below', 'z-below'],
    // colours: semantic names are grouped as colours by default
    ['bg-surface', 'bg-surface-raised', 'bg-surface-raised'],
    ['text-content-secondary', 'text-content', 'text-content'],
  ])('cn(%j, %j) === %j', (a, b, expected) => {
    expect(cn(a, b)).toBe(expected);
  });

  it('type roles replace an earlier size / leading / tracking (and weight when the role sets it)', () => {
    expect(cn('text-sm leading-body tracking-wide', 'type-body')).toBe('type-body');
    expect(cn('type-body', 'type-caption')).toBe('type-caption');
    expect(cn('type-h1', 'type-body')).toBe('type-body');
    expect(cn('type-body', 'type-h2')).toBe('type-h2');
    expect(cn('font-medium', 'type-h2')).toBe('type-h2');
    // running-text roles leave weight alone, so an earlier weight survives
    expect(cn('font-medium', 'type-body-sm')).toBe('font-medium type-body-sm');
  });

  it('a later single property overrides one part of a role, keeping the role', () => {
    expect(cn('type-body', 'text-sm')).toBe('type-body text-sm');
    expect(cn('type-h2', 'font-medium')).toBe('type-h2 font-medium');
    expect(cn('type-eyebrow', 'text-content-brand')).toBe('type-eyebrow text-content-brand');
  });

  it('does not merge across groups that only share a prefix', () => {
    // font size vs text colour
    expect(cn('text-md', 'text-content-secondary')).toBe('text-md text-content-secondary');
    // shadow size vs shadow colour
    expect(cn('shadow-raised', 'shadow-border-focus')).toBe('shadow-raised shadow-border-focus');
    // height vs width
    expect(cn('h-control-md', 'w-control-md')).toBe('h-control-md w-control-md');
    // a width and a colour on the same property family both survive
    expect(cn('border-thick', 'border-border-control')).toBe('border-thick border-border-control');
    expect(cn('ring-halo', 'ring-focus-halo')).toBe('ring-halo ring-focus-halo');
    expect(cn('outline-focus', 'outline-border-focus')).toBe('outline-focus outline-border-focus');
    expect(cn('decoration-hair', 'decoration-content-link')).toBe('decoration-hair decoration-content-link');
    expect(cn('backdrop-blur-glass', 'blur-glass')).toBe('backdrop-blur-glass blur-glass');
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
    ['text', ssxScales.text, (n: string) => !/^(decoration|underline)-/.test(n)],
    ['font-weight', ssxScales.fontWeight, () => true],
    ['tracking', ssxScales.tracking, () => true],
    ['leading', ssxScales.leading, () => true],
    ['radius', ssxScales.radius, () => true],
    ['ease', ssxScales.ease, () => true],
    ['shadow', ssxScales.shadow, () => true],
    ['z-index', ssxScales.z, () => true],
    ['container', ssxScales.container, (n: string) => !n.startsWith('region-')],
    ['border-width', ssxScales.borderWidth, () => true],
    ['ring-width', ssxScales.ringWidth, () => true],
    ['ring-offset-width', ssxScales.ringOffsetWidth, () => true],
    ['outline-width', ssxScales.outlineWidth, () => true],
    ['outline-offset', ssxScales.outlineOffset, () => true],
    ['text-decoration-thickness', ssxScales.decorationThickness, () => true],
    ['text-underline-offset', ssxScales.underlineOffset, () => true],
    ['opacity', ssxScales.opacity, () => true],
    ['aspect', ssxScales.aspect, () => true],
    ['blur', ssxScales.blur, () => true],
  ] as const)('--%s-*', (prefix, configured, keep) => {
    const declared = names(prefix).filter(keep);
    expect(declared.length).toBeGreaterThan(0);
    expect([...configured].sort()).toEqual([...new Set(declared)].sort());
  });
});

describe('cn: type roles match theme.css', () => {
  it('every `@utility type-*` is configured, weighted exactly when it sets font-weight', () => {
    const blocks = [...themeCss.matchAll(/@utility type-([a-z0-9-]+)\s*\{([^}]*)\}/g)];
    expect(blocks.length).toBeGreaterThan(0);
    const weighted = blocks.filter((b) => /font-weight:/.test(b[2]!)).map((b) => b[1]!);
    const plain = blocks.filter((b) => !/font-weight:/.test(b[2]!)).map((b) => b[1]!);
    expect([...ssxScales.typeWeighted].sort()).toEqual(weighted.sort());
    expect([...ssxScales.type].sort()).toEqual(plain.sort());
  });

  it('knows the prose measure: max-w-measure replaces an earlier max width', () => {
    expect(cn('max-w-full', 'max-w-measure')).toBe('max-w-measure');
    expect(cn('max-w-measure', 'max-w-[40rem]')).toBe('max-w-[40rem]');
  });

  it('knows the elevation scale: a later shadow level replaces an earlier one', () => {
    expect(cn('shadow-raised', 'shadow-5')).toBe('shadow-5');
    expect(cn('shadow-2', 'shadow-none')).toBe('shadow-none');
  });
});

