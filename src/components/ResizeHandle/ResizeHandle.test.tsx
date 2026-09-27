import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { ResizeGroup, ResizeHandle, ResizePane, type ResizeGroupProps } from './ResizeHandle';

/* jsdom has no pointer capture. */
if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};

/* jsdom has no PointerEvent, so fireEvent.pointer* would drop clientX / pointerId. */
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

function Editor(props: ResizeGroupProps) {
  return (
    <ResizeGroup {...props}>
      <ResizePane>
        <button type="button">Dijkstra.java</button>
      </ResizePane>
      <ResizeHandle aria-label="Resize the capstone file tree" />
      <ResizePane>editor</ResizePane>
    </ResizeGroup>
  );
}

const handle = () => screen.getByRole('separator', { name: 'Resize the capstone file tree' });
const key = (k: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(handle(), { key: k, ...init });

/** A 1000 x 400 group with an 8px handle: 992px for the two panes to split. */
function measure(group: HTMLElement, sep: HTMLElement) {
  const rect = (w: number, h: number) =>
    ({ x: 0, y: 0, top: 0, left: 0, right: w, bottom: h, width: w, height: h, toJSON() {} }) as DOMRect;
  group.getBoundingClientRect = () => rect(1000, 400);
  sep.getBoundingClientRect = () => rect(8, 400);
}

describe('ResizeHandle', () => {
  it('is a focusable window splitter with the value on it', () => {
    render(<Editor />);
    const sep = handle();
    expect(sep).toHaveAttribute('data-slot', 'resize-handle');
    expect(sep).toHaveAttribute('tabindex', '0');
    // Panes side by side are split by a VERTICAL separator.
    expect(sep).toHaveAttribute('aria-orientation', 'vertical');
    expect(sep).toHaveAttribute('aria-valuenow', '32');
    expect(sep).toHaveAttribute('aria-valuemin', '20');
    expect(sep).toHaveAttribute('aria-valuemax', '80');
    expect(sep).toHaveClass('cursor-col-resize', 'touch-target', 'touch-none');
    expect(sep.querySelector('[data-slot="resize-handle-grip"]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('points aria-controls at the start pane', () => {
    const { container } = render(<Editor />);
    const start = container.querySelector('[data-slot="resize-pane"]') as HTMLElement;
    expect(start.id).not.toBe('');
    expect(handle()).toHaveAttribute('aria-controls', start.id);
  });

  it('a caller-supplied aria-controls wins', () => {
    render(
      <ResizeGroup>
        <ResizePane id="applicants">list</ResizePane>
        <ResizeHandle aria-label="Resize the applicant list" aria-controls="custom" />
        <ResizePane>detail</ResizePane>
      </ResizeGroup>,
    );
    expect(screen.getByRole('separator')).toHaveAttribute('aria-controls', 'custom');
  });

  it('the group carries the split as a CSS variable the panes grow by', () => {
    const { container } = render(<Editor defaultValue={40} />);
    const group = container.firstChild as HTMLElement;
    expect(group).toHaveAttribute('data-slot', 'resize-group');
    expect(group).toHaveAttribute('data-direction', 'horizontal');
    expect(group.style.getPropertyValue('--ssx-resize-size')).toBe('40');
    const pane = group.querySelector('[data-slot="resize-pane"]') as HTMLElement;
    expect(pane).toHaveClass('basis-0', 'overflow-auto', 'min-w-0');
  });

  it('arrow keys step by 2, Shift+arrow by 10, Home / End jump to the clamps', () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(<Editor onValueChange={onValueChange} onValueCommit={onValueCommit} />);
    key('ArrowRight');
    expect(handle()).toHaveAttribute('aria-valuenow', '34');
    expect(onValueChange).toHaveBeenLastCalledWith(34);
    expect(onValueCommit).toHaveBeenLastCalledWith(34);
    key('ArrowLeft', { shiftKey: true });
    expect(handle()).toHaveAttribute('aria-valuenow', '24');
    key('ArrowLeft', { shiftKey: true });
    expect(handle()).toHaveAttribute('aria-valuenow', '20');
    key('End');
    expect(handle()).toHaveAttribute('aria-valuenow', '80');
    key('ArrowRight');
    expect(handle()).toHaveAttribute('aria-valuenow', '80');
    key('Home');
    expect(handle()).toHaveAttribute('aria-valuenow', '20');
  });

  it('the vertical axis uses Up / Down and ignores Left / Right', () => {
    render(<Editor direction="vertical" defaultValue={50} />);
    const sep = handle();
    expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
    expect(sep).toHaveClass('cursor-row-resize');
    key('ArrowRight');
    expect(sep).toHaveAttribute('aria-valuenow', '50');
    key('ArrowDown');
    expect(sep).toHaveAttribute('aria-valuenow', '52');
    key('ArrowUp', { shiftKey: true });
    expect(sep).toHaveAttribute('aria-valuenow', '42');
  });

  it('honours custom min, max, step and largeStep', () => {
    render(<Editor min={25} max={60} step={5} largeStep={20} defaultValue={30} />);
    key('ArrowRight');
    expect(handle()).toHaveAttribute('aria-valuenow', '35');
    key('ArrowRight', { shiftKey: true });
    expect(handle()).toHaveAttribute('aria-valuenow', '55');
    key('ArrowRight', { shiftKey: true });
    expect(handle()).toHaveAttribute('aria-valuenow', '60');
    expect(handle()).toHaveAttribute('aria-valuemin', '25');
  });

  it('is controllable', () => {
    function Controlled() {
      const [value, setValue] = React.useState(45);
      return (
        <>
          <Editor value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    key('ArrowLeft');
    expect(handle()).toHaveAttribute('aria-valuenow', '43');
    expect(screen.getByRole('status')).toHaveTextContent('43');
  });

  it('Enter collapses and restores when collapsible', () => {
    const { container } = render(<Editor collapsible defaultValue={36} />);
    const group = container.firstChild as HTMLElement;
    expect(handle()).toHaveAttribute('aria-valuemin', '0');
    key('Enter');
    expect(handle()).toHaveAttribute('aria-valuenow', '0');
    expect(group).toHaveAttribute('data-collapsed', '');
    // Shrinking a collapsed pane keeps it collapsed.
    key('ArrowLeft');
    expect(handle()).toHaveAttribute('aria-valuenow', '0');
    key('Enter');
    expect(handle()).toHaveAttribute('aria-valuenow', '36');
    expect(group).not.toHaveAttribute('data-collapsed');
    // From collapsed, a step re-opens at min.
    key('Enter');
    key('ArrowRight');
    expect(handle()).toHaveAttribute('aria-valuenow', '20');
  });

  it('Enter does nothing when not collapsible', () => {
    render(<Editor />);
    key('Enter');
    expect(handle()).toHaveAttribute('aria-valuenow', '32');
    expect(handle()).toHaveAttribute('aria-valuemin', '20');
  });

  it('a pointer drag moves the split relative to where it was grabbed, and clamps', () => {
    const onValueCommit = vi.fn();
    const { container } = render(<Editor onValueCommit={onValueCommit} />);
    const group = container.firstChild as HTMLElement;
    const sep = handle();
    measure(group, sep);
    fireEvent.pointerDown(sep, { pointerId: 1, button: 0, clientX: 300 });
    expect(sep).toHaveAttribute('data-dragging', '');
    expect(document.activeElement).toBe(sep);
    // +99.2px of 992px = +10%.
    fireEvent.pointerMove(sep, { pointerId: 1, clientX: 399.2 });
    expect(sep).toHaveAttribute('aria-valuenow', '42');
    // Far past the end: clamped to 80.
    fireEvent.pointerMove(sep, { pointerId: 1, clientX: 5000 });
    expect(sep).toHaveAttribute('aria-valuenow', '80');
    expect(onValueCommit).not.toHaveBeenCalled();
    fireEvent.pointerUp(sep, { pointerId: 1, clientX: 5000 });
    expect(sep).not.toHaveAttribute('data-dragging');
    expect(onValueCommit).toHaveBeenCalledWith(80);
    // Moves after release do nothing.
    fireEvent.pointerMove(sep, { pointerId: 1, clientX: 0 });
    expect(sep).toHaveAttribute('aria-valuenow', '80');
  });

  it('ignores another pointer while one is dragging', () => {
    const { container } = render(<Editor />);
    const sep = handle();
    measure(container.firstChild as HTMLElement, sep);
    fireEvent.pointerDown(sep, { pointerId: 1, button: 0, clientX: 300 });
    fireEvent.pointerMove(sep, { pointerId: 2, clientX: 800 });
    expect(sep).toHaveAttribute('aria-valuenow', '32');
    fireEvent.pointerCancel(sep, { pointerId: 1 });
    expect(sep).not.toHaveAttribute('data-dragging');
  });

  it('in a right-to-left group, ArrowLeft and a leftward drag grow the start pane', () => {
    const { container } = render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <Editor />
      </div>,
    );
    const group = container.querySelector('[data-slot="resize-group"]') as HTMLElement;
    group.style.direction = 'rtl';
    key('ArrowLeft');
    expect(handle()).toHaveAttribute('aria-valuenow', '34');
    measure(group, handle());
    fireEvent.pointerDown(handle(), { pointerId: 1, button: 0, clientX: 500 });
    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 500 - 99.2 });
    expect(handle()).toHaveAttribute('aria-valuenow', '44');
    fireEvent.pointerUp(handle(), { pointerId: 1 });
  });

  it('disabled freezes the split and leaves the tab order', () => {
    render(<Editor disabled />);
    const sep = handle();
    expect(sep).toHaveAttribute('tabindex', '-1');
    expect(sep).toHaveAttribute('aria-disabled', 'true');
    expect(sep).not.toHaveClass('cursor-col-resize');
    key('ArrowRight');
    expect(sep).toHaveAttribute('aria-valuenow', '32');
  });

  it('the caller’s handlers run first and can cancel ours', () => {
    const onKeyDown = vi.fn((e: React.KeyboardEvent) => e.preventDefault());
    render(
      <ResizeGroup>
        <ResizePane />
        <ResizeHandle aria-label="Resize" onKeyDown={onKeyDown} />
        <ResizePane />
      </ResizeGroup>,
    );
    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowRight' });
    expect(onKeyDown).toHaveBeenCalled();
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '32');
  });

  it('outside a group it is a static, unfocusable separator', () => {
    render(<ResizeHandle />);
    const sep = screen.getByRole('separator');
    expect(sep).not.toHaveAttribute('tabindex');
    expect(sep).not.toHaveAttribute('aria-valuenow');
    expect(sep).not.toHaveClass('cursor-col-resize');
  });

  it('forwards refs on all three parts', () => {
    const g = React.createRef<HTMLDivElement>();
    const p = React.createRef<HTMLDivElement>();
    const h = React.createRef<HTMLDivElement>();
    render(
      <ResizeGroup ref={g}>
        <ResizePane ref={p} />
        <ResizeHandle ref={h} aria-label="Resize" />
        <ResizePane />
      </ResizeGroup>,
    );
    expect(g.current).toHaveAttribute('data-slot', 'resize-group');
    expect(p.current).toHaveAttribute('data-slot', 'resize-pane');
    expect(h.current).toHaveAttribute('data-slot', 'resize-handle');
    act(() => h.current?.focus());
    expect(document.activeElement).toBe(h.current);
  });
});
