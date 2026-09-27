'use client';

// Client: the chosen values, the query, the open state, the active option and
// the chip collapse are state; the field attaches key and pointer handlers,
// measures its chips in a layout effect, and the popup is Radix Popover.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva, type VariantProps } from 'class-variance-authority';

import { announce, ensureAnnouncer } from '../../lib/announce';
import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { useId } from '../../lib/use-id';
import { chipVariants } from '../Chip';
import { comboboxFilter, type ComboboxOption } from '../Combobox';
import { Popover, PopoverAnchor, PopoverContent } from '../Popover';
import { Spinner } from '../Spinner';

/* ---------------------------------------------------------------------------
 * MultiSelect
 *
 * Several values from a list too long for checkboxes: skills on a profile,
 * the programmes a mentor covers, the cities a candidate will relocate to.
 * Do NOT use it for five options (that is a Checkbox group, or
 * `ToggleButtonGroup variant="chips"` for a filter bar).
 *
 *   <Field label="Skills" help="Pick up to 5. Recruiters filter on these.">
 *     <MultiSelect name="skills" max={5} listLabel="Skills" placeholder="Search skills…"
 *       options={[{ value: 'python', label: 'Python' }, { value: 'sql', label: 'SQL' }]} />
 *   </Field>
 *
 * Why its own component and not `<Combobox multiple>`: the Combobox's value
 * is one string written into the field as text, its list closes on a pick,
 * and it paints `aria-selected` on the ACTIVE row (as the HTML does). A
 * multi-select changes all three: the value is an array shown as chips, the
 * list stays open, and `aria-selected` must mean chosen. One flag flipping
 * the value type and the meaning of an ARIA attribute is the surprising API;
 * two components that share the option type and the filter is not.
 *
 * The APG combobox pattern with a multi-select listbox popup:
 *   - the text input is `role="combobox"` and keeps DOM focus;
 *     `aria-activedescendant` names the active row;
 *   - the list is `role="listbox" aria-multiselectable="true"`; each row is
 *     `aria-selected` true or false (chosen, with a check), the active row
 *     is `data-active` (a position, not a choice);
 *   - typing filters; ↓ / ↑ open and move; Enter toggles the active row and
 *     the list stays open; Escape closes, a second Escape clears the text;
 *     Alt+↓ / Alt+↑ open and close; Tab closes;
 *   - Backspace in an empty field removes the last chip; ← at the start of
 *     the field walks onto the chips (← / → between them, Backspace or
 *     Delete removes one, → past the last or Escape returns to the field).
 *     The chips' ✕ buttons are out of the Tab order for that reason (one tab
 *     stop for the whole list of chips), and still reachable by a screen
 *     reader's virtual cursor and by touch;
 *   - every add and remove is announced through the package's one polite
 *     live region ("Python added. 3 selected.").
 *
 * Chips wrap. While the field does not have focus, chips past `maxRows`
 * rows (measured) or past `maxVisibleChips` collapse into "+N more";
 * focused, every chip shows, so each can be reached and removed.
 *
 * `max` caps the selection: at the cap the unchosen rows are unavailable
 * (`aria-disabled`) and the list says why.
 *
 * Every prop not listed below goes to the text input, and so does `ref`, so a
 * Field wires its label (`id`), help and error (`aria-describedby`,
 * `aria-invalid`) straight onto it; the box draws the invalid look from
 * `aria-invalid`. `className` styles the box. With `name`, one hidden input
 * per chosen value is posted.
 * ------------------------------------------------------------------------- */

const isRendered = (node: React.ReactNode) => node != null && node !== false && node !== '';

/* ---- data ----------------------------------------------------------------- */

/** One option. The same shape as `ComboboxOption`, so a list can feed either. */
export type MultiSelectOption = ComboboxOption;

/** The default filter: every word of the query appears in the label or keywords. */
export const multiSelectFilter = comboboxFilter;

/* ---- glyphs --------------------------------------------------------------- */

/** Phosphor 2.1.1 `x` bold. */
function CloseGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z" />
    </svg>
  );
}

/** Phosphor 2.1.1 `check` bold (Select's check). */
function CheckGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z" />
    </svg>
  );
}

