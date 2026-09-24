'use client';

// Client: Radix Dialog keeps open state, traps focus, locks scroll and portals;
// the grabber attaches pointer handlers for drag-to-dismiss.
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { Button, type ButtonVariant } from '../Button';
import { IconButton } from '../IconButton';
import { Heading, headingVariants } from '../Heading';
import { textVariants } from '../Text';

/* ---------------------------------------------------------------------------
 * BottomSheet
 *
 * The phone counterpart of the SideDrawer: a panel that rises from the bottom
 * edge, within thumb reach, for filters and short pickers on a small screen.
 * Do NOT use it on desktop, where a Popover or a SideDrawer sits closer to
 * the control that opened it.
 *
 *   <BottomSheet>
 *     <BottomSheetTrigger asChild><Button variant="secondary">Filter applicants</Button></BottomSheetTrigger>
 *     <BottomSheetContent>
 *       <BottomSheetHeader eyebrow="Admissions · Batch of 2029">
 *         <BottomSheetTitle>Filter applicants</BottomSheetTitle>
 *       </BottomSheetHeader>
 *       <BottomSheetBody>
 *         …fields…
 *         <BottomSheetActions>
 *           <Button variant="tertiary" onClick={reset}>Reset</Button>
 *           <BottomSheetClose asChild><Button>Show 214 applicants</Button></BottomSheetClose>
 *         </BottomSheetActions>
 *       </BottomSheetBody>
 *     </BottomSheetContent>
 *   </BottomSheet>
 *
 * Dismissed three ways, as the HTML says: drag the grabber down, press the
 * scrim, or Escape (plus the × in the head). Everything else is the Dialog
 * contract (same Radix primitive): focus trapped and returned, scroll lock,
 * the page hidden from assistive tech, labelled by `BottomSheetTitle`.
 *
 * Geometry is the HTML's `.sheet`: full width on the bottom edge, xl top
 * corners, a hairline on top, the overlay shadow, at most 80% of the
 * viewport tall; content-sized below that, the body scrolls. There is no
 * footer part on purpose (the HTML dropped `.sheet__foot`): the actions are
 * the last row of the body, `BottomSheetActions`.
 *
 * Drag: a pointer drag on the grabber moves the panel with the finger (down
 * only); let go past a quarter of its height, or with a quick flick, and it
 * closes; otherwise it springs back. The grabber is decorative to assistive
 * tech: the × and Escape are the accessible routes.
 *
 * Motion: rises on the slow productive in-out easing; reduced motion: none
 * (the spring-back is token-timed, so it collapses to 1ms as well).
 *
 * `size="full"`: the sheet takes the viewport, for a task that deserves the
 * whole screen (an "Apply now" lead form beside a campus photo). Below `sm`
 * (672px, where the marketing hero split and the preview's product grids
 * collapse to one column) it is edge to edge: 100dvh (100vh fallback), square
 * corners, the safe-area top and bottom insets as padding. From `sm` up it is
 * still a SHEET, not a page: full width, 100dvh minus a `space-8` top gap
 * (plus the safe-area top), xl top corners and the hairline, the same geometry
 * as the default sheet stretched up. The strip of scrim above says "layer,
 * dismissible" and is a pointer target to close it; an edge-to-edge desktop
 * panel would read as a navigation. The grabber is phone-only there (a drag
 * handle is a touch idiom); drag-to-dismiss stays on, because the drag lives
 * on the grabber row alone (`touch-none`), outside the scrolling region, so it
 * never fights the inner scroll.
 *
 * Split: `BottomSheetSplit` holds `BottomSheetPane` (head + body) and
 * `BottomSheetMedia` (image, or the marketing `.photoPh` placeholder). Put
 * the pane FIRST in the DOM: the dialog then reads title, text, form, and the
 * picture last (it is decorative unless it has `alt`). CSS puts the media
 * first visually, whatever the DOM order: LEFT from `sm` up (`mediaRatio`,
 * media filling the column height, the pane scrolling on its own), and a
 * capped banner (16:9, at most 30dvh) ABOVE the pane on phones, or none
 * (`mediaOnMobile="hidden"`). The × stays in the pane's head in both layouts,
 * so it never sits on the photograph and needs no image scrim.
 *
 * Strip: `BottomSheetMedia` as a DIRECT child of `BottomSheetContent` (no
 * split) is a 2:1 strip across the top of the sheet, at any size, capped at
 * 30dvh. Media is always flush: no inset, clipped by the sheet's own corners.
 * Wherever the media is the first thing on screen (a strip; a split's phone
 * banner), the grabber floats over the picture instead of pushing it down.
 * ------------------------------------------------------------------------- */

