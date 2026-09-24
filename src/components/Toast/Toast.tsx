'use client';

// Client: Radix Toast keeps state, runs the timers, swipe and hotkey, and
// portals; Toaster subscribes to the toast() store from an effect.
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { closeToast, subscribe, type ToastRecord, type ToastVariant } from './toast-store';

/* ---------------------------------------------------------------------------
 * Toast
 *
 * A short, self-dismissing RECEIPT for something the system just did as the
 * result of a user action. Never for anything the user must read, act on, or
 * copy down — that is an Alert or a Dialog. If a student would ever need the
 * message again (a payment reference, a rejection reason, a deadline change)
 * it must also exist somewhere permanent.
 *
 * Two ways to use it:
 *
 *   // 1. Imperative: mount one <Toaster /> near the root, call toast() anywhere.
 *   <Toaster />
 *   toast.success('Assignment submitted', { description: 'DSA Week 6 · 2 minutes early.' });
 *
 *   // 2. Declarative: your own state, inside a ToastProvider + ToastViewport.
 *   <ToastProvider>
 *     <Toast variant="danger" title="Upload failed" open={open} onOpenChange={setOpen} />
 *     <ToastViewport />
 *   </ToastProvider>
 *
 * The preview's contract:
 *   - Enters bottom-right (`toastIn`), dismisses itself after 4.2s, stacks.
 *     Newest at the bottom; at most three visible (one on a screen under
 *     500px tall); full width with 16px gutters below 672px; the gutters grow
 *     by the notch / home-bar safe-area insets.
 *   - A status glyph (20px, the status content ink), a semibold title, a
 *     secondary description, and a NEUTRAL dismiss pinned to the top-right
 *     corner (never brand-inked: it is not the subject of the message), named
 *     "Dismiss: <title>".
 *   - Politeness per status: success / info / warning are polite (the HTML's
 *     `role="status"`), danger is assertive (the HTML's `role="alert"`), so a
 *     screen reader interrupts for a failure. Radix announces through its own
 *     visually hidden live region (`aria-live="polite" | "assertive"`) a frame
 *     after the toast mounts — a live region filled in the tick it is inserted
 *     is skipped by several screen readers — so the `<li>` itself carries no
 *     role; putting one on it too would announce everything twice.
 *   - Paused while hovered or focused (and while the window is blurred);
 *     swipe right to dismiss; Escape dismisses; F8 jumps to the region.
 *
 * Theming: the viewport portals to <body>; it is themed because `data-brand` /
 * `data-theme` sit on <html> (docs/05 section 3, "Portals").
 * ------------------------------------------------------------------------- */

/** The preview's auto-dismiss (shell.js: 4200ms). */
const DURATION = 4200;

/* ---- glyphs (Phosphor 2.1.1, MIT; the preview sprite's ids) ---------------- */

const GLYPH_PATHS: Record<ToastVariant, string> = {
  // ph-success-fill (check-circle fill)
  success:
    'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z',
  // ph-info-fill
  info: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z',
  // ph-warning-fill
  warning:
    'M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z',
  // ph-error-fill (warning-circle fill)
  danger:
    'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z',
};

function StatusGlyph({ variant }: { variant: ToastVariant }) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d={GLYPH_PATHS[variant]} />
    </svg>
  );
}

/** Phosphor `x` bold (the preview's `ph-close-bold`): a 16px glyph wants the bold cut. */
function XGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z" />
    </svg>
  );
}

/* ---- Provider / Viewport -------------------------------------------------- */

/** The direction a toast is swiped to dismiss it. */
export type ToastSwipeDirection = 'right' | 'left' | 'up' | 'down';

export type ToastProviderProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Provider> & {
  /**
   * How long each toast stays, in ms, unless it sets its own. Paused while
   * the region is hovered or focused.
   *
   * @default 4200
   */
  duration?: number;
  /**
   * The swipe that dismisses. `right`, because the stack sits bottom-right.
   *
   * @default 'right'
   */
  swipeDirection?: ToastSwipeDirection;
  /**
   * Prefix for the region's accessible name and each announcement. Localise it.
   *
   * @default 'Notification'
   */
  label?: string;
};

