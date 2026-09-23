'use client';

// Client: Radix Dialog keeps open state, traps focus, locks scroll and portals.
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Button, type ButtonVariant } from '../Button';
import { IconButton } from '../IconButton';
import { Heading, headingVariants } from '../Heading';
import { textVariants } from '../Text';

/* ---------------------------------------------------------------------------
 * SideDrawer
 *
 * An edge panel for a task that needs the page kept visible behind it:
 * editing a record, filtering a list, logging a mentor session against one
 * student. It is NOT for a decision that blocks everything (that is a
 * Dialog), and not the phone-sized picker that rises from the bottom (that is
 * a BottomSheet).
 *
 *   <SideDrawer>
 *     <SideDrawerTrigger asChild><Button><Plus />Log a mentor session</Button></SideDrawerTrigger>
 *     <SideDrawerContent>
 *       <SideDrawerHeader eyebrow="Aarav Krishnan · SST-2029-0416">
 *         <SideDrawerTitle>Log a mentor session</SideDrawerTitle>
 *       </SideDrawerHeader>
 *       <SideDrawerBody><FieldSet>…</FieldSet></SideDrawerBody>
 *       <SideDrawerFooter>
 *         <SideDrawerClose asChild><Button variant="tertiary">Cancel</Button></SideDrawerClose>
 *         <Button>Save session</Button>
 *       </SideDrawerFooter>
 *     </SideDrawerContent>
 *   </SideDrawer>
 *
 * The modal contract is Dialog's, because it is the same Radix primitive:
 * focus moves in and is trapped, Escape and the scrim close it, focus returns
 * to the trigger, the page is scroll-locked and hidden from assistive tech,
 * and the panel is labelled by `SideDrawerTitle`. The scrim is the ONE modal
 * scrim, `surface.overlayScrim`, as Dialog paints it.
 *
 * Geometry is the HTML's `.drawer`: full height against the right edge (or
 * `side="left"`), min(400px, 92vw) at the default `normal` (`wide` is 800px), a hairline on the
 * inner edge, the overlay shadow, and three rows — head and foot stay put,
 * the body scrolls. Motion: a slide from the edge on the slow productive
 * in-out easing; reduced motion: none.
 *
 * Theming: the panel portals to <body>; it is themed because `data-brand` /
 * `data-theme` sit on <html>.
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

/** Whether the root is modal, so the panel can say so (`aria-modal`). */
const ModalContext = React.createContext(true);

/* ---- Trigger / Close ------------------------------------------------------ */

export type SideDrawerTriggerProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>;

/**
 * Opens the drawer. Use with `asChild` and a `Button`; Radix adds
 * `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`, and focus
 * returns here on close.
 */
export const SideDrawerTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  SideDrawerTriggerProps
>(function SideDrawerTrigger({ asChild = false, ...props }, ref) {
  return (
    <DialogPrimitive.Trigger
      ref={ref}
      asChild={asChild}
      // Not under asChild: the slot would overwrite the child's `data-slot="button"`.
      {...(asChild ? null : { 'data-slot': 'side-drawer-trigger' })}
      {...props}
    />
  );
});
SideDrawerTrigger.displayName = 'SideDrawerTrigger';

export type SideDrawerCloseProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>;

/**
 * Closes the drawer. Use with `asChild` and a `Button`
 * (`<SideDrawerClose asChild><Button variant="tertiary">Cancel</Button></SideDrawerClose>`).
 */
export const SideDrawerClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  SideDrawerCloseProps
>(function SideDrawerClose({ asChild = false, ...props }, ref) {
  return (
    <DialogPrimitive.Close
      ref={ref}
      asChild={asChild}
      data-side-drawer-close=""
      {...(asChild ? null : { 'data-slot': 'side-drawer-close' })}
      {...props}
    />
  );
});
SideDrawerClose.displayName = 'SideDrawerClose';

/* ---- Content -------------------------------------------------------------- */

export const sideDrawerContentVariants = cva(
  [
    'fixed inset-y-0 z-dialog',
    // Three rows: head and foot stay put, the body scrolls.
    'grid h-dvh grid-rows-[auto_minmax(0,1fr)_auto]',
    'border-border-raised bg-surface-raised text-content shadow-overlay',
    'font-sans outline-none',
    'motion-reduce:animate-none',
  ],
  {
    variants: {
      side: {
        right: [
          'right-0 border-l',
          'data-[state=open]:animate-ssx-drawer-in-right data-[state=closed]:animate-ssx-drawer-out-right',
        ],
        left: [
          'left-0 border-r',
          'data-[state=open]:animate-ssx-drawer-in-left data-[state=closed]:animate-ssx-drawer-out-left',
        ],
      },
      size: {
        // Two widths, by product decision (2026-09-23). `normal` is the
        // HTML's min(400px, 92vw); `wide` is exactly twice it. Both cap at
        // 92vw, so on a phone they are the same near-full-width panel.
        normal: 'w-[min(400px,92vw)]',
        wide: 'w-[min(800px,92vw)]',
      },
    },
    defaultVariants: { side: 'right', size: 'normal' },
  },
);

