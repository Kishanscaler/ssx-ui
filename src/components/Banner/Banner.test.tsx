import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Banner } from './Banner';

describe('Banner', () => {
  it('renders the slotted parts with the tone glyph', () => {
    const { container } = render(
      <Banner tone="warning" message="Fee due in 6 days." actionLabel="Pay now" actionHref="/pay" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-slot', 'banner');
    expect(root).toHaveAttribute('data-tone', 'warning');
    expect(root.className).toContain('border-b');
    expect(root.className).toContain('rounded-none');
    for (const slot of ['banner-icon', 'banner-message', 'banner-action']) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    const cta = screen.getByRole('link', { name: 'Pay now' });
    expect(cta).toHaveAttribute('href', '/pay');
    expect(cta).toHaveAttribute('data-variant', 'secondary');
    expect(cta).toHaveAttribute('data-size', 'sm');
  });

  it('role: danger is alert, the rest (brand included) are status', () => {
    const { rerender } = render(<Banner>Maintenance</Banner>);
    expect(screen.getByRole('status')).toHaveAttribute('data-tone', 'info');
    for (const tone of ['success', 'warning', 'brand'] as const) {
      rerender(<Banner tone={tone}>x</Banner>);
      expect(screen.getByRole('status')).toHaveAttribute('data-tone', tone);
    }
    rerender(<Banner tone="danger">Impersonating</Banner>);
    expect(screen.getByRole('alert')).toHaveTextContent('Impersonating');
    rerender(<Banner tone="danger" role="status">x</Banner>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('message and children share the message slot; icon={false} removes the glyph', () => {
    const { container } = render(
      <Banner icon={false} message="You are viewing as ">
        <strong>aarav.k@sst.scaler.com</strong>
      </Banner>,
    );
    expect(container.querySelector('[data-slot="banner-icon"]')).toBeNull();
    expect(container.querySelector('[data-slot="banner-message"]')).toHaveTextContent(
      'You are viewing as aarav.k@sst.scaler.com',
    );
  });

  it('flat action without href is a button calling onAction; `action` wins', () => {
    const onAction = vi.fn();
    const { rerender } = render(<Banner actionLabel="Register" onAction={onAction}>x</Banner>);
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    rerender(
      <Banner actionLabel="ignored" action={<a href="/status">Status page</a>}>
        x
      </Banner>,
    );
    expect(screen.getByRole('link', { name: 'Status page' })).toBeInTheDocument();
    expect(screen.queryByText('ignored')).toBeNull();
  });

  it('dismiss hides it and calls onDismiss; preventDefault keeps it', () => {
    const onDismiss = vi.fn();
    const { container, rerender } = render(
      <Banner dismissible dismissLabel="Dismiss the placement drive banner" onDismiss={onDismiss}>
        Registrations close 30 Sep.
      </Banner>,
    );
    const close = screen.getByRole('button', { name: 'Dismiss the placement drive banner' });
    expect(close).toHaveAttribute('data-slot', 'banner-dismiss');
    fireEvent.click(close);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(container.firstChild).toBeNull();

    rerender(<></>);
    render(
      <Banner dismissible onDismiss={(e) => e.preventDefault()}>
        Stays
      </Banner>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.getByRole('status')).toHaveTextContent('Stays');
  });

  it('forwards the ref, merges className last, and spreads props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Banner ref={ref} className="px-6" aria-label="Site notice">
        x
      </Banner>,
    );
    expect(ref.current).toHaveAttribute('aria-label', 'Site notice');
    expect(ref.current!.className).toContain('px-6');
    // a caller's px-* replaces the gutter padding on both sides
    expect(ref.current!.className).not.toMatch(/\bp[lr]-\[max\(var\(--space-gutter\)/);
  });

  it('sits on the page gutter (16px on a phone, 24px from sm), clear of a notch', () => {
    render(<Banner aria-label="Site notice">x</Banner>);
    const c = screen.getByLabelText('Site notice').className.split(/\s+/);
    expect(c).toContain('pl-[max(var(--space-gutter),env(safe-area-inset-left,0px))]');
    expect(c).toContain('pr-[max(var(--space-gutter),env(safe-area-inset-right,0px))]');
  });
});

describe('Banner · narrow widths (M-12)', () => {
  it('the action wraps below the message and is never wider than the banner', () => {
    const { container } = render(<Banner actionLabel="End impersonation" actionHref="#x">Viewing as aarav.k</Banner>);
    const action = container.querySelector('[data-slot=banner-action]') as HTMLElement;
    expect(action).toHaveClass('max-w-full', 'min-w-0', 'flex-wrap');
    expect(action).not.toHaveClass('whitespace-nowrap', 'shrink-0');
    expect(container.querySelector('[data-slot=banner]')).toHaveClass('flex-wrap');
  });
});
