import * as React from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Breaker, type BreakerProps } from './index';
import type { BreakerSlideData } from './types';
import * as marketing from '../../marketing';

const LOGO = { name: 'Forbes', src: '/logos/forbes.svg' };

const WHY: BreakerSlideData = {
  eyebrow: 'Why the traditional MBA doesn’t work',
  statement: 'If you’re 25 and going to an MBA college today…',
  attribution: '— Nikhil Kamath, Zerodha',
  figures: [
    { value: '60%', label: 'of MBA students', description: 'say their coursework isn’t built for AI', source: 'Forbes', sourceLogo: LOGO },
    { value: '62% more', label: 'pay for AI skills', source: 'PwC' },
  ],
  media: { video: '/clip.mp4', poster: '/clip.webp', fit: 'height', position: '25% 50%' },
};

const PEOPLE: BreakerSlideData[] = [
  { statement: 'Anupam Mittal offered ₹50 lakh.', profile: { name: 'Anupam Mittal', credential: 'Shaadi.com', logos: [LOGO] }, media: { poster: '/a.webp' } },
  { statement: 'Ankur Warikoo handed our graduates their degrees.', profile: { name: 'Ankur Warikoo' }, media: { poster: '/b.webp', bright: true } },
  { statement: 'The energy was intentional.', profile: { name: 'Sidhant Goyal', logosPrefix: 'Ex-', logos: [LOGO] } },
];

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const slots = (name: string) => Array.from(document.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`));
const root = () => slot('breaker')!;
const fill = () => document.querySelector<HTMLElement>('[data-slot="carousel-nav-fill"]')!;

const Band = (props: Partial<BreakerProps>) => <Breaker label="Founders and investors" itemName="person" slides={PEOPLE} {...props} />;

let play: ReturnType<typeof vi.fn>;
let pause: ReturnType<typeof vi.fn>;
/** jsdom's own media members, put back after each test. */
const MEDIA = (['play', 'pause', 'muted'] as const).map(
  (key) => [key, Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, key)!] as const,
);

beforeAll(() => {
  // jsdom has no PointerEvent; a MouseEvent carrying the pointer fields stands in.
  if (typeof globalThis.PointerEvent === 'undefined') {
    class PointerEventStandIn extends MouseEvent {
      pointerId: number;
      pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
        this.pointerType = init.pointerType ?? 'mouse';
      }
    }
    globalThis.PointerEvent = PointerEventStandIn as unknown as typeof PointerEvent;
  }
});

beforeEach(() => {
  // jsdom implements no media playback: it logs "Not implemented" for both.
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, writable: true, value: play });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', { configurable: true, writable: true, value: pause });
  // jsdom fires `volumechange` synchronously when `muted` is set (a browser queues it as a task),
  // so React 16, which sets `muted` while it renders, warns that it cannot flush the event
  // mid-render. A plain property stands in for jsdom's, as the browser's would behave.
  const muted = new WeakMap<HTMLMediaElement, boolean>();
  Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
    configurable: true,
    get(this: HTMLMediaElement) {
      return muted.get(this) ?? false;
    },
    set(this: HTMLMediaElement, v: boolean) {
      muted.set(this, Boolean(v));
    },
  });
  globalThis.IntersectionObserver = class {
    cb: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb;
    }
    observe(el: Element) {
      this.cb([{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry], this as never);
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
  for (const [key, descriptor] of MEDIA) Object.defineProperty(HTMLMediaElement.prototype, key, descriptor);
  vi.unstubAllGlobals();
});

describe('Breaker', () => {
  it('renders its markers on every part', () => {
    render(<Breaker label="Why" slides={[WHY]} />);
    expect(root().tagName).toBe('SECTION');
    expect(root()).toHaveAttribute('aria-label', 'Why');
    expect(root()).toHaveAttribute('data-count', '1');
    expect(root()).toHaveAttribute('data-index', '0');
    expect(root()).not.toHaveAttribute('data-turned');
    expect(root()).not.toHaveAttribute('data-bright');
    expect(slot('breaker-media')).toHaveAttribute('data-breaker-part', 'media');
    expect(slot('breaker-stage')).toHaveAttribute('data-breaker-stage');
    expect(slots('breaker-frost').map((f) => f.dataset.layer)).toEqual(['rise', 'side']);
    expect(slot('breaker-words')).toHaveAttribute('data-breaker-part', 'words');
    expect(slot('breaker-attribution')).toHaveAttribute('data-breaker-part', 'attribution');
    expect(slot('breaker-attribution')).toHaveTextContent('— Nikhil Kamath, Zerodha');
    expect(slot('breaker-figures')).toHaveAttribute('data-breaker-part', 'figures');
    // The words: a SectionHeader, its eyebrow and the statement as a display h2.
    const words = slot('breaker-words')!;
    expect(words.querySelector('[data-part="eyebrow"]')).toHaveTextContent('Why the traditional MBA');
    const title = screen.getByRole('heading', { level: 2 });
    expect(title).toHaveAttribute('data-part', 'headline');
    expect(title).toHaveTextContent('If you’re 25');
    // The figures: ruled, large StatCards, two to a row.
    const cards = slot('breaker-figures')!.querySelectorAll('[data-slot="stat-card"]');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAttribute('data-variant', 'ruled');
    expect(cards[0]).toHaveAttribute('data-size', 'lg');
    expect(slot('stat-group')).toHaveAttribute('data-columns', '2');
    expect(slot('breaker-profile')).toBeNull();
  });

  it('one slide: no nav, no carousel roles', () => {
    render(<Breaker label="Why" slides={[WHY]} />);
    expect(slot('breaker-nav')).toBeNull();
    expect(slot('carousel-nav')).toBeNull();
    expect(root()).not.toHaveAttribute('aria-roledescription');
    expect(slot('breaker-slide')).not.toHaveAttribute('role');
  });

  it('several slides: a CarouselNav with a dot each, in the dark tone, left-aligned', () => {
    render(<Band />);
    expect(root()).toHaveAttribute('aria-roledescription', 'carousel');
    const nav = slot('breaker-nav')!.querySelector('[data-slot="carousel-nav"]')!;
    expect(nav).toHaveAttribute('data-tone', 'dark');
    expect(nav).toHaveClass('justify-start');
    expect(nav.querySelectorAll('[data-slot="carousel-nav-dot"]')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'person 1 of 3' })).toHaveAttribute('aria-current', 'true');
    // Every slide in one cell; only the one on show is exposed, and marked for the entrance.
    const slides = slots('breaker-slide');
    expect(slides).toHaveLength(3);
    expect(slides[0]).toHaveAttribute('data-active');
    expect(slides[0]).toHaveAttribute('aria-label', '1 of 3: Anupam Mittal');
    expect(slides[1]).toHaveAttribute('aria-hidden', 'true');
    expect(slides[1]).toHaveAttribute('inert');
    expect(slides[0]).not.toHaveAttribute('inert');
    expect(slides[1]!.querySelector('[data-breaker-part]')).toBeNull();
    expect(slides[0]!.querySelector('[data-slot="breaker-profile"]')).toHaveAttribute('data-breaker-part', 'profile');
  });

  it('turns when the active dot’s fill ends, then marks the turn and its direction', () => {
    render(<Band />);
    expect(fill()).toHaveAttribute('data-timed');
    expect(fill().style.getPropertyValue('--ssx-carousel-nav-interval')).toBe('7000ms');
    expect(fill()).not.toHaveAttribute('data-paused'); // on screen: running
    act(() => {
      fireEvent.animationEnd(fill());
    });
    expect(root()).toHaveAttribute('data-index', '1');
    expect(root()).toHaveAttribute('data-turned');
    expect(root()).toHaveAttribute('data-direction', 'forward');
    expect(slots('breaker-slide')[1]).toHaveAttribute('data-active');
    expect(slots('breaker-slide')[0]).toHaveAttribute('inert');
    // It wraps from the last slide to the first.
    act(() => {
      fireEvent.animationEnd(fill());
    });
    act(() => {
      fireEvent.animationEnd(fill());
    });
    expect(root()).toHaveAttribute('data-index', '0');
  });

  it('a dot selects its slide; the arrows step either way and wrap', () => {
    render(<Band />);
    fireEvent.click(screen.getByRole('button', { name: 'person 3 of 3' }));
    expect(root()).toHaveAttribute('data-index', '2');
    expect(root()).toHaveAttribute('data-direction', 'forward');
    fireEvent.click(screen.getByRole('button', { name: 'Previous person' }));
    expect(root()).toHaveAttribute('data-index', '1');
    expect(root()).toHaveAttribute('data-direction', 'back');
    fireEvent.click(screen.getByRole('button', { name: 'Next person' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next person' }));
    expect(root()).toHaveAttribute('data-index', '0');
  });

  it('a bright scene sets data-bright and puts the profile on the dark plate', () => {
    render(<Band defaultIndex={1} />);
    expect(root()).toHaveAttribute('data-bright');
    const plates = slots('profile-plate');
    expect(plates[1]).toHaveAttribute('data-tone', 'dark');
    expect(plates[0]).toHaveAttribute('data-tone', 'light');
    fireEvent.click(screen.getByRole('button', { name: 'person 1 of 3' }));
    expect(root()).not.toHaveAttribute('data-bright');
  });

  it('a slide without media keeps the first slide’s; no media at all is the plate', () => {
    const { unmount } = render(<Band />);
    const shots = slots('breaker-shot');
    expect(shots).toHaveLength(2); // the two slides with media; the third reuses the first
    fireEvent.click(screen.getByRole('button', { name: 'person 3 of 3' }));
    expect(shots[0]).toHaveAttribute('data-active');
    unmount();
    render(<Breaker label="Plain" slides={[{ statement: 'Words only.' }]} />);
    expect(slot('breaker-shot')).toHaveAttribute('data-plate');
    expect(slot('breaker-clip')).toBeNull();
  });

  it('the words are a dark island: data-theme="dark" beside data-brand, with on-image ink', () => {
    render(
      <div data-brand="ssb" data-theme="light">
        <Breaker label="Why" slides={[WHY]} />
      </div>,
    );
    const words = slot('breaker-words')!;
    expect(words).toHaveAttribute('data-theme', 'dark');
    expect(words).toHaveAttribute('data-brand', 'ssb');
    expect(words).toHaveAttribute('data-surface-ink', 'on-image');
  });

  it('inks the statement and eyebrow full white; only the footnote and figure labels are secondary', () => {
    render(<Breaker label="Why" slides={[WHY]} />);
    const words = slot('breaker-words')!;
    const title = words.querySelector<HTMLElement>('[data-part="headline"]')!;
    expect(title).toHaveClass('in-data-[surface-ink=on-image]:text-on-image-ink');
    expect(title.className).not.toContain('text-on-image-ink-secondary');
    const eyebrow = words.querySelector<HTMLElement>('[data-part="eyebrow"]')!;
    expect(eyebrow).toHaveClass('in-data-[surface-ink=on-image]:text-on-image-ink');
    expect(eyebrow.className).not.toContain('text-on-image-ink-secondary');
    expect(slot('breaker-attribution')!.className).toContain('in-data-[surface-ink=on-image]:text-on-image-ink-secondary');
    expect(slot('stat-card-label')!.className).toContain('in-data-[surface-ink=on-image]:text-on-image-ink-secondary');
  });

  it('takes the brand from a prop, from the server render on', () => {
    render(<Breaker label="Why" slides={[WHY]} brand="ssb" />);
    expect(slot('breaker-words')).toHaveAttribute('data-brand', 'ssb');
  });

  it('the clip: a muted inline loop with its poster, the blurred still under it a poster image', () => {
    render(<Breaker label="Why" slides={[WHY]} />);
    const videos = document.querySelectorAll('video');
    expect(videos).toHaveLength(1); // never two videos
    const video = videos[0]!;
    expect(video).toHaveAttribute('data-slot', 'breaker-clip');
    expect(video).toHaveAttribute('data-fit', 'height');
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('preload', 'metadata');
    expect(video).toHaveAttribute('poster', '/clip.webp');
    expect(video).toHaveAttribute('src', '/clip.mp4');
    expect(video.style.objectPosition).toBe('25% 50%');
    const haze = slot('breaker-haze')!;
    expect(haze.tagName).toBe('IMG');
    expect(haze).toHaveAttribute('src', '/clip.webp');
    expect(haze.className).toContain('blur-[calc(var(--glass-blur)*3)]');
    // On screen with motion: it plays.
    expect(play).toHaveBeenCalled();
  });

  it('a still with no video is the picture itself', () => {
    render(<Breaker label="Still" slides={[{ statement: 'S', media: { poster: '/still.webp', alt: 'A room' } }]} />);
    const still = slot('breaker-clip')!;
    expect(still.tagName).toBe('IMG');
    expect(still).toHaveAttribute('alt', 'A room');
    expect(document.querySelector('video')).toBeNull();
  });

  it('under reduced motion: no timed fill, no auto turn, the clip paused', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }));
    render(<Band slides={[WHY, ...PEOPLE]} />);
    expect(fill()).not.toHaveAttribute('data-timed');
    act(() => {
      fireEvent.animationEnd(fill());
    });
    expect(root()).toHaveAttribute('data-index', '0');
    expect(root()).not.toHaveAttribute('data-turned');
    expect(play).not.toHaveBeenCalled();
    expect(pause).toHaveBeenCalled();
  });

  it('never turns under a data-motion="reduce" ancestor', () => {
    render(
      <div data-motion="reduce">
        <Band />
      </div>,
    );
    expect(fill()).not.toHaveAttribute('data-timed');
  });

  it('a sideways touch swipe turns it; a mouse drag and a vertical swipe do not', () => {
    render(<Band />);
    const band = root();
    fireEvent.pointerDown(band, { pointerType: 'touch', clientX: 300, clientY: 100 });
    fireEvent.pointerUp(band, { pointerType: 'touch', clientX: 200, clientY: 110 });
    expect(band).toHaveAttribute('data-index', '1');
    fireEvent.pointerDown(band, { pointerType: 'touch', clientX: 200, clientY: 100 });
    fireEvent.pointerUp(band, { pointerType: 'touch', clientX: 300, clientY: 105 });
    expect(band).toHaveAttribute('data-index', '0');
    expect(band).toHaveAttribute('data-direction', 'back');
    fireEvent.pointerDown(band, { pointerType: 'touch', clientX: 200, clientY: 100 });
    fireEvent.pointerUp(band, { pointerType: 'touch', clientX: 140, clientY: 300 });
    expect(band).toHaveAttribute('data-index', '0');
    fireEvent.pointerDown(band, { pointerType: 'mouse', clientX: 300, clientY: 100 });
    fireEvent.pointerUp(band, { pointerType: 'mouse', clientX: 100, clientY: 100 });
    expect(band).toHaveAttribute('data-index', '0');
  });

  it('renders as a div group, and forwards its ref and props', () => {
    const ref = React.createRef<HTMLElement>();
    render(<Breaker ref={ref} as="div" label="Band" slides={[WHY]} className="mt-8" data-testid="b" />);
    expect(ref.current).toBe(root());
    expect(root().tagName).toBe('DIV');
    expect(root()).toHaveAttribute('role', 'group');
    expect(root()).toHaveClass('mt-8');
    expect(root()).toHaveAttribute('data-testid', 'b');
  });

  it('renders nothing with no slides', () => {
    const { container } = render(<Breaker label="Empty" slides={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['sst', 'light'],
    ['sst', 'dark'],
    ['ssb', 'light'],
    ['ssb', 'dark'],
  ] as const)('renders under data-brand="%s" data-theme="%s", the island repeating the brand', (brand, theme) => {
    render(
      <div data-brand={brand} data-theme={theme}>
        <Band slides={[WHY, ...PEOPLE]} />
      </div>,
    );
    expect(slot('breaker-words')).toHaveAttribute('data-brand', brand);
    expect(slot('breaker-words')).toHaveAttribute('data-theme', 'dark');
    expect(slots('breaker-slide')).toHaveLength(4);
  });

  it('is exported from the marketing entry', () => {
    expect(marketing.Breaker).toBe(Breaker);
    expect(marketing.breakerInterval).toBe(7000);
  });
});
