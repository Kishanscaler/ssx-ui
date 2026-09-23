import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { IconButton } from '../IconButton';
import { SearchInput } from '../SearchInput';
import { SegmentedControl, SegmentedControlItem } from '../SegmentedControl';
import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarSpacer, ToolbarToggle } from './Toolbar';

const B = () => <svg aria-hidden="true" />;

function Notes(props: Partial<React.ComponentProps<typeof Toolbar>> & { search?: boolean }) {
  const { search, ...rest } = props;
  return (
    <Toolbar aria-label="Lecture note formatting" {...rest}>
      {search ? <SearchInput aria-label="Search notes" /> : null}
      <ToolbarGroup aria-label="Text style">
        <ToolbarToggle aria-label="Bold" defaultPressed>
          <B />
        </ToolbarToggle>
        <ToolbarToggle aria-label="Italic">
          <B />
        </ToolbarToggle>
      </ToolbarGroup>
      <ToolbarSeparator />
      <IconButton variant="tertiary" size="sm" aria-label="Insert an image">
        <B />
      </IconButton>
      <IconButton variant="tertiary" size="sm" aria-label="Undo" disabled>
        <B />
      </IconButton>
      <SegmentedControl aria-label="Note view" defaultValue="write">
        <SegmentedControlItem value="write">Write</SegmentedControlItem>
        <SegmentedControlItem value="preview">Preview</SegmentedControlItem>
      </SegmentedControl>
      <ToolbarSpacer />
      <IconButton variant="tertiary" size="sm" aria-label="More note actions">
        <B />
      </IconButton>
    </Toolbar>
  );
}

const btn = (name: string) => screen.getByRole('button', { name });
const key = (k: string) => fireEvent.keyDown(document.activeElement as Element, { key: k });

describe('Toolbar', () => {
  it('is a labelled toolbar of groups, a separator and a spacer', () => {
    render(<Notes />);
    const toolbar = screen.getByRole('toolbar', { name: 'Lecture note formatting' });
    expect(toolbar).toHaveAttribute('data-slot', 'toolbar');
    expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
    expect(screen.getByRole('group', { name: 'Text style' })).toHaveAttribute('data-slot', 'toolbar-group');
    expect(toolbar.querySelector('[data-slot="toolbar-separator"]')).toHaveAttribute('data-orientation', 'vertical');
    expect(toolbar.querySelector('[data-slot="toolbar-spacer"]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('ToolbarToggle is a pressed/unpressed button', () => {
    render(<Notes />);
    const bold = btn('Bold');
    expect(bold).toHaveAttribute('aria-pressed', 'true');
    expect(bold).toHaveAttribute('data-slot', 'toolbar-toggle');
    fireEvent.click(bold);
    expect(bold).toHaveAttribute('aria-pressed', 'false');
  });

  it('is one tab stop with roving focus; arrows skip disabled and treat a composite as one stop', async () => {
    render(<Notes />);
    const plain = ['Bold', 'Italic', 'Insert an image', 'More note actions'];
    expect(plain.filter((n) => btn(n).tabIndex === 0)).toEqual(['Bold']);
    act(() => btn('Bold').focus());
    key('ArrowRight');
    expect(document.activeElement).toBe(btn('Italic'));
    expect(btn('Italic')).toHaveAttribute('tabindex', '0');
    expect(btn('Bold')).toHaveAttribute('tabindex', '-1');
    key('ArrowRight');
    expect(document.activeElement).toBe(btn('Insert an image'));
    key('ArrowRight'); // Undo is disabled: straight to the segmented control
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Write' }));
    // Inside the composite, the radio group keeps its own arrows (Radix moves
    // focus on the next tick).
    key('ArrowRight');
    await act(() => new Promise((r) => setTimeout(r, 0)));
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Preview' }));
    // At the composite's last item the arrow continues along the toolbar.
    key('ArrowRight');
    expect(document.activeElement).toBe(btn('More note actions'));
    key('ArrowLeft');
    await act(() => new Promise((r) => setTimeout(r, 0)));
    expect(screen.getByRole('radio', { name: 'Preview' })).toHaveFocus();
    key('End');
    act(() => btn('More note actions').focus());
    key('ArrowRight'); // loops
    expect(document.activeElement).toBe(btn('Bold'));
    key('ArrowLeft');
    expect(document.activeElement).toBe(btn('More note actions'));
    key('Home');
    expect(document.activeElement).toBe(btn('Bold'));
  });

  it('leaves the caret keys to a text field', () => {
    render(<Notes search />);
    const field = screen.getByRole('searchbox', { name: 'Search notes' });
    act(() => field.focus());
    key('ArrowRight');
    expect(document.activeElement).toBe(field);
    key('Home');
    expect(document.activeElement).toBe(field);
  });

  it('vertical orientation uses ↑ / ↓; loop={false} stops at the ends', () => {
    render(<Notes orientation="vertical" loop={false} />);
    act(() => btn('Bold').focus());
    key('ArrowRight');
    expect(document.activeElement).toBe(btn('Bold'));
    key('ArrowDown');
    expect(document.activeElement).toBe(btn('Italic'));
    key('ArrowUp');
    key('ArrowUp');
    expect(document.activeElement).toBe(btn('Bold'));
  });

  it('forwards refs and className', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Toolbar ref={ref} aria-label="View" className="p-1" />);
    expect(ref.current).toHaveClass('p-1');
    expect(ref.current).not.toHaveClass('p-2');
  });
});
