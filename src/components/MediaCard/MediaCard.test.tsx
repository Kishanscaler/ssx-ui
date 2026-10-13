import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MediaCard, type MediaCardLayout, type MediaCardProps } from './MediaCard';
import * as marketing from '../../marketing';

const PHOTO = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const LOGO = { name: 'Northwind', src: PHOTO };

const slot = (root: ParentNode, name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const LAYOUTS: MediaCardLayout[] = ['below', 'plate', 'overlay'];

/** Every flat field set. */
const FULL = {
  image: PHOTO,
  tag: 'Consulting',
  figure: '₹50L',
  figureLabel: 'offered on Shark Tank India',
  eyebrow: 'Economic Times',
  company: 'Zepto',
  title: 'Students take on a quick-commerce brief',
  description: 'Six weeks with the founders, then a defence of the recommendations.',
  logos: [LOGO],
  videoUrl: 'https://example.com/video',
  href: 'https://example.com/story',
} satisfies MediaCardProps;

afterEach(() => vi.restoreAllMocks());

describe('MediaCard', () => {
  it.each(LAYOUTS)('layout="%s": the root and the markers of every part', (layout) => {
    const { container } = render(<MediaCard layout={layout} {...FULL} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('ARTICLE');
    expect(root).toHaveAttribute('data-slot', 'media-card');
    expect(root).toHaveAttribute('data-layout', layout);
    expect(root).not.toHaveAttribute('data-copy');
    expect(root).toHaveAttribute('data-size', 'sm');

    for (const name of ['media', 'tag', 'figure', 'play', 'company', 'eyebrow', 'title', 'description', 'footer', 'logos'])
      expect(slot(root, `media-card-${name}`), name).not.toBeNull();
    // The photo layer is PhotoFrame's, inside the media.
    expect(slot(root, 'media-card-media')!.querySelector('[data-part="photo"]')).not.toBeNull();
    expect(slot(root, 'media-card-eyebrow')).toHaveAttribute('data-part', 'eyebrow');
    expect(slot(root, 'media-card-title')).toHaveAttribute('data-part', 'title');
    expect(slot(root, 'media-card-description')).toHaveAttribute('data-part', 'description');
    expect(slot(root, 'media-card-logos')).toHaveAttribute('data-part', 'logos');
    expect(slot(root, 'media-card-figure')!.querySelector('[data-part="figure"]')).toHaveTextContent('₹50L');

    // The copy sits in a body, or on the plate.
    expect(slot(root, 'media-card-body') != null).toBe(layout !== 'plate');
    expect(slot(root, 'media-card-plate') != null).toBe(layout === 'plate');
  });

  it('below: the figure sits on the media; plate and overlay carry it with the copy', () => {
    for (const layout of LAYOUTS) {
      const { container, unmount } = render(<MediaCard layout={layout} {...FULL} />);
      const figure = slot(container, 'media-card-figure')!;
      const inCopy = figure.closest('[data-slot="media-card-body"], [data-slot="media-card-plate"]');
      expect(inCopy != null, layout).toBe(layout !== 'below');
      unmount();
    }
  });

  it.each(LAYOUTS)('layout="%s": optional slots omitted, their markers are absent', (layout) => {
    const { container } = render(<MediaCard layout={layout} title="Only a title" />);
    const root = container.firstElementChild as HTMLElement;
    for (const name of ['tag', 'figure', 'play', 'company', 'eyebrow', 'description', 'footer', 'logos', 'action'])
      expect(slot(root, `media-card-${name}`), name).toBeNull();
    expect(slot(root, 'media-card-title')).toHaveTextContent('Only a title');
    // Media is always drawn: with no image, the frame's ground.
    expect(slot(root, 'media-card-media')).not.toBeNull();
    expect(root.querySelector('img')).toBeNull();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('no image: the sunken ground under copy below, the dark plate under white copy', () => {
    const ground = (layout: MediaCardLayout, extra = {}) => {
      const { container, unmount } = render(<MediaCard layout={layout} title="T" {...extra} />);
      const value = container.querySelector('[data-slot="photo-frame"]')!.getAttribute('data-placeholder');
      unmount();
      return value;
    };
    expect(ground('below')).toBe('sunken');
    expect(ground('below', { figure: '50+' })).toBe('plate');
    expect(ground('plate')).toBe('plate');
    expect(ground('overlay')).toBe('plate');
  });

  it('blurs only where copy or a figure stands on the photo', () => {
    const blur = (layout: MediaCardLayout, extra = {}) => {
      const { container, unmount } = render(<MediaCard layout={layout} title="T" image={PHOTO} {...extra} />);
      const value = container.querySelector('[data-slot="photo-frame"]')!.getAttribute('data-blur');
      unmount();
      return value;
    };
    expect(blur('below')).toBeNull();
    expect(blur('below', { figure: '50+' })).toBe('bottom');
    expect(blur('plate')).toBeNull();
    expect(blur('overlay')).toBe('bottom');
  });

  it.each([
    [2, 'line-clamp-2'],
    [3, 'line-clamp-3'],
  ] as const)('descriptionLines=%s clamps the description (%s)', (lines, cls) => {
    const { container } = render(<MediaCard title="T" description="D" descriptionLines={lines} />);
    expect(slot(container, 'media-card-description')!.className).toContain(cls);
  });

  it('no descriptionLines, no clamp', () => {
    const { container } = render(<MediaCard title="T" description="D" />);
    expect(slot(container, 'media-card-description')!.className).not.toContain('line-clamp');
  });

  it('size: sm sets the card title (h3 role) and the small copy; md the h1 role and body copy', () => {
    const { container, rerender } = render(<MediaCard title="T" description="D" />);
    let title = slot(container, 'media-card-title')!;
    expect(title.tagName).toBe('H3');
    expect(title).toHaveAttribute('data-size', '3');
    expect(title.className).toContain('type-h3');
    expect(slot(container, 'media-card-description')!.className).toContain('type-body-sm');

    rerender(<MediaCard title="T" description="D" size="md" />);
    expect(container.firstElementChild).toHaveAttribute('data-size', 'md');
    title = slot(container, 'media-card-title')!;
    expect(title.tagName).toBe('H3');
    expect(title).toHaveAttribute('data-size', '1');
    expect(title.className).toContain('type-h1');
    const desc = slot(container, 'media-card-description')!;
    expect(desc.className).toContain('type-body');
    expect(desc.className).not.toContain('type-body-sm');
  });

  it('titleAs sets the outline level, not the size', () => {
    render(<MediaCard title="In the news" titleAs="h4" />);
    const heading = screen.getByRole('heading', { name: 'In the news' });
    expect(heading.tagName).toBe('H4');
    expect(heading).toHaveAttribute('data-size', '3');
  });

  it('href links the title, named by the title', () => {
    render(<MediaCard title="Read me" href="https://example.com/a" />);
    const link = screen.getByRole('link', { name: 'Read me' });
    expect(link).not.toHaveAttribute('aria-label');
    expect(link).toHaveAttribute('href', 'https://example.com/a');
    expect(link.closest('[data-slot="media-card-title"]')).not.toBeNull();
  });

  it('href with hrefLabel: the title stays plain and an action link carries the words', () => {
    const { container } = render(<MediaCard title="Read me" href="https://example.com/a" hrefLabel="Read the story" />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName('Read the story');
    expect(links[0]).toHaveAttribute('data-part', 'action');
    expect(slot(container, 'media-card-title')!.querySelector('a')).toBeNull();
  });

  it('videoUrl renders the family play disc over the media: same tab, named "Play: <title>"', () => {
    const { container } = render(<MediaCard title="Fireside with a founder" videoUrl="https://example.com/v" />);
    const play = screen.getByRole('link', { name: 'Play: Fireside with a founder' });
    expect(play).toHaveAttribute('href', 'https://example.com/v');
    expect(play).toHaveAttribute('data-slot', 'play-disc');
    expect(play).not.toHaveAttribute('target');
    expect(play).not.toHaveAttribute('rel');
    // The dark glass disc, control-lg; the disc alone is the target.
    const disc = play.firstElementChild!;
    expect(disc).toHaveClass('size-control-lg', 'rounded-full', 'backdrop-blur-glass');
    expect(disc.className).toContain('bg-(--ssx-plate-on-photo,var(--surface-image-scrim))');
    expect(play).not.toHaveClass('size-full');
    expect(slot(container, 'media-card-play')!.contains(play)).toBe(true);
    expect(slot(container, 'media-card-media')!.contains(play)).toBe(true);
  });

  it('a play disc with no title is named "Play video"', () => {
    render(<MediaCard videoUrl="https://example.com/v" />);
    expect(screen.getByRole('link', { name: 'Play video' })).toBeInTheDocument();
  });

  it.each(LAYOUTS)('layout="%s": an empty CMS string is an unset field (no element, no marker)', (layout) => {
    const { container } = render(
      <MediaCard
        layout={layout}
        eyebrow=""
        title=""
        description=""
        company=""
        tag=""
        figure=""
        figureLabel=""
        image=""
        videoUrl=""
        href=""
        hrefLabel=""
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    for (const name of ['eyebrow', 'title', 'description', 'company', 'tag', 'figure', 'play', 'footer', 'action'])
      expect(slot(root, `media-card-${name}`), name).toBeNull();
    expect(root.querySelector('img')).toBeNull();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });

  it('an empty hrefLabel is unset: the title is the link', () => {
    render(<MediaCard title="Read me" href="https://example.com/a" hrefLabel="" />);
    const link = screen.getByRole('link', { name: 'Read me' });
    expect(link.closest('[data-slot="media-card-title"]')).not.toBeNull();
  });

  it('playSlot replaces the default play link', () => {
    const { container } = render(
      <MediaCard
        title="T"
        videoUrl="https://example.com/v"
        playSlot={
          <button type="button" aria-label="Play here">
            ▶
          </button>
        }
      />,
    );
    expect(screen.queryByRole('link')).toBeNull();
    const button = screen.getByRole('button', { name: 'Play here' });
    expect(slot(container, 'media-card-play')!.contains(button)).toBe(true);
  });

  it('on-image ink: on the plate for plate, on the root for overlay, nowhere on the card for below', () => {
    const ink = (layout: MediaCardLayout) => {
      const { container, unmount } = render(<MediaCard layout={layout} {...FULL} figure={undefined} />);
      const root = container.firstElementChild as HTMLElement;
      const result = {
        root: root.getAttribute('data-surface-ink'),
        plate: slot(root, 'media-card-plate')?.getAttribute('data-surface-ink') ?? null,
        body: slot(root, 'media-card-body')?.closest('[data-surface-ink]') != null,
      };
      unmount();
      return result;
    };
    expect(ink('below')).toEqual({ root: null, plate: null, body: false });
    expect(ink('plate')).toEqual({ root: null, plate: 'on-image', body: false });
    expect(ink('overlay')).toEqual({ root: 'on-image', plate: null, body: true });
  });

  it('a figure on a below card inks only its media', () => {
    const { container } = render(<MediaCard {...FULL} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).not.toHaveAttribute('data-surface-ink');
    expect(slot(root, 'media-card-figure')!.closest('[data-surface-ink="on-image"]')).not.toBeNull();
    expect(slot(root, 'media-card-body')!.closest('[data-surface-ink]')).toBeNull();
  });

  it('logos are small tiles: white under copy below, glass on the photo', () => {
    const fill = (layout: MediaCardLayout) => {
      const { container, unmount } = render(<MediaCard layout={layout} title="T" logos={[LOGO, { name: 'Halcyon' }]} />);
      const tiles = Array.from(container.querySelectorAll('[data-slot="logo-tile"]'));
      const result = tiles.map((t) => `${t.getAttribute('data-fill')}/${t.getAttribute('data-size')}`);
      unmount();
      return result;
    };
    expect(fill('below')).toEqual(['white/sm', 'white/sm']);
    expect(fill('plate')).toEqual(['glass/sm', 'glass/sm']);
    expect(fill('overlay')).toEqual(['glass/sm', 'glass/sm']);
  });

  it('the tag is a glass badge', () => {
    const { container } = render(<MediaCard title="T" tag="Highlight" />);
    const badge = slot(container, 'media-card-tag')!.querySelector('[data-slot="badge"]');
    expect(badge).toHaveAttribute('data-tone', 'glass');
    expect(badge).toHaveTextContent('Highlight');
  });

  it('passes the image fields to the photo', () => {
    const { container } = render(
      <MediaCard
        title="T"
        image={PHOTO}
        imageAlt="Students at a whiteboard"
        imagePosition="50% 30%"
        imageSrcSet={`${PHOTO} 800w`}
        imageSizes="50vw"
        ratio="16:9"
        priority
      />,
    );
    const img = container.querySelector<HTMLImageElement>('[data-slot="photo-frame-image"]')!;
    expect(img).toHaveAttribute('alt', 'Students at a whiteboard');
    expect(img).toHaveAttribute('sizes', '50vw');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img.style.objectPosition).toBe('50% 30%');
    expect(container.querySelector('[data-slot="photo-frame"]')).toHaveAttribute('data-ratio', '16:9');
  });

  it('ratio defaults to 4:3', () => {
    const { container } = render(<MediaCard title="T" />);
    expect(container.querySelector('[data-slot="photo-frame"]')).toHaveAttribute('data-ratio', '4:3');
  });

  it('children render after the flat parts', () => {
    const { container } = render(
      <MediaCard title="T" description="D">
        <footer data-testid="foot">Foot</footer>
      </MediaCard>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.lastElementChild).toBe(screen.getByTestId('foot'));
  });

  it.each(['article', 'li', 'div'] as const)('as="%s" sets the element', (as) => {
    const { container } = render(
      as === 'li' ? (
        <ul>
          <MediaCard as="li" title="T" />
        </ul>
      ) : (
        <MediaCard as={as} title="T" />
      ),
    );
    expect(slot(container, 'media-card')!.tagName).toBe(as.toUpperCase());
  });

  it('forwards its ref, className and attributes to the root, never a title tooltip', () => {
    const ref = React.createRef<HTMLElement>();
    const { container } = render(<MediaCard ref={ref} title="T" className="extra" data-testid="card" />);
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toHaveClass('extra');
    expect(ref.current).toHaveAttribute('data-testid', 'card');
    expect(ref.current).not.toHaveAttribute('title');
  });

  it.each([
    ['sst', 'light'],
    ['sst', 'dark'],
    ['ssb', 'light'],
    ['ssb', 'dark'],
  ] as const)('renders under data-brand="%s" data-theme="%s" with no console error, setting neither', (brand, theme) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <div data-brand={brand} data-theme={theme}>
        {LAYOUTS.map((layout) => (
          <MediaCard key={layout} layout={layout} {...FULL} />
        ))}
        <MediaCard size="md" layout="plate" title="T" description="D" />
      </div>,
    );
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    const cards = container.querySelectorAll('[data-slot="media-card"]');
    expect(cards).toHaveLength(4);
    for (const card of Array.from(cards)) {
      expect(card).not.toHaveAttribute('data-brand');
      expect(card.querySelectorAll('[data-brand], [data-theme]')).toHaveLength(0);
    }
  });

  it('is exported from the marketing entry', () => {
    expect(marketing.MediaCard).toBe(MediaCard);
  });
});
