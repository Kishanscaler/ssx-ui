import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Field } from '../Field';
import { Input } from '../Input';
import {
  BottomSheet,
  BottomSheetActions,
  BottomSheetBody,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetMedia,
  BottomSheetPane,
  BottomSheetSplit,
  BottomSheetTitle,
  BottomSheetTrigger,
  type BottomSheetMediaProps,
  type BottomSheetSplitProps,
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

  describe('size="full" and the split', () => {
    function Apply({
      split,
      mediaProps,
      ...root
    }: React.ComponentProps<typeof BottomSheet> & {
      split?: Partial<BottomSheetSplitProps>;
      mediaProps?: Partial<BottomSheetMediaProps>;
    }) {
      return (
        <BottomSheet {...root}>
          <BottomSheetTrigger asChild>
            <Button>Apply now</Button>
          </BottomSheetTrigger>
          <BottomSheetContent size="full">
            <BottomSheetSplit {...split}>
              <BottomSheetPane>
                <BottomSheetHeader closeLabel="Close application form">
                  <BottomSheetTitle>Apply to Scaler</BottomSheetTitle>
                  <BottomSheetDescription>It takes two minutes.</BottomSheetDescription>
                </BottomSheetHeader>
                <BottomSheetBody>
                  <Field label="Full name">
                    <Input />
                  </Field>
                  <Field label="Email">
                    <Input type="email" />
                  </Field>
                  <BottomSheetActions>
                    <span />
                    <Button type="submit">Request a callback</Button>
                  </BottomSheetActions>
                </BottomSheetBody>
              </BottomSheetPane>
              <BottomSheetMedia {...mediaProps} />
            </BottomSheetSplit>
          </BottomSheetContent>
        </BottomSheet>
      );
    }
    const slot = (name: string) => document.querySelector(`[data-slot="${name}"]`) as HTMLElement;

    it('default size keeps the 80dvh content-sized sheet', () => {
      render(<Filters defaultOpen />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveAttribute('data-size', 'default');
      expect(sheet.className).toContain('max-h-[80dvh]');
      expect(sheet.className).not.toContain('h-[100vh]');
    });

    it('full fills the viewport: 100dvh with a 100vh fallback, square on phones, a top gap and xl corners from sm', () => {
      render(<Apply defaultOpen />);
      const sheet = screen.getByRole('dialog', { name: 'Apply to Scaler' });
      expect(sheet).toHaveAttribute('data-size', 'full');
      const cls = sheet.className.split(/\s+/);
      expect(cls).toEqual(
        expect.arrayContaining([
          'h-[100vh]',
          'supports-[height:100dvh]:h-[100dvh]',
          'rounded-none',
          'pt-[env(safe-area-inset-top)]',
          'pb-[env(safe-area-inset-bottom)]',
          'sm:rounded-t-xl',
          'sm:supports-[height:100dvh]:h-[calc(100dvh-var(--space-8)-env(safe-area-inset-top))]',
          'data-[state=open]:animate-ssx-sheet-in',
          'motion-reduce:animate-none',
        ]),
      );
      expect(cls).not.toContain('max-h-[80dvh]');
      // The grabber is phone-only at full size; the head brings its own top padding.
      expect(grabber().className).toContain('sm:hidden');
      expect(slot('bottom-sheet-header').className).toContain('pt-5');
      expect(slot('bottom-sheet-body').className).toContain('overflow-y-auto');
      // Radix locks the page scroll under a modal sheet.
      expect(document.body).toHaveAttribute('data-scroll-locked');
    });

    it('split: pane first in the DOM (it reads first), media placed first by CSS, ratio and phone mode as data', () => {
      render(<Apply defaultOpen split={{ mediaRatio: '1:1', mediaOnMobile: 'hidden' }} />);
      const split = slot('bottom-sheet-split');
      expect(split).toHaveAttribute('data-media-ratio', '1:1');
      expect(split).toHaveAttribute('data-media-on-mobile', 'hidden');
      expect(split.className).toContain('sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]');
      const [first, second] = Array.from(split.children) as [HTMLElement, HTMLElement];
      expect(first).toHaveAttribute('data-slot', 'bottom-sheet-pane');
      expect(second).toHaveAttribute('data-slot', 'bottom-sheet-media');
      expect(second.className).toContain('order-first');
      expect(second.className).toContain('hidden');
      expect(second.className).toContain('sm:block');
      // The × sits in the pane's head, never on the picture.
      const close = screen.getByRole('button', {
        name: 'Close application form',
      });
      expect(first.contains(close)).toBe(true);
    });

    it('split defaults: 5:7 and a banner on phones', () => {
      render(<Apply defaultOpen />);
      const split = slot('bottom-sheet-split');
      expect(split).toHaveAttribute('data-media-ratio', '5:7');
      expect(split).toHaveAttribute('data-media-on-mobile', 'banner');
      const media = slot('bottom-sheet-media');
      expect(media.className).toContain('aspect-video');
      expect(media.className).toContain('max-h-[30dvh]');
      expect(media.className.split(/\s+/)).not.toContain('hidden');
    });

    it('media: a decorative placeholder, a named placeholder, an image with alt, a decorative image, a child', () => {
      const { unmount } = render(<Apply defaultOpen mediaProps={{ label: 'Campus photo' }} />);
      let media = slot('bottom-sheet-media');
      expect(media).toHaveAttribute('data-placeholder');
      expect(media).toHaveAttribute('aria-hidden', 'true');
      expect(slot('bottom-sheet-media-placeholder')).toHaveTextContent('Campus photo');
      expect(media.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      unmount();

      const second = render(<Apply defaultOpen mediaProps={{ alt: 'Students on the Bengaluru campus' }} />);
      expect(screen.getByRole('img', { name: 'Students on the Bengaluru campus' })).toHaveAttribute(
        'data-slot',
        'bottom-sheet-media',
      );
      second.unmount();

      const third = render(<Apply defaultOpen mediaProps={{ src: '/campus.jpg', alt: 'The SST campus at dusk' }} />);
      const img = screen.getByRole('img', { name: 'The SST campus at dusk' });
      expect(img.tagName).toBe('IMG');
      expect(img).toHaveAttribute('src', '/campus.jpg');
      media = slot('bottom-sheet-media');
      expect(media).not.toHaveAttribute('aria-hidden');
      expect(media).not.toHaveAttribute('data-placeholder');
      expect(media.className).toContain('[&>img]:object-cover');
      third.unmount();

      const fourth = render(<Apply defaultOpen mediaProps={{ src: '/campus.jpg' }} />);
      expect(slot('bottom-sheet-media').querySelector('img')).toHaveAttribute('alt', '');
      expect(screen.queryByRole('img', { name: /.+/ })).toBeNull();
      fourth.unmount();

      render(
        <Apply
          defaultOpen
          mediaProps={{
            children: <img src="/next.jpg" alt="Hackathon night" />,
          }}
        />,
      );
      expect(screen.getByRole('img', { name: 'Hackathon night' })).toHaveAttribute('src', '/next.jpg');
      expect(slot('bottom-sheet-media-placeholder')).toBeNull();
    });

    it('traps focus in the pane, and the × closes and returns focus to the trigger', async () => {
      render(<Apply />);
      const open = screen.getByRole('button', { name: 'Apply now' });
      open.focus();
      fireEvent.click(open);
      const sheet = screen.getByRole('dialog');
      await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true));
      // Radix focus guards wrap Tab at both ends of the content.
      const guards = document.querySelectorAll('[data-radix-focus-guard]');
      expect(guards.length).toBe(2);
      fireEvent.click(screen.getByRole('button', { name: 'Close application form' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(open));
    });

    it('the grabber drag still dismisses a full sheet', () => {
      const onOpenChange = vi.fn();
      render(<Apply defaultOpen onOpenChange={onOpenChange} />);
      setHeight(800);
      drag(10, 260);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('forwards refs and merges className last on the new parts', () => {
      const split = React.createRef<HTMLDivElement>();
      const pane = React.createRef<HTMLDivElement>();
      const media = React.createRef<HTMLDivElement>();
      render(
        <BottomSheet defaultOpen>
          <BottomSheetContent size="full">
            <BottomSheetSplit ref={split} className="sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <BottomSheetPane ref={pane} className="bg-surface-sunken">
                <BottomSheetHeader>
                  <BottomSheetTitle>Pick a campus</BottomSheetTitle>
                </BottomSheetHeader>
              </BottomSheetPane>
              <BottomSheetMedia ref={media} className="max-h-[20dvh]" data-testid="m" />
            </BottomSheetSplit>
          </BottomSheetContent>
        </BottomSheet>,
      );
      expect(split.current).toBe(slot('bottom-sheet-split'));
      expect(split.current?.className).not.toContain('minmax(0,5fr)');
      expect(pane.current?.className).toContain('bg-surface-sunken');
      expect(media.current).toBe(screen.getByTestId('m'));
      expect(media.current?.className).toContain('max-h-[20dvh]');
      expect(media.current?.className).not.toContain('max-h-[30dvh]');
    });

    it('flat form: size, media and the split from props, content first', async () => {
      const onConfirm = vi.fn();
      render(
        <BottomSheet
          size="full"
          title="Apply to Scaler"
          description="Applications close on 30 Apr 2026."
          trigger="Apply now"
          triggerVariant="primary"
          mediaSrc="/campus.jpg"
          mediaAlt="The SST campus"
          mediaRatio="1:2"
          mediaOnMobile="hidden"
          confirmLabel="Request a callback"
          onConfirm={onConfirm}
          closeLabel="Close application form"
        >
          <Field label="Full name">
            <Input />
          </Field>
        </BottomSheet>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Apply now' }));
      const sheet = screen.getByRole('dialog', { name: 'Apply to Scaler' });
      expect(sheet).toHaveAttribute('data-size', 'full');
      expect(sheet).toHaveAccessibleDescription('Applications close on 30 Apr 2026.');
      const split = slot('bottom-sheet-split');
      expect(split).toHaveAttribute('data-media-ratio', '1:2');
      expect(split).toHaveAttribute('data-media-on-mobile', 'hidden');
      expect(split.firstElementChild).toHaveAttribute('data-slot', 'bottom-sheet-pane');
      expect(screen.getByRole('img', { name: 'The SST campus' })).toHaveAttribute('src', '/campus.jpg');
      expect(screen.getByRole('textbox', { name: 'Full name' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Request a callback' }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('flat form: a mediaLabel alone gives the placeholder; no media props, no split', () => {
      const { unmount } = render(
        <BottomSheet defaultOpen size="full" title="Apply to Scaler" mediaLabel="Campus photo">
          Form
        </BottomSheet>,
      );
      expect(slot('bottom-sheet-media')).toHaveAttribute('data-placeholder');
      unmount();

      render(
        <BottomSheet defaultOpen size="full" title="Apply to Scaler">
          Form
        </BottomSheet>,
      );
      expect(slot('bottom-sheet-split')).toBeNull();
      expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'full');
      expect(slot('bottom-sheet-body')).toHaveTextContent('Form');
    });
  });
});
