import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Banner } from './Banner';
import { BannerCountdown, formatCountdown } from './BannerCountdown';

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
    rerender(
      <Banner tone="danger" role="status">
        x
      </Banner>,
    );
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
    const { rerender } = render(
      <Banner actionLabel="Register" onAction={onAction}>
        x
      </Banner>,
    );
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
    const close = screen.getByRole('button', {
      name: 'Dismiss the placement drive banner',
    });
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
    const { container } = render(
      <Banner actionLabel="End impersonation" actionHref="#x">
        Viewing as aarav.k
      </Banner>,
    );
    const action = container.querySelector('[data-slot=banner-action]') as HTMLElement;
    expect(action).toHaveClass('max-w-full', 'min-w-0', 'flex-wrap');
    expect(action).not.toHaveClass('whitespace-nowrap', 'shrink-0');
    // The message and CTA wrap inside the content column; the glyph and close stay on the first row.
    expect(container.querySelector('[data-slot=banner-content]')).toHaveClass('flex-wrap');
    expect(container.querySelector('[data-slot=banner-content]')).toContainElement(action);
  });
});

describe('Banner · appearance and shine', () => {
  it('subtle is the default; solid swaps to the strong fill and on-solid ink', () => {
    const { rerender } = render(
      <Banner aria-label="n" tone="success">
        x
      </Banner>,
    );
    const el = () => screen.getByLabelText('n');
    expect(el()).toHaveAttribute('data-appearance', 'subtle');
    expect(el()).toHaveClass('bg-success-surface', 'text-success-content');
    rerender(
      <Banner aria-label="n" tone="success" appearance="solid">
        x
      </Banner>,
    );
    expect(el()).toHaveAttribute('data-appearance', 'solid');
    expect(el()).toHaveClass('bg-success', 'text-success-on-solid');
    expect(el()).not.toHaveClass('bg-success-surface');
    rerender(
      <Banner aria-label="n" tone="brand" appearance="solid">
        x
      </Banner>,
    );
    expect(el()).toHaveClass('bg-surface-brand-solid', 'text-content-on-brand-solid');
  });

  it('solid: the close control takes the on-solid ink', () => {
    render(
      <Banner appearance="solid" dismissible>
        x
      </Banner>,
    );
    expect(screen.getByRole('button', { name: 'Dismiss' })).toHaveClass('text-current');
  });

  it('shine is a data attribute (the sheen is CSS), absent by default', () => {
    const { rerender } = render(<Banner aria-label="n">x</Banner>);
    expect(screen.getByLabelText('n')).not.toHaveAttribute('data-shine');
    rerender(
      <Banner aria-label="n" shine>
        x
      </Banner>,
    );
    expect(screen.getByLabelText('n')).toHaveAttribute('data-shine', '');
  });

  it('every first-row part shares the 32px row', () => {
    const { container } = render(
      <Banner actionLabel="Go" onAction={() => {}} dismissible>
        x
      </Banner>,
    );
    expect(container.querySelector('[data-slot=banner-icon]')).toHaveClass('h-control-sm', 'items-center');
    expect(container.querySelector('[data-slot=banner-action]')).toHaveClass('min-h-control-sm');
  });
});

describe('BannerCountdown', () => {
  it('formats with leading zero units dropped', () => {
    expect(formatCountdown(((2 * 24 + 4) * 3600 + 12 * 60 + 9) * 1000)).toBe('2d 04h 12m 09s');
    expect(formatCountdown((4 * 3600 + 5) * 1000)).toBe('04h 00m 05s');
    expect(formatCountdown(65 * 1000)).toBe('01m 05s');
    expect(formatCountdown(-5)).toBe('00m 00s');
  });

  it('ticks after mount, hides the digits from screen readers, and completes once', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-30T12:00:00Z'));
    const onComplete = vi.fn();
    const { container } = render(
      <BannerCountdown
        to="2026-09-30T12:00:03Z"
        label="30 Sep, 5:30 PM IST"
        expiredText="ended"
        onComplete={onComplete}
      />,
    );
    const time = container.querySelector('time') as HTMLTimeElement;
    expect(time).toHaveAttribute('datetime', '2026-09-30T12:00:03.000Z');
    expect(time).toHaveAttribute('data-state', 'running');
    expect(time.querySelector('[aria-hidden=true]')).toHaveTextContent('00m 03s');
    expect(time.querySelector('.sr-only')).toHaveTextContent('30 Sep, 5:30 PM IST');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(time.querySelector('[aria-hidden=true]')).toHaveTextContent('00m 02s');
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(time).toHaveAttribute('data-state', 'expired');
    expect(time.querySelector('[aria-hidden=true]')).toHaveTextContent('ended');
    expect(onComplete).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('renders a stable placeholder on the server', () => {
    const html = renderToString(<BannerCountdown to={Date.now() + 60000} label="in a minute" />);
    expect(html).toContain('data-state="pending"');
    expect(html).toContain('--');
    expect(html).toContain('in a minute');
  });
});
