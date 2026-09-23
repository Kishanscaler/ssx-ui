'use client';

// Client: Radix Toggle keeps the pressed state and attaches the handlers.
import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { buttonVariants } from '../Button';

/* ---------------------------------------------------------------------------
 * ToggleButton
 *
 * A button that stays in after it is pressed: a STATE (bookmarked, pinned),
 * not an action. A click that does something and finishes is a Button.
 *
 * `aria-pressed` (Radix sets it, plus `data-state="on|off"`) is the only thing
 * driving the pressed look, so a toggle that looks pressed is pressed to a
 * screen reader too.
 *
 * It is the secondary Button at rest, and when ON a FILLED button with an
 * inset top edge that reads as physically depressed. That is deliberately
 * unlike a selected Chip (a pale pill) or a Segmented Control item (a raised
 * tile in a sunken tray). Disabled + pressed keeps its on-ness and takes the
 * disabled dimming: on, and not yours to change.
 *
 * Pressed icons swap regular -> fill weight. Pass `icon` and `pressedIcon`
 * and the swap follows the state, controlled or not. Icon-only
 * (`size="icon-*"`) requires an `aria-label` that names the thing being
 * toggled, not just the verb.
 *
 * "One pressed at a time" is a ToggleGroup, a molecule, not this atom.
 * ------------------------------------------------------------------------- */

export const toggleButtonVariants = cva(
  [
    // At rest the pressed look is keyed on `data-state=on`; hover/active and
    // disabled repeat Button's `enabled:` / `disabled:` so they outrank it.
    'data-[state=on]:border-surface-brand-solid data-[state=on]:bg-surface-brand-solid',
    'data-[state=on]:text-content-on-brand-solid',
    'data-[state=on]:shadow-[inset_0_var(--border-thick)_0_0_var(--action-primary-bg-active)]',
    'data-[state=on]:enabled:hover:border-action-primary-hover data-[state=on]:enabled:hover:bg-action-primary-hover',
    'data-[state=on]:enabled:active:border-action-primary-active data-[state=on]:enabled:active:bg-action-primary-active',
    'data-[state=on]:disabled:border-surface-brand-solid data-[state=on]:disabled:bg-surface-brand-solid',
    'data-[state=on]:disabled:text-content-on-brand-solid data-[state=on]:disabled:opacity-disabled',
    'data-[state=on]:disabled:shadow-none',
    'disabled:cursor-not-allowed',
  ],
  {
    variants: {
      size: {
        // The HTML toggle carries a 20px glyph beside its label at md and lg.
        sm: '',
        md: "[&_svg:not([class*='size-'])]:size-icon-md",
        lg: "[&_svg:not([class*='size-'])]:size-icon-md",
        'icon-sm': '',
        'icon-md': '',
        'icon-lg': '',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

type ToggleButtonVariantProps = VariantProps<typeof toggleButtonVariants>;

export type ToggleButtonSize = NonNullable<ToggleButtonVariantProps['size']>;

export type ToggleButtonProps = React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
  ToggleButtonVariantProps & {
    /**
     * Glyph shown before the label while NOT pressed (the regular weight).
     * Also shown while pressed when `pressedIcon` is not given.
     */
    icon?: React.ReactNode;
    /** Glyph shown while pressed (the fill weight). */
    pressedIcon?: React.ReactNode;
  };

export const ToggleButton = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleButtonProps
>(function ToggleButton(
  {
    className,
    size = 'md',
    pressed: pressedProp,
    defaultPressed,
    onPressedChange,
    icon,
    pressedIcon,
    children,
    type,
    ...props
  },
  ref,
) {
  // Owned here (not left to Radix) so the icon swap knows the state in the
  // uncontrolled case too.
  const [pressed, setPressed] = useControllableState({
    prop: pressedProp,
    defaultProp: defaultPressed ?? false,
    onChange: onPressedChange,
    caller: 'ToggleButton',
  });

  const glyph = pressed && pressedIcon != null ? pressedIcon : icon;

  return (
    <TogglePrimitive.Root
      ref={ref}
      data-slot="toggle-button"
      data-size={size}
      type={type ?? 'button'}
      pressed={pressed}
      onPressedChange={setPressed}
      className={cn(
        buttonVariants({ variant: 'secondary', size }),
        toggleButtonVariants({ size }),
        className,
      )}
      {...props}
    >
      {glyph}
      {children}
    </TogglePrimitive.Root>
  );
});
ToggleButton.displayName = 'ToggleButton';
