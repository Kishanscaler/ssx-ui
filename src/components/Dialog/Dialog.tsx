'use client';

// Client: Radix Dialog keeps open state, traps focus, locks scroll and portals.
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { Button, type ButtonVariant } from '../Button';
import { IconButton } from '../IconButton';
import { headingVariants } from '../Heading';
import { textVariants } from '../Text';

/* ---------------------------------------------------------------------------
 * Dialog
 *
 * A modal that stops everything until the person decides. Use it only for a
 * decision that cannot be undone by simply navigating away, or for a short
 * form that must not lose the page behind it (an "Apply now" lead form). It is
 * not a place for content a person might want to keep open next to the page:
 * that is a Drawer.
 *
 *   <Dialog>
 *     <DialogTrigger asChild><Button>Publish Week 6 grades</Button></DialogTrigger>
 *     <DialogContent>
 *       <DialogHeader icon={<Icon size="xl" tone="success"><CheckCircle weight="fill" /></Icon>}>
 *         <DialogTitle>Publish Week 6 grades?</DialogTitle>
 *         <DialogDescription>84 students in Cohort 7 will be emailed…</DialogDescription>
 *       </DialogHeader>
 *       <DialogBody>…</DialogBody>
 *       <DialogFooter>
 *         <DialogClose asChild><Button variant="tertiary">Cancel</Button></DialogClose>
 *         <Button onClick={publish}>Publish to 84 students</Button>
 *       </DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 *
 * Radix pays the modal contract: focus moves in and is trapped, Escape and
 * the scrim close it, focus returns to the trigger, the page behind is
 * scroll-locked and hidden from assistive tech, and the panel is labelled by
 * `DialogTitle` / described by `DialogDescription` (`aria-labelledby` /
 * `aria-describedby`, wired only when the part is actually rendered).
 *
 * `variant="destructive"` is the HTML's "Withdraw application": the panel is
 * an `alertdialog`, a click on the scrim does NOT dismiss it (a stray click
 * must never count as an answer; Escape and the buttons still do), and focus
 * lands on the first `DialogClose` in the footer — the safe answer, "Keep
 * application" — instead of the first control. The destructive button itself
 * is the caller's `<Button variant="danger">`.
 *
 * Motion is productive and only productive: a short scale-and-fade on the
 * entrance easing. Expressive motion is permanently banned here, because the
 * same recipe carries every destructive confirmation. Reduced motion: none.
 *
 * Theming: the panel portals to <body>; it is themed because `data-brand` /
 * `data-theme` sit on <html> (docs/05 section 3, "Portals").
 * ------------------------------------------------------------------------- */

/* ---- glyph ---------------------------------------------------------------- */

/** Phosphor 2.1.1 `x` bold (MIT): a 16px close glyph wants the bold cut. */
function XGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z" />
    </svg>
  );
}

/** String union, so a Storyblok option value can be passed straight in. */
export type DialogVariant = 'default' | 'destructive';

/** Whether the root is modal, so the panel can say so (`aria-modal`). */
const ModalContext = React.createContext(true);

/* ---- DialogClose ---------------------------------------------------------- */

export type DialogCloseProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>;

/**
 * Closes the dialog. Use with `asChild` and a `Button`
 * (`<DialogClose asChild><Button variant="tertiary">Cancel</Button></DialogClose>`),
 * which keeps its own look and `data-slot`. In a `destructive` dialog the first
 * `DialogClose` in the footer receives focus on open.
 */
export const DialogClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  DialogCloseProps
>(function DialogClose({ asChild = false, ...props }, ref) {
  return (
    <DialogPrimitive.Close
      ref={ref}
      asChild={asChild}
      data-dialog-close=""
      // Not under asChild: the slot would overwrite the child's own
      // `data-slot="button"`, which consumers target.
      {...(asChild ? null : { 'data-slot': 'dialog-close' })}
      {...props}
    />
  );
});
DialogClose.displayName = 'DialogClose';

/* ---- DialogTrigger -------------------------------------------------------- */

export type DialogTriggerProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>;

/**
 * Opens the dialog. Use with `asChild` and a `Button`; Radix adds
 * `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` and `data-state`,
 * and focus returns here on close.
 */