type SideDrawerVariantProps = VariantProps<typeof sideDrawerContentVariants>;

/** String unions, so a Storyblok option value can be passed straight in. */
export type SideDrawerSide = NonNullable<SideDrawerVariantProps['side']>;
export type SideDrawerSize = NonNullable<SideDrawerVariantProps['size']>;

export type SideDrawerContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  /**
   * The edge the panel is attached to. `right` is the HTML's; `left` is for
   * a navigation rail that collapsed into a drawer on a narrow screen.
   *
   * @default 'right'
   */
  side?: SideDrawerSide;
  /**
   * The panel's width, each capped at 92vw: `normal` 400px (the HTML's),
   * `wide` 800px — twice normal, for a review form or a two-column layout.
   *
   * @default 'normal'
   */
  size?: SideDrawerSize;
  /**
   * Where the portal mounts. Defaults to `document.body`, which is themed by
   * the `data-brand` / `data-theme` attributes on `<html>`.
   */
  container?: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>['container'];
};

/**
 * The panel, with its scrim, in a portal. Compose `SideDrawerHeader`,
 * `SideDrawerBody` and `SideDrawerFooter` inside it.
 */
export const SideDrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SideDrawerContentProps
>(function SideDrawerContent({ className, side = 'right', size = 'normal', container, ...props }, ref) {
  const modal = React.useContext(ModalContext);
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay
        data-slot="side-drawer-overlay"
        className={cn(
          // The ONE modal scrim, as Dialog paints it (alpha in the colour).
          'fixed inset-0 z-overlay bg-surface-overlay-scrim',
          'data-[state=open]:animate-ssx-overlay-in data-[state=closed]:animate-ssx-overlay-out',
          'motion-reduce:animate-none',
        )}
      />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="side-drawer-content"
        data-side={side}
        data-size={size}
        // The Button `neutral` contract: a raised surface flips its hover.
        data-elevation="raised"
        aria-modal={modal ? 'true' : undefined}
        className={cn(sideDrawerContentVariants({ side, size }), className)}
        {...props}
      />
    </DialogPrimitive.Portal>
  );
});
SideDrawerContent.displayName = 'SideDrawerContent';

/* ---- Header / Eyebrow / Title / Description ------------------------------- */

export type SideDrawerHeaderProps = React.ComponentPropsWithoutRef<'div'> & {
  /**
   * The small caps line above the title: whose record this is
   * ("Aarav Krishnan · SST-2029-0416").
   */
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
   * @default 'Close drawer'
   */
  closeLabel?: string;
};

/**
 * The head band: optional eyebrow, then `SideDrawerTitle` (and an optional
 * `SideDrawerDescription`), the × button at the end, over a hairline.
 */
export const SideDrawerHeader = React.forwardRef<HTMLDivElement, SideDrawerHeaderProps>(
  function SideDrawerHeader(
    { className, eyebrow, showClose = true, closeLabel = 'Close drawer', children, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        data-slot="side-drawer-header"
        className={cn('flex items-start gap-4 border-b border-border-decorative p-5', className)}
        {...props}
      >
        <div data-slot="side-drawer-header-text" className="grid min-w-0 flex-1 gap-1">
          {isRendered(eyebrow) ? (
            <Heading as="p" size="eyebrow" data-slot="side-drawer-eyebrow" className="m-0">
              {eyebrow}
            </Heading>
          ) : null}
          {children}
        </div>
        {showClose ? (
          <DialogPrimitive.Close asChild>
            <IconButton variant="tertiary" aria-label={closeLabel} data-side-drawer-close-x="">
              <XGlyph />
            </IconButton>
          </DialogPrimitive.Close>
        ) : null}
      </div>
    );
  },
);
SideDrawerHeader.displayName = 'SideDrawerHeader';

export type SideDrawerTitleProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;

/**
 * The drawer's name (an `h2`, the Heading `2` size). Required: Radix labels
 * the panel with it.
 */
export const SideDrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  SideDrawerTitleProps
>(function SideDrawerTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      data-slot="side-drawer-title"
      className={cn(headingVariants({ size: '2' }), 'm-0 text-content', className)}
      {...props}
    />
  );
});
SideDrawerTitle.displayName = 'SideDrawerTitle';

export type SideDrawerDescriptionProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>;

/** An optional line under the title, wired as `aria-describedby`. */
export const SideDrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  SideDrawerDescriptionProps
>(function SideDrawerDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      data-slot="side-drawer-description"
      className={cn(textVariants({ size: 'sm', tone: 'secondary' }), 'm-0', className)}
      {...props}
    />
  );
});
SideDrawerDescription.displayName = 'SideDrawerDescription';

/* ---- Body / Footer -------------------------------------------------------- */

export type SideDrawerBodyProps = React.ComponentPropsWithoutRef<'div'>;

/** The middle row. It scrolls; the head and foot do not. */
export const SideDrawerBody = React.forwardRef<HTMLDivElement, SideDrawerBodyProps>(function SideDrawerBody(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="side-drawer-body"
      className={cn('min-h-0 overflow-y-auto p-5', className)}
      {...props}
    />
  );
});
SideDrawerBody.displayName = 'SideDrawerBody';

