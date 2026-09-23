import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Field } from '../Field';
import { Combobox, comboboxFilter, type ComboboxOption } from './Combobox';

/* jsdom has no pointer capture (Radix's outside-pointer handling touches it). */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
}

const MENTORS: ComboboxOption[] = [
  { value: 'nishant', label: 'Nishant Bhaskar — Staff Engineer, Google', group: 'Systems & infrastructure' },
  { value: 'kabir', label: 'Kabir Sethi — Engineering Manager, Uber', group: 'Systems & infrastructure' },
  { value: 'ritika', label: 'Ritika Menon — SDE III, Amazon', group: 'Placements & interviews' },
  { value: 'zoya', label: 'Zoya Ramachandran — SDM, Amazon', group: 'Placements & interviews' },
  {
    value: 'farhan',
    label: 'Farhan Amanullah — Principal SDE, Amazon',
    group: 'Placements & interviews',
    disabled: true,
  },
  { value: 'sanya', label: 'Sanya Nair — Applied Scientist, Microsoft', group: 'AI & research', keywords: ['ml'] },
];

const input = () => screen.getByRole('combobox');
const listbox = () => screen.queryByRole('listbox');
const activeOption = () => {
  const id = input().getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
};
const type = (text: string) => fireEvent.change(input(), { target: { value: text } });

function Mentor(props: Partial<React.ComponentProps<typeof Combobox>>) {
  return (
    <Field label="Assign a Super Mentor" help="Only mentors with capacity in Cohort 7 are listed.">
      <Combobox options={MENTORS} listLabel="Super Mentors" placeholder="Search by name…" {...props} />
    </Field>
  );
}

