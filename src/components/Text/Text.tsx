import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Text
 *
 * Body copy and its colour roles. The tone is a JOB, not a shade: pick it by
 * what the text is for (`secondary` = supporting detail you still expect
 * people to read), never by how dark it should look. Anything that is a
 * heading is a `Heading`, not a bold `Text`.
 *
 * Tabular figures are the `tabular-nums` utility, not a prop: any number a
 * person scans down a column (fees, CTC, marks) gets `className="tabular-nums"`.
 *
 * The tones read the content ROLES (`--content-secondary`, ...), so Text is
 * correct on an inverse or brand-solid surface without a modifier: those
 * surfaces remap the roles for everything inside them.
 *
 * Server atom: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

export const textVariants = cva(
  // Every size keeps the body leading, as the HTML's `.txt--*` do: a size
  // step changes the font size only.
  'font-sans leading-body',
  {
    variants: {
      tone: {
        primary: 'text-content',
        secondary: 'text-content-secondary',
        brand: 'text-content-brand',
        disabled: 'text-content-disabled',
        // Link-coloured text that is NOT a link — a highlighted figure. If it
        // is clickable it is a `Link`, underline and all.
        link: 'text-content-link',
      },
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        base: 'text-base',
        md: 'text-md',
        lg: 'text-lg',
      },
    },
    defaultVariants: { tone: 'primary', size: 'base' },
  },
);

type TextVariantProps = VariantProps<typeof textVariants>;

export type TextTone = NonNullable<TextVariantProps['tone']>;
export type TextSize = NonNullable<TextVariantProps['size']>;
/** The elements running text legitimately renders as. */
export type TextElement = 'p' | 'span' | 'div' | 'label' | 'li';

export type TextProps = React.HTMLAttributes<HTMLElement> &
  TextVariantProps & {
    /**
     * The element. A narrow list on purpose: `asChild` on every paragraph is
     * noise, and a heading is a `Heading`.
     *
     * @default 'p'
     */
    as?: TextElement;
    /** Passed through when `as="label"`. */
    htmlFor?: string;
    /**
     * `xs` 12px legal, timestamps, counters · `sm` 13px dense UI, table
     * cells, help text · `base` 15px the default · `md` 16px long-form
     * reading (handbook, policy) · `lg` 18px a lede under a hero, once.
     *
     * @default 'base'
     */
    size?: TextSize;
    /**
     * What the text is FOR: `primary` the thing itself, `secondary`
     * supporting detail and metadata, `brand` a brand-weighted value inside
     * running text, `disabled` present but not actionable, `link`
     * link-coloured text that is not a link.
     *
     * @default 'primary'
     */
    tone?: TextTone;
  };

export const Text = React.forwardRef<HTMLElement, TextProps>(function Text(
  { className, as: Comp = 'p', tone = 'primary', size = 'base', ...props },
  ref,
) {
  return React.createElement(Comp, {
    ref,
    'data-slot': 'text',
    'data-tone': tone,
    'data-size': size,
    className: cn(textVariants({ tone, size }), className),
    ...props,
  });
});
Text.displayName = 'Text';
