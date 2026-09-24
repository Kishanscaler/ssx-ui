import { describe, expect, it } from 'vitest';

import tokensCss from '../styles/tokens.generated.css?raw';
import themeCss from '../styles/theme.css?raw';
import { SURFACE_INKS } from './surface-ink';

const sources = import.meta.glob('../components/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Shipped component files only: stories, tests and fixtures are not the package. */
const shipped = Object.entries(sources).filter(
  ([file]) => !/\.(stories|test)\.tsx$/.test(file) && !file.includes('/_fixtures/'),
);

const ROLES = [
  'ink',
  'ink-secondary',
  'link',
  'link-hover',
  'action-fg',
  'action-fg-hover',
  'action-bg-hover',
  'action-bg-active',
  'wash-bg-hover',
  'wash-bg-active',
];

describe('the surface-ink contract', () => {
  it('every fill has the full token family, and a Tailwind colour for each role', () => {
    for (const fill of SURFACE_INKS) {
      for (const role of ROLES) {
        expect(tokensCss, `--${fill}-${role}`).toContain(`--${fill}-${role}:`);
        expect(themeCss, `--color-${fill}-${role}`).toContain(`--color-${fill}-${role}: var(--${fill}-${role});`);
      }
    }
  });

  // "Nothing should be from outside" (2026-09-24). A component may set its OWN
  // private properties (`--button-ink`, `--db-ink`, `--link-on-ink`), never a
  // semantic role that another component reads.
  it('no shipped component re-points a semantic role', () => {
    const offenders: string[] = [];
    for (const [file, src] of shipped) {
      const hits = src.match(/\[--(action|content|border|surface|field|status|accent\d?)-[a-z0-9-]*:/g);
      if (hits) offenders.push(`${file}: ${hits.join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('no shipped component recolours another through a descendant selector', () => {
    // `[&_[data-slot=x]]:text-*` / `bg-*` / `border-*` / `[--*]` on a slot the
    // file does not render. Layout and sizing rules (gap, order, size, min-h)
    // are allowed; colour and state are not.
    const offenders: string[] = [];
    for (const [file, src] of shipped) {
      const re = /\[&[^\s'"]*?data-slot=([a-z-]+)[^\s'"]*?\]:(?:[a-z-]+:)*((?:text-|bg-|border-|fill-|stroke-|outline-|ring-|\[--)[^\s'"]*)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        const slotName = m[1];
        // A text SIZE (Chip sizes the Avatar initials it holds) is sizing, not colour.
        if (/^text-(\[[0-9.]+(rem|em)\]|xs|sm|base|md|lg|xl|[2-5]xl)$/.test(m[2] ?? '')) continue;
        if (!src.includes(`data-slot="${slotName}"`) && !src.includes(`'data-slot': '${slotName}'`)) {
          offenders.push(`${file}: ${m[0]}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
