import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { RadioGroup, RadioGroupItem } from './RadioGroup';

function Campus(props: React.ComponentProps<typeof RadioGroup>) {
  return (
    <RadioGroup aria-label="Preferred campus" {...props}>
      <div>
        <RadioGroupItem id="c-blr" value="bengaluru" />
        <label htmlFor="c-blr">Bengaluru</label>
      </div>
      <div>
        <RadioGroupItem id="c-pune" value="pune" />
        <label htmlFor="c-pune">Pune</label>
      </div>
      <div>
        <RadioGroupItem id="c-online" value="online" disabled />
        <label htmlFor="c-online">Online</label>
      </div>
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('is a named radiogroup of labelled radios', () => {
    render(<Campus defaultValue="bengaluru" />);
    expect(screen.getByRole('radiogroup', { name: 'Preferred campus' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Bengaluru' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Pune' })).toHaveAttribute('aria-checked', 'false');
  });

  it('carries the styling hooks on every part', () => {
    const { container } = render(<Campus defaultValue="pune" />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('data-slot', 'radio-group');
    expect(group).toHaveAttribute('data-orientation', 'vertical');
    expect(screen.getByRole('radio', { name: 'Pune' })).toHaveAttribute('data-slot', 'radio-group-item');
    expect(container.querySelectorAll('[data-slot="radio-group-indicator"]')).toHaveLength(3);
  });

  it('selects on click, and a label click selects its item', () => {
    render(<Campus defaultValue="bengaluru" />);
    fireEvent.click(screen.getByText('Pune'));
    expect(screen.getByRole('radio', { name: 'Pune' })).toHaveAttribute('data-state', 'checked');
    expect(screen.getByRole('radio', { name: 'Bengaluru' })).toHaveAttribute('data-state', 'unchecked');
  });

  it('moves and selects with the arrow keys, skipping disabled items', async () => {
    render(<Campus defaultValue="bengaluru" />);
    const blr = screen.getByRole('radio', { name: 'Bengaluru' });
    const pune = screen.getByRole('radio', { name: 'Pune' });
    act(() => blr.focus());
    // Radix moves roving focus in a timeout, hence waitFor.
    fireEvent.keyDown(blr, { key: 'ArrowDown' });
    await waitFor(() => expect(pune).toHaveFocus());
    expect(pune).toHaveAttribute('aria-checked', 'true');
    // Online is disabled, so the next stop wraps back to Bengaluru.
    fireEvent.keyDown(pune, { key: 'ArrowDown' });
    await waitFor(() => expect(blr).toHaveFocus());
    expect(blr).toHaveAttribute('aria-checked', 'true');
  });

  it('is one tab stop that lands on the selected item', () => {
    render(<Campus defaultValue="pune" />);
    const radios = screen.getAllByRole('radio');
    radios.forEach((r) => expect(r).toHaveAttribute('tabindex', '-1'));
    act(() => screen.getByRole('radiogroup').focus());
    const pune = screen.getByRole('radio', { name: 'Pune' });
    expect(pune).toHaveFocus();
    expect(pune).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'Bengaluru' })).toHaveAttribute('tabindex', '-1');
  });

  it('is controlled', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Campus value="bengaluru" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Pune' }));
    expect(onValueChange).toHaveBeenCalledWith('pune');
    expect(screen.getByRole('radio', { name: 'Bengaluru' })).toHaveAttribute('aria-checked', 'true');
    rerender(<Campus value="pune" onValueChange={onValueChange} />);
    expect(screen.getByRole('radio', { name: 'Pune' })).toHaveAttribute('aria-checked', 'true');
  });

  it('does not select a disabled item', () => {
    render(<Campus defaultValue="bengaluru" />);
    const online = screen.getByRole('radio', { name: 'Online' });
    expect(online).toBeDisabled();
    fireEvent.click(online);
    expect(online).toHaveAttribute('aria-checked', 'false');
  });

  it('passes aria-invalid to the group and description to an item', () => {
    render(
      <RadioGroup aria-label="Fee plan" aria-invalid>
        <RadioGroupItem value="isa" aria-label="Income Share Agreement" aria-describedby="h" />
        <p id="h">Pay ₹0 upfront.</p>
      </RadioGroup>,
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('radio')).toHaveAccessibleDescription('Pay ₹0 upfront.');
  });

  it('lays out horizontally on request', () => {
    render(<Campus orientation="horizontal" />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('lets className win on both parts', () => {
    render(
      <RadioGroup aria-label="g" className="gap-4">
        <RadioGroupItem value="a" aria-label="a" className="rounded-md" />
      </RadioGroup>,
    );
    expect(screen.getByRole('radiogroup').className).not.toMatch(/(^| )gap-2( |$)/);
    expect(screen.getByRole('radio').className).toContain('rounded-md');
    expect(screen.getByRole('radio').className).not.toContain('rounded-full');
  });

  it('forwards refs', () => {
    const group = React.createRef<HTMLDivElement>();
    const item = React.createRef<HTMLButtonElement>();
    render(
      <RadioGroup ref={group} aria-label="g">
        <RadioGroupItem ref={item} value="a" aria-label="a" />
      </RadioGroup>,
    );
    expect(group.current).toBeInstanceOf(HTMLDivElement);
    expect(item.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe('RadioGroup · arrow keys', () => {
  it('lays out vertically but lets ArrowRight move and select, like native radios', async () => {
    render(<Campus defaultValue="bengaluru" />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('data-orientation', 'vertical');
    const [first, second] = screen.getAllByRole('radio');
    act(() => first!.focus());
    fireEvent.keyDown(first!, { key: 'ArrowRight' });
    await waitFor(() => expect(second).toHaveFocus());
    expect(second).toHaveAttribute('aria-checked', 'true');
  });
});

describe('RadioGroup on touch devices', () => {
  it('gives each item a hit area, capped vertically in a vertical group so neighbours never overlap', () => {
    render(
      <RadioGroup aria-label="Plan">
        <RadioGroupItem value="a" aria-label="A" />
        <RadioGroupItem value="b" aria-label="B" />
      </RadioGroup>,
    );
    const c = screen.getAllByRole('radio')[0]!.className.split(/\s+/);
    expect(c).toContain('touch-target');
    expect(c).toContain('pointer-coarse:[[data-slot=radio-group][data-orientation=vertical]_&]:before:h-[calc(100%+10px)]');
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-orientation', 'vertical');
  });
});
