import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Button } from '../Button';
import { Input } from '../Input';
import {
  SideDrawer,
  SideDrawerBody,
  SideDrawerClose,
  SideDrawerContent,
  SideDrawerDescription,
  SideDrawerFooter,
  SideDrawerHeader,
  SideDrawerTitle,
  SideDrawerTrigger,
} from './SideDrawer';

/* jsdom has no pointer capture (Radix's outside-pointer handling touches it). */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
}

function LogSession({
  contentProps,
  ...root
}: React.ComponentProps<typeof SideDrawer> & {
  contentProps?: Partial<React.ComponentProps<typeof SideDrawerContent>>;
}) {
  return (
    <SideDrawer {...root}>
      <SideDrawerTrigger asChild>
        <Button>Log a mentor session</Button>
      </SideDrawerTrigger>
      <SideDrawerContent {...contentProps}>
        <SideDrawerHeader eyebrow="Aarav Krishnan · SST-2029-0416">
          <SideDrawerTitle>Log a mentor session</SideDrawerTitle>
          <SideDrawerDescription>Visible to the student and their mentor.</SideDrawerDescription>
        </SideDrawerHeader>
        <SideDrawerBody>
          <Input aria-label="Topic covered" />
        </SideDrawerBody>
        <SideDrawerFooter>
          <SideDrawerClose asChild>
            <Button variant="tertiary">Cancel</Button>
          </SideDrawerClose>
          <Button>Save session</Button>
        </SideDrawerFooter>
      </SideDrawerContent>
    </SideDrawer>
  );
}

async function pressOutside(el: Element) {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fireEvent.pointerDown(el, { button: 0 });
  fireEvent.pointerUp(el, { button: 0 });
  fireEvent.click(el, { button: 0 });
}

const trigger = () => screen.getByRole('button', { name: 'Log a mentor session', hidden: true });

