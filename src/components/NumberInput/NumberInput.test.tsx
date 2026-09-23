import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { NumberInput } from './NumberInput';

const field = () => screen.getByRole('spinbutton') as HTMLInputElement;

describe('NumberInput', () => {
  it('renders a spinbutton inside a group with the slot and size hooks', () => {
    const { container } = render(<NumberInput aria-label="Credits" size="lg" defaultValue={18} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-slot', 'number-input');
    expect(root).toHaveAttribute('data-size', 'lg');
    expect(field()).toHaveAttribute('data-slot', 'number-input-field');
    expect(field()).toHaveAttribute('type', 'number');
    expect(field().value).toBe('18');
  });

  it('names its stepper buttons and points them at the field', () => {
    render(
      <NumberInput
        aria-label="Credits"
        decrementLabel="Decrease credits"
        incrementLabel="Increase credits"
      />,
    );
    const dec = screen.getByRole('button', { name: 'Decrease credits' });
    const inc = screen.getByRole('button', { name: 'Increase credits' });
    expect(dec).toHaveAttribute('aria-controls', field().id);
    expect(inc).toHaveAttribute('type', 'button');
  });

  it('steps with the buttons and clamps to min/max, disabling at the bounds', () => {
    const onValueChange = vi.fn();
    render(<NumberInput aria-label="Credits" defaultValue={22} min={12} max={24} step={2} onValueChange={onValueChange} />);
    const inc = screen.getByRole('button', { name: 'Increase' });
    fireEvent.click(inc);
    expect(field().value).toBe('24');
    expect(onValueChange).toHaveBeenLastCalledWith(24);
    expect(inc).toBeDisabled();
    fireEvent.click(inc);
    expect(field().value).toBe('24');
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeEnabled();
  });

  it('disables − at the minimum', () => {
    render(<NumberInput aria-label="Credits" defaultValue={12} min={12} max={24} />);
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase' })).toBeEnabled();
  });

  it('keyboard: arrows step, Page keys step ten, Home/End jump to the bounds', () => {
    render(<NumberInput aria-label="Seats" defaultValue={1080} min={0} max={2000} step={10} />);
    fireEvent.keyDown(field(), { key: 'ArrowUp' });
    expect(field().value).toBe('1090');
    fireEvent.keyDown(field(), { key: 'ArrowDown' });
    fireEvent.keyDown(field(), { key: 'ArrowDown' });
    expect(field().value).toBe('1070');
    fireEvent.keyDown(field(), { key: 'PageUp' });
    expect(field().value).toBe('1170');
    fireEvent.keyDown(field(), { key: 'PageDown' });
    expect(field().value).toBe('1070');
    fireEvent.keyDown(field(), { key: 'End' });
    expect(field().value).toBe('2000');
    fireEvent.keyDown(field(), { key: 'Home' });
    expect(field().value).toBe('0');
  });

  it('rounds to the precision of the step (no 0.30000000000000004)', () => {
    render(<NumberInput aria-label="Rate" defaultValue={0.1} step={0.1} />);
    fireEvent.keyDown(field(), { key: 'ArrowUp' });
    fireEvent.keyDown(field(), { key: 'ArrowUp' });
    expect(field().value).toBe('0.3');
  });

  it('stepping from empty starts at min', () => {
    render(<NumberInput aria-label="Credits" min={12} max={24} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(field().value).toBe('12');
  });

  it('typing reports the parsed value, and clamps on blur', () => {
    const onValueChange = vi.fn();
    render(<NumberInput aria-label="Credits" min={12} max={24} onValueChange={onValueChange} />);
    fireEvent.change(field(), { target: { value: '30' } });
    expect(onValueChange).toHaveBeenLastCalledWith(30);
    fireEvent.blur(field());
    expect(field().value).toBe('24');
    expect(onValueChange).toHaveBeenLastCalledWith(24);
    fireEvent.change(field(), { target: { value: '' } });
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it('clampOnBlur={false} keeps an out-of-range value on screen for its error', () => {
    render(<NumberInput aria-label="Credits" min={12} max={24} defaultValue={30} clampOnBlur={false} aria-invalid />);
    fireEvent.blur(field());
    expect(field().value).toBe('30');
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(field().closest('[data-slot=number-input]')).toHaveAttribute('data-invalid');
  });

  it('is controlled by `value`', () => {
    function Controlled() {
      const [v, setV] = React.useState<number | null>(18);
      return (
        <>
          <NumberInput aria-label="Credits" value={v} onValueChange={setV} min={12} max={24} />
          <output data-testid="out">{String(v)}</output>
          <button type="button" onClick={() => setV(20)}>set 20</button>
        </>
      );
    }
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(screen.getByTestId('out')).toHaveTextContent('19');
    fireEvent.click(screen.getByRole('button', { name: 'set 20' }));
    expect(field().value).toBe('20');
  });

  it('disabled and read-only: nothing steps', () => {
    const { rerender } = render(<NumberInput aria-label="Credits" defaultValue={18} disabled />);
    expect(field()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled();
    expect(field().closest('[data-slot=number-input]')).toHaveAttribute('data-disabled');

    rerender(<NumberInput aria-label="Credits" defaultValue={18} readOnly />);
    expect(field()).not.toBeDisabled();
    expect(field()).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();
    fireEvent.keyDown(field(), { key: 'ArrowUp' });
    expect(field().value).toBe('18');
  });

  it('stepper={false} renders a bare field with the Input recipe', () => {
    const { container } = render(<NumberInput aria-label="Credits" stepper={false} size="sm" defaultValue={18} />);
    expect(container.children).toHaveLength(1);
    expect(field()).toHaveAttribute('data-slot', 'number-input');
    expect(field()).toHaveAttribute('data-size', 'sm');
    expect(field().className).toContain('h-control-sm');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    fireEvent.keyDown(field(), { key: 'ArrowUp' });
    expect(field().value).toBe('19');
  });

  it('does not let the wheel change a focused value', () => {
    render(<NumberInput aria-label="Credits" defaultValue={18} />);
    field().focus();
    const wheel = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
    field().dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
  });

  it('forwards the ref to the <input> and merges className on the root', () => {
    const ref = React.createRef<HTMLInputElement>();
    const { container } = render(<NumberInput ref={ref} aria-label="Credits" className="h-12" name="credits" />);
    expect(ref.current).toBe(field());
    expect(ref.current).toHaveAttribute('name', 'credits');
    const cls = (container.firstElementChild as HTMLElement).className.split(/\s+/);
    expect(cls).toContain('h-12');
    expect(cls).not.toContain('h-control-md');
  });
});

describe('NumberInput on touch devices', () => {
  it('floors the value text at 16px on a coarse pointer, on the group the field inherits from', () => {
    const { container } = render(<NumberInput size="sm" aria-label="Seats" />);
    const root = container.querySelector('[data-slot=number-input]') as HTMLElement;
    expect(root.className.split(/\s+/)).toEqual(expect.arrayContaining(['text-sm', 'pointer-coarse:text-md']));
  });

  it('gives each stepper a touch hit area and does not clip it with overflow-hidden', () => {
    const { container } = render(<NumberInput aria-label="Seats" />);
    const root = container.querySelector('[data-slot=number-input]') as HTMLElement;
    expect(root.className).not.toContain('overflow-hidden');
    for (const slot of ['number-input-decrement', 'number-input-increment']) {
      expect((container.querySelector(`[data-slot=${slot}]`) as HTMLElement).className).toContain('touch-target');
    }
  });
});
