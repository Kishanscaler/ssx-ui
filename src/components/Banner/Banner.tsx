'use client';

// Client: Banner owns its dismissed state and attaches the dismiss handler (and
// it renders IconButton / Button, which are client).
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { CloseGlyph, STATUS_GLYPH } from '../Alert/status-glyphs';

/* ---------------------------------------------------------------------------
 * Banner
 *
 * A PAGE-level notice: edge to edge above the content, true of the whole
 * session or account (an outage, a deadline, an impersonation notice). Square
 * corners and one hairline along the bottom. One at a time; never feedback
 * about a single control (that is an Alert, rounded and scoped to its region).
 * If the message would still make sense on a different page of the product,
 * it is a Banner.
 *
 * Its tones are its own, not Alert's: `info`, `success`, `warning`, `danger`,
 * plus `brand` for product news, which has no status meaning at all.
 *
 * ROLE. `danger` renders `role="alert"`; every other tone `role="status"`.
 * Pass `role` to override.
 *
 * THE CTA is a small SECONDARY button (never a text link, never primary): the
 * one variant that brings its own surface and border, so its contrast is the
 * same on all five tints in both themes. Pass `actionLabel` + `actionHref`
 * (flat, Storyblok) or your own `action` element. The row wraps: the message
 * keeps a readable measure (`--size-measure-min`), so at a narrow width the
 * CTA drops to its own line instead of being crushed. (The measure is capped
 * at the width left beside the glyph, so on a very narrow banner the glyph
 * stays on the message's first line rather than sitting alone above it.)
 *
 * DISMISS. `dismissible` adds a trailing close control (Button `neutral`, for
 * the same reason as Alert's). It hides the Banner and calls `onDismiss`;
 * `event.preventDefault()` keeps it. Persisting "dismissed" across visits is
 * the app's job (a cookie or a user setting), not the component's.
 * ------------------------------------------------------------------------- */

export const bannerVariants = cva(
  [
    'flex w-full flex-wrap items-center gap-3 rounded-none border-0 border-b px-4 py-3',
    'font-sans text-sm leading-body',
    // The status glyph: 16px beside 13px text, aligned to the FIRST line of a
    // message that may wrap to three.
    "[&>[data-slot=banner-icon]_svg:not([class*='size-'])]:size-icon-sm",
  ],
  {
    variants: {
      tone: {
        info: 'border-info-border bg-info-surface text-info-content',
        success: 'border-success-border bg-success-surface text-success-content',
        warning: 'border-warning-border bg-warning-surface text-warning-content',
        danger: 'border-danger-border bg-danger-surface text-danger-content',
        brand: 'border-border-brand bg-surface-brand-subtle text-content-brand',
      },
    },
    defaultVariants: { tone: 'info' },
  },
);

type BannerVariantProps = VariantProps<typeof bannerVariants>;

/** String union, so a Storyblok option value can be passed straight in. */
export type BannerTone = NonNullable<BannerVariantProps['tone']>;

/** The live-region role each tone gets unless `role` is passed. */
export const BANNER_ROLE: Record<BannerTone, 'alert' | 'status'> = {
  info: 'status',
  success: 'status',
  warning: 'status',
  danger: 'alert',
  brand: 'status',
};

export type BannerProps = React.HTMLAttributes<HTMLDivElement> &
  BannerVariantProps & {
    /**
     * `info` maintenance, schedule changes · `success` a confirmed state ·
     * `warning` a deadline · `danger` an outage or impersonation · `brand`
     * product news (no status meaning). Picks the glyph and the role too.
     *
     * @default 'info'
     */
    tone?: BannerTone;
    /**
     * The message, as a flat field. `children` render after it, in the same
     * text run, so either (or both) can carry the message.
     */
    message?: React.ReactNode;
    /**
     * The leading glyph. Unset: the tone's built-in glyph (info, check-circle,
     * warning, error, megaphone for `brand`). Your own svg replaces it;
     * `false` removes it.
     *
     * @default the tone's glyph
     */
    icon?: React.ReactNode;
    /**
     * The CTA element, e.g. `<Button asChild size="sm" variant="secondary">`.
     * Wins over `actionLabel`.
     */
    action?: React.ReactNode;
    /** Flat CTA: the label of a small secondary button. A link with `actionHref`. */
    actionLabel?: string;
    /** Flat CTA: where `actionLabel` goes. */
    actionHref?: string;
    /** Flat CTA: called when the `actionLabel` button is clicked (no `actionHref`). */
    onAction?: React.MouseEventHandler<HTMLButtonElement>;
    /**
     * Show a trailing close control. Clicking it hides the Banner and calls
     * `onDismiss`.
     *
     * @default false
     */
    dismissible?: boolean;
    /**
     * The close control's accessible name: "Dismiss the placement drive banner".
     *
     * @default 'Dismiss'
     */
    dismissLabel?: string;
    /**
     * Called when the close control is clicked, before the Banner hides.
     * `event.preventDefault()` keeps it on screen (controlled use).
     */
    onDismiss?: React.MouseEventHandler<HTMLButtonElement>;
  };

export const Banner = React.forwardRef<HTMLDivElement, BannerProps>(function Banner(
  {
    className,
    tone = 'info',
    message,
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

  const cta =
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
      data-slot="banner"
      data-tone={tone}
      role={role ?? BANNER_ROLE[tone] ?? 'status'}
      className={cn(bannerVariants({ tone }), className)}
      {...props}
    >
      {hasGlyph ? (
        <span data-slot="banner-icon" aria-hidden="true" className="flex shrink-0 self-start pt-0.5">
          {glyph}
        </span>
      ) : null}
      <div
        data-slot="banner-message"
        className="min-w-[min(calc(100%-var(--size-icon-sm)-var(--space-3)),var(--size-measure-min))] flex-1 break-words [&_strong]:font-semibold"
      >
        {message}
        {children}
      </div>
      {cta ? (
        // Beside the message when there is room; on a narrow banner it wraps to
        // its own line below the message, and is never wider than the banner
        // (its buttons wrap among themselves rather than overflow).
        <div data-slot="banner-action" className="flex max-w-full min-w-0 flex-wrap items-center gap-2">
          {cta}
        </div>
      ) : null}
      {dismissible ? (
        <IconButton
          data-slot="banner-dismiss"
          variant="neutral"
          size="sm"
          aria-label={dismissLabel}
          onClick={handleDismiss}
          className="shrink-0"
        >
          <CloseGlyph />
        </IconButton>
      ) : null}
    </div>
  );
});
Banner.displayName = 'Banner';
