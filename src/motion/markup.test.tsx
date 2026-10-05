import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { gsap } from 'gsap';
import { afterEach, describe, expect, it } from 'vitest';

import {
  MotionScope,
  Reveal,
  applyMotion,
  holdMotion,
  motionNoFlashScript,
  motionProps,
  motionTokens,
} from './index';

const stops: Array<() => void> = [];
afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  document.documentElement.removeAttribute('data-motion-hold');
  document.body.innerHTML = '';
  gsap.globalTimeline.clear();
});

/** Static HTML, as a server renders it, and the runtime over it. */
function page(html: string, observe = true) {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.appendChild(root);
  stops.push(applyMotion(root, { observe }));
  return root;
}

const tweenOf = (el: Element) => gsap.getTweensOf(el).find((t) => t.duration() > 0);

describe('the attribute contract', () => {
  it('motionProps writes the attributes, typed', () => {
    expect(motionProps({ reveal: 'fade-up', trigger: 'in-view', delay: 'slow' })).toEqual({
      'data-ssx-reveal': 'fade-up',
      'data-ssx-trigger': 'in-view',
      'data-ssx-delay': 'slow',
    });
    expect(motionProps({ stagger: 'scale', interval: 'tight', intent: 'expressive' })).toEqual({
      'data-ssx-stagger': 'scale',
      'data-ssx-interval': 'tight',
      'data-ssx-intent': 'expressive',
    });
  });

  it('the no-flash script marks <html> pending, and only when motion is allowed', () => {
    // jsdom has no matchMedia: motion is allowed.
    new Function(motionNoFlashScript)();
    expect(document.documentElement).toHaveAttribute('data-ssx-motion-pending');
    document.documentElement.removeAttribute('data-ssx-motion-pending');
  });
});

