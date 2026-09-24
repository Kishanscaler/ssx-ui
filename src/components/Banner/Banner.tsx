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
 * same on all five tints and on every solid fill, in both themes. Pass
 * `actionLabel` + `actionHref` (flat, Storyblok) or your own `action` element.
 * The message keeps a readable measure (`--size-measure-min`), so at a narrow
 * width the CTA drops to its own line UNDER THE MESSAGE instead of being
 * crushed; the glyph and the close control keep their places on the first row.
 *
 * ALIGNMENT. Everything on the first row is centred on one 32px row (the small
 * control height): the glyph box is that tall, the message's first line is
 * padded onto its centre, and the CTA and close control are that tall. So a
 * one-line message beside a button and a three-line message with no button
 * both line up, with no measuring.
 *
 * APPEARANCE. `subtle` (default) is the tone's tint; `solid` is the tone's
 * strong fill with on-solid text, for the one notice that must not be missed.
 * `shine` adds a slow sheen (a modifier; gone under reduced motion, never on
 * `danger`). The sheen lives in components.css.
 *
 * A TIMER is composition, not a prop: put a `<BannerCountdown>` (or anything
 * else) in the message. See BannerCountdown.tsx.
 *
 * DISMISS. `dismissible` adds a trailing close control (Button `neutral`, for
 * the same reason as Alert's). It hides the Banner and calls `onDismiss`;
 * `event.preventDefault()` keeps it. Persisting "dismissed" across visits is
 * the app's job (a cookie or a user setting), not the component's.
 * ------------------------------------------------------------------------- */

export const bannerVariants = cva(
  [
    // Edge to edge, so its text sits on the page gutter (16px on a phone,
    // 24px from `sm`), clear of a landscape notch.
    'flex w-full items-start gap-3 rounded-none border-0 border-b py-2',
    'pl-[max(var(--space-gutter),env(safe-area-inset-left,0px))] pr-[max(var(--space-gutter),env(safe-area-inset-right,0px))]',
    'font-sans type-body-sm',
    // ONE ROW HEIGHT. The glyph, the message's first line, the CTA and the
    // close control all share a 32px first row (the small control height) and
    // are centred on it, so they line up whether the message is one line
    // beside a button or three lines with nothing else. The glyph box and the
    // message's block padding are sized from that row; see the parts below.
    "[&>[data-slot=banner-icon]_svg:not([class*='size-'])]:size-icon-sm",
  ],
  {
    variants: {
      tone: {
        info: '',
        success: '',
        warning: '',
        danger: '',
        brand: '',
      },
      /**
       * `subtle`: the tone's tint with its content colour (the default, for
       * notices that sit calmly above a page). `solid`: the tone's strong fill
       * with its on-solid text, for the one notice that must not be missed
       * (an outage, the last day of a deadline, a launch).
       */
      appearance: {
        subtle: '',
        solid: '',
      },
    },
    compoundVariants: [
      {
        appearance: 'subtle',
        tone: 'info',
        className: 'border-info-border bg-info-surface text-info-content',
      },
      {
        appearance: 'subtle',
        tone: 'success',
        className: 'border-success-border bg-success-surface text-success-content',
      },
      {
        appearance: 'subtle',
        tone: 'warning',
        className: 'border-warning-border bg-warning-surface text-warning-content',
      },
      {
        appearance: 'subtle',
        tone: 'danger',
        className: 'border-danger-border bg-danger-surface text-danger-content',
      },
      {
        appearance: 'subtle',
        tone: 'brand',
        className: 'border-border-brand bg-surface-brand-subtle text-content-brand',
      },
      {
        appearance: 'solid',
        tone: 'info',
        className: 'border-info bg-info text-info-on-solid',
      },
      {
        appearance: 'solid',
        tone: 'success',
        className: 'border-success bg-success text-success-on-solid',
      },
      {
        appearance: 'solid',
        tone: 'warning',
        className: 'border-warning bg-warning text-warning-on-solid',
      },
      {
        appearance: 'solid',
        tone: 'danger',
        className: 'border-danger bg-danger text-danger-on-solid',
      },
      {
        appearance: 'solid',
        tone: 'brand',
        className: 'border-surface-brand-solid bg-surface-brand-solid text-content-on-brand-solid',
      },
    ],
    defaultVariants: { tone: 'info', appearance: 'subtle' },
  },
);

type BannerVariantProps = VariantProps<typeof bannerVariants>;

/** String union, so a Storyblok option value can be passed straight in. */
export type BannerTone = NonNullable<BannerVariantProps['tone']>;
/** String union, so a Storyblok option value can be passed straight in. */
export type BannerAppearance = NonNullable<BannerVariantProps['appearance']>;

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
     * `subtle` is the tone's tint (the everyday banner). `solid` is the tone's
     * strong fill with on-solid text: reserve it for the one notice a visitor
     * must not miss, and never stack two solid banners.
     *
     * @default 'subtle'
     */
    appearance?: BannerAppearance;
    /**
     * A sheen that sweeps across the banner every few seconds, for a launch
     * or a limited offer. A modifier, not a tone: it adds no meaning, and it
     * is removed entirely under reduced motion. Never on `danger`.
     *
     * @default false
     */
    shine?: boolean;
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
    appearance = 'subtle',
    shine = false,
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

  const solid = appearance === 'solid';

  return (
    <div
      ref={ref}
      data-slot="banner"
      data-tone={tone}
      data-appearance={appearance}
      data-shine={shine ? '' : undefined}
      role={role ?? BANNER_ROLE[tone] ?? 'status'}
      className={cn(bannerVariants({ tone, appearance }), className)}
      {...props}
    >
      {hasGlyph ? (
        // As tall as the first row, the glyph centred in it.
        <span data-slot="banner-icon" aria-hidden="true" className="flex h-control-sm shrink-0 items-center">
          {glyph}
        </span>
      ) : null}
      <div
        data-slot="banner-content"
        // The message and the CTA. When the CTA does not fit beside the
        // message it wraps to its own line, under the MESSAGE (not under the
        // glyph), while the close control stays top right.
        className="flex min-w-0 flex-1 flex-wrap items-start gap-x-4 gap-y-1"
      >
        <div
          data-slot="banner-message"
          className={cn(
            'min-w-[min(100%,var(--size-measure-min))] flex-1 break-words [&_strong]:font-semibold',
            // Block padding that centres the first text line on the 32px row:
            // (row - one line of type-body-sm) / 2.
            'py-[calc((var(--size-control-sm)-var(--type-body-sm-size)*var(--type-body-sm-lh))/2)]',
          )}
        >
          {message}
          {children}
        </div>
        {cta ? (
          // Beside the message when there is room; never wider than the banner
          // (its buttons wrap among themselves rather than overflow).
          <div
            data-slot="banner-action"
            className="flex min-h-control-sm max-w-full min-w-0 flex-wrap items-center gap-2"
          >
            {cta}
          </div>
        ) : null}
      </div>
      {dismissible ? (
        <IconButton
          data-slot="banner-dismiss"
          variant="neutral"
          size="sm"
          aria-label={dismissLabel}
          onClick={handleDismiss}
          className={cn(
            'shrink-0',
            // On a solid fill the page's content roles are the wrong colours:
            // the close control takes the on-solid ink, and its hover, press
            // and focus ring are that ink at low strength.
            solid && [
              'text-current idle:hover:text-current idle:active:text-current',
              'idle:hover:border-transparent',
              'idle:hover:bg-[color-mix(in_srgb,currentColor_14%,transparent)]',
              'idle:active:bg-[color-mix(in_srgb,currentColor_22%,transparent)]',
              'focus-visible:border-current focus-visible:ring-current/50',
            ],
          )}
        >
          <CloseGlyph />
        </IconButton>
      ) : null}
    </div>
  );
});
Banner.displayName = 'Banner';
