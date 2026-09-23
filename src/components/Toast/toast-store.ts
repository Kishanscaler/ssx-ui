import type * as React from 'react';

/* ---------------------------------------------------------------------------
 * toast() — the imperative half of <Toaster />
 *
 * A module-level list and a set of listeners. `<Toaster />` subscribes from an
 * effect and copies the list into its own state, so this works on React 16.12
 * (no `useSyncExternalStore`). No hooks, no DOM: importable from any module,
 * and a call made before a Toaster mounts is queued in the list and shown when
 * it does. Server: nothing subscribes, so a stray call is inert.
 * ------------------------------------------------------------------------- */

/** String union, so a Storyblok option value can be passed straight in. */
export type ToastVariant = 'success' | 'info' | 'warning' | 'danger';

export type ToastActionOptions = {
  /** The button's visible label ("Undo", "Retry"). */
  label: string;
  /**
   * What a screen reader user is told to do instead, since focus is never
   * moved into a toast ("Go to Uploads to retry"). Defaults to `label`.
   */
  altText?: string;
  /** Runs on click; the toast then closes. */
  onClick: () => void;
};

export type ToastOptions = {
  /** Pass to replace a toast that is already showing instead of stacking a new one. */
  id?: string;
  /**
   * The status. `danger` is announced assertively (it interrupts); the
   * others politely.
   *
   * @default 'info'
   */
  variant?: ToastVariant;
  /** The one-line headline ("Assignment submitted"). */
  title: React.ReactNode;
  /** The supporting line. */
  description?: React.ReactNode;
  /** One optional action. A toast is a receipt: never the only way to do it. */
  action?: ToastActionOptions;
  /**
   * How long it stays, in ms (paused while hovered or focused).
   * `Infinity` keeps it until dismissed.
   *
   * @default the Toaster's `duration` (4200)
   */
  duration?: number;
  /** Called when the toast closes, by time-out, swipe, Escape or dismiss. */
  onDismiss?: () => void;
};

/** @internal `version` changes when an id is re-used, so the toast re-enters with a fresh timer. */
export type ToastRecord = ToastOptions & { id: string; open: boolean; version: number };

type Listener = (toasts: ToastRecord[]) => void;

let toasts: ToastRecord[] = [];
const listeners = new Set<Listener>();
let counter = 0;

/** How long a closed record is kept so its exit animation can play. */
const REMOVE_AFTER = 1000;

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

/** @internal Subscribes a Toaster; returns the unsubscribe. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

/** @internal Marks a toast closed (its exit animation plays), then forgets it. */
export function closeToast(id: string) {
  let closed: ToastRecord | undefined;
  toasts = toasts.map((t) => {
    if (t.id !== id || !t.open) return t;
    closed = t;
    return { ...t, open: false };
  });
  if (!closed) return;
  emit();
  closed.onDismiss?.();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id || t.open);
    emit();
  }, REMOVE_AFTER);
}

function show(options: ToastOptions): string {
  const id = options.id ?? `ssx-toast-${++counter}`;
  const record: ToastRecord = { variant: 'info', ...options, id, open: true, version: ++counter };
  const exists = toasts.some((t) => t.id === id);
  toasts = exists ? toasts.map((t) => (t.id === id ? record : t)) : [...toasts, record];
  emit();
  return id;
}

type Shorthand = (title: React.ReactNode, options?: Omit<ToastOptions, 'title' | 'variant'>) => string;

type ToastFn = ((options: ToastOptions) => string) & {
  success: Shorthand;
  info: Shorthand;
  warning: Shorthand;
  danger: Shorthand;
  /** Closes one toast by id, or every toast when called with none. */
  dismiss: (id?: string) => void;
};

const shorthand =
  (variant: ToastVariant): Shorthand =>
  (title, options) =>
    show({ ...options, title, variant });

/**
 * Shows a toast in the nearest mounted `<Toaster />` and returns its id.
 *
 *   toast({ variant: 'success', title: 'Assignment submitted', description: 'DSA Week 6' });
 *   toast.danger('Upload failed', { description: 'transcript.pdf exceeds the 10 MB limit.' });
 *   toast.dismiss(id);
 */
export const toast: ToastFn = Object.assign(show, {
  success: shorthand('success'),
  info: shorthand('info'),
  warning: shorthand('warning'),
  danger: shorthand('danger'),
  dismiss: (id?: string) => {
    const ids = id == null ? toasts.filter((t) => t.open).map((t) => t.id) : [id];
    ids.forEach(closeToast);
  },
});

/** @internal Test helper: forgets every toast without animating. */
export function resetToasts() {
  toasts = [];
  emit();
}
