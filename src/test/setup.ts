import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';

/**
 * jsdom gaps that Radix primitives touch (Slider and Select measure with
 * ResizeObserver; Select scrolls items into view). Inert stand-ins: tests
 * assert behaviour and ARIA, not layout.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

/**
 * A React warning is a failed test. React reports every contract it thinks a
 * component broke (an unknown DOM prop, a missing key, a ref on a function
 * component, a controlled/uncontrolled switch) through `console.error`, and
 * those differ between React 16 and 19 — which is exactly what the second test
 * run exists to catch. A test that expects a warning can mock console itself.
 */
let spies: Array<ReturnType<typeof vi.spyOn>> = [];

beforeEach(() => {
  spies = [vi.spyOn(console, 'error'), vi.spyOn(console, 'warn')];
});

afterEach(() => {
  const calls = spies.flatMap((spy) => spy.mock.calls);
  spies.forEach((spy) => spy.mockRestore());
  if (calls.length) {
    throw new Error(`React (or a test) logged to console:\n${calls.map((c) => c.map(String).join(' ')).join('\n')}`);
  }
});
