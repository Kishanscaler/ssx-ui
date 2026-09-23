import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ClickableCard } from './ClickableCard';
import { CardBody, CardTitle } from '../Card';

/** A stand-in for next/link: a component that forwards its ref to an <a>. */
const RouterLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
  function RouterLink(props, ref) {
    return <a ref={ref} data-router="" {...props} />;
  },
);

describe('ClickableCard', () => {
  it('with href is one link, named by its content', () => {
    render(
      <ClickableCard href="/modules/dsa" eyebrow="Module 06" title="Data Structures" description="Week 6 of 12" />,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/modules/dsa');
    expect(link).toHaveAttribute('data-slot', 'clickable-card');
    expect(link).toHaveAttribute('data-variant', 'default');
    expect(link).toHaveAccessibleName(/Data Structures/);
    // Exactly one interactive element.
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('without href is a type="button" for an in-page action', () => {
    const onClick = vi.fn();
    render(<ClickableCard title="Book 1:1 with Naman" onClick={onClick} />);
    const button = screen.getByRole('button', { name: /Book 1:1/ });
    expect(button).toHaveAttribute('type', 'button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('a disabled button card is disabled', () => {
    render(<ClickableCard title="Full" disabled />);
    expect(screen.getByRole('button', { name: 'Full' })).toBeDisabled();
  });

  it('adds noopener for a new tab', () => {
    render(<ClickableCard href="https://scaler.com" target="_blank" title="Out" />);
    expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('asChild styles a router link and injects the flat content into it', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <ClickableCard ref={ref} asChild title="Capstone showcase" className="max-w-80">
        <RouterLink href="/showcase" />
      </ClickableCard>,
    );
    const link = screen.getByRole('link', { name: 'Capstone showcase' });
    expect(link).toHaveAttribute('data-router');
    expect(link).toHaveAttribute('data-slot', 'clickable-card');
    expect(link).toHaveClass('max-w-80', 'hover:-translate-y-0.5');
    expect(ref.current).toBe(link);
  });

  it('accepts compound children', () => {
    render(
      <ClickableCard href="/x">
        <CardBody>
          <CardTitle>Compound</CardTitle>
        </CardBody>
      </ClickableCard>,
    );
    expect(screen.getByRole('link', { name: 'Compound' })).toBeInTheDocument();
  });

  it('carries the hover lift, the brand border, focus ring and the reduced-motion fallback', () => {
    render(<ClickableCard href="/x" title="t" />);
    const cls = screen.getByRole('link').className;
    for (const c of [
      'hover:-translate-y-0.5',
      'hover:border-border-brand',
      'focus-visible:ring-[3px]',
      'motion-reduce:hover:translate-y-0',
      'motion-reduce:transition-none',
    ]) {
      expect(cls).toContain(c);
    }
  });

  it('media variant deepens the scrim on hover instead of a border', () => {
    render(<ClickableCard variant="media" href="/r" title="Where the Batch of 2028 went" image="/p.jpg" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('data-variant', 'media');
    expect(link.className).toContain('hover:before:from-58%');
    expect(link.className).not.toContain('hover:border-border-brand');
  });

  it('forwards the ref and merges className last', () => {
    const ref = React.createRef<HTMLElement>();
    render(<ClickableCard ref={ref} href="/x" title="t" className="rounded-none" />);
    expect(ref.current?.tagName).toBe('A');
    expect(ref.current).toHaveClass('rounded-none');
    expect(ref.current).not.toHaveClass('rounded-lg');
  });
});
