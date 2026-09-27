import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { ANNOUNCER_SELECTOR } from '../../lib/announce';
import componentsCss from '../../styles/components.css?raw';
import { ChatReasoning, formatReasoningDuration } from './ChatReasoning';
import { ThinkingIndicator } from './ThinkingIndicator';

const region = () => document.querySelector(ANNOUNCER_SELECTOR);

describe('ThinkingIndicator', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is the monogram loader beside a label, the label marked for the shimmer', () => {
    const { container } = render(<ThinkingIndicator />);
    const root = container.querySelector('[data-slot="thinking-indicator"]') as HTMLElement;
    const spinner = root.querySelector('[data-slot="spinner"]') as HTMLElement;
    expect(spinner).toHaveAttribute('data-kind', 'monogram');
    expect(spinner).toHaveAttribute('data-size', 'md');
    // Silent: the wait is announced once, through the shared region.
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
    expect(spinner).not.toHaveAttribute('role');
    const label = root.querySelector('[data-slot="thinking-indicator-label"]') as HTMLElement;
    expect(label).toHaveTextContent('Thinking…');
    expect(label).toHaveAttribute('data-shimmer');
    expect(label).toHaveClass('text-content-secondary');
    // Not a live region of its own.
    expect(root).not.toHaveAttribute('aria-live');
    expect(root).not.toHaveAttribute('role');
  });

  it('shimmer={false} and showSpinner={false}', () => {
    const { container } = render(<ThinkingIndicator shimmer={false} showSpinner={false} label="Reading your submission…" />);
    expect(container.querySelector('[data-slot="thinking-indicator-label"]')).not.toHaveAttribute('data-shimmer');
    expect(container.querySelector('[data-slot="spinner"]')).toBeNull();
    expect(screen.getByText('Reading your submission…')).toBeInTheDocument();
  });

  it('announces once on mount, not on re-render, and withdraws on unmount', () => {
    vi.useFakeTimers();
    const { rerender, unmount } = render(<ThinkingIndicator />);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(region()).toHaveTextContent('Thinking');
    expect(region()).toHaveAttribute('aria-live', 'polite');
    rerender(<ThinkingIndicator label="Reading your submission…" />);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(region()?.textContent).toBe('Thinking');
    unmount();
    expect(region()?.textContent).toBe('');
  });

  it('announcement overrides the words; null stays silent', () => {
    vi.useFakeTimers();
    const { unmount } = render(<ThinkingIndicator announcement="Scaler Tutor is writing a reply" />);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(region()?.textContent).toBe('Scaler Tutor is writing a reply');
    unmount();
    render(<ThinkingIndicator announcement={null} />);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(region()?.textContent).toBe('');
  });

  it('the stylesheet stops the shimmer and restores the fill under reduced motion (the contract it keys off)', () => {
    const css = componentsCss.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).toContain("[data-slot='thinking-indicator-label'][data-shimmer]");
    const reduce = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)', css.indexOf('ssx-thinking-shimmer')));
    expect(reduce).toMatch(/\[data-slot='thinking-indicator-label'\]\[data-shimmer\][\s\S]*?animation: none;[\s\S]*?-webkit-text-fill-color: currentColor/);
  });
});

describe('ChatReasoning', () => {
  it('is collapsed by default, with the duration in its header', () => {
    render(<ChatReasoning duration={12}>The range halves on every pass.</ChatReasoning>);
    const trigger = screen.getByRole('button', { name: 'Thought for 12s' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('data-slot', 'chat-reasoning-trigger');
    expect(screen.queryByText('The range halves on every pass.')).toBeNull();
  });

  it('toggles open and closed; the body is secondary text', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <ChatReasoning duration={74} onOpenChange={onOpenChange}>
        The range halves on every pass.
      </ChatReasoning>,
    );
    const trigger = screen.getByRole('button', { name: 'Thought for 1m 14s' });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    const body = container.querySelector('[data-slot="chat-reasoning-body"]') as HTMLElement;
    expect(body).toHaveTextContent('The range halves on every pass.');
    expect(body).toHaveClass('text-content-secondary', 'type-body-sm');
    expect(trigger).toHaveAttribute('aria-controls', container.querySelector('[data-slot="chat-reasoning-content"]')?.id);
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('thinking: the header reads "Thinking…" with the shimmer; label replaces it', () => {
    const { container, rerender } = render(<ChatReasoning thinking duration={3} />);
    const label = container.querySelector('[data-slot="chat-reasoning-label"]');
    expect(label).toHaveTextContent('Thinking…');
    expect(label).toHaveAttribute('data-shimmer');
    rerender(<ChatReasoning label="Show working" />);
    expect(screen.getByRole('button', { name: 'Show working' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="chat-reasoning-label"]')).not.toHaveAttribute('data-shimmer');
  });

  it('formats durations', () => {
    expect(formatReasoningDuration(0.4)).toBe('0s');
    expect(formatReasoningDuration(12)).toBe('12s');
    expect(formatReasoningDuration(60)).toBe('1m');
    expect(formatReasoningDuration(125)).toBe('2m 5s');
  });
});