/** Phosphor 2.1.1 `caret-down` fill (the Select trigger's solid caret). */
function CaretGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,48,88H208a8,8,0,0,1,5.66,13.66Z" />
    </svg>
  );
}

/* ---- recipes -------------------------------------------------------------- */

/**
 * The box: Input's look (border, fill, focus ring, invalid, disabled), grown
 * to hold rows of chips. Heights match Input: 32 / 40 / 48px on one row.
 */
export const multiSelectVariants = cva(
  [
    'relative flex w-full min-w-0 items-start gap-1 ps-1 pe-2',
    'rounded-md border border-field-border bg-field font-sans text-field-content',
    'cursor-text transition-[color,background-color,border-color,box-shadow]',
    'duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',
    'not-data-[disabled]:hover:border-field-border-hover',
    // Focus anywhere inside (the text, a chip): Input's ring contract.
    'focus-within:border-border-focus focus-within:ring-[3px] focus-within:ring-border-focus/50',
    'data-[invalid]:border-danger data-[invalid]:ring-danger/20',
    'data-[disabled]:cursor-not-allowed data-[disabled]:border-action-disabled-border',
    'data-[disabled]:bg-field-disabled data-[disabled]:text-content-disabled',
  ],
  {
    variants: {
      size: {
        // min-height = the control height; the padding centres one 24 / 28px
        // row of chips in it (less the 1px borders).
        sm: 'min-h-control-sm py-[0.1875rem]',
        md: 'min-h-control-md py-[0.4375rem]',
        lg: 'min-h-control-lg py-[0.5625rem]',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

type MultiSelectVariantProps = VariantProps<typeof multiSelectVariants>;

/** String union, so a Storyblok option value can be passed straight in. */
export type MultiSelectSize = NonNullable<MultiSelectVariantProps['size']>;

// Chips follow the field size: 24px in sm / md, 28px (Chip's own) in lg.
const chipSizeClass: Record<MultiSelectSize, string> = {
  sm: 'h-6 ps-2 pe-1 text-xs',
  md: 'h-6 ps-2.5 pe-1 text-sm',
  lg: 'h-7 ps-3 pe-1.5 text-sm',
};
// The text sits on the chips' line: the same height, so a row never jumps.
const inputSizeClass: Record<MultiSelectSize, string> = {
  sm: 'h-6 text-sm pointer-coarse:text-md',
  md: 'h-6 text-base pointer-coarse:text-md',
  lg: 'h-7 text-md',
};
const controlsSizeClass: Record<MultiSelectSize, string> = {
  sm: 'h-6',
  md: 'h-6',
  lg: 'h-7',
};

/** The chip ✕: 16px drawn, 44px to the finger (Chip's own remove button). */
const chipRemoveClass = cn(
  'relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center',
  'rounded-full border-0 bg-transparent p-0 text-current opacity-60 outline-none',
  'transition-[opacity,background-color] duration-[var(--motion-duration-instant)] motion-reduce:transition-none',
  'enabled:hover:bg-surface-active enabled:hover:opacity-100',
  'focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-border-focus/50',
  'disabled:cursor-not-allowed disabled:opacity-100 disabled:text-content-disabled',
  '[&_svg]:size-3',
  // Touch only: a 44px hit area centred on the glyph (a mouse gets the 16px
  // glyph, since neighbours sit 4px apart).
  'pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2',
  "pointer-coarse:before:size-touch-min pointer-coarse:before:-translate-1/2 pointer-coarse:before:content-['']",
);

const trailingButtonClass = cn(
  'touch-target inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm',
  'border-0 bg-transparent p-0 text-content-secondary outline-none',
  'transition-colors duration-[var(--motion-duration-instant)] motion-reduce:transition-none',
  'enabled:hover:bg-surface-hover enabled:hover:text-content',
  'focus-visible:ring-[3px] focus-visible:ring-border-focus/50',
  'disabled:cursor-not-allowed disabled:text-content-disabled',
);

const groupHeadingClass = 'px-3 pt-2 pb-1 type-eyebrow text-content-secondary select-none';

const optionClass = [
  'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-base leading-body text-content',
  // Touch: rows are 44px (Select's rule: rows sit edge to edge, so the row grows).
  'pointer-coarse:min-h-touch-min',
  'transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',
  '[&:not([aria-disabled=true])]:hover:bg-surface-hover',
  // The keyboard / pointer position.
  'data-[active]:bg-surface-brand-subtle',
  // Chosen: brand ink, the weight and the check (Select's checked row).
  'aria-selected:font-semibold aria-selected:text-content-brand',
  'aria-disabled:cursor-not-allowed aria-disabled:text-content-disabled',
];

/* ---- MultiSelect ---------------------------------------------------------- */

type InputAttributes = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'children' | 'role' | 'size' | 'max'
>;

export type MultiSelectProps = InputAttributes & {
  /**
   * Every option, in order. Filtered by the text unless `shouldFilter` is off.
   *
   * @default []
   */
  options?: MultiSelectOption[];
  /** The chosen values, in the order they were picked (controlled). Pair with `onValueChange`. */
  value?: string[];
  /**
   * The chosen values when uncontrolled.
   *
   * @default []
   */
  defaultValue?: string[];
  /** Called with the new values and their options on every add, remove and clear. */
  onValueChange?: (value: string[], options: MultiSelectOption[]) => void;
  /** The text in the field (controlled). Pair with `onInputValueChange`. */
  inputValue?: string;
  /**
   * The initial text when uncontrolled.
   *
   * @default ''
   */
  defaultInputValue?: string;
  /** Called on every keystroke, and when a pick clears the text. */
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
   * The most values that can be chosen. At the cap the unchosen rows are
   * unavailable and the list shows `maxText`.
   */
  max?: number;
  /**
   * The row shown at the top of the list at the cap.
   *
   * @default (max) => `You can choose up to ${max}. Remove one to pick another.`
   */
  maxText?: React.ReactNode | ((max: number) => React.ReactNode);
  /**
   * While the field does not have focus, show at most this many chips; the
   * rest collapse into "+N more".
   */
  maxVisibleChips?: number;
  /**
   * While the field does not have focus, show at most this many rows of
   * chips (measured); the rest collapse into "+N more". `0` never collapses.
   *
   * @default 2
   */
  maxRows?: number;
  /**
   * Clear the typed text after each pick, so the next search starts empty.
   * Turn off to pick several matches of one search ("py" → Python, PyTorch).
   *
   * @default true
   */
  clearInputOnSelect?: boolean;
  /**
   * Filter `options` by the text. Turn off when a server already filtered them.
   *
   * @default true
   */
  shouldFilter?: boolean;
  /**
   * Your own match test.
   *
   * @default multiSelectFilter (every word, case-insensitive)
   */
  filter?: (option: MultiSelectOption, query: string) => boolean;
  /**
   * Remote options are loading: the list shows a spinner row with
   * `loadingText` in place of the options.
   *
   * @default false
   */
  loading?: boolean;
  /**
   * The loading row's text.
   *
   * @default 'Searching…'
   */
  loadingText?: string;
  /**
   * The row shown when nothing matches, or a function of the text.
   *
   * @default (text) => text ? `No match for “${text}”.` : 'No options.'
   */
  emptyText?: React.ReactNode | ((text: string) => React.ReactNode);
  /**
   * The listbox's accessible name ("Skills").
   *
   * @default the field's `aria-label`, else 'Options'
   */
  listLabel?: string;
  /**
   * The clear-all button's accessible name.
   *
   * @default 'Clear all'
   */
  clearLabel?: string;
  /**
   * A chip ✕'s accessible name.
   *
   * @default (label) => `Remove ${label}`
   */
  getRemoveLabel?: (label: string) => string;
  /**
   * With `name`, one hidden input per chosen value (`name` repeated) is
   * posted with the form; the visible text input has no `name`.
   */
  name?: string;
  /**
   * Control height and type size: 32 / 40 / 48px on one row, like Input.
   *
   * @default 'md'
   */
  size?: MultiSelectSize;
  /**
   * Where the list's portal mounts. Defaults to `document.body`, themed by
   * the `data-brand` / `data-theme` attributes on `<html>`.
   */
  container?: HTMLElement | null;
  /** Classes for the box around the chips and the text, merged last. */
  className?: string;
};

type Row = { option: MultiSelectOption; id: string };

const EMPTY: string[] = [];

/* `useLayoutEffect` warns during server rendering on React < 19. */
const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/**
 * A filtering text field that collects several values as chips. `ref` is the
 * text `<input>`.
 */
export const MultiSelect = React.forwardRef<HTMLInputElement, MultiSelectProps>(function MultiSelect(
  {
    options = [],
    value: valueProp,
    defaultValue = EMPTY,
    onValueChange,
    inputValue: inputValueProp,
    defaultInputValue = '',
    onInputValueChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    max,
    maxText = (n: number) => `You can choose up to ${n}. Remove one to pick another.`,
    maxVisibleChips,
    maxRows = 2,
    clearInputOnSelect = true,
    shouldFilter = true,
    filter = multiSelectFilter,
    loading = false,
    loadingText = 'Searching…',
    emptyText = (text: string) => (text ? `No match for “${text}”.` : 'No options.'),
    listLabel,
    clearLabel = 'Clear all',
    getRemoveLabel = (label: string) => `Remove ${label}`,
    name,
    size = 'md',
    container,
    className,
    disabled,
    id: idProp,
    placeholder,
    onKeyDown,
    onFocus,
    onBlur,
    'aria-describedby': describedByProp,
    'aria-invalid': ariaInvalid,
    ...inputProps
  },
  forwardedRef,
) {
  const baseId = useId();
  const inputId = idProp ?? `${baseId}-input`;
  const listboxId = `${baseId}-listbox`;
  const summaryId = `${baseId}-summary`;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const ref = useComposedRefs(forwardedRef, inputRef);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const chipsRef = React.useRef<HTMLDivElement>(null);

  const byValue = (v: string) => options.find((option) => option.value === v);
  const labelOf = (v: string) => byValue(v)?.label ?? v;

  const [valueState, setValueState] = useControllableState<string[]>({
    prop: valueProp,
    defaultProp: defaultValue,
    caller: 'MultiSelect',
  });
  const value = valueState ?? EMPTY;
  const chosen = React.useMemo(() => new Set(value), [value]);

  const [text, setText] = useControllableState<string>({
    prop: inputValueProp,
    defaultProp: defaultInputValue,
    onChange: onInputValueChange,
    caller: 'MultiSelect',
  });
  const q = text ?? '';

  const [openState, setOpenState] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    caller: 'MultiSelect',
  });
  const open = Boolean(openState) && !disabled;
  const setOpen = (next: boolean) => {
    if (next !== open) setOpenState(next);
  };

  React.useEffect(() => {
    ensureAnnouncer();
  }, []);

  const atMax = max != null && value.length >= max;

  const commit = (next: string[], message: string) => {
    setValueState(next);
    onValueChange?.(
      next,
      next.map((v) => byValue(v) ?? { value: v, label: v }),
    );
    announce(message);
  };
  const countText = (n: number) => (n === 0 ? 'None selected.' : `${n} selected.`);

  const add = (option: MultiSelectOption) => {
    if (option.disabled || chosen.has(option.value) || atMax) return;
    const next = [...value, option.value];
    const capped = max != null && next.length >= max;
    commit(next, `${option.label} added. ${countText(next.length)}${capped ? ` Limit of ${max} reached.` : ''}`);
  };
  const remove = (v: string) => {
    if (!chosen.has(v)) return;
    const next = value.filter((x) => x !== v);
    commit(next, `${labelOf(v)} removed. ${countText(next.length)}`);
  };
  const toggle = (option: MultiSelectOption) => {
    if (chosen.has(option.value)) remove(option.value);
    else add(option);
    if (clearInputOnSelect && q !== '') setText('');
  };
  const clearAll = () => {
    if (value.length === 0) return;
    commit(EMPTY, 'All selections cleared.');
    if (q !== '') setText('');
    inputRef.current?.focus();
  };

  /* Filter and section the options; every row gets a stable id. */
  const visible = shouldFilter ? options.filter((option) => filter(option, q)) : options;
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
  // At the cap an unchosen row cannot be picked (but a chosen one can be dropped).
  const unavailable = (option: MultiSelectOption) =>
    Boolean(option.disabled) || (atMax && !chosen.has(option.value));
  const enabled = rows.filter((row) => !unavailable(row.option));

  const [activeValue, setActiveValue] = React.useState<string | null>(null);
  const active =
    enabled.find((row) => row.option.value === activeValue) ?? enabled[0] ?? null;
  const activeId = open ? active?.id : undefined;

  React.useEffect(() => {
    if (!activeId) return;
    const node = document.getElementById(activeId);
    if (node && typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  /* A modal's scroll lock cancels wheel / touch scrolling outside it, and the
     list portals to <body> (Combobox does the same). */
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

  const move = (delta: number) => {
    if (enabled.length === 0) return;
    const at = active ? enabled.indexOf(active) : -1;
    const next = enabled[(at + delta + enabled.length) % enabled.length];
    if (next) setActiveValue(next.option.value);
  };

  /* ---- focus and collapse ------------------------------------------------ */

  const [focusWithin, setFocusWithin] = React.useState(false);
  const expanded = focusWithin || open;

  // Collapse: how many chips show while blurred. `null` = all.
  const [fit, setFit] = React.useState<number | null>(null);
  const limit = expanded ? null : maxVisibleChips != null ? Math.max(0, maxVisibleChips) : null;
  const measured = expanded || !maxRows ? null : fit;
  const shownCount = Math.min(value.length, limit ?? value.length, measured ?? value.length);
  const hiddenCount = value.length - shownCount;

  // Measure after layout: render every chip (fit = null), keep the ones on
  // the first `maxRows` rows, then drop one at a time until "+N more" also
  // sits on the last kept row.
  const [width, setWidth] = React.useState(0);
  const lastRowTop = React.useRef(0);
  React.useEffect(() => {
    const node = chipsRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => setWidth(node.clientWidth));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useIsoLayoutEffect(() => {
    setFit(null);
  }, [value, width, maxRows, expanded, size]);
  useIsoLayoutEffect(() => {
    if (expanded || !maxRows) return;
    const node = chipsRef.current;
    if (!node) return;
    if (fit === null) {
      const chips = Array.from(node.querySelectorAll<HTMLElement>('[data-slot="multi-select-chip"]'));
      const tops: number[] = [];
      for (const chip of chips) if (!tops.includes(chip.offsetTop)) tops.push(chip.offsetTop);
      if (tops.length <= maxRows) return;
      lastRowTop.current = tops[maxRows - 1] ?? 0;
      setFit(chips.filter((chip) => chip.offsetTop <= lastRowTop.current).length);
      return;
    }
    const more = node.querySelector<HTMLElement>('[data-slot="multi-select-more"]');
    if (more && more.offsetTop > lastRowTop.current && fit > 0) setFit(fit - 1);
  }, [fit, expanded, maxRows]);

  /* ---- chips' roving focus --------------------------------------------- */

  const chipButtons = () =>
    Array.from(
      chipsRef.current?.querySelectorAll<HTMLButtonElement>('[data-slot="multi-select-chip-remove"]') ?? [],
    );
  const focusChip = (index: number) => {
    const buttons = chipButtons();
    if (index < 0 || buttons.length === 0) return;
    if (index >= buttons.length) {
      inputRef.current?.focus();
      return;
    }
    buttons[index]?.focus();
  };
  const pendingFocus = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (pendingFocus.current == null) return;
    const index = pendingFocus.current;
    pendingFocus.current = null;
    if (index < 0 || index >= value.length) inputRef.current?.focus();
    else focusChip(index);
  });

  const handleChipKeyDown = (index: number, v: string) => (event: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        focusChip(Math.max(0, index - 1));
        break;
      case 'ArrowRight':
        event.preventDefault();
        focusChip(index + 1);
        break;
      case 'Home':
        event.preventDefault();
        focusChip(0);
        break;
      case 'End':
      case 'Escape':
        event.preventDefault();
        inputRef.current?.focus();
        break;
      case 'Backspace':
      case 'Delete':
        event.preventDefault();
        if (disabled) return;
        // Focus the chip before (Backspace) or the one taking this place (Delete).
        pendingFocus.current = event.key === 'Backspace' ? index - 1 : index;
        if (pendingFocus.current < 0) pendingFocus.current = value.length > 1 ? 0 : -1;
        remove(v);
        break;
      default:
    }
  };

  /* ---- the text input --------------------------------------------------- */

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
    setActiveValue(null);
    setOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    const target = event.currentTarget;
    const atStart = target.selectionStart === 0 && target.selectionEnd === 0;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) setOpen(true);
        else if (!event.altKey) move(1);
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
          toggle(active.option);
        }
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        } else if (q !== '') {
          event.preventDefault();
          setText('');
        }
        break;
      case 'Backspace':
        if (q === '' && value.length > 0) {
          event.preventDefault();
          remove(value[value.length - 1]!);
        }
        break;
      case 'ArrowLeft':
        if ((q === '' || atStart) && value.length > 0) {
          event.preventDefault();
          focusChip(value.length - 1);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
    }
  };

  const handleBoxFocus = () => setFocusWithin(true);
  const handleBoxBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && boxRef.current?.contains(next)) return;
    setFocusWithin(false);
  };

  // A press on the box (not on a chip's ✕ or the controls) focuses the text
  // and toggles the list, the way a Select trigger opens.
  const handleBoxMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;
    if (target === inputRef.current) {
      // Placing the caret opens the list; it never closes it.
      setOpen(true);
      return;
    }
    event.preventDefault();
    inputRef.current?.focus();
    setOpen(!open);
  };

  const resolvedListLabel =
    listLabel ?? (typeof inputProps['aria-label'] === 'string' ? inputProps['aria-label'] : 'Options');
  const emptyNode = typeof emptyText === 'function' ? emptyText(q) : emptyText;
  const maxNode = max != null ? (typeof maxText === 'function' ? maxText(max) : maxText) : null;
  const invalid = ariaInvalid === true || ariaInvalid === 'true';
  const describedBy = [describedByProp, value.length > 0 ? summaryId : null].filter(Boolean).join(' ') || undefined;
  const summary =
    value.length > 0
      ? `${value.length} selected: ${value.map(labelOf).join(', ')}.${max != null ? ` Up to ${max}.` : ''}`
      : '';

  const shown = value.slice(0, shownCount);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          ref={boxRef}
          data-slot="multi-select"
          data-size={size}
          data-state={open ? 'open' : 'closed'}
          data-invalid={invalid ? '' : undefined}
          data-disabled={disabled ? '' : undefined}
          className={cn(multiSelectVariants({ size }), className)}
          onMouseDown={handleBoxMouseDown}
          onFocus={handleBoxFocus}
          onBlur={handleBoxBlur}
        >
          <div
            ref={chipsRef}
            data-slot="multi-select-chips"
            className="flex min-w-0 flex-1 flex-wrap items-center gap-1"
          >
            {shown.map((v, index) => {
              const label = labelOf(v);
              return (
                <span
                  key={v}
                  data-slot="multi-select-chip"
                  data-value={v}
                  data-state="on"
                  data-disabled={disabled ? '' : undefined}
                  className={cn(
                    chipVariants(),
                    chipSizeClass[size],
                    'min-w-0 cursor-default',
                    disabled &&
                      'border-action-disabled-border bg-action-disabled text-content-disabled data-[state=on]:border-action-disabled-border data-[state=on]:bg-action-disabled data-[state=on]:text-content-disabled',
                  )}
                >
                  <span data-slot="multi-select-chip-label" className="min-w-0 truncate">
                    {label}
                  </span>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-slot="multi-select-chip-remove"
                    aria-label={getRemoveLabel(label)}
                    disabled={disabled}
                    className={chipRemoveClass}
                    onClick={() => {
                      remove(v);
                      inputRef.current?.focus();
                    }}
                    onKeyDown={handleChipKeyDown(index, v)}
                  >
                    <CloseGlyph />
                  </button>
                </span>
              );
            })}
            {hiddenCount > 0 ? (
              <span
                data-slot="multi-select-more"
                className={cn(
                  chipVariants(),
                  chipSizeClass[size],
                  'cursor-default border-transparent bg-surface-sunken pe-2.5 text-content-secondary',
                )}
              >
                +{hiddenCount} more
              </span>
            ) : null}
            <input
              ref={ref}
              id={inputId}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={activeId}
              aria-describedby={describedBy}
              aria-invalid={ariaInvalid}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={disabled}
              value={q}
              placeholder={value.length === 0 ? placeholder : undefined}
              data-slot="multi-select-input"
              className={cn(
                'flex-1 border-0 bg-transparent px-2 py-0 font-sans text-field-content outline-none',
                // Room to type while focused; blurred with chips, it only
                // takes what is left, so it never adds a row of its own.
                expanded || value.length === 0 ? 'min-w-[5rem]' : '-ms-1 w-0 min-w-0 px-0',
                'placeholder:text-field-placeholder disabled:cursor-not-allowed disabled:text-content-disabled',
                inputSizeClass[size],
              )}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              onBlur={onBlur}
              {...inputProps}
            />
          </div>
          <div
            data-slot="multi-select-controls"
            className={cn('flex shrink-0 items-center gap-0.5', controlsSizeClass[size])}
          >
            {value.length > 0 && !disabled ? (
              <button
                type="button"
                data-slot="multi-select-clear"
                aria-label={clearLabel}
                className={trailingButtonClass}
                onClick={clearAll}
              >
                <CloseGlyph className="size-icon-sm" />
              </button>
            ) : null}
            <span
              aria-hidden="true"
              data-slot="multi-select-icon"
              className={cn(
                'flex size-6 items-center justify-center text-field-content [&_svg]:size-icon-sm',
                'transition-transform duration-[var(--motion-duration-fast)] motion-reduce:transition-none',
                open && 'rotate-180',
                disabled && 'text-content-disabled',
              )}
            >
              <CaretGlyph />
            </span>
          </div>
          <span id={summaryId} hidden>
            {summary}
          </span>
          {name
            ? value.map((v) => <input key={v} type="hidden" name={name} value={v} data-slot="multi-select-hidden" />)
            : null}
        </div>
      </PopoverAnchor>
      <PopoverContent
        ref={setListNode}
        id={listboxId}
        role="listbox"
        aria-label={resolvedListLabel}
        aria-multiselectable="true"
        data-slot="multi-select-list"
        padding="sm"
        sideOffset={4}
        container={container}
        className={cn(
          'w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) max-w-none',
          'max-h-[min(17.5rem,var(--radix-popover-content-available-height))] overflow-y-auto',
        )}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (boxRef.current?.contains(event.target as Node)) event.preventDefault();
        }}
      >
        {atMax && isRendered(maxNode) ? (
          <div
            role="option"
            aria-disabled="true"
            aria-selected="false"
            data-slot="multi-select-max"
            className="px-3 py-2 type-body-sm text-content-secondary cursor-default"
          >
            {maxNode}
          </div>
        ) : null}
        {loading && rows.length === 0 ? (
          <div
            role="option"
            aria-disabled="true"
            aria-selected="false"
            data-slot="multi-select-loading"
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
            data-slot="multi-select-empty"
            className="px-3 py-2 text-base text-content-secondary italic cursor-default"
          >
            {emptyNode}
          </div>
        ) : null}
        {sections.map((section, s) => {
          const headingId = `${baseId}-group-${s}`;
          const items = section.rows.map(({ option, id }) => {
            const isActive = active?.id === id;
            const isChosen = chosen.has(option.value);
            const off = unavailable(option);
            return (
              <div
                key={id}
                id={id}
                role="option"
                aria-selected={isChosen}
                aria-disabled={off || undefined}
                data-slot="multi-select-option"
                data-value={option.value}
                data-active={isActive ? '' : undefined}
                className={cn(optionClass)}
                onPointerMove={() => {
                  if (!off && !isActive) setActiveValue(option.value);
                }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (off) return;
                  setActiveValue(option.value);
                  toggle(option);
                }}
              >
                {/* The check column is reserved on every row. */}
                <span
                  data-slot="multi-select-check"
                  className="flex size-icon-sm shrink-0 items-center justify-center text-content-brand"
                >
                  {isChosen ? <CheckGlyph className="size-icon-sm" /> : null}
                </span>
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{option.label}</span>
              </div>
            );
          });
          return section.group ? (
            <div key={headingId} role="group" aria-labelledby={headingId} data-slot="multi-select-group">
              <div id={headingId} data-slot="multi-select-group-heading" className={groupHeadingClass}>
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
MultiSelect.displayName = 'MultiSelect';