/* ---- glyph ---------------------------------------------------------------- */

/** Phosphor 2.1.1 `x` regular (`ph-close` in the preview sprite). */
function XGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
    </svg>
  );
}

/** Phosphor 2.1.1 `image` regular (`ph-image` in the preview sprite). */
function ImageGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V158.75l-26.07-26.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L40,149.37V56ZM40,172l52-52,80,80H40Zm176,28H194.63l-36-36,20-20L216,181.38V200ZM144,100a12,12,0,1,1,12,12A12,12,0,0,1,144,100Z" />
    </svg>
  );
}

const isRendered = (node: React.ReactNode) => node != null && node !== false && node !== '';

type SheetContextValue = { modal: boolean; setOpen: (open: boolean) => void };
const SheetContext = React.createContext<SheetContextValue>({ modal: true, setOpen: () => {} });

/** The resolved `size` of the enclosing `BottomSheetContent`, for the head and body padding. */
const SizeContext = React.createContext<BottomSheetSize>('default');

/**
 * The enclosing `BottomSheetSplit`'s phone behaviour, for `BottomSheetMedia`.
 * `null` outside a split: the media is then a STRIP across the top of the sheet.
 */
const SplitContext = React.createContext<BottomSheetMediaOnMobile | null>(null);

/* ---- Trigger / Close ------------------------------------------------------ */

export type BottomSheetTriggerProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>;

/**
 * Opens the sheet. Use with `asChild` and a `Button`; focus returns here on
 * close.
 */
export const BottomSheetTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  BottomSheetTriggerProps
>(function BottomSheetTrigger({ asChild = false, ...props }, ref) {
  return (
    <DialogPrimitive.Trigger
      ref={ref}
      asChild={asChild}
      {...(asChild ? null : { 'data-slot': 'bottom-sheet-trigger' })}
      {...props}
    />
  );
});
BottomSheetTrigger.displayName = 'BottomSheetTrigger';

export type BottomSheetCloseProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>;

/**
 * Closes the sheet. Use with `asChild` and a `Button`, e.g. the committing
 * "Show 214 applicants", which applies and dismisses in one press.
 */
export const BottomSheetClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  BottomSheetCloseProps
>(function BottomSheetClose({ asChild = false, ...props }, ref) {
  return (
    <DialogPrimitive.Close
      ref={ref}
      asChild={asChild}
      data-bottom-sheet-close=""
      {...(asChild ? null : { 'data-slot': 'bottom-sheet-close' })}
      {...props}
    />
  );
});
BottomSheetClose.displayName = 'BottomSheetClose';

/* ---- Content -------------------------------------------------------------- */

export const bottomSheetContentVariants = cva(
  [
    'fixed inset-x-0 bottom-0 z-dialog',
    'flex flex-col',
    'border-border-raised bg-surface-raised text-content shadow-overlay',
    // A phone's home indicator must not sit on the last action.
    'pb-[env(safe-area-inset-bottom)]',
    'font-sans outline-none',
    'data-[state=open]:animate-ssx-sheet-in data-[state=closed]:animate-ssx-sheet-out',
    'motion-reduce:animate-none',
  ],
  {
    variants: {
      size: {
        // From `sm` a centred sheet at most 640px wide, not a 1920px strip (N-08).
        default: [
          'max-h-[80dvh] rounded-t-xl border-t',
          'sm:mx-auto sm:w-full sm:max-w-[40rem] sm:border-x',
        ],
        full: [
          // Phones: the whole viewport, edge to edge, clear of the notch.
          'h-[100vh] supports-[height:100dvh]:h-[100dvh] overflow-hidden rounded-none',
          'pt-[env(safe-area-inset-top)]',
          // `sm` up: the sheet stretched up to a small top gap (see the header).
          'sm:h-[calc(100vh-var(--space-8)-env(safe-area-inset-top))]',
          'sm:supports-[height:100dvh]:h-[calc(100dvh-var(--space-8)-env(safe-area-inset-top))]',
          'sm:rounded-t-xl sm:border-t sm:pt-0',
          // A landscape phone: no top gap, square corners — every pixel to the form.
          '[@media(max-height:480px)]:sm:h-[100vh] [@media(max-height:480px)]:sm:supports-[height:100dvh]:h-[100dvh]',
          '[@media(max-height:480px)]:sm:rounded-none [@media(max-height:480px)]:sm:pt-[env(safe-area-inset-top)]',
        ],
      },
    },
    defaultVariants: { size: 'default' },
  },
);

