import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Button } from '../Button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './HoverCard';

function Mentor({
  contentProps,
  ...root
}: React.ComponentProps<typeof HoverCard> & {
  contentProps?: Partial<React.ComponentProps<typeof HoverCardContent>>;
}) {
  return (
    <p>
      Week 9 review is led by{' '}
      <HoverCard {...root}>
        <HoverCardTrigger asChild>
          <Button variant="tertiary" size="sm">
            Ishita Raghunathan
          </Button>
        </HoverCardTrigger>
        <HoverCardContent aria-label="Profile preview: Ishita Raghunathan" {...contentProps}>
          <div>Principal Engineer · Distributed Systems</div>
        </HoverCardContent>
      </HoverCard>
      .
    </p>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Ishita Raghunathan' });
const card = () => screen.queryByRole('note', { name: 'Profile preview: Ishita Raghunathan' });

afterEach(() => {
  vi.useRealTimers();
});

describe('HoverCard', () => {
  it('describes the trigger with the card content while closed, without opening anything', () => {
    render(<Mentor />);
    expect(card()).toBeNull();
    expect(trigger()).toHaveAccessibleDescription('Principal Engineer · Distributed Systems');
    const copy = document.querySelector('[data-slot="hover-card-description"]') as HTMLElement;
    expect(copy).toHaveAttribute('hidden');
    // Portalled, never nested inside the <p>.
    expect(copy.closest('p')).toBeNull();
  });

  it('opens after the 400ms hover intent as a role="note", and the ids never duplicate', () => {
    vi.useFakeTimers();
    render(<Mentor />);
    fireEvent.pointerEnter(trigger(), { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(card()).toBeNull();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    const note = card() as HTMLElement;
    expect(note).toBeInTheDocument();
    expect(note).toHaveAttribute('data-slot', 'hover-card-content');
    expect(note).toHaveAttribute('data-state', 'open');
    expect(document.querySelectorAll(`[id="${note.id}"]`)).toHaveLength(1);
    expect(trigger()).toHaveAttribute('aria-describedby', note.id);
  });

  it('closes 200ms after the pointer leaves, and stays while it moves into the card', () => {
    vi.useFakeTimers();
    render(<Mentor defaultOpen />);
    fireEvent.pointerLeave(trigger(), { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.pointerEnter(card() as HTMLElement, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(card()).toBeInTheDocument();
    fireEvent.pointerLeave(card() as HTMLElement, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(card()).toBeNull();
  });

  it('opens on keyboard focus and closes on blur', () => {
    vi.useFakeTimers();
    render(<Mentor />);
    act(() => trigger().focus());
    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(card()).toBeInTheDocument();
    act(() => trigger().blur());
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(card()).toBeNull();
  });

  it('is controlled two-way', () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const { rerender } = render(<Mentor open={false} onOpenChange={onOpenChange} />);
    act(() => trigger().focus());
    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(card()).toBeNull();
    rerender(<Mentor open onOpenChange={onOpenChange} />);
    expect(card()).toBeInTheDocument();
  });

  it('keeps a caller aria-describedby alongside the card', () => {
    render(
      <HoverCard>
        <HoverCardTrigger aria-describedby="hint" href="/mentors/ishita">
          Ishita
        </HoverCardTrigger>
        <HoverCardContent>Principal Engineer</HoverCardContent>
        <span id="hint">Mentor</span>
      </HoverCard>,
    );
    const link = screen.getByRole('link', { name: 'Ishita' });
    expect(link).toHaveAttribute('data-slot', 'hover-card-trigger');
    expect(link.getAttribute('aria-describedby')).toMatch(/^hint \S+$/);
    expect(link).toHaveAccessibleDescription('Mentor Principal Engineer');
  });

  it('draws the 300px popover surface, placement, className merged last', () => {
    render(<Mentor defaultOpen contentProps={{ align: 'end', className: 'w-[360px] custom' }} />);
    const note = card() as HTMLElement;
    expect(note).toHaveAttribute('data-align', 'end');
    expect(note).toHaveAttribute('data-elevation', 'raised');
    expect(note).toHaveClass('w-[360px]', 'custom', 'bg-surface-raised', 'p-4');
    expect(note).not.toHaveClass('w-[300px]');
  });

  it('forwards refs to the trigger and the content', () => {
    const t = React.createRef<HTMLAnchorElement>();
    const c = React.createRef<HTMLDivElement>();
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger ref={t} href="/students/aarav">
          Aarav Krishnan
        </HoverCardTrigger>
        <HoverCardContent ref={c}>SST-2029-0416</HoverCardContent>
      </HoverCard>,
    );
    expect(t.current?.tagName).toBe('A');
    expect(c.current).toHaveAttribute('data-slot', 'hover-card-content');
  });
});
