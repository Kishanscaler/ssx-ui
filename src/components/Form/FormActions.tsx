import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * FormActions
 *
 * The submit / cancel row at the end of a form. Server: layout only.
 *
 * ORDER: the safe answer first, the committing action LAST, in the markup
 * and on screen, everywhere — the same rule as DialogFooter and
 * SideDrawerFooter:
 *
 *   <FormActions>
 *     <Button variant="secondary">Save draft</Button>
 *     <Button type="submit">Submit application</Button>
 *   </FormActions>
 *
 * From `sm` (672px) the row is right-aligned, so the primary sits at the
 * trailing edge where the eye finishes the form. On a phone the buttons
 * stack, full width, primary at the BOTTOM: nearest the thumb and the
 * keyboard, and the visual order is still the reading and tab order (a
 * `flex-col-reverse` would put primary on top but make Tab walk upward).
 *
 * `sticky` pins the row to the bottom of the viewport (or the nearest
 * scroll container) while the form is on screen, for a long form whose
 * submit would otherwise be a scroll away. It takes the page background
 * (`bg-page`; pass a `className` inside a raised card), a top hairline, and the home-indicator inset (`env(safe-area-inset-bottom)`;
 * needs `viewport-fit=cover` in the viewport meta to be non-zero). On a phone
 * a sticky row keeps the buttons side by side, sharing the width, so the
 * bar stays one control tall. It is `position: sticky`, not fixed: it never
 * covers the last field, and it stops at the end of the form.
 *
 * FLUSH, NOT FLOATING (2026-09-27). A sticky element stops at its scroll
 * container's PADDING edge, so inside a padded scroller (every Drawer,
 * Dialog and BottomSheet body pads itself) the bar hung 20px above the
 * bottom with the form scrolling visibly under it, and stopped short of the
 * sides. The scroll-pad contract fixes it: a padded scroll container states
 * its own padding as `--scroll-pad-x` / `--scroll-pad-bottom` (SideDrawer,
 * Dialog and BottomSheet bodies and the AppShell content well do), and the
 * bar reaches through it: `bottom` goes negative by the bottom padding, so
 * it sticks to the VISIBLE bottom edge; a negative inline margin takes it to
 * the visible sides, and padding by the same amount keeps the buttons
 * aligned with the content; as the last thing in its form, a negative
 * bottom margin takes up the bottom padding, so it is flush at the end of
 * the scroll too. A container with no padding needs nothing
 * (both default to 0). Your own padded scroller: set the two properties to
 * its padding.
 * ------------------------------------------------------------------------- */

export const formActionsVariants = cva('flex gap-2 font-sans', {
  variants: {
    sticky: {
      false: [
        'flex-col [&>*]:w-full',
        'sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:[&>*]:w-auto',
      ],
      true: [
        'sticky bottom-[calc(-1*var(--scroll-pad-bottom,0px))] z-sticky flex-row flex-wrap items-center justify-end',
        '-mx-[var(--scroll-pad-x,0px)] px-[var(--scroll-pad-x,0px)]',
        // The last thing in its form: take the container's bottom padding
        // too, so at the end of the scroll the bar still meets the bottom
        // edge instead of resting on 20px of padding. (Its margin box then
        // still ends inside the form, so sticking is unaffected.)
        'last:-mb-[var(--scroll-pad-bottom,0px)]',
        'border-t border-border-decorative bg-page',
        'pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]',
        '[&>*]:min-w-0 [&>*]:flex-1 sm:[&>*]:flex-none',
      ],
    },
  },
  defaultVariants: { sticky: false },
});

export type FormActionsProps = React.ComponentPropsWithoutRef<'div'> & {
  /**
   * Pin the row to the bottom of the viewport / scroll container while the
   * form is in view, with a top border and the safe-area inset.
   *
   * @default false
   */
  sticky?: boolean;
};

export const FormActions = React.forwardRef<HTMLDivElement, FormActionsProps>(function FormActions(
  { className, sticky = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="form-actions"
      data-sticky={sticky || undefined}
      className={cn(formActionsVariants({ sticky }), className)}
      {...props}
    />
  );
});
FormActions.displayName = 'FormActions';