/** `default` content-sized, at most 80% of the viewport · `full` the viewport (a small top gap from `sm`). */
export type BottomSheetSize = 'default' | 'full';

export type BottomSheetContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  /**
   * `default`: content-sized, at most 80% of the viewport. `full`: the whole
   * viewport on a phone (edge to edge, square corners); from `sm` (672px) up,
   * full width and 100dvh minus a small top gap, xl top corners. The body (or
   * a `BottomSheetSplit` pane) scrolls inside.
   *
   * @default 'default'
   */
  size?: BottomSheetSize;
  /**
   * Draw the grabber, the short bar at the top edge that affords the drag.
   *
   * @default true
   */
  showGrabber?: boolean;
  /**
   * Dragging the grabber down past a quarter of the panel (or flicking it)
   * closes the sheet. Off: the grabber is only a visual cue.
   *
   * @default true
   */
  dragToDismiss?: boolean;
  /**
   * Where the portal mounts. Defaults to `document.body`, which is themed by
   * the `data-brand` / `data-theme` attributes on `<html>`.
   */
  container?: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>['container'];
};

/** Close when the release is past this share of the panel's height… */
const DISMISS_RATIO = 0.25;
/** …or when the finger is still moving down faster than this (px / ms). */
const FLICK_VELOCITY = 0.5;

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * The panel, with its scrim and grabber, in a portal. Compose
 * `BottomSheetHeader` and `BottomSheetBody` inside it.
 */
