import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Field } from '../Field';
import {
  BottomSheet,
  BottomSheetActions,
  BottomSheetBody,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from './BottomSheet';

/* jsdom has no pointer capture (Radix's outside-pointer handling touches it). */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};

/* jsdom has no PointerEvent, so fireEvent.pointer* would drop clientY / pointerId. */
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventShim extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  (window as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventShim;
}

function Filters({
  contentProps,
  ...root
}: React.ComponentProps<typeof BottomSheet> & {
  contentProps?: Partial<React.ComponentProps<typeof BottomSheetContent>>;
}) {
  return (
    <BottomSheet {...root}>
      <BottomSheetTrigger asChild>
        <Button variant="secondary">Filter applicants</Button>
      </BottomSheetTrigger>
      <BottomSheetContent {...contentProps}>
        <BottomSheetHeader eyebrow="Admissions · Batch of 2029" closeLabel="Close filters">
          <BottomSheetTitle>Filter applicants</BottomSheetTitle>
        </BottomSheetHeader>
        <BottomSheetBody>
          <Field label="Merit scholarship applicants only" orientation="horizontal">
            <Checkbox defaultChecked />
          </Field>
          <BottomSheetActions>
            <Button variant="tertiary">Reset</Button>
            <BottomSheetClose asChild>
              <Button>Show 214 applicants</Button>
            </BottomSheetClose>
          </BottomSheetActions>
        </BottomSheetBody>
      </BottomSheetContent>
    </BottomSheet>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Filter applicants', hidden: true });
const grabber = () => document.querySelector('[data-slot="bottom-sheet-grabber"]') as HTMLElement;

/** jsdom lays nothing out: give the panel a height so the drag threshold means something. */
function setHeight(height: number) {
  const panel = screen.getByRole('dialog');
  Object.defineProperty(panel, 'offsetHeight', { configurable: true, value: height });
  return panel;
}

/** A fake clock for the flick velocity. */
function clock() {
  let t = 1000;
  const spy = vi.spyOn(performance, 'now').mockImplementation(() => t);
  return { tick: (ms: number) => (t += ms), restore: () => spy.mockRestore() };
}

function drag(from: number, to: number, { timeStep = 100 } = {}) {
  const el = grabber();
  const time = clock();
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientY: from });
  time.tick(timeStep);
  fireEvent.pointerMove(el, { pointerId: 1, clientY: to });
  fireEvent.pointerUp(el, { pointerId: 1, clientY: to });
  time.restore();
}

describe('BottomSheet', () => {
  it('renders only the trigger while closed', () => {
    render(<Filters />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('opens a modal dialog labelled by its title, with the grabber, head, body, actions and scrim', () => {
    render(<Filters />);
    fireEvent.click(trigger());
    const sheet = screen.getByRole('dialog', { name: 'Filter applicants' });
    expect(sheet).toHaveAttribute('aria-modal', 'true');
    expect(sheet).toHaveAttribute('data-slot', 'bottom-sheet-content');
    for (const slot of [
      'bottom-sheet-grabber',
      'bottom-sheet-header',
      'bottom-sheet-eyebrow',
      'bottom-sheet-title',
      'bottom-sheet-body',
      'bottom-sheet-actions',
    ]) {
      expect(sheet.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    expect(grabber()).toHaveAttribute('aria-hidden', 'true');
    expect(sheet.className).toContain('max-h-[80dvh]');
    expect(sheet.className).toContain('rounded-t-xl');
    const overlay = document.querySelector('[data-slot="bottom-sheet-overlay"]') as HTMLElement;
    expect(overlay.className).toContain('bg-surface-overlay-scrim');
  });

  it('moves focus in, and Escape closes and returns focus to the trigger', async () => {
    render(<Filters />);
    trigger().focus();
    fireEvent.click(trigger());
    const sheet = screen.getByRole('dialog');
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true));
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });

  it('the × and a BottomSheetClose action close it', async () => {
    const { unmount } = render(<Filters defaultOpen />);
    fireEvent.click(screen.getByRole('button', { name: 'Close filters' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    unmount();

    render(<Filters defaultOpen />);
    fireEvent.click(screen.getByRole('button', { name: 'Show 214 applicants' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('a drag past a quarter of the height closes it', async () => {
    const onOpenChange = vi.fn();
    render(<Filters defaultOpen onOpenChange={onOpenChange} />);
    setHeight(400);
    drag(10, 150);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('a short, slow drag springs back and keeps it open', () => {
    const onOpenChange = vi.fn();
    render(<Filters defaultOpen onOpenChange={onOpenChange} />);
    const panel = setHeight(400);
    const el = grabber();
    const time = clock();
    fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientY: 10 });
    time.tick(400);
    fireEvent.pointerMove(el, { pointerId: 1, clientY: 50 });
    expect(panel.style.transform).toBe('translateY(40px)');
    time.tick(400);
    fireEvent.pointerMove(el, { pointerId: 1, clientY: 50 });
    fireEvent.pointerUp(el, { pointerId: 1, clientY: 50 });
    time.restore();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(panel.style.transform).toBe('');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('a quick flick closes it even when short', () => {
    const onOpenChange = vi.fn();
    render(<Filters defaultOpen onOpenChange={onOpenChange} />);
    setHeight(400);
    drag(10, 60, { timeStep: 20 });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('dragToDismiss={false} ignores the drag; showGrabber={false} drops the grabber', () => {
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <Filters defaultOpen onOpenChange={onOpenChange} contentProps={{ dragToDismiss: false }} />,
    );
    setHeight(400);
    drag(10, 300);
    expect(onOpenChange).not.toHaveBeenCalled();
    unmount();

    render(<Filters defaultOpen contentProps={{ showGrabber: false }} />);
    expect(grabber()).toBeNull();
    expect(screen.getByRole('dialog').className).toContain('[&>[data-slot=bottom-sheet-header]]:pt-5');
  });

  it('forwards refs and merges className last', () => {
    const content = React.createRef<HTMLDivElement>();
    render(
      <BottomSheet defaultOpen>
        <BottomSheetContent ref={content} className="max-h-[60dvh]">
          <BottomSheetHeader>
            <BottomSheetTitle>Pick a campus</BottomSheetTitle>
          </BottomSheetHeader>
        </BottomSheetContent>
      </BottomSheet>,
    );
    expect(content.current).toBe(screen.getByRole('dialog'));
    expect(content.current?.className).toContain('max-h-[60dvh]');
    expect(content.current?.className).not.toContain('max-h-[80dvh]');
  });

  describe('flat form', () => {
    it('builds the trigger, head, body and action row from strings', async () => {
      const onCancel = vi.fn();
      const onConfirm = vi.fn();
      render(
        <BottomSheet
          title="Filter applicants"
          eyebrow="Admissions · Batch of 2029"
          trigger="Filter applicants"
          cancelLabel="Reset"
          onCancel={onCancel}
          confirmLabel="Show 214 applicants"
          onConfirm={onConfirm}
        >
          Filters
        </BottomSheet>,
      );
      expect(trigger()).toHaveAttribute('data-variant', 'secondary');
      fireEvent.click(trigger());
      const sheet = screen.getByRole('dialog', { name: 'Filter applicants' });
      expect(sheet.querySelector('[data-slot="bottom-sheet-body"]')).toHaveTextContent('Filters');
      fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Show 214 applicants' }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });
  });
});
