import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Badge
 *
 * Passive metadata: a badge REPORTS a fact about the thing it sits on and is
 * never clickable — so there is no `asChild`, no hover and no focus state.
 * Chip is the interactive one (it filters, selects, dismisses). Two names for
 * two behaviours; there is no Tag and no Pill.
 *
 * `highlight` is the only badge allowed to shout (the bright yellow at full
 * strength), and it is capped at one per screen. It says "look here first",
 * never "something is wrong" — that is `warning`. `yellowSubtle` is the yellow
 * that can sit in a list beside other badges.
 *
 * Colour is never the message: every badge must still read with the colour
 * removed, because the word carries the meaning.
 *
 * Icons are children, sized 16px by the badge; use Phosphor's bold weight.
 * Inside a `sm` control use `size="sm"` — a badge inside a control is a count.
 *
 * Server atom: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

export const badgeVariants = cva(
  [
    'inline-flex shrink-0 items-center gap-1 rounded-md whitespace-nowrap',
    'font-sans font-semibold leading-none',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-sm",
  ],
  {
    variants: {
      tone: {
        default: 'bg-surface-active text-content-secondary',
        brand: 'bg-surface-brand-subtle text-content-brand',
        accent: 'bg-brand-tint-surface text-brand-tint-content',
        highlight: 'bg-accent1 text-accent1-on-solid',
        yellowSubtle: 'bg-accent1-surface text-accent1-content shadow-[inset_0_0_0_1px_var(--accent1-border)]',
        success: 'bg-success-surface text-success-content',
        warning: 'bg-warning-surface text-warning-content',
        danger: 'bg-danger-surface text-danger-content',
        info: 'bg-info-surface text-info-content',
        solid: 'bg-action-primary text-action-primary-fg',
      },
      size: {
        // 18 / 22 / 26px. No control-height token is this small: a badge sits
        // INSIDE the cap height of the label it follows, so these are the
        // HTML's own values. 10px has no font-size token either (`xs` is 12).
        sm: 'h-[1.125rem] px-1.5 text-[0.625rem]',
        md: 'h-[1.375rem] px-2 text-xs',
        lg: 'h-[1.625rem] px-3 text-sm',
      },
    },
    defaultVariants: { tone: 'default', size: 'md' },
  },
);

type BadgeVariantProps = VariantProps<typeof badgeVariants>;

export type BadgeTone = NonNullable<BadgeVariantProps['tone']>;
export type BadgeSize = NonNullable<BadgeVariantProps['size']>;

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  BadgeVariantProps & {
    /**
     * `default` neutral · `brand` · `accent` the brand tint · `highlight` the
     * one loud badge per screen · `yellowSubtle` · `success` · `warning` ·
     * `danger` · `info` · `solid` the primary fill.
     *
     * @default 'default'
     */
    tone?: BadgeTone;
    /**
     * 18 / 22 / 26px. `sm` inside a `sm` button or toolbar; `lg` in a card
     * header where 22px looks lost. Above 26px it is a Stat, not a Badge.
     *
     * @default 'md'
     */
    size?: BadgeSize;
    /**
     * A leading dot in the badge's own ink (`currentColor`), for a live or
     * continuous state. Decorative: the word still carries the meaning.
     *
     * @default false
     */
    dot?: boolean;
  };

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, tone = 'default', size = 'md', dot = false, children, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      data-slot="badge"
      data-tone={tone}
      data-size={size}
      data-dot={dot || undefined}
      className={cn(badgeVariants({ tone, size }), className)}
      {...props}
    >
      {dot ? (
        <span
          data-slot="badge-dot"
          aria-hidden="true"
          className="inline-block size-2 shrink-0 rounded-full bg-current"
        />
      ) : null}
      {children}
    </span>
  );
});
Badge.displayName = 'Badge';
