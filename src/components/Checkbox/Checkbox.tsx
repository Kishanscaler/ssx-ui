'use client';

// Client: Radix Checkbox keeps the checked state and attaches the handlers.
import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Checkbox
 *
 * A binary opt-in that is toggled independently of its siblings. Several may be
 * chosen at once; exactly-one is RadioGroup, and a setting that applies the
 * moment it is flipped is Switch.
 *
 * The atom is the 18px box and nothing else. There is no `label` prop: a label
 * is a `<label htmlFor>` beside it (put the text INSIDE the label so the whole
 * row is a hit target), a description is an element referenced by
 * `aria-describedby`, and composing those is Field's job. Invalid is
 * `aria-invalid`, not a boolean, so the red box cannot appear without the
 * accessibility tree agreeing.
 *
 * `checked="indeterminate"` is Radix's tri-state: `aria-checked="mixed"` and
 * the bar glyph. The glyphs are the HTML's own shapes (its clip-path polygon
 * and inset bar) drawn as SVG, so the React box and the preview box match.
 *
 * A form post needs `name`: Radix renders its hidden bubble input only inside
 * a `<form>`.
 * ------------------------------------------------------------------------- */

export const checkboxVariants = cva([
  'peer inline-grid size-[18px] shrink-0 place-content-center',
  // Touch: a 44px invisible hit area centred on the 18px box (theme.css). The
  // box keeps its size and the row its layout. Stacked checkboxes closer
  // than 44px apart share the overlap (the later one wins a tap between
  // them), so a list for touch should wrap each box in its <label> or keep
  // rows at least 44px apart; see README "Mobile setup".
  'touch-target',
  'rounded-md border border-field-border bg-field text-action-primary-fg',
  'cursor-pointer outline-none',
  'transition-[background-color,border-color,box-shadow] duration-(--motion-duration-instant) ease-productive-in-out',
  'motion-reduce:transition-none',

  // Hover and pressed exist in both the empty and the filled case (the HTML's
  // repair): border-controlHover on surface-hover / surface-active when empty,
  // the primary ramp when filled. A disabled box answers to neither.
  'enabled:hover:border-border-control-hover enabled:hover:bg-surface-hover',
  'enabled:active:border-border-control-hover enabled:active:bg-surface-active',

  'data-[state=checked]:border-action-primary data-[state=checked]:bg-action-primary',
  'data-[state=indeterminate]:border-action-primary data-[state=indeterminate]:bg-action-primary',
  'data-[state=checked]:enabled:hover:border-action-primary-hover data-[state=checked]:enabled:hover:bg-action-primary-hover',
  'data-[state=indeterminate]:enabled:hover:border-action-primary-hover data-[state=indeterminate]:enabled:hover:bg-action-primary-hover',
  'data-[state=checked]:enabled:active:border-action-primary-active data-[state=checked]:enabled:active:bg-action-primary-active',
  'data-[state=indeterminate]:enabled:active:border-action-primary-active data-[state=indeterminate]:enabled:active:bg-action-primary-active',

  'focus-visible:ring-[3px] focus-visible:ring-border-focus/50',

  // Invalid: the HTML's thick danger border, which wins over the checked fill's
  // border (the HTML's `.is-invalid` rule comes later at equal specificity).
  'aria-invalid:border-2 aria-invalid:border-danger',
  'aria-invalid:data-[state=checked]:border-danger aria-invalid:data-[state=indeterminate]:border-danger',

  // Disabled is a fill, and it wins over checked — as in the HTML, where
  // `input:disabled` follows `input:checked` at equal specificity.
  'disabled:cursor-not-allowed disabled:border-border-decorative disabled:bg-field-disabled',
  'disabled:data-[state=checked]:border-border-decorative disabled:data-[state=checked]:bg-field-disabled',
  'disabled:data-[state=indeterminate]:border-border-decorative disabled:data-[state=indeterminate]:bg-field-disabled',
]);

export type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

/** Check mark: the HTML's clip-path polygon, in a 10×10 box. */
const CHECK_POINTS = '1.4,4.4 0,6.5 5,10 10,1.6 8,0 4.3,6.2';

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      data-slot="checkbox"
      className={cn(checkboxVariants(), className)}
      {...props}
    >
      {/* Force-mounted so the glyph can scale in with the overshoot ease rather
          than popping; `data-state` on the indicator drives both the scale and
          which glyph shows. */}
      <CheckboxPrimitive.Indicator
        forceMount
        data-slot="checkbox-indicator"
        className={cn(
          'group/indicator grid size-[10px] place-content-center',
          'scale-100 transition-transform duration-(--motion-duration-instant) ease-overshoot',
          'data-[state=unchecked]:scale-0 motion-reduce:transition-none',
        )}
      >
        <svg
          viewBox="0 0 10 10"
          aria-hidden="true"
          focusable="false"
          className="size-[10px] fill-current group-data-[state=indeterminate]/indicator:hidden"
        >
          <polygon points={CHECK_POINTS} />
        </svg>
        <svg
          viewBox="0 0 10 10"
          aria-hidden="true"
          focusable="false"
          className="hidden size-[10px] fill-current group-data-[state=indeterminate]/indicator:block"
        >
          <rect x="1" y="4.2" width="8" height="1.6" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = 'Checkbox';
