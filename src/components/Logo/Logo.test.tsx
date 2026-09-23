import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Logo, LogoLoader, logoBrandNames } from './Logo';
import { LOGO_ART, LOGO_PALETTE, MONOGRAM_TRACE } from './marks';
import { Spinner } from '../Spinner';
import brandCss from '../../styles/brand.css?raw';
import tokensCss from '../../styles/tokens.generated.css?raw';
import componentsCss from '../../styles/components.css?raw';

const root = (c: HTMLElement) => c.firstElementChild as HTMLElement;
const marks = (c: HTMLElement) =>
  [...c.querySelectorAll('svg[data-logo-mark]')].map((m) => m.getAttribute('data-logo-mark'));

describe('Logo', () => {
  it('defaults: auto brand, full, color, auto surface, md — all reflected as data attributes', () => {
    const { container } = render(<Logo />);
    const el = root(container);
    expect(el).toHaveAttribute('data-slot', 'logo');
    expect(el).toHaveAttribute('data-logo-brand', 'auto');
    expect(el).toHaveAttribute('data-variant', 'full');
    expect(el).toHaveAttribute('data-tone', 'color');
    expect(el).toHaveAttribute('data-surface', 'auto');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el.className).toContain('h-8');
    // Never `data-brand`: that would re-theme the subtree through the tokens.
    expect(el).not.toHaveAttribute('data-brand');
  });

  it.each(['sst', 'ssb'] as const)('brand="%s" renders only that lockup', (brand) => {
    const { container } = render(<Logo brand={brand} />);
    expect(marks(container)).toEqual([brand]);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', LOGO_ART[brand].full.viewBox);
  });

  it('brand="auto" renders both lockups for CSS to pick, each naming itself', () => {
    const { container } = render(<Logo />);
    expect(marks(container)).toEqual(['sst', 'ssb']);
    expect(root(container)).not.toHaveAttribute('role');
    expect(screen.getByRole('img', { name: logoBrandNames.sst })).toHaveAttribute('data-logo-mark', 'sst');
    expect(screen.getByRole('img', { name: logoBrandNames.ssb })).toHaveAttribute('data-logo-mark', 'ssb');
    // The switch is CSS reading brand.css's inherited variables.
    expect(componentsCss).toContain("[data-logo-brand='auto'] [data-logo-mark='ssb']");
    expect(brandCss).toMatch(/\[data-brand='ssb'\] \{[^}]*--ssx-logo-show-ssb: block;/);
  });

  it('variant="monogram" draws the mark alone', () => {
    const { container } = render(<Logo brand="ssb" variant="monogram" />);
    expect(root(container)).toHaveAttribute('data-variant', 'monogram');
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', MONOGRAM_TRACE.ssb.viewBox);
  });

  it('a pinned surface paints the artwork colours as attributes (no CSS needed)', () => {
    const light = render(<Logo brand="sst" surface="light" />).container;
    const fill = (c: HTMLElement, role: string) => c.querySelector(`[data-logo-part="${role}"]`)!.getAttribute('fill');
    expect(fill(light, 'shield')).toBe('#0245B9');
    expect(fill(light, 'glyph')).toBe('#FFFFFF');
    expect(fill(light, 'ink')).toBe('#000000');
    const dark = render(<Logo brand="sst" surface="dark" />).container;
    expect(fill(dark, 'shield')).toBe('#FFFFFF');
    expect(fill(dark, 'glyph')).toBe('#0245B9');
    const ssb = render(<Logo brand="ssb" surface="light" />).container;
    expect(fill(ssb, 'accent')).toBe('#1D925B');
  });

  it('surface="auto" carries the light artwork as a fallback, and CSS repaints it', () => {
    const { container } = render(<Logo brand="sst" />);
    expect(container.querySelector('[data-logo-part="shield"]')).toHaveAttribute('fill', LOGO_PALETTE.sst.light.shield);
    expect(componentsCss).toContain("[data-surface='auto'][data-tone='color'] [data-logo-mark='sst'] [data-logo-part='shield']");
  });

  it('tone="mono" paints currentColor, the SST glyph cut out of one evenodd shield path', () => {
    const { container } = render(<Logo brand="sst" variant="monogram" tone="mono" surface="light" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('color', '#171717');
    const paths = svg.querySelectorAll('path');
    expect(paths).toHaveLength(1);
    expect(paths[0]).toHaveAttribute('fill', 'currentColor');
    expect(paths[0]).toHaveAttribute('fill-rule', 'evenodd');
    expect(paths[0]).toHaveAttribute('d', MONOGRAM_TRACE.sst.body);
    const dark = render(<Logo brand="ssb" tone="mono" surface="dark" />).container;
    expect(dark.querySelector('svg')).toHaveAttribute('color', '#FFFFFF');
  });

  it.each(['sst', 'ssb'] as const)('a fixed brand="%s" is one img named after the school', (brand) => {
    const { container } = render(<Logo brand={brand} />);
    expect(screen.getByRole('img', { name: logoBrandNames[brand] })).toBe(root(container));
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('label replaces the name, on the root, even with brand="auto"', () => {
    const { container } = render(<Logo label="Scaler home" />);
    expect(screen.getByRole('img', { name: 'Scaler home' })).toBe(root(container));
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('decorative hides it from assistive technology', () => {
    const { container } = render(<Logo decorative />);
    expect(root(container)).toHaveAttribute('aria-hidden', 'true');
    expect(root(container)).not.toHaveAttribute('role');
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it.each([
    ['sm', 'h-6'],
    ['md', 'h-8'],
    ['lg', 'h-10'],
  ] as const)('size="%s" sets %s', (size, cls) => {
    const { container } = render(<Logo size={size} />);
    expect(root(container).className).toContain(cls);
  });

  it('merges className last (a height replaces the size)', () => {
    const { container } = render(<Logo className="h-[28px] custom" />);
    const cls = root(container).className.split(' ');
    expect(cls).toContain('h-[28px]');
    expect(cls).toContain('custom');
    expect(cls).not.toContain('h-8');
  });

  it('forwards the ref and spreads props onto the root', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<Logo ref={ref} id="brand" data-testid="logo" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current).toHaveAttribute('id', 'brand');
  });
});

describe('LogoLoader', () => {
  it('IS the Spinner: same slot, the monogram kind, the same parts', () => {
    const { container } = render(<LogoLoader />);
    const el = root(container);
    expect(el).toHaveAttribute('data-slot', 'spinner');
    expect(el).toHaveAttribute('data-kind', 'monogram');
    expect(el).toHaveAttribute('data-logo-loader');
    expect(el).toHaveAttribute('data-size', 'md');
    // Byte-for-byte the markup Spinner draws, bar the logo attributes.
    const spinner = render(<Spinner size="md" />).container;
    expect(container.querySelector('svg')!.outerHTML).toBe(spinner.querySelector('svg')!.outerHTML);
    expect([...el.querySelectorAll('[data-part]')].map((p) => p.getAttribute('data-part'))).toEqual([
      'ghost', 'body', 'outer', 'inner', 'ghost', 'body', 'outer', 'inner',
    ]);
  });

  it('brand="auto" holds both marks; a fixed brand holds one and pins it', () => {
    const auto = root(render(<LogoLoader />).container);
    expect(auto.querySelectorAll('svg[data-brand-mark]')).toHaveLength(2);
    expect(auto).not.toHaveAttribute('data-mark-brand');
    const ssb = root(render(<LogoLoader brand="ssb" />).container);
    expect([...ssb.querySelectorAll('svg[data-brand-mark]')].map((s) => s.getAttribute('data-brand-mark'))).toEqual(['ssb']);
    expect(ssb).toHaveAttribute('data-mark-brand', 'ssb');
    expect(componentsCss).toContain("[data-slot='spinner'][data-mark-brand] [data-brand-mark]");
  });

  it.each(['sm', 'md', 'lg', 'xl'] as const)('size="%s" is the Spinner size, always the monogram', (size) => {
    const el = root(render(<LogoLoader size={size} />).container);
    expect(el).toHaveAttribute('data-size', size);
    expect(el).toHaveAttribute('data-kind', 'monogram');
  });

  it('reflects tone and surface for the palette rules', () => {
    const el = root(render(<LogoLoader tone="mono" surface="dark" />).container);
    expect(el).toHaveAttribute('data-tone', 'mono');
    expect(el).toHaveAttribute('data-surface', 'dark');
    expect(componentsCss).toContain("[data-logo-loader][data-tone='mono'][data-surface='dark'] [data-brand-mark='sst']");
  });

  it('announces "Loading" as a status; label and decorative as the Spinner does', () => {
    render(<LogoLoader />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    const { container } = render(<LogoLoader decorative />);
    expect(root(container)).toHaveAttribute('aria-hidden', 'true');
    expect(root(container)).not.toHaveAttribute('role');
    render(<LogoLoader label="Loading your cohort" />);
    expect(screen.getByRole('status', { name: 'Loading your cohort' })).toBeInTheDocument();
  });

  it('forwards the ref and merges className', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<LogoLoader ref={ref} className="custom" />);
    expect(ref.current).toHaveAttribute('data-slot', 'spinner');
    expect(ref.current!.className).toContain('custom');
  });
});

describe('one source of the marks', () => {
  it('brand.css --brand-mark is the same path as the Logo mono monogram and the Spinner body', () => {
    for (const brand of ['sst', 'ssb'] as const) {
      const block = brand === 'sst' ? /\[data-brand='sst'\] \{([^}]*)\}/ : /\[data-brand='ssb'\] \{([^}]*)\}/;
      const css = block.exec(brandCss)![1]!;
      const d = /d='([^']+)'/.exec(css)![1];
      expect(d).toBe(MONOGRAM_TRACE[brand].body);
      expect(css).toContain(`viewBox='${MONOGRAM_TRACE[brand].viewBox}'`);
      expect(LOGO_ART[brand].monogram.solid[0]!.d).toBe(MONOGRAM_TRACE[brand].body);
    }
    const { container } = render(<Spinner size="md" />);
    const bodies = [...container.querySelectorAll('[data-part="body"]')].map((p) => p.getAttribute('d'));
    expect(bodies).toEqual([MONOGRAM_TRACE.sst.body, MONOGRAM_TRACE.ssb.body]);
  });

  it('the full lockups contain the monogram paths unchanged', () => {
    for (const brand of ['sst', 'ssb'] as const) {
      const mono = LOGO_ART[brand].monogram.parts.map((p) => p.d);
      const full = LOGO_ART[brand].full.parts.map((p) => p.d);
      expect(full.slice(1)).toEqual(mono);
    }
  });

  it('the artwork brand hexes are the primitive ramps’ step 9', () => {
    expect(tokensCss).toContain(`--color-sst-light-9: ${LOGO_PALETTE.sst.light.shield};`);
    expect(tokensCss).toContain(`--color-ssb-light-9: ${LOGO_PALETTE.ssb.light.accent};`);
  });

  it('brand.css mode selectors are the tokens’ own (so the logo goes dark exactly when the tokens do)', () => {
    const norm = (s: string) => s.replace(/"/g, "'").replace(/\s+/g, ' ').trim();
    const tokens = norm(tokensCss);
    const selectors = [
      ":root:not([data-theme='light'])",
      "[data-brand='sst'][data-theme='dark']",
      "[data-brand='sst']:not([data-theme='light'])",
      "[data-brand='ssb'], [data-brand='ssb'][data-theme='light']",
      "[data-brand='ssb'][data-theme='dark']",
      "[data-brand='ssb']:not([data-theme='light'])",
      "[data-theme='light']",
    ];
    const brand = norm(brandCss);
    for (const sel of selectors) {
      expect(tokens).toContain(`${sel} {`);
      expect(brand).toContain(`${sel} {`);
    }
  });
});
