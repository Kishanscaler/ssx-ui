import { describe, expect, it } from 'vitest';

import * as marketing from '../marketing';

/**
 * The same guard as exports.test.ts, for the marketing entry: every capitalised
 * export must be a renderable component, because both smoke fixtures render each
 * PascalCase export of `@kishanscaler/ssx-ui/marketing` as `<X />`. An ALL_CAPS
 * constant breaks `next build` ("Element type is invalid ... got: number"); it
 * happened once (RAIL_STEP_INTERVAL). Constants are camelCase.
 */
describe('marketing exports', () => {
  it('capitalised exports are components; constants are camelCase', () => {
    const bad = Object.entries(marketing)
      .filter(([name]) => /^[A-Z]/.test(name))
      .filter(([, value]) => {
        if (typeof value === 'function') return false;
        return !(value && typeof value === 'object' && '$$typeof' in value);
      })
      .map(([name]) => name);
    expect(bad).toEqual([]);
  });

  it('exports the marketing vocabulary', () => {
    for (const name of ['SectionHeader', 'PhotoFrame', 'GlassPlate', 'LogoTile', 'Figure', 'PersonCard', 'ShowcaseCard', 'MediaCard', 'Rail', 'RailItem', 'CarouselNav', 'StatCard', 'StatGroup', 'ProfilePlate']) {
      expect(marketing, name).toHaveProperty(name);
    }
  });
});
