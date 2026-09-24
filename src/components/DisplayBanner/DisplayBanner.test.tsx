import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  DisplayBanner,
  DisplayBannerActions,
  DisplayBannerArrowLink,
  DisplayBannerContent,
  DisplayBannerCountdown,
  DisplayBannerDescription,
  DisplayBannerEyebrow,
  DisplayBannerFinePrint,
  DisplayBannerMedia,
  DisplayBannerPanel,
  DisplayBannerTitle,
  DisplayBannerTitleMuted,
} from './DisplayBanner';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Link } from '../Link';

/** A stand-in for next/link: a component that forwards its ref to an <a>. */
const RouterLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
  function RouterLink(props, ref) {
    return <a ref={ref} data-router="" {...props} />;
  },
);

const slot = (container: HTMLElement, name: string) => container.querySelector(`[data-slot="${name}"]`);

describe('DisplayBanner', () => {
  it('renders bare, with every axis resolved on data attributes', () => {
    const { container } = render(<DisplayBanner />);
    const root = slot(container, 'display-banner')!;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveAttribute('data-surface', 'subtle');
    expect(root).toHaveAttribute('data-tone', 'brand');
    expect(root).toHaveAttribute('data-media-placement', 'end');
    expect(root).toHaveAttribute('data-layout', 'split');
    expect(root).toHaveAttribute('data-size', 'md');
    expect(root).toHaveAttribute('data-ink', 'page');
    expect(root).toHaveClass('@container/display-banner', 'rounded-2xl', 'overflow-hidden');
    expect(slot(container, 'display-banner-inner')).not.toBeNull();
  });

  it('flat fields build the parts, in order', () => {
    const { container } = render(
      <DisplayBanner
        eyebrow="New cohort"
        title="Gamification"
        titleMuted="Marketing"
        description="Design loops people come back to."
        primaryAction={{ label: 'Apply now', href: '/apply' }}
        secondaryAction={{ label: 'Download brochure', href: '/brochure.pdf' }}
        finePrint="T&C apply."
        mediaSrc="/art.png"
      />,
    );
    const content = slot(container, 'display-banner-content')!;
    const order = Array.from(content.querySelectorAll('[data-slot^="display-banner-"]')).map((el) =>
      el.getAttribute('data-slot'),
    );
    expect(order).toEqual([
      'display-banner-scrim',
      'display-banner-eyebrow',
      'display-banner-title',
      'display-banner-title-muted',
      'display-banner-description',
      'display-banner-actions',
      'display-banner-fine-print',
    ]);
    // The muted line is part of the heading's name, as two words.
    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName('Gamification Marketing');
    expect(screen.getByRole('link', { name: 'Apply now' })).toHaveAttribute('href', '/apply');
    expect(screen.getByRole('link', { name: 'Download brochure' })).toHaveAttribute('data-variant', 'secondary');
    const img = slot(container, 'display-banner-media')!.querySelector('img')!;
    expect(img).toHaveAttribute('src', '/art.png');
    expect(img).toHaveAttribute('alt', '');
  });

  it('a CTA without href is a type="button"', () => {
    render(<DisplayBanner title="Offer" primaryAction={{ label: 'Claim' }} />);
    expect(screen.getByRole('button', { name: 'Claim' })).toHaveAttribute('type', 'button');
  });

  it('a new-tab CTA gets noopener', () => {
    render(<DisplayBanner title="Offer" primaryAction={{ label: 'Claim', href: 'https://x.test', target: '_blank' }} />);
    expect(screen.getByRole('link', { name: 'Claim' })).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('titleAs sets the outline level', () => {
    render(<DisplayBanner title="Scholarships" titleAs="h3" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Scholarships' })).toHaveAttribute(
      'data-slot',
      'display-banner-title',
    );
  });

  it('surface="image" is a background photo under a scrim', () => {
    const { container } = render(
      <DisplayBanner surface="image" mediaPlacement="end" mediaSrc="/campus.jpg" title="Open day" />,
    );
    const root = slot(container, 'display-banner')!;
    // The photo always goes behind, whatever mediaPlacement says.
    expect(root).toHaveAttribute('data-media-placement', 'background');
    expect(root).toHaveAttribute('data-scrim', '');
    expect(root).toHaveAttribute('data-ink', 'image');
    const scrim = slot(container, 'display-banner-scrim')!;
    expect(scrim).toHaveAttribute('aria-hidden', 'true');
    // The scrim is shown by the root's data-scrim and painted in the image scrim token.
    expect(scrim).toHaveClass('group-data-[scrim]/display-banner:block');
    expect(root.className).toContain('[--db-scrim:var(--surface-image-scrim)]');
    // The inner layer declares the on-image contract and inks its own text.
    const inner = slot(container, 'display-banner-inner')!;
    expect(inner).toHaveAttribute('data-surface-ink', 'on-image');
    expect(inner).toHaveClass('text-(--db-ink)');
    expect(root.className).toContain('[--db-ink:var(--on-image-ink)]');
    // A photograph has a real secondary ink, so the muted line is a colour.
    expect(root).toHaveAttribute('data-muted', 'colour');
  });

  it('background media on a tint gets a scrim; glass does not (it has a panel)', () => {
    const { container, rerender } = render(
      <DisplayBanner mediaPlacement="background" mediaSrc="/a.jpg" title="T" />,
    );
    expect(slot(container, 'display-banner')).toHaveAttribute('data-scrim', '');
    rerender(<DisplayBanner surface="glass" mediaPlacement="background" mediaSrc="/a.jpg" title="T" />);
    expect(slot(container, 'display-banner')).not.toHaveAttribute('data-scrim');
    expect(slot(container, 'display-banner-content')).toHaveClass(
      'group-data-[surface=glass]/display-banner:backdrop-blur-md',
    );
  });

  it('solid, inverse and image declare the surface-ink contract on the inner layer; tints and glass do not', () => {
    const { container, rerender } = render(<DisplayBanner surface="solid" tone="brand" title="T" />);
    const root = () => slot(container, 'display-banner')!;
    const inner = () => slot(container, 'display-banner-inner')!;
    expect(root()).toHaveAttribute('data-ink', 'solid');
    expect(root()).toHaveAttribute('data-muted', 'weight');
    expect(inner()).toHaveAttribute('data-surface-ink', 'on-brand-solid');
    // On the inner layer, not the root: the root's own focus ring stays the page's.
    expect(root()).not.toHaveAttribute('data-surface-ink');
    expect(root().className).toContain('[--db-ink:var(--on-brand-solid-ink)]');

    const cases: Array<[React.ComponentProps<typeof DisplayBanner>, string | null]> = [
      [{ surface: 'solid', tone: 'accent1' }, 'on-accent1-solid'],
      [{ surface: 'solid', tone: 'accent2' }, 'on-accent2-solid'],
      [{ surface: 'solid', tone: 'inverse' }, 'on-inverse'],
      [{ surface: 'subtle', tone: 'inverse' }, 'on-inverse'],
      [{ surface: 'gradient', tone: 'inverse' }, 'on-inverse'],
      [{ surface: 'image' }, 'on-image'],
      [{ surface: 'solid', tone: 'neutral' }, null],
      [{ surface: 'subtle', tone: 'brand' }, null],
      [{ surface: 'gradient', tone: 'accent1' }, null],
      [{ surface: 'glass', tone: 'inverse' }, null],
    ];
    for (const [props, ink] of cases) {
      rerender(<DisplayBanner {...props} title="T" />);
      if (ink) expect(inner()).toHaveAttribute('data-surface-ink', ink);
      else expect(inner()).not.toHaveAttribute('data-surface-ink');
    }

    // Inverse has a secondary ink, so the muted line is a colour; the orange has none.
    rerender(<DisplayBanner surface="gradient" tone="inverse" title="T" />);
    expect(root()).toHaveAttribute('data-muted', 'colour');
    expect(root().className).toContain('[--db-ink-2:var(--on-inverse-ink-secondary)]');
    rerender(<DisplayBanner surface="solid" tone="accent2" title="T" />);
    expect(root()).toHaveAttribute('data-muted', 'weight');
    rerender(<DisplayBanner surface="gradient" tone="accent1" title="T" />);
    expect(root()).toHaveAttribute('data-ink', 'page');
    expect(root()).toHaveClass('bg-linear-to-br', 'from-accent1-surface', 'to-page');
  });

  it('never styles another component: no foreign tokens, no descendant rules into other slots', () => {
    const surfaces = ['subtle', 'solid', 'gradient', 'image', 'glass'] as const;
    const tones = ['brand', 'accent1', 'accent2', 'neutral', 'inverse'] as const;
    for (const surface of surfaces) {
      for (const tone of tones) {
        const { container, unmount } = render(
          <DisplayBanner
            surface={surface}
            tone={tone}
            eyebrow="E"
            title="T"
            titleMuted="M"
            description="D"
            primaryAction={{ label: 'P', href: '#p' }}
            secondaryAction={{ label: 'S', href: '#s' }}
            countdownTo="2030-01-01T00:00:00Z"
            countdownLabel="1 Jan 2030"
            finePrint="F"
            mediaSrc="/a.png"
          />,
        );
        // Only the banner's own parts carry the banner's classes.
        const own = Array.from(container.querySelectorAll<HTMLElement>('[data-slot^="display-banner"]'));
        for (const el of own) {
          const cls = el.getAttribute('class') ?? '';
          // No re-pointing of another component's tokens...
          expect(cls).not.toMatch(/\[--(action|content|border|surface|field|status|accent\d?)-[a-z0-9-]*:/);
          // ...and no descendant selector reaching into another component's slot.
          const reaches = cls.match(/\[&[^\s]*data-slot=([a-z-]+)/g) ?? [];
          for (const r of reaches) expect(r).toMatch(/data-slot=display-banner/);
        }
        unmount();
      }
    }
  });

  it('a compound Button on a fill gets the on-fill look from its OWN recipe, hover and press included', () => {
    render(
      <DisplayBanner surface="solid" tone="brand">
        <DisplayBannerContent>
          <DisplayBannerActions>
            <Button>Apply</Button>
            <Button variant="secondary">Brochure</Button>
          </DisplayBannerActions>
        </DisplayBannerContent>
      </DisplayBanner>,
    );
    const primary = screen.getByRole('button', { name: 'Apply' });
    const secondary = screen.getByRole('button', { name: 'Brochure' });
    expect(primary.closest('[data-surface-ink]')).toHaveAttribute('data-surface-ink', 'on-brand-solid');
    // Rest, hover and press read DIFFERENT private properties, loaded from the fill's tokens.
    expect(primary).toHaveClass(
      'in-data-[surface-ink]:bg-(--button-ink)',
      'in-data-[surface-ink]:idle:hover:bg-(--button-ink-hover)',
      'in-data-[surface-ink]:idle:active:bg-(--button-ink-active)',
      'in-data-[surface-ink=on-brand-solid]:[--button-ink-hover:var(--on-brand-solid-action-bg-hover)]',
    );
    expect(secondary).toHaveClass(
      'in-data-[surface-ink]:border-(--button-ink)',
      'in-data-[surface-ink]:idle:hover:bg-(--button-wash-hover)',
      'in-data-[surface-ink]:idle:active:bg-(--button-wash-active)',
    );
  });

  it('popout keeps the root unclipped and reserves room above it', () => {
    const { container } = render(<DisplayBanner mediaPlacement="popout" mediaSrc="/p.png" title="Promo" />);
    const root = slot(container, 'display-banner')!;
    expect(root).toHaveClass('overflow-visible', 'mt-(--display-banner-popout)');
    expect(root).not.toHaveClass('overflow-hidden');
    expect(slot(container, 'display-banner-media')).toHaveClass(
      'group-data-[media-placement=popout]/display-banner:overflow-hidden',
    );
  });

  it('linked: href makes the whole banner ONE link, named by its content, with a drawn CTA', () => {
    const { container } = render(
      <DisplayBanner
        href="/programmes/ai"
        title="AI & ML programme"
        description="Admissions open"
        primaryAction={{ label: 'Explore', href: '/ignored' }}
        secondaryAction={{ label: 'Brochure', href: '/b' }}
      />,
    );
    const link = screen.getByRole('link');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByRole('button')).toBeNull();
    expect(link).toHaveAttribute('href', '/programmes/ai');
    expect(link).toHaveAttribute('data-slot', 'display-banner');
    expect(link).toHaveAttribute('data-linked', '');
    expect(link).toHaveAccessibleName(/AI & ML programme/);
    expect(link).toHaveClass('hover:-translate-y-0.5', 'focus-visible:ring-[3px]', 'motion-reduce:hover:translate-y-0');
    // The CTA is drawn (a span), and the secondary is dropped.
    expect(slot(container, 'display-banner-cta')!.tagName).toBe('SPAN');
    expect(screen.queryByText('Brochure')).toBeNull();
  });

  it('linked: aria-label names the link', () => {
    render(<DisplayBanner href="/x" aria-label="Scholarship test, register by 30 Sep" title="Scholarship" />);
    expect(screen.getByRole('link', { name: 'Scholarship test, register by 30 Sep' })).toBeInTheDocument();
  });

  it('linked: asChild lends the banner to a router link and wraps its children', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <DisplayBanner ref={ref} asChild title="Capstones" className="max-w-96">
        <RouterLink href="/showcase">
          <DisplayBannerContent>
            <DisplayBannerArrowLink>See the work</DisplayBannerArrowLink>
          </DisplayBannerContent>
        </RouterLink>
      </DisplayBanner>,
    );
    const link = screen.getByRole('link', { name: /Capstones.*See the work/ });
    expect(link).toHaveAttribute('data-router');
    expect(link).toHaveAttribute('data-slot', 'display-banner');
    expect(link).toHaveClass('max-w-96');
    expect(ref.current).toBe(link);
    // The children land inside the inner grid, and the arrow CTA is a span.
    expect(link.querySelector('[data-slot=display-banner-inner] [data-slot=display-banner-arrow-link]')!.tagName).toBe(
      'SPAN',
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('arrow appearance renders the CTA as a Link with the circled arrow, and nothing of its own', () => {
    render(<DisplayBanner title="Feature" actionAppearance="arrow" primaryAction={{ label: 'Learn more', href: '/f' }} />);
    const link = screen.getByRole('link', { name: 'Learn more' });
    expect(link).toHaveAttribute('data-slot', 'display-banner-arrow-link');
    // It IS a Link: Link's recipe, variant and glyph.
    expect(link).toHaveAttribute('data-variant', 'quiet');
    expect(link).toHaveAttribute('data-trailing-icon', 'arrow-circle');
    expect(link).toHaveClass('text-content-link', 'hover:underline', 'touch-target');
    expect(link.querySelector('[data-slot=link-trailing-icon]')).toHaveAttribute('aria-hidden', 'true');
    // Same classes as a plain Link with the same props: the wrapper adds no styling.
    const { container } = render(
      <Link href="/f" variant="quiet" standalone trailingIcon="arrow-circle">
        Learn more
      </Link>,
    );
    expect(link.className).toBe(container.querySelector('a')!.className);
  });

  it('countdown: flat fields render a DisplayBannerCountdown with the label for screen readers', () => {
    const { container } = render(
      <DisplayBanner
        title="Early bird"
        countdownTo="2030-01-01T00:00:00+05:30"
        countdownLabel="1 Jan 2030, 12:00 AM IST"
        countdownText="Fee rises in"
      />,
    );
    const cd = slot(container, 'display-banner-countdown')!;
    expect(cd).toHaveTextContent('Fee rises in');
    expect(cd.querySelector('[data-slot=banner-countdown]')).not.toBeNull();
    expect(screen.getByText('1 Jan 2030, 12:00 AM IST')).toHaveClass('sr-only');
  });

  it('fine print is the caption role, pinned to the bottom', () => {
    const { container } = render(<DisplayBanner title="T" finePrint="Offer valid till 30 Sep." />);
    const fp = slot(container, 'display-banner-fine-print')!;
    expect(fp).toHaveAttribute('data-size', 'xs');
    expect(fp).toHaveClass('type-caption', 'mt-auto');
  });

  it('compound parts carry data-slot, forward refs and take className last', () => {
    const refs = {
      content: React.createRef<HTMLDivElement>(),
      title: React.createRef<HTMLHeadingElement>(),
      media: React.createRef<HTMLDivElement>(),
      panel: React.createRef<HTMLDivElement>(),
    };
    const { container } = render(
      <DisplayBanner surface="solid" tone="inverse" layout="wide" size="lg">
        <DisplayBannerContent ref={refs.content} className="gap-8">
          <DisplayBannerEyebrow>Placements</DisplayBannerEyebrow>
          <DisplayBannerTitle ref={refs.title}>
            Hire from Scaler <DisplayBannerTitleMuted>in 30 days</DisplayBannerTitleMuted>
          </DisplayBannerTitle>
          <DisplayBannerDescription>1,200+ partner companies.</DisplayBannerDescription>
          <DisplayBannerCountdown to="2030-01-01T00:00:00Z" label="1 Jan 2030">
            Drive closes in
          </DisplayBannerCountdown>
          <DisplayBannerActions>
            <Button>Post a role</Button>
          </DisplayBannerActions>
          <DisplayBannerFinePrint>Terms apply.</DisplayBannerFinePrint>
        </DisplayBannerContent>
        <DisplayBannerMedia ref={refs.media} inset>
          <DisplayBannerPanel ref={refs.panel}>
            <Badge tone="brand">New</Badge>
          </DisplayBannerPanel>
        </DisplayBannerMedia>
      </DisplayBanner>,
    );
    expect(refs.content.current).toHaveAttribute('data-slot', 'display-banner-content');
    expect(refs.content.current).toHaveClass('gap-8');
    expect(refs.content.current).not.toHaveClass('gap-3');
    expect(refs.title.current).toHaveAttribute('data-slot', 'display-banner-title');
    expect(refs.title.current).toHaveClass('group-data-[size=lg]/display-banner:type-h1');
    expect(refs.media.current).toHaveAttribute('data-inset', '');
    expect(refs.panel.current).toHaveClass('bg-(--db-panel)');
    // Nothing reaches into the Badge: it keeps its own recipe.
    expect(slot(container, 'display-banner-inner')!.className).not.toMatch(/badge|chip/);
    for (const name of ['eyebrow', 'title-muted', 'description', 'countdown', 'actions', 'fine-print']) {
      expect(slot(container, `display-banner-${name}`)).not.toBeNull();
    }
    expect(screen.getByRole('button', { name: 'Post a role' })).toBeInTheDocument();
  });

  it('as sets the element; className merges last', () => {
    const { container } = render(<DisplayBanner as="aside" className="rounded-lg" aria-label="Promo" />);
    const root = slot(container, 'display-banner')!;
    expect(root.tagName).toBe('ASIDE');
    expect(root).toHaveClass('rounded-lg');
    expect(root).not.toHaveClass('rounded-2xl');
  });

  it('forwards the ref to the root', () => {
    const ref = React.createRef<HTMLElement>();
    render(<DisplayBanner ref={ref} title="T" />);
    expect(ref.current).toHaveAttribute('data-slot', 'display-banner');
  });
});
