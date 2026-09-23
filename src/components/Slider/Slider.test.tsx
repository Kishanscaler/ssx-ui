import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Slider } from './Slider';

describe('Slider', () => {
  it('renders one named slider thumb with its value', () => {
    render(<Slider aria-label="Weekly study hours" max={60} defaultValue={[30]} />);
    const thumb = screen.getByRole('slider', { name: 'Weekly study hours' });
    expect(thumb).toHaveAttribute('aria-valuenow', '30');
    expect(thumb).toHaveAttribute('aria-valuemin', '0');
    expect(thumb).toHaveAttribute('aria-valuemax', '60');
  });

  it('carries the styling hooks on every part', () => {
    const { container } = render(<Slider aria-label="x" defaultValue={[10]} tooltip="always" />);
    const root = container.querySelector('[data-slot="slider"]')!;
    expect(root).toHaveAttribute('data-tooltip', 'always');
    expect(root.querySelector('[data-slot="slider-track"]')).not.toBeNull();
    expect(root.querySelector('[data-slot="slider-range"]')).not.toBeNull();
    expect(root.querySelector('[data-slot="slider-thumb"]')).not.toBeNull();
    expect(root.querySelector('[data-slot="slider-tooltip"]')).toHaveTextContent('10');
  });

  it('puts the aria-label on the thumb, not the root', () => {
    const { container } = render(<Slider aria-label="Weekly study hours" />);
    expect(container.querySelector('[data-slot="slider"]')).not.toHaveAttribute('aria-label');
  });

  it('names each thumb of a range from thumbLabels', () => {
    render(<Slider thumbLabels={['Minimum fee', 'Maximum fee']} max={12} defaultValue={[3, 9]} />);
    const [lo, hi] = screen.getAllByRole('slider');
    expect(lo).toHaveAccessibleName('Minimum fee');
    expect(hi).toHaveAccessibleName('Maximum fee');
    expect(hi).toHaveAttribute('aria-valuenow', '9');
  });

  it('forwards aria-labelledby and aria-describedby to the thumbs', () => {
    render(
      <>
        <span id="lbl">Weekly study hours</span>
        <p id="help">The median is 31.</p>
        <Slider aria-labelledby="lbl" aria-describedby="help" defaultValue={[24]} max={60} />
      </>,
    );
    const thumb = screen.getByRole('slider');
    expect(thumb).toHaveAccessibleName('Weekly study hours');
    expect(thumb).toHaveAccessibleDescription('The median is 31.');
  });

  it('formats the spoken value and the tooltip', () => {
    render(
      <Slider
        aria-label="Fee"
        max={12}
        defaultValue={[3]}
        tooltip="always"
        getAriaValueText={(v) => `₹${v} lakh`}
        formatValue={(v) => `₹${v}L`}
      />,
    );
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '₹3 lakh');
    expect(screen.getByText('₹3L').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('splays the bubbles of two close thumbs apart, and centres them otherwise', () => {
    const { container } = render(
      <Slider thumbLabels={['Min', 'Max']} max={120} defaultValue={[60, 62]} tooltip="always" />,
    );
    const tips = () => container.querySelectorAll('[data-slot="slider-tooltip"]');
    expect(tips()[0]).toHaveAttribute('data-splay', 'start');
    expect(tips()[1]).toHaveAttribute('data-splay', 'end');
    const far = render(
      <Slider thumbLabels={['Min', 'Max']} max={120} defaultValue={[20, 100]} tooltip="always" />,
    ).container.querySelectorAll('[data-slot="slider-tooltip"]');
    expect(far[0]).not.toHaveAttribute('data-splay');
    expect((far[0] as HTMLElement).style.transform).toBe('translateX(-50%)');
  });

  it('steps with the keyboard (uncontrolled) and reports the change', () => {
    const onValueChange = vi.fn();
    render(<Slider aria-label="Hours" max={60} defaultValue={[30]} onValueChange={onValueChange} />);
    const thumb = screen.getByRole('slider');
    act(() => thumb.focus());
    fireEvent.keyDown(thumb, { key: 'ArrowRight' });
    expect(thumb).toHaveAttribute('aria-valuenow', '31');
    expect(onValueChange).toHaveBeenLastCalledWith([31]);
    fireEvent.keyDown(thumb, { key: 'Home' });
    expect(thumb).toHaveAttribute('aria-valuenow', '0');
    fireEvent.keyDown(thumb, { key: 'End' });
    expect(thumb).toHaveAttribute('aria-valuenow', '60');
  });

  it('is controlled', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Slider aria-label="Hours" value={[10]} onValueChange={onValueChange} />);
    const thumb = screen.getByRole('slider');
    act(() => thumb.focus());
    fireEvent.keyDown(thumb, { key: 'ArrowRight' });
    expect(onValueChange).toHaveBeenCalledWith([11]);
    expect(thumb).toHaveAttribute('aria-valuenow', '10');
    rerender(<Slider aria-label="Hours" value={[11]} onValueChange={onValueChange} />);
    expect(thumb).toHaveAttribute('aria-valuenow', '11');
  });

  it('keeps a range from crossing itself', () => {
    render(<Slider thumbLabels={['Min', 'Max']} max={12} defaultValue={[5, 6]} minStepsBetweenThumbs={1} />);
    const [lo] = screen.getAllByRole('slider');
    act(() => lo!.focus());
    fireEvent.keyDown(lo!, { key: 'ArrowRight' });
    expect(lo).toHaveAttribute('aria-valuenow', '5');
  });

  it('is not focusable or steppable while disabled', () => {
    render(<Slider aria-label="Hours" defaultValue={[22]} disabled />);
    const thumb = screen.getByRole('slider');
    expect(thumb).not.toHaveAttribute('tabindex');
    expect(thumb).toHaveAttribute('data-disabled');
  });

  it('lets className win over the recipe', () => {
    const { container } = render(<Slider aria-label="x" className="h-8" />);
    const cls = container.querySelector('[data-slot="slider"]')!.className;
    expect(cls).toContain('h-8');
    expect(cls).not.toMatch(/(^| )h-5( |$)/);
  });

  it('forwards a ref to the root', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<Slider ref={ref} aria-label="x" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

describe('Slider on touch devices', () => {
  it('gives the grip a hit area and the rail a 44px touch band', () => {
    const { container } = render(<Slider aria-label="Budget" defaultValue={[20]} />);
    expect(screen.getByRole('slider').className).toContain('touch-target');
    const root = container.querySelector('[data-slot=slider]') as HTMLElement;
    expect(root.className.split(/\s+/)).toEqual(
      expect.arrayContaining(['pointer-coarse:before:absolute', 'pointer-coarse:before:h-touch-min']),
    );
  });
});