export const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  DialogTriggerProps
>(function DialogTrigger({ asChild = false, ...props }, ref) {
  return (
    <DialogPrimitive.Trigger
      ref={ref}
      asChild={asChild}
      {...(asChild ? null : { 'data-slot': 'dialog-trigger' })}
      {...props}
    />
  );
});
DialogTrigger.displayName = 'DialogTrigger';

/* ---- DialogContent -------------------------------------------------------- */

export const dialogContentVariants = cva([
  // Centred with `translate` (its own property), so the entrance can animate
  // `scale` without fighting the centring transform.
  'fixed top-1/2 left-1/2 z-dialog -translate-x-1/2 -translate-y-1/2',
  // The HTML: min(520px, 100vw - 32px); under 672px, 100vw - 24px.
  'w-[min(520px,calc(100vw-32px))] max-sm:w-[calc(100vw-24px)]',
  // A tall form scrolls inside DialogBody; head and foot stay put.
  'flex max-h-[calc(100dvh-32px)] flex-col overflow-hidden',
  'rounded-xl border border-border-raised bg-surface-raised text-content shadow-overlay',
  'font-sans outline-none',
  'data-[state=open]:animate-ssx-dialog-in data-[state=closed]:animate-ssx-dialog-out',
  'motion-reduce:animate-none',
]);

export type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  /**
   * `destructive` for a confirmation that loses something ("Withdraw
   * application"): `role="alertdialog"`, a scrim click does not dismiss, and
   * focus opens on the footer's first `DialogClose` (the safe answer).
   *
   * @default 'default'
   */
  variant?: DialogVariant;
  /**
   * Draw a close (×) button in the top-right corner. The HTML's confirmations
   * have none — their footer IS the answer — so it is off by default; turn it
   * on for a form dialog whose footer has no Cancel.
   *
   * @default false
   */
  showClose?: boolean;
  /**
   * The accessible name of the × button, with `showClose`.
   *
   * @default 'Close'
   */
  closeLabel?: string;
  /**
   * Where the portal mounts. Defaults to `document.body`, which is themed by
   * the `data-brand` / `data-theme` attributes on `<html>`.
   */
  container?: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>['container'];
};