export const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  BottomSheetContentProps
>(function BottomSheetContent(
  { className, size = 'default', showGrabber = true, dragToDismiss = true, container, children, ...props },
  forwardedRef,
) {
  const full = size === 'full';
  const { modal, setOpen } = React.useContext(SheetContext);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const ref = useComposedRefs(forwardedRef, innerRef);
  const drag = React.useRef<{ id: number; startY: number; lastY: number; lastT: number; v: number } | null>(
    null,
  );

  const place = (dy: number, animate: boolean) => {
    const el = innerRef.current;
    if (!el) return;
    el.style.transition = animate
      ? 'transform var(--motion-duration-fast) var(--motion-easing-productive-entrance)'
      : 'none';
    // `transform`, not `translate`: the keyframes own `translate`, so the exit
    // animation composes with the drag offset and runs on from where it is.
    el.style.transform = dy > 0 ? `translateY(${dy}px)` : '';
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragToDismiss || event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { id: event.pointerId, startY: event.clientY, lastY: event.clientY, lastT: now(), v: 0 };
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    const t = now();
    d.v = (event.clientY - d.lastY) / Math.max(1, t - d.lastT);
    d.lastY = event.clientY;
    d.lastT = t;
    place(Math.max(0, event.clientY - d.startY), false);
  };
  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const dy = Math.max(0, event.clientY - d.startY);
    const height = innerRef.current?.offsetHeight ?? 0;
    if (event.type === 'pointerup' && dy > 0 && (dy > height * DISMISS_RATIO || d.v > FLICK_VELOCITY)) {
      // The exit keyframes run from where the finger left the panel.
      if (innerRef.current) innerRef.current.style.transition = 'none';
      setOpen(false);
    } else {
      place(0, true);
    }
  };

  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay
        data-slot="bottom-sheet-overlay"
        className={cn(
          // The ONE modal scrim, as Dialog paints it (alpha in the colour).
          'fixed inset-0 z-overlay bg-surface-overlay-scrim',
          'data-[state=open]:animate-ssx-overlay-in data-[state=closed]:animate-ssx-overlay-out',
          'motion-reduce:animate-none',
        )}
      />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="bottom-sheet-content"
        data-size={size}
        // The Button `neutral` contract: a raised surface flips its hover.
        data-elevation="raised"
        aria-modal={modal ? 'true' : undefined}
        className={cn(
          bottomSheetContentVariants({ size }),
          // No grabber: the head needs its own top padding.
          !showGrabber && !full && '[&>[data-slot=bottom-sheet-header]]:pt-5',
          // A media strip on top: flush to the sheet's corners (clipped), the
          // grabber floating over it, and the head below it padded on its own.
          'has-[>[data-slot=bottom-sheet-media]]:overflow-hidden',
          'has-[>[data-slot=bottom-sheet-media]]:[&>[data-slot=bottom-sheet-header]]:pt-5',
          'has-[>[data-slot=bottom-sheet-media]]:[&>[data-slot=bottom-sheet-grabber]]:absolute',
          // A split's phone banner is on top too: same float, below `sm` only.
          'max-sm:has-[>[data-slot=bottom-sheet-split][data-media-on-mobile=banner]]:[&>[data-slot=bottom-sheet-grabber]]:absolute',
          // Media runs to the edge: no border, or it frames the picture in a
          // light rim against the scrim. The shadow still lifts the sheet.
          'has-[[data-slot=bottom-sheet-media]]:border-0',
          // Media on top: the head's × moves to the sheet's top-right corner,
          // over the picture, as a raised chip that reads on any photograph
          // (Dialog does the same). From `sm` a split's × is already there.
          // Written out in full: Tailwind only generates classes it finds whole.
          'has-[>[data-slot=bottom-sheet-media]]:[&_[data-bottom-sheet-close-x]]:absolute',
          'has-[>[data-slot=bottom-sheet-media]]:[&_[data-bottom-sheet-close-x]]:end-3',
          'has-[>[data-slot=bottom-sheet-media]]:[&_[data-bottom-sheet-close-x]]:top-[calc(env(safe-area-inset-top,0px)+0.75rem)]',
          'has-[>[data-slot=bottom-sheet-media]]:[&_[data-bottom-sheet-close-x]]:z-raised',
          'has-[>[data-slot=bottom-sheet-media]]:[&_[data-bottom-sheet-close-x]]:bg-surface-raised',
          'has-[>[data-slot=bottom-sheet-media]]:[&_[data-bottom-sheet-close-x]]:shadow-raised',
          'has-[>[data-slot=bottom-sheet-media]]:[&_[data-bottom-sheet-close-x]:hover]:bg-surface-raised-hover',
          'max-sm:has-[>[data-slot=bottom-sheet-split][data-media-on-mobile=banner]]:[&_[data-bottom-sheet-close-x]]:absolute',
          'max-sm:has-[>[data-slot=bottom-sheet-split][data-media-on-mobile=banner]]:[&_[data-bottom-sheet-close-x]]:end-3',
          'max-sm:has-[>[data-slot=bottom-sheet-split][data-media-on-mobile=banner]]:[&_[data-bottom-sheet-close-x]]:top-[calc(env(safe-area-inset-top,0px)+0.75rem)]',
          'max-sm:has-[>[data-slot=bottom-sheet-split][data-media-on-mobile=banner]]:[&_[data-bottom-sheet-close-x]]:z-raised',
          'max-sm:has-[>[data-slot=bottom-sheet-split][data-media-on-mobile=banner]]:[&_[data-bottom-sheet-close-x]]:bg-surface-raised',
          'max-sm:has-[>[data-slot=bottom-sheet-split][data-media-on-mobile=banner]]:[&_[data-bottom-sheet-close-x]]:shadow-raised',
          'max-sm:has-[>[data-slot=bottom-sheet-split][data-media-on-mobile=banner]]:[&_[data-bottom-sheet-close-x]:hover]:bg-surface-raised-hover',
          className,
        )}
        {...props}
      >
        {showGrabber ? (
          <div
            data-slot="bottom-sheet-grabber"
            data-draggable={dragToDismiss ? '' : undefined}
            aria-hidden="true"
            // A 36×4 bar in a taller, full-width hit area, so a thumb finds it.
            className={cn(
              'flex shrink-0 justify-center py-3',
              // When it floats over media (see the content's `has-` rules):
              // the top edge, above the picture, the bar in the on-image ink.
              'inset-x-0 top-[env(safe-area-inset-top)] z-raised',
              '[[data-slot=bottom-sheet-content]:has(>[data-slot=bottom-sheet-media])>&>span]:bg-content-on-image',
              'max-sm:[[data-slot=bottom-sheet-content]:has(>[data-slot=bottom-sheet-split][data-media-on-mobile=banner])>&>span]:bg-content-on-image',
              // Full size from `sm` up: no grabber (a drag handle is a touch idiom).
              full && 'sm:hidden',
              dragToDismiss && 'cursor-grab touch-none select-none active:cursor-grabbing',
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            <span className="block h-1 w-9 rounded-full bg-border-strong shadow-raised" />
          </div>
        ) : null}
        <SizeContext.Provider value={size}>{children}</SizeContext.Provider>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
BottomSheetContent.displayName = 'BottomSheetContent';

/* ---- Header / Title / Description ----------------------------------------- */

export type BottomSheetHeaderProps = React.ComponentPropsWithoutRef<'div'> & {
  /** The small caps line above the title ("Admissions · Batch of 2029"). */
  eyebrow?: React.ReactNode;
  /**
   * Draw the × close button at the end of the head, as the HTML does.
   *
   * @default true
   */
  showClose?: boolean;
  /**
   * The × button's accessible name.
   *
   * @default 'Close'
   */
  closeLabel?: string;
};

/** The head: optional eyebrow and `BottomSheetTitle`, the × at the end. */
export const BottomSheetHeader = React.forwardRef<HTMLDivElement, BottomSheetHeaderProps>(
  function BottomSheetHeader({ className, eyebrow, showClose = true, closeLabel = 'Close', children, ...props }, ref) {
    const size = React.useContext(SizeContext);
    return (
      <div
        ref={ref}
        data-slot="bottom-sheet-header"
        className={cn(
          'flex shrink-0 items-center justify-between gap-4 px-5 pb-4',
          // Full size: the head is not always right under the grabber (a banner
          // can sit between), so it carries its own top padding; the × keeps
          // to the top corner of the column when the title and text wrap.
          size === 'full' && 'items-start pt-5 sm:px-8 sm:pt-8',
          // Short screens (a landscape phone): a compact head (N-08).
          size === 'full' && '[@media(max-height:480px)]:pt-3 [@media(max-height:480px)]:pb-2',
          className,
        )}
        {...props}
      >
        <div data-slot="bottom-sheet-header-text" className="grid min-w-0 flex-1 gap-1">
          {isRendered(eyebrow) ? (
            <Heading as="p" size="eyebrow" data-slot="bottom-sheet-eyebrow" className="m-0">
              {eyebrow}
            </Heading>
          ) : null}
          {children}
        </div>
        {showClose ? (
          <DialogPrimitive.Close asChild>
            <IconButton variant="tertiary" aria-label={closeLabel} data-bottom-sheet-close-x="">
              <XGlyph />
            </IconButton>
          </DialogPrimitive.Close>
        ) : null}
      </div>
    );
  },
);
BottomSheetHeader.displayName = 'BottomSheetHeader';

export type BottomSheetTitleProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;

/** The sheet's name (an `h2`, the Heading `2` size). Required: it labels the panel. */
export const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  BottomSheetTitleProps
>(function BottomSheetTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      data-slot="bottom-sheet-title"
      className={cn(headingVariants({ size: '2' }), 'm-0 text-content', className)}
      {...props}
    />
  );
});
BottomSheetTitle.displayName = 'BottomSheetTitle';

export type BottomSheetDescriptionProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>;

/** An optional line under the title, wired as `aria-describedby`. */
export const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  BottomSheetDescriptionProps
>(function BottomSheetDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      data-slot="bottom-sheet-description"
      className={cn(textVariants({ size: 'sm', tone: 'secondary' }), 'm-0', className)}
      {...props}
    />
  );
});
BottomSheetDescription.displayName = 'BottomSheetDescription';

