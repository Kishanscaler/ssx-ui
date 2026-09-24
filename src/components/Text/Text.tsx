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
 * On a coloured fill, each tone switches to that fill's ink by itself: the
 * region declares `data-surface-ink="on-image"` (a media Card's content, see
 * `src/lib/surface-ink.ts`) and Text's own recipe picks the colour. Nothing
 * outside Text re-points its roles.
 *
 * Server atom: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

export const textVariants = cva(
  // Each size is a `type-*` role (theme.css), so size, leading and tracking
  // come from one composite token and step at `sm` where the role does. The
  // running-text roles leave weight alone: Text inherits it.
  // `overflow-wrap: anywhere`: a long unbroken word (a URL, an email, an
  // order id) breaks instead of overflowing a narrow screen, and does not set
  // the min-content width of a flex or grid item the text sits in.
  //
  // Inside a disabled control (a disabled ClickableCard, a disabled
  // fieldset), every tone reads as disabled. The control only disables
  // itself; the text decides what that means for text.
  ['font-sans [overflow-wrap:anywhere]', 'in-disabled:text-content-disabled'],
  {
    variants: {
      // Each tone also names its ink on a coloured fill (the surface-ink
      // contract, `src/lib/surface-ink.ts`): the fill's section says which fill
      // it is with `data-surface-ink`, and Text picks its own colour for it.
      // `brand` on a fill is the ink: over a photograph the ink is the
      // loudest legible value, and a brand hue is not gated there.
      tone: {
        primary: [
          'text-content',
          'in-data-[surface-ink=on-image]:text-on-image-ink',
        ],
        secondary: [
          'text-content-secondary',
          'in-data-[surface-ink=on-image]:text-on-image-ink-secondary',
        ],
        brand: [
          'text-content-brand',
          'in-data-[surface-ink=on-image]:text-on-image-ink',
        ],
        // Present but not actionable. Also what every tone becomes inside a
        // disabled control (the `in-disabled:` rule in the base).
        disabled: 'text-content-disabled',
        // Link-coloured text that is NOT a link — a highlighted figure. If it
        // is clickable it is a `Link`, underline and all.
        link: [
          'text-content-link',
          'in-data-[surface-ink=on-image]:text-on-image-link',
        ],
      },
      size: {
        // caption role, 12px: the floor. Fine print lives here.
        xs: 'type-caption',
        // body-sm role, 13px: supporting and help text.
        sm: 'type-body-sm',
        // body role, 16px at every width.
        base: 'type-body',
        // Long-form reading. The body role: 16px, like `base` (kept as its own
        // value so a CMS field that stores `md` keeps working).
        md: 'type-body',
        // body-lg role: the lede. 16px on phones, 18px from `sm`.
        lg: 'type-body-lg',
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
     * Each size is a type role (`type-*` in theme.css):
     * `xs` caption, 12px: fine print (disclaimers, legal lines, T&C),
     * timestamps, counters. **The floor**: nothing people must read goes
     * under 12px, so there is no 10px size · `sm` body-sm, 13px: dense UI,
     * table cells, help text · `base` body, 16px at every width: the default ·
     * `md` the same body role, for long-form reading (handbook, policy) · `lg`
     * body-lg, a lede under a hero, once: 16px on phones, 18px from `sm`.
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
