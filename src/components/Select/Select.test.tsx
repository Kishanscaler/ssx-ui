import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './Select';

/* jsdom has no pointer capture; Radix Select calls these on the trigger. */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
}

function Cohort(props: Partial<React.ComponentProps<typeof Select>> & { trigger?: Record<string, unknown> }) {
  const { trigger, ...root } = props;
  return (
    <Select {...root}>
      <SelectTrigger aria-label="Cohort" {...trigger}>
        <SelectValue placeholder="Choose a cohort…" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Bengaluru</SelectLabel>
          <SelectItem value="c6">Cohort 6 · Bengaluru</SelectItem>
          <SelectItem value="c7">Cohort 7 · Bengaluru</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectItem value="c8">Cohort 8 · Pune</SelectItem>
        <SelectItem value="c9" disabled>
          Cohort 9 · Pune — intake not open
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

const open = () => fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });

describe('Select', () => {
  it('renders a combobox trigger with the slot and size hooks', () => {
    render(<Cohort trigger={{ size: 'lg' }} />);
    const trigger = screen.getByRole('combobox', { name: 'Cohort' });
    expect(trigger).toHaveAttribute('data-slot', 'select-trigger');
    expect(trigger).toHaveAttribute('data-size', 'lg');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('type', 'button');
  });

  it('defaults to md and shows the placeholder when nothing is chosen', () => {
    render(<Cohort />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('data-size', 'md');
    expect(trigger).toHaveAttribute('data-placeholder');
    expect(trigger).toHaveTextContent('Choose a cohort…');
  });

  it('shows the chosen value in the trigger', () => {
    render(<Cohort defaultValue="c7" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Cohort 7 · Bengaluru');
  });

  it('opens from the keyboard into a listbox of options, with the chosen one selected', () => {
    render(<Cohort defaultValue="c7" />);
    open();
    // Radix hides everything outside the panel from AT while it is open.
    expect(screen.getByRole('combobox', { hidden: true })).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('data-slot', 'select-content');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    // Radix sets aria-selected only on the selected row while it holds focus;
    // the persistent "this is the value" signal is data-state.
    expect(screen.getByRole('option', { name: 'Cohort 7 · Bengaluru' })).toHaveAttribute(
      'data-state',
      'checked',
    );
    expect(screen.getByRole('option', { name: 'Cohort 8 · Pune' })).toHaveAttribute(
      'data-slot',
      'select-item',
    );
  });

  it('portals the panel to <body>, where the <html> brand/theme attributes reach it', () => {
    const { container } = render(<Cohort />);
    open();
    const listbox = screen.getByRole('listbox');
    expect(container.contains(listbox)).toBe(false);
    expect(document.body.contains(listbox)).toBe(true);
  });

  it('commits with Enter and reports the value (uncontrolled)', () => {
    const onValueChange = vi.fn();
    render(<Cohort onValueChange={onValueChange} />);
    open();
    const option = screen.getByRole('option', { name: 'Cohort 8 · Pune' });
    fireEvent.keyDown(option, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith('c8');
    expect(screen.getByRole('combobox')).toHaveTextContent('Cohort 8 · Pune');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  it('is controlled by `value`', () => {
    function Controlled() {
      const [value, setValue] = React.useState('c6');
      return (
        <>
          <Cohort value={value} onValueChange={setValue} />
          <output data-testid="out">{value}</output>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Cohort 6');
    open();
    const option = screen.getByRole('option', { name: 'Cohort 8 · Pune' });
    fireEvent.keyDown(option, { key: 'Enter' });
    expect(screen.getByTestId('out')).toHaveTextContent('c8');
    expect(screen.getByRole('combobox')).toHaveTextContent('Cohort 8');
  });

  it('closes on Escape without committing', () => {
    const onValueChange = vi.fn();
    render(<Cohort defaultValue="c7" onValueChange={onValueChange} />);
    open();
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps a disabled option in the list but not selectable', () => {
    const onValueChange = vi.fn();
    render(<Cohort onValueChange={onValueChange} />);
    open();
    const option = screen.getByRole('option', { name: /Cohort 9/ });
    expect(option).toHaveAttribute('aria-disabled', 'true');
    expect(option).toHaveAttribute('data-disabled');
    fireEvent.keyDown(option, { key: 'Enter' });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('two-line options: the trigger shows the headline only', () => {
    render(
      <Select defaultValue="sst">
        <SelectTrigger aria-label="Programme">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sst" description="4-year residential · Bengaluru">
            B.Sc. Computer Science &amp; AI
          </SelectItem>
          <SelectItem value="ssb" description="AI-first business programme">
            Scaler School of Business
          </SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('B.Sc. Computer Science & AI');
    expect(trigger).not.toHaveTextContent('4-year residential');
    open();
    const option = screen.getByRole('option', { name: /Scaler School of Business/ });
    expect(option).toHaveAttribute('data-two-line');
    expect(option.querySelector('[data-slot=select-item-description]')).toHaveTextContent(
      'AI-first business programme',
    );
  });

  it('reports invalidity through aria-invalid on the trigger', () => {
    render(<Cohort trigger={{ 'aria-invalid': true }} />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not open when disabled', () => {
    render(<Cohort disabled />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
    open();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('forwards refs to the trigger and the content', () => {
    const triggerRef = React.createRef<HTMLButtonElement>();
    const contentRef = React.createRef<HTMLDivElement>();
    render(
      <Select defaultOpen>
        <SelectTrigger ref={triggerRef} aria-label="Cohort">
          <SelectValue />
        </SelectTrigger>
        <SelectContent ref={contentRef}>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(contentRef.current).toHaveAttribute('data-slot', 'select-content');
  });

  it('merges className last, so a caller override wins', () => {
    render(<Cohort trigger={{ className: 'h-12 w-64' }} />);
    const cls = screen.getByRole('combobox').className.split(/\s+/);
    expect(cls).toContain('h-12');
    expect(cls).not.toContain('h-control-md');
    expect(cls).not.toContain('w-full');
  });

  it('submits through a hidden native select inside a form', () => {
    const { container } = render(
      <form>
        <Cohort name="cohort" defaultValue="c7" />
      </form>,
    );
    const native = container.querySelector('select');
    expect(native).not.toBeNull();
    expect(native).toHaveAttribute('name', 'cohort');
    expect((native as HTMLSelectElement).value).toBe('c7');
  });
});

describe('Select on touch devices', () => {
  it('gives the trigger a touch hit area and the rows a 44px minimum on a coarse pointer', () => {
    render(<Cohort defaultOpen />);
    expect((document.querySelector('[data-slot=select-trigger]') as HTMLElement).className).toContain('touch-target');
    for (const option of screen.getAllByRole('option')) {
      expect(option.className.split(/\s+/)).toContain('pointer-coarse:min-h-touch-min');
    }
  });
});
