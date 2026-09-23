import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { ANNOUNCER_SELECTOR } from '../../lib/announce';
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

/**
 * How a user KNOWS it is loading (2026-09-23): the pointer, the screen reader,
 * and an optional visible label. The live region is the package's single
 * shared announcer (src/lib/announce.ts), found by its data attribute.
 */
describe('Button loading: pointer, announcement, loadingText', () => {
  const region = () => document.querySelector<HTMLElement>(ANNOUNCER_SELECTOR);

  /** Every non-empty text the region is given while `fn` runs. */
  const recordAnnouncements = () => {
    const seen: string[] = [];
    const observer = new MutationObserver(() => {
      const text = region()?.textContent ?? '';
      if (text) seen.push(text);
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return { seen, stop: () => observer.disconnect() };
  };

  it('shows cursor: progress while loading, and keeps the pointer for it', () => {
    const { rerender } = render(<Button loading>Apply now</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-loading');
    expect(button.className).toContain('data-loading:cursor-progress');
    // The pointer is only taken away from an aria-disabled button that is NOT
    // loading; `cursor: progress` would be invisible otherwise.
    expect(button.className).toContain('aria-disabled:not-data-loading:pointer-events-none');
    expect(button.className).not.toMatch(/(^|\s)aria-disabled:pointer-events-none(\s|$)/);
    rerender(<Button>Apply now</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-loading');
  });

  it('does not lift or light up under the pointer while loading (hover is idle:, not enabled:)', () => {
    render(<Button loading>Apply now</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('idle:hover:-translate-y-0.5');
    expect(cls).toContain('idle:hover:bg-action-primary-hover');
    expect(cls).not.toMatch(/(^|\s)enabled:(hover|active):/);
  });

  it('announces "Loading" once when loading turns on, and withdraws it when it turns off', async () => {
    const { rerender } = render(<Button>Apply now</Button>);
    const rec = recordAnnouncements();
    rerender(<Button loading>Apply now</Button>);
    await waitFor(() => expect(region()).toHaveTextContent('Loading'));
    // Polite, atomic, visually hidden - and NOT inside the button, so the
    // button's name is untouched.
    expect(region()).toHaveAttribute('aria-live', 'polite');
    expect(region()).toHaveAttribute('aria-atomic', 'true');
    expect(screen.getByRole('button').contains(region())).toBe(false);
    expect(screen.getByRole('button')).toHaveAccessibleName('Apply now');

    rerender(<Button loading={false}>Apply now</Button>);
    expect(region()).toHaveTextContent('');
    rec.stop();
    expect(rec.seen).toEqual(['Loading']);
  });

  it('announces once for several buttons that start loading together', async () => {
    const Pair = ({ busy }: { busy: boolean }) => (
      <>
        <Button loading={busy}>Save</Button>
        <Button loading={busy}>Publish</Button>
      </>
    );
    const { rerender } = render(<Pair busy={false} />);
    const rec = recordAnnouncements();
    rerender(<Pair busy />);
    await waitFor(() => expect(region()).toHaveTextContent('Loading'));
    await new Promise((r) => setTimeout(r, 150));
    rec.stop();
    expect(rec.seen).toEqual(['Loading']);
    rerender(<Pair busy={false} />);
    expect(region()).toHaveTextContent('');
  });

  it('puts the empty live region in the page on mount, before any announcement', () => {
    // SSR-safe (created in an effect, never on the server) and present, idle,
    // before its first message - the pattern screen readers handle reliably.
    render(<Button>Apply now</Button>);
    const el = region();
    expect(el).not.toBeNull();
    expect(el).toHaveTextContent('');
    expect(el).toHaveAttribute('aria-live', 'polite');
    render(<Button>Another</Button>);
    expect(document.querySelectorAll(ANNOUNCER_SELECTOR)).toHaveLength(1);
  });

  it('announces once under StrictMode (effects double-invoked on mount)', async () => {
    const Harness = ({ busy }: { busy: boolean }) => (
      <React.StrictMode>
        <Button loading={busy}>Apply now</Button>
      </React.StrictMode>
    );
    const { rerender } = render(<Harness busy={false} />);
    const rec = recordAnnouncements();
    rerender(<Harness busy />);
    await waitFor(() => expect(region()).toHaveTextContent('Loading'));
    await new Promise((r) => setTimeout(r, 150));
    rec.stop();
    expect(rec.seen).toEqual(['Loading']);
    rerender(<Harness busy={false} />);
    expect(region()).toHaveTextContent('');
  });

  it('stays silent when it mounts already loading', async () => {
    const rec = recordAnnouncements();
    render(<Button loading>Apply now</Button>);
    await new Promise((r) => setTimeout(r, 150));
    rec.stop();
    expect(rec.seen).toEqual([]);
  });

  it('takes an overridden announcement, and null opts out', async () => {
    const { rerender } = render(<Button loadingAnnouncement="Publishing grades">Publish</Button>);
    rerender(
      <Button loading loadingAnnouncement="Publishing grades">
        Publish
      </Button>,
    );
    await waitFor(() => expect(region()).toHaveTextContent('Publishing grades'));
    rerender(<Button loadingAnnouncement={null}>Publish</Button>);
    const rec = recordAnnouncements();
    rerender(
      <Button loading loadingAnnouncement={null}>
        Publish
      </Button>,
    );
    await new Promise((r) => setTimeout(r, 150));
    rec.stop();
    expect(rec.seen).toEqual([]);
  });

  it('announces on an icon-only button too, keeping its aria-label as the name', async () => {
    const { rerender } = render(
      <Button size="icon-md" aria-label="Refresh applicant list">
        <svg />
      </Button>,
    );
    rerender(
      <Button size="icon-md" aria-label="Refresh applicant list" loading>
        <svg />
      </Button>,
    );
    await waitFor(() => expect(region()).toHaveTextContent('Loading'));
    expect(screen.getByRole('button')).toHaveAccessibleName('Refresh applicant list');
    rerender(
      <Button size="icon-md" aria-label="Refresh applicant list">
        <svg />
      </Button>,
    );
    expect(region()).toHaveTextContent('');
  });

  it('loadingText swaps the visible label, and the name follows what is on screen', async () => {
    const { container, rerender } = render(<Button loadingText="Submitting…">Submit application</Button>);
    // At rest nothing changes: no wrapper, the label is the children.
    expect(container.querySelector('[data-slot="button-label"]')).toBeNull();
    expect(screen.getByRole('button')).toHaveAccessibleName('Submit application');

    rerender(
      <Button loading loadingText="Submitting…">
        Submit application
      </Button>,
    );
    const button = screen.getByRole('button');
    // The name is the visible text, once - not "Submit application Submitting…".
    expect(button).toHaveAccessibleName('Submitting…');
    // The original label stays in the layout, invisible and hidden from AT, in
    // the same grid cell, so the button cannot get narrower.
    const label = container.querySelector('[data-slot="button-label"]') as HTMLElement;
    expect(label.className).toContain('inline-grid');
    const holder = label.children[0] as HTMLElement;
    const shown = label.children[1] as HTMLElement;
    expect(holder).toHaveAttribute('aria-hidden', 'true');
    expect(holder.className).toContain('invisible');
    expect(holder).toHaveTextContent('Submit application');
    expect(holder.className).toContain('col-start-1 row-start-1');
    expect(shown.className).toContain('col-start-1 row-start-1');
    expect(shown).toHaveTextContent('Submitting…');
    // ...and it is the default announcement.
    await waitFor(() => expect(region()).toHaveTextContent('Submitting…'));

    rerender(<Button loadingText="Submitting…">Submit application</Button>);
    expect(container.querySelector('[data-slot="button-label"]')).toBeNull();
    expect(screen.getByRole('button')).toHaveAccessibleName('Submit application');
  });

  it('ignores loadingText on a square button and under asChild', () => {
    const { container, rerender } = render(
      <Button size="icon-sm" aria-label="Refresh" loading loadingText="Refreshing…">
        <svg />
      </Button>,
    );
    expect(container.querySelector('[data-slot="button-label"]')).toBeNull();
    expect(screen.getByRole('button')).toHaveAccessibleName('Refresh');
    rerender(
      <Button asChild loading loadingText="Opening…">
        <a href="/apply">Apply now</a>
      </Button>,
    );
    expect(screen.getByRole('link')).toHaveAccessibleName('Apply now');
  });
});

describe('Button on touch devices and narrow screens', () => {
  const cls = (el: HTMLElement) => el.className.split(/\s+/);

  it('has an invisible touch hit area at every size', () => {
    for (const size of ['sm', 'md', 'lg', 'icon-sm', 'icon-md', 'icon-lg'] as const) {
      const { unmount } = render(<Button size={size} aria-label="Go">Go</Button>);
      expect(cls(screen.getByRole('button'))).toContain('touch-target');
      unmount();
    }
  });

  it('keeps the hit area to its own width inside a group, so welded neighbours never overlap', () => {
    render(<Button>Go</Button>);
    expect(cls(screen.getByRole('button'))).toEqual(
      expect.arrayContaining([
        'pointer-coarse:[[data-slot=button-group]>&]:before:w-full',
        'pointer-coarse:[[data-slot=toggle-button-group]>&]:before:w-full',
      ]),
    );
  });

  it('wraps a label too long for its container instead of overflowing: min height, balanced, capped width', () => {
    render(<Button size="md">Download the complete programme brochure</Button>);
    const c = cls(screen.getByRole('button'));
    expect(c).toEqual(expect.arrayContaining(['min-h-control-md', 'max-w-full', 'text-balance', 'text-center', 'break-words']));
    expect(c).not.toContain('whitespace-nowrap');
    expect(c).not.toContain('h-control-md');
  });

  it('keeps the square sizes square', () => {
    render(<Button size="icon-sm" aria-label="Close" />);
    expect(cls(screen.getByRole('button'))).toContain('size-control-sm');
  });
});
