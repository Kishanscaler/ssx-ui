import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { SelectableCard, SelectableCardGroup } from './SelectableCard';
import { Badge } from '../Badge';

function Plans(props: Partial<React.ComponentProps<typeof SelectableCardGroup>>) {
  return (
    <SelectableCardGroup aria-label="Choose a fee plan" {...(props as object)}>
      <SelectableCard value="a" eyebrow="Plan A" title="Pay in two instalments" description="₹2,75,000 now" />
      <SelectableCard value="b" eyebrow="Plan B" title="Deferred, income-share" description="60% after placement" />
      <SelectableCard value="c" eyebrow="Plan C" title="Lateral entry" description="Opens Sep 2026" disabled>
        <Badge>Closed</Badge>
      </SelectableCard>
    </SelectableCardGroup>
  );
}

const card = (control: HTMLElement) => control.closest('[data-slot=selectable-card]') as HTMLElement;

describe('SelectableCard · single (radio)', () => {
  it('is a named radiogroup of radios named by eyebrow + title, described by the rest', () => {
    render(<Plans defaultValue="a" />);
    const group = screen.getByRole('radiogroup', { name: 'Choose a fee plan' });
    expect(group).toHaveAttribute('data-slot', 'selectable-card-group');
    expect(group).toHaveAttribute('data-type', 'single');
    const a = screen.getByRole('radio', { name: 'Plan A Pay in two instalments' });
    expect(a).toHaveAttribute('aria-checked', 'true');
    expect(a).toHaveAccessibleDescription('₹2,75,000 now');
    expect(a).toHaveAttribute('data-slot', 'selectable-card-control');
    const c = screen.getByRole('radio', { name: 'Plan C Lateral entry' });
    expect(c).toHaveAccessibleDescription('Opens Sep 2026 Closed');
    expect(c).toBeDisabled();
    expect(card(a).tagName).toBe('LABEL');
    expect(card(a)).toHaveAttribute('data-state', 'checked');
    expect(card(a)).toHaveAttribute('data-type', 'radio');
    expect(card(c)).toHaveAttribute('data-disabled', '');
  });

  it('clicking anywhere on the card chooses it (uncontrolled)', () => {
    const onValueChange = vi.fn();
    render(<Plans defaultValue="a" onValueChange={onValueChange} />);
    const b = screen.getByRole('radio', { name: /Plan B/ });
    fireEvent.click(screen.getByText('60% after placement'));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(b).toHaveAttribute('aria-checked', 'true');
    expect(card(b)).toHaveAttribute('data-state', 'checked');
    expect(card(screen.getByRole('radio', { name: /Plan A/ }))).toHaveAttribute('data-state', 'unchecked');
  });

  it('a disabled card cannot be chosen', () => {
    const onValueChange = vi.fn();
    render(<Plans defaultValue="a" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByText('Opens Sep 2026'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('arrow keys move and select inside the group (roving focus)', async () => {
    render(<Plans defaultValue="a" />);
    const a = screen.getByRole('radio', { name: /Plan A/ });
    const b = screen.getByRole('radio', { name: /Plan B/ });
    const c = screen.getByRole('radio', { name: /Plan C/ });
    act(() => a.focus());
    fireEvent.keyDown(a, { key: 'ArrowDown' });
    await waitFor(() => expect(b).toHaveFocus());
    expect(b).toHaveAttribute('aria-checked', 'true');
    // Plan C is disabled, so the next stop wraps back to Plan A.
    fireEvent.keyDown(b, { key: 'ArrowDown' });
    await waitFor(() => expect(a).toHaveFocus());
    expect(a).toHaveAttribute('aria-checked', 'true');
    expect(c).toHaveAttribute('aria-checked', 'false');
  });

  it('is controlled by value + onValueChange', () => {
    function Controlled() {
      const [value, setValue] = React.useState('b');
      return (
        <>
          <Plans value={value} onValueChange={(v: string) => setValue(v)} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    fireEvent.click(screen.getByText('Pay in two instalments'));
    expect(screen.getByRole('status')).toHaveTextContent('a');
  });

  it('group disabled disables every card', () => {
    render(<Plans disabled />);
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
  });
});

describe('SelectableCard · multiple (checkbox)', () => {
  function Electives(props: { onValueChange?: (v: string[]) => void; defaultValue?: string[] }) {
    return (
      <SelectableCardGroup type="multiple" aria-label="Electives" columns="3" {...props}>
        <SelectableCard value="ds" eyebrow="Elective" title="Distributed Systems" />
        <SelectableCard value="ml" eyebrow="Elective" title="Applied Machine Learning" />
        <SelectableCard value="pm" eyebrow="Elective" title="Product Management" disabled />
      </SelectableCardGroup>
    );
  }

  it('is a named group of checkboxes; any number may be on', () => {
    const onValueChange = vi.fn();
    render(<Electives defaultValue={['ds']} onValueChange={onValueChange} />);
    const group = screen.getByRole('group', { name: 'Electives' });
    expect(group).toHaveAttribute('data-type', 'multiple');
    expect(group).toHaveAttribute('data-columns', '3');
    const ds = screen.getByRole('checkbox', { name: 'Elective Distributed Systems' });
    const ml = screen.getByRole('checkbox', { name: 'Elective Applied Machine Learning' });
    expect(ds).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByText('Applied Machine Learning'));
    expect(onValueChange).toHaveBeenLastCalledWith(['ds', 'ml']);
    expect(ml).toHaveAttribute('aria-checked', 'true');
    expect(card(ml)).toHaveAttribute('data-type', 'checkbox');
    fireEvent.click(ds);
    expect(onValueChange).toHaveBeenLastCalledWith(['ml']);
    expect(card(ds)).toHaveAttribute('data-state', 'unchecked');
  });

  it('the control is a focusable native button, so Space / Enter toggle it', () => {
    render(<Electives />);
    const ds = screen.getByRole('checkbox', { name: /Distributed/ });
    expect(ds.tagName).toBe('BUTTON');
    ds.focus();
    expect(ds).toHaveFocus();
    // The browser turns Space on a <button> into a click; jsdom does not, so
    // the click IS the keyboard path here (verified by hand in Storybook).
    fireEvent.click(ds);
    expect(ds).toHaveAttribute('aria-checked', 'true');
  });

  it('a disabled card stays off', () => {
    render(<Electives />);
    fireEvent.click(screen.getByText('Product Management'));
    expect(screen.getByRole('checkbox', { name: /Product/ })).toHaveAttribute('aria-checked', 'false');
  });
});

describe('SelectableCard · standalone', () => {
  it('is a checkbox card, controlled or not', () => {
    const onCheckedChange = vi.fn();
    render(
      <SelectableCard eyebrow="SST" title="Hostel on campus" description="₹1,20,000 / year" onCheckedChange={onCheckedChange} />,
    );
    const cb = screen.getByRole('checkbox', { name: 'SST Hostel on campus' });
    expect(cb).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(screen.getByText('₹1,20,000 / year'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(cb).toHaveAttribute('aria-checked', 'true');
  });

  it('a controlled card without a handler does not move', () => {
    render(<SelectableCard title="Locked" checked disabled />);
    const cb = screen.getByRole('checkbox', { name: 'Locked' });
    fireEvent.click(cb);
    expect(cb).toHaveAttribute('aria-checked', 'true');
    expect(cb).toBeDisabled();
  });

  it('posts its value with the form', () => {
    const { container } = render(
      <form>
        <SelectableCard name="addon" value="hostel" title="Hostel" defaultChecked />
      </form>,
    );
    const input = container.querySelector('input[type=checkbox]') as HTMLInputElement;
    expect(input).toHaveAttribute('name', 'addon');
    expect(input.value).toBe('hostel');
    expect(input.checked).toBe(true);
  });

  it('forwards the ref to the label, merges className, spreads props', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<SelectableCard ref={ref} title="Hostel" className="p-8" data-testid="c" />);
    const root = screen.getByTestId('c');
    expect(ref.current).toBe(root);
    expect(root.tagName).toBe('LABEL');
    expect(root).toHaveClass('p-8');
    // Card's own recipe is still there underneath.
    expect(root).toHaveClass('rounded-lg');
    expect(root).toHaveAttribute('data-slot', 'selectable-card');
  });

  it('the group forwards its ref and merges className', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <SelectableCardGroup ref={ref} aria-label="Plans" className="gap-8">
        <SelectableCard value="a" title="A" />
      </SelectableCardGroup>,
    );
    expect(ref.current).toBe(screen.getByRole('radiogroup'));
    expect(ref.current).toHaveClass('gap-8');
    expect(ref.current).not.toHaveClass('gap-4');
  });
});

describe('SelectableCardGroup · columns (M-17)', () => {
  it("'3' steps 1 → 2 at sm → 3 at md; '2' is two from sm", () => {
    const { rerender } = render(<Plans columns="3" />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3');
    expect(group).not.toHaveClass('sm:grid-cols-3');
    rerender(<Plans columns="2" />);
    expect(screen.getByRole('radiogroup')).toHaveClass('sm:grid-cols-2');
    expect(screen.getByRole('radiogroup')).not.toHaveClass('md:grid-cols-3');
  });
});
