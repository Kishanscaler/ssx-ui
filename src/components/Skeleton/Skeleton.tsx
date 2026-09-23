import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Skeleton
 *
 * Skeleton when you know the SHAPE, Spinner when you know only the wait. A
 * skeleton is a promise about the layout that is coming, so a mismatched one
 * is worse than none: the page settles, then jumps. Never skeleton a list
 * whose length you cannot predict.
 *
 * Shapes: `text` (a 12px body line), `title` (a 20px heading line), `circle`
 * (sized to match Avatar sm / md / lg: 28 / 40 / 48), and `block`, which takes
 * its whole box from `className` (a 16:9 thumbnail: `aspect-video w-full`).
 * Width is `className` too (`w-1/2`); lines default to full width.
 *
 * Announce the wait, not the bones: every skeleton is `aria-hidden`, and the
 * CONTAINER carries `aria-busy="true"` plus a visually hidden "Loading…".
 * Under reduced motion the shimmer stops and the shape stays.
 *
 * Server atom: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

export const skeletonVariants = cva(
  [
    'relative block shrink-0 overflow-hidden rounded-sm bg-surface-active',
    // The shimmer: a pale band travelling across. A pseudo-element, so no
    // extra DOM; the keyframes live in theme.css with the animate utility.
    "after:absolute after:inset-0 after:content-['']",
    'after:bg-linear-to-r after:from-transparent after:via-surface-hover after:to-transparent',
    'after:animate-ssx-shimmer motion-reduce:after:hidden',
  ],
  {
    variants: {
      shape: {
        text: 'h-3 w-full',
        title: 'h-5 w-full',
        circle: 'rounded-full',
        block: '',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    compoundVariants: [
      { shape: 'circle', size: 'sm', className: 'size-7' },
      { shape: 'circle', size: 'md', className: 'size-control-md' },
      { shape: 'circle', size: 'lg', className: 'size-control-lg' },
    ],
    defaultVariants: { shape: 'text', size: 'md' },
  },
);

type SkeletonVariantProps = VariantProps<typeof skeletonVariants>;

export type SkeletonShape = NonNullable<SkeletonVariantProps['shape']>;
export type SkeletonSize = NonNullable<SkeletonVariantProps['size']>;

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> &
  SkeletonVariantProps & {
    /**
     * `text` 12px line · `title` 20px line · `circle` an avatar stand-in ·
     * `block` any box, sized by `className`.
     *
     * @default 'text'
     */
    shape?: SkeletonShape;
    /**
     * Circle only: 28 / 40 / 48px, matching Avatar `sm` / `md` / `lg`.
     *
     * @default 'md'
     */
    size?: SkeletonSize;
  };

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className, shape = 'text', size = 'md', ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="skeleton"
      data-shape={shape}
      data-size={shape === 'circle' ? size : undefined}
      aria-hidden="true"
      className={cn(skeletonVariants({ shape, size }), className)}
      {...props}
    />
  );
});
Skeleton.displayName = 'Skeleton';
