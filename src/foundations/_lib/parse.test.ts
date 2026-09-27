/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';

import themeCss from '../../styles/theme.css?raw';
import tokensCss from '../../styles/tokens.generated.css?raw';
import auditTxt from '../_generated/audit.txt?raw';
import semanticJson from '../_generated/semantic.color.json?raw';
import scalesJson from '../_generated/primitive.scales.json?raw';
import {
  THEMES,
  dotToVar,
  isTranslucent,
  parseAudit,
  parseBezier,
  parseBreakpointVariants,
  parseDtcg,
  parseThemeBridge,
  parseTokens,
  parseTypeRoles,
  splitTopLevel,
} from './parse';

/* Small fixtures pin the grammar; the real files pin that the grammar still fits. */

const FIXTURE_CSS = `
/* comment { with braces } */
:root {
  --space-4: 1rem;
  --color-neutral-light-1: #FFFFFF;
  --surface-page: #FFFFFF;
  --type-h1-size: 1.5rem;
}
@media (min-width: 672px) {
  :root { --type-h1-size: 1.75rem; }
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --surface-page: #111111; }
}
[data-brand="sst"][data-theme="dark"] { --surface-page: #000000; }
[data-brand="ssb"], [data-brand="ssb"][data-theme="light"] { --surface-page: #FAFAFA; }
[data-brand="ssb"][data-theme="dark"] { --surface-page: #0A0A0A; }
[data-theme="light"] { --surface-page: #FFFFFF; }
@media (prefers-reduced-motion: reduce) { :root { --motion-duration-fast: 1ms; } }
`;

describe('parseTokens', () => {
  it('resolves the four themes the way the cascade does', () => {
    const t = parseTokens(FIXTURE_CSS);
    expect(t.semantic).toEqual(['--surface-page']);
    expect(t.themes['sst-light']['--surface-page']).toBe('#FFFFFF');
    expect(t.themes['sst-dark']['--surface-page']).toBe('#000000');
    // `[data-theme="light"]` (one attribute) must not beat the SSB rule (two).
    expect(t.themes['ssb-light']['--surface-page']).toBe('#FAFAFA');
    expect(t.themes['ssb-dark']['--surface-page']).toBe('#0A0A0A');
  });

  it('separates primitives, responsive steps and reduced motion', () => {
    const t = parseTokens(FIXTURE_CSS);
    expect(t.primitives).toEqual({
      '--space-4': '1rem',
      '--color-neutral-light-1': '#FFFFFF',
      '--type-h1-size': '1.5rem',
    });
    expect(t.responsive).toEqual([{ minWidth: 672, values: { '--type-h1-size': '1.75rem' } }]);
    expect(t.reducedMotion).toEqual({ '--motion-duration-fast': '1ms' });
  });

  it('reads the real tokens.generated.css', () => {
    const t = parseTokens(tokensCss);
    expect(t.semantic.length).toBeGreaterThan(100);
    for (const key of THEMES) {
      // Every semantic token has a value in every theme.
      expect(t.semantic.filter((n) => !t.themes[key][n])).toEqual([]);
    }
    expect(t.themes['sst-light']['--surface-page']).not.toBe(t.themes['sst-dark']['--surface-page']);
    expect(Object.keys(t.primitives).filter((n) => n.startsWith('--color-')).length).toBeGreaterThan(250);
    expect(t.responsive[0]!.values['--space-gutter']).toBeDefined();
  });
});

describe('parseThemeBridge', () => {
  it('maps tokens to the utilities that read them', () => {
    const map = parseThemeBridge(`
      @theme { --color-*: initial; --breakpoint-sm: 672px; }
      @theme inline {
        --color-surface-raised: var(--surface-raised);
        --spacing-0\\.5: var(--space-0-5);
        --font-weight-bold: var(--font-weight-bold);
        --radius-md: var(--radius-md);
        --animate-x: x 1s var(--motion-easing-linear) infinite;
        @keyframes x { from { opacity: 0; } }
        --z-index-toast: var(--z-toast);
      }`);
    expect(map['--surface-raised']![0]!.classes).toEqual(['bg-surface-raised', 'text-surface-raised', 'border-surface-raised']);
    expect(map['--space-0-5']![0]!.classes[0]).toBe('p-0.5');
    expect(map['--font-weight-bold']![0]!.classes).toEqual(['font-bold']);
    expect(map['--radius-md']![0]!.classes).toEqual(['rounded-md']);
    expect(map['--z-toast']![0]!.classes).toEqual(['z-toast']);
    expect(map['--motion-easing-linear']).toBeUndefined();
  });

  it('reads the real theme.css: semantics mapped, primitives not', () => {
    const map = parseThemeBridge(themeCss);
    expect(map['--surface-raised']![0]!.classes[0]).toBe('bg-surface-raised');
    expect(map['--content-secondary']![0]!.classes).toContain('text-content-secondary');
    expect(map['--size-measure-max']![0]!.classes).toEqual(['max-w-measure']);
    expect(Object.keys(map).filter((n) => /^--color-(neutral|sst|ssb)-/.test(n))).toEqual([]);
    expect(parseBreakpointVariants(themeCss).sm).toBe('672px');
  });

  it('reads the type roles', () => {
    const roles = parseTypeRoles(themeCss);
    const h1 = roles.find((r) => r.name === 'type-h1')!;
    expect(h1.declarations).toContainEqual(['font-size', 'var(--type-h1-size)']);
    expect(roles.find((r) => r.name === 'type-eyebrow')!.declarations).toContainEqual(['text-transform', 'uppercase']);
  });
});

