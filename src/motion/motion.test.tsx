/// <reference types="vite/client" />
import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { gsap } from 'gsap';
import { afterEach, describe, expect, it } from 'vitest';

import tokensCss from '../styles/tokens.generated.css?raw';
import {
  CountUp,
  Reveal,
  Stagger,
  TextReveal,
  applyMotion,
  ease,
  entrance,
  holdMotion,
  motionProps,
  motionTokens,
  registerSsxMotion,
  stagger,
} from './index';

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

  it('count durations match --motion-count-*', () => {
    for (const [name, seconds] of Object.entries(motionTokens.count)) {
      expect(cssVar(`motion-count-${name}`), name).toBe(`${Math.round(seconds * 1000)}ms`);
    }
    expect(cssVar('motion-scale-count')).toBe(String(motionTokens.scale.count));
    expect(cssVar('motion-blur-count')).toBe(motionTokens.blur.count);
    expect(cssVar('motion-blur-text')).toBe(motionTokens.blur.text);
    expect(cssVar('motion-scale-text')).toBe(String(motionTokens.scale.text));
    expect(cssVar('motion-blur-wipe')).toBe(motionTokens.blur.wipe);
    expect(cssVar('motion-stagger-wipe')).toBe(`${Math.round(motionTokens.stagger.wipe * 1000)}ms`);
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

describe('CountUp versions', () => {
  const tweens = (el: Element) => gsap.getTweensOf(el).filter((t) => t.duration() > 0);

  it('default: counts over motion.count.medium, and the figure itself does not move', () => {
    render(<CountUp value={1200} data-testid="c" />);
    const el = screen.getByTestId('c');
    expect(el).toHaveAttribute('data-entrance', 'none');
    expect(el).toHaveAttribute('data-speed', 'medium');
    const digits = el.querySelector('[aria-hidden="true"]')!;
    expect(tweens(digits)).toHaveLength(0);
    const counter = gsap.globalTimeline.getChildren(true, true, false).find((t) => 'n' in (t.vars as object))!;
    expect(counter.duration()).toBe(motionTokens.count.medium);
  });

  it('fade-scale: every digit is its own piece, aligned from the right, waiting hidden until the count starts', () => {
    const release = holdMotion();
    render(<CountUp value={1200} from={0} entrance="fade-scale" speed="slow" data-testid="c" />);
    const digits = screen.getByTestId('c').querySelector<HTMLElement>('[aria-hidden="true"]')!;
    const pieces = () => Array.from(digits.children) as HTMLElement[];
    // Held (a splash): the start value is drawn as pieces, hidden.
    expect(pieces().map((p) => p.textContent)).toEqual(['0']);
    expect(pieces()[0]!.style.display).toBe('inline-block');
    expect(pieces()[0]!.style.opacity).toBe('0');
    release();
    // The accessible text is the final value throughout.
    expect(screen.getByText('1,200', { selector: '[data-slot="visually-hidden"]' })).toBeInTheDocument();
  });

  it('fade-scale: a settled digit pops (fade, grow, sharpen); a racing one only sharpens; a new place pops in', () => {
    render(<CountUp value={10} entrance="fade-scale" speed="slow" data-testid="c" />);
    const counter = gsap.globalTimeline.getChildren(true, true, false).find((t) => 'n' in (t.vars as object))!;
    expect(counter.duration()).toBe(motionTokens.count.slow);
    const digits = screen.getByTestId('c').querySelector<HTMLElement>('[aria-hidden="true"]')!;
    const live = (el: Element) => gsap.getTweensOf(el).filter((t) => t.duration() > 0);
    const latest = (el: Element) => live(el).slice(-1)[0]!;

    // Started, still "0": the waiting piece pops.
    counter.progress(0.0001);
    const units = digits.lastElementChild as HTMLElement;
    expect(units.textContent).toBe('0');
    expect(latest(units).vars).toMatchObject({ autoAlpha: 1, scale: 1, filter: 'blur(0px)' });
    expect(gsap.getProperty(units, 'scale')).toBeLessThan(1);

    // Changed again within duration.normal: racing — no fade, no grow, only motion blur settling.
    counter.progress(0.3);
    expect(units.textContent).not.toBe('0');
    expect(latest(units).vars.filter).toBe('blur(0px)');
    expect(latest(units).vars.scale).toBeUndefined();
    expect(latest(units).vars.autoAlpha).toBeUndefined();
    expect(units.style.filter).toBe(`blur(${motionTokens.blur.count})`);

    // 10: a new place appears on the left and pops in on its own.
    counter.progress(1);
    expect(Array.from(digits.children).map((p) => p.textContent)).toEqual(['1', '0']);
    const tens = digits.firstElementChild as HTMLElement;
    expect(latest(tens).vars).toMatchObject({ autoAlpha: 1, scale: 1 });
  });
});

describe('TextReveal presets', () => {
  const live = (els: Element[]) => gsap.getTweensOf(els).filter((t) => t.duration() > 0);

  it('rise (default) is unchanged: pieces fade in and rise motion.offset.enter', () => {
    render(<TextReveal data-testid="t">Learn to build</TextReveal>);
    const el = screen.getByTestId('t');
    expect(el).toHaveAttribute('data-preset', 'rise');
    const words = Array.from(el.querySelectorAll('[aria-hidden="true"]'));
    const [tween] = live(words);
    expect(tween!.vars.y).toBe(motionTokens.offset.enter);
    expect(tween!.vars.stagger).toBe(motionTokens.stagger.tight);
  });

  it('blur by letter: each letter fades in, grows from motion.scale.text and sharpens from motion.blur.text', () => {
    render(
      <TextReveal preset="blur" by="chars" data-testid="t">
        Build
      </TextReveal>,
    );
    const el = screen.getByTestId('t');
    expect(el).toHaveAttribute('aria-label', 'Build');
    const letters = Array.from(el.querySelectorAll('[aria-hidden="true"] *'));
    expect(letters.length).toBe(5);
    const [tween] = live(letters);
    expect(tween!.vars).toMatchObject({ autoAlpha: 1, scale: 1, filter: 'blur(0em)' });
    expect(tween!.vars.startAt).toMatchObject({
      autoAlpha: 0,
      scale: motionTokens.scale.text,
      filter: `blur(${motionTokens.blur.text})`,
    });
  });

  it('blur by word works the same, on words', () => {
    render(
      <TextReveal preset="blur" data-testid="t">
        Learn to build
      </TextReveal>,
    );
    const words = Array.from(screen.getByTestId('t').querySelectorAll('[aria-hidden="true"]'));
    expect(words).toHaveLength(3);
    expect(live(words)[0]!.vars.filter).toBe('blur(0em)');
  });

  it('wipe: per word, a brand block slides up over it, then the word slides in and pushes it off; words overlap', () => {
    render(
      <TextReveal preset="wipe" by="chars" data-testid="t">
        Learn to build
      </TextReveal>,
    );
    const el = screen.getByTestId('t');
    expect(el).toHaveAttribute('aria-label', 'Learn to build');
    // Always by word, even when asked for letters.
    const words = Array.from(el.children) as HTMLElement[];
    expect(words).toHaveLength(3);
    for (const word of words) {
      const [text, bar] = Array.from(word.children) as HTMLElement[];
      expect(word.style.position).toBe('relative');
      expect(word.style.clipPath).toBe('inset(0)');
      expect(gsap.getProperty(text!, 'yPercent')).toBe(100);
      expect(bar).toHaveAttribute('aria-hidden', 'true');
      expect(bar!.style.position).toBe('absolute');
      expect(bar!.style.background).toContain('--surface-brand-solid');
      expect(bar!.style.background).toContain('--ssx-text-wipe');
      expect(gsap.getProperty(bar!, 'yPercent')).toBe(100);
    }
    const tweensOf = (el: Element) => gsap.getTweensOf(el).filter((t) => t.duration() > 0);
    const covers = words.map((w) => tweensOf(w.children[1]!).find((t) => t.vars.yPercent === 0)!);
    // One word's wipe to the next is motion.stagger.wipe, far shorter than a wipe: tight overlap.
    expect(covers[1]!.startTime() - covers[0]!.startTime()).toBeCloseTo(motionTokens.stagger.wipe);
    expect(covers[0]!.duration()).toBe(motionTokens.duration.fast);
    // The push: the word and the block move together, the word in, the block off the top.
    const [textIn] = tweensOf(words[0]!.children[0]!);
    const barOff = tweensOf(words[0]!.children[1]!).find((t) => t.vars.yPercent === -100)!;
    expect(textIn!.startTime()).toBeCloseTo(barOff.startTime());
    expect(textIn!.duration()).toBe(motionTokens.duration.normal);
    expect(barOff.duration()).toBe(motionTokens.duration.normal);
    const timeline = covers[0]!.parent!;
    const wipe = motionTokens.duration.fast + motionTokens.duration.normal;
    expect(motionTokens.stagger.wipe).toBeLessThan(wipe / 4);
    expect(timeline.duration()).toBeCloseTo(2 * motionTokens.stagger.wipe + wipe);
    // Played through: every word in place and unclipped, every block gone.
    timeline.progress(1);
    for (const word of words) {
      expect(gsap.getProperty(word.children[0]!, 'yPercent')).toBe(0);
      expect(gsap.getProperty(word.children[1]!, 'yPercent')).toBe(-100);
      // The block is hidden before the clip comes off: no sliver of brand colour above the word.
      expect((word.children[1] as HTMLElement).style.visibility).toBe('hidden');
      expect(word.style.clipPath).toBe('');
    }
  });

  it('by lines: one box per line around its own text; a wipe block per line; the split is undone at the end', () => {
    render(
      <TextReveal preset="wipe" by="lines" data-testid="t">
        Learn to build what the world runs on
      </TextReveal>,
    );
    const el = screen.getByTestId('t');
    expect(el).toHaveAttribute('aria-label', 'Learn to build what the world runs on');
    // jsdom has no layout, so the headline is one line here; the browser story shows several.
    const lines = Array.from(el.children) as HTMLElement[];
    expect(lines.length).toBeGreaterThan(0);
    const box = lines[0]!.firstElementChild as HTMLElement;
    expect(box.style.display).toBe('inline-block');
    const [text, bar] = Array.from(box.children) as HTMLElement[];
    expect(text!.textContent).toBe('Learn to build what the world runs on');
    expect(bar!.style.background).toContain('--surface-brand-solid');
    const timeline = gsap.getTweensOf(bar!).find((t) => t.duration() > 0)!.parent!;
    timeline.progress(1);
    // Reverted: plain text again, so later resizes reflow normally.
    expect(el.innerHTML.trim()).toBe('Learn to build what the world runs on');
  });

  it('by lines for rise and blur staggers lines `base`, not `tight`', () => {
    render(
      <TextReveal preset="blur" by="lines" data-testid="t">
        Learn to build
      </TextReveal>,
    );
    const boxes = Array.from(screen.getByTestId('t').querySelectorAll('[aria-hidden="true"] > span'));
    const [tween] = gsap.getTweensOf(boxes).filter((t) => t.duration() > 0);
    expect(tween!.vars.stagger).toBe(motionTokens.stagger.base);
    expect(tween!.vars.filter).toBe('blur(0em)');
  });

  it('soft-wipe: a blurred brand gradient sweeps through each word, outside the clip; the word slides in under it', () => {
    render(
      <TextReveal preset="soft-wipe" data-testid="t">
        Learn to build
      </TextReveal>,
    );
    const el = screen.getByTestId('t');
    expect(el).toHaveAttribute('data-preset', 'soft-wipe');
    expect(el).toHaveAttribute('aria-label', 'Learn to build');
    const words = Array.from(el.children) as HTMLElement[];
    expect(words).toHaveLength(3);
    for (const word of words) {
      const [clip, glow] = Array.from(word.children) as HTMLElement[];
      // The text is clipped in its own box; the glow is NOT, so its blur spreads past the word.
      expect(clip!.style.clipPath).toBe('inset(0)');
      expect(word.style.clipPath).toBe('');
      expect(glow).toHaveAttribute('aria-hidden', 'true');
      expect(glow!.style.background).toContain('linear-gradient');
      expect(glow!.style.background).toContain('--surface-brand-subtle');
      expect(glow!.style.background).toContain('--surface-brand-solid');
      expect(glow!.style.filter).toBe(`blur(${motionTokens.blur.wipe})`);
      expect(glow!.style.opacity).toBe('0');
    }
    const glow0 = words[0]!.children[1]!;
    const timeline = gsap.getTweensOf(glow0).find((t) => t.duration() > 0)!.parent!;
    timeline.progress(1);
    for (const word of words) {
      const [clip, glow] = Array.from(word.children) as HTMLElement[];
      expect(gsap.getProperty(clip!.firstElementChild!, 'yPercent')).toBe(0);
      expect(glow!.style.opacity).toBe('0');
      expect(clip!.style.clipPath).toBe('');
    }
  });

  it('the same presets work from markup', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<h1 data-ssx-text-reveal="words" data-ssx-text-preset="wipe">Learn to build</h1>';
    document.body.appendChild(root);
    const stop = applyMotion(root);
    const h1 = root.querySelector('h1')!;
    await waitFor(() => expect(h1.querySelectorAll('[aria-hidden="true"] > span:last-child').length).toBe(3));
    expect(h1).toHaveAttribute('data-ssx-motion', 'armed');
    expect(motionProps({ text: 'lines', textPreset: 'wipe' })['data-ssx-text-reveal']).toBe('lines');
    expect(motionProps({ text: 'chars', textPreset: 'blur' })).toEqual({
      'data-ssx-text-reveal': 'chars',
      'data-ssx-text-preset': 'blur',
    });
    stop();
    // Reverted: the original text, unsplit.
    expect(h1.innerHTML).toBe('Learn to build');
    root.remove();
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