/* ---- Body / Actions ------------------------------------------------------- */

export type BottomSheetBodyProps = React.ComponentPropsWithoutRef<'div'>;

/**
 * Everything under the head, the actions included. It scrolls when the sheet
 * reaches 80% of the viewport (or, at `size="full"`, whenever it overflows). Its children are 24px apart (the HTML's
 * `stack--6` form rhythm).
 */
export const BottomSheetBody = React.forwardRef<HTMLDivElement, BottomSheetBodyProps>(function BottomSheetBody(
  { className, ...props },
  ref,
) {
  const size = React.useContext(SizeContext);
  return (
    <div
      ref={ref}
      data-slot="bottom-sheet-body"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pb-6',
        // Full size: roomier gutters from `sm`, and a readable measure (the
        // preview's `container--narrow`, 68ch) so a form does not stretch
        // across a 1920px screen.
        size === 'full' && 'overscroll-contain sm:px-8 sm:pb-8 [&>*]:max-w-[68ch] [@media(max-height:480px)]:gap-4 [@media(max-height:480px)]:pb-4',
        className,
      )}
      {...props}
    />
  );
});
BottomSheetBody.displayName = 'BottomSheetBody';

export type BottomSheetActionsProps = React.ComponentPropsWithoutRef<'div'>;

