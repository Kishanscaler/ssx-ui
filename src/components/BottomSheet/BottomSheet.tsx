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

const isRendered = (node: React.ReactNode) => node != null && node !== false && node !== '';

type SheetContextValue = { modal: boolean; setOpen: (open: boolean) => void };
const SheetContext = React.createContext<SheetContextValue>({ modal: true, setOpen: () => {} });

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

export const bottomSheetContentVariants = cva([
  'fixed inset-x-0 bottom-0 z-dialog',
  'flex max-h-[80dvh] flex-col',
  'rounded-t-xl border-t border-border-raised bg-surface-raised text-content shadow-overlay',
  // A phone's home indicator must not sit on the last action.
  'pb-[env(safe-area-inset-bottom)]',
  'font-sans outline-none',
  'data-[state=open]:animate-ssx-sheet-in data-[state=closed]:animate-ssx-sheet-out',
  'motion-reduce:animate-none',
]);

export type BottomSheetContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
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
  { className, showGrabber = true, dragToDismiss = true, container, children, ...props },
  forwardedRef,
) {
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
        // The Button `neutral` contract: a raised surface flips its hover.
        data-elevation="raised"
        aria-modal={modal ? 'true' : undefined}
        className={cn(
          bottomSheetContentVariants(),
          // No grabber: the head needs its own top padding.
          !showGrabber && '[&>[data-slot=bottom-sheet-header]]:pt-5',
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
              dragToDismiss && 'cursor-grab touch-none select-none active:cursor-grabbing',
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            <span className="block h-1 w-9 rounded-full bg-border-strong" />
          </div>
        ) : null}
        {children}
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
    return (
      <div
        ref={ref}
        data-slot="bottom-sheet-header"
        className={cn('flex shrink-0 items-center justify-between gap-4 px-5 pb-4', className)}
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
 * reaches 80% of the viewport. Its children are 24px apart (the HTML's
 * `stack--6` form rhythm).
 */
export const BottomSheetBody = React.forwardRef<HTMLDivElement, BottomSheetBodyProps>(function BottomSheetBody(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="bottom-sheet-body"
      className={cn('flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pb-6', className)}
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
    body = (
      <>
        {isRendered(trigger) ? (
          <BottomSheetTrigger asChild>
            {React.isValidElement(trigger) ? trigger : <Button variant={triggerVariant}>{trigger}</Button>}
          </BottomSheetTrigger>
        ) : null}
        <BottomSheetContent>
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