/**
 * The panel, with its scrim, in a portal. Compose `DialogHeader`,
 * `DialogBody` and `DialogFooter` inside it.
 */
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent(
  {
    className,
    variant = 'default',
    showClose = false,
    closeLabel = 'Close',
    container,
    role,
    children,
    onOpenAutoFocus,
    onPointerDownOutside,
    onInteractOutside,
    ...props
  },
  forwardedRef,
) {
  const innerRef = React.useRef<HTMLDivElement>(null);
  const ref = useComposedRefs(forwardedRef, innerRef);
  const destructive = variant === 'destructive';
  const modal = React.useContext(ModalContext);

  const handleOpenAutoFocus = (event: Event) => {
    onOpenAutoFocus?.(event);
    if (event.defaultPrevented || !destructive) return;
    // The safe answer first: the footer's first DialogClose ("Keep application").
    const safe = innerRef.current?.querySelector<HTMLElement>(
      '[data-slot="dialog-footer"] [data-dialog-close]',
    );
    if (safe) {
      event.preventDefault();
      safe.focus();
    }
  };

  // A destructive confirm is answered with a button or Escape, never a stray
  // click on the scrim.
  type OutsideEvent = Parameters<NonNullable<DialogContentProps['onPointerDownOutside']>>[0];
  const handlePointerDownOutside = (event: OutsideEvent) => {
    onPointerDownOutside?.(event);
    if (destructive) event.preventDefault();
  };
  type InteractEvent = Parameters<NonNullable<DialogContentProps['onInteractOutside']>>[0];
  const handleInteractOutside = (event: InteractEvent) => {
    onInteractOutside?.(event);
    if (destructive) event.preventDefault();
  };

  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className={cn(
          // The HTML's `.scrim`: `surface.overlayScrim`, a near-black veil in
          // BOTH modes whose alpha is in the colour (55% light, 72% dark), so it
          // is painted at full opacity. Not the inverse surface: that is light
          // in dark mode, and it turned the page grey instead of dimming it.
          'fixed inset-0 z-overlay bg-surface-overlay-scrim',
          'data-[state=open]:animate-ssx-overlay-in data-[state=closed]:animate-ssx-overlay-out',
          'motion-reduce:animate-none',
        )}
      />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="dialog-content"
        data-variant={variant}
        // The Button `neutral` contract: a raised surface flips its hover.
        data-elevation="raised"
        role={role ?? (destructive ? 'alertdialog' : 'dialog')}
        aria-modal={modal ? 'true' : undefined}
        className={cn(
          dialogContentVariants(),
          // Keep the title clear of the × button.
          showClose && '[&>[data-slot=dialog-header]]:pe-16',
          className,
        )}
        onOpenAutoFocus={handleOpenAutoFocus}
        onPointerDownOutside={handlePointerDownOutside}
        onInteractOutside={handleInteractOutside}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close asChild>
            <IconButton
              variant="neutral"
              size="sm"
              aria-label={closeLabel}
              data-dialog-close-x=""
              className="absolute top-4 right-4"
            >
              <XGlyph />
            </IconButton>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
DialogContent.displayName = 'DialogContent';

/* ---- Header / Title / Description ----------------------------------------- */

export type DialogHeaderProps = React.ComponentPropsWithoutRef<'div'> & {
  /**
   * The single status glyph beside the title and description (the HTML's
   * 32px `icon--xl`, inked by the decision's status: success for "Publish",
   * danger for "Withdraw"). Pass an `Icon` with its `tone`; it is decorative.
   */
  icon?: React.ReactNode;
};

/**
 * The head band: optional status icon, then `DialogTitle` and
 * `DialogDescription`, over a hairline.
 */
export const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(function DialogHeader(
  { className, icon, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="dialog-header"
      className={cn(
        'flex shrink-0 items-start gap-4 border-b border-border-decorative p-5',
        className,
      )}
      {...props}
    >
      {icon != null && icon !== false ? (
        <span
          data-slot="dialog-header-icon"
          aria-hidden="true"
          // A direct flex child that never shrinks (the preview's 60-organisms
          // fix), dropped 4px to sit on the title's cap height.
          className="mt-1 flex flex-none [&_svg:not([class*='size-'])]:size-icon-xl"
        >
          {icon}
        </span>
      ) : null}
      <div data-slot="dialog-header-text" className="grid min-w-0 flex-1 gap-1">
        {children}
      </div>
    </div>
  );
});
DialogHeader.displayName = 'DialogHeader';

export type DialogTitleProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;

/**
 * The dialog's name (an `h2`, the Heading `2` size). Required: Radix labels
 * the panel with it. Visually hide it if the design has no visible title.
 */
export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  DialogTitleProps
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      data-slot="dialog-title"
      className={cn(headingVariants({ size: '2' }), 'text-content', className)}
      {...props}
    />
  );
});
DialogTitle.displayName = 'DialogTitle';

export type DialogDescriptionProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>;

/**
 * What happens if the person confirms: who is affected and whether it can be
 * undone. Wired as `aria-describedby`.
 */
export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  DialogDescriptionProps
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      data-slot="dialog-description"
      className={cn(textVariants({ size: 'sm', tone: 'secondary' }), 'm-0', className)}
      {...props}
    />
  );
});
DialogDescription.displayName = 'DialogDescription';

/* ---- Body / Footer -------------------------------------------------------- */

export type DialogBodyProps = React.ComponentPropsWithoutRef<'div'>;

/** The middle band. Scrolls when the panel would outgrow the viewport. */
export const DialogBody = React.forwardRef<HTMLDivElement, DialogBodyProps>(function DialogBody(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="dialog-body"
      className={cn('min-h-0 flex-1 overflow-y-auto p-5', className)}
      {...props}
    />
  );
});
DialogBody.displayName = 'DialogBody';

export type DialogFooterProps = React.ComponentPropsWithoutRef<'div'>;

/**
 * The answer row, right-aligned: the safe answer (a `DialogClose` tertiary
 * Button) first, the committing Button last.
 */