/** Owns the timers, swipe and hotkey for every Toast and ToastViewport inside it. */
export function ToastProvider({
  duration = DURATION,
  swipeDirection = 'right',
  label = 'Notification',
  ...props
}: ToastProviderProps) {
  return <ToastPrimitive.Provider duration={duration} swipeDirection={swipeDirection} label={label} {...props} />;
}
ToastProvider.displayName = 'ToastProvider';

export type ToastViewportProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport> & {
  /**
   * The region's accessible name; `{hotkey}` is replaced with the hotkey.
   *
   * @default 'Notifications ({hotkey})'
   */
  label?: string;
  /**
   * Where the portal mounts. Defaults to `document.body`, which is themed by
   * the `data-brand` / `data-theme` attributes on `<html>`. `null` renders it
   * in place.
   */
  container?: Element | DocumentFragment | null;
};

/**
 * The stack (`.toastStack`): fixed bottom-right, 24px from the corner, 12px
 * between toasts, newest last. A labelled `region` (F8 focuses it). Renders
 * nothing on the server; it mounts on the client.
 */
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  ToastViewportProps
>(function ToastViewport({ className, label = 'Notifications ({hotkey})', container, ...props }, ref) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const viewport = (
    <ToastPrimitive.Viewport
      ref={ref}
      data-slot="toast-viewport"
      label={label}
      className={cn(
        // Anchored to the bottom-right corner of the screen. The 24px gutter
        // is PADDING, not an offset, so the stack can scroll (below) while a
        // toast swiped away still travels to the glass instead of being cut
        // off 24px short. The padding is click-through; only toasts take the
        // pointer.
        'fixed right-0 bottom-0 z-toast m-0 grid list-none content-end gap-3 outline-none',
        'pointer-events-none [&>*]:pointer-events-auto',
        // Notch and home bar: the gutter grows by the safe-area inset (0 on a
        // screen without one, or when the page has no viewport-fit=cover).
        'pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pl-6',
        'pr-[calc(1.5rem+env(safe-area-inset-right,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]',
        // Narrow screens: full width, 16px gutters (a 320px toast would not fit).
        'max-sm:left-0 max-sm:pt-[calc(1rem+env(safe-area-inset-top,0px))]',
        'max-sm:pr-[calc(1rem+env(safe-area-inset-right,0px))] max-sm:pl-[calc(1rem+env(safe-area-inset-left,0px))]',
        'max-sm:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]',
        // Never taller than the screen (dvh where supported, so the mobile
        // browser bars do not hide the newest toast; vh otherwise). An
        // over-tall stack scrolls inside itself instead of running off the top.
        'max-h-screen supports-[height:100dvh]:max-h-dvh overflow-y-auto overscroll-contain',
        // At most three visible, the NEWEST (a toast mounts at the end, which
        // is the bottom, nearest the anchor corner); older ones are hidden
        // until newer ones leave. On a short screen (a landscape phone, under
        // 500px tall) only the newest one shows, so the stack never covers
        // the page's own actions.
        '[&>li:nth-last-child(n+4)]:hidden',
        '[@media(max-height:499px)]:[&>li:nth-last-child(n+2)]:hidden',
        className,
      )}
      {...props}
    />
  );

  if (container === null) return viewport;
  if (!mounted) return null;
  return ReactDOM.createPortal(viewport, container ?? document.body);
});
ToastViewport.displayName = 'ToastViewport';

/* ---- Toast ---------------------------------------------------------------- */

