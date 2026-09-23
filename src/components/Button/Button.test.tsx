import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Button } from './Button';

/**
 * These are CONTRACT tests, not snapshot tests. Each one asserts a promise the
 * component makes to a consumer — the shadcn `data-slot` hook, the `asChild`
 * escape hatch, the busy semantics — and a snapshot would pass for all of them
 * and tell us nothing.
 */
describe('Button', () => {
  it('carries the shadcn styling hooks', () => {
    render(
      <Button variant="danger" size="lg">
        Withdraw application
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-slot', 'button');
    expect(button).toHaveAttribute('data-variant', 'danger');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('defaults to type="button", so it cannot submit a form by accident', () => {
    render(<Button>Apply now</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('keeps an explicit type when one is given', () => {
    render(<Button type="submit">Apply now</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('stays focusable while loading, and reports busy rather than disappearing', () => {
    render(<Button loading>Apply now</Button>);
    const button = screen.getByRole('button', { name: 'Apply now' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
  });

  it('renders a spinner while loading, and none when idle', () => {
    const { container, rerender } = render(<Button loading>Apply now</Button>);
    expect(container.querySelector('[data-slot="spinner"]')).not.toBeNull();

    rerender(<Button>Apply now</Button>);
    expect(container.querySelector('[data-slot="spinner"]')).toBeNull();
  });

  it('keeps the label visible while loading, so the button cannot resize mid-submit', () => {
    render(<Button loading>Apply now</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Apply now');
  });

  it('swallows clicks while loading', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Apply now
      </Button>,
    );
    screen.getByRole('button').click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps the spinner out of the accessible name, so the wait is announced once', () => {
    const { container } = render(<Button loading>Apply now</Button>);
    // aria-busy on the button IS the announcement; a "Loading" status inside it
    // would be a second one for the same wait.
    const spinner = container.querySelector('[data-slot="spinner"]');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
    expect(spinner).not.toHaveAttribute('role');
    expect(screen.getByRole('button')).toHaveAccessibleName('Apply now');
  });

  it.each(['sm', 'icon-sm'] as const)(
    'shows the six-dot grid while loading at size="%s" (small sizes use the dots loader)',
    (size) => {
      const { container } = render(
        <Button loading size={size} aria-label="Saving draft">
          Save
        </Button>,
      );
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveAttribute('data-kind', 'dots');
      expect(spinner!.querySelectorAll('[data-part="dot"]')).toHaveLength(6);
    },
  );

  it.each(['md', 'lg', 'icon-md', 'icon-lg'] as const)(
    'shows the monogram while loading at size="%s" (bigger sizes use the mark)',
    (size) => {
      const { container } = render(
        <Button loading size={size} aria-label="Saving draft">
          Save
        </Button>,
      );
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveAttribute('data-kind', 'monogram');
      expect(spinner).toHaveAttribute('data-size', 'sm');
      expect(spinner!.querySelector('[data-part="dot"]')).toBeNull();
    },
  );

  it('defaults to md, so a bare loading button shows the monogram', () => {
    const { container } = render(<Button loading>Apply now</Button>);
    expect(container.querySelector('[data-slot="spinner"]')).toHaveAttribute('data-kind', 'monogram');
  });

  it('flags shine only when asked, on the element the stylesheet reads', () => {
    const { rerender } = render(<Button shine>Apply now</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-shine');

    rerender(<Button>Apply now</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-shine');
  });

  it('emits shine on danger as asked, leaving the suppression to one place', () => {
    // The rule "destructive things do not shine" lives in components.css next
    // to the rule it overrides. Dropping the attribute here too would put the
    // same rule in two places, and they would eventually disagree.
    render(
      <Button variant="danger" shine>
        Withdraw application
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-shine');
    expect(button).toHaveAttribute('data-variant', 'danger');
  });

  it('replaces the icon on a square button while loading, so one glyph shares the box', () => {
    const { container, rerender } = render(
      <Button loading size="icon-md" aria-label="Adding module">
        <svg data-testid="icon" />
      </Button>,
    );
    expect(container.querySelector('[data-slot="spinner"]')).not.toBeNull();
    expect(screen.queryByTestId('icon')).toBeNull();
    // The name has to survive the icon going away.
    expect(screen.getByRole('button')).toHaveAccessibleName('Adding module');

    rerender(
      <Button size="icon-md" aria-label="Add module">
        <svg data-testid="icon" />
      </Button>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('keeps the label beside the spinner on a text button, so it cannot resize', () => {
    render(<Button loading>Apply now</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Apply now');
  });

  it('renders the child element under asChild, keeping the styles', () => {
    render(
      <Button asChild>
        <a href="/apply">Apply now</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Apply now' });
    expect(link).toHaveAttribute('data-slot', 'button');
    expect(link).toHaveAttribute('href', '/apply');
  });

  it('keeps the spinner outside the slotted child under asChild', () => {
    const { container } = render(
      <Button asChild loading>
        <a href="/apply">Apply now</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Apply now' });
    expect(container.querySelector('[data-slot="spinner"]')).not.toBeNull();
    expect(link).toHaveTextContent('Apply now');
  });

  it('places icons around the label in DOM order', () => {
    const { container } = render(
      <Button>
        <svg data-testid="lead" />
        Apply now
        <svg data-testid="trail" />
      </Button>,
    );
    const html = container.innerHTML;
    expect(html.indexOf('lead')).toBeLessThan(html.indexOf('Apply now'));
    expect(html.indexOf('Apply now')).toBeLessThan(html.indexOf('trail'));
  });

  it('lets className win over the variant it conflicts with', () => {
    render(<Button className="px-8">Apply now</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('px-8');
    expect(cls).not.toContain('px-4');
  });

  it('forwards a ref to the underlying element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Apply now</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
