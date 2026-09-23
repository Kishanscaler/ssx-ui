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
