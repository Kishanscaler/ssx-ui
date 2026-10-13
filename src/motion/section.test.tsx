import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  Reveal,
  Stagger,
  applyMotion,
  isRowHeld,
  motionAttributes,
  motionProps,
  motionSelector,
  motionTokens,
  revealFrom,
  useSectionEntrance,
} from './index';
import { cardsOnScreen, sectionDeckStart, sectionHeaderStart } from './section';

const { duration: d, stagger: st, offset } = motionTokens;

/** ScrollTrigger needs matchMedia, which jsdom lacks. No query matches: motion is allowed. */
beforeAll(() => {
  window.matchMedia ??= ((media: string) => ({
    matches: false,
    media,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

const stops: Array<() => void> = [];
afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  document.documentElement.removeAttribute('data-motion-hold');
  document.body.innerHTML = '';
  gsap.globalTimeline.clear();
});

/** jsdom has no layout, so every `offsetParent` is null: give rendered elements their parent, `hidden` ones none. */
const offsetParent = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get(this: HTMLElement) {
      return this.closest('[hidden]') ? null : this.parentElement;
    },
  });
});
afterEach(() => {
  if (offsetParent) Object.defineProperty(HTMLElement.prototype, 'offsetParent', offsetParent);
});

function page(html: string) {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.appendChild(root);
  stops.push(applyMotion(root));
  return root;
}

const live = (el: Element) => gsap.getTweensOf(el).filter((t) => t.duration() > 0);
const clipOf = (el: Element) => live(el).find((t) => 'clipPath' in t.vars)!;

const card = (title: string, extra = '') =>
  `<article data-part="card">${extra}<img data-part="photo" alt="" />` +
  `<h3 data-part="title">${title}</h3><p data-part="description">Role</p><div data-part="logos"></div></article>`;

describe('the attribute contract', () => {
  it('section, wipe and the row hold are in the contract', () => {
    expect(motionProps({ section: 'header' })).toEqual({ 'data-ssx-section': 'header' });
    expect(motionProps({ reveal: 'wipe', trigger: 'in-view' })).toEqual({
      'data-ssx-reveal': 'wipe',
      'data-ssx-trigger': 'in-view',
    });
    expect(motionProps({ stagger: 'wipe' })).toEqual({ 'data-ssx-stagger': 'wipe' });
    expect(motionSelector).toContain('[data-ssx-section]');
    expect(motionAttributes.rowHold).toBe('data-ssx-hold');
    expect(revealFrom('wipe')).toEqual({ clipPath: 'inset(100% 0% 0% 0%)' });
  });

  it('isRowHeld reads data-ssx-hold on the row or above it', () => {
    const row = document.createElement('ul');
    row.innerHTML = '<li>a</li>';
    expect(isRowHeld(row)).toBe(false);
    row.setAttribute('data-ssx-hold', '');
    expect(isRowHeld(row)).toBe(true);
    expect(isRowHeld(row.firstElementChild)).toBe(true);
    expect(isRowHeld(null)).toBe(false);
  });

  it('the section starts are the page’s, from the in-view token', () => {
    expect(motionTokens.viewport.enter).toBe('10%');
    expect(sectionHeaderStart).toBe('clamp(top 85%)');
    expect(sectionDeckStart).toBe('clamp(top 75%)');
  });
});

