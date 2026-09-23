import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Input
 *
 * Structure and API follow shadcn/ui: a `cva` recipe + a `React.forwardRef`
 * component (React 16.12+; see docs/05-react-architecture.md "How to write an
 * atom"), `data-slot` for styling hooks, and a bare `<input>` with no
 * wrapper element. Only the token values and the size scale are ours.
 *
 * There is no `label`, `helperText` or `error` prop, and no wrapping <div>.
 * A label is a separate element with its own `htmlFor`, help text is a separate
 * element referenced by `aria-describedby`, and a wrapper makes both of those
 * the component's business instead of the form's. Those belong to `Field`,
 * which composes them; an Input that grows a label prop is an Input that can
 * never be put inside anything else.
 *
 * Validity is `aria-invalid`, not an `invalid` boolean. The attribute is what
 * assistive technology reads and what the styling keys off, so a separate prop
 * would be a second source of truth for one fact — and the one that does not
 * reach the accessibility tree.
 * ------------------------------------------------------------------------- */

export const inputVariants = cva(
  [
    'flex w-full min-w-0',
    // `border` is 1px, which is `--border-hair`. The radius ladder is gated in
    // the Python build, so `rounded-md` and the token cannot drift apart.
    'rounded-md border border-field-border bg-field',
    'font-sans text-field-content',
    'outline-none transition-[color,background-color,border-color,box-shadow]',

    'placeholder:text-field-placeholder',
    'selection:bg-action-primary selection:text-action-primary-fg',

    // A file input's own button is a control inside a control. It gets the
    // label's weight and none of the chrome, so the field still reads as one
    // box rather than two.
    'file:inline-flex file:border-0 file:bg-transparent',
    'file:text-sm file:font-semibold file:text-content',

    'enabled:hover:border-field-border-hover',

    // Focus: the same ring contract as Button — a 3px ring at half strength
    // plus a solid border. Written identically on purpose; a field and a button
    // sitting in one form must not focus in two different ways.
    'focus-visible:border-border-focus focus-visible:ring-border-focus/50 focus-visible:ring-[3px]',

    // Invalid is the ARIA attribute, styled. Nothing else sets this look, so
    // the red border cannot appear without the accessibility tree agreeing.
    // Written the same way as Button's, so the two agree in one form.
    'aria-invalid:border-danger aria-invalid:ring-danger/20',

    // Disabled is a fill, not an opacity — the same divergence from
    // `disabled:opacity-50` that Button makes, for the same reason: fading a
    // control also fades the surface behind it, and on a raised card the
    // result is unreadable.
    'disabled:cursor-not-allowed disabled:border-action-disabled-border',
    'disabled:bg-field-disabled disabled:text-content-disabled',

    // Read-only is NOT disabled: it is legible, selectable, copyable, and
    // clearly not editable. A dashed border says "this is a value, not a
    // field" without dimming the text someone may need to read.
    //
    // `:not(:disabled)` is load-bearing, not defensive. Per CSS Selectors, a
    // disabled input also matches `:read-only` — so the bare `read-only:`
    // variant would repaint every disabled field with the sunken fill, and
    // which one won would come down to Tailwind's variant ordering rather than
    // to a decision anyone made.
    '[&:read-only:not(:disabled)]:cursor-default',
    '[&:read-only:not(:disabled)]:border-dashed [&:read-only:not(:disabled)]:bg-surface-sunken',

    // Suppress the browser's OWN clear button on type="search". Chrome draws
    // one from an embedded image that picks up the platform accent — a glyph in
    // a colour the system does not own, at a size it cannot set, sitting right
    // beside the clear button a Search field already provides. Two clear
    // buttons, one of them unstyleable.
    //
    // Same answer as the native <select> menu: if a control is part of the
    // design system, the user agent does not get to draw a second one.
    // `type="search"` is kept for the semantics and the on-screen keyboard.
    '[&::-webkit-search-cancel-button]:appearance-none',
    '[&::-webkit-search-decoration]:appearance-none',
    '[&::-webkit-search-results-button]:appearance-none',

    'motion-reduce:transition-none',
  ],
  {
    variants: {
      size: {
        // Height and type size only. Horizontal padding is constant across the
        // scale — a field's left edge is where the eye expects the value to
        // start, and stepping it per size makes a stacked form ragged.
        //
        // Touch: the text is never below 16px on a coarse pointer, because iOS
        // Safari zooms the page into any field whose text is smaller and does
        // not zoom back out. The height stays the same, so a form lays out
        // identically on a phone. `md` is the `field-text` utility (15px, 16px
        // on touch) written as two mergeable classes, so a consumer's
        // `className="text-lg"` still replaces the desktop size the way every
        // other recipe class is replaced; `field-text` itself is unknown to
        // tailwind-merge and would outrank it in the CSS.
        sm: 'h-control-sm px-3 text-sm pointer-coarse:text-md file:text-xs',
        md: 'h-control-md px-3 text-base pointer-coarse:text-md file:text-sm',
        lg: 'h-control-lg px-3 text-md file:text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

type InputVariantProps = VariantProps<typeof inputVariants>;

export type InputSize = NonNullable<InputVariantProps['size']>;

/**
 * `size` is omitted from the native props deliberately.
 *
 * `<input size>` is an HTML attribute typed `number` — a width in average
 * character widths, from a era before CSS. Intersecting it with our string
 * union would resolve to `never` and the prop would be unusable. Every design
 * system that has a sized input makes this same trade, because the native
 * attribute does nothing here anyway: `w-full` overrides it.
 */
export type InputProps = Omit<React.ComponentPropsWithoutRef<'input'>, 'size'> & InputVariantProps;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, size = 'md', type, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      data-slot="input"
      data-size={size}
      type={type}
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  );
});
Input.displayName = 'Input';
