import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Button } from '../Button';
import { Popover, PopoverAnchor, PopoverClose, PopoverContent, PopoverTrigger } from './Popover';

function Invite({
  contentProps,
  ...root
}: React.ComponentProps<typeof Popover> & {
  contentProps?: Partial<React.ComponentProps<typeof PopoverContent>>;
}) {
  return (
    <Popover {...root}>
      <PopoverTrigger asChild>
        <Button variant="secondary">Invite reviewer</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Invite a reviewer to Cohort 7" {...contentProps}>
        <input aria-label="Reviewer email" defaultValue="meera.subramaniam@scaler.com" />
        <PopoverClose asChild>
          <Button size="sm">Send invite</Button>
        </PopoverClose>
        <Button size="sm" variant="tertiary">
          Reset
        </Button>
      </PopoverContent>
    </Popover>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Invite reviewer' });

describe('Popover', () => {
  it('is closed by default; the trigger says what it opens', () => {
    render(<Invite />);
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    // The Button keeps its own slot under asChild.
    expect(trigger()).toHaveAttribute('data-slot', 'button');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens on click as a named dialog wired to the trigger', () => {
    render(<Invite />);
    fireEvent.click(trigger());
    const panel = screen.getByRole('dialog', { name: 'Invite a reviewer to Cohort 7' });
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger()).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('data-slot', 'popover-content');
    expect(panel).toHaveAttribute('data-padding', 'md');
    expect(panel).toHaveAttribute('data-elevation', 'raised');
    expect(panel).toHaveAttribute('data-side', 'bottom');
    expect(panel).toHaveAttribute('data-align', 'start');
    // Portalled to <body>, so it is themed by <html>.
    expect(panel.closest('body')).toBe(document.body);
  });

  it('closes on Escape with focus back on the trigger (a native button: Enter / Space click it)', async () => {
    render(<Invite />);
    trigger().focus();
    fireEvent.click(trigger());
    const panel = screen.getByRole('dialog');
    fireEvent.keyDown(panel, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('PopoverClose shuts the panel and returns focus to the trigger; a plain button does not', async () => {
    render(<Invite defaultOpen />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const send = screen.getByRole('button', { name: 'Send invite' });
    expect(send).toHaveAttribute('data-popover-close', '');
    fireEvent.click(send);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(trigger()).toHaveFocus();
  });

  it('is controlled two-way: onOpenChange reports, open decides', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Invite open={false} onOpenChange={onOpenChange} />);
    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<Invite open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not trap focus (not a modal)', () => {
    render(<Invite defaultOpen />);
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
  });

  it('takes placement, padding and merges className last', () => {
    render(
      <Invite
        defaultOpen
        contentProps={{ side: 'top', align: 'end', padding: 'none', className: 'p-8 custom' }}
      />,
    );
    const panel = screen.getByRole('dialog');
    expect(panel).toHaveAttribute('data-side', 'top');
    expect(panel).toHaveAttribute('data-align', 'end');
    expect(panel).toHaveAttribute('data-padding', 'none');
    expect(panel).toHaveClass('p-8', 'custom');
    expect(panel).not.toHaveClass('p-0');
  });

  it('forwards refs to the trigger, anchor, content and close', () => {
    const t = React.createRef<HTMLButtonElement>();
    const a = React.createRef<HTMLDivElement>();
    const c = React.createRef<HTMLDivElement>();
    const x = React.createRef<HTMLButtonElement>();
    render(
      <Popover defaultOpen>
        <PopoverAnchor ref={a}>
          <PopoverTrigger ref={t}>Campus</PopoverTrigger>
        </PopoverAnchor>
        <PopoverContent ref={c} aria-label="Filter by campus">
          <PopoverClose ref={x}>Apply</PopoverClose>
        </PopoverContent>
      </Popover>,
    );
    expect(t.current).toHaveAttribute('data-slot', 'popover-trigger');
    expect(a.current).toHaveAttribute('data-slot', 'popover-anchor');
    expect(c.current).toHaveAttribute('data-slot', 'popover-content');
    expect(x.current).toHaveAttribute('data-slot', 'popover-close');
  });
});
