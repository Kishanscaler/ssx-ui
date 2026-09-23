'use client';

// Client: Radix RadioGroup keeps the selected value and runs roving focus.
import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * RadioGroup, RadioGroupItem
 *
 * Exactly one choice from a small, mutually exclusive set worth seeing all at
 * once. Past about seven options use Select. There is no lone Radio export: a
 * single radio cannot be unselected, so the group is the only shape offered.
 *
 * Radix gives the keyboard contract (arrows move and select inside the group,
 * Tab leaves it). The group needs a name: `aria-label`, `aria-labelledby`, or a
 * `<fieldset>`/`<legend>` around it. Each item is labelled by a `<label
 * htmlFor>` beside it; an item's description is referenced with
 * `aria-describedby`. Composing those is Field's job.
 *
 * Invalid goes on the group (`aria-invalid`) and restyles every item, because
 * "choose a fee plan" is a fault of the set, not of one option. It can also be
 * set on a single item.
 *
 * The item recipe is the Checkbox's, circle-shaped, on the same tokens: the two
 * choice controls behave identically under the pointer.
 * ------------------------------------------------------------------------- */

export const radioGroupVariants = cva(
  'grid gap-2 data-[orientation=horizontal]:flex data-[orientation=horizontal]:flex-wrap data-[orientation=horizontal]:gap-x-6',
);

export const radioGroupItemVariants = cva([
  'peer inline-grid size-[18px] shrink-0 place-content-center',
  'rounded-full border border-field-border bg-field',
  'cursor-pointer outline-none',
  'transition-[background-color,border-color,box-shadow] duration-(--motion-duration-instant) ease-productive-in-out',
  'motion-reduce:transition-none',

  'enabled:hover:border-border-control-hover enabled:hover:bg-surface-hover',
  'enabled:active:border-border-control-hover enabled:active:bg-surface-active',

  'data-[state=checked]:border-action-primary data-[state=checked]:bg-action-primary',
  'data-[state=checked]:enabled:hover:border-action-primary-hover data-[state=checked]:enabled:hover:bg-action-primary-hover',
  'data-[state=checked]:enabled:active:border-action-primary-active data-[state=checked]:enabled:active:bg-action-primary-active',

  'focus-visible:ring-[3px] focus-visible:ring-border-focus/50',

  // Invalid on the item itself, or on the group around it.
  'aria-invalid:border-2 aria-invalid:border-danger aria-invalid:data-[state=checked]:border-danger',
  '[[role=radiogroup][aria-invalid=true]_&]:border-2 [[role=radiogroup][aria-invalid=true]_&]:border-danger',

  'disabled:cursor-not-allowed disabled:border-border-decorative disabled:bg-field-disabled',
  'disabled:data-[state=checked]:border-border-decorative disabled:data-[state=checked]:bg-field-disabled',
]);

export type RadioGroupProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(function RadioGroup({ className, orientation = 'vertical', ...props }, ref) {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      data-slot="radio-group"
      // Radix sets `aria-orientation` only; the layout needs a data hook.
      data-orientation={orientation}
      orientation={orientation}
      className={cn(radioGroupVariants(), className)}
      {...props}
    />
  );
});
RadioGroup.displayName = 'RadioGroup';

export type RadioGroupItemProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>;

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(function RadioGroupItem({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      data-slot="radio-group-item"
      className={cn(radioGroupItemVariants(), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        forceMount
        data-slot="radio-group-indicator"
        className={cn(
          'block size-2 rounded-full bg-action-primary-fg',
          'scale-100 transition-transform duration-(--motion-duration-instant) ease-overshoot',
          'data-[state=unchecked]:scale-0 motion-reduce:transition-none',
        )}
      />
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';
