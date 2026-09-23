'use client';

// Client: Radix Toggle keeps the selected state and attaches the handlers; the
// removable chip attaches a click handler to its ✕.
import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Chip
 *
 * A compact control the user OPERATES: a filter they switch on, a value they
 * applied and can take off again. Chip vs Badge is the naming rule of this
 * system — a Chip is interactive, a Badge is a read-only label the system
 * sets. If clicking it would do nothing, it is a Badge and must not look
 * pressable.
 *
 * Two shapes, never both at once (preview, "Why the chip is a span here and a
 * button above"):
 *
 *   selectable (default)  the whole chip is a `<button aria-pressed>` (Radix
 *                         Toggle). `selected` / `defaultSelected` /
 *                         `onSelectedChange`.
 *   removable             pass `onRemove`. The chip becomes a static `<span>`
 *                         and only the ✕ is a control — a real `<button>` with
 *                         an `aria-label` that names WHICH value it removes,
 *                         and an invisible 44px hit area around a 20px glyph.
 *                         A button inside a button is invalid HTML, so a
 *                         removable chip is not selectable; `selected` on it is
 *                         only the look (an applied filter that is also active).
 *
 * Selection is `aria-pressed` + `data-state="on"`, and the look keys off
 * `data-state` only, so it cannot disagree with what is announced. Selected
 * gains a brand border and semibold weight as well as the pale brand fill, so
 * the difference survives greyscale and both themes.
 *
 * `icon` takes the regular cut at rest; `selectedIcon`, when given, the -fill
 * cut while selected (a shape change, not only a colour change). `avatar`
 * takes a small `<Avatar>` for a person-valued chip.
 *
 * Multi-select filter bars and one-of-N chip rows are `ToggleButtonGroup
 * variant="chips"`, which reuses this recipe with the group's keyboard model.
 * ------------------------------------------------------------------------- */

export const chipVariants = cva([
  'relative inline-flex h-7 max-w-full shrink-0 items-center gap-1 px-3',
  'rounded-full border border-border-control bg-surface text-content',
  'font-sans text-sm font-regular leading-none whitespace-nowrap',
  'transition-[background-color,border-color,color] duration-[var(--motion-duration-instant)]',
  'ease-[var(--motion-easing-productive-in-out)] motion-reduce:transition-none',

  // Selected, keyed on the state attribute Radix (or the removable chip) sets.
  'data-[state=on]:border-border-brand data-[state=on]:bg-surface-brand-subtle',
  'data-[state=on]:font-semibold data-[state=on]:text-content-brand',

  // Glyphs: 16px unless the caller sized them; an avatar hugs the left edge.
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-sm",
  '[&>[data-slot=avatar]]:-ms-2 [&>[data-slot=avatar]]:size-5 [&>[data-slot=avatar]]:text-[10px]',
]);

/** The interactive chip (the whole chip is the button). */
const chipButtonClass = cn(
  'cursor-pointer outline-none',
  'enabled:hover:bg-surface-hover data-[state=on]:enabled:hover:bg-surface-brand-subtle',
  'focus-visible:border-border-focus focus-visible:ring-[3px] focus-visible:ring-border-focus/50',
  // Disabled is a fill and the disabled ink, never an opacity.
  'disabled:cursor-not-allowed disabled:border-action-disabled-border disabled:bg-action-disabled',
  'disabled:text-content-disabled',
  // Disabled wins over selected: on, but not yours to change (keeps the weight).
  'data-[state=on]:disabled:border-action-disabled-border data-[state=on]:disabled:bg-action-disabled',
  'data-[state=on]:disabled:text-content-disabled',
);

/** The ✕ of a removable chip: 20px visible, 44px to the finger. */
const chipRemoveClass = cn(
  'relative -me-1.5 inline-flex size-5 shrink-0 cursor-pointer items-center justify-center',
  'rounded-full border-0 bg-transparent p-0 text-current opacity-60 outline-none',
  'transition-[opacity,background-color] duration-[var(--motion-duration-instant)] motion-reduce:transition-none',
  'enabled:hover:bg-surface-active enabled:hover:opacity-100',
  'focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-border-focus/50',
  'disabled:cursor-not-allowed disabled:opacity-100 disabled:text-content-disabled',
  // The invisible touch target, centred on the glyph.
  "before:absolute before:top-1/2 before:left-1/2 before:size-touch-min before:-translate-1/2 before:content-['']",
);

/* Phosphor 2.1.1 `x` bold, inline (the preview's `ph-close-bold`). */
function CloseGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z" />
    </svg>
  );
}

