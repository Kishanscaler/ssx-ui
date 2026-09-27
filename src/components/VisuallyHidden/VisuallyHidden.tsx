import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * VisuallyHidden
 *
 * Content for assistive technology only: read by a screen reader, in the
 * accessibility tree and the find-in-page text, but drawn nowhere (Tailwind's
 * `sr-only`: a 1px clipped box, so it takes no space). Use it for the words a
 * sighted reader gets from the layout: "(opens in a new tab)", the heading of
 * a region whose purpose is obvious on screen, the "Stop generating" state
 * behind a square glyph.
 *
 *   <Button><Trash /><VisuallyHidden>Delete assignment-3.pdf</VisuallyHidden></Button>
 *   <VisuallyHidden asChild><h2>Conversation</h2></VisuallyHidden>
 *
 * Not this:
 *   - an icon-only control's name. That is `aria-label` (IconButton requires
 *     it), which does not leave hidden text in the copy-paste stream;
 *   - hiding something from EVERYONE. That is the `hidden` attribute;
 *   - hiding decoration from assistive tech. That is `aria-hidden`.
 *
 * `focusable` is for a skip link: hidden until it takes keyboard focus, then
 * drawn where it is.
 *
 * Server atom: no hooks, no handlers, so no directive.
 * ------------------------------------------------------------------------- */

export type VisuallyHiddenProps = React.HTMLAttributes<HTMLSpanElement> & {
  /**
   * Render as the child element (a heading, a label, a link) instead of a
   * `<span>`, keeping the hiding: `<VisuallyHidden asChild><h2>Chat</h2></VisuallyHidden>`.
   *
   * @default false
   */
  asChild?: boolean;
  /**
   * Show the content while it (or something inside it) has focus: the skip
   * link pattern. Only useful around a focusable element.
   *
   * @default false
   */
  focusable?: boolean;
};

export const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(function VisuallyHidden(
  { className, asChild = false, focusable = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'span';
  return (
    <Comp
      ref={ref}
      data-slot="visually-hidden"
      data-focusable={focusable ? '' : undefined}
      className={cn('sr-only', focusable && 'focus-within:not-sr-only focus:not-sr-only', className)}
      {...props}
    />
  );
});
VisuallyHidden.displayName = 'VisuallyHidden';