/**
 * The last row of the body: the secondary answer ("Reset") at the start, the
 * committing Button at the end.
 */
export const BottomSheetActions = React.forwardRef<HTMLDivElement, BottomSheetActionsProps>(
  function BottomSheetActions({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="bottom-sheet-actions"
        className={cn('flex flex-wrap items-center justify-between gap-2', className)}
        {...props}
      />
    );
  },
);
BottomSheetActions.displayName = 'BottomSheetActions';

/* ---- Split / Pane / Media -------------------------------------------------- */

/** Media column : pane column, from `sm` up. `5:7` is five twelfths for the picture. */
export type BottomSheetMediaRatio = '1:2' | '5:7' | '1:1' | '7:5';

/** Below `sm`: the media as a capped banner above the pane, or not at all. */
export type BottomSheetMediaOnMobile = 'banner' | 'hidden';

const MEDIA_RATIO: Record<BottomSheetMediaRatio, string> = {
  '1:2': 'sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]',
  '5:7': 'sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]',
  '1:1': 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]',
  '7:5': 'sm:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]',
};

export type BottomSheetSplitProps = React.ComponentPropsWithoutRef<'div'> & {
  /**
   * Column widths from `sm` (672px) up, media first: `5:7` gives the picture
   * five twelfths and the pane seven.
   *
   * @default '5:7'
   */
  mediaRatio?: BottomSheetMediaRatio;
  /**
   * Below `sm`: `banner` shows the media above the pane (16:9, at most 30dvh,
   * fixed while the pane scrolls); `hidden` drops it, and the pane takes the
   * whole sheet.
   *
   * @default 'banner'
   */
  mediaOnMobile?: BottomSheetMediaOnMobile;
};

/**
 * Media beside content: `BottomSheetMedia` LEFT and `BottomSheetPane` right
 * from `sm` up, the media as a banner on top below it. Put the pane first in
 * the DOM (it reads first); the media is placed first by CSS either way. Made
 * for `size="full"`.
 */
export const BottomSheetSplit = React.forwardRef<HTMLDivElement, BottomSheetSplitProps>(function BottomSheetSplit(
  { className, mediaRatio = '5:7', mediaOnMobile = 'banner', ...props },
  ref,
) {
  return (
    <SplitContext.Provider value={mediaOnMobile}>
      <div
        ref={ref}
        data-slot="bottom-sheet-split"
        data-media-ratio={mediaRatio}
        data-media-on-mobile={mediaOnMobile}
        className={cn(
          // Phones: a column, the banner fixed on top, the pane filling the rest.
          'flex min-h-0 flex-1 flex-col',
          // `sm` up: two columns, one row as tall as the sheet.
          'sm:grid sm:grid-rows-[minmax(0,1fr)]',
          MEDIA_RATIO[mediaRatio] ?? MEDIA_RATIO['5:7'],
          className,
        )}
        {...props}
      />
    </SplitContext.Provider>
  );
});
BottomSheetSplit.displayName = 'BottomSheetSplit';

export type BottomSheetPaneProps = React.ComponentPropsWithoutRef<'div'>;

/**
 * The content column of a `BottomSheetSplit`: `BottomSheetHeader` (with the ×,
 * top right of the column) and `BottomSheetBody`, which scrolls on its own.
 */
export const BottomSheetPane = React.forwardRef<HTMLDivElement, BottomSheetPaneProps>(function BottomSheetPane(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="bottom-sheet-pane"
      className={cn('flex min-h-0 min-w-0 flex-1 flex-col', className)}
      {...props}
    />
  );
});
BottomSheetPane.displayName = 'BottomSheetPane';

