import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PersonCard, type PersonCardLayout } from './PersonCard';
import * as marketing from '../../marketing';

const slot = (root: ParentNode, name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const slots = (root: ParentNode, name: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`));

const PHOTO = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const LOGO = { name: 'Northwind', src: PHOTO, color: 'red' };
const LOGO_WHITE = { name: 'Halcyon', src: PHOTO };
const FIGURES = [
  { value: '200K', label: 'Followers' },
  { value: '12M', label: 'Views' },
  { value: '40+', label: 'Brand deals' },
  { value: '9', label: 'Dropped: a fourth' },
];

/** Every slot filled. */
const FULL = {
  name: 'Priya Raman',
  role: 'VP Growth',
  eyebrow: 'Meet',
  badge: 'Creator',
  bio: 'A line about her.',
  logos: [LOGO, LOGO_WHITE],
  figures: FIGURES,
  moveFrom: 'Analyst, Deloitte',
  moveTo: 'Northwind',
  moveFromLabel: 'Before SSB',
  moveToLabel: 'After SSB',
  moveToLogo: LOGO,
  image: PHOTO,
};

const LAYOUTS: PersonCardLayout[] = ['overlay', 'stacked', 'split'];

const OPTIONAL_SLOTS = [
  'person-card-eyebrow',
  'person-card-badge',
  'person-card-headline',
  'person-card-byline',
  'person-card-role',
  'person-card-rule',
  'person-card-bio',
  'person-card-logos',
  'person-card-figures',
  'person-card-move',
  'person-card-tag',
  'person-card-link',
  'person-card-action',
];

describe('PersonCard', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(LAYOUTS)('layout="%s" renders its root markers and the shared parts', (layout) => {
    const { container } = render(<PersonCard {...FULL} layout={layout} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('ARTICLE');
    expect(root).toHaveAttribute('data-slot', 'person-card');
    expect(root).toHaveAttribute('data-layout', layout);
    expect(root).toHaveAttribute('data-size', 'md');
    expect(root).toHaveAttribute('data-align', 'start');

    expect(slot(root, 'person-card-media')).not.toBeNull();
    expect(slot(slot(root, 'person-card-media')!, 'photo-frame-media')).toHaveAttribute('data-part', 'photo');
    expect(slot(root, 'person-card-body')).not.toBeNull();

    const parts: [string, string][] = [
      ['person-card-eyebrow', 'eyebrow'],
      ['person-card-name', 'title'],
      ['person-card-role', 'subline'],
      ['person-card-logos', 'logos'],
      ['person-card-figures', 'figure'],
    ];
    for (const [name, part] of parts) expect(slot(root, name), name).toHaveAttribute('data-part', part);
    expect(slot(root, 'person-card-badge')).toHaveTextContent('Creator');
    expect(slot(root, 'person-card-move')).not.toBeNull();
    expect(slots(root, 'person-card-move-step')).toHaveLength(2);
    expect(slot(root, 'person-card-move-arrow')).toHaveAttribute('aria-hidden', 'true');
  });

  it('the rule is the split card\'s (between the name and the credentials); bio is stacked and split only', () => {
    const overlay = render(<PersonCard {...FULL} layout="overlay" />);
    expect(slot(overlay.container, 'person-card-rule')).toBeNull();
    expect(slot(overlay.container, 'person-card-bio')).toBeNull();
    overlay.unmount();

    const stacked = render(<PersonCard {...FULL} layout="stacked" />);
    expect(slot(stacked.container, 'person-card-rule')).toBeNull();
    expect(slot(stacked.container, 'person-card-bio')).toHaveAttribute('data-part', 'description');
    stacked.unmount();

    const { container } = render(<PersonCard {...FULL} layout="split" />);
    expect(slot(container, 'person-card-rule')!.tagName).toBe('HR');
    expect(slot(container, 'person-card-bio')).toHaveAttribute('data-part', 'description');
  });

  it.each(LAYOUTS)('layout="%s" with only a name: every optional marker is absent', (layout) => {
    const { container } = render(<PersonCard name="Sanjay Kumar" layout={layout} />);
    for (const name of OPTIONAL_SLOTS) expect(slot(container, name), name).toBeNull();
    expect(slot(container, 'person-card-name')).toHaveTextContent('Sanjay Kumar');
    // No image: the plate, with the initials, and no photo layer.
    expect(slot(container, 'photo-frame-placeholder')).not.toBeNull();
    expect(slot(container, 'photo-frame-media')).toBeNull();
    expect(slot(container, 'person-card-initials')).toHaveTextContent('SK');
    expect(slot(container, 'person-card-initials')).toHaveAttribute('aria-hidden', 'true');
  });

  it('with an image there are no initials', () => {
    const { container } = render(<PersonCard name="Sanjay Kumar" image={PHOTO} />);
    expect(slot(container, 'person-card-initials')).toBeNull();
    expect(container.querySelector('img[data-slot="photo-frame-image"]')).toHaveAttribute('src', PHOTO);
  });

  it('headline leads: it is the heading, and the name drops to a "by" byline', () => {
    const { container } = render(<PersonCard name="Priya Raman" headline="Pricing and Growth" role="VP" layout="split" />);
    const heading = screen.getByRole('heading');
    expect(heading).toHaveTextContent('Pricing and Growth');
    expect(heading).toHaveAttribute('data-slot', 'person-card-headline');
    expect(heading).toHaveAttribute('data-part', 'title');
    expect(slot(container, 'person-card-name')).toBeNull();
    const byline = slot(container, 'person-card-byline')!;
    expect(byline.tagName).toBe('P');
    expect(byline).toHaveAttribute('data-part', 'subline');
    expect(byline).toHaveTextContent('by Priya Raman');
  });

  it('bylinePrefix="" sets the name alone; a prefix of its own replaces "by"', () => {
    const { container, rerender } = render(<PersonCard name="Ananya Gupta" headline="Brand at Prism" bylinePrefix="" />);
    expect(slot(container, 'person-card-byline')!.textContent).toBe('Ananya Gupta');
    rerender(<PersonCard name="Ananya Gupta" headline="Brand at Prism" bylinePrefix="with" />);
    expect(slot(container, 'person-card-byline')!.textContent).toBe('with Ananya Gupta');
  });

  it('without a headline the name is the heading (h3 by default; titleAs changes the level)', () => {
    const { rerender } = render(<PersonCard name="Priya Raman" />);
    expect(screen.getByRole('heading', { name: 'Priya Raman' }).tagName).toBe('H3');
    rerender(<PersonCard name="Priya Raman" titleAs="h4" />);
    expect(screen.getByRole('heading', { name: 'Priya Raman' }).tagName).toBe('H4');
  });

  it('the move renders only with both ends, before then after in the DOM', () => {
    const { container, rerender } = render(<PersonCard name="A" layout="split" moveFrom="Deloitte" />);
    expect(slot(container, 'person-card-move')).toBeNull();
    rerender(<PersonCard name="A" layout="split" moveTo="Prism Labs" moveToLogo={LOGO} />);
    expect(slot(container, 'person-card-move')).toBeNull();
    rerender(
      <PersonCard
        name="A"
        layout="split"
        moveFrom="Deloitte"
        moveTo="Prism Labs"
        moveFromLabel="Before SSB"
        moveToLabel="After SSB"
      />,
    );
    const move = slot(container, 'person-card-move')!;
    const steps = slots(move, 'person-card-move-step');
    expect(steps.map((s) => s.getAttribute('data-step'))).toEqual(['from', 'to']);
    expect(steps[0]).toHaveTextContent('Before SSBDeloitte');
    expect(steps[1]).toHaveTextContent('After SSBPrism Labs');
    // Drawn reversed: after on top.
    expect(move.className).toContain('flex-col-reverse');
    // No logo: a glyph tile, no logo tile.
    expect(slot(move, 'logo-tile')).toBeNull();
    rerender(<PersonCard name="A" layout="split" moveFrom="Deloitte" moveTo="Prism Labs" moveToLogo={LOGO} />);
    const tile = slot(slot(container, 'person-card-move')!, 'logo-tile')!;
    expect(tile).toHaveAttribute('data-shape', 'square');
    expect(tile).toHaveAttribute('data-fill', 'white');
    // The tile is decoration beside the company's name.
    expect(tile.parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('declares on-image ink on the overlay root only', () => {
    for (const layout of LAYOUTS) {
      const { container, unmount } = render(<PersonCard name="P" image={PHOTO} layout={layout} />);
      const root = container.firstElementChild as HTMLElement;
      if (layout === 'overlay') expect(root).toHaveAttribute('data-surface-ink', 'on-image');
      else expect(root).not.toHaveAttribute('data-surface-ink');
      unmount();
    }
  });

  it('overlay: the 3:4 photo with a bottom blur behind the copy; the others: a 4:5 photo, no blur without figures', () => {
    const overlay = render(<PersonCard name="P" image={PHOTO} />);
    const frame = slot(overlay.container, 'photo-frame')!;
    expect(frame).toHaveAttribute('data-blur', 'bottom');
    expect(frame).toHaveAttribute('data-scrim', 'true');
    expect((overlay.container.firstElementChild as HTMLElement).className).toContain(
      'aspect-[calc(1/(var(--aspect-landscape)))]',
    );
    overlay.unmount();

    for (const layout of ['stacked', 'split'] as const) {
      const { container, unmount } = render(<PersonCard name="P" image={PHOTO} layout={layout} />);
      const f = slot(container, 'photo-frame')!;
      expect(f).toHaveAttribute('data-ratio', '4:5');
      expect(f).not.toHaveAttribute('data-blur');
      unmount();
    }
  });

  it('the split card is a size container and lays out beside from its threshold', () => {
    const { container } = render(<PersonCard name="P" layout="split" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('@container/person-card');
    const grid = root.firstElementChild as HTMLElement;
    // The photo's share is a custom property (README token requests), 54 / 46 by default.
    expect(grid.className).toContain(
      '@min-person-card-split/person-card:grid-cols-[var(--ssx-person-card-split,minmax(0,54fr)_minmax(0,46fr))]',
    );
    expect(slot(container, 'photo-frame')!.className).toContain('@min-person-card-split/person-card:aspect-auto');
  });

  it('figures: at most three, on a dark glass plate as a dl; in flow on the overlay, pinned to the photo elsewhere', () => {
    const { container, unmount } = render(<PersonCard name="P" image={PHOTO} figures={FIGURES} />);
    const plate = slot(container, 'person-card-figures')!;
    expect(plate.tagName).toBe('DL');
    expect(plate).toHaveAttribute('data-slot', 'person-card-figures');
    expect(plate).toHaveAttribute('data-tone', 'dark');
    expect(plate).toHaveAttribute('data-inset', 'none');
    expect(plate.querySelectorAll('dd[data-slot="figure"]')).toHaveLength(3);
    expect(plate.querySelectorAll('dt')).toHaveLength(3);
    expect(plate).not.toHaveTextContent('Dropped');
    unmount();

    const stacked = render(<PersonCard name="P" image={PHOTO} layout="stacked" figures={FIGURES.slice(0, 2)} />);
    const pinned = slot(stacked.container, 'person-card-figures')!;
    expect(pinned).toHaveAttribute('data-inset', 'foot');
    expect(pinned.closest('[data-slot="photo-frame"]')).not.toBeNull();
    expect(slot(stacked.container, 'photo-frame')).toHaveAttribute('data-blur', 'bottom');
  });

  it('a single figure field is read when there are no figures', () => {
    const { container } = render(<PersonCard name="P" figure="₹50L" figureLabel="Offered" />);
    const plate = slot(container, 'person-card-figures')!;
    expect(plate.querySelectorAll('dd')).toHaveLength(1);
    expect(plate).toHaveTextContent('Offered');
  });

  it('logos: a tile each, on the brand colour when the logo has one, else white', () => {
    const { container } = render(<PersonCard name="P" logos={[LOGO, LOGO_WHITE]} />);
    const tiles = slots(slot(container, 'person-card-logos')!, 'logo-tile');
    expect(tiles.map((t) => t.getAttribute('data-fill'))).toEqual(['brand', 'white']);
    expect(tiles.every((t) => t.getAttribute('data-size') === 'md')).toBe(true);
    expect(slot(container, 'person-card-logos')!.tagName).toBe('UL');
  });

  it('size="sm" sets data-size, small tiles and the compact name', () => {
    const { container } = render(<PersonCard name="P" size="sm" logos={[LOGO]} />);
    expect(container.firstElementChild).toHaveAttribute('data-size', 'sm');
    expect(slot(container, 'logo-tile')).toHaveAttribute('data-size', 'sm');
    expect(slot(container, 'person-card-name')!.className).toContain('type-body');
    expect(slot(container, 'person-card-name')!.className).not.toContain('type-h3');
  });

  it('align="center" centres the overlay; the other layouts are always start', () => {
    const { container, rerender } = render(<PersonCard name="P" align="center" />);
    expect(container.firstElementChild).toHaveAttribute('data-align', 'center');
    expect(slot(container, 'person-card-body')!.className).toContain('text-center');
    rerender(<PersonCard name="P" align="center" layout="stacked" />);
    expect(container.firstElementChild).toHaveAttribute('data-align', 'start');
  });

  it.each(['article', 'li', 'div'] as const)('as="%s" controls the element', (as) => {
    const { container } = render(as === 'li' ? <ul><PersonCard name="P" as="li" /></ul> : <PersonCard name="P" as={as} />);
    expect(slot(container, 'person-card')!.tagName).toBe(as.toUpperCase());
  });

  it('forwards its ref, className and attributes; role is the copy, never the ARIA attribute', () => {
    const ref = React.createRef<HTMLElement>();
    const { container } = render(
      <PersonCard ref={ref} name="P" role="Director" className="extra" data-testid="card" aria-label="Priya" />,
    );
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toHaveClass('extra');
    expect(ref.current).toHaveAttribute('data-testid', 'card');
    expect(ref.current).toHaveAttribute('aria-label', 'Priya');
    expect(ref.current).not.toHaveAttribute('role');
    expect(ref.current).not.toHaveAttribute('title');
    expect(slot(container, 'person-card-role')).toHaveTextContent('Director');
  });

  it('href makes the heading a stretched link, named by the heading', () => {
    render(<PersonCard name="Priya Raman" href="/priya" />);
    const link = screen.getByRole('link', { name: 'Priya Raman' });
    expect(link).toHaveAttribute('href', '/priya');
    expect(link).not.toHaveAttribute('aria-label');
    expect(link.closest('[data-slot="person-card-name"]')).not.toBeNull();
    expect(link.className).toContain('after:absolute');
    expect(link.className).toContain('after:inset-0');
  });

  it('hrefLabel: the heading stays plain and a quiet arrow action carries the words, stretched', () => {
    const { container } = render(<PersonCard name="Priya Raman" href="/priya" hrefLabel="Read her story" bio="B" layout="stacked" />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    const action = links[0]!;
    expect(action).toHaveAccessibleName('Read her story');
    expect(action).not.toHaveAttribute('aria-label');
    expect(action).toHaveAttribute('href', '/priya');
    expect(action).toHaveAttribute('data-slot', 'person-card-action');
    expect(action).toHaveAttribute('data-part', 'action');
    expect(action).toHaveAttribute('data-variant', 'quiet');
    expect(action).toHaveAttribute('data-trailing-icon', 'arrow');
    expect(action.className).toContain('after:inset-0');
    // No press scale on a stretched link (it would contain its own ::after mid-press).
    expect(action.className).toContain('active:scale-none');
    expect(action.className).not.toContain('active:scale-(--motion-scale-press)');
    expect(slot(container, 'person-card-name')!.querySelector('a')).toBeNull();
    expect(slot(container, 'person-card-link')).toBeNull();
    // At the copy's foot: the body's last part.
    expect(slot(container, 'person-card-body')!.lastElementChild).toBe(action);
  });

  it.each(LAYOUTS)('layout="%s": the stretched link covers the whole card, not just the copy', (layout) => {
    for (const extra of [{}, { hrefLabel: 'Read her story' }]) {
      const { container, unmount } = render(
        <PersonCard {...FULL} layout={layout} href="/priya" {...extra} />,
      );
      const root = container.firstElementChild as HTMLElement;
      const link = screen.getByRole('link');
      // The root is the positioning context and stacking context.
      expect(root.className).toMatch(/(^|\s)relative(\s|$)/);
      expect(root.className).toMatch(/(^|\s)isolate(\s|$)/);
      // Nothing between the link and the root is positioned, so its ::after is the card's size.
      for (let el = link.parentElement; el && el !== root; el = el.parentElement) {
        expect(el.className, el.getAttribute('data-slot') ?? el.tagName).not.toMatch(/(^|\s)(relative|absolute|fixed|sticky)(\s|$)/);
      }
      expect(link.className).toContain('after:z-raised');
      unmount();
    }
  });

  it('overlay: the body carries no position; the photo sits under it in the root\'s stack', () => {
    const { container } = render(<PersonCard name="P" image={PHOTO} href="/p" />);
    expect(slot(container, 'person-card-body')!.className).not.toMatch(/(^|\s)relative(\s|$)/);
    expect(slot(container, 'person-card-media')!.className).toContain('z-below');
  });

  it('videoUrl is not a field of the card (a type error)', () => {
    // @ts-expect-error: PersonCard omits videoUrl from its props.
    const el = <PersonCard name="P" videoUrl="https://x.test/v.mp4" />;
    expect(el).toBeTruthy();
  });

  it('logos with the same name both render, each keyed apart', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<PersonCard name="P" logos={[LOGO_WHITE, LOGO_WHITE]} />);
    expect(slots(slot(container, 'person-card-logos')!, 'logo-tile')).toHaveLength(2);
    expect(error).not.toHaveBeenCalled();
  });

  it.each(LAYOUTS)('layout="%s": an empty CMS string is an unset field (no element, no marker)', (layout) => {
    const { container } = render(
      <PersonCard
        name="Sanjay Kumar"
        layout={layout}
        role=""
        headline=""
        bio=""
        eyebrow=""
        badge=""
        tag=""
        figure=""
        moveFrom=""
        moveTo=""
        image=""
        href=""
        hrefLabel=""
      />,
    );
    for (const name of OPTIONAL_SLOTS) expect(slot(container, name), name).toBeNull();
    // An empty headline does not lead: the name is the heading.
    expect(screen.getByRole('heading')).toHaveTextContent('Sanjay Kumar');
    expect(slot(container, 'person-card-name')).not.toBeNull();
    expect(slot(container, 'person-card-initials')).toHaveTextContent('SK');
  });

  it('initials drop a "Dr." (the family\'s one helper)', () => {
    const { container } = render(<PersonCard name="Dr. Priya Menon" />);
    expect(slot(container, 'person-card-initials')).toHaveTextContent('PM');
  });

  it('a tag sits on the photo as a glass badge', () => {
    const { container } = render(<PersonCard name="P" layout="stacked" image={PHOTO} tag="Cohort 1" />);
    const tag = slot(container, 'person-card-tag')!;
    expect(tag).toHaveAttribute('data-tone', 'glass');
    expect(tag.closest('[data-slot="photo-frame"]')).not.toBeNull();
  });

  it.each([
    ['sst', 'light'],
    ['sst', 'dark'],
    ['ssb', 'light'],
    ['ssb', 'dark'],
  ] as const)('renders every layout under data-brand="%s" data-theme="%s" without console errors', (brand, theme) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <div data-brand={brand} data-theme={theme}>
        {LAYOUTS.map((layout) => (
          <PersonCard key={layout} {...FULL} layout={layout} headline="Pricing" href="#p" tag="Tag" />
        ))}
      </div>,
    );
    expect(slots(container, 'person-card')).toHaveLength(3);
    for (const card of slots(container, 'person-card')) {
      expect(card).not.toHaveAttribute('data-brand');
      expect(card).not.toHaveAttribute('data-theme');
    }
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('is exported from the marketing entry', () => {
    expect(marketing.PersonCard).toBe(PersonCard);
    expect(typeof marketing.personCardVariants).toBe('function');
  });
});