describe('Combobox', () => {
  it('is our Input with the APG combobox attributes, wired by Field', () => {
    render(<Mentor />);
    const field = input();
    expect(field).toHaveAttribute('data-slot', 'input');
    expect(field).toHaveAccessibleName('Assign a Super Mentor');
    expect(field).toHaveAccessibleDescription('Only mentors with capacity in Cohort 7 are listed.');
    expect(field).toHaveAttribute('aria-expanded', 'false');
    expect(field).toHaveAttribute('aria-autocomplete', 'list');
    expect(field).toHaveAttribute('autocomplete', 'off');
    expect(field.closest('[data-slot="combobox"]')).not.toBeNull();
    expect(listbox()).toBeNull();
  });

  it('typing opens a named listbox of grouped, filtered options with the first one active', () => {
    render(<Mentor />);
    type('ama');
    expect(input()).toHaveAttribute('aria-expanded', 'true');
    const list = screen.getByRole('listbox', { name: 'Super Mentors' });
    expect(input()).toHaveAttribute('aria-controls', list.id);
    expect(list).toHaveAttribute('data-slot', 'combobox-list');
    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.getAttribute('data-value'))).toEqual(['ritika', 'zoya', 'farhan']);
    const group = screen.getByRole('group');
    expect(group).toHaveAccessibleName('Placements & interviews');
    expect(activeOption()).toHaveTextContent('Ritika Menon');
    expect(activeOption()).toHaveAttribute('aria-selected', 'true');
    expect(activeOption()).toHaveAttribute('data-active', '');
    expect(screen.getByRole('option', { name: /Farhan/ })).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps focus in the field while open', async () => {
    render(<Mentor />);
    input().focus();
    type('goo');
    await waitFor(() => expect(listbox()).not.toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(input()));
  });

  it('↓ / ↑ move the active option, wrap, and skip a disabled one; Enter picks', () => {
    const onValueChange = vi.fn();
    render(<Mentor onValueChange={onValueChange} />);
    type('ama');
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(activeOption()).toHaveTextContent('Zoya');
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    // Farhan is disabled: wrapped back to Ritika.
    expect(activeOption()).toHaveTextContent('Ritika');
    fireEvent.keyDown(input(), { key: 'ArrowUp' });
    expect(activeOption()).toHaveTextContent('Zoya');
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith('zoya', expect.objectContaining({ value: 'zoya' }));
    expect(input()).toHaveValue('Zoya Ramachandran — SDM, Amazon');
    expect(input()).toHaveAttribute('aria-expanded', 'false');
  });

  it('a click picks; a disabled option does nothing; the hidden input carries the value', () => {
    const onValueChange = vi.fn();
    const { container } = render(<Mentor onValueChange={onValueChange} name="mentor" />);
    type('amazon');
    fireEvent.click(screen.getByRole('option', { name: /Farhan/ }));
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('option', { name: /Ritika/ }));
    expect(onValueChange).toHaveBeenCalledWith('ritika', expect.anything());
    expect(container.querySelector('input[type="hidden"][name="mentor"]')).toHaveValue('ritika');
  });

  it('keywords match; no match shows the empty row; clearing the text closes the list', () => {
    render(<Mentor emptyText={(text) => `No mentor matches “${text}”. Request one from the programme office.`} />);
    type('ml');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    type('quantum');
    const empty = screen.getByRole('option');
    expect(empty).toHaveAttribute('data-slot', 'combobox-empty');
    expect(empty).toHaveAttribute('aria-disabled', 'true');
    expect(empty).toHaveTextContent('No mentor matches “quantum”.');
    expect(input()).not.toHaveAttribute('aria-activedescendant');
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(input()).toHaveValue('quantum');
    type('');
    expect(listbox()).toBeNull();
  });

  it('Escape closes the list, a second Escape clears the field', async () => {
    render(<Mentor />);
    type('goo');
    fireEvent.keyDown(input(), { key: 'Escape' });
    await waitFor(() => expect(listbox()).toBeNull());
    expect(input()).toHaveValue('goo');
    fireEvent.keyDown(input(), { key: 'Escape' });
    expect(input()).toHaveValue('');
  });

  it('↓ on a closed field opens the full list; Alt+↑ closes it', () => {
    render(<Mentor />);
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')).toHaveLength(6);
    expect(screen.getAllByRole('group')).toHaveLength(3);
    fireEvent.keyDown(input(), { key: 'ArrowUp', altKey: true });
    expect(listbox()).toBeNull();
  });

  it('editing the text away from the chosen label clears the value', () => {
    const onValueChange = vi.fn();
    render(<Mentor defaultValue="kabir" onValueChange={onValueChange} />);
    expect(input()).toHaveValue('Kabir Sethi — Engineering Manager, Uber');
    // Reopening after a pick lists everything, active on the chosen option.
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')).toHaveLength(6);
    expect(activeOption()).toHaveTextContent('Kabir');
    type('Kabir Seth');
    expect(onValueChange).toHaveBeenCalledWith(null, null);
  });

  it('a controlled value writes its label into the field', () => {
    const { rerender } = render(<Mentor value="nishant" />);
    expect(input()).toHaveValue('Nishant Bhaskar — Staff Engineer, Google');
    rerender(<Mentor value="sanya" />);
    expect(input()).toHaveValue('Sanya Nair — Applied Scientist, Microsoft');
  });

  it('loading with no options yet shows the spinner row; shouldFilter={false} keeps options as given', () => {
    const { unmount } = render(
      <Mentor options={[]} loading loadingText="Searching 412 mentors…" shouldFilter={false} defaultOpen />,
    );
    const row = screen.getByRole('option');
    expect(row).toHaveAttribute('data-slot', 'combobox-loading');
    expect(row).toHaveTextContent('Searching 412 mentors…');
    unmount();
    render(<Mentor shouldFilter={false} defaultOpen defaultInputValue="zzz" />);
    expect(screen.getAllByRole('option')).toHaveLength(6);
  });

  it('disabled and invalid reach the Input; disabled never opens', () => {
    render(<Mentor disabled aria-invalid />);
    expect(input()).toBeDisabled();
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(listbox()).toBeNull();
  });

  it('forwards the ref to the input; className goes to the wrapper; size to the Input', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Combobox ref={ref} aria-label="Course" options={MENTORS} className="w-80" size="lg" />);
    expect(ref.current).toBe(input());
    expect(input()).toHaveAttribute('data-size', 'lg');
    expect(input().closest('[data-slot="combobox"]')?.className).toContain('w-80');
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    // No listLabel: the field's own name labels the list.
    expect(screen.getByRole('listbox', { name: 'Course' })).toBeInTheDocument();
  });

  it('is open-controllable', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Mentor open={false} onOpenChange={onOpenChange} />);
    type('a');
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(listbox()).toBeNull();
    rerender(<Mentor open onOpenChange={onOpenChange} />);
    expect(listbox()).not.toBeNull();
  });

  it('wheel and touch scrolling on the list never reach a modal scroll lock on the document', () => {
    render(<Mentor />);
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    const onDocument = vi.fn();
    document.addEventListener('wheel', onDocument);
    document.addEventListener('touchmove', onDocument);
    fireEvent.wheel(listbox() as Element, { deltaY: 120 });
    fireEvent.touchMove(listbox() as Element);
    expect(onDocument).not.toHaveBeenCalled();
    fireEvent.wheel(input(), { deltaY: 120 });
    expect(onDocument).toHaveBeenCalledTimes(1);
    document.removeEventListener('wheel', onDocument);
    document.removeEventListener('touchmove', onDocument);
  });

  it('comboboxFilter matches every word in label and keywords', () => {
    const option = { value: 'x', label: 'Sanya Nair — Applied Scientist, Microsoft', keywords: ['ml'] };
    expect(comboboxFilter(option, '')).toBe(true);
    expect(comboboxFilter(option, 'sanya micro')).toBe(true);
    expect(comboboxFilter(option, 'ML')).toBe(true);
    expect(comboboxFilter(option, 'sanya google')).toBe(false);
  });
});
