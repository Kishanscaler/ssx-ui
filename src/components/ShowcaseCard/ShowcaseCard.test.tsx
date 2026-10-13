import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ShowcaseCard } from './ShowcaseCard';
import * as marketing from '../../marketing';

const slot = (root: ParentNode, name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const slots = (root: ParentNode, name: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`));

const PHOTO = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

const FULL = {
  title: 'Hummusapiens',
  tag: 'Food & beverage',
  image: PHOTO,
  figure: '₹50L',
  figureLabel: 'offered on Shark Tank India',
  people: [{ name: 'Aashish US', avatar: PHOTO }, { name: 'Moh Agarwal' }],
  peopleRole: 'Cohort 1',
  description: 'Hummus in jars, sold across Bengaluru.',
  href: 'https://example.com',
  videoUrl: 'https://example.com/film.mp4',
};

afterEach(() => vi.restoreAllMocks());

describe('ShowcaseCard', () => {
  it('renders every marker with its data-part', () => {
    const { container } = render(<ShowcaseCard {...FULL} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('ARTICLE');
    expect(root).toHaveAttribute('data-slot', 'showcase-card');
    expect(root).toHaveAttribute('data-media', 'photo');
    for (const name of [
      'showcase-card-media',
      'showcase-card-tag',
      'showcase-card-figure',
      'showcase-card-figure-label',
      'showcase-card-play',
      'showcase-card-body',
      'showcase-card-head',
      'showcase-card-title',
      'showcase-card-link',
      'showcase-card-people',
      'showcase-card-avatar',
      'showcase-card-names',
      'showcase-card-role',
      'showcase-card-footer',
      'showcase-card-description',
    ])
      expect(slot(root, name), name).not.toBeNull();
    expect(slot(root, 'showcase-card-title')).toHaveAttribute('data-part', 'title');
    expect(slot(root, 'showcase-card-people')).toHaveAttribute('data-part', 'avatars');
    expect(slot(root, 'showcase-card-role')).toHaveAttribute('data-part', 'subline');
    expect(slot(root, 'showcase-card-description')).toHaveAttribute('data-part', 'description');
    // The figure is the Figure (its own data-part), inside the on-image region.
    const figure = slot(root, 'showcase-card-figure')!;
    expect(figure).toHaveAttribute('data-surface-ink', 'on-image');
    expect(slot(figure, 'figure')).toHaveAttribute('data-part', 'figure');
    expect(slot(figure, 'figure')).toHaveTextContent('₹50L');
    // The photo is PhotoFrame's layer, blurred toward its foot under a scrim.
    const frame = slot(root, 'photo-frame')!;
    expect(frame).toHaveAttribute('data-blur', 'bottom');
    expect(frame).toHaveAttribute('data-scrim');
    expect(slot(frame, 'photo-frame-media')).toHaveAttribute('data-part', 'photo');
    // No `logos` part on this card.
    expect(root.querySelector('[data-part="logos"]')).toBeNull();
  });

  it('the tag is the light glass badge', () => {
    const { container } = render(<ShowcaseCard title="T" tag="Sports" image={PHOTO} />);
    const tag = slot(container, 'showcase-card-tag')!;
    expect(tag).toHaveAttribute('data-tone', 'glass');
    expect(tag).toHaveTextContent('Sports');
  });

  it('each optional slot omitted renders nothing', () => {
    const { container } = render(<ShowcaseCard title="Just a title" />);
    const root = container.firstElementChild as HTMLElement;
    for (const name of [
      'showcase-card-tag',
      'showcase-card-figure',
      'showcase-card-figure-label',
      'showcase-card-play',
      'showcase-card-link',
      'showcase-card-people',
      'showcase-card-role',
      'showcase-card-footer',
      'showcase-card-description',
      'showcase-card-action',
      'showcase-card-banner',
    ])
      expect(slot(root, name), name).toBeNull();
    expect(slot(root, 'showcase-card-title')!.innerHTML).toBe('Just a title');
  });

  it('no photo and no banner: the plate, white type on it', () => {
    const { container } = render(<ShowcaseCard title="T" figure="12,000+" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-media', 'plate');
    const frame = slot(root, 'photo-frame')!;
    expect(frame).toHaveAttribute('data-placeholder', 'plate');
    expect(frame).toHaveAttribute('data-surface-ink', 'on-image');
  });

  it('no figure: the photo is plain (no blur, no scrim); no label without a figure', () => {
    const { container } = render(<ShowcaseCard title="T" image={PHOTO} figureLabel="orphan" />);
    const frame = slot(container, 'photo-frame')!;
    expect(frame).not.toHaveAttribute('data-blur');
    expect(frame).not.toHaveAttribute('data-scrim');
    expect(slot(container, 'photo-frame-blur')).toBeNull();
    expect(slot(container, 'showcase-card-figure-label')).toBeNull();
  });

  it('a figure without a label renders the figure alone', () => {
    const { container } = render(<ShowcaseCard title="T" image={PHOTO} figure="200K" />);
    expect(slot(container, 'showcase-card-figure')).not.toBeNull();
    expect(slot(container, 'showcase-card-figure-label')).toBeNull();
  });

  it('a banner sets its colours as custom properties and draws the banner across the square', () => {
    const { container } = render(
      <ShowcaseCard title="Gahan AI" banner={PHOTO} bannerTop="#981619" bannerBottom="#AF4446" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-media', 'banner');
    const banner = slot(root, 'showcase-card-banner')!;
    expect(banner.style.getPropertyValue('--ssx-banner-top')).toBe('#981619');
    expect(banner.style.getPropertyValue('--ssx-banner-bottom')).toBe('#AF4446');
    expect(banner).toHaveAttribute('aria-hidden', 'true');
    expect(banner.querySelector('img')).toHaveAttribute('src', PHOTO);
    expect(banner.className).toContain('from-(--ssx-banner-top)');
  });

  it('a photo wins over a banner', () => {
    const { container } = render(<ShowcaseCard title="T" image={PHOTO} banner={PHOTO} bannerTop="red" />);
    expect(slot(container, 'showcase-card-banner')).toBeNull();
    expect(slot(container, 'photo-frame-image')).not.toBeNull();
  });

  it('people: image avatars, initials until there is a photo, names and the role', () => {
    const { container } = render(
      <ShowcaseCard
        title="T"
        people={[
          { name: 'Mayank Kelwani', avatar: PHOTO },
          { name: 'Sanskriti Deshmukh', avatar: PHOTO },
          { name: 'Ravi Kumar Singh' },
        ]}
        peopleRole="Cohort 1"
      />,
    );
    const avatars = slots(container, 'showcase-card-avatar');
    expect(avatars).toHaveLength(3);
    expect(avatars[0]!.tagName).toBe('IMG');
    expect(avatars[0]).toHaveAttribute('alt', '');
    expect(avatars[0]).toHaveAttribute('width', '28');
    expect(avatars[2]!.tagName).toBe('SPAN');
    expect(avatars[2]).toHaveTextContent('RK');
    // Drawn as the system's Avatar (`sm`), photo and initials alike, cut out
    // of each other by AvatarGroup's surface ring.
    for (const avatar of avatars) {
      expect(avatar).toHaveClass('size-control-xs', 'rounded-full', 'ring-thick', 'ring-surface');
    }
    expect(avatars[2]).toHaveClass('bg-surface-brand-subtle', 'text-content-brand', 'font-bold');
    // Photos overlap by AvatarGroup's step; the initials disc keeps clear of its neighbour.
    expect(avatars[1]!.className).toContain('-ms-2.5');
    expect(avatars[2]!.className).not.toContain('-ms-2');
    // The avatars are decorative: the names are written out.
    expect(avatars[0]!.parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(slot(container, 'showcase-card-names')).toHaveTextContent(
      'Mayank Kelwani, Sanskriti Deshmukh, Ravi Kumar Singh',
    );
    expect(slot(container, 'showcase-card-role')).toHaveTextContent('Cohort 1');
  });

  it('people without a role: no role line', () => {
    const { container } = render(<ShowcaseCard title="T" people={[{ name: 'Moh Agarwal' }]} />);
    expect(slot(container, 'showcase-card-people')).not.toBeNull();
    expect(slot(container, 'showcase-card-role')).toBeNull();
  });

  it('initials drop a "Dr." (the family\'s one helper)', () => {
    const { container } = render(<ShowcaseCard title="T" people={[{ name: 'Dr. Priya Menon' }]} />);
    expect(slot(container, 'showcase-card-avatar')).toHaveTextContent('PM');
  });

  it('href makes the title a link, always named by the title', () => {
    render(<ShowcaseCard title="Hummusapiens" href="https://example.com" />);
    const heading = screen.getByRole('heading', { level: 3 });
    const link = screen.getByRole('link', { name: 'Hummusapiens' });
    expect(heading).toContainElement(link);
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('data-slot', 'showcase-card-link');
    expect(link).not.toHaveAttribute('aria-label');
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('hrefLabel: the title stays plain and a quiet arrow action at the foot carries the words', () => {
    const { container } = render(
      <ShowcaseCard title="Hummusapiens" href="https://example.com" hrefLabel="Visit the site" description="D" />,
    );
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    const action = links[0]!;
    expect(action).toHaveAccessibleName('Visit the site');
    expect(action).not.toHaveAttribute('aria-label');
    expect(action).toHaveAttribute('href', 'https://example.com');
    expect(action).toHaveAttribute('data-slot', 'showcase-card-action');
    expect(action).toHaveAttribute('data-part', 'action');
    expect(action).toHaveAttribute('data-variant', 'quiet');
    expect(action).toHaveAttribute('data-trailing-icon', 'arrow');
    expect(slot(container, 'showcase-card-title')!.querySelector('a')).toBeNull();
    // At the foot, after the description.
    const footer = slot(container, 'showcase-card-footer')!;
    expect(footer.lastElementChild).toBe(action);
    expect(footer.firstElementChild).toBe(slot(container, 'showcase-card-description'));
  });

  it('the frame is 16:9 stacked and square beside the copy; it names no ratio', () => {
    const { container } = render(<ShowcaseCard title="T" image={PHOTO} />);
    const frame = slot(container, 'photo-frame')!;
    expect(frame).not.toHaveAttribute('data-ratio');
    expect(frame).toHaveClass('aspect-video', '@min-region-sm/showcase-card:aspect-square');
    expect(frame).not.toHaveClass('aspect-square');
  });

  it('an empty CMS string is an unset field (no element, no marker)', () => {
    const { container } = render(
      <ShowcaseCard
        title="T"
        tag=""
        image=""
        figure=""
        figureLabel=""
        description=""
        peopleRole=""
        people={[{ name: 'Moh Agarwal' }]}
        banner=""
        videoUrl=""
        href=""
        hrefLabel=""
      />,
    );
    for (const name of [
      'showcase-card-tag',
      'showcase-card-figure',
      'showcase-card-play',
      'showcase-card-link',
      'showcase-card-role',
      'showcase-card-footer',
      'showcase-card-description',
      'showcase-card-action',
      'showcase-card-banner',
    ])
      expect(slot(container, name), name).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('data-media', 'plate');
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('titleAs sets the outline level', () => {
    render(<ShowcaseCard title="T" titleAs="h2" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('T');
  });

  it('videoUrl renders the family play disc (same tab, "Play: <title>", the square its hit area); playSlot replaces it', () => {
    const { container, rerender } = render(<ShowcaseCard title="Pitch day" image={PHOTO} videoUrl="https://example.com/v" />);
    const play = slot(container, 'showcase-card-play')!;
    const link = screen.getByRole('link', { name: 'Play: Pitch day' });
    expect(play).toContainElement(link);
    expect(link).toHaveAttribute('href', 'https://example.com/v');
    expect(link).toHaveAttribute('data-slot', 'play-disc');
    expect(link).not.toHaveAttribute('target');
    expect(link).toHaveClass('size-full');
    const disc = link.firstElementChild!;
    expect(disc).toHaveClass('size-control-lg', 'rounded-full', 'backdrop-blur-glass');
    expect(disc.className).toContain('bg-(--ssx-plate-on-photo,var(--surface-image-scrim))');

    rerender(
      <ShowcaseCard
        title="Pitch day"
        image={PHOTO}
        videoUrl="https://example.com/v"
        playSlot={<button type="button">Open the video</button>}
      />,
    );
    expect(screen.queryByRole('link', { name: 'Play: Pitch day' })).toBeNull();
    expect(slot(container, 'showcase-card-play')).toContainElement(screen.getByRole('button', { name: 'Open the video' }));
  });

  it('as, ref, className and passthrough props; never the title tooltip', () => {
    const ref = React.createRef<HTMLElement>();
    const { container } = render(
      <ul>
        <ShowcaseCard ref={ref} as="li" title="T" className="extra" data-testid="card" />
      </ul>,
    );
    const root = slot(container, 'showcase-card')!;
    expect(ref.current).toBe(root);
    expect(root.tagName).toBe('LI');
    expect(root).toHaveClass('extra');
    expect(root).toHaveAttribute('data-testid', 'card');
    expect(root).not.toHaveAttribute('title');
  });

  it.each([
    ['sst', 'light'],
    ['sst', 'dark'],
    ['ssb', 'light'],
    ['ssb', 'dark'],
  ] as const)('renders under data-brand="%s" data-theme="%s" without console errors, setting neither', (brand, theme) => {
    const error = vi.spyOn(console, 'error');
    const warn = vi.spyOn(console, 'warn');
    const { container } = render(
      <div data-brand={brand} data-theme={theme}>
        <ShowcaseCard {...FULL} />
        <ShowcaseCard title="Gahan AI" banner={PHOTO} bannerTop="#981619" bannerBottom="#AF4446" />
        <ShowcaseCard title="Plate" />
      </div>,
    );
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    const roots = slots(container, 'showcase-card');
    expect(roots).toHaveLength(3);
    for (const root of roots) {
      expect(root.querySelectorAll('[data-brand], [data-theme]')).toHaveLength(0);
      expect(root).not.toHaveAttribute('data-brand');
    }
  });

  it('is exported from the marketing entry', () => {
    expect(marketing.ShowcaseCard).toBe(ShowcaseCard);
    expect(typeof marketing.showcaseCardVariants).toBe('function');
  });
});