export const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(function DialogFooter(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="dialog-footer"
      className={cn(
        'flex shrink-0 flex-wrap justify-end gap-2 border-t border-border-decorative px-5 py-4',
        className,
      )}
      {...props}
    />
  );
});
DialogFooter.displayName = 'DialogFooter';

/* ---- Dialog (root, plus the flat form) ------------------------------------ */

export type DialogProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> & {
  /**
   * Flat form. With `title` set, the Dialog builds its own trigger, header,
   * body (`children`) and footer, so a CMS blok can describe a whole dialog in
   * strings. Leave it unset for the compound API.
   */
  title?: React.ReactNode;
  /** Flat form: the line under the title, wired as `aria-describedby`. */
  description?: React.ReactNode;
  /**
   * Flat form: the button that opens the dialog. A string becomes a `Button`
   * label; an element is used as-is (it must accept a ref and `onClick`).
   */
  trigger?: React.ReactNode;
  /**
   * Flat form: the trigger Button's variant, when `trigger` is a string.
   *
   * @default 'primary', or 'danger' for a destructive dialog
   */
  triggerVariant?: ButtonVariant;
  /**
   * Flat form: `destructive` makes an `alertdialog` whose confirm button is
   * `danger` (see `DialogContent`).
   *
   * @default 'default'
   */
  variant?: DialogVariant;
  /**
   * Flat form: the safe answer, a `DialogClose`. Empty string: no cancel button.
   *
   * @default 'Cancel'
   */
  cancelLabel?: string;
  /** Flat form: the committing button's label. Unset: no confirm button. */
  confirmLabel?: string;
  /**
   * Flat form: called when the confirm button is pressed. The dialog then
   * closes, unless you call `event.preventDefault()` (to keep it open while a
   * request is in flight, with `confirmLoading`).
   */
  onConfirm?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Flat form: the confirm button is busy (`Button loading`). The dialog
   * stays open until the server answers.
   *
   * @default false
   */
  confirmLoading?: boolean;
  /**
   * Flat form: draw the × close button.
   *
   * @default false
   */
  showClose?: boolean;
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
export function Dialog({
  open: openProp,
  defaultOpen,
  onOpenChange,
  modal,
  title,
  description,
  trigger,
  triggerVariant,
  variant = 'default',
  cancelLabel = 'Cancel',
  confirmLabel,
  onConfirm,
  confirmLoading = false,
  showClose = false,
  closeLabel = 'Close',
  children,
}: DialogProps) {
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
    caller: 'Dialog',
  });

  const flat = title != null && title !== false;
  const destructive = variant === 'destructive';

  let body: React.ReactNode = children;
  if (flat) {
    const handleConfirm = (event: React.MouseEvent<HTMLButtonElement>) => {
      onConfirm?.(event);
      if (!event.defaultPrevented) setOpen(false);
    };
    body = (
      <>
        {trigger != null && trigger !== false ? (
          <DialogTrigger asChild>
            {React.isValidElement(trigger) ? (
              trigger
            ) : (
              <Button variant={triggerVariant ?? (destructive ? 'danger' : 'primary')}>{trigger}</Button>
            )}
          </DialogTrigger>
        ) : null}
        <DialogContent variant={variant} showClose={showClose} closeLabel={closeLabel}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description != null && description !== false ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          {children != null && children !== false ? <DialogBody>{children}</DialogBody> : null}
          {cancelLabel || confirmLabel ? (
            <DialogFooter>
              {cancelLabel ? (
                <DialogClose asChild>
                  <Button variant="tertiary">{cancelLabel}</Button>
                </DialogClose>
              ) : null}
              {confirmLabel ? (
                <Button
                  variant={destructive ? 'danger' : 'primary'}
                  loading={confirmLoading}
                  onClick={handleConfirm}
                >
                  {confirmLabel}
                </Button>
              ) : null}
            </DialogFooter>
          ) : null}
        </DialogContent>
      </>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen} modal={modal}>
      <ModalContext.Provider value={modal !== false}>{body}</ModalContext.Provider>
    </DialogPrimitive.Root>
  );
}
Dialog.displayName = 'Dialog';
