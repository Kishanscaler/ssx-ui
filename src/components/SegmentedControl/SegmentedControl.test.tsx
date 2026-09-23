import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { SegmentedControl, SegmentedControlItem } from './SegmentedControl';

function Status(props: Partial<React.ComponentProps<typeof SegmentedControl>>) {
  return (
    <SegmentedControl aria-label="Filter submissions by status" defaultValue="all" {...props}>
      <SegmentedControlItem value="all">All</SegmentedControlItem>
      <SegmentedControlItem value="submitted">Submitted</SegmentedControlItem>
      <SegmentedControlItem value="moderated" disabled>
        Moderated
      </SegmentedControlItem>
      <SegmentedControlItem value="graded">Graded</SegmentedControlItem>
    </SegmentedControl>
  );
}

const seg = (name: string) => screen.getByRole('radio', { name });
/* Radix Toggle selects on click. */
const press = (el: HTMLElement) => fireEvent.click(el);

describe('SegmentedControl', () => {
  it('is a named radiogroup of radios, exactly one checked', () => {
    render(<Status />);
    const group = screen.getByRole('radiogroup', { name: 'Filter submissions by status' });
    expect(group).toHaveAttribute('data-slot', 'segmented-control');
    expect(seg('All')).toHaveAttribute('aria-checked', 'true');
    expect(seg('All')).toHaveAttribute('data-slot', 'segmented-control-item');
    expect(seg('All')).toHaveAttribute('data-state', 'on');
    expect(seg('Submitted')).toHaveAttribute('aria-checked', 'false');
    // The travelling pill is decoration.
    const indicator = group.querySelector('[data-slot="segmented-control-indicator"]');
    expect(indicator).toHaveAttribute('aria-hidden', 'true');
  });

  it('selects on press and reports the value', () => {
    const onValueChange = vi.fn();
    render(<Status onValueChange={onValueChange} />);
    press(seg('Submitted'));
    expect(seg('Submitted')).toHaveAttribute('aria-checked', 'true');
    expect(seg('All')).toHaveAttribute('aria-checked', 'false');
    expect(onValueChange).toHaveBeenLastCalledWith('submitted');
  });

  it('pressing the active segment again keeps it (never empty)', () => {
    const onValueChange = vi.fn();
    render(<Status onValueChange={onValueChange} />);
    press(seg('All'));
    expect(seg('All')).toHaveAttribute('aria-checked', 'true');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('a disabled segment cannot be chosen', () => {
    render(<Status />);
    expect(seg('Moderated')).toBeDisabled();
    press(seg('Moderated'));
    expect(seg('Moderated')).toHaveAttribute('aria-checked', 'false');
  });

  it('one tab stop, on the checked segment', async () => {
    render(<Status defaultValue="submitted" />);
    act(() => screen.getByRole('radiogroup').focus());
    await waitFor(() => expect(seg('Submitted')).toHaveFocus());
  });

  it('arrow keys move AND select, skipping disabled, wrapping; Home / End', async () => {
    const onValueChange = vi.fn();
    render(<Status onValueChange={onValueChange} />);
    act(() => seg('All').focus());
    fireEvent.keyDown(seg('All'), { key: 'ArrowRight' });
    await waitFor(() => expect(seg('Submitted')).toHaveFocus());
    expect(seg('Submitted')).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(seg('Submitted'), { key: 'ArrowRight' });
    await waitFor(() => expect(seg('Graded')).toHaveFocus());
    expect(seg('Graded')).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(seg('Graded'), { key: 'ArrowRight' });
    await waitFor(() => expect(seg('All')).toHaveFocus());
    expect(seg('All')).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(seg('All'), { key: 'End' });
    await waitFor(() => expect(seg('Graded')).toHaveFocus());
    expect(onValueChange).toHaveBeenLastCalledWith('graded');
  });

  it('controlled: follows `value`', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Status value="all" onValueChange={onValueChange} />);
    press(seg('Graded'));
    expect(onValueChange).toHaveBeenCalledWith('graded');
    expect(seg('All')).toHaveAttribute('aria-checked', 'true');
    rerender(<Status value="graded" onValueChange={onValueChange} />);
    expect(seg('Graded')).toHaveAttribute('aria-checked', 'true');
  });

  it('disabled disables every segment', () => {
    render(<Status disabled />);
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
  });

  it('forwards refs and merges className last', () => {
    const ref = React.createRef<HTMLDivElement>();
    const itemRef = React.createRef<HTMLButtonElement>();
    render(
      <SegmentedControl ref={ref} aria-label="Density" defaultValue="a" className="p-0 custom">
        <SegmentedControlItem ref={itemRef} value="a" className="px-6">
          Compact
        </SegmentedControlItem>
        <SegmentedControlItem value="b">Comfortable</SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(ref.current).toBe(screen.getByRole('radiogroup'));
    expect(ref.current).toHaveClass('p-0', 'custom');
    expect(ref.current).not.toHaveClass('p-[3px]');
    expect(itemRef.current).toBe(seg('Compact'));
    expect(itemRef.current).toHaveClass('px-6');
    expect(itemRef.current).not.toHaveClass('px-3');
  });

  it('without a measurable layout (jsdom) the active segment keeps its own pill', () => {
    render(<Status />);
    // No indicator placed, so the fallback per-segment background stays in charge.
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('data-indicator');
    expect(seg('All')).toHaveClass('data-[state=on]:bg-surface-raised');
  });
});

describe('SegmentedControl · narrow containers (M-02)', () => {
  it('a long label shrinks and truncates (with a floor); a short one never does', () => {
    render(
      <SegmentedControl aria-label="Density" defaultValue="compact">
        <SegmentedControlItem value="all">All</SegmentedControlItem>
        <SegmentedControlItem value="compact">Comfortable</SegmentedControlItem>
      </SegmentedControl>,
    );
    const short = screen.getByRole('radio', { name: 'All' });
    const long = screen.getByRole('radio', { name: 'Comfortable' });
    expect(short).toHaveClass('shrink-0');
    expect(short.querySelector('[data-slot=segmented-control-label]')).not.toHaveClass('truncate');
    expect(long).toHaveClass('shrink', 'min-w-[calc(3em+24px)]');
    expect(long.querySelector('[data-slot=segmented-control-label]')).toHaveClass('truncate', 'min-w-[3em]');
    // The accessible name is the whole label.
    expect(long).toHaveAccessibleName('Comfortable');
  });

  it('a glyph beside a long label raises the floor by its width and gap', () => {
    render(
      <SegmentedControl aria-label="View" defaultValue="grid">
        <SegmentedControlItem value="grid">
          <svg aria-hidden="true" />
          Gallery
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(screen.getByRole('radio', { name: 'Gallery' })).toHaveClass('min-w-[calc(3em+46px)]');
  });

  it('the track scrolls as a last resort, with the edge fade; touch hits fill the track height', () => {
    render(<Status />);
    const track = screen.getByRole('radiogroup');
    expect(track).toHaveClass('max-w-full', 'overflow-x-auto', 'overflow-y-hidden');
    expect(track.className).toContain('data-[overflow]:[mask-image:');
    expect(screen.getByRole('radio', { name: 'All' }).className).toContain('pointer-coarse:before:-inset-y-[3px]');
  });

  it('scrolls the track (not the page) to keep the active segment in view', () => {
    const sw = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.dataset.slot === 'segmented-control' ? 600 : 0;
    });
    const cw = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.dataset.slot === 'segmented-control' ? 200 : 0;
    });
    const ol = vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
      return this.getAttribute('data-state') === 'on' ? 400 : 0;
    });
    const ow = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.dataset.slot === 'segmented-control-item' ? 100 : 0;
    });
    try {
      render(<Status defaultValue="submitted" />);
      // 400 + 100 + 3px of track padding, minus the 200px view.
      expect(screen.getByRole('radiogroup').scrollLeft).toBe(303);
    } finally {
      sw.mockRestore();
      cw.mockRestore();
      ol.mockRestore();
      ow.mockRestore();
    }
  });
});
