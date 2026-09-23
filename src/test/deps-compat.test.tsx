import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as Avatar from '@radix-ui/react-avatar';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Select from '@radix-ui/react-select';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import * as Toggle from '@radix-ui/react-toggle';
import { OTPInput } from 'input-otp';

/**
 * The primitives the atoms are built on, rendered bare, on both Reacts.
 *
 * Not a test of Radix. It proves the HARNESS before any atom depends on it:
 * under React 16.12 these packages import `react/jsx-runtime` (absent in
 * 16.12, shimmed) and must resolve the aliased React 16 rather than the
 * package's React 19 — either mistake throws here, with no atom in the way.
 * Console output fails the test (src/test/setup.ts), so a React warning from a
 * primitive on 16 is caught too.
 */
describe('atom dependencies render on this React', () => {
  it('checkbox toggles', () => {
    render(
      <Checkbox.Root aria-label="Accept">
        <Checkbox.Indicator>x</Checkbox.Indicator>
      </Checkbox.Root>,
    );
    const box = screen.getByRole('checkbox');
    fireEvent.click(box);
    expect(box).toHaveAttribute('data-state', 'checked');
  });

  it('switch toggles', () => {
    render(<Switch.Root aria-label="Notify" />);
    const sw = screen.getByRole('switch');
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('toggle presses', () => {
    render(<Toggle.Root aria-label="Bold">B</Toggle.Root>);
    const t = screen.getByRole('button');
    fireEvent.click(t);
    expect(t).toHaveAttribute('aria-pressed', 'true');
  });

  it('radio group renders its items', () => {
    render(
      <RadioGroup.Root aria-label="Plan" defaultValue="a">
        <RadioGroup.Item value="a" aria-label="A" />
        <RadioGroup.Item value="b" aria-label="B" />
      </RadioGroup.Root>,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('slider renders a thumb', () => {
    render(
      <Slider.Root defaultValue={[40]} max={100} aria-label="Fee">
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumb aria-label="Fee" />
      </Slider.Root>,
    );
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '40');
  });

  it('select renders a trigger', () => {
    render(
      <Select.Root>
        <Select.Trigger aria-label="Country">
          <Select.Value placeholder="Pick one" />
        </Select.Trigger>
      </Select.Root>,
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Pick one');
  });

  it('avatar renders its fallback', () => {
    render(
      <Avatar.Root>
        <Avatar.Fallback>KV</Avatar.Fallback>
      </Avatar.Root>,
    );
    expect(screen.getByText('KV')).toBeInTheDocument();
  });

  it('input-otp renders one real input', () => {
    render(
      <OTPInput
        maxLength={4}
        aria-label="Code"
        render={({ slots }) => (
          <div>
            {slots.map((slot, i) => (
              <span key={i}>{slot.char}</span>
            ))}
          </div>
        )}
      />,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '4');
  });
});
