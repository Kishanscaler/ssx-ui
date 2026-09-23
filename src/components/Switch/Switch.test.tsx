import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Switch, SwitchStatus } from './Switch';

describe('Switch', () => {
  it('is a switch (on/off), named by its label', () => {
    render(
      <>
        <Switch id="notif" />
        <label htmlFor="notif">Email notifications</label>
      </>,
    );
    const sw = screen.getByRole('switch', { name: 'Email notifications' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(screen.getByText('Email notifications'));
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('carries the styling hooks on every part', () => {
    const { container } = render(<Switch aria-label="x" defaultChecked />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('data-slot', 'switch');
    expect(sw).toHaveAttribute('data-state', 'checked');
    expect(container.querySelector('[data-slot="switch-thumb"]')).toHaveAttribute('data-state', 'checked');
  });

  it('is controlled', () => {
    const onCheckedChange = vi.fn();
    const { rerender } = render(
      <Switch aria-label="x" checked={false} onCheckedChange={onCheckedChange} />,
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    rerender(<Switch aria-label="x" checked onCheckedChange={onCheckedChange} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('does not toggle while disabled', () => {
    render(<Switch aria-label="x" disabled />);
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('pending: busy, still focusable and enabled, but ignores activation', () => {
    const onCheckedChange = vi.fn();
    const onClick = vi.fn();
    render(
      <Switch aria-label="Recruiter visibility" defaultChecked pending onClick={onClick} onCheckedChange={onCheckedChange} />,
    );
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-busy', 'true');
    expect(sw).toHaveAttribute('data-pending');
    expect(sw).not.toBeDisabled();
    sw.focus();
    expect(sw).toHaveFocus();
    fireEvent.click(sw);
    expect(onClick).toHaveBeenCalled();
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('is not busy when idle', () => {
    render(<Switch aria-label="x" />);
    expect(screen.getByRole('switch')).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('switch')).not.toHaveAttribute('data-pending');
  });

  it('passes aria-describedby through', () => {
    render(
      <>
        <Switch aria-label="Digest" aria-describedby="h" />
        <p id="h">A single digest at 7:00 AM IST.</p>
      </>,
    );
    expect(screen.getByRole('switch')).toHaveAccessibleDescription('A single digest at 7:00 AM IST.');
  });

  it('lets className win over the recipe', () => {
    render(<Switch aria-label="x" className="w-12" />);
    const cls = screen.getByRole('switch').className;
    expect(cls).toContain('w-12');
    expect(cls).not.toContain('w-10');
  });

  it('forwards a ref to the button', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Switch ref={ref} aria-label="x" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe('SwitchStatus', () => {
  it('reserves its box when idle, with nothing announced', () => {
    const { container } = render(<SwitchStatus />);
    const status = container.querySelector('[data-slot="switch-status"]')!;
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('');
    expect(status).not.toHaveAttribute('data-pending');
  });

  it('announces the wait as a status while pending', () => {
    render(<SwitchStatus pending label="Saving recruiter visibility" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Saving recruiter visibility');
  });

  it('renders the shared Spinner (the six-dot grid), not a copy of it', () => {
    render(<SwitchStatus pending label="Saving recruiter visibility" />);
    const status = screen.getByRole('status');
    // If SwitchStatus ever goes back to hand-rolling its own dots, this fails.
    const spinner = status.querySelector('[data-slot="spinner"][data-kind="dots"]');
    expect(spinner).not.toBeNull();
    expect(spinner).toHaveAttribute('data-size', 'sm');
    // Silent: the SwitchStatus span is the one status, so the wait is read once.
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
    expect(spinner).not.toHaveAttribute('role');
    expect(spinner!.querySelectorAll('[data-part="dot"]')).toHaveLength(6);
    expect(status.querySelectorAll('[data-part="dot"]')).toHaveLength(6);
    expect(status.querySelector('i')).toBeNull();
  });

  it('draws no loader while idle', () => {
    const { container } = render(<SwitchStatus />);
    expect(container.querySelector('[data-slot="spinner"]')).toBeNull();
  });

  it('forwards a ref and merges className', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<SwitchStatus ref={ref} className="ml-2" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current!.className).toContain('ml-2');
    expect(ref.current!.className).not.toContain('ml-1');
  });
});

describe('Switch on touch devices', () => {
  it('keeps the 40x22 track and adds an invisible touch hit area', () => {
    render(<Switch aria-label="Alerts" />);
    const c = screen.getByRole('switch').className.split(/\s+/);
    expect(c).toEqual(expect.arrayContaining(['h-[22px]', 'w-[40px]', 'touch-target']));
  });
});