export const toastVariants = cva(
  [
    'group/toast relative flex items-start gap-3 p-4',
    'min-w-[min(20rem,calc(100vw-2rem))] max-w-[min(26.25rem,calc(100vw-2rem))] max-sm:max-w-none',
    'rounded-lg border border-border-raised bg-surface-raised text-content shadow-raised',
    'font-sans outline-none',
    'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-border-focus',
    // Reserve the gutter only where a dismiss sits.
    'data-[dismissible]:pe-10',
    // Enter / exit, and the swipe (Radix sets the data-swipe state and the
    // --radix-toast-swipe-* offsets).
    'data-[state=open]:animate-ssx-toast-in data-[state=closed]:animate-ssx-toast-out',
    'data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x)',
    'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[translate]',
    'data-[swipe=cancel]:duration-[var(--motion-duration-fast)] data-[swipe=cancel]:ease-productive-in-out',
    'data-[swipe=end]:animate-ssx-toast-swipe-out',
    'motion-reduce:animate-none motion-reduce:transition-none',
  ],
  {
    variants: {
      variant: {
        // The surface is the same for every status; only the glyph's ink
        // (ICON_INK) and the announcement change.
        success: '',
        info: '',
        warning: '',
        danger: '',
      },
    },
    defaultVariants: { variant: 'info' },
  },
);

const ICON_INK: Record<ToastVariant, string> = {
  success: 'text-success-content',
  info: 'text-info-content',
  warning: 'text-warning-content',
  danger: 'text-danger-content',
};

export type ToastProps = Omit<React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>, 'title'> & {
  /**
   * The status: the glyph and its ink, and how it is announced — `danger`
   * assertively (it interrupts), the others politely.
   *
   * @default 'info'
   */
  variant?: ToastVariant;
  /**
   * The headline ("Assignment submitted"), rendered as a `ToastTitle`. Or
   * compose `ToastTitle` yourself as a child.
   */
  title?: React.ReactNode;
  /** The supporting line, rendered as a `ToastDescription`. */
  description?: React.ReactNode;
  /**
   * Replace the status glyph (a Phosphor `fill` svg), or `false` for none.
   * Decorative: the title carries the meaning.
   */
  icon?: React.ReactNode;
  /**
   * Draw the × dismiss in the top-right corner.
   *
   * @default true
   */
  dismissible?: boolean;
  /**
   * The dismiss button's accessible name. Defaults to "Dismiss: <title>"
   * when `title` is a string, else "Dismiss".
   */
  dismissLabel?: string;
};

/**
 * One toast (an `<li>` in the viewport's list). Controlled with `open` /
 * `onOpenChange`, or uncontrolled (`defaultOpen`, true). `duration` overrides
 * the provider's.
 */
export const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Root>, ToastProps>(
  function Toast(
    {
      className,
      variant = 'info',
      title,
      description,
      icon,
      dismissible = true,
      dismissLabel,
      type,
      children,
      ...props
    },
    ref,
  ) {
    const closeName =
      dismissLabel ?? (typeof title === 'string' && title ? `Dismiss: ${title}` : 'Dismiss');
    const glyph = icon === undefined ? <StatusGlyph variant={variant} /> : icon;
    return (
      <ToastPrimitive.Root
        ref={ref}
        data-slot="toast"
        data-variant={variant}
        data-dismissible={dismissible ? '' : undefined}
        // The Button `neutral` contract: a raised surface flips its hover.
        data-elevation="raised"
        // foreground = aria-live="assertive"; background = "polite".
        type={type ?? (variant === 'danger' ? 'foreground' : 'background')}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        {glyph !== false && glyph != null ? (
          <span
            data-slot="toast-icon"
            aria-hidden="true"
            className={cn(
              // 20px glyph nudged onto the title's optical centre (the HTML's
              // `.toast > .icon { margin-top: --space-0-5 }`).
              'mt-0.5 flex shrink-0 [&_svg]:pointer-events-none',
              "[&_svg:not([class*='size-'])]:size-icon-md",
              ICON_INK[variant],
            )}
          >
            {glyph}
          </span>
        ) : null}
        <div data-slot="toast-body" className="grid min-w-0 flex-1 gap-0.5">
          {title != null && title !== false ? <ToastTitle>{title}</ToastTitle> : null}
          {description != null && description !== false ? (
            <ToastDescription>{description}</ToastDescription>
          ) : null}
          {children}
        </div>
        {dismissible ? (
          <ToastPrimitive.Close asChild>
            <IconButton
              variant="neutral"
              size="sm"
              aria-label={closeName}
              data-toast-dismiss=""
              className="absolute top-2 right-2"
            >
              <XGlyph />
            </IconButton>
          </ToastPrimitive.Close>
        ) : null}
      </ToastPrimitive.Root>
    );
  },
);
Toast.displayName = 'Toast';

