'use client';

// Client: holds the draft text and the controllable value, attaches the mask's
// input / key / paste handlers and restores the caret in a layout effect.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { IconButton, type IconButtonProps } from '../IconButton';
import { Input, type InputSize } from '../Input';

/* ---------------------------------------------------------------------------
 * DateInput, DateInputButton
 *
 * A typed date. Typing is the fast path for someone who already knows the
 * date; browsing a calendar is the DatePicker organism, which composes this
 * field with a Popover opened from `DateInputButton` in the `trailing` slot.
 * This component has no calendar of its own.
 *
 * The field IS `Input` (its recipe, sizes, focus, invalid and disabled looks),
 * a plain text input with `inputmode="numeric"`, not `type="date"`, so the
 * format is ours in every browser and the same on desktop and mobile.
 *
 * DD/MM/YYYY, day first — every rendered date in this system and Indian
 * convention. The separators are typed for you (preview `data-datemask`): the
 * value is a run of at most eight digits and the slashes are rendering, so
 * non-digits are dropped rather than rejected, paste survives any punctuation
 * (`4-3-2026`, `04.03.2026`, and ISO `2026-03-04` year-first), Backspace /
 * Delete step over a separator onto the digit behind it, and the caret is
 * restored by DIGIT position, so editing the middle of a date does not throw
 * it to the end.
 *
 * Value model — one string, Storyblok- and form-friendly: `value` /
 * `onValueChange` carry an ISO `YYYY-MM-DD` date, or `''` while the field is
 * empty, half-typed or not a real date (31/02/2026). The field keeps its own
 * draft text, so a half-typed date is never clobbered. `onTextChange`
 * reports the text and its state (`empty | partial | invalid | valid`) on
 * every edit, which is what a form needs to say "31 February 2026 is not a
 * real date". A `name` submits the ISO value through a hidden input.
 *
 * Validity is the Field's (`error` → `aria-invalid`): the field never marks
 * itself invalid, because "not finished yet" is not an error.
 *
 * Where the props go: `className` on the ROOT; every other native attribute,
 * `id`, `aria-*` and the ref on the text <input>.
 * ------------------------------------------------------------------------- */

export const dateInputVariants = cva('relative flex w-full min-w-0 items-center font-sans');

/** String unions, so a Storyblok option value can be passed straight in. */
export type DateInputSize = InputSize;
/** Where the typed text is: nothing, part of a date, a complete non-date, a real date. */
export type DateInputState = 'empty' | 'partial' | 'invalid' | 'valid';

/* ---- pure helpers (exported for the DatePicker and for tests) ------------ */

const SEP = '/';
const GROUPS = [2, 2, 4];

const digitsOf = (text: string) => text.replace(/\D+/g, '').slice(0, 8);

function render(digits: string): string {
  let out = '';
  let i = 0;
  for (let g = 0; g < GROUPS.length && i < digits.length; g += 1) {
    if (g > 0) out += SEP;
    const take = digits.slice(i, i + (GROUPS[g] ?? 0));
    out += take;
    i += take.length;
  }
  return out;
}

const digitsBefore = (text: string, offset: number) => text.slice(0, offset).replace(/\D+/g, '').length;

function offsetAfterDigits(text: string, n: number): number {
  if (n <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    if (c >= 48 && c <= 57) {
      seen += 1;
      if (seen === n) return i + 1;
    }
  }
  return text.length;
}

const pad = (n: number, width: number) => String(n).padStart(width, '0');

function isRealDate(y: number, m: number, d: number): boolean {
  if (y < 1000 || m < 1 || m > 12 || d < 1) return false;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= days;
}

