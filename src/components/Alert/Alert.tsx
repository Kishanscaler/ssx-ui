'use client';

// Client: Alert owns its dismissed state and attaches the dismiss handler (and
// it renders IconButton / Button, which are client).
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { CloseGlyph, STATUS_GLYPH } from './status-glyphs';

/* ---------------------------------------------------------------------------
 * Alert
 *
 * An inline, SCOPED status message: it belongs to the region it sits in (the
 * form it blocks, the card it annotates). Rounded, bordered on all four sides,
 * tinted by its tone. Not a Banner: a message that is true of the whole page
 * or session is a Banner, and three Alerts stacked at the top of a page are a
 * sign that one of them is. Not a Toast: an Alert does not float or expire.
 *
 * Status is never colour alone: each tone has its own glyph shape, and the
 * title names the state.
 *
 * ROLE. `danger` renders `role="alert"` (assertive: interrupts the screen
 * reader). Every softer tone renders `role="status"` (polite: read at the next
 * pause). Pass `role` to override, e.g. `role="alert"` on a warning that blocks
 * a submit, or `role="note"` for a static annotation that should not be
 * announced at all. A live role only announces a CHANGE:
 * an Alert that is in the server HTML is read in document order, not
 * announced; one that appears after an action is announced.
 *
 * Two ways to write it, which render the same DOM:
 *
 *   <Alert tone="warning" title="Fee due in 6 days" description="₹2,75,000 by 30 Nov." />
 *
 *   <Alert tone="warning">
 *     <AlertTitle>Fee due in 6 days</AlertTitle>
 *     <AlertDescription>₹2,75,000 by 30 Nov. <Link href="/pay">Pay now</Link></AlertDescription>
 *     <AlertActions><Button size="sm" variant="secondary">Pay now</Button></AlertActions>
 *   </Alert>
 *
 * The flat fields (`title`, `description`, `actionLabel` + `actionHref`,
 * `dismissible`) map one-to-one onto a Storyblok blok. Compound parts passed
 * as children render after the flat ones.
 *
 * DISMISS. `dismissible` adds a close control pinned to the top-right corner
 * (the Toast's geometry: the 16px glyph lands on the 16px content inset). It
 * uses Button's `neutral` variant, not the HTML's `tertiary`: a control that
 * REMOVES the message must not be the most saturated thing in it (brand-blue
 * or brand-green on a red alert). Clicking it hides the Alert and calls
 * `onDismiss`; call `event.preventDefault()` there to keep it (controlled use),
 * and move focus somewhere sensible yourself if the alert held it.
 * ------------------------------------------------------------------------- */

export const alertVariants = cva(
  [
    'relative flex items-start gap-3 rounded-lg border p-4',
    'font-sans text-left',
    // The status glyph: 20px, one step above the 15px title.
    "[&>[data-slot=alert-icon]_svg:not([class*='size-'])]:size-icon-md",
  ],
  {
    variants: {
      tone: {
        info: 'border-info-border bg-info-surface text-info-content',
        success: 'border-success-border bg-success-surface text-success-content',
        warning: 'border-warning-border bg-warning-surface text-warning-content',
        danger: 'border-danger-border bg-danger-surface text-danger-content',
      },
    },
    defaultVariants: { tone: 'info' },
  },
);

type AlertVariantProps = VariantProps<typeof alertVariants>;

/** String union, so a Storyblok option value can be passed straight in. */
export type AlertTone = NonNullable<AlertVariantProps['tone']>;

/** The live-region role each tone gets unless `role` is passed. */
export const ALERT_ROLE: Record<AlertTone, 'alert' | 'status'> = {
  info: 'status',
  success: 'status',
  warning: 'status',
  danger: 'alert',
};

/* ---- parts ---------------------------------------------------------------- */

export type AlertTitleProps = React.HTMLAttributes<HTMLDivElement>;

/** The one-line state name, semibold 15px. Not a heading: an alert is not an outline entry. */
export const AlertTitle = React.forwardRef<HTMLDivElement, AlertTitleProps>(function AlertTitle(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="alert-title"
      className={cn('text-base leading-body font-semibold', className)}
      {...props}
    />
  );
});
AlertTitle.displayName = 'AlertTitle';

export type AlertDescriptionProps = React.HTMLAttributes<HTMLDivElement>;

/** The detail under the title, 13px. Inline `Link`s are fine here. */
export const AlertDescription = React.forwardRef<HTMLDivElement, AlertDescriptionProps>(
  function AlertDescription({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="alert-description"
        className={cn('text-sm leading-body', className)}
        {...props}
      />
    );
  },
);
AlertDescription.displayName = 'AlertDescription';

