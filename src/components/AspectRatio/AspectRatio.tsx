import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * AspectRatio · AspectRatioFill
 *
 * Reserves the exact box a piece of media will occupy BEFORE it has loaded,
 * so the browser paints the final geometry on the first frame and the only
 * thing that changes when the file lands is the pixels inside. An <img> with
 * no reserved box is 0px tall until its bytes arrive, then shoves everything
 * below it down the page: on a dashboard of six lecture thumbnails, six jumps,
 * and a student reaching for "Submit" taps "Withdraw".
 *
 *   <AspectRatio ratio="16:9"><img src=... alt=... /></AspectRatio>
 *   <AspectRatio ratio="4:3"><AspectRatioFill><Spinner /></AspectRatioFill></AspectRatio>
 *
 * SIX RATIOS, and that is the whole set: 16:9 video · 4:3 slides · 1:1 avatars
 * and tiles · 3:2 photography · 21:9 marketing hero · 9:16 vertical reels. A
 * seventh is a conversation, not a prop value.
 *
 * An <img>, <video> or <iframe> placed DIRECTLY inside fills the box and is
 * `object-fit: cover`, so a portrait photo in a 16:9 slot crops rather than
 * letterboxes (the preview listed img and video; iframe is added for embeds,
 * which the preview names as a use). Anything else goes in `AspectRatioFill`,
 * which stretches over the box and centres its content: a skeleton, a
 * spinner, an "Unavailable" state, all in the same footprint.
 *
 * The box is sunken with the large radius, as in the preview, so an empty or
 * loading slot still reads as a slot. `className="rounded-none"` for an edge
 * to edge band. A Card's own media slot already has a ratio: use this for
 * media that is NOT a card's media (inline diagrams, embeds, chart canvases).
 *
 * Polymorphism: `as` or `asChild`, the same rule as Stack. Server components.
 * ------------------------------------------------------------------------- */

export const aspectRatioVariants = cva(
  [
    'relative block min-w-0 overflow-hidden rounded-lg bg-surface-sunken',
    '[&>img]:absolute [&>img]:inset-0 [&>img]:size-full [&>img]:object-cover',
    '[&>video]:absolute [&>video]:inset-0 [&>video]:size-full [&>video]:object-cover',
    '[&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:size-full [&>iframe]:border-0',
  ],
  {
    variants: {
      ratio: {
        '16:9': 'aspect-video',
        '4:3': 'aspect-[4/3]',
        '1:1': 'aspect-square',
        '3:2': 'aspect-[3/2]',
        '21:9': 'aspect-[21/9]',
        '9:16': 'aspect-[9/16]',
      },
    },
    defaultVariants: { ratio: '16:9' },
  },
);

export const aspectRatioFillVariants = cva(
  'absolute inset-0 grid min-h-0 content-center justify-items-center overflow-hidden',
);

/** The six sanctioned ratios, width:height. */
export type AspectRatioRatio = '16:9' | '4:3' | '1:1' | '3:2' | '21:9' | '9:16';
/** The elements an AspectRatio may render as without `asChild`. */
export type AspectRatioElement = 'div' | 'li' | 'span';

export type AspectRatioProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * Width to height. `16:9` video and lecture capture · `4:3` slides and
   * screenshots · `1:1` avatars and tiles · `3:2` photography · `21:9` the
   * marketing hero band · `9:16` vertical reels.
   *
   * @default '16:9'
   */
  ratio?: AspectRatioRatio;
  /**
   * The element to render. Ignored with `asChild`.
   *
   * @default 'div'
   */
  as?: AspectRatioElement;
  /**
   * Merge the box onto its single child instead of rendering an element (an
   * `<a>` that is a thumbnail link). The media then goes inside that child.
   *
   * @default false
   */
  asChild?: boolean;
};

export type AspectRatioFillProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Merge the fill onto its single child instead of rendering a `<div>`.
   *
   * @default false
   */
  asChild?: boolean;
};

export const AspectRatio = React.forwardRef<HTMLElement, AspectRatioProps>(function AspectRatio(
  { className, ratio = '16:9', as = 'div', asChild = false, ...props },
  ref,
) {
  const Comp: React.ElementType = asChild ? Slot : as;
  return (
    <Comp
      ref={ref}
      data-slot="aspect-ratio"
      data-ratio={ratio}
      className={cn(aspectRatioVariants({ ratio }), className)}
      {...props}
    />
  );
});
AspectRatio.displayName = 'AspectRatio';

export const AspectRatioFill = React.forwardRef<HTMLDivElement, AspectRatioFillProps>(function AspectRatioFill(
  { className, asChild = false, ...props },
  ref,
) {
  const Comp: React.ElementType = asChild ? Slot : 'div';
  return (
    <Comp ref={ref} data-slot="aspect-ratio-fill" className={cn(aspectRatioFillVariants(), className)} {...props} />
  );
});
AspectRatioFill.displayName = 'AspectRatioFill';
