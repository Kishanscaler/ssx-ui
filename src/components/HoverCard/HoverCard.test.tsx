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
    render(<Mentor defaultOpen contentProps={{ align: 'end', className: 'w-[22.5rem] custom' }} />);
    const note = card() as HTMLElement;
    expect(note).toHaveAttribute('data-align', 'end');
    expect(note).toHaveAttribute('data-elevation', 'raised');
    expect(note).toHaveClass('w-[22.5rem]', 'custom', 'bg-surface-raised', 'p-4');
    expect(note).not.toHaveClass('w-[18.75rem]');
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

/**
 * jsdom has no PointerEvent, so `fireEvent.pointerDown(el, { pointerType })`
 * would drop the pointer type. A minimal one, for this file only.
 */
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventStandIn extends MouseEvent {
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? '';
    }
  }
  (window as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventStandIn;
}

describe('HoverCard · touch (M-08)', () => {
  const tap = (el: HTMLElement) => {
    fireEvent.pointerDown(el, { pointerType: 'touch' });
    fireEvent.click(el);
  };

  function LinkMentor({ tapBehavior }: { tapBehavior?: 'auto' | 'preview-first' | 'none' }) {
    return (
      <HoverCard>
        <HoverCardTrigger href="#mentor" tapBehavior={tapBehavior}>
          Ishita Raghunathan
        </HoverCardTrigger>
        <HoverCardContent aria-label="Profile preview: Ishita Raghunathan">
          <div>Principal Engineer</div>
        </HoverCardContent>
      </HoverCard>
    );
  }
  const link = () => screen.getByRole('link', { name: 'Ishita Raghunathan' });

  it('a non-link trigger opens on a tap and closes on the next', () => {
    render(<Mentor />);
    tap(trigger());
    expect(card()).toBeInTheDocument();
    tap(trigger());
    expect(card()).toBeNull();
  });

  it('a mouse click does not take the tap path (hover and focus still drive it)', () => {
    render(<Mentor />);
    fireEvent.pointerDown(trigger(), { pointerType: 'mouse' });
    fireEvent.click(trigger());
    expect(card()).toBeNull();
  });

  it("'none' turns the tap path off", () => {
    render(
      <HoverCard>
        <HoverCardTrigger asChild tapBehavior="none">
          <Button variant="tertiary">Ishita Raghunathan</Button>
        </HoverCardTrigger>
        <HoverCardContent aria-label="Profile preview: Ishita Raghunathan">x</HoverCardContent>
      </HoverCard>,
    );
    tap(trigger());
    expect(card()).toBeNull();
  });

  it("a link trigger navigates on a tap by default ('auto'): no preview, default not prevented", () => {
    render(<LinkMentor />);
    fireEvent.pointerDown(link(), { pointerType: 'touch' });
    const notPrevented = fireEvent.click(link());
    expect(notPrevented).toBe(true);
    expect(card()).toBeNull();
  });

  it("'preview-first': the first tap previews and does not navigate; the second tap follows the link", () => {
    render(<LinkMentor tapBehavior="preview-first" />);
    fireEvent.pointerDown(link(), { pointerType: 'touch' });
    expect(fireEvent.click(link())).toBe(false);
    expect(card()).toBeInTheDocument();
    fireEvent.pointerDown(link(), { pointerType: 'touch' });
    expect(fireEvent.click(link())).toBe(true);
  });

  it("'preview-first' leaves a mouse click on the link alone", () => {
    render(<LinkMentor tapBehavior="preview-first" />);
    fireEvent.pointerDown(link(), { pointerType: 'mouse' });
    expect(fireEvent.click(link())).toBe(true);
    expect(card()).toBeNull();
  });

  it('the card is capped at the available height and scrolls', () => {
    render(<Mentor defaultOpen />);
    expect(card()).toHaveClass('max-h-(--radix-hover-card-content-available-height)', 'overflow-y-auto');
  });

  it('composes the caller’s onPointerDown / onClick', () => {
    const onPointerDown = vi.fn();
    const onClick = vi.fn();
    render(
      <HoverCard>
        <HoverCardTrigger asChild onPointerDown={onPointerDown} onClick={onClick}>
          <Button variant="tertiary">Ishita Raghunathan</Button>
        </HoverCardTrigger>
        <HoverCardContent aria-label="Profile preview: Ishita Raghunathan">x</HoverCardContent>
      </HoverCard>,
    );
    tap(trigger());
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(card()).toBeInTheDocument();
  });
});
