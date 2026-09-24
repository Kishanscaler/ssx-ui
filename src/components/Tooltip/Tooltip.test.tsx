import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip';

const Download = (root: React.ComponentProps<typeof Tooltip> & { contentClassName?: string }) => {
  const { contentClassName, ...rest } = root;
  return (
    <Tooltip {...rest}>
      <TooltipTrigger asChild>
        <IconButton variant="secondary" aria-label="Download cohort roster">
          <svg />
        </IconButton>
      </TooltipTrigger>
      <TooltipContent className={contentClassName}>Download roster (.csv)</TooltipContent>
    </Tooltip>
  );
};

const trigger = () => screen.getByRole('button', { name: 'Download cohort roster' });

afterEach(() => {
  vi.useRealTimers();
});

describe('Tooltip', () => {
  it('renders only the trigger while closed', () => {
    render(<Download />);
    expect(trigger()).toHaveAttribute('data-slot', 'button');
    expect(trigger()).toHaveAttribute('data-state', 'closed');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('opens at once on keyboard focus and describes the trigger; the name stays the aria-label', () => {
    render(<Download />);
    act(() => {
      trigger().focus();
    });
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('Download roster (.csv)');
    expect(trigger()).toHaveAttribute('aria-describedby', tip.id);
    expect(trigger()).toHaveAccessibleName('Download cohort roster');
    expect(trigger()).toHaveAccessibleDescription('Download roster (.csv)');
  });

  it('closes on blur and on Escape', () => {
    render(<Download />);
    act(() => trigger().focus());
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(trigger(), { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    act(() => trigger().blur());
    act(() => trigger().focus());
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    act(() => trigger().blur());
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('waits the 300ms delay on pointer hover', () => {
    vi.useFakeTimers();
    render(<Download />);
    fireEvent.pointerMove(trigger(), { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.queryByRole('tooltip')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('works without a provider, and under one', () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Download defaultOpen />
      </TooltipProvider>,
    );
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('draws the bubble with slot, side and a className merged last', () => {
    render(<Download defaultOpen contentClassName="px-4 custom" />);
    const bubble = document.querySelector('[data-slot="tooltip-content"]') as HTMLElement;
    expect(bubble).toBeInTheDocument();
    expect(bubble).toHaveAttribute('data-side', 'top');
    expect(bubble).toHaveClass('px-4', 'custom', 'bg-surface-inverse', 'text-content-inverse');
    expect(bubble).not.toHaveClass('px-2');
    expect(bubble.closest('body')).toBe(document.body);
  });

  it('reaches an aria-disabled control (a disabled one would not take focus)', () => {
    render(
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" aria-disabled="true">
            Publish results
          </Button>
        </TooltipTrigger>
        <TooltipContent>Locked until moderation closes</TooltipContent>
      </Tooltip>,
    );
    const btn = screen.getByRole('button', { name: 'Publish results' });
    act(() => btn.focus());
    expect(btn).toHaveAccessibleDescription('Locked until moderation closes');
  });

  it('reaches a truly disabled button through a focusable wrapper that carries the description', () => {
    render(
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} data-testid="wrap">
            <Button variant="secondary" disabled>
              Publish results
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Locked until moderation closes</TooltipContent>
      </Tooltip>,
    );
    const wrap = screen.getByTestId('wrap');
    act(() => wrap.focus());
    expect(wrap).toHaveAccessibleDescription('Locked until moderation closes');
  });

  it('forwards refs to the trigger and the content', () => {
    const t = React.createRef<HTMLButtonElement>();
    const c = React.createRef<HTMLDivElement>();
    render(
      <Tooltip defaultOpen>
        <TooltipTrigger ref={t}>Median CTC</TooltipTrigger>
        <TooltipContent ref={c}>Batch of 2028, verified offers only</TooltipContent>
      </Tooltip>,
    );
    expect(t.current).toHaveAttribute('data-slot', 'tooltip-trigger');
    expect(c.current).toHaveAttribute('data-slot', 'tooltip-content');
  });
});

describe('TooltipContent · long labels (M-07)', () => {
  it('wraps within its max width instead of running off the screen', () => {
    render(<Download defaultOpen />);
    const bubble = document.querySelector('[data-slot=tooltip-content]') as HTMLElement;
    expect(bubble).toHaveClass('break-words', 'text-balance');
    expect(bubble).not.toHaveClass('whitespace-nowrap');
    expect(bubble.className).toContain('max-w-[min(20rem,var(--radix-tooltip-content-available-width))]');
  });

  it('on touch the trigger keeps its own name; the text arrives as a description when opened', () => {
    render(<Download defaultOpen />);
    expect(trigger()).toHaveAccessibleName('Download cohort roster');
    expect(trigger()).toHaveAccessibleDescription('Download roster (.csv)');
  });
});