/** The typed text's ISO date and state. `'27/03/2026'` → `{ iso: '2026-03-27', state: 'valid' }`. */
export function parseDateInputText(text: string): { iso: string; state: DateInputState } {
  const digits = digitsOf(text);
  if (digits.length === 0) return { iso: '', state: 'empty' };
  if (digits.length < 8) return { iso: '', state: 'partial' };
  const d = Number(digits.slice(0, 2));
  const m = Number(digits.slice(2, 4));
  const y = Number(digits.slice(4));
  if (!isRealDate(y, m, d)) return { iso: '', state: 'invalid' };
  return { iso: `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`, state: 'valid' };
}

/** An ISO `YYYY-MM-DD` as the field's DD/MM/YYYY text; `''` when it is not a real date. */
export function formatDateInputValue(iso: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!match) return '';
  const [, y = '', m = '', d = ''] = match;
  if (!isRealDate(Number(y), Number(m), Number(d))) return '';
  return `${d}${SEP}${m}${SEP}${y}`;
}

/* ---- context: the button follows the field ------------------------------- */

type DateInputContextValue = { disabled: boolean; size: DateInputSize };
const DateInputContext = React.createContext<DateInputContextValue | null>(null);

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/* ---- DateInput ------------------------------------------------------------ */

export type DateInputProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'size' | 'type' | 'value' | 'defaultValue'
> & {
  /** The date as ISO `YYYY-MM-DD`, `''` for none (controlled). */
  value?: string;
  /**
   * The initial date as ISO `YYYY-MM-DD` (uncontrolled).
   *
   * @default ''
   */
  defaultValue?: string;
  /**
   * Called with the new ISO date when it changes: a real date once all eight
   * digits are in, `''` when the field is emptied or stops being a real date.
   */
  onValueChange?: (value: string) => void;
  /** Called on every edit with the typed DD/MM/YYYY text and its state. */
  onTextChange?: (text: string, state: DateInputState) => void;
  /**
   * Control height and type size: 32 / 40 / 48px.
   *
   * @default 'md'
   */
  size?: DateInputSize;
  /**
   * A control at the end of the field — a `DateInputButton`, which the
   * DatePicker wraps in its Popover trigger.
   */
  trailing?: React.ReactNode;
  /**
   * The format hint shown while empty. Keep the format in it: the hint is
   * also the rule.
   *
   * @default 'DD/MM/YYYY'
   */
  placeholder?: string;
  /** Submits the ISO value (not the typed text) under this name, through a hidden input. */
  name?: string;
  /** Classes for the root (the field + trailing slot wrapper). */
  className?: string;
};

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  {
    className,
    size = 'md',
    value: valueProp,
    defaultValue = '',
    onValueChange,
    onTextChange,
    trailing,
    placeholder = 'DD/MM/YYYY',
    name,
    disabled = false,
    onChange,
    onKeyDown,
    onPaste,
    ...props
  },
  forwardedRef,
) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const ref = useComposedRefs(forwardedRef, inputRef);

  const [value, setValue] = useControllableState<string>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange,
    caller: 'DateInput',
  });

  const [text, setText] = React.useState(() => formatDateInputValue(value));
  const pendingCaret = React.useRef<number | null>(null);

  // A value set from outside replaces the draft — unless the draft already
  // means that value (a half-typed date is `''` too, and must survive).
  React.useEffect(() => {
    if (parseDateInputText(text).iso !== (value ?? '')) setText(formatDateInputValue(value));
  }, [value]);

  useIsoLayoutEffect(() => {
    const el = inputRef.current;
    const pos = pendingCaret.current;
    pendingCaret.current = null;
    if (el == null || pos == null || el !== el.ownerDocument.activeElement) return;
    try {
      el.setSelectionRange(pos, pos);
    } catch {
      /* not a text-selectable input */
    }
  });

  const commit = (next: string, caret: number | null) => {
    pendingCaret.current = caret;
    setText(next);
    const parsed = parseDateInputText(next);
    onTextChange?.(next, parsed.state);
    setValue(parsed.iso);
  };

  const context = React.useMemo(() => ({ disabled, size }), [disabled, size]);

  return (
    <DateInputContext.Provider value={context}>
      <div
        data-slot="date-input"
        data-size={size}
        data-disabled={disabled ? '' : undefined}
        className={cn(dateInputVariants(), className)}
      >
        <Input
          ref={ref}
          data-slot="date-input-field"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          size={size}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('tabular-nums', trailing != null && 'pe-10')}
          onChange={(event) => {
            onChange?.(event);
            const el = event.target;
            const raw = el.value;
            const caret = el.selectionStart;
            const collapsed = caret != null && caret === el.selectionEnd;
            const next = render(digitsOf(raw));
            commit(next, collapsed ? offsetAfterDigits(next, digitsBefore(raw, caret)) : null);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
            const el = event.currentTarget;
            if (el.selectionStart == null || el.selectionStart !== el.selectionEnd) return;
            let p = el.selectionStart;
            const v = el.value;
            // Step over separators so the deletion lands on a digit.
            if (event.key === 'Backspace') {
              while (p > 0 && v.charAt(p - 1) === SEP) p -= 1;
            } else if (event.key === 'Delete') {
              while (p < v.length && v.charAt(p) === SEP) p += 1;
            } else return;
            if (p !== el.selectionStart) el.setSelectionRange(p, p);
          }}
          onPaste={(event) => {
            onPaste?.(event);
            if (event.defaultPrevented) return;
            const data = event.clipboardData?.getData('text');
            if (!data) return;
            // A pasted date carries its own grouping: "4-3-2026" read as a flat
            // digit run would be 43/20/26. Three all-digit groups are honoured
            // and zero-padded; ISO arrives year-first and is reversed.
            const groups = data.trim().split(/\D+/).filter((g) => g.length > 0);
            if (groups.length !== 3) return;
            const [a = '', b = '', c = ''] = groups;
            const [day, month, year] = a.length === 4 ? [c, b, a] : [a, b, c];
            if (day.length > 2 || month.length > 2) return;
            event.preventDefault();
            const next = render(digitsOf(`${day.padStart(2, '0')}${month.padStart(2, '0')}${year}`));
            commit(next, next.length);
          }}
          {...props}
        />
        {name != null ? <input type="hidden" name={name} value={value ?? ''} disabled={disabled} /> : null}
        {trailing != null ? (
          <span data-slot="date-input-trailing" className="absolute end-2 flex items-center gap-1">
            {trailing}
          </span>
        ) : null}
      </div>
    </DateInputContext.Provider>
  );
});
DateInput.displayName = 'DateInput';

