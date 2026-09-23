'use client';

// Client: Radix HoverCard times the open / close intent and portals; we keep
// the open state to wire the trigger's description.
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { useControllableState } from '@radix-ui/react-use-controllable-state';

import { cn } from '../../lib/cn';
import { useId } from '../../lib/use-id';
import { popoverContentVariants } from '../Popover';

/* ---------------------------------------------------------------------------
 * HoverCard
 *
 * A richer popover that PREVIEWS the thing behind a name — a mentor, a
 * student, a cohort — so the reader does not navigate away to learn who is
 * meant. Preview only: nothing inside is interactive, and everything it shows
 * also exists on the real page the trigger leads to.
 *
 *   <HoverCard>
 *     <HoverCardTrigger asChild>
 *       <Button variant="tertiary" size="sm">Ishita Raghunathan</Button>
 *     </HoverCardTrigger>
 *     <HoverCardContent aria-label="Profile preview: Ishita Raghunathan">
 *       ...avatar, name, role, stats, badges...
 *     </HoverCardContent>
 *   </HoverCard>
 *
 * The preview's contract:
 *   - Hover INTENT, not hover: it opens after 400ms and closes 200ms after the
 *     pointer leaves, so a pointer crossing a paragraph does not fire a card at
 *     every name, and can travel from the trigger into the card. The card
 *     stays open while the pointer is inside it.
 *   - Not hover-only: it opens on focus and closes on blur (Radix).
 *   - `role="note"`, not `dialog`: nothing inside is interactive, nothing has
 *     to be dismissed.
 *   - The trigger is `aria-describedby` the card, so its content is announced
 *     WITHOUT opening anything. Radix only mounts the card while it is open, so
 *     while closed a `hidden` copy of the same content carries the id (hidden
 *     content still counts for `aria-describedby`); the two never coexist.
 *     On the server neither renders — the copy appears on mount.
 *
 * Theming: the card portals to <body>; it is themed because `data-brand` /
 * `data-theme` sit on <html> (docs/05 section 3, "Portals").
 * ------------------------------------------------------------------------- */

/** Hover intent before the card opens, ms (the HTML's OPEN_DELAY). */
const OPEN_DELAY = 400;
/** Grace before it closes, ms (the HTML's CLOSE_DELAY). */
const CLOSE_DELAY = 200;

type HoverCardContextValue = { open: boolean; contentId: string };
const HoverCardContext = React.createContext<HoverCardContextValue | null>(null);

/* ---- Root ----------------------------------------------------------------- */

export type HoverCardProps = React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Root> & {
  /**
   * Hover intent before the card opens, in ms. Focus uses it too.
   *
   * @default 400
   */
  openDelay?: number;
  /**
   * Grace after the pointer leaves before the card closes, in ms — the time
   * it has to travel from the trigger into the card.
   *
   * @default 200
   */
  closeDelay?: number;
};

/**
 * The state holder (`open` / `defaultOpen` / `onOpenChange`, `openDelay`,
 * `closeDelay`). Renders no DOM of its own.
 */
export function HoverCard({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  openDelay = OPEN_DELAY,
  closeDelay = CLOSE_DELAY,
  ...props
}: HoverCardProps) {
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    caller: 'HoverCard',
  });
  const contentId = useId();
  const value = React.useMemo(() => ({ open, contentId }), [open, contentId]);
  return (
    <HoverCardContext.Provider value={value}>
      <HoverCardPrimitive.Root
        open={open}
        onOpenChange={setOpen}
        openDelay={openDelay}
        closeDelay={closeDelay}
        {...props}
      />
    </HoverCardContext.Provider>
  );
}
HoverCard.displayName = 'HoverCard';

/* ---- Trigger -------------------------------------------------------------- */

export type HoverCardTriggerProps = React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Trigger>;

/**
 * The name being previewed. An `<a>` by default — the preview's real page;
 * with `asChild`, a `Link` or a tertiary `Button`. It is `aria-describedby`
 * the card.
 */
export const HoverCardTrigger = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Trigger>,
  HoverCardTriggerProps
>(function HoverCardTrigger({ asChild = false, 'aria-describedby': describedBy, ...props }, ref) {
  const ctx = React.useContext(HoverCardContext);
  const ids = [describedBy, ctx?.contentId].filter(Boolean).join(' ') || undefined;
  return (
    <HoverCardPrimitive.Trigger
      ref={ref}
      asChild={asChild}
      aria-describedby={ids}
      // Not under asChild: the slot would overwrite the child's own
      // `data-slot="button"`, which consumers target.
      {...(asChild ? null : { 'data-slot': 'hover-card-trigger' })}
      {...props}
    />
  );
});
HoverCardTrigger.displayName = 'HoverCardTrigger';

/* ---- Content -------------------------------------------------------------- */

/** The side of the trigger the card opens on. */
export type HoverCardSide = 'top' | 'right' | 'bottom' | 'left';
/** How the card lines up with the trigger along that side. */
export type HoverCardAlign = 'start' | 'center' | 'end';

export type HoverCardContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>,
  'side' | 'align'
> & {
  /**
   * The side of the trigger the card opens on; Radix flips it when there is
   * no room.
   *
   * @default 'bottom'
   */
  side?: HoverCardSide;
  /**
   * Alignment against the trigger. `end` is the HTML's `.popover--end`, for a
   * name near the trailing edge.
   *
   * @default 'start'
   */
  align?: HoverCardAlign;
  /**
   * Gap between the trigger and the card, in px.
   *
   * @default 6
   */
  sideOffset?: number;
  /**
   * Where the portal mounts. Defaults to `document.body`, which is themed by
   * the `data-brand` / `data-theme` attributes on `<html>`.
   */
  container?: React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Portal>['container'];
};

/**
 * The card (`.popover.hoverCard`): the popover surface at a fixed 300px.
 * Name it with `aria-label` ("Profile preview: Ishita Raghunathan").
 */
export const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  HoverCardContentProps
>(function HoverCardContent(
  { className, side = 'bottom', align = 'start', sideOffset = 6, container, role = 'note', children, ...props },
  ref,
) {
  const ctx = React.useContext(HoverCardContext);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const card = (
    <HoverCardPrimitive.Portal container={container}>
      <HoverCardPrimitive.Content
        ref={ref}
        id={ctx?.contentId}
        role={role}
        data-slot="hover-card-content"
        data-elevation="raised"
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(
          popoverContentVariants({ padding: 'md' }),
          'w-[300px] max-w-(--radix-hover-card-content-available-width)',
          className,
        )}
        {...props}
      >
        {children}
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Portal>
  );

  // Closed: the description copy the trigger points at. Portalled too, so a
  // card written inside a <p> never nests block content in it.
  const target = container ?? (mounted && typeof document !== 'undefined' ? document.body : null);
  const description =
    ctx && !ctx.open && mounted && target
      ? ReactDOM.createPortal(
          <div id={ctx.contentId} hidden data-slot="hover-card-description">
            {children}
          </div>,
          target,
        )
      : null;

  return (
    <>
      {card}
      {description}
    </>
  );
});
HoverCardContent.displayName = 'HoverCardContent';
