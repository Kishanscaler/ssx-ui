import { commandPaletteContentVariants } from './CommandPalette';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Kbd, KbdGroup } from '../Kbd';
import {
  CommandPalette,
  CommandPaletteShortcut,
  commandPaletteFilter,
  type CommandPaletteGroup,
} from './CommandPalette';

/* jsdom has no pointer capture (Radix's outside-pointer handling touches it). */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
}

const groups = (onCreate = vi.fn()): CommandPaletteGroup[] => [
  {
    heading: 'Students',
    items: [
      { value: 'aarav', label: 'Aarav Krishnan', detail: '· SST-2029-0416 · Cohort 7', icon: <svg /> },
      { value: 'meher', label: 'Meher Iyengar', detail: '· SST-2029-0733 · Cohort 7' },
    ],
  },
  {
    heading: 'Go to',
    items: [
      {
        value: 'dsa',
        label: 'Data Structures & Algorithms — Week 6',
        shortcut: (
          <KbdGroup separator="then">
            <Kbd>G</Kbd>
            <Kbd>M</Kbd>
          </KbdGroup>
        ),
      },
    ],
  },
  {
    heading: 'Commands',
    items: [
      { value: 'slot', label: 'Create an interview slot', shortcut: '⌘N', onSelect: onCreate },
      { value: 'withdraw', label: 'Withdraw the selected application', variant: 'danger', separatorBefore: true },
      { value: 'release', label: 'Release scholarship decisions', disabled: true },
    ],
  },
];

const input = () => screen.getByRole('combobox');
const options = () => screen.getAllByRole('option');
const activeOption = () => document.getElementById(input().getAttribute('aria-activedescendant') ?? '');

