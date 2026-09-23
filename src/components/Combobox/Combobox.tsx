'use client';

// Client: the text, the chosen value, the open state and the active option
// are state, the field attaches key handlers, and the popup is Radix Popover.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { useId } from '../../lib/use-id';
import { Input, type InputProps } from '../Input';
import { Popover, PopoverAnchor, PopoverContent } from '../Popover';
import { Spinner } from '../Spinner';

/* ---------------------------------------------------------------------------
 * Combobox
 *
 * A text field that filters a list as you type, for sets too long for a
 * Select: mentors, courses, companies. Do NOT use it for four options (that
 * is a Select, or a RadioGroup).
 *
 *   <Field label="Assign a Super Mentor" help="Only mentors with capacity in Cohort 7 are listed.">
 *     <Combobox
 *       placeholder="Search by name, company or specialism…"
 *       listLabel="Super Mentors"
 *       options={[
 *         { value: 'nishant', label: 'Nishant Bhaskar — Staff Engineer, Google', group: 'Systems & infrastructure' },
 *         { value: 'priyanka', label: 'Priyanka Ghosh — Senior SWE, Meta', group: 'AI & research', disabled: true },
 *       ]}
 *       onValueChange={assign}
 *     />
 *   </Field>
 *
 * The APG "combobox with listbox popup, list autocomplete": the field is
 * `role="combobox"` and keeps DOM focus; typing opens the list and filters
 * it; ↓ / ↑ move the active option (`aria-activedescendant`, which also
 * carries `aria-selected`, as the HTML draws it); Enter picks it and writes
 * its label into the field; Escape closes the list, and a second Escape
 * clears the field; Alt+↓ opens without typing, Alt+↑ closes. An option
 * nobody can pick stays visible, `aria-disabled`, and is skipped.
 *
 * The field is our `Input`, so size, invalid (`aria-invalid`, which a Field
 * with an error sets) and disabled look exactly like every other field. Every
 * prop not listed below goes to that input, and so does `ref`, so a Field
 * wires its label, help and error straight onto it. `className` styles the
 * wrapper.
 *
 * The popup is M3's `PopoverContent` (portal, collision flip, theming from
 * <html>), anchored to the field and exactly its width, 4px below it, at most
 * 240px tall. It never takes focus.
 *
 * Remote options: `shouldFilter={false}`, react to `onInputValueChange`, and
 * pass `loading` while the request runs.
 *
 * Choosing an option sets `value`; editing the text away from the chosen
 * label clears it (`onValueChange(null)`), so the value never disagrees with
 * what the field shows.
 * ------------------------------------------------------------------------- */

const isRendered = (node: React.ReactNode) => node != null && node !== false && node !== '';

/* ---- data ----------------------------------------------------------------- */

export type ComboboxOption = {
  /** Unique; what `value` / `onValueChange` carry. */
  value: string;
  /** The option's text: shown, matched by the default filter, written into the field when picked. */
  label: string;
  /**
   * A section heading. Consecutive options with the same `group` share one
   * heading ("Systems & infrastructure").
   */
  group?: string;
  /** Visible, announced as unavailable ("at capacity for Cohort 7"), not pickable. */
  disabled?: boolean;
  /** Extra words the default filter matches (a company, a specialism). */
  keywords?: string[];
};