export type BottomSheetMediaProps = React.ComponentPropsWithoutRef<'div'> & {
  /**
   * Image URL, cropped to the frame (`object-fit: cover`). Or pass your own
   * `<img>` / `next/image` (`fill`) as the child. Neither: the placeholder.
   */
  src?: string;
  /**
   * Alt text. Empty (the default) makes the media decorative: the dialog's
   * title and text already say what the sheet is. On the placeholder, a
   * non-empty `alt` names the frame (`role="img"`).
   *
   * @default ''
   */
  alt?: string;
  /** The placeholder's caption ("Campus photo · 5 : 7"), under its image glyph. */
  label?: React.ReactNode;
};

/**
 * The image column of a `BottomSheetSplit`, or, as a direct child of
 * `BottomSheetContent`, a 2:1 strip across the top of the sheet: the photo, a
 * child image, or the marketing placeholder (sunken surface, image glyph,
 * optional caption). Always flush to the sheet's edges and corners.
 */
export const BottomSheetMedia = React.forwardRef<HTMLDivElement, BottomSheetMediaProps>(function BottomSheetMedia(
  { className, src, alt = '', label, children, ...props },
  ref,
) {
  const onMobile = React.useContext(SplitContext);
  const strip = onMobile === null;
  const placeholder = !src && !isRendered(children);
  const decorative = placeholder && !alt;
  return (
    <div
      ref={ref}
      data-slot="bottom-sheet-media"
      data-layout={strip ? 'strip' : 'split'}
      data-placeholder={placeholder ? '' : undefined}
      role={placeholder && alt ? 'img' : undefined}
      aria-label={placeholder && alt ? alt : undefined}
      aria-hidden={decorative ? 'true' : undefined}
      className={cn(
        // First visually, whatever the DOM order: on top, then on the left.
        'relative order-first w-full shrink-0 overflow-hidden bg-surface-sunken',
        strip
          ? // A strip across the top at every width: 2:1, never more than 30% of the screen.
            'aspect-[2/1] max-h-[30dvh] border-b border-border-decorative'
          : [
              'border-b border-border-decorative sm:border-r sm:border-b-0',
              // Phones: a 16:9 banner, never more than 30% of the screen.
              'aspect-video max-h-[30dvh]',
              onMobile === 'hidden' && 'hidden sm:block',
              // `sm` up: the full height of the column.
              'sm:aspect-auto sm:h-full sm:max-h-none',
            ],
        '[&>img]:absolute [&>img]:inset-0 [&>img]:block [&>img]:size-full [&>img]:object-cover',
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} decoding="async" />
      ) : placeholder ? (
        <span
          data-slot="bottom-sheet-media-placeholder"
          className="absolute inset-0 grid place-content-center gap-1 p-4 text-center text-content-secondary"
        >
          <ImageGlyph className="mx-auto size-icon-xl opacity-disabled" />
          {isRendered(label) ? <span className="type-eyebrow">{label}</span> : null}
        </span>
      ) : (
        children
      )}
    </div>
  );
});
BottomSheetMedia.displayName = 'BottomSheetMedia';

/* ---- BottomSheet (root, plus the flat form) ------------------------------- */