describe('CommandPalette', () => {
  it('a string trigger is a secondary Button with the ⌘K shortcut, opening a named modal', () => {
    render(<CommandPalette groups={groups()} trigger="Search everything" />);
    const trigger = screen.getByRole('button', { name: /Search everything/ });
    expect(trigger).toHaveAttribute('data-variant', 'secondary');
    expect(trigger.querySelector('[data-slot="command-palette-shortcut"]')).not.toBeNull();
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Command palette' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('data-slot', 'command-palette');
    const overlay = document.querySelector('[data-slot="command-palette-overlay"]') as HTMLElement;
    expect(overlay.className).toContain('bg-surface-overlay-scrim');
  });

  it('the field is an APG combobox over a listbox of grouped options, and has focus', async () => {
    render(<CommandPalette defaultOpen groups={groups()} placeholder="Search students, cohorts and commands…" />);
    const field = input();
    await waitFor(() => expect(document.activeElement).toBe(field));
    expect(field).toHaveAccessibleName('Search students, cohorts and commands');
    expect(field).toHaveAttribute('aria-expanded', 'true');
    expect(field).toHaveAttribute('aria-autocomplete', 'list');
    const listbox = screen.getByRole('listbox', { name: 'Command palette' });
    expect(field).toHaveAttribute('aria-controls', listbox.id);
    const sections = screen.getAllByRole('group');
    expect(sections.map((g) => g.getAttribute('aria-labelledby') && document.getElementById(g.getAttribute('aria-labelledby') as string)?.textContent)).toEqual(['Students', 'Go to', 'Commands']);
    expect(options()).toHaveLength(6);
    // The first runnable row starts active, with the Enter hint.
    expect(activeOption()).toHaveTextContent('Aarav Krishnan');
    expect(activeOption()).toHaveAttribute('aria-selected', 'true');
    expect(activeOption()).toHaveAttribute('data-active', '');
    expect(activeOption()?.querySelector('[data-slot="command-palette-enter-hint"]')).not.toBeNull();
    expect(options()[1]).toHaveAttribute('aria-selected', 'false');
    expect(document.querySelector('[data-slot="command-palette-separator"]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('↑ / ↓ move the active row, wrap, and skip a disabled row', () => {
    render(<CommandPalette defaultOpen groups={groups()} />);
    const disabled = screen.getByRole('option', { name: /Release scholarship/ });
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(activeOption()).toHaveTextContent('Meher Iyengar');
    fireEvent.keyDown(input(), { key: 'ArrowUp' });
    fireEvent.keyDown(input(), { key: 'ArrowUp' });
    // Wrapped past the top to the last RUNNABLE row (the disabled one is skipped).
    expect(activeOption()).toHaveTextContent('Withdraw the selected application');
    expect(activeOption()).toHaveAttribute('data-variant', 'danger');
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(activeOption()).toHaveTextContent('Aarav Krishnan');
    fireEvent.keyDown(input(), { key: 'End', ctrlKey: true });
    expect(activeOption()).toHaveTextContent('Withdraw');
    fireEvent.keyDown(input(), { key: 'Home', ctrlKey: true });
    expect(activeOption()).toHaveTextContent('Aarav Krishnan');
  });

  it('Enter runs the active row: its onSelect, then onSelect(value), then it closes', async () => {
    const onCreate = vi.fn();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(<CommandPalette defaultOpen groups={groups(onCreate)} onSelect={onSelect} onOpenChange={onOpenChange} />);
    fireEvent.change(input(), { target: { value: 'interview' } });
    expect(options()).toHaveLength(1);
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('slot', expect.objectContaining({ value: 'slot' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('a click runs a row; hovering moves the active row; a disabled row does nothing', () => {
    const onSelect = vi.fn();
    render(<CommandPalette defaultOpen groups={groups()} onSelect={onSelect} closeOnSelect={false} />);
    const meher = screen.getByRole('option', { name: /Meher Iyengar/ });
    fireEvent.pointerMove(meher);
    expect(activeOption()).toBe(meher);
    fireEvent.click(screen.getByRole('option', { name: /Release scholarship/ }));
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(meher);
    expect(onSelect).toHaveBeenCalledWith('meher', expect.anything());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('filters by every word, across label, detail and keywords, hiding empty sections', () => {
    render(<CommandPalette defaultOpen groups={groups()} />);
    fireEvent.change(input(), { target: { value: 'cohort 7 meher' } });
    expect(options().map((o) => o.getAttribute('data-value'))).toEqual(['meher']);
    expect(screen.getAllByRole('group')).toHaveLength(1);
    expect(activeOption()).toHaveTextContent('Meher Iyengar');
  });

  it('no match: the EmptyState, whose Close button closes the palette', async () => {
    render(
      <CommandPalette
        defaultOpen
        defaultQuery="capstone reviewer for cohort 12"
        groups={groups()}
        emptyDescription="Cohort 12 has not been created yet."
      />,
    );
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(input()).not.toHaveAttribute('aria-activedescendant');
    const empty = document.querySelector('[data-slot="command-palette-empty"]') as HTMLElement;
    expect(empty).toHaveTextContent('No matches');
    expect(empty).toHaveTextContent('Cohort 12 has not been created yet.');
    expect(empty.querySelector('[data-slot="empty-state-art"]')).not.toBeNull();
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('loading with nothing yet: a status row instead of the empty state', () => {
    render(<CommandPalette defaultOpen groups={[]} loading loadingText="Searching 412 mentors…" shouldFilter={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('Searching 412 mentors…');
    expect(document.querySelector('[data-slot="command-palette-empty"]')).toBeNull();
  });

  it('shouldFilter={false} shows the groups as given', () => {
    render(<CommandPalette defaultOpen groups={groups()} shouldFilter={false} defaultQuery="zzz" />);
    expect(options()).toHaveLength(6);
  });

  it('⌘K / Ctrl+K toggles it from anywhere; hotkey={false} switches that off', async () => {
    const { unmount } = render(<CommandPalette groups={groups()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => {
      fireEvent.keyDown(document.body, { key: 'k', metaKey: true });
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    unmount();

    render(<CommandPalette groups={groups()} hotkey={false} />);
    fireEvent.keyDown(document.body, { key: 'k', metaKey: true });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Escape closes it and resets the query', async () => {
    render(<CommandPalette groups={groups()} trigger="Search everything" />);
    fireEvent.click(screen.getByRole('button', { name: /Search everything/ }));
    fireEvent.change(input(), { target: { value: 'meher' } });
    fireEvent.keyDown(input(), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: /Search everything/ }));
    expect(input()).toHaveValue('');
  });

  it('the query is controllable', () => {
    const onQueryChange = vi.fn();
    render(<CommandPalette defaultOpen groups={groups()} query="aarav" onQueryChange={onQueryChange} />);
    expect(options()).toHaveLength(1);
    fireEvent.change(input(), { target: { value: 'aarav k' } });
    expect(onQueryChange).toHaveBeenCalledWith('aarav k');
    expect(input()).toHaveValue('aarav');
  });

  it('forwards the ref to the panel and merges className last', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CommandPalette ref={ref} defaultOpen groups={groups()} className="w-[720px]" />);
    expect(ref.current).toBe(screen.getByRole('dialog'));
    expect(ref.current?.className).toContain('w-[720px]');
    expect(ref.current?.className).not.toContain('w-[min(560px');
  });

  it('CommandPaletteShortcut renders the modifier and the letter as keycaps', () => {
    render(<CommandPaletteShortcut hotkey="p" />);
    const group = document.querySelector('[data-slot="command-palette-shortcut"]') as HTMLElement;
    expect(group.querySelectorAll('[data-slot="kbd"]')).toHaveLength(2);
    expect(group).toHaveTextContent('P');
  });

  it('commandPaletteFilter matches every word, case-insensitively', () => {
    const item = { value: 'a', label: 'Aarav Krishnan', detail: 'SST-2029-0416', keywords: ['dsa'] };
    expect(commandPaletteFilter(item, '')).toBe(true);
    expect(commandPaletteFilter(item, 'krish 0416')).toBe(true);
    expect(commandPaletteFilter(item, 'DSA')).toBe(true);
    expect(commandPaletteFilter(item, 'aarav meher')).toBe(false);
  });
});

describe('CommandPalette on small and short screens (N-03)', () => {
  it('is a column capped to the dynamic viewport, pinned near the top on phones and short screens', () => {
    const cls = commandPaletteContentVariants();
    expect(cls).toContain('flex-col');
    expect(cls).toContain('supports-[height:100dvh]:max-h-[calc(82dvh-16px)]');
    expect(cls).toContain('max-sm:top-[max(12px,env(safe-area-inset-top,0px))]');
    expect(cls).toContain('[@media(max-height:560px)]:top-[max(8px,env(safe-area-inset-top,0px))]');
  });
});