describe('the wipe preset', () => {
  it('clips the card open from the bottom; its photo settles and its parts rise in at 45% of the wipe', () => {
    const root = page(card('Ada Lovelace').replace('<article', '<article data-ssx-reveal="wipe"'));
    const article = root.querySelector('article')!;
    expect(article).toHaveAttribute('data-ssx-motion', 'armed');
    expect(article).toHaveAttribute('data-ssx-wipe');

    const clip = clipOf(article);
    expect(clip.vars.startAt).toMatchObject({ clipPath: 'inset(100% 0% 0% 0% round 0px)' });
    expect(clip.vars.clipPath).toBe('inset(0% 0% 0% 0% round 0px)');
    expect(clip.duration()).toBeCloseTo(d.slower * 1.25);
    expect(clip.vars.ease).toBe('ssx-expressive-in-out');
    expect(article.style.clipPath).toBe('inset(100% 0% 0% 0% round 0px)');

    const photo = live(root.querySelector('img')!)[0]!;
    expect(photo.vars.startAt).toMatchObject({ scale: 1.18 });
    expect(photo.vars.scale).toBe(1);
    expect(photo.duration()).toBeCloseTo(d.slower * 1.5);

    const title = root.querySelector('h3')!;
    const rise = live(title)[0]!;
    expect(rise.vars.startAt).toMatchObject({ autoAlpha: 0, y: offset.reveal });
    expect(rise.vars.stagger).toBeCloseTo(st.base * 1.5);
    expect(rise.vars.ease).toBe('ssx-expressive-entrance');
    expect(rise.startTime()).toBeCloseTo(d.slower * 0.45);
    // The title, the description and the logos rise in together, one tween.
    expect(live(root.querySelector('[data-part="logos"]')!)[0]).toBe(rise);

    // Landed: open, unclipped, back on its stylesheet.
    clip.parent!.progress(1);
    expect(article.style.clipPath).toBe('');
    expect(title.style.opacity).toBe('');
    expect(article).toHaveAttribute('data-ssx-motion', 'done');
  });

  it('a stagger wipes its children one and a half intervals apart and holds the row until they land', () => {
    const root = page(`<ul data-ssx-stagger="wipe"><li>${card('A')}</li><li>${card('B')}</li><li>${card('C')}</li></ul>`);
    const row = root.querySelector('ul')!;
    const items = Array.from(row.children);
    const clips = items.map(clipOf);
    expect(clips[1]!.startTime() - clips[0]!.startTime()).toBeCloseTo(st.base * 1.5);
    expect(clips[2]!.startTime() - clips[1]!.startTime()).toBeCloseTo(st.base * 1.5);
    // The title belongs to its <li> (the nearest wipe owner), not to the row.
    expect(live(items[0]!.querySelector('h3')!)).toHaveLength(1);
    expect(isRowHeld(row)).toBe(true);
    clips[0]!.parent!.progress(1);
    expect(isRowHeld(row)).toBe(false);
  });

  it('a part belongs to its nearest wipe owner: a card in a wiping panel animates its own parts', () => {
    const root = page(
      `<section data-ssx-reveal="wipe"><h3 data-part="title">Panel</h3>` +
        `${card('Inner').replace('<article', '<article data-ssx-reveal="wipe"')}</section>`,
    );
    const [panelTitle, innerTitle] = Array.from(root.querySelectorAll('h3'));
    const panelRise = live(panelTitle!)[0]!;
    const innerRise = live(innerTitle!);
    expect(innerRise).toHaveLength(1);
    expect(innerRise[0]).not.toBe(panelRise);
    expect(innerRise[0]!.parent).toBe(clipOf(root.querySelector('article')!).parent);
  });

  it('a card’s eyebrow rises first, with its other parts', () => {
    const root = page(
      card('Ada', '<p data-part="eyebrow">Faculty</p>').replace('<article', '<article data-ssx-reveal="wipe"'),
    );
    const eyebrow = root.querySelector('[data-part="eyebrow"]')!;
    const rise = live(eyebrow);
    expect(rise).toHaveLength(1);
    expect(live(root.querySelector('h3')!)[0]).toBe(rise[0]);
    expect(rise[0]!.targets()[0]).toBe(eyebrow);
  });

  it('a part inside another part rises with it, not on its own (outermost only)', () => {
    // PersonCard's figures plate holds Figures; ShowcaseCard's avatars row holds the role.
    const root = page(
      `<article data-ssx-reveal="wipe"><h3 data-part="title">A</h3>` +
        `<dl data-part="figure"><div><dt>Placed</dt><dd data-part="figure">₹19L</dd></div>` +
        `<div><dd data-part="figure">62</dd></div></dl>` +
        `<div data-part="avatars"><img alt="" /><span data-part="subline">Founder</span></div></article>`,
    );
    const plate = root.querySelector('dl')!;
    const avatars = root.querySelector('[data-part="avatars"]')!;
    const rise = live(plate)[0]!;
    expect(rise.targets()).toEqual([root.querySelector('h3'), plate, avatars]);
    root.querySelectorAll('dd').forEach((dd) => expect(live(dd)).toHaveLength(0));
    expect(live(root.querySelector('[data-part="subline"]')!)).toHaveLength(0);
  });

  it('a section header inside a wipe owner plays its own eyebrow; the wipe plays only the card’s', async () => {
    const root = page(
      `<section data-ssx-reveal="wipe"><header data-ssx-section="header">` +
        `<p data-part="eyebrow">Faculty</p><h2 data-part="headline">Learn</h2></header>` +
        `${card('Inner', '<p data-part="eyebrow">Mentor</p>')}</section>`,
    );
    await waitFor(() => expect(triggerAt(sectionHeaderStart)).toBeDefined());
    const [headerEyebrow, cardEyebrow] = Array.from(root.querySelectorAll('[data-part="eyebrow"]'));
    const headerRise = live(headerEyebrow!);
    expect(headerRise).toHaveLength(1);
    expect(headerRise[0]!.vars.startAt).toMatchObject({ y: offset.enter }); // the header's step, not the wipe's
    const cardRise = live(cardEyebrow!);
    expect(cardRise).toHaveLength(1);
    expect(cardRise[0]!.parent).toBe(clipOf(root.querySelector('section')!).parent);
  });

  it('only cards whose box overlaps the viewport’s width open, in either direction', () => {
    const at = (left: number, right: number) => {
      const el = document.createElement('li');
      const rect = { left, right, width: right - left, height: 100, top: 0, bottom: 100, x: left, y: 0 };
      el.getBoundingClientRect = () => ({ ...rect, toJSON: () => rect });
      return el;
    };
    const width = window.innerWidth;
    const offLeft = at(-800, -400); // an RTL row's overflow
    const straddling = at(-200, 200);
    const inside = at(0, 400);
    const offRight = at(width, width + 400);
    const unmeasured = document.createElement('li'); // no layout: counted
    expect(cardsOnScreen([offLeft, straddling, inside, offRight, unmeasured])).toEqual([
      straddling,
      inside,
      unmeasured,
    ]);
  });

  it('Reveal and Stagger take the preset too', () => {
    render(
      <>
        <Reveal preset="wipe" data-testid="r">
          <h3 data-part="title">a</h3>
        </Reveal>
        <Stagger preset="wipe" data-testid="s">
          <div>b</div>
          <div>c</div>
        </Stagger>
      </>,
    );
    expect(clipOf(screen.getByTestId('r'))).toBeDefined();
    expect(live(screen.getByTestId('r').firstElementChild!)[0]!.startTime()).toBeCloseTo(d.slower * 0.45);
    const [b, c] = Array.from(screen.getByTestId('s').children);
    expect(clipOf(c!).startTime() - clipOf(b!).startTime()).toBeCloseTo(st.base * 1.5);
    expect(isRowHeld(screen.getByTestId('s'))).toBe(true);
  });
});

