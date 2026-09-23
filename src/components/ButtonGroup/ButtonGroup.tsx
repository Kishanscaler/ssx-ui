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

export const buttonGroupVariants = cva(
  [
    'isolate inline-flex w-fit items-stretch',
    // The weld. `rounded-none` beats the member's `rounded-md` because a
    // parent-arbitrary variant sorts after plain utilities.
    '[&>*]:rounded-none',
    '[&>*:first-child]:rounded-s-md [&>*:last-child]:rounded-e-md',
    '[&>*:not(:first-child)]:-ms-px',
    // The member under the pointer, the focused member and a pressed member
    // are drawn above their neighbours, so their border and ring are whole.
    '[&>*:hover]:z-raised [&>*:focus-visible]:z-raised [&>[aria-pressed=true]]:z-raised',
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
