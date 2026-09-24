import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Heading
 *
 * Level is not size. `as` (h1–h6) is the document outline and is REQUIRED, so
 * the outline is always a conscious choice; `size` is the visual rank. Choose
 * the level for the outline and the size for the look, and never skip a level
 * to get a smaller font.
 *
 * Four sizes plus an eyebrow, each one `type-*` role utility over one
 * composite type token (`--type-h1-size` / `-lh` / `-tracking` / `-weight`),
 * so size and leading step together at the breakpoint. There is no size 4: below 18px a
 * heading reads as bold body copy. `display` is once per page, hero only.
 *
 * The eyebrow is the kicker line above a title. It usually must NOT be in the
 * outline, which is why `as="p"` is allowed for it.
 *
 * The SSB/SST "rule-marked section" (`ruleBlock`) is a molecule, not this.
 *
 * Server atom: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

// `overflow-wrap: anywhere`: a long unbroken word (a URL, an email, a German
// compound, a cohort code) breaks rather than pushing a phone layout wide.
// `anywhere`, not `break-word`, so the word also stops setting the
// min-content width of a flex or grid item the heading sits in.
export const headingVariants = cva('m-0 font-sans [overflow-wrap:anywhere]', {
  variants: {
    size: {
      // The `type-*` role utilities (theme.css): size, leading, tracking and
      // weight as one matched set, stepping at `sm`. The eyebrow role also
      // uppercases and carries the 0.08em tracking.
      eyebrow: 'type-eyebrow text-content-secondary',
      display: 'type-display',
      '1': 'type-h1',
      '2': 'type-h2',
      '3': 'type-h3',
    },
  },
  defaultVariants: { size: '2' },
});

export type HeadingSize = NonNullable<VariantProps<typeof headingVariants>['size']>;
/** h1–h6, plus `p` for an eyebrow that must stay out of the outline. */
export type HeadingElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';

const SIZE_FOR_LEVEL: Record<HeadingElement, HeadingSize> = {
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '3',
  h5: '3',
  h6: '3',
  p: 'eyebrow',
};

export type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  /**
   * The outline level. Required: the outline is a decision, not a default.
   * `p` only for an eyebrow line.
   */
  as: HeadingElement;
  /**
   * The visual rank, independent of `as`. `eyebrow` 12px caps tracked ·
   * `display` 36px, one per page · `1` page title · `2` section · `3` card
   * and panel titles.
   *
   * @default derived from `as`: h1 → '1', h2 → '2', h3–h6 → '3', p → 'eyebrow'
   */
  size?: HeadingSize;
};

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { className, as: Comp, size, ...props },
  ref,
) {
  const resolved = size ?? SIZE_FOR_LEVEL[Comp] ?? '2';
  return React.createElement(Comp, {
    ref,
    'data-slot': 'heading',
    'data-size': resolved,
    className: cn(headingVariants({ size: resolved }), className),
    ...props,
  });
});
Heading.displayName = 'Heading';