/** Plain text of a node, for the default "Remove …" name. */
function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (React.isValidElement(node)) {
    return textOf((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

export type ChipProps = Omit<React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>, 'pressed' | 'defaultPressed' | 'onPressedChange'> & {
  /** Selected (controlled). Sets `aria-pressed` on a selectable chip; only the look on a removable one. */
  selected?: boolean;
  /**
   * Selected at first (uncontrolled).
   *
   * @default false
   */
  defaultSelected?: boolean;
  /** Called with the new selected state when the user toggles the chip. */
  onSelectedChange?: (selected: boolean) => void;
  /** Leading glyph (regular weight). Also shown while selected when `selectedIcon` is not given. */
  icon?: React.ReactNode;
  /** Leading glyph while selected (the -fill weight). */
  selectedIcon?: React.ReactNode;
  /** A leading `<Avatar>` for a person-valued chip. Drawn at 20px. */
  avatar?: React.ReactNode;
  /**
   * Makes the chip removable: it renders as a static `<span>` with a trailing
   * ✕ button, which calls this. A removable chip is not selectable.
   */
  onRemove?: () => void;
  /**
   * Accessible name of the ✕. Name the value it removes, because "Remove"
   * six times down a filter bar says nothing.
   *
   * @default `Remove ${label text}`
   */
  removeLabel?: string;
};

export const Chip = React.forwardRef<HTMLElement, ChipProps>(function Chip(
  {
    className,
    selected: selectedProp,
    defaultSelected = false,
    onSelectedChange,
    icon,
    selectedIcon,
    avatar,
    onRemove,
    removeLabel,
    disabled,
    children,
    type,
    ...props
  },
  ref,
) {
  const [selected, setSelected] = useControllableState({
    prop: selectedProp,
    defaultProp: defaultSelected,
    onChange: onSelectedChange,
    caller: 'Chip',
  });

  const glyph = selected && selectedIcon != null ? selectedIcon : icon;

  if (onRemove) {
    const label = removeLabel ?? `Remove ${textOf(children)}`.trim();
    // The span takes the chip's props (id, data-*, aria-*), not button-only ones.
    const spanProps = props as React.HTMLAttributes<HTMLSpanElement>;
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        data-slot="chip"
        data-removable=""
        data-state={selected ? 'on' : 'off'}
        data-disabled={disabled ? '' : undefined}
        className={cn(
          chipVariants(),
          disabled &&
            'border-action-disabled-border bg-action-disabled text-content-disabled data-[state=on]:border-action-disabled-border data-[state=on]:bg-action-disabled data-[state=on]:text-content-disabled',
          className,
        )}
        {...spanProps}
      >
        {avatar}
        {glyph}
        <span data-slot="chip-label" className="min-w-0 truncate">
          {children}
        </span>
        <button
          type="button"
          data-slot="chip-remove"
          aria-label={label}
          disabled={disabled}
          className={chipRemoveClass}
          onClick={onRemove}
        >
          <CloseGlyph />
        </button>
      </span>
    );
  }

  return (
    <TogglePrimitive.Root
      ref={ref as React.Ref<HTMLButtonElement>}
      data-slot="chip"
      type={type ?? 'button'}
      pressed={selected}
      onPressedChange={setSelected}
      disabled={disabled}
      className={cn(chipVariants(), chipButtonClass, className)}
      {...props}
    >
      {avatar}
      {glyph}
      {children}
    </TogglePrimitive.Root>
  );
});
Chip.displayName = 'Chip';

/** @internal Shared with ToggleButtonGroup's chip variant, so the two cannot drift. */
export const chipInteractiveClass = chipButtonClass;