export type AlertActionsProps = React.HTMLAttributes<HTMLDivElement>;

/** A row of actions under the text. Use `Button size="sm" variant="secondary"`. */
export const AlertActions = React.forwardRef<HTMLDivElement, AlertActionsProps>(
  function AlertActions({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="alert-actions"
        className={cn('flex flex-wrap items-center gap-2', className)}
        {...props}
      />
    );
  },
);
AlertActions.displayName = 'AlertActions';

/* ---- root ----------------------------------------------------------------- */

export type AlertProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> &
  AlertVariantProps & {
    /**
     * `info` news or a neutral heads-up · `success` something went right ·
     * `warning` something needs doing soon · `danger` something failed or is
     * blocked. Also picks the default glyph and the live-region role.
     *
     * @default 'info'
     */
    tone?: AlertTone;
    /** The state, in words: "Document rejected · Class XII marksheet". Renders an `AlertTitle`. */
    title?: React.ReactNode;
    /** The detail: what happened and what to do. Renders an `AlertDescription`. */
    description?: React.ReactNode;
    /**
     * The leading glyph. Unset: the tone's built-in status glyph (info,
     * check-circle, warning, error). Pass your own svg to replace it, or
     * `false` for a text-only alert.
     *
     * @default the tone's glyph
     */
    icon?: React.ReactNode;
    /**
     * An action element under the text, rendered in `AlertActions`. Wins over
     * `actionLabel`.
     */
    action?: React.ReactNode;
    /**
     * Flat action: the label of a small secondary button under the text.
     * With `actionHref` it is a link; otherwise a button calling `onAction`.
     */
    actionLabel?: string;
    /** Flat action: where `actionLabel` goes. */
    actionHref?: string;
    /** Flat action: called when the `actionLabel` button is clicked (no `actionHref`). */
    onAction?: React.MouseEventHandler<HTMLButtonElement>;
    /**
     * Show a close control. Clicking it hides the Alert and calls `onDismiss`.
     *
     * @default false
     */
    dismissible?: boolean;
    /**
     * The close control's accessible name. Name the object when a page can
     * hold more than one: "Dismiss the document rejection message".
     *
     * @default 'Dismiss'
     */
    dismissLabel?: string;
    /**
     * Called when the close control is clicked, before the Alert hides.
     * `event.preventDefault()` keeps it on screen (controlled use).
     */
    onDismiss?: React.MouseEventHandler<HTMLButtonElement>;
  };

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    className,
    tone = 'info',
    title,
    description,
    icon,
    action,
    actionLabel,
    actionHref,
    onAction,
    dismissible = false,
    dismissLabel = 'Dismiss',
    onDismiss,
    role,
    children,
    ...props
  },
  ref,
) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  const Glyph = STATUS_GLYPH[tone] ?? STATUS_GLYPH.info;
  const glyph = icon === undefined || icon === true ? <Glyph /> : icon;
  const hasGlyph = glyph != null && glyph !== false && glyph !== '';

  const flatAction =
    action ??
    (actionLabel ? (
      actionHref ? (
        <Button asChild variant="secondary" size="sm">
          <a href={actionHref}>{actionLabel}</a>
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )
    ) : null);

  const handleDismiss = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onDismiss) onDismiss(event);
    if (!event.defaultPrevented) setDismissed(true);
  };

  return (
    <div
      ref={ref}
      data-slot="alert"
      data-tone={tone}
      role={role ?? ALERT_ROLE[tone] ?? 'status'}
      className={cn(alertVariants({ tone }), dismissible && 'pr-10', className)}
      {...props}
    >
      {hasGlyph ? (
        <span data-slot="alert-icon" aria-hidden="true" className="flex shrink-0 pt-px">
          {glyph}
        </span>
      ) : null}
      <div data-slot="alert-body" className="grid min-w-0 flex-1 gap-1">
        {title != null && title !== '' ? <AlertTitle>{title}</AlertTitle> : null}
        {description != null && description !== '' ? (
          <AlertDescription>{description}</AlertDescription>
        ) : null}
        {children}
        {flatAction ? <AlertActions>{flatAction}</AlertActions> : null}
      </div>
      {dismissible ? (
        <IconButton
          data-slot="alert-dismiss"
          variant="neutral"
          size="sm"
          aria-label={dismissLabel}
          onClick={handleDismiss}
          className="absolute top-2 right-2"
        >
          <CloseGlyph />
        </IconButton>
      ) : null}
    </div>
  );
});
Alert.displayName = 'Alert';
