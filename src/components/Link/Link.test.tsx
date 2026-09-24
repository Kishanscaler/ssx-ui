import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Link } from './Link';

describe('Link', () => {
  it('is an anchor with the styling hooks', () => {
    render(<Link href="/curriculum">View the curriculum</Link>);
    const link = screen.getByRole('link', { name: 'View the curriculum' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/curriculum');
    expect(link).toHaveAttribute('data-slot', 'link');
    expect(link).toHaveAttribute('data-variant', 'default');
    expect(link).toHaveClass('underline', 'text-content-link');
  });

  it('quiet underlines on hover only', () => {
    render(
      <Link href="#" variant="quiet">
        Placement report 2025
      </Link>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('data-variant', 'quiet');
    expect(link).toHaveClass('no-underline', 'hover:underline');
  });

  it('external adds a hidden glyph and an sr-only hint, and does not force target', () => {
    const { container } = render(
      <Link href="https://ssb.scaler.com" external>
        SSB admissions
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'SSB admissions (opens in a new tab)' });
    expect(link).toHaveAttribute('data-external');
    expect(link).not.toHaveAttribute('target');
    expect(container.querySelector('[data-slot="link-external-icon"]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('standalone gets an invisible touch hit area; inline (the default) does not', () => {
    render(
      <Link href="#" standalone>
        View all placements
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'View all placements' });
    expect(link).toHaveAttribute('data-standalone');
    expect(link).toHaveClass('touch-target');

    render(<Link href="#">In running text</Link>);
    const inline = screen.getByRole('link', { name: 'In running text' });
    expect(inline).not.toHaveAttribute('data-standalone');
    expect(inline.className).not.toMatch(/\btouch-target\b/);
  });

  it('visited is a prop, not :visited', () => {
    render(
      <Link href="#" visited>
        Week 5
      </Link>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('data-visited');
    expect(link).toHaveClass('text-content-link-hover');
  });

  it('aria-disabled drops href, stays announced as a disabled link', () => {
    render(
      <Link href="/offer.pdf" aria-disabled="true">
        Download offer letter
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Download offer letter' });
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveClass('cursor-not-allowed', 'text-content-disabled');
    expect(link.className).not.toMatch(/hover:/);
  });

  it('asChild renders the child element (next/link) with our styles', () => {
    const RouterLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function RouterLink(props, ref) {
        return <a ref={ref} data-router="" {...props} />;
      },
    );
    const ref = React.createRef<HTMLAnchorElement>();
    render(
      <Link asChild ref={ref} external>
        <RouterLink href="/apply">Apply</RouterLink>
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Apply (opens in a new tab)' });
    expect(link).toHaveAttribute('data-router');
    expect(link).toHaveAttribute('data-slot', 'link');
    expect(link).toHaveAttribute('href', '/apply');
    expect(ref.current).toBe(link);
  });

  it('on a coloured fill it reads the surface-ink contract in its own recipe', () => {
    render(
      <div data-surface-ink="on-brand-solid">
        <Link href="#">Syllabus</Link>
      </div>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveClass(
      'in-data-[surface-ink=on-brand-solid]:text-on-brand-solid-link',
      'in-data-[surface-ink=on-brand-solid]:hover:text-on-brand-solid-link-hover',
      'in-data-[surface-ink=on-brand-solid]:focus-visible:outline-on-brand-solid-ink',
      'in-data-[surface-ink=on-image]:text-on-image-link',
    );
  });

  it('trailingIcon draws a decorative arrow; arrow-circle is the semibold CTA with a ring', () => {
    const { rerender } = render(
      <Link href="#" trailingIcon="arrow">
        Next
      </Link>,
    );
    let link = screen.getByRole('link', { name: 'Next' });
    expect(link).toHaveAttribute('data-trailing-icon', 'arrow');
    expect(link.querySelector('[data-slot=link-trailing-icon]')).toHaveAttribute('aria-hidden', 'true');

    rerender(
      <Link href="#" variant="quiet" trailingIcon="arrow-circle">
        Learn more
      </Link>,
    );
    link = screen.getByRole('link', { name: 'Learn more' });
    expect(link).toHaveClass('group/link', 'inline-flex', 'font-semibold');
    const ring = link.querySelector('[data-slot=link-trailing-icon]')!;
    expect(ring).toHaveAttribute('data-icon', 'arrow-circle');
    // Hover fills the ring and nudges the arrow (not under reduced motion).
    expect(ring).toHaveClass('border-current', 'group-hover/link:bg-current', 'motion-reduce:transition-none');
    expect(ring.querySelector('svg')).toHaveClass('motion-safe:group-hover/link:translate-x-0.5', 'rtl:-scale-x-100');

    // Disabled: the glyph has no hover either.
    rerender(
      <Link href="#" aria-disabled="true" trailingIcon="arrow-circle">
        Closed
      </Link>,
    );
    expect(screen.getByRole('link', { name: 'Closed' }).innerHTML).not.toMatch(/hover:/);
  });

  it('forwards the ref and merges className last', () => {
    const ref = React.createRef<HTMLAnchorElement>();
    render(
      <Link ref={ref} href="#" className="no-underline text-content">
        Mentor
      </Link>,
    );
    expect(ref.current).toBe(screen.getByRole('link'));
    expect(ref.current).toHaveClass('no-underline', 'text-content');
    expect(ref.current).not.toHaveClass('underline', 'text-content-link');
  });
});
