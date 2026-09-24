'use client';

// Client: Radix Tooltip keeps open state, times the delays and portals.
import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Tooltip
 *
 * A short label that names or clarifies a control, on hover AND on keyboard
 * focus. Never put information here that lives nowhere else: a tooltip is
 * invisible to touch users, to anyone scanning quickly, and to print. Label an
 * icon button; do not explain a policy.
 *
 *   <Tooltip>
 *     <TooltipTrigger asChild>
 *       <IconButton variant="secondary" aria-label="Download cohort roster">
 *         <DownloadSimple />
 *       </IconButton>
 *     </TooltipTrigger>
 *     <TooltipContent>Download roster (.csv)</TooltipContent>
 *   </Tooltip>
 *
 * Provider. Radix wants one `TooltipProvider` above every tooltip so moving
 * from one trigger to the next skips the open delay. Put one near the app
 * root; a `Tooltip` rendered without one wraps ITSELF in a provider with the
 * same defaults, so a lone tooltip (a CMS blok, a story) still works.
 *
 * Timing. The HTML reveals on `:hover` / `:focus-within` with a
 * `--motion-duration-fast` fade. Keyboard focus opens at once, as there; a
 * pointer waits `delayDuration` (300ms) first, so a cursor crossing a toolbar
 * does not fire a bubble at every button. There is no delay token; 300ms sits
 * under the HoverCard's 400ms open intent, because a label is cheaper to show.
 *
 * DISABLED CONTROLS. A `disabled` button takes no focus and fires no pointer
 * events, so its tooltip — the one explaining WHY — is unreachable. Wrap it
 * in a focusable span, which takes the focus, the hover and the description
 * (the HTML's "Publish results · Locked until moderation closes"):
 *   <TooltipTrigger asChild>
 *     <span tabIndex={0} className="inline-flex rounded-md"><Button disabled>Publish results</Button></span>
 *   </TooltipTrigger>
 * (`aria-disabled="true"` on our `Button` keeps it focusable, so the keyboard
 * reaches the tooltip, but Button also drops its pointer events and keeps its
 * enabled look — use the wrapper when the control must LOOK disabled.)
 *
 * TOUCH. There is no hover on a phone, and iOS does not focus a button on
 * tap, so a touch user may never see the bubble (Android and a paired
 * keyboard do open it, through focus). That is by design, and it is why the
 * rule above is strict: the tooltip is supplementary. The trigger carries its
 * own accessible name (`aria-label` on an IconButton), so a screen reader on
 * a phone still gets the name, and the tooltip text as a description when
 * VoiceOver / TalkBack focus opens it. Anything a touch user needs belongs in
 * visible text, a HoverCard with a tap path, or a Popover.
 *
 * Accessibility: Radix gives the trigger `aria-describedby` a hidden
 * `role="tooltip"` copy of the text while it is open, so an icon button keeps
 * its `aria-label` as its name and the tooltip is read as its description.
 *
 * Theming: the bubble portals to <body>; it is themed because `data-brand` /
 * `data-theme` sit on <html> (docs/05 section 3, "Portals").
 * ------------------------------------------------------------------------- */

/** Pointer open delay, ms (keyboard focus opens at once). */
const DELAY_DURATION = 300;
/** Moving to another trigger within this window opens it without the delay. */
const SKIP_DELAY_DURATION = 300;

/** True under a TooltipProvider of ours, so a Tooltip does not add a second. */
const HasProviderContext = React.createContext(false);

/* ---- Provider ------------------------------------------------------------- */

export type TooltipProviderProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider> & {
  /**
   * How long a pointer rests on a trigger before the tooltip opens, in ms.
   * Keyboard focus always opens at once.
   *
   * @default 300
   */
  delayDuration?: number;
  /**
   * After a tooltip closes, how long moving onto another trigger skips the
   * delay, in ms. `0` always waits.
   *
   * @default 300
   */
  skipDelayDuration?: number;
};

/**
 * Shares the open delay across every tooltip below it. Place one near the app
 * root (in a Next.js layout, inside a client boundary).
 */
export function TooltipProvider({
  delayDuration = DELAY_DURATION,
  skipDelayDuration = SKIP_DELAY_DURATION,
  ...props
}: TooltipProviderProps) {
  return (
    <HasProviderContext.Provider value>
      <TooltipPrimitive.Provider
        delayDuration={delayDuration}
        skipDelayDuration={skipDelayDuration}
        {...props}
      />
    </HasProviderContext.Provider>
  );
}
TooltipProvider.displayName = 'TooltipProvider';

/* ---- Root / Trigger ------------------------------------------------------- */

export type TooltipProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>;

/**
 * The state holder (`open` / `defaultOpen` / `onOpenChange`, `delayDuration`).
 * Renders no DOM. Without a `TooltipProvider` above it, it provides its own.
 */
export function Tooltip(props: TooltipProps) {
  const hasProvider = React.useContext(HasProviderContext);
  const root = <TooltipPrimitive.Root {...props} />;
  return hasProvider ? root : <TooltipProvider>{root}</TooltipProvider>;
}
Tooltip.displayName = 'Tooltip';

export type TooltipTriggerProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>;

/**
 * Use with `asChild` and a FOCUSABLE control (a `Button`, `IconButton`,
 * link). For a disabled control see the note on `Tooltip`: `aria-disabled`,
 * or a `<span tabIndex={0}>` wrapper.
 */
export const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  TooltipTriggerProps
>(function TooltipTrigger({ asChild = false, ...props }, ref) {
  return (
    <TooltipPrimitive.Trigger
      ref={ref}
      asChild={asChild}
      // Not under asChild: the slot would overwrite the child's own
      // `data-slot="button"`, which consumers target.
      {...(asChild ? null : { 'data-slot': 'tooltip-trigger' })}
      {...props}
    />
  );
});
TooltipTrigger.displayName = 'TooltipTrigger';

/* ---- Content -------------------------------------------------------------- */

/** The side of the trigger the bubble opens on. */
export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
/** How the bubble lines up with the trigger along that side. */
export type TooltipAlign = 'start' | 'center' | 'end';

export type TooltipContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
  'side' | 'align'
> & {
  /**
   * The side of the trigger the bubble opens on; Radix flips it when there
   * is no room.
   *
   * @default 'top'
   */
  side?: TooltipSide;
  /**
   * Alignment along that side.
   *
   * @default 'center'
   */
  align?: TooltipAlign;
  /**
   * Gap between the trigger and the bubble, in px (the HTML's 8px).
   *
   * @default 8
   */
  sideOffset?: number;
  /**
   * Where the portal mounts. Defaults to `document.body`, which is themed by
   * the `data-brand` / `data-theme` attributes on `<html>`.
   */
  container?: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Portal>['container'];
};

/**
 * The bubble (`.tooltip__bubble`): inverse surface and ink, 12px text, one
 * line. Keep it to a few words — a label, not a paragraph. Longer text wraps
 * within 320px (or the room beside the trigger, whichever is less).
 */
export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(function TooltipContent(
  { className, side = 'top', align = 'center', sideOffset = 8, container, ...props },
  ref,
) {
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Content
        ref={ref}
        data-slot="tooltip-content"
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(
          'z-tooltip max-w-[min(20rem,var(--radix-tooltip-content-available-width))]',
          'rounded-sm bg-surface-inverse px-2 py-[0.375rem] text-content-inverse',
          // One line when it fits (it shrink-wraps); a longer label wraps inside the
          // max width, balanced, and a long unbroken token (a URL, a file name)
          // breaks rather than running off a 320px screen.
          'font-sans text-xs leading-body font-regular text-balance break-words',
          'pointer-events-none select-none',
          // The HTML's fade + 4px settle, on the fast duration. Entrance only
          // (Radix unmounts on close); `@starting-style`, no keyframes.
          'transition-[opacity,translate] duration-[var(--motion-duration-fast)] ease-productive-in-out',
          'starting:opacity-0',
          'data-[side=top]:starting:translate-y-1 data-[side=bottom]:starting:-translate-y-1',
          'data-[side=left]:starting:translate-x-1 data-[side=right]:starting:-translate-x-1',
          'motion-reduce:transition-none',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = 'TooltipContent';
