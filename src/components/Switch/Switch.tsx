'use client';

// Client: Radix Switch keeps the on/off state and attaches the handlers, and
// `pending` attaches our own click guard.
import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Spinner } from '../Spinner';

/* ---------------------------------------------------------------------------
 * Switch, SwitchStatus
 *
 * An immediate on/off setting: the change applies the moment it is flipped,
 * with no Save button. A value committed on submit is a Checkbox.
 *
 * Radix renders `<button role="switch">`, so it announces "on / off" rather
 * than "checked" — the accessibility trap the HTML calls out is closed by the
 * primitive. Label it with a `<label htmlFor>`; describe it with
 * `aria-describedby`.
 *
 * `pending` is an optimistic write in flight. The switch shows the value it is
 * writing, sets `aria-busy`, takes the disabled dimming (because that is
 * honestly what it is while mid-write), stops answering to the pointer and
 * ignores activation — but it stays focusable, so focus is not thrown away
 * when the write starts. The loader that separates "busy" from "disabled" is
 * `SwitchStatus`, placed at the END of the setting row, after the label: it is
 * laid out, not laid over, and it reserves its box even when idle, so the row
 * never jumps when a write starts or finishes.
 * ------------------------------------------------------------------------- */

export const switchVariants = cva([
  // Touch: `touch-target` (theme.css, also the `relative` the thumb needs)
  // draws an invisible 44px-tall hit area on the 40x22 track on a coarse
  // pointer, without changing the row's layout.
  'peer touch-target inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full',
  'bg-border-control cursor-pointer outline-none',
  'transition-[background-color,box-shadow] duration-(--motion-duration-normal) ease-productive-in-out',
  'motion-reduce:transition-none',

  // Off: darkens to border-controlHover, then border-strong. On: the primary
  // hover and active stops.
  'enabled:hover:bg-border-control-hover enabled:active:bg-border-strong',
  'data-[state=checked]:bg-action-primary',
  'data-[state=checked]:enabled:hover:bg-action-primary-hover',
  'data-[state=checked]:enabled:active:bg-action-primary-active',

  'focus-visible:ring-[3px] focus-visible:ring-border-focus/50',
  'aria-invalid:ring-[3px] aria-invalid:ring-danger/20',

  // Disabled dims rather than refills, as the HTML does: an ON switch that is
  // locked must still read as on.
  'disabled:cursor-not-allowed disabled:opacity-disabled',

  // Pending: mid-write, so no pointer response at all. The selectors repeat
  // `enabled:hover` so they outrank the hover rules above.
  'aria-busy:cursor-progress aria-busy:opacity-disabled',
  'aria-busy:enabled:hover:bg-border-control aria-busy:enabled:active:bg-border-control',
  'aria-busy:data-[state=checked]:enabled:hover:bg-action-primary',
  'aria-busy:data-[state=checked]:enabled:active:bg-action-primary',
]);

export type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & {
  /**
   * An optimistic write is in flight. Sets `aria-busy`, dims the track, and
   * ignores clicks and Space until it clears — while staying focusable. Pair
   * it with a `<SwitchStatus pending>` at the end of the row.
   *
   * @default false
   */
  pending?: boolean;
};

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(function Switch({ className, pending = false, onClick, ...props }, ref) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(event);
    // Radix skips its toggle when the click was default-prevented. Keyboard
    // activation of a <button> is a click too, so this covers Space and Enter.
    if (pending) event.preventDefault();
  };

  return (
    <SwitchPrimitive.Root
      ref={ref}
      data-slot="switch"
      data-pending={pending || undefined}
      aria-busy={pending || undefined}
      className={cn(switchVariants(), className)}
      onClick={handleClick}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-4 translate-x-[3px] rounded-full bg-page',
          'transition-transform duration-(--motion-duration-normal) ease-overshoot',
          'data-[state=checked]:translate-x-[21px] motion-reduce:transition-none',
        )}
      />
    </SwitchPrimitive.Root>
  );
});
Switch.displayName = 'Switch';

/* ------------------------------------------------------------------------- */

export type SwitchStatusProps = React.ComponentPropsWithoutRef<'span'> & {
  /**
   * Show the loader. When false the box is still rendered (hidden), so the
   * row does not reflow when a write starts or finishes.
   *
   * @default false
   */
  pending?: boolean;
  /**
   * What a screen reader is told while pending.
   *
   * @default 'Saving'
   */
  label?: string;
};

/**
 * The pending slot at the end of a switch row: `<Spinner kind="dots"
 * size="sm">` — the six-dot grid, the small spinner, for where the monogram
 * has no room — inside a box that is always reserved, with `role="status"`.
 */
export const SwitchStatus = React.forwardRef<HTMLSpanElement, SwitchStatusProps>(
  function SwitchStatus({ className, pending = false, label = 'Saving', ...props }, ref) {
    return (
      <span
        ref={ref}
        data-slot="switch-status"
        data-pending={pending || undefined}
        role="status"
        className={cn(
          'ml-1 inline-flex size-icon-sm shrink-0 items-center justify-center text-content-brand',
          pending ? 'visible' : 'invisible',
          className,
        )}
        {...props}
      >
        {pending ? (
          <>
            {/* The system's one dots loader, not a copy of it: the same
                Spinner a small Button loads with. Silent (`label={null}`),
                because this span is already the status and announces `label`. */}
            <Spinner size="sm" kind="dots" label={null} />
            <span className="sr-only">{label}</span>
          </>
        ) : null}
      </span>
    );
  },
);
SwitchStatus.displayName = 'SwitchStatus';