export type SideDrawerFooterProps = React.ComponentPropsWithoutRef<'div'>;

/**
 * The action row, right-aligned: the safe answer (a `SideDrawerClose`
 * tertiary Button) first, the committing Button last.
 */
export const SideDrawerFooter = React.forwardRef<HTMLDivElement, SideDrawerFooterProps>(
  function SideDrawerFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="side-drawer-footer"
        className={cn(
          'flex flex-wrap justify-end gap-2 border-t border-border-decorative px-5 py-4',
          className,
        )}
        {...props}
      />
    );
  },
);
SideDrawerFooter.displayName = 'SideDrawerFooter';

/* ---- SideDrawer (root, plus the flat form) -------------------------------- */

export type SideDrawerProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> & {
  /**
   * Flat form. With `title` set, the drawer builds its own trigger, header,
   * body (`children`) and footer, so a CMS blok can describe a whole drawer in
   * strings. Leave it unset for the compound API.
   */
  title?: React.ReactNode;
  /** Flat form: the small caps line above the title. */
  eyebrow?: React.ReactNode;
  /** Flat form: an optional line under the title, wired as `aria-describedby`. */
  description?: React.ReactNode;
  /**
   * Flat form: the button that opens the drawer. A string becomes a `Button`
   * label; an element is used as-is (it must accept a ref and `onClick`).
   */
  trigger?: React.ReactNode;
  /**
   * Flat form: the trigger Button's variant, when `trigger` is a string.
   *
   * @default 'primary'
   */
  triggerVariant?: ButtonVariant;
  /**
   * Flat form: the edge the panel is attached to.
   *
   * @default 'right'
   */
  side?: SideDrawerSide;
  /**
   * Flat form: the panel's width, `normal` (400px) or `wide` (800px).
   *
   * @default 'normal'
   */
  size?: SideDrawerSize;
  /**
   * Flat form: the safe answer in the footer, a `SideDrawerClose`. Empty
   * string: no cancel button.
   *
   * @default 'Cancel'
   */
  cancelLabel?: string;
  /** Flat form: the committing button's label. Unset: no confirm button. */
  confirmLabel?: string;
  /**
   * Flat form: called when the confirm button is pressed. The drawer then
   * closes, unless you call `event.preventDefault()` (to keep it open while a
   * request is in flight, with `confirmLoading`).
   */
  onConfirm?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Flat form: the confirm button is busy (`Button loading`).
   *
   * @default false
   */
  confirmLoading?: boolean;
  /**
   * Flat form: the × button's accessible name.
   *
   * @default 'Close drawer'
   */
  closeLabel?: string;
};

/**
 * The state holder (`open` / `defaultOpen` / `onOpenChange`, `modal`). In the
 * compound API it renders no DOM of its own.
 */
export function SideDrawer({
  open: openProp,
  defaultOpen,
  onOpenChange,
  modal,
  title,
  eyebrow,
  description,
  trigger,
  triggerVariant = 'primary',
  side = 'right',
  size = 'normal',
  cancelLabel = 'Cancel',
  confirmLabel,
  onConfirm,
  confirmLoading = false,
  closeLabel = 'Close drawer',
  children,
}: SideDrawerProps) {
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
    caller: 'SideDrawer',
  });

  let body: React.ReactNode = children;
  if (isRendered(title)) {
    const handleConfirm = (event: React.MouseEvent<HTMLButtonElement>) => {
      onConfirm?.(event);
      if (!event.defaultPrevented) setOpen(false);
    };
    body = (
      <>
        {isRendered(trigger) ? (
          <SideDrawerTrigger asChild>
            {React.isValidElement(trigger) ? trigger : <Button variant={triggerVariant}>{trigger}</Button>}
          </SideDrawerTrigger>
        ) : null}
        <SideDrawerContent side={side} size={size}>
          <SideDrawerHeader eyebrow={eyebrow} closeLabel={closeLabel}>
            <SideDrawerTitle>{title}</SideDrawerTitle>
            {isRendered(description) ? <SideDrawerDescription>{description}</SideDrawerDescription> : null}
          </SideDrawerHeader>
          <SideDrawerBody>{children}</SideDrawerBody>
          {cancelLabel || confirmLabel ? (
            <SideDrawerFooter>
              {cancelLabel ? (
                <SideDrawerClose asChild>
                  <Button variant="tertiary">{cancelLabel}</Button>
                </SideDrawerClose>
              ) : null}
              {confirmLabel ? (
                <Button loading={confirmLoading} onClick={handleConfirm}>
                  {confirmLabel}
                </Button>
              ) : null}
            </SideDrawerFooter>
          ) : null}
        </SideDrawerContent>
      </>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen} modal={modal}>
      <ModalContext.Provider value={modal !== false}>{body}</ModalContext.Provider>
    </DialogPrimitive.Root>
  );
}
SideDrawer.displayName = 'SideDrawer';