/* ---- Title / Description / Action / Close --------------------------------- */

export type ToastTitleProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>;

/** The headline (`.alert__title`): 15px semibold, primary ink. */
export const ToastTitle = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Title>, ToastTitleProps>(
  function ToastTitle({ className, ...props }, ref) {
    return (
      <ToastPrimitive.Title
        ref={ref}
        data-slot="toast-title"
        className={cn('text-base leading-body font-semibold text-content', className)}
        {...props}
      />
    );
  },
);
ToastTitle.displayName = 'ToastTitle';

export type ToastDescriptionProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>;

/** The supporting line (`.alert__text.txt--secondary`): 13px, secondary ink. */
export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  ToastDescriptionProps
>(function ToastDescription({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Description
      ref={ref}
      data-slot="toast-description"
      className={cn('text-sm leading-body text-content-secondary', className)}
      {...props}
    />
  );
});
ToastDescription.displayName = 'ToastDescription';

export type ToastActionProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action> & {
  /**
   * What a screen reader user is told to do instead, since focus is never
   * moved into a toast ("Go to Uploads to retry"). Required by Radix.
   */
  altText: string;
};

/**
 * The one optional action ("Undo", "Retry"): a small tertiary `Button` under
 * the text; it closes the toast. A toast is a receipt, so the action must
 * also be reachable somewhere permanent. `asChild` to render your own control.
 */
export const ToastAction = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Action>, ToastActionProps>(
  function ToastAction({ className, asChild = false, children, ...props }, ref) {
    return (
      <ToastPrimitive.Action ref={ref} asChild className={asChild ? className : undefined} {...props}>
        {asChild ? (
          children
        ) : (
          <Button
            variant="tertiary"
            size="sm"
            data-toast-action=""
            className={cn('mt-2 -ms-3 justify-self-start', className)}
          >
            {children}
          </Button>
        )}
      </ToastPrimitive.Action>
    );
  },
);
ToastAction.displayName = 'ToastAction';

export type ToastCloseProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>;

/**
 * Any control that closes its toast. The built-in × is already one; use this
 * for a custom dismiss with `dismissible={false}`.
 */
export const ToastClose = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Close>, ToastCloseProps>(
  function ToastClose({ asChild = false, ...props }, ref) {
    return (
      <ToastPrimitive.Close
        ref={ref}
        asChild={asChild}
        {...(asChild ? null : { 'data-slot': 'toast-close' })}
        {...props}
      />
    );
  },
);
ToastClose.displayName = 'ToastClose';

/* ---- Toaster -------------------------------------------------------------- */

export type ToasterProps = Omit<ToastProviderProps, 'children'> & {
  /** Props for the viewport (`className`, `label`, `container`, `hotkey`). */
  viewportProps?: ToastViewportProps;
};

/**
 * The imperative host: mount ONE near the app root (client side), then call
 * `toast()` from anywhere. Renders the provider, every live toast, and the
 * viewport. React 16-safe: it subscribes to the store from an effect.
 */
export function Toaster({ viewportProps, ...providerProps }: ToasterProps) {
  const [items, setItems] = React.useState<ToastRecord[]>([]);
  React.useEffect(() => subscribe(setItems), []);

  return (
    <ToastProvider {...providerProps}>
      {items.map((t) => (
        <Toast
          key={`${t.id}:${t.version}`}
          variant={t.variant}
          title={t.title}
          description={t.description}
          duration={t.duration}
          open={t.open}
          onOpenChange={(open) => {
            if (!open) closeToast(t.id);
          }}
        >
          {t.action ? (
            <ToastAction altText={t.action.altText ?? t.action.label} onClick={t.action.onClick}>
              {t.action.label}
            </ToastAction>
          ) : null}
        </Toast>
      ))}
      <ToastViewport {...viewportProps} />
    </ToastProvider>
  );
}
Toaster.displayName = 'Toaster';