/* ---- DateInputButton ------------------------------------------------------ */

/* Phosphor 2.1.1 `calendar-blank` regular (preview `ph-calendar`). */
function CalendarGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z" />
    </svg>
  );
}

export type DateInputButtonProps = Omit<IconButtonProps, 'size'> & {
  /**
   * The accessible name — required. Say what it opens and for which field
   * ("Choose interview date from calendar", "Change interview date").
   */
  'aria-label': string;
};

/**
 * The trailing calendar button of a DateInput: a small tertiary IconButton
 * with the calendar glyph (pass children to replace it). It follows the
 * field's `disabled`. On its own it does nothing; the DatePicker makes it the
 * Popover trigger (`<PopoverTrigger asChild><DateInputButton … /></PopoverTrigger>`).
 */
export const DateInputButton = React.forwardRef<HTMLButtonElement, DateInputButtonProps>(
  function DateInputButton({ className, variant = 'tertiary', disabled, children, ...props }, ref) {
    const field = React.useContext(DateInputContext);
    return (
      <IconButton
        ref={ref}
        data-slot="date-input-button"
        variant={variant}
        size="sm"
        disabled={disabled ?? field?.disabled}
        className={cn(field?.size === 'sm' && 'size-6 min-w-6', className)}
        {...props}
      >
        {children ?? <CalendarGlyph />}
      </IconButton>
    );
  },
);
DateInputButton.displayName = 'DateInputButton';