describe('SideDrawer', () => {
  it('renders only the trigger while closed', () => {
    render(<LogSession />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger()).toHaveAttribute('data-slot', 'button');
  });

  it('opens a modal dialog labelled by its title, with every slot and the scrim token', () => {
    render(<LogSession />);
    fireEvent.click(trigger());
    const drawer = screen.getByRole('dialog', { name: 'Log a mentor session' });
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawer).toHaveAttribute('data-slot', 'side-drawer-content');
    expect(drawer).toHaveAttribute('data-side', 'right');
    expect(drawer).toHaveAttribute('data-size', 'normal');
    expect(drawer).toHaveAccessibleDescription('Visible to the student and their mentor.');
    for (const slot of [
      'side-drawer-header',
      'side-drawer-eyebrow',
      'side-drawer-title',
      'side-drawer-description',
      'side-drawer-body',
      'side-drawer-footer',
    ]) {
      expect(drawer.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    expect(screen.getByText('Aarav Krishnan · SST-2029-0416').tagName).toBe('P');
    const overlay = document.querySelector('[data-slot="side-drawer-overlay"]') as HTMLElement;
    expect(overlay.className).toContain('bg-surface-overlay-scrim');
    expect(overlay.className).not.toContain('opacity-');
  });

  it('has exactly two widths: normal (400px, the default) and wide (twice it)', () => {
    const { unmount } = render(<LogSession defaultOpen />);
    expect(screen.getByRole('dialog').className).toContain('w-[min(400px,92vw)]');
    unmount();
    render(<LogSession defaultOpen contentProps={{ size: 'wide' }} />);
    expect(screen.getByRole('dialog').className).toContain('w-[min(800px,92vw)]');
  });

  it('is the dynamic viewport tall (100vh fallback) and clears the notch and home bar (S6/N-10)', () => {
    const { unmount } = render(<LogSession defaultOpen />);
    const right = screen.getByRole('dialog').className;
    expect(right).toContain('h-screen');
    expect(right).toContain('supports-[height:100dvh]:h-dvh');
    expect(right).toContain('pt-[env(safe-area-inset-top,0px)]');
    expect(right).toContain('pb-[env(safe-area-inset-bottom,0px)]');
    expect(right).toContain('pr-[env(safe-area-inset-right,0px)]');
    unmount();
    render(<LogSession defaultOpen contentProps={{ side: 'left' }} />);
    expect(screen.getByRole('dialog').className).toContain('pl-[env(safe-area-inset-left,0px)]');
  });

  it('side and size map to the edge and the width', () => {
    render(<LogSession defaultOpen contentProps={{ side: 'left', size: 'wide' }} />);
    const drawer = screen.getByRole('dialog');
    expect(drawer).toHaveAttribute('data-side', 'left');
    expect(drawer).toHaveAttribute('data-size', 'wide');
    expect(drawer.className).toContain('left-0');
    expect(drawer.className).toContain('border-r');
    expect(drawer.className).toContain('w-[min(800px,92vw)]');
    expect(drawer.className).toContain('animate-ssx-drawer-in-left');
    expect(drawer.className).toContain('motion-reduce:animate-none');
  });

  it('moves focus in, traps Tab, and Escape returns focus to the trigger', async () => {
    render(<LogSession />);
    trigger().focus();
    fireEvent.click(trigger());
    const drawer = screen.getByRole('dialog');
    await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true));
    const last = screen.getByRole('button', { name: 'Save session' });
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(drawer.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });

  it('locks scroll and hides the page while open', async () => {
    render(<LogSession />);
    fireEvent.click(trigger());
    await waitFor(() => expect(document.body).toHaveAttribute('data-scroll-locked'));
    expect(trigger().closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('the × (named "Close drawer"), Cancel and the scrim each close it', async () => {
    const { unmount } = render(<LogSession defaultOpen />);
    fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    unmount();

    const second = render(<LogSession defaultOpen />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    second.unmount();

    render(<LogSession defaultOpen />);
    await pressOutside(document.querySelector('[data-slot="side-drawer-overlay"]') as Element);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('showClose={false} drops the ×', () => {
    render(
      <SideDrawer defaultOpen>
        <SideDrawerContent>
          <SideDrawerHeader showClose={false}>
            <SideDrawerTitle>Filters</SideDrawerTitle>
          </SideDrawerHeader>
        </SideDrawerContent>
      </SideDrawer>,
    );
    expect(screen.queryByRole('button', { name: 'Close drawer' })).toBeNull();
  });

  it('is controllable', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<LogSession open={false} onOpenChange={onOpenChange} />);
    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<LogSession open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('forwards refs and merges className last', () => {
    const content = React.createRef<HTMLDivElement>();
    const body = React.createRef<HTMLDivElement>();
    render(
      <SideDrawer defaultOpen>
        <SideDrawerContent ref={content} className="w-[720px]">
          <SideDrawerHeader>
            <SideDrawerTitle>Title</SideDrawerTitle>
          </SideDrawerHeader>
          <SideDrawerBody ref={body} className="p-8" />
        </SideDrawerContent>
      </SideDrawer>,
    );
    expect(content.current).toBe(screen.getByRole('dialog'));
    expect(content.current?.className).toContain('w-[720px]');
    expect(content.current?.className).not.toContain('w-[min(400px');
    expect(body.current?.className).toContain('p-8');
    expect(body.current?.className).not.toContain('p-5');
  });

  it('non-modal: no aria-modal', () => {
    render(<LogSession defaultOpen modal={false} />);
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
  });

  describe('flat form', () => {
    it('builds trigger, header, body and footer from strings', () => {
      render(
        <SideDrawer
          title="Log a mentor session"
          eyebrow="Aarav Krishnan · SST-2029-0416"
          trigger="Log a mentor session"
          confirmLabel="Save session"
        >
          Session form
        </SideDrawer>,
      );
      fireEvent.click(trigger());
      const drawer = screen.getByRole('dialog', { name: 'Log a mentor session' });
      expect(drawer.querySelector('[data-slot="side-drawer-body"]')).toHaveTextContent('Session form');
      const buttons = drawer.querySelectorAll('[data-slot="side-drawer-footer"] [data-slot="button"]');
      expect([...buttons].map((b) => b.textContent)).toEqual(['Cancel', 'Save session']);
    });

    it('confirm calls onConfirm and closes; preventDefault keeps it open', async () => {
      const onConfirm = vi.fn();
      const { unmount } = render(
        <SideDrawer defaultOpen title="Log" confirmLabel="Save" onConfirm={onConfirm} />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      unmount();

      render(
        <SideDrawer
          defaultOpen
          title="Log"
          confirmLabel="Save"
          confirmLoading
          onConfirm={(event) => event.preventDefault()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
