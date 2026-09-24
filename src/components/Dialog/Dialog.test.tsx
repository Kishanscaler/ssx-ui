import { dialogContentVariants } from './Dialog';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Button } from '../Button';
import { Input } from '../Input';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMedia,
  DialogTitle,
  DialogTrigger,
} from './Dialog';

/* jsdom has no pointer capture (Radix's outside-pointer handling touches it). */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
}

function Publish({
  contentProps,
  ...root
}: React.ComponentProps<typeof Dialog> & { contentProps?: Partial<React.ComponentProps<typeof DialogContent>> }) {
  return (
    <Dialog {...root}>
      <DialogTrigger asChild>
        <Button>Publish Week 6 grades</Button>
      </DialogTrigger>
      <DialogContent {...contentProps}>
        <DialogHeader icon={<svg data-testid="head-icon" />}>
          <DialogTitle>Publish Week 6 grades?</DialogTitle>
          <DialogDescription>84 students in Cohort 7 will be emailed.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Input aria-label="Note to students" />
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="tertiary">Cancel</Button>
          </DialogClose>
          <Button>Publish to 84 students</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A real outside press: Radix listens a tick after mount and dismisses on the click. */
async function pressOutside(el: Element) {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fireEvent.pointerDown(el, { button: 0 });
  fireEvent.pointerUp(el, { button: 0 });
  fireEvent.click(el, { button: 0 });
}

const trigger = (name = 'Publish Week 6 grades') => screen.getByRole('button', { name, hidden: true });

describe('Dialog', () => {
  it('renders only the trigger while closed, announcing a dialog', () => {
    render(<Publish />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveAttribute('data-slot', 'button');
  });

  it('opens a modal dialog labelled by its title and described by its description', () => {
    render(<Publish />);
    fireEvent.click(trigger());
    const dialog = screen.getByRole('dialog', { name: 'Publish Week 6 grades?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('data-slot', 'dialog-content');
    expect(dialog).toHaveAttribute('data-variant', 'default');
    expect(dialog).toHaveAttribute('data-elevation', 'raised');
    expect(dialog).toHaveAccessibleDescription('84 students in Cohort 7 will be emailed.');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    for (const slot of ['dialog-header', 'dialog-header-icon', 'dialog-title', 'dialog-description', 'dialog-body', 'dialog-footer']) {
      expect(dialog.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    expect(document.querySelector('[data-slot="dialog-overlay"]')).not.toBeNull();
  });

  it('dims the page with the overlay scrim token, never the inverse surface', () => {
    // User decision 2026-09-23: in dark mode surface-inverse is LIGHT, so the
    // old recipe turned the page grey. The veil's alpha is in the colour, so
    // there is no opacity utility on it either.
    render(<Publish />);
    fireEvent.click(trigger());
    const overlay = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;
    expect(overlay.className).toContain('bg-surface-overlay-scrim');
    expect(overlay.className).not.toContain('bg-surface-inverse');
    expect(overlay.className).not.toContain('opacity-');
  });

  it('moves focus into the panel, and Escape closes it and returns focus to the trigger', async () => {
    render(<Publish />);
    trigger().focus();
    fireEvent.click(trigger());
    const dialog = screen.getByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Note to students' }));
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });

  it('traps Tab: from the last control focus wraps to the first', async () => {
    render(<Publish />);
    fireEvent.click(trigger());
    const dialog = screen.getByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    const last = screen.getByRole('button', { name: 'Publish to 84 students' });
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Note to students' }));
  });

  it('locks page scroll and hides the rest of the page while open', async () => {
    render(<Publish />);
    fireEvent.click(trigger());
    await waitFor(() => expect(document.body).toHaveAttribute('data-scroll-locked'));
    expect(trigger().closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('DialogClose closes it', async () => {
    render(<Publish />);
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('is controllable', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Publish open={false} onOpenChange={onOpenChange} />);
    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<Publish open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('destructive: an alertdialog, focus on the safe answer, the scrim does not dismiss', async () => {
    render(<Publish defaultOpen contentProps={{ variant: 'destructive' }} />);
    const dialog = screen.getByRole('alertdialog', { name: 'Publish Week 6 grades?' });
    expect(dialog).toHaveAttribute('data-variant', 'destructive');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' })));
    await pressOutside(document.querySelector('[data-slot="dialog-overlay"]') as Element);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('default: a pointer down outside dismisses', async () => {
    render(<Publish defaultOpen />);
    await pressOutside(document.querySelector('[data-slot="dialog-overlay"]') as Element);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('showClose draws a named × button that closes', async () => {
    render(<Publish defaultOpen contentProps={{ showClose: true, closeLabel: 'Close publish dialog' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close publish dialog' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('forwards refs and merges className (content and parts)', () => {
    const content = React.createRef<HTMLDivElement>();
    const footer = React.createRef<HTMLDivElement>();
    render(
      <Dialog defaultOpen>
        <DialogContent ref={content} className="max-w-none w-[45rem]">
          <DialogTitle className="text-content-brand">Title</DialogTitle>
          <DialogFooter ref={footer} className="justify-start" />
        </DialogContent>
      </Dialog>,
    );
    expect(content.current).toBe(screen.getByRole('dialog'));
    expect(content.current?.className).toContain('w-[45rem]');
    expect(content.current?.className).not.toContain('w-[min(520px');
    expect(footer.current?.className).toContain('justify-start');
    expect(footer.current?.className).not.toContain('justify-end');
    expect(screen.getByText('Title').className).toContain('text-content-brand');
  });

  it('non-modal: no aria-modal', () => {
    render(<Publish defaultOpen modal={false} />);
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
  });

  describe('flat form', () => {
    it('builds trigger, header, body and footer from strings', () => {
      render(
        <Dialog
          title="Withdraw application SST-2029-0416?"
          description="This cannot be undone."
          trigger="Withdraw application"
          variant="destructive"
          cancelLabel="Keep application"
          confirmLabel="Withdraw application"
        >
          Re-applying is only possible in the next admission cycle.
        </Dialog>,
      );
      const open = screen.getByRole('button', { name: 'Withdraw application' });
      expect(open).toHaveAttribute('data-variant', 'danger');
      fireEvent.click(open);
      const dialog = screen.getByRole('alertdialog', { name: 'Withdraw application SST-2029-0416?' });
      expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
      expect(dialog.querySelector('[data-slot="dialog-body"]')).toHaveTextContent('next admission cycle');
      const buttons = dialog.querySelectorAll('[data-slot="dialog-footer"] [data-slot="button"]');
      expect([...buttons].map((b) => b.textContent)).toEqual(['Keep application', 'Withdraw application']);
      expect(buttons[1]).toHaveAttribute('data-variant', 'danger');
    });

    it('confirm calls onConfirm and closes; preventDefault keeps it open', async () => {
      const onConfirm = vi.fn();
      const { unmount } = render(
        <Dialog defaultOpen title="Publish?" confirmLabel="Publish" onConfirm={onConfirm} />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      unmount();

      render(
        <Dialog
          defaultOpen
          title="Publish?"
          confirmLabel="Publish"
          confirmLoading
          onConfirm={(event) => event.preventDefault()}
        />,
      );
      const confirm = screen.getByRole('button', { name: 'Publish' });
      expect(confirm).toHaveAttribute('aria-busy', 'true');
      fireEvent.click(confirm);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

describe('Dialog on a short screen (N-11)', () => {
  it('keeps 8px from the edges when the height is 480px or less', () => {
    const cls = dialogContentVariants();
    expect(cls).toContain('max-h-[calc(100dvh-2rem)]');
    expect(cls).toContain('[@media(max-height:480px)]:max-h-[calc(100dvh-1rem)]');
  });
});

describe('Dialog · media layouts', () => {
  function MediaDialog({ layout, src }: { layout: 'strip' | 'split'; src?: string }) {
    return (
      <Dialog defaultOpen>
        <DialogContent layout={layout} showClose>
          <DialogHeader>
            <DialogTitle>Apply</DialogTitle>
          </DialogHeader>
          <DialogMedia src={src} data-testid="media" label="Campus photo" />
          <DialogBody>x</DialogBody>
        </DialogContent>
      </Dialog>
    );
  }

  it('strip: a flush 2:1 band drawn first; the × gets a raised chip and the head no end padding', () => {
    render(<MediaDialog layout="strip" src="/campus.jpg" />);
    const content = screen.getByRole('dialog');
    const media = screen.getByTestId('media');
    expect(content).toHaveAttribute('data-layout', 'strip');
    expect(content).toHaveClass('overflow-hidden', 'rounded-xl');
    expect(media).toHaveAttribute('data-layout', 'strip');
    expect(media).toHaveClass('order-first', 'aspect-[2/1]');
    expect(media.className).not.toMatch(/\b[mp]-\d/);
    expect(media.querySelector('img')).toHaveAttribute('src', '/campus.jpg');
    expect(media.querySelector('img')).toHaveAttribute('alt', '');
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveClass('bg-surface-raised', 'shadow-raised');
    expect(content.className).not.toContain('[&>[data-slot=dialog-header]]:pe-16');
  });

  it('split: the media column and the content start padding share one width variable', () => {
    render(<MediaDialog layout="split" />);
    const content = screen.getByRole('dialog');
    const media = screen.getByTestId('media');
    expect(content).toHaveClass('sm:ps-[var(--dialog-media-w)]', 'sm:w-[var(--dialog-split-w)]');
    expect(media).toHaveAttribute('data-layout', 'split');
    expect(media).toHaveClass('sm:absolute', 'sm:w-[var(--dialog-media-w)]', 'aspect-video');
    // Placeholder: decorative without alt, captioned.
    expect(media).toHaveAttribute('aria-hidden', 'true');
    expect(media).toHaveTextContent('Campus photo');
    // The × sits over the picture on a phone only.
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('bg-surface-raised', 'sm:bg-transparent');
  });

  it('flat form: mediaSrc makes a strip; layout="split" with no src shows the placeholder', () => {
    const { unmount } = render(<Dialog defaultOpen title="Apply" mediaSrc="/c.jpg" mediaAlt="Campus at dusk" />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-layout', 'strip');
    expect(screen.getByRole('img', { name: 'Campus at dusk' })).toHaveAttribute('src', '/c.jpg');
    unmount();
    render(<Dialog defaultOpen title="Apply" layout="split" />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-layout', 'split');
    expect(document.querySelector('[data-slot=dialog-media][data-placeholder]')).not.toBeNull();
  });
});