/** The default filter: every word of the query appears in the label or keywords. */
export function comboboxFilter(option: ComboboxOption, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [option.label, ...(option.keywords ?? [])].join(' ').toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/* ---- recipes -------------------------------------------------------------- */

const groupHeadingClass =
  'px-3 pt-2 pb-1 text-xs font-bold tracking-wide text-content-secondary uppercase select-none';

const optionClass = [
  'cursor-pointer rounded-md px-3 py-2 text-base leading-body text-content',
  'transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',
  // Hover never paints a row nobody can pick.
  '[&:not([aria-disabled=true])]:hover:bg-surface-hover',
  // The row the keyboard (or pointer) is on: the HTML's `.combo__opt.is-active`.
  'data-[active]:bg-surface-brand-subtle data-[active]:font-semibold data-[active]:text-content-brand',
  'aria-disabled:cursor-not-allowed aria-disabled:text-content-disabled',
];

/* ---- Combobox ------------------------------------------------------------- */

export type ComboboxProps = Omit<
  InputProps,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'children' | 'role'
> & {
  /**
   * Every option, in order. Filtered by the text unless `shouldFilter` is off.
   *
   * @default []
   */
  options?: ComboboxOption[];
  /** The chosen option's `value` (controlled); `null` for none. Pair with `onValueChange`. */
  value?: string | null;
  /**
   * The chosen option's `value` when uncontrolled.
   *
   * @default null
   */
  defaultValue?: string | null;
  /** Called with the picked option's value, or `null` when the text no longer matches it. */
  onValueChange?: (value: string | null, option: ComboboxOption | null) => void;
  /** The text in the field (controlled). Pair with `onInputValueChange`. */
  inputValue?: string;
  /**
   * The initial text when uncontrolled. Defaults to the label of `defaultValue`.
   */
  defaultInputValue?: string;
  /** Called on every keystroke, and when a pick writes a label into the field. */
  onInputValueChange?: (text: string) => void;
  /** Whether the list is open (controlled). Pair with `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the list starts open when uncontrolled.
   *
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the list opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Filter `options` by the text. Turn off when a server already filtered them.
   *
   * @default true
   */
  shouldFilter?: boolean;
  /**
   * Your own match test.
   *
   * @default comboboxFilter (every word, case-insensitive)
   */
  filter?: (option: ComboboxOption, query: string) => boolean;
  /**
   * Remote options are loading: the list shows a spinner row with
   * `loadingText` in place of the options.
   *
   * @default false
   */
  loading?: boolean;
  /**
   * The loading row's text ("Searching 412 mentors…").
   *
   * @default 'Searching…'
   */
  loadingText?: string;
  /**
   * The row shown when nothing matches, or a function of the text.
   *
   * @default (text) => `No match for “${text}”.`
   */
  emptyText?: React.ReactNode | ((text: string) => React.ReactNode);
  /**
   * The listbox's accessible name ("Super Mentors").
   *
   * @default the field's `aria-label`, else 'Suggestions'
   */
  listLabel?: string;
  /**
   * With `name`, a hidden input carries the chosen `value` in a form post
   * (the visible field has no `name`).
   */
  name?: string;
  /**
   * Where the list's portal mounts. Defaults to `document.body`, themed by
   * the `data-brand` / `data-theme` attributes on `<html>`.
   */
  container?: HTMLElement | null;
  /** Classes for the wrapper around the field, merged last. */
  className?: string;
};

type Row = { option: ComboboxOption; id: string };

/**
 * A filtering text field with a listbox popup. `ref` is the `<input>`.
 */
export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  {
    options = [],
    value: valueProp,
    defaultValue = null,
    onValueChange,
    inputValue: inputValueProp,
    defaultInputValue,
    onInputValueChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    shouldFilter = true,
    filter = comboboxFilter,
    loading = false,
    loadingText = 'Searching…',
    emptyText = (text: string) => `No match for “${text}”.`,
    listLabel,
    name,
    container,
    className,
    disabled,
    id: idProp,
    onKeyDown,
    ...inputProps
  },
  forwardedRef,
) {
  const baseId = useId();
  const inputId = idProp ?? `${baseId}-input`;
  const listboxId = `${baseId}-listbox`;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const ref = useComposedRefs(forwardedRef, inputRef);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const byValue = (v: string | null | undefined) =>
    v == null ? null : (options.find((option) => option.value === v) ?? null);

  const [value, setValueState] = useControllableState<string | null>({
    prop: valueProp,
    defaultProp: defaultValue,
    caller: 'Combobox',
  });
  const [text, setText] = useControllableState<string>({
    prop: inputValueProp,
    defaultProp: defaultInputValue ?? byValue(valueProp !== undefined ? valueProp : defaultValue)?.label ?? '',
    onChange: onInputValueChange,
    caller: 'Combobox',
  });
  const [openState, setOpenState] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    caller: 'Combobox',
  });
  const open = Boolean(openState) && !disabled;
  const setOpen = (next: boolean) => {
    if (next !== open) setOpenState(next);
  };

  const setValue = (next: string | null) => {
    if (next === (value ?? null)) return;
    setValueState(next);
    onValueChange?.(next, byValue(next));
  };

  // A controlled value that changes from outside writes its label into an
  // uncontrolled field.
  const lastValue = React.useRef(value);
  // (Deliberately keyed on `value` alone: a keystroke must not rewrite the text.)
  React.useEffect(() => {
    if (lastValue.current === value) return;
    lastValue.current = value;
    const label = byValue(value)?.label;
    if (label != null && label !== text) setText(label);
  }, [value]);

  /* Filter and section the options; every visible row gets a stable id. */
  const q = text ?? '';
  const chosen = byValue(value);
  // Right after a pick the field shows the chosen label: reopening then
  // lists everything, not just that one option.
  const query = chosen && chosen.label === q ? '' : q;
  const visible = shouldFilter ? options.filter((option) => filter(option, query)) : options;
  const rows: Row[] = visible.map((option) => ({
    option,
    id: `${baseId}-option-${options.indexOf(option)}`,
  }));
  const sections: Array<{ group?: string; rows: Row[] }> = [];
  for (const row of rows) {
    const last = sections[sections.length - 1];
    if (last && last.group === row.option.group) last.rows.push(row);
    else sections.push({ group: row.option.group, rows: [row] });
  }
  const enabled = rows.filter((row) => !row.option.disabled);

  const [activeValue, setActiveValue] = React.useState<string | null>(null);
  const active =
    enabled.find((row) => row.option.value === activeValue) ??
    enabled.find((row) => row.option.value === value) ??
    enabled[0] ??
    null;

  /* Inside a modal (Dialog, SideDrawer…), the modal's scroll lock cancels
     wheel and touch scrolling on anything outside it, and this list portals
     to <body>. Stopping those two events at the list keeps it scrollable; the
     page behind is still locked by the modal's own `overflow: hidden`. */
  const [listNode, setListNode] = React.useState<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!listNode) return undefined;
    const stop = (event: Event) => event.stopPropagation();
    listNode.addEventListener('wheel', stop);
    listNode.addEventListener('touchmove', stop);
    return () => {
      listNode.removeEventListener('wheel', stop);
      listNode.removeEventListener('touchmove', stop);
    };
  }, [listNode]);

  const activeId = open ? active?.id : undefined;
  React.useEffect(() => {
    if (!activeId) return;
    const node = document.getElementById(activeId);
    if (node && typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  const pick = (option: ComboboxOption) => {
    if (option.disabled) return;
    setValue(option.value);
    setText(option.label);
    setActiveValue(null);
    setOpen(false);
  };

  const move = (delta: number) => {
    if (enabled.length === 0) return;
    const at = active ? enabled.indexOf(active) : -1;
    const next = enabled[(at + delta + enabled.length) % enabled.length];
    if (next) setActiveValue(next.option.value);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setText(next);
    setActiveValue(null);
    if (chosen && chosen.label !== next) setValue(null);
    // The HTML's list shows while there is text to match, and closes when the field is emptied.
    setOpen(next !== '');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) {
          setOpen(true);
          if (!event.altKey) setActiveValue(null);
        } else if (!event.altKey) {
          move(1);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (event.altKey) setOpen(false);
        else if (!open) setOpen(true);
        else move(-1);
        break;
      case 'Enter':
        if (open && active) {
          event.preventDefault();
          pick(active.option);
        }
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        } else if (q !== '') {
          event.preventDefault();
          setText('');
          setValue(null);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
    }
  };

  const resolvedListLabel =
    listLabel ?? (typeof inputProps['aria-label'] === 'string' ? inputProps['aria-label'] : 'Suggestions');
  const emptyNode = typeof emptyText === 'function' ? emptyText(q) : emptyText;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={wrapperRef} data-slot="combobox" data-state={open ? 'open' : 'closed'} className={cn('relative', className)}>
          <Input
            ref={ref}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={disabled}
            value={q}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            {...inputProps}
          />
          {name ? <input type="hidden" name={name} value={value ?? ''} /> : null}
        </div>
      </PopoverAnchor>
      <PopoverContent
        ref={setListNode}
        id={listboxId}
        role="listbox"
        aria-label={resolvedListLabel}
        data-slot="combobox-list"
        padding="sm"
        sideOffset={4}
        container={container}
        className={cn(
          // Exactly the field's width, at most 240px tall (the HTML's `.combo__list`).
          'w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) max-w-none',
          'max-h-[min(240px,var(--radix-popover-content-available-height))] overflow-y-auto',
        )}
        // The field keeps focus the whole time.
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // A press in the field is not "outside".
        onInteractOutside={(event) => {
          if (wrapperRef.current?.contains(event.target as Node)) event.preventDefault();
        }}
      >
        {loading && rows.length === 0 ? (
          <div
            role="option"
            aria-disabled="true"
            aria-selected="false"
            data-slot="combobox-loading"
            className="flex items-center gap-2 px-3 py-2 text-sm text-content-secondary"
          >
            <Spinner size="sm" label={null} />
            <span>{loadingText}</span>
          </div>
        ) : null}
        {!loading && rows.length === 0 && isRendered(emptyNode) ? (
          <div
            role="option"
            aria-disabled="true"
            aria-selected="false"
            data-slot="combobox-empty"
            className="px-3 py-2 text-base text-content-secondary italic cursor-default"
          >
            {emptyNode}
          </div>
        ) : null}
        {sections.map((section, s) => {
          const headingId = `${baseId}-group-${s}`;
          const items = section.rows.map(({ option, id }) => {
            const isActive = active?.id === id;
            return (
              <div
                key={id}
                id={id}
                role="option"
                aria-selected={isActive}
                aria-disabled={option.disabled || undefined}
                data-slot="combobox-option"
                data-value={option.value}
                data-active={isActive ? '' : undefined}
                data-chosen={option.value === value ? '' : undefined}
                className={cn(optionClass)}
                onPointerMove={() => {
                  if (!option.disabled && !isActive) setActiveValue(option.value);
                }}
                // Keep focus in the field.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(option)}
              >
                {option.label}
              </div>
            );
          });
          return section.group ? (
            <div key={headingId} role="group" aria-labelledby={headingId} data-slot="combobox-group">
              <div id={headingId} data-slot="combobox-group-heading" className={groupHeadingClass}>
                {section.group}
              </div>
              {items}
            </div>
          ) : (
            <React.Fragment key={headingId}>{items}</React.Fragment>
          );
        })}
      </PopoverContent>
    </Popover>
  );
});
Combobox.displayName = 'Combobox';
