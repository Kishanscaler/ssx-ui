import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * StatusDot
 *
 * An 8px presence marker that ALWAYS travels with a visible text label. On
 * its own it is decoration only sighted, colour-discriminating users can read,
 * so it is `aria-hidden` and the adjacent words carry the meaning. If you want
 * a dot with no text, you want a Badge.
 *
 * `brand` is a SELECTION colour ("the cohort you are looking at"), not a
 * status: a green dot beside a cohort claims it is healthy. Reserve the status
 * tones for state and use brand for currency.
 *
 * `pulse` is for genuinely live state only (a class in progress): the dot
 * itself scales gently and a ring of the same tone grows past it (1x to
 * 2.5x) while fading to nothing, looping. It stops — a plain, static dot —
 * under `prefers-reduced-motion` or an ancestor `data-motion="reduce"`.
 *
 * Server atom: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

export const statusDotVariants = cva('inline-block shrink-0 rounded-full', {
  variants: {
    tone: {
      neutral: 'bg-content-secondary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      info: 'bg-info',
      brand: 'bg-content-brand',
    },
    size: {
      md: 'size-2',
      lg: 'size-2.5',
    },
    // The animation itself lives in `components.css` (`[data-pulse]`, keyed
    // off the `data-pulse` attribute below): a gentle scale on the dot plus a
    // ring layer that grows past it and fades, which a single `animate-*`
    // utility cannot express — `components.css` is where a loop that needs a
    // second layer (a `::before`) has to live. `relative` + `isolation` here
    // are what let that ring sit BEHIND the dot's own paint (a negative
    // `z-index` only stacks within a context the element establishes).
    pulse: {
      true: 'relative isolate',
      false: '',
    },
  },
  defaultVariants: { tone: 'neutral', size: 'md', pulse: false },
});

type StatusDotVariantProps = VariantProps<typeof statusDotVariants>;

export type StatusDotTone = NonNullable<StatusDotVariantProps['tone']>;
export type StatusDotSize = NonNullable<StatusDotVariantProps['size']>;

export type StatusDotProps = React.HTMLAttributes<HTMLSpanElement> &
  Omit<StatusDotVariantProps, 'pulse'> & {
    /**
     * `neutral` inactive · `success` · `warning` · `danger` · `info` ·
     * `brand` current/selected (not healthy).
     *
     * @default 'neutral'
     */
    tone?: StatusDotTone;
    /**
     * 8px beside body text; 10px beside a heading or on a large avatar.
     *
     * @default 'md'
     */
    size?: StatusDotSize;
    /**
     * A slow pulse, for live state only: the dot scales gently and a ring of
     * the same tone grows past it and fades. Static under reduced motion.
     *
     * @default false
     */
    pulse?: boolean;
  };

export const StatusDot = React.forwardRef<HTMLSpanElement, StatusDotProps>(function StatusDot(
  { className, tone = 'neutral', size = 'md', pulse = false, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      data-slot="status-dot"
      data-tone={tone}
      data-size={size}
      data-pulse={pulse || undefined}
      aria-hidden="true"
      className={cn(statusDotVariants({ tone, size, pulse }), className)}
      {...props}
    />
  );
});
StatusDot.displayName = 'StatusDot';