/** The section header's ScrollTrigger (created once its lazy imports land). */
const triggerAt = (start: string, trigger?: Element) =>
  ScrollTrigger.getAll().find((t) => t.vars.start === start && (!trigger || t.vars.trigger === trigger));

describe('the section header sequence', () => {
  const header = (attr: 'data-part' | 'data-enter') =>
    `<header data-ssx-section="header">` +
    `<p ${attr}="eyebrow">Faculty</p><h2 ${attr}="headline">Learn from the people who do it</h2>` +
    `<p ${attr}="sub">Operators, founders, investors.</p><div ${attr}="controls"><button>Next</button></div></header>`;

  for (const attr of ['data-part', 'data-enter'] as const) {
    it(`plays eyebrow, then the headline by lines out of a mask, then sub and controls (${attr})`, async () => {
      const root = page(header(attr));
      const el = root.querySelector('header')!;
      expect(el).toHaveAttribute('data-ssx-motion', 'armed');
      await waitFor(() => expect(triggerAt(sectionHeaderStart, el)).toBeDefined());

      const h2 = root.querySelector('h2')!;
      expect(h2).toHaveAttribute('aria-label', 'Learn from the people who do it');
      const eyebrow = live(root.querySelector(`[${attr}="eyebrow"]`)!)[0]!;
      const masks = Array.from(h2.children) as HTMLElement[];
      expect(masks[0]!.style.paddingBottom).toBe('0.15em');
      expect(masks[0]!.style.marginBottom).toBe('-0.15em');
      const lines = masks.map((m) => m.firstElementChild!);
      const lineTween = live(lines[0]!)[0]!;
      const sub = live(root.querySelector(`[${attr}="sub"]`)!)[0]!;
      expect(live(root.querySelector(`[${attr}="controls"]`)!)[0]).toBe(sub);

      expect(eyebrow.vars.startAt).toMatchObject({ autoAlpha: 0, y: offset.enter });
      expect(lineTween.vars.startAt).toMatchObject({ yPercent: 110 });
      expect(lineTween.vars.stagger).toBeCloseTo(st.base * 2);
      expect(sub.vars.startAt).toMatchObject({ autoAlpha: 0, y: offset.reveal });
      expect(eyebrow.startTime()).toBeLessThan(lineTween.startTime());
      expect(lineTween.startTime()).toBeLessThan(sub.startTime());

      // Waiting for its start; plays once it is reached, and the split is undone when it lands.
      const timeline = eyebrow.parent!;
      expect(timeline.paused()).toBe(true);
      (triggerAt(sectionHeaderStart, el)!.vars.onEnter as () => void)();
      expect(timeline.paused()).toBe(false);
      timeline.progress(1);
      expect(h2.innerHTML).toBe('Learn from the people who do it');
      expect(el).toHaveAttribute('data-ssx-motion', 'done');
    });
  }

  it('a part carrying both spellings (as SectionHeader renders them) is animated once', async () => {
    const root = page(
      `<header data-ssx-section="header"><p data-part="eyebrow" data-enter="eyebrow">Faculty</p>` +
        `<p data-part="sub" data-enter="sub">Operators.</p></header>`,
    );
    await waitFor(() => expect(triggerAt(sectionHeaderStart)).toBeDefined());
    expect(live(root.querySelector('[data-part="eyebrow"]')!)).toHaveLength(1);
    expect(live(root.querySelector('[data-part="sub"]')!)).toHaveLength(1);
  });

  it('stopping reverts the split and every inline style', async () => {
    const root = document.createElement('div');
    root.innerHTML = header('data-part');
    document.body.appendChild(root);
    const stop = applyMotion(root);
    await waitFor(() => expect(triggerAt(sectionHeaderStart)).toBeDefined());
    stop();
    const h2 = root.querySelector('h2')!;
    expect(h2.innerHTML).toBe('Learn from the people who do it');
    expect((root.querySelector('[data-part="eyebrow"]') as HTMLElement).style.opacity).toBe('');
    expect(root.querySelector('header')).not.toHaveAttribute('data-ssx-motion');
  });

  it('under reduced motion it is marked done and never tweens or splits', () => {
    const root = page(`<div data-motion="reduce">${header('data-part')}</div>`);
    expect(root.querySelector('header')).toHaveAttribute('data-ssx-motion', 'done');
    expect(live(root.querySelector('[data-part="eyebrow"]')!)).toHaveLength(0);
    expect(root.querySelector('h2')!.children).toHaveLength(0);
  });
});

