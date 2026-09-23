import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Checkbox } from './Checkbox';

/** Contract tests: each asserts a promise the atom makes to a consumer. */
describe('Checkbox', () => {
  it('is a checkbox named by its label, and the label toggles it', () => {
    render(
      <>
        <Checkbox id="updates" />
        <label htmlFor="updates">Send me placement updates</label>
      </>,
    );
    const box = screen.getByRole('checkbox', { name: 'Send me placement updates' });
    expect(box).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(screen.getByText('Send me placement updates'));
    expect(box).toHaveAttribute('aria-checked', 'true');
  });

  it('carries the styling hooks on every part', () => {
    const { container } = render(<Checkbox aria-label="Accept" defaultChecked />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-slot', 'checkbox');
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'checked');
    expect(container.querySelector('[data-slot="checkbox-indicator"]')).toHaveAttribute(
      'data-state',
      'checked',
    );
  });

  it('toggles uncontrolled on click', () => {
    render(<Checkbox aria-label="Accept" />);
    const box = screen.getByRole('checkbox');
    fireEvent.click(box);
    expect(box).toHaveAttribute('data-state', 'checked');
    fireEvent.click(box);
    expect(box).toHaveAttribute('data-state', 'unchecked');
  });

  it('is controlled: reports the change and waits for the prop', () => {
    const onCheckedChange = vi.fn();
    const { rerender } = render(
      <Checkbox aria-label="Accept" checked={false} onCheckedChange={onCheckedChange} />,
    );
    const box = screen.getByRole('checkbox');
    fireEvent.click(box);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(box).toHaveAttribute('aria-checked', 'false');
    rerender(<Checkbox aria-label="Accept" checked onCheckedChange={onCheckedChange} />);
    expect(box).toHaveAttribute('aria-checked', 'true');
  });

  it('reports indeterminate as aria-checked="mixed"', () => {
    render(<Checkbox aria-label="All 12 modules" checked="indeterminate" />);
    const box = screen.getByRole('checkbox');
    expect(box).toHaveAttribute('aria-checked', 'mixed');
    expect(box).toHaveAttribute('data-state', 'indeterminate');
  });

  it('keeps the glyphs out of the accessibility tree', () => {
    const { container } = render(<Checkbox aria-label="Accept" defaultChecked />);
    container.querySelectorAll('svg').forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('Accept');
  });

  it('does not toggle while disabled', () => {
    render(<Checkbox aria-label="Defer" disabled />);
    const box = screen.getByRole('checkbox');
    expect(box).toBeDisabled();
    fireEvent.click(box);
    expect(box).toHaveAttribute('aria-checked', 'false');
  });

  it('passes aria-invalid and aria-describedby through', () => {
    render(
      <>
        <Checkbox aria-label="Accept terms" aria-invalid aria-describedby="err" />
        <p id="err">You must accept the terms.</p>
      </>,
    );
    const box = screen.getByRole('checkbox');
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box).toHaveAccessibleDescription('You must accept the terms.');
  });

  it('lets className win over the recipe', () => {
    render(<Checkbox aria-label="Accept" className="rounded-sm" />);
    const cls = screen.getByRole('checkbox').className;
    expect(cls).toContain('rounded-sm');
    expect(cls).not.toContain('rounded-md');
  });

  it('forwards a ref to the button', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} aria-label="Accept" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
