import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ANNOUNCER_SELECTOR } from '../../lib/announce';
import { Field } from '../Field';
import { MultiSelect, type MultiSelectOption } from './MultiSelect';

/* jsdom has no pointer capture (Radix's outside-pointer handling touches it). */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
}

const SKILLS: MultiSelectOption[] = [
  { value: 'python', label: 'Python', group: 'Languages' },
  { value: 'java', label: 'Java', group: 'Languages' },
  { value: 'sql', label: 'SQL', group: 'Languages' },
  { value: 'react', label: 'React', group: 'Frameworks', keywords: ['frontend'] },
  { value: 'django', label: 'Django', group: 'Frameworks', disabled: true },
  { value: 'pytorch', label: 'PyTorch', group: 'Frameworks' },
];

const input = () => screen.getByRole('combobox');
const listbox = () => screen.queryByRole('listbox');
const chips = () =>
  Array.from(document.querySelectorAll('[data-slot="multi-select-chip"]')).map((c) => c.getAttribute('data-value'));
const activeOption = () => {
  const id = input().getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
};
const focusInput = () =>
  act(() => {
    input().focus();
  });
const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
const key = (k: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(document.activeElement as Element, { key: k, ...init });

function Skills(props: Partial<React.ComponentProps<typeof MultiSelect>>) {
  return (
    <Field label="Skills" help="Recruiters filter on these.">
      <MultiSelect options={SKILLS} listLabel="Skills" placeholder="Search skills…" {...props} />
    </Field>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('MultiSelect', () => {
  it('is a combobox wired by Field, with a multi-select listbox', () => {
    render(<Skills />);
    const field = input();
    expect(field).toHaveAccessibleName('Skills');
    expect(field).toHaveAccessibleDescription('Recruiters filter on these.');
    expect(field).toHaveAttribute('aria-expanded', 'false');
    expect(field).toHaveAttribute('aria-autocomplete', 'list');
    expect(field).toHaveAttribute('placeholder', 'Search skills…');
    expect(field.closest('[data-slot="multi-select"]')).toHaveAttribute('data-size', 'md');
    type('a');
    const list = screen.getByRole('listbox', { name: 'Skills' });
    expect(list).toHaveAttribute('aria-multiselectable', 'true');
    expect(field).toHaveAttribute('aria-controls', list.id);
    expect(screen.getAllByRole('group').map((g) => g.getAttribute('aria-labelledby'))).toHaveLength(2);
  });

  it('typing filters; Enter toggles the active option and the list stays open', () => {
    const onValueChange = vi.fn();
    render(<Skills onValueChange={onValueChange} />);
    focusInput();
    type('py');
    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.getAttribute('data-value'))).toEqual(['python', 'pytorch']);
    expect(activeOption()).toHaveAttribute('data-value', 'python');
    expect(activeOption()).toHaveAttribute('aria-selected', 'false');
    key('Enter');
    expect(onValueChange).toHaveBeenLastCalledWith(['python'], [SKILLS[0]]);
    expect(chips()).toEqual(['python']);
    // Still open, text cleared for the next search.
    expect(listbox()).not.toBeNull();
    expect(input()).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Python' })).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('option', { name: 'Python' }).querySelector('[data-slot="multi-select-check"] svg'),
    ).not.toBeNull();
    // Enter again on the chosen row removes it.
    key('Enter');
    expect(onValueChange).toHaveBeenLastCalledWith([], []);
    expect(chips()).toEqual([]);
  });

  it('↓ / ↑ move the active option and skip disabled ones; Escape closes, then clears', () => {
    render(<Skills />);
    focusInput();
    key('ArrowDown');
    expect(listbox()).not.toBeNull();
    expect(activeOption()).toHaveAttribute('data-value', 'python');
    key('ArrowDown');
    key('ArrowDown');
    key('ArrowDown');
    expect(activeOption()).toHaveAttribute('data-value', 'react');
    key('ArrowDown'); // Django is disabled
    expect(activeOption()).toHaveAttribute('data-value', 'pytorch');
    expect(screen.getByRole('option', { name: 'Django' })).toHaveAttribute('aria-disabled', 'true');
    key('ArrowUp');
    expect(activeOption()).toHaveAttribute('data-value', 'react');
    type('re');
    key('Escape');
    expect(listbox()).toBeNull();
    expect(input()).toHaveValue('re');
    key('Escape');
    expect(input()).toHaveValue('');
  });

  it('a click toggles an option and keeps focus in the field', async () => {
    render(<Skills />);
    focusInput();
    key('ArrowDown');
    fireEvent.click(screen.getByRole('option', { name: 'SQL' }));
    fireEvent.click(screen.getByRole('option', { name: 'Java' }));
    expect(chips()).toEqual(['sql', 'java']);
    fireEvent.click(screen.getByRole('option', { name: 'Django' }));
    expect(chips()).toEqual(['sql', 'java']);
    await waitFor(() => expect(document.activeElement).toBe(input()));
    expect(listbox()).not.toBeNull();
  });

  it('Backspace in an empty field removes the last chip', () => {
    render(<Skills defaultValue={['python', 'sql', 'react']} />);
    focusInput();
    key('Backspace');
    expect(chips()).toEqual(['python', 'sql']);
    type('j');
    key('Backspace'); // text present: the browser's own delete, no chip removed
    expect(chips()).toEqual(['python', 'sql']);
  });

  it('chips have named ✕ buttons; ← walks onto them, Backspace/Delete removes, → returns', () => {
    render(<Skills defaultValue={['python', 'sql', 'react']} />);
    const remove = screen.getByRole('button', { name: 'Remove SQL' });
    expect(remove).toHaveAttribute('tabindex', '-1');
    focusInput();
    key('ArrowLeft');
    expect(screen.getByRole('button', { name: 'Remove React' })).toHaveFocus();
    key('ArrowLeft');
    expect(remove).toHaveFocus();
    key('Backspace');
    expect(chips()).toEqual(['python', 'react']);
    expect(screen.getByRole('button', { name: 'Remove Python' })).toHaveFocus();
    key('ArrowRight');
    expect(screen.getByRole('button', { name: 'Remove React' })).toHaveFocus();
    key('ArrowRight');
    expect(input()).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Python' }));
    expect(chips()).toEqual(['react']);
    expect(input()).toHaveFocus();
  });

  it('the clear-all button empties the selection and returns focus to the field', () => {
    const onValueChange = vi.fn();
    render(<Skills defaultValue={['python', 'sql']} onValueChange={onValueChange} clearLabel="Clear all skills" />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear all skills' }));
    expect(onValueChange).toHaveBeenCalledWith([], []);
    expect(chips()).toEqual([]);
    expect(input()).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear all skills' })).toBeNull();
  });

  it('max: at the cap the unchosen rows are unavailable and the list says why', () => {
    render(<Skills max={2} defaultValue={['python']} />);
    focusInput();
    key('ArrowDown');
    fireEvent.click(screen.getByRole('option', { name: 'SQL' }));
    expect(chips()).toEqual(['python', 'sql']);
    expect(document.querySelector('[data-slot="multi-select-max"]')).toHaveTextContent('You can choose up to 2.');
    expect(screen.getByRole('option', { name: 'Java' })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('option', { name: 'Java' }));
    expect(chips()).toEqual(['python', 'sql']);
    // A chosen row can still be dropped.
    expect(screen.getByRole('option', { name: 'SQL' })).not.toHaveAttribute('aria-disabled');
    fireEvent.click(screen.getByRole('option', { name: 'SQL' }));
    expect(chips()).toEqual(['python']);
    expect(screen.getByRole('option', { name: 'Java' })).not.toHaveAttribute('aria-disabled');
  });

  it('posts one hidden input per value under `name`', () => {
    const { container } = render(
      <form>
        <MultiSelect aria-label="Skills" options={SKILLS} name="skills" defaultValue={['python', 'react']} />
      </form>,
    );
    const form = container.querySelector('form')!;
    expect(new FormData(form).getAll('skills')).toEqual(['python', 'react']);
    expect(input()).not.toHaveAttribute('name');
  });

  it('controlled: renders `value` and reports changes without applying them', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Skills value={['sql']} onValueChange={onValueChange} />);
    focusInput();
    key('Backspace');
    expect(onValueChange).toHaveBeenCalledWith([], []);
    expect(chips()).toEqual(['sql']);
    rerender(<Skills value={['sql', 'java']} onValueChange={onValueChange} />);
    expect(chips()).toEqual(['sql', 'java']);
  });

  it('announces adds and removes in the polite live region', () => {
    vi.useFakeTimers();
    render(<Skills />);
    focusInput();
    type('sq');
    key('Enter');
    act(() => {
      vi.advanceTimersByTime(150);
    });
    const region = document.querySelector(ANNOUNCER_SELECTOR)!;
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('SQL added. 1 selected.');
    key('Backspace');
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(region).toHaveTextContent('SQL removed. None selected.');
  });

  it('the field description lists what is chosen', () => {
    render(<Skills defaultValue={['python', 'sql']} max={5} />);
    expect(input()).toHaveAccessibleDescription(
      'Recruiters filter on these. 2 selected: Python, SQL. Up to 5.',
    );
  });

  it('collapses past maxVisibleChips while blurred, and shows all when focused', () => {
    render(<Skills defaultValue={['python', 'sql', 'react', 'java']} maxVisibleChips={2} />);
    expect(chips()).toEqual(['python', 'sql']);
    expect(document.querySelector('[data-slot="multi-select-more"]')).toHaveTextContent('+2 more');
    act(() => {
      focusInput();
    });
    expect(chips()).toEqual(['python', 'sql', 'react', 'java']);
    expect(document.querySelector('[data-slot="multi-select-more"]')).toBeNull();
  });

  it('shows the empty row when nothing matches', () => {
    render(<Skills emptyText={(text) => `No skill matches “${text}”.`} />);
    type('cobol');
    expect(document.querySelector('[data-slot="multi-select-empty"]')).toHaveTextContent(
      'No skill matches “cobol”.',
    );
  });

  it('invalid and disabled reach the box and the input', () => {
    const { unmount } = render(
      <Field label="Skills" error="Pick at least one skill.">
        <MultiSelect options={SKILLS} />
      </Field>,
    );
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(input()).toHaveAccessibleDescription('Pick at least one skill.');
    expect(document.querySelector('[data-slot="multi-select"]')).toHaveAttribute('data-invalid', '');
    unmount();
    render(
      <Field label="Skills" disabled>
        <MultiSelect options={SKILLS} defaultValue={['python']} />
      </Field>,
    );
    expect(input()).toBeDisabled();
    expect(document.querySelector('[data-slot="multi-select"]')).toHaveAttribute('data-disabled', '');
    expect(screen.getByRole('button', { name: 'Remove Python' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
    key('ArrowDown');
    expect(listbox()).toBeNull();
  });

  it('forwards the ref to the input and className to the box', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<MultiSelect ref={ref} aria-label="Skills" options={SKILLS} className="max-w-sm" size="lg" />);
    expect(ref.current).toBe(input());
    const box = document.querySelector('[data-slot="multi-select"]')!;
    expect(box).toHaveClass('max-w-sm');
    expect(box).toHaveAttribute('data-size', 'lg');
  });
});