describe('applyMotion', () => {
  it('a reveal is armed with its start state drawn, on the productive entrance, transitions held off', () => {
    const root = page('<section data-ssx-reveal="fade-up">Placements 2026</section>');
    const el = root.querySelector('section')!;
    expect(el).toHaveAttribute('data-ssx-motion', 'armed');
    expect(el.style.transition).toBe('none');
    const tween = tweenOf(el)!;
    expect(tween.duration()).toBe(motionTokens.duration.slow);
    expect(tween.vars.ease).toBe('ssx-productive-entrance');
    expect(tween.paused()).toBe(false);
    tween.progress(1);
    expect(el).toHaveAttribute('data-ssx-motion', 'done');
    // Back on its stylesheet: nothing left inline.
    expect(el.style.transition).toBe('');
    expect(el.style.opacity).toBe('');
  });

  it('modifiers read the token steps; unknown values fall back to the defaults', () => {
    const root = page(
      '<p data-ssx-reveal="scale" data-ssx-intent="expressive" data-ssx-delay="normal">a</p>' +
        '<p data-ssx-reveal="wobble" data-ssx-delay="forever">b</p>',
    );
    const [a, b] = Array.from(root.querySelectorAll('p'));
    const ta = tweenOf(a!)!;
    expect(ta.duration()).toBe(motionTokens.duration.slower);
    expect(ta.delay()).toBe(motionTokens.duration.normal);
    expect(ta.vars.scale).toBe(motionTokens.scale.enter);
    const tb = tweenOf(b!)!;
    expect(tb.vars.y).toBe(motionTokens.offset.reveal);
    expect(tb.delay()).toBe(0);
  });

  it('a stagger enters its direct children one interval apart', () => {
    const root = page('<ul data-ssx-stagger="fade" data-ssx-interval="tight"><li>a</li><li>b</li><li>c</li></ul>');
    const tween = tweenOf(root.querySelector('li')!)!;
    expect(tween.vars.stagger).toBe(motionTokens.stagger.tight);
    expect(root.querySelector('ul')).toHaveAttribute('data-ssx-motion', 'armed');
  });

  it('under data-motion-hold the start state is drawn but nothing plays until the hold is released', async () => {
    const release = holdMotion();
    const root = page('<section data-ssx-reveal>Hero</section>');
    const el = root.querySelector('section')!;
    expect(el).toHaveAttribute('data-ssx-motion', 'armed');
    expect(el.style.opacity).toBe('0');
    expect(tweenOf(el)!.paused()).toBe(true);
    release();
    await waitFor(() => expect(tweenOf(el)!.paused()).toBe(false));
  });

  it('in-view waits for the element to cross motion.viewport.enter', () => {
    const observers: Array<{ cb: IntersectionObserverCallback; margin?: string }> = [];
    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class {
      constructor(cb: IntersectionObserverCallback, init?: IntersectionObserverInit) {
        observers.push({ cb, margin: init?.rootMargin });
      }
      observe() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
    try {
      const root = page('<section data-ssx-reveal data-ssx-trigger="in-view">Below the fold</section>');
      const el = root.querySelector('section')!;
      expect(tweenOf(el)!.paused()).toBe(true);
      expect(observers[0]!.margin).toBe(`0px 0px -${motionTokens.viewport.enter} 0px`);
      observers[0]!.cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      expect(tweenOf(el)!.paused()).toBe(false);
    } finally {
      globalThis.IntersectionObserver = original;
    }
  });

  it('under data-motion="reduce" it marks targets done and never tweens', () => {
    const root = page('<div data-motion="reduce"><section data-ssx-reveal>a</section></div>');
    const el = root.querySelector('section')!;
    expect(el).toHaveAttribute('data-ssx-motion', 'done');
    expect(gsap.getTweensOf(el)).toHaveLength(0);
  });

  it('arms targets added later and reverts targets removed', async () => {
    const root = page('<div></div>');
    const late = document.createElement('section');
    late.setAttribute('data-ssx-reveal', '');
    root.appendChild(late);
    await waitFor(() => expect(late).toHaveAttribute('data-ssx-motion', 'armed'));
    late.remove();
    await waitFor(() => expect(late).not.toHaveAttribute('data-ssx-motion'));
    expect(late.style.opacity).toBe('');
  });

  it('a text reveal loads SplitText on demand and keeps one accessible string', async () => {
    const root = page('<h1 data-ssx-text-reveal="words">Learn to build</h1>');
    const h1 = root.querySelector('h1')!;
    await waitFor(() => expect(h1).toHaveAttribute('aria-label', 'Learn to build'));
    const words = Array.from(h1.querySelectorAll('[aria-hidden="true"]'));
    expect(words.length).toBeGreaterThan(0);
    const tween = gsap.getTweensOf(words).find((t) => t.duration() > 0)!;
    expect(tween.vars.stagger).toBe(motionTokens.stagger.tight);
    expect(tween.vars.ease).toBe('ssx-expressive-entrance');
    // The line itself is visible again; its words carry the start state.
    expect(h1.style.opacity).toBe('1');
  });

  it('stopping reverts everything it armed', () => {
    const root = document.createElement('div');
    root.innerHTML = '<section data-ssx-reveal>a</section>';
    document.body.appendChild(root);
    const stop = applyMotion(root);
    const el = root.querySelector('section')!;
    expect(el.style.opacity).toBe('0');
    stop();
    expect(el).not.toHaveAttribute('data-ssx-motion');
    expect(el.style.opacity).toBe('');
  });
});

describe('<MotionScope>', () => {
  it('loads the runtime only when a target is inside it, and arms server-rendered markup', async () => {
    const { rerender } = render(
      <MotionScope data-testid="scope">
        <p>No motion here</p>
      </MotionScope>,
    );
    expect(screen.getByTestId('scope')).toHaveAttribute('data-slot', 'motion-scope');
    rerender(
      <MotionScope data-testid="scope">
        <section data-testid="block" {...motionProps({ reveal: 'fade-up' })}>
          Placements
        </section>
      </MotionScope>,
    );
    await waitFor(() => expect(screen.getByTestId('block')).toHaveAttribute('data-ssx-motion', 'armed'));
  });

  it('asChild puts the scope on the child', async () => {
    render(
      <MotionScope asChild>
        <main data-testid="main">
          <section data-testid="block" data-ssx-reveal="">
            a
          </section>
        </main>
      </MotionScope>,
    );
    expect(screen.getByTestId('main')).toHaveAttribute('data-slot', 'motion-scope');
    await waitFor(() => expect(screen.getByTestId('block')).toHaveAttribute('data-ssx-motion', 'armed'));
  });

  it('under reduced motion it never loads anything', async () => {
    render(
      <div data-motion="reduce">
        <MotionScope>
          <section data-testid="block" data-ssx-reveal="">
            a
          </section>
        </MotionScope>
      </div>,
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByTestId('block')).not.toHaveAttribute('data-ssx-motion');
  });
});

describe('the components honour the same gates', () => {
  it('Reveal holds CSS transitions off while it plays (a Button would otherwise stay invisible)', () => {
    render(<Reveal data-testid="r">a</Reveal>);
    expect(screen.getByTestId('r').style.transition).toBe('none');
  });

  it('Reveal under data-motion-hold is hidden and waits for the release', async () => {
    const release = holdMotion();
    render(<Reveal data-testid="r">a</Reveal>);
    const el = screen.getByTestId('r');
    expect(el.style.opacity).toBe('0');
    expect(tweenOf(el)!.paused()).toBe(true);
    release();
    await waitFor(() => expect(tweenOf(el)!.paused()).toBe(false));
  });
});
