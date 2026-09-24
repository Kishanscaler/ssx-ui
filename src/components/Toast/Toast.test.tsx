import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Toaster,
} from './Toast';
import { resetToasts, toast } from './toast-store';

/* jsdom has no pointer capture (Radix swipe). */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.setPointerCapture = () => {};
}

function Host({ children, duration }: { children: React.ReactNode; duration?: number }) {
  return (
    <ToastProvider duration={duration}>
      {children}
      <ToastViewport />
    </ToastProvider>
  );
}

const item = (name: string) => screen.getByText(name).closest('[data-slot="toast"]') as HTMLElement;
/** Radix's announcer: a visually hidden live region, filled a frame after mount. */
const liveRegions = () => Array.from(document.querySelectorAll('[aria-live]')) as HTMLElement[];

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  act(() => {
    resetToasts();
  });
  vi.useRealTimers();
});

describe('Toast', () => {
  it('renders in a labelled region, portalled to <body>, with title, description and a named dismiss', () => {
    render(
      <Host>
        <Toast variant="success" title="Assignment submitted" description="DSA Week 6 · 2 minutes early." />
      </Host>,
    );
    const region = screen.getByRole('region', { name: 'Notifications (F8)' });
    expect(region.parentElement).toBe(document.body);
    const t = item('Assignment submitted');
    expect(t.tagName).toBe('LI');
    expect(t).toHaveAttribute('data-variant', 'success');
    expect(t).toHaveAttribute('data-state', 'open');
    expect(t).toHaveAttribute('data-elevation', 'raised');
    expect(t).toHaveAttribute('data-dismissible', '');
    expect(t.querySelector('[data-slot="toast-title"]')).toHaveTextContent('Assignment submitted');
    expect(t.querySelector('[data-slot="toast-description"]')).toHaveTextContent('DSA Week 6');
    expect(t.querySelector('[data-slot="toast-icon"]')).toHaveClass('text-success-content');
    const dismiss = screen.getByRole('button', { name: 'Dismiss: Assignment submitted' });
    expect(dismiss).toHaveAttribute('data-variant', 'neutral');
  });

  it.each([
    ['success', 'polite'],
    ['info', 'polite'],
    ['warning', 'polite'],
    ['danger', 'assertive'],
  ] as const)('%s is announced %s', (variant, politeness) => {
    render(
      <Host>
        <Toast variant={variant} title={`A ${variant} toast`} />
      </Host>,
    );
    expect(liveRegions().map((n) => n.getAttribute('aria-live'))).toContain(politeness);
  });

  it('dismisses itself after the 4.2s default, and on the dismiss button', () => {
    render(
      <Host>
        <Toast title="Mentor session moved" />
        <Toast title="Saved as draft" duration={Infinity} />
      </Host>,
    );
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('Mentor session moved')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByText('Mentor session moved')).toBeNull();
    expect(screen.getByText('Saved as draft')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss: Saved as draft' }));
    expect(screen.queryByText('Saved as draft')).toBeNull();
  });

  it('pauses while the pointer is over the region', () => {
    render(
      <Host>
        <Toast title="Upload failed" variant="danger" />
      </Host>,
    );
    const region = screen.getByRole('region');
    fireEvent.pointerMove(region);
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
    fireEvent.pointerLeave(region);
    act(() => {
      vi.advanceTimersByTime(4300);
    });
    expect(screen.queryByText('Upload failed')).toBeNull();
  });

  it('closes on Escape when focused, and is controlled two-way', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Host>
        <Toast title="Saved as draft" open onOpenChange={onOpenChange} duration={Infinity} />
      </Host>,
    );
    fireEvent.keyDown(item('Saved as draft'), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByText('Saved as draft')).toBeInTheDocument();
    rerender(
      <Host>
        <Toast title="Saved as draft" open={false} onOpenChange={onOpenChange} duration={Infinity} />
      </Host>,
    );
    expect(screen.queryByText('Saved as draft')).toBeNull();
  });

  it('composes title, description, an action (which closes it) and a custom close', () => {
    const onUndo = vi.fn();
    render(
      <Host>
        <Toast variant="info" dismissible={false} icon={false} duration={Infinity}>
          <ToastTitle>Cohort archived</ToastTitle>
          <ToastDescription>SSB Cohort 5 moved to the archive.</ToastDescription>
          <ToastAction altText="Open Archive to restore it" onClick={onUndo}>
            Undo
          </ToastAction>
          <ToastClose>Got it</ToastClose>
        </Toast>
      </Host>,
    );
    const t = item('Cohort archived');
    expect(t).not.toHaveAttribute('data-dismissible');
    expect(t.querySelector('[data-slot="toast-icon"]')).toBeNull();
    expect(screen.queryByRole('button', { name: /Dismiss/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Got it' })).toHaveAttribute('data-slot', 'toast-close');
    const undo = screen.getByRole('button', { name: 'Undo' });
    expect(undo).toHaveAttribute('data-slot', 'button');
    expect(undo).toHaveAttribute('data-variant', 'tertiary');
    fireEvent.click(undo);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Cohort archived')).toBeNull();
  });

  it('merges className last and forwards refs', () => {
    const t = React.createRef<HTMLLIElement>();
    const v = React.createRef<HTMLOListElement>();
    render(
      <ToastProvider>
        <Toast ref={t} title="Assignment submitted" className="p-6 custom" />
        <ToastViewport ref={v} />
      </ToastProvider>,
    );
    expect(t.current).toHaveAttribute('data-slot', 'toast');
    expect(t.current).toHaveClass('p-6', 'custom');
    expect(t.current).not.toHaveClass('p-4');
    expect(v.current).toHaveAttribute('data-slot', 'toast-viewport');
  });
});

describe('Toaster + toast()', () => {
  it('shows, stacks and dismisses toasts from the imperative helper', () => {
    render(<Toaster />);
    const onClick = vi.fn();
    let id = '';
    act(() => {
      id = toast.success('Assignment submitted', { description: 'DSA Week 6' });
      toast({
        variant: 'danger',
        title: 'Upload failed',
        description: 'transcript.pdf exceeds the 10 MB limit.',
        action: { label: 'Retry', onClick },
        duration: Infinity,
      });
    });
    expect(item('Assignment submitted')).toHaveAttribute('data-variant', 'success');
    expect(item('Upload failed')).toHaveAttribute('data-variant', 'danger');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    act(() => toast.dismiss(id));
    expect(screen.queryByText('Assignment submitted')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Upload failed')).toBeNull();
  });

  it('shows a toast fired before the Toaster mounted, and re-using an id replaces it', () => {
    act(() => {
      toast.info('Mentor session moved', { id: 'session' });
    });
    render(<Toaster />);
    expect(screen.getByText('Mentor session moved')).toBeInTheDocument();
    act(() => {
      toast.warning('Mentor session moved again', { id: 'session' });
    });
    expect(screen.queryByText('Mentor session moved')).toBeNull();
    expect(item('Mentor session moved again')).toHaveAttribute('data-variant', 'warning');
  });

  it('calls onDismiss when the toast times out', () => {
    const onDismiss = vi.fn();
    render(<Toaster duration={1000} />);
    act(() => {
      toast.success('Saved', { onDismiss });
    });
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});

describe('ToastViewport · small and short screens (M-01 / M-13)', () => {
  const viewport = () => {
    const v = React.createRef<HTMLOListElement>();
    render(
      <ToastProvider>
        <ToastViewport ref={v} />
      </ToastProvider>,
    );
    return v.current as HTMLOListElement;
  };

  it('shows at most three (the newest, at the bottom), one on a screen under 500px tall', () => {
    const cls = viewport().className;
    expect(cls).toContain('[&>li:nth-last-child(n+4)]:hidden');
    expect(cls).toContain('[@media(max-height:499px)]:[&>li:nth-last-child(n+2)]:hidden');
    expect(cls).toContain('content-end');
  });

  it('never taller than the screen (dvh, vh fallback); an over-tall stack scrolls inside', () => {
    const v = viewport();
    expect(v).toHaveClass('max-h-screen', 'supports-[height:100dvh]:max-h-dvh', 'overflow-y-auto');
  });

  it('gutters grow by the safe-area insets, with a 0px fallback; full width with 16px gutters on phones', () => {
    const cls = viewport().className;
    for (const c of [
      'pr-[calc(1.5rem+env(safe-area-inset-right,0px))]',
      'pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]',
      'pt-[calc(1.5rem+env(safe-area-inset-top,0px))]',
      'max-sm:left-0',
      'max-sm:pl-[calc(1rem+env(safe-area-inset-left,0px))]',
      'max-sm:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]',
    ]) {
      expect(cls).toContain(c);
    }
  });

  it('the gutter is click-through; only the toasts take the pointer', () => {
    const v = viewport();
    expect(v).toHaveClass('pointer-events-none', '[&>*]:pointer-events-auto');
  });
});