describe('useSectionEntrance', () => {
  function Section({ legacy = false }: { legacy?: boolean }) {
    const ref = React.useRef<HTMLElement>(null);
    useSectionEntrance(ref);
    const mark = legacy ? 'data-enter' : 'data-part';
    const cardProps = legacy ? { className: 'ssx-card' } : { 'data-slot': 'person-card' };
    return (
      <section ref={ref} data-testid="section">
        <div {...{ [mark]: 'header' }} data-testid="header">
          <p {...{ [mark]: 'eyebrow' }}>Faculty</p>
          <h2 {...{ [mark]: 'headline' }}>Learn from the people who do it</h2>
          <p {...{ [mark]: 'sub' }}>Operators, founders, investors.</p>
        </div>
        <ul data-testid="row">
          {['A', 'B', 'C'].map((name) => (
            <li key={name}>
              <article {...cardProps} data-testid={`card-${name}`}>
                <img data-part="photo" alt="" />
                <h3 data-part="title">{name}</h3>
              </article>
            </li>
          ))}
        </ul>
        {/* The phone stack: in the DOM, not on the page at this width. */}
        <div hidden>
          <article {...cardProps} data-testid="card-phone">
            <h3 data-part="title">Phone</h3>
          </article>
        </div>
        <div data-enter="block" data-testid="block">
          Peers
        </div>
      </section>
    );
  }

  for (const legacy of [false, true]) {
    it(`arms the header, the deck and the blocks, and cleans up (${legacy ? 'the page’s data-enter and .ssx-card' : 'data-part and the marketing cards'})`, async () => {
      const { unmount } = render(
        <React.StrictMode>
          <Section legacy={legacy} />
        </React.StrictMode>,
      );
      const row = screen.getByTestId('row');
      const cards = ['A', 'B', 'C'].map((n) => screen.getByTestId(`card-${n}`));

      // The deck: each card wipes, one and a half base intervals apart, when the row is 75% up.
      const clips = cards.map(clipOf);
      expect(clips.every(Boolean)).toBe(true);
      expect(clips[1]!.startTime() - clips[0]!.startTime()).toBeCloseTo(st.base * 1.5);
      expect(clips[0]!.parent!.paused()).toBe(true);
      expect(triggerAt(sectionDeckStart, row)).toBeDefined();
      expect(isRowHeld(row)).toBe(true);
      cards.forEach((c) => expect(c).toHaveAttribute('data-ssx-wipe'));
      // Not on the page at this width: left alone.
      expect(live(screen.getByTestId('card-phone'))).toHaveLength(0);

      // A block fades up on its own, at 85%.
      const block = screen.getByTestId('block');
      expect(live(block)[0]!.vars.startAt).toMatchObject({ autoAlpha: 0, y: offset.reveal });
      expect(triggerAt(sectionHeaderStart, block)).toBeDefined();

      // The header waits for SplitText, hidden, then plays at 85% on the header block.
      const h2 = screen.getByRole('heading', { level: 2, hidden: true });
      await waitFor(() => expect(h2).toHaveAttribute('aria-label', 'Learn from the people who do it'));
      expect(triggerAt(sectionHeaderStart, screen.getByTestId('header'))).toBeDefined();
      const eyebrow = live(screen.getByText('Faculty'))[0]!;
      expect(eyebrow.vars.autoAlpha).toBe(1);
      expect(eyebrow.parent!.paused()).toBe(true);

      // The deck lands: the row is released.
      (triggerAt(sectionDeckStart, row)!.vars.onEnter as () => void)();
      clips[0]!.parent!.progress(1);
      expect(isRowHeld(row)).toBe(false);

      unmount();
      expect(document.querySelector('[data-ssx-wipe]')).toBeNull();
      expect(document.querySelector('[data-ssx-hold]')).toBeNull();
      expect(ScrollTrigger.getAll()).toHaveLength(0);
    });
  }

  it('a section inside a list never holds or triggers on the list around it', () => {
    function Listed() {
      const ref = React.useRef<HTMLElement>(null);
      useSectionEntrance(ref);
      return (
        <ul data-testid="page-list">
          <li>
            <section ref={ref}>
              <div data-testid="grid">
                <article data-slot="person-card" data-testid="first">
                  <h3 data-part="title">A</h3>
                </article>
                <article data-slot="person-card">
                  <h3 data-part="title">B</h3>
                </article>
              </div>
            </section>
          </li>
        </ul>
      );
    }
    render(<Listed />);
    const list = screen.getByTestId('page-list');
    expect(isRowHeld(list)).toBe(false);
    expect(triggerAt(sectionDeckStart, list)).toBeUndefined();
    expect(triggerAt(sectionDeckStart, screen.getByTestId('first'))).toBeDefined();
    expect(clipOf(screen.getByTestId('first'))).toBeDefined();
  });

  it('cleanup undoes a split that has not played, and the hold', async () => {
    const { unmount } = render(<Section />);
    const h2 = screen.getByRole('heading', { level: 2, hidden: true });
    await waitFor(() => expect(h2).toHaveAttribute('aria-label'));
    expect(isRowHeld(screen.getByTestId('row'))).toBe(true);
    const text = screen.getByText('Faculty');
    expect(text.style.opacity).toBe('0');
    unmount();
    expect(h2.innerHTML).toBe('Learn from the people who do it');
    expect(text.style.opacity).toBe('');
    expect(isRowHeld(screen.queryByTestId('row'))).toBe(false);
  });

  it('under reduced motion it arms nothing and the section is simply there', async () => {
    render(
      <div data-motion="reduce">
        <Section />
      </div>,
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(live(screen.getByTestId('card-A'))).toHaveLength(0);
    expect(live(screen.getByText('Faculty'))).toHaveLength(0);
    expect(screen.getByText('Faculty').style.opacity).toBe('');
    expect(screen.getByRole('heading', { level: 2, hidden: true }).children).toHaveLength(0);
    expect(isRowHeld(screen.getByTestId('row'))).toBe(false);
    expect(ScrollTrigger.getAll()).toHaveLength(0);
  });
});
