'use client';

// Client: Radix Popover keeps open state, attaches handlers and portals.
import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Popover
 *
 * A small, dismissible panel anchored to its trigger, holding REAL interactive
 * content — a short form, a filter, a summary. Heavier than a Tooltip, lighter
 * than a Dialog, and never the home of a critical or destructive confirmation
 * (a popover can be dismissed by accident).
 *
 *   <Popover>
 *     <PopoverTrigger asChild>
 *       <Button variant="secondary"><Plus weight="bold" /> Invite reviewer</Button>
 *     </PopoverTrigger>
 *     <PopoverContent aria-label="Invite a reviewer to Cohort 7">
 *       ...form...
 *       <PopoverClose asChild><Button size="sm">Send invite</Button></PopoverClose>
 *     </PopoverContent>
 *   </Popover>
 *
 * The preview's contract, paid by Radix:
 *   - Escape and a click outside close it; opening another closes this one.
 *   - Focus is NOT trapped (it is not a modal); Tab can leave the panel.
 *   - `PopoverClose` shuts the panel AND returns focus to the trigger.
 *   - Placement is a decision: the HTML's `.popover--end` is `align="end"`,
 *     `.popover--above` is `side="top"`, `.popover--center` is
 *     `align="center"`. Radix also flips a panel that would leave the viewport.
 *
 * Composable for Combobox / DatePicker: `PopoverAnchor` positions the panel
 * against something other than the trigger (an input group), `padding="none"`
 * lets a listbox or a calendar own its insets, `popoverContentVariants` is the
 * surface recipe on its own, and every Radix Content prop (`onOpenAutoFocus`,
 * `onInteractOutside`, `avoidCollisions`, ...) passes straight through.
 *
 * Theming: the panel portals to <body>; it is themed because `data-brand` /
 * `data-theme` sit on <html> (docs/05 section 3, "Portals").
 * ------------------------------------------------------------------------- */

/* ---- Root / Trigger / Anchor / Close -------------------------------------- */

export type PopoverProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>;

/**
 * The state holder (`open` / `defaultOpen` / `onOpenChange`, `modal`). Renders
 * no DOM of its own. Non-modal by default, as the HTML's popovers are.
 */
export function Popover(props: PopoverProps) {
  return <PopoverPrimitive.Root {...props} />;
}
Popover.displayName = 'Popover';

export type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>;

/**
 * Use with `asChild` and a `Button` / `IconButton`, which keep their own look
 * and `data-slot`; Radix adds `aria-haspopup="dialog"`, `aria-expanded`,
 * `aria-controls` and `data-state`.
 */
export const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  PopoverTriggerProps
>(function PopoverTrigger({ asChild = false, ...props }, ref) {
  return (
    <PopoverPrimitive.Trigger
      ref={ref}
      asChild={asChild}
      // Not under asChild: the slot would overwrite the child's own
      // `data-slot="button"`, which consumers target.
      {...(asChild ? null : { 'data-slot': 'popover-trigger' })}
      {...props}
    />
  );
});
PopoverTrigger.displayName = 'PopoverTrigger';

export type PopoverAnchorProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Anchor>;

/**
 * Positions the panel against this element instead of the trigger — the
 * whole input group of a Combobox or DatePicker, while the trigger is only
 * its button (or the input itself).
 */
export const PopoverAnchor = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Anchor>,
  PopoverAnchorProps
>(function PopoverAnchor({ asChild = false, ...props }, ref) {
  return (
    <PopoverPrimitive.Anchor
      ref={ref}
      asChild={asChild}
      {...(asChild ? null : { 'data-slot': 'popover-anchor' })}
      {...props}
    />
  );
});
PopoverAnchor.displayName = 'PopoverAnchor';

export type PopoverCloseProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Close>;

/**
 * A control inside the panel that finishes with it ("Send invite", "Apply",
 * "Done"): closes the panel and returns focus to the trigger. Leave it off a
 * control that does not finish the task ("Reset" a filter).
 */
export const PopoverClose = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Close>,
  PopoverCloseProps