describe('parseAudit', () => {
  const FIXTURE = [
    '  SST  /  LIGHT',
    '  PASS    5.68:1  (min 4.5)  secondary text on the tray                 content.secondary on surface.tray',
    '  PASS    3.41:1  (min 3.0)  input border against the page  [1.4.11]    border.control on surface.page',
    '  EXCP    3.60:1  (min 4.5)  destructive button label, hovered          action.danger.fg on action.danger.bgHover  [declared, 2026-09-23]',
    '  PASS    9.29:1  (min 4.5)  onImage: ink action label                  onImage.action.fg on onImage.ink',
    '',
    'OVERLAY SCRIM - the modal veil',
    '  sst-light  surface.page      #FFFFFF -> #737373',
    '  sst-light  panel #FFFFFF vs dimmed page #737373: 4.74:1 (undimmed 1.00:1)   edge #E4E4E4 vs dimmed page: 3.73:1',
    'GLASS - translucent tints',
    '  sst-dark   glass.onImage.surfaceHover   worst  5.25:1  over scrim over white',
    'DECLARED EXCEPTIONS (ALLOWED_HOVER_FAILS)',
    '  7 pairing(s), all hover fills.',
  ].join('\n');

  it('parses pairings, flags and notes', () => {
    const a = parseAudit(FIXTURE);
    expect(a.pairings['sst-light']).toEqual([
      { status: 'PASS', ratio: 5.68, min: 4.5, label: 'secondary text on the tray', fg: '--content-secondary', bg: '--surface-tray', nonText: false, note: undefined },
      { status: 'PASS', ratio: 3.41, min: 3, label: 'input border against the page', fg: '--border-control', bg: '--surface-page', nonText: true, note: undefined },
      { status: 'EXCP', ratio: 3.6, min: 4.5, label: 'destructive button label, hovered', fg: '--action-danger-fg', bg: '--action-danger-bg-hover', nonText: false, note: 'declared, 2026-09-23' },
      { status: 'PASS', ratio: 9.29, min: 4.5, label: 'onImage: ink action label', fg: '--on-image-action-fg', bg: '--on-image-ink', nonText: false, note: undefined },
    ]);
    expect(a.scrim['sst-light']).toEqual([{ token: '--surface-page', from: '#FFFFFF', to: '#737373' }]);
    expect(a.scrimNotes['sst-light']).toEqual([
      'panel #FFFFFF vs dimmed page #737373: 4.74:1 (undimmed 1.00:1) · edge #E4E4E4 vs dimmed page: 3.73:1',
    ]);
    expect(a.glass['sst-dark']).toEqual([{ token: '--glass-on-image-surface-hover', worst: 5.25, over: 'scrim over white' }]);
    expect(a.exceptions).toHaveLength(2);
  });

  it('reads the real audit.txt: every pairing names real tokens', () => {
    const a = parseAudit(auditTxt);
    const t = parseTokens(tokensCss);
    for (const key of THEMES) {
      expect(a.pairings[key].length).toBeGreaterThan(40);
      const unknown = a.pairings[key].flatMap((p) => [p.fg, p.bg]).filter((n) => !t.themes[key][n]);
      expect(unknown).toEqual([]);
    }
    expect(Object.values(a.pairings).flat().some((p) => p.status === 'EXCP')).toBe(true);
  });
});

describe('parseDtcg', () => {
  it('keys semantic descriptions and aliases by CSS variable', () => {
    const d = parseDtcg(semanticJson);
    expect(d.tokens['--surface-raised-hover']!.description).toMatch(/raised/);
    expect(d.tokens['--surface-page']!.alias['sst-light']).toBe('neutral.light.1');
    expect(d.tokens['--accent1-surface']).toBeDefined();
    const t = parseTokens(tokensCss);
    const colours = t.semantic.filter((n) => !n.startsWith('--shadow-'));
    expect(colours.filter((n) => !d.tokens[n])).toEqual([]);
  });

  it('reads scale descriptions and group descriptions', () => {
    const d = parseDtcg(scalesJson);
    expect(d.tokens['--space-0-5']).toBeDefined();
    expect(d.tokens['--size-touch-min']!.description).toMatch(/touch/);
    expect(d.groups.radius).toBeDefined();
  });
});

describe('helpers', () => {
  it('convert and split values', () => {
    expect(dotToVar('onImage.action.fgHover')).toBe('--on-image-action-fg-hover');
    expect(dotToVar('accent1.onSolid')).toBe('--accent1-on-solid');
    expect(isTranslucent('#000000B8')).toBe(true);
    expect(isTranslucent('#FFFFFFFF')).toBe(false);
    expect(isTranslucent('#171717')).toBe(false);
    expect(splitTopLevel('0 1px 2px rgba(0,0,0,.7), 0 4px 14px rgba(0,0,0,.6)')).toHaveLength(2);
    expect(parseBezier('cubic-bezier(0.34, 1.56, 0.64, 1)')).toEqual([0.34, 1.56, 0.64, 1]);
  });
});
