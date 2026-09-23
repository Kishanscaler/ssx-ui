import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Alert, AlertActions, AlertDescription, AlertTitle } from './Alert';

describe('Alert', () => {
  it('renders the flat fields as slotted parts, with the tone glyph', () => {
    const { container } = render(
      <Alert tone="warning" title="Second fee instalment due" description="₹2,75,000 by 30 Nov 2026." />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-slot', 'alert');
    expect(root).toHaveAttribute('data-tone', 'warning');
    expect(root.className).toContain('bg-warning-surface');
    for (const slot of ['alert-icon', 'alert-body', 'alert-title', 'alert-description']) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-slot="alert-icon"]')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[data-slot="alert-icon"] svg')).not.toBeNull();
    // `title` is ours, not the tooltip attribute.
    expect(root).not.toHaveAttribute('title');
  });

  it('defaults to info, and picks the role per tone', () => {
    const { rerender } = render(<Alert title="Heads up" />);
    expect(screen.getByRole('status')).toHaveAttribute('data-tone', 'info');
    for (const tone of ['info', 'success', 'warning'] as const) {
      rerender(<Alert tone={tone} title="x" />);
      expect(screen.getByRole('status')).toHaveAttribute('data-tone', tone);
    }
    rerender(<Alert tone="danger" title="Document rejected" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Document rejected');
  });

  it('lets the caller override the role', () => {
    render(<Alert tone="warning" role="alert" title="Blocks submit" />);
    expect(screen.getByRole('alert')).toHaveAttribute('data-tone', 'warning');
  });

  it('icon={false} is text-only; a custom icon replaces the glyph', () => {
    const { container, rerender } = render(<Alert icon={false} description="Provisional grades" />);
    expect(container.querySelector('[data-slot="alert-icon"]')).toBeNull();
    expect(container.querySelector('[data-slot="alert-title"]')).toBeNull();
    rerender(<Alert icon={<svg data-testid="mine" />} title="x" />);
    expect(screen.getByTestId('mine')).toBeInTheDocument();
  });

  it('renders compound parts after the flat ones', () => {
    const { container } = render(
      <Alert title="Flat title">
        <AlertDescription>Compound description</AlertDescription>
        <AlertActions>
          <button type="button">Re-upload</button>
        </AlertActions>
      </Alert>,
    );
    const body = container.querySelector('[data-slot="alert-body"]') as HTMLElement;
    expect(Array.from(body.children).map((c) => c.getAttribute('data-slot'))).toEqual([
      'alert-title',
      'alert-description',
      'alert-actions',
    ]);
    render(<AlertTitle>Only a title</AlertTitle>);
    expect(screen.getByText('Only a title')).toHaveAttribute('data-slot', 'alert-title');
  });

  it('flat action: a link with actionHref, else a button calling onAction', () => {
    const onAction = vi.fn();
    const { rerender } = render(<Alert title="x" actionLabel="Pay now" actionHref="/pay" />);
    expect(screen.getByRole('link', { name: 'Pay now' })).toHaveAttribute('href', '/pay');
    rerender(<Alert title="x" actionLabel="Re-upload" onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Re-upload' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    rerender(<Alert title="x" actionLabel="ignored" action={<a href="/own">Own action</a>} />);
    expect(screen.getByRole('link', { name: 'Own action' })).toBeInTheDocument();
    expect(screen.queryByText('ignored')).toBeNull();
  });

  it('dismiss hides the alert and calls onDismiss', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <Alert title="New: chapter markers" dismissible dismissLabel="Dismiss the recordings message" onDismiss={onDismiss} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('pr-10');
    const close = screen.getByRole('button', { name: 'Dismiss the recordings message' });
    expect(close).toHaveAttribute('data-slot', 'alert-dismiss');
    expect(close).toHaveAttribute('data-variant', 'neutral');
    fireEvent.click(close);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(container.firstChild).toBeNull();
  });

  it('preventDefault in onDismiss keeps it (controlled)', () => {
    render(<Alert title="Stay" dismissible onDismiss={(e) => e.preventDefault()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.getByRole('status')).toHaveTextContent('Stay');
  });

  it('forwards the ref, merges className last, and spreads props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Alert ref={ref} className="p-6" id="a1" data-testid="al" title="x" />);
    expect(ref.current).toBe(screen.getByTestId('al'));
    expect(ref.current).toHaveAttribute('id', 'a1');
    expect(ref.current!.className).toContain('p-6');
    expect(ref.current!.className).not.toMatch(/\bp-4\b/);
  });
});