>(function PopoverClose({ asChild = false, ...props }, ref) {
  return (
    <PopoverPrimitive.Close
      ref={ref}
      asChild={asChild}
      data-popover-close=""
      {...(asChild ? null : { 'data-slot': 'popover-close' })}
      {...props}
    />
  );
});
PopoverClose.displayName = 'PopoverClose';

/* ---- Content -------------------------------------------------------------- */

/**
 * The popover surface (`.popover`): raised fill, hairline raised border,
 * radius-xl, the raised shadow; 240px minimum. Shared by HoverCard, and
 * available to an organism that draws the same panel without Radix Popover.
 */
export const popoverContentVariants = cva(
  [
    'z-popover min-w-[240px]',
    // The HTML's panel shrink-wraps inside its trigger's wrap, so a help line
    // wraps at about this width instead of stretching the panel.
    'max-w-[min(320px,var(--radix-popover-content-available-width))]',
    'rounded-xl border border-border-raised bg-surface-raised text-content shadow-raised',
    'font-sans outline-none',
    // Entrance only (Radix unmounts on close), as Menu does. `@starting-style`:
    // no keyframes; below Chrome 117 / Safari 17.5 the panel just appears.
    'transition-[opacity,translate] duration-[var(--motion-duration-normal)] ease-productive-entrance',
    'starting:opacity-0',
    'data-[side=bottom]:starting:-translate-y-1 data-[side=top]:starting:translate-y-1',
    'data-[side=left]:starting:translate-x-1 data-[side=right]:starting:-translate-x-1',
    'motion-reduce:transition-none',
  ],
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-1',
        md: 'p-4',
      },
    },
    defaultVariants: { padding: 'md' },
  },
);

/** String union, so a Storyblok option value can be passed straight in. */
export type PopoverPadding = 'none' | 'sm' | 'md';
/** The side of the trigger the panel opens on. */
export type PopoverSide = 'top' | 'right' | 'bottom' | 'left';
/** How the panel lines up with the trigger along that side. */
export type PopoverAlign = 'start' | 'center' | 'end';

export type PopoverContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
  'side' | 'align'
> & {
  /**
   * The side of the trigger the panel opens on. `top` is the HTML's
   * `.popover--above`, for a trigger low in the viewport or in a sticky
   * footer. Radix flips it when there is no room.
   *
   * @default 'bottom'
   */
  side?: PopoverSide;
  /**
   * Alignment against the trigger. `start` anchors the leading edge (the
   * HTML's default); `end` is `.popover--end`, for a trigger at the trailing
   * edge of a row or toolbar; `center` is `.popover--center`.
   *
   * @default 'start'
   */
  align?: PopoverAlign;
  /**
   * Gap between the trigger and the panel, in px.
   *
   * @default 6
   */
  sideOffset?: number;
  /**
   * Inner padding. `md` (16px) for a form, filter or summary; `sm` (4px) for
   * a list of rows that carry their own inset; `none` for a calendar or a
   * listbox that owns its layout.
   *
   * @default 'md'
   */
  padding?: PopoverPadding;
  /**
   * Where the portal mounts. Defaults to `document.body`, which is themed by
   * the `data-brand` / `data-theme` attributes on `<html>`.
   */
  container?: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Portal>['container'];
};

/**
 * The panel (`role="dialog"`). Name it with `aria-label` ("Invite a reviewer
 * to Cohort 7") or `aria-labelledby` a heading inside.
 */
export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(function PopoverContent(
  { className, side = 'bottom', align = 'start', sideOffset = 6, padding = 'md', container, ...props },
  ref,
) {
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        data-padding={padding}
        // The Button `neutral` contract: a raised surface flips its hover.
        data-elevation="raised"
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(
          popoverContentVariants({ padding }),
          // Never taller than the room Radix measured between the trigger and
          // the viewport edge (less the 8px collision padding): a form or a
          // calendar in a landscape phone scrolls inside the panel instead of
          // running off the screen.
          'max-h-[var(--radix-popover-content-available-height)] overflow-y-auto overscroll-contain',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = 'PopoverContent';