export type BottomSheetProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> & {
  /**
   * Flat form. With `title` set, the sheet builds its own trigger, head, body
   * (`children`) and action row, so a CMS blok can describe it in strings.
   * Leave it unset for the compound API.
   */
  title?: React.ReactNode;
  /** Flat form: the small caps line above the title. */
  eyebrow?: React.ReactNode;
  /** Flat form: an optional line under the title, wired as `aria-describedby`. */
  description?: React.ReactNode;
  /**
   * Flat form: the button that opens the sheet. A string becomes a `Button`
   * label; an element is used as-is (it must accept a ref and `onClick`).
   */
  trigger?: React.ReactNode;
  /**
   * Flat form: the trigger Button's variant, when `trigger` is a string.
   *
   * @default 'secondary'
   */
  triggerVariant?: ButtonVariant;
  /**
   * Flat form: the secondary answer at the start of the action row ("Reset").
   * It calls `onCancel` and keeps the sheet open. Unset: no button.
   */
  cancelLabel?: string;
  /** Flat form: called when the `cancelLabel` button is pressed. */
  onCancel?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Flat form: the committing button at the end of the action row. Unset: none. */
  confirmLabel?: string;
  /**
   * Flat form: called when the confirm button is pressed. The sheet then
   * closes, unless you call `event.preventDefault()`.
   */
  onConfirm?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Flat form: the × button's accessible name.
   *
   * @default 'Close'
   */
  closeLabel?: string;
  /**
   * Flat form: the panel size (see `BottomSheetContent`).
   *
   * @default 'default'
   */
  size?: BottomSheetSize;
  /**
   * Flat form: an image URL. Set it (or `media` or `mediaLabel`) and the body
   * goes into a `BottomSheetSplit`: the picture left from `sm` up, a banner on
   * phones. Best with `size="full"`.
   */
  mediaSrc?: string;
  /** Flat form: alt text for `mediaSrc`. Empty: decorative. */
  mediaAlt?: string;
  /** Flat form: your own image element (`next/image` with `fill`), used when `mediaSrc` is unset. */
  media?: React.ReactNode;
  /** Flat form: with no `mediaSrc` / `media`, shows the placeholder with this caption. */
  mediaLabel?: React.ReactNode;
  /**
   * Flat form: media : content column widths from `sm` up.
   *
   * @default '5:7'
   */
  mediaRatio?: BottomSheetMediaRatio;
  /**
   * Flat form: the media on phones, `banner` above the content or `hidden`.
   *
   * @default 'banner'
   */
  mediaOnMobile?: BottomSheetMediaOnMobile;
};

/**
 * The state holder (`open` / `defaultOpen` / `onOpenChange`, `modal`). In the
 * compound API it renders no DOM of its own.
 */
export function BottomSheet({
  open: openProp,
  defaultOpen,
  onOpenChange,
  modal,
  title,
  eyebrow,
  description,
  trigger,
  triggerVariant = 'secondary',
  cancelLabel,
  onCancel,
  confirmLabel,
  onConfirm,
  closeLabel = 'Close',
  size = 'default',
  mediaSrc,
  mediaAlt,
  media,
  mediaLabel,
  mediaRatio,
  mediaOnMobile,
  children,
}: BottomSheetProps) {
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
    caller: 'BottomSheet',
  });
  const context = React.useMemo(() => ({ modal: modal !== false, setOpen }), [modal, setOpen]);

  let body: React.ReactNode = children;
  if (isRendered(title)) {
    const handleConfirm = (event: React.MouseEvent<HTMLButtonElement>) => {
      onConfirm?.(event);
      if (!event.defaultPrevented) setOpen(false);
    };
    const hasMedia = Boolean(mediaSrc) || isRendered(media) || isRendered(mediaLabel);
    const panel = (
      <>
        <BottomSheetHeader eyebrow={eyebrow} closeLabel={closeLabel}>
          <BottomSheetTitle>{title}</BottomSheetTitle>
          {isRendered(description) ? <BottomSheetDescription>{description}</BottomSheetDescription> : null}
        </BottomSheetHeader>
        <BottomSheetBody>
          {children}
          {cancelLabel || confirmLabel ? (
            <BottomSheetActions>
              {cancelLabel ? (
                <Button variant="tertiary" onClick={onCancel}>
                  {cancelLabel}
                </Button>
              ) : (
                <span aria-hidden="true" />
              )}
              {confirmLabel ? <Button onClick={handleConfirm}>{confirmLabel}</Button> : null}
            </BottomSheetActions>
          ) : null}
        </BottomSheetBody>
      </>
    );
    body = (
      <>
        {isRendered(trigger) ? (
          <BottomSheetTrigger asChild>
            {React.isValidElement(trigger) ? trigger : <Button variant={triggerVariant}>{trigger}</Button>}
          </BottomSheetTrigger>
        ) : null}
        <BottomSheetContent size={size}>
          {hasMedia ? (
            <BottomSheetSplit mediaRatio={mediaRatio} mediaOnMobile={mediaOnMobile}>
              <BottomSheetPane>{panel}</BottomSheetPane>
              <BottomSheetMedia src={mediaSrc || undefined} alt={mediaAlt} label={mediaLabel}>
                {mediaSrc ? null : media}
              </BottomSheetMedia>
            </BottomSheetSplit>
          ) : (
            panel
          )}
        </BottomSheetContent>
      </>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen} modal={modal}>
      <SheetContext.Provider value={context}>{body}</SheetContext.Provider>
    </DialogPrimitive.Root>
  );
}
BottomSheet.displayName = 'BottomSheet';
