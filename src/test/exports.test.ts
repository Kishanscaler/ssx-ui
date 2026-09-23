import { describe, expect, it } from 'vitest';

import * as pkg from '../index';

/**
 * Every capitalised export must be a renderable component. Both smoke
 * fixtures render each PascalCase export as `<X />`, so an ALL_CAPS or
 * PascalCase constant breaks `next build` ("Element type is invalid ... got:
 * object"). It happened twice (LOGO_BRAND_NAMES, STEPPER_STATUS_LABEL);
 * constants are camelCase. This fails in `npm test`, long before a smoke run.
 */
describe('public exports', () => {
  it('capitalised exports are components; constants are camelCase', () => {
    const bad = Object.entries(pkg)
      .filter(([name]) => /^[A-Z]/.test(name))
      .filter(([, value]) => {
        if (typeof value === 'function') return false;
        return !(value && typeof value === 'object' && '$$typeof' in value);
      })
      .map(([name]) => name);
    expect(bad).toEqual([]);
  });
});
