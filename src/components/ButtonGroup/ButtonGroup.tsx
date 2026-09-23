import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * ButtonGroup
 *
 * Two to five related actions welded into one control, sharing a single border
 * seam. For actions on the SAME object ("Preview", "Download"). Never mix a
 * destructive action with safe ones: "Delete cohort" one pixel from
 * "Duplicate" is a trap.
 *
 * The members are ordinary `Button` / `IconButton` / `ToggleButton` atoms; the
 * group only welds them: square inner corners, a shared 1px seam (each member
 * after the first overlaps the previous one by the border width), and the
 * member that is hovered, focused or pressed is lifted above its neighbours so
 * its border and focus ring are drawn whole. Button already cancels its 2px
 * hover lift inside `[data-slot=button-group]`, because a segment rising out
 * of the row tears the group apart.
 *
 * A pressed member (one of a set, "Percent / Letter grade / Percentile") is a
 * `ToggleButton`, which owns the pressed look. This is not a
 * ToggleButtonGroup: single-selection semantics (arrow keys, exactly one on)
 * are the caller's, or a Segmented Control's.
 *
 * `role="group"` is always rendered. Give it an `aria-label` (or
 * `aria-labelledby`) so a screen reader announces "Grade view, group" before
 * the members; without a name they arrive as unrelated buttons.
 *
 * Server atom: no hooks and no handlers of its own.
 * ------------------------------------------------------------------------- */

/**
 * The edge fade for a horizontal scroller. It keys off the `data-overflow*`
 * attributes `useScrollEdges` writes, and fades only the side that hides
 * something (24px). Without those attributes (a server-rendered ButtonGroup,
 * JS off) it draws nothing. Shared by the weld, SegmentedControl and Tabs.
 */
export const scrollFadeClass = [
  '[--ssx-fade-s:0px] [--ssx-fade-e:0px]',
  'data-[overflow-start]:[--ssx-fade-s:24px] data-[overflow-end]:[--ssx-fade-e:24px]',
  'data-[overflow]:[mask-image:linear-gradient(to_right,transparent,#000_var(--ssx-fade-s),#000_calc(100%-var(--ssx-fade-e)),transparent)]',
  'rtl:data-[overflow]:[mask-image:linear-gradient(to_left,transparent,#000_var(--ssx-fade-s),#000_calc(100%-var(--ssx-fade-e)),transparent)]',
].join(' ');

export const buttonGroupVariants = cva(
  [
    'isolate inline-flex w-fit items-stretch',
    // Never wider than its container. A weld cannot wrap (a second row has
    // no seam to share), so when the members do not fit, the group scrolls
    // sideways inside itself instead of pushing the page wide: members keep
    // their size, snap to their start edge, and the scrollbar stays thin
    // (hidden on touch, where it is an overlay anyway). The clipped member at
    // the edge is the cue; `scrollFadeClass` adds a fade where a client
    // component measures it (ToggleButtonGroup welded).
    'max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain snap-x snap-mandatory',
    // A scroller also clips the members' touch hit areas (Button's 44px
    // ::before on a coarse pointer). 6px of padding above and below, taken
    // back by a negative margin so the layout does not move, leaves them room.
    'pointer-coarse:-my-[6px] pointer-coarse:py-[6px]',
    '[scrollbar-width:thin] pointer-coarse:[scrollbar-width:none] pointer-coarse:[&::-webkit-scrollbar]:hidden',
    '[&>*]:shrink-0 [&>*]:snap-start',
    // A scroller clips anything drawn outside it, so the members' 3px focus
    // ring is drawn inside them (the same choice as the Tabs list).
    '[&>*]:ring-inset',
    scrollFadeClass,
    // The weld. `rounded-none` beats the member's `rounded-md` because a
    // parent-arbitrary variant sorts after plain utilities.
    '[&>*]:rounded-none',
    '[&>*:first-child]:rounded-s-md [&>*:last-child]:rounded-e-md',
    '[&>*:not(:first-child)]:-ms-px',
    // The member under the pointer, the focused member and a pressed member
    // are drawn above their neighbours, so their border and ring are whole.
    // Hover goes through Tailwind's `hover:` (only on devices that can hover),
    // so a tap on a phone does not leave a member lifted.
    '[&>*]:hover:z-raised [&>*:focus-visible]:z-raised [&>[aria-pressed=true]]:z-raised',
    '[&>[data-state=on]]:z-raised',
  ],
);

export type ButtonGroupProps = React.ComponentPropsWithoutRef<'div'> & {
  /**
   * What the group is for, announced before its members ("Grade view").
   * Required in practice; use `aria-labelledby` instead when a visible
   * heading already names it.
   */
  'aria-label'?: string;
};

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { className, role = 'group', ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role={role}
      data-slot="button-group"
      className={cn(buttonGroupVariants(), className)}
      {...props}
    />
  );
});
ButtonGroup.displayName = 'ButtonGroup';
