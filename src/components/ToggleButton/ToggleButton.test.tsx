import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ToggleButton } from './ToggleButton';

const Regular = () => <svg data-testid="regular" />;
const Fill = () => <svg data-testid="fill" />;

describe('ToggleButton', () => {
  it('is a button with aria-pressed that flips on click', () => {
    render(<ToggleButton>Bookmark</ToggleButton>);
    const btn = screen.getByRole('button', { name: 'Bookmark' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveAttribute('data-state', 'on');
  });

  it('carries the styling hooks', () => {
    render(<ToggleButton size="lg">Bookmark</ToggleButton>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-slot', 'toggle-button');
    expect(btn).toHaveAttribute('data-size', 'lg');
    expect(btn).toHaveAttribute('data-state', 'off');
  });

  it('defaults to type="button"', () => {
    render(<ToggleButton>Bookmark</ToggleButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('is controlled', () => {
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <ToggleButton pressed={false} onPressedChange={onPressedChange}>
        Bookmark
      </ToggleButton>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    rerender(
      <ToggleButton pressed onPressedChange={onPressedChange}>
        Bookmark
      </ToggleButton>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('swaps icon for pressedIcon with the state, uncontrolled too', () => {
    render(
      <ToggleButton icon={<Regular />} pressedIcon={<Fill />}>
        Bookmark
      </ToggleButton>,
    );
    expect(screen.getByTestId('regular')).toBeInTheDocument();
    expect(screen.queryByTestId('fill')).toBeNull();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('fill')).toBeInTheDocument();
    expect(screen.queryByTestId('regular')).toBeNull();
  });

  it('keeps the icon when no pressedIcon is given', () => {
    render(
      <ToggleButton icon={<Regular />} defaultPressed>
        Pin
      </ToggleButton>,
    );
    expect(screen.getByTestId('regular')).toBeInTheDocument();
  });

  it('takes its name from aria-label when icon-only', () => {
    render(
      <ToggleButton size="icon-md" aria-label="Bookmark Week 6" icon={<Regular />} />,
    );
    expect(screen.getByRole('button', { name: 'Bookmark Week 6' })).toHaveAttribute('data-size', 'icon-md');
  });

  it('does not toggle while disabled, and keeps its pressed state', () => {
    render(
      <ToggleButton defaultPressed disabled>
        Bookmarked
      </ToggleButton>,
    );
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toBeDisabled();
  });

  it('lets className win over the recipe', () => {
    render(<ToggleButton className="px-8">Bookmark</ToggleButton>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('px-8');
    expect(cls).not.toMatch(/(^| )px-4( |$)/);
  });

  it('forwards a ref to the button', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<ToggleButton ref={ref}>Bookmark</ToggleButton>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe('ToggleButton on touch devices and narrow screens', () => {
  it('shares the Button hit area and long-label wrapping', () => {
    render(<ToggleButton size="sm">Bookmark this lecture for later</ToggleButton>);
    const c = screen.getByRole('button').className.split(/\s+/);
    expect(c).toEqual(expect.arrayContaining(['touch-target', 'min-h-control-sm', 'max-w-full', 'text-balance']));
  });
});
