/// <reference types="vite/client" />
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { gsap } from 'gsap';
import { afterEach, describe, expect, it } from 'vitest';

import tokensCss from '../styles/tokens.generated.css?raw';
import { CountUp, Reveal, Stagger, TextReveal, ease, entrance, motionTokens, registerSsxMotion, stagger } from './index';

afterEach(() => {
  gsap.globalTimeline.clear();
});

const cssVar = (name: string) => tokensCss.match(new RegExp(`^\\s*--${name}:\\s*([^;]+);`, 'm'))?.[1]?.trim();

/** y of a cubic-bezier at x, by bisection on the x polynomial. */
function bezierAt([x1, y1, x2, y2]: readonly number[], x: number): number {
  const at = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (at(x1!, x2!, mid) < x) lo = mid;
    else hi = mid;
  }
  return at(y1!, y2!, (lo + hi) / 2);
}

describe('the GSAP scale is the CSS scale', () => {
  it('every duration matches --motion-duration-* (seconds vs ms)', () => {
    for (const [name, seconds] of Object.entries(motionTokens.duration)) {
      expect(cssVar(`motion-duration-${name}`), name).toBe(`${Math.round(seconds * 1000)}ms`);
    }
  });

  it('every curve matches --motion-easing-* and is registered as ssx-<name>', () => {
    registerSsxMotion();
    for (const [name, points] of Object.entries(motionTokens.easing)) {
      const kebab = name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      expect(cssVar(`motion-easing-${kebab}`), name).toBe(`cubic-bezier(${points.join(', ')})`);
      const fn = gsap.parseEase(ease(name as keyof typeof motionTokens.easing));
      expect(typeof fn, ease(name as keyof typeof motionTokens.easing)).toBe('function');
      for (const x of [0.25, 0.5, 0.75]) expect(fn(x)).toBeCloseTo(bezierAt(points, x), 2);
    }
  });

  it('offsets are the CSS rem', () => {
    for (const [name, value] of Object.entries(motionTokens.offset)) {
      expect(cssVar(`motion-offset-${name}`), name).toBe(value);
    }
  });

  it('entrance intents read the scale', () => {
    expect(entrance()).toEqual({ duration: motionTokens.duration.slow, ease: 'ssx-productive-entrance' });
    expect(entrance('expressive')).toEqual({ duration: motionTokens.duration.slower, ease: 'ssx-expressive-entrance' });
  });

  it('registerSsxMotion({ defaults: true }) points gsap.defaults at the system', () => {
    const before = { ...gsap.defaults() };
    registerSsxMotion({ defaults: true });
    const defaults = gsap.defaults();
    expect(defaults.duration).toBe(motionTokens.duration.normal);
    // GSAP stores the default ease parsed, so compare the curve, not the name.
    const set = defaults.ease as (t: number) => number;
    for (const x of [0.25, 0.5, 0.75]) expect(set(x)).toBeCloseTo(gsap.parseEase('ssx-productive-in-out')(x), 5);
    gsap.defaults(before);
  });
});

describe('primitives', () => {
  it('Reveal: content is rendered, and it enters on the productive entrance', () => {
    render(<Reveal data-testid="r">Hello</Reveal>);
    const el = screen.getByTestId('r');
    expect(el).toHaveTextContent('Hello');
    const [tween] = gsap.getTweensOf(el);
    expect(tween).toBeDefined();
    expect(tween!.duration()).toBe(motionTokens.duration.slow);
    expect(tween!.vars.ease).toBe('ssx-productive-entrance');
  });

  it('Reveal asChild renders the child, with no wrapper', () => {
    render(
      <Reveal asChild>
        <section data-testid="s">x</section>
      </Reveal>,
    );
    expect(screen.getByTestId('s')).toHaveAttribute('data-slot', 'reveal');
  });

  it('Stagger: its direct children enter one interval apart', () => {
    render(
      <Stagger data-testid="list">
        <p>a</p>
        <p>b</p>
        <p>c</p>
      </Stagger>,
    );
    const children = Array.from(screen.getByTestId('list').children);
    const [tween] = gsap.getTweensOf(children[0]!);
    expect(tween).toBeDefined();
    expect(tween!.vars.stagger).toBe(motionTokens.stagger.base);
  });

  it('TextReveal keeps one accessible string', () => {
    render(<TextReveal data-testid="t">Learn to build</TextReveal>);
    const el = screen.getByTestId('t');
    // The label is the guarantee; jsdom has no layout, so SplitText's own
    // spacing inside the (aria-hidden) pieces is not asserted here.
    expect(el).toHaveAttribute('aria-label', 'Learn to build');
    expect(el.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it('CountUp: the final value is the accessible text; the counting digits are hidden', () => {
    render(<CountUp value={1200} format={(n) => `${Math.round(n)}+`} data-testid="c" />);
    const el = screen.getByTestId('c');
    expect(el).toHaveClass('tabular-nums');
    expect(el.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByText('1200+', { selector: '[data-slot="visually-hidden"], span:not([aria-hidden])' })).toBeInTheDocument();
  });
});

describe('reduced motion', () => {
  it('under data-motion="reduce" nothing tweens and nothing is split', () => {
    render(
      <div data-motion="reduce">
        <Reveal data-testid="r">a</Reveal>
        <Stagger data-testid="s">
          <p>b</p>
        </Stagger>
        <TextReveal data-testid="t">Plain text</TextReveal>
        <CountUp value={5} data-testid="c" />
      </div>,
    );
    expect(gsap.getTweensOf(screen.getByTestId('r'))).toHaveLength(0);
    expect(gsap.getTweensOf(screen.getByTestId('s').children[0]!)).toHaveLength(0);
    expect(screen.getByTestId('t').children).toHaveLength(0);
    expect(screen.getByTestId('c').querySelector('[aria-hidden="true"]')!.textContent).toBe('5');
    const probe = document.createElement('div');
    probe.setAttribute('data-motion', 'reduce');
    document.body.appendChild(probe);
    expect(stagger('base', probe)).toBe(0);
    probe.remove();
  });
});

/**
 * The motion layer's own gate: every duration, delay, distance, interval and
 * curve in a tween comes from `motionTokens` / `ease()`. Same rule as
 * `styles/foundations-only.test.ts`, for the JS side.
 */
describe('no literal timing in the motion layer', () => {
  const sources = import.meta.glob('./*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  it('tween vars take tokens, never numbers or stock ease names', () => {
    const offenders = Object.entries(sources)
      .filter(([f]) => !/\.test\.|generated/.test(f))
      .flatMap(([f, src]) =>
        [
          ...src.matchAll(
            /\b(duration|delay|stagger|x|y|scale|rotate|autoAlpha|opacity)\s*:\s*-?\d*\.?\d+(?!\s*[,}]?\s*\/\/ mechanic)|\bease\s*:\s*['"`](?!ssx-)[^'"`]+['"`]|\bstart\s*:\s*['"`][^'"`]*\d/g,
          ),
        ]
          .map((m) => m[0])
          .filter((m) => !/^(autoAlpha|opacity)\s*:\s*[01]$/.test(m) && !/^delay\s*:\s*0$/.test(m))
          .map((m) => `${f}: ${m}`),
      );
    expect(offenders).toEqual([]);
  });
});
