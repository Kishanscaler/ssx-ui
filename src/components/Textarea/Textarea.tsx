import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { inputVariants } from '../Input';

/* ---------------------------------------------------------------------------
 * Textarea  (inventory name: text-area)
 *
 * Multi-line free text where the applicant genuinely needs room: a statement
 * of purpose, mentor feedback, an incident note. Not for anything you intend
 * to parse.
 *
 * It IS the Input recipe (`inputVariants`: border, fill, placeholder, hover,
 * focus ring, aria-invalid, disabled fill, dashed read-only), called as a
 * recipe rather than copied, so a text field and a text area in one form can
 * never drift apart. Only the geometry differs: height comes from `rows` (or
 * the content), the padding is even on all sides, and the leading is the
 * reading measure rather than the single-line control's.
 *
 * No `maxLength` guidance baked in, on purpose: "over the limit" is an INVALID
 * state (aria-invalid + an error), not a wall that stops typing mid-sentence.
 * The counter belongs to Field, opposite the label.
 *
 * Server atom: no hooks, no handlers attached here, so no directive.
 * ------------------------------------------------------------------------- */

export const textareaVariants = cva(
  [
    // Undo the single-line geometry the Input recipe carries: auto height, a
    // 96px floor (the preview's `.textarea { min-height: 96px }`), even padding.
    'h-auto min-h-24 py-3',
    'leading-[var(--font-leading-code)]',
    'resize-y',
  ],
  {
    variants: {
      /**
       * `true` grows with the content (`field-sizing: content`, Chromium 123+).
       * Elsewhere it falls back to `rows`, which is why `rows` still matters.
       */
      autoResize: {
        true: 'field-sizing-content resize-none',
        false: '',
      },
    },
    defaultVariants: { autoResize: false },
  },
);

type InputVariantProps = VariantProps<typeof inputVariants>;

/** Same scale as Input: type size only here, since height comes from `rows`. */
export type TextareaSize = NonNullable<InputVariantProps['size']>;

export type TextareaProps = React.ComponentPropsWithoutRef<'textarea'> & {
  /**
   * Type size, matching the Input beside it: `sm` 14 / `md` 16 / `lg` 18px.
   *
   * @default 'md'
   */
  size?: TextareaSize;
  /**
   * Grow with the content instead of scrolling (`field-sizing: content`).
   * Browsers without it keep the `rows` height.
   *
   * @default false
   */
  autoResize?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, size = 'md', autoResize = false, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      data-size={size}
      rows={rows}
      className={cn(inputVariants({ size }), textareaVariants({ autoResize }), className)}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
