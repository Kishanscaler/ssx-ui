import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { BannerCountdown } from '../Banner/BannerCountdown';
import { Button, type ButtonSize } from '../Button';
import { Heading, type HeadingElement } from '../Heading';
import { Link } from '../Link';
import { Text } from '../Text';
import type { SurfaceInk } from '../../lib/surface-ink';

/* ---------------------------------------------------------------------------
 * DisplayBanner
 *
 * A marketing or announcement card: the promo on a Storyblok page, the
 * feature tile in a bento grid, the "new cohort" strip on a dashboard. The
 * design system ships the SHELL (surfaces, slots, layout, contrast, reflow);
 * the site ships the ARTWORK (illustration, photograph, copy) through slots.
 * It is its own organism, not a Card variant: a Card is an object in a grid of
 * equals, this is a message with a call to action.
 *
 * AXES (all string unions, so a Storyblok option maps straight in):
 *   surface          subtle | solid | gradient | image | glass
 *   tone             brand | accent1 | accent2 | neutral | inverse
 *   mediaPlacement   end | start | bottom | background | popout
 *   layout           stacked | split | wide
 *   size             md | lg
 *
 * CONTRAST IS THE COMPONENT'S JOB, not the artwork's:
 *   - `subtle` / `gradient` use the tone's tint (and the page colour), which
 *     every text role clears at 4.5:1 in all four themes. `gradient` is a
 *     linear wash between those two semantic tokens; `inverse` washes from
 *     `surface-inverse` into a 40% mix of `surface-brand-solid` (the lowest
 *     measured pair is 4.84:1, `content-inverse-secondary`, SST dark).
 *   - `solid` and `inverse` (and `image`) declare the SURFACE-INK CONTRACT on
 *     the inner layer, `data-surface-ink="on-brand-solid" | "on-accent1-solid"
 *     | "on-accent2-solid" | "on-inverse" | "on-image"` (src/lib/surface-ink.ts),
 *     and set nothing else. Heading, Text, Link and Button read it in their
 *     OWN recipes: the primary button becomes the fill's ink with the fill as
 *     its label, secondary an ink outline, tertiary ink text, each with its
 *     own hover, press and focus. The banner styles only its own parts
 *     (`data-slot="display-banner*"`); it never sets another component's
 *     tokens or classes.
 *   - `image` puts the photograph behind everything, and the content carries
 *     its own scrim (`display-banner-scrim`): solid under the whole content
 *     box, fading out beyond it, so text is always on the scrim (9.29:1)
 *     however tall the copy gets. `mediaPlacement="background"` on the other
 *     surfaces does the same with the surface's own colour as the scrim.
 *   - `glass` puts the content on a frosted panel (`surface-default` at 88%,
 *     measured at 4.5:1 or better for secondary text over pure black AND
 *     pure white artwork) over the photograph or the tone's wash.
 *   Badges and Chips bring their own surface and keep their page colours on
 *   every banner, by design.
 *
 * RESPONSIVE by CONTAINER, not viewport: the root is `@container`, so the
 * same banner stacks in a grid cell, a sidebar or a phone. `split` goes side
 * by side from a 36rem container, `wide` from 48rem.
 *
 * LINKED. `href` (or `asChild` with your router link) makes the WHOLE banner
 * one link: one tab stop, hover lift + shadow, the shared focus ring. Nothing
 * interactive may go inside then; the flat CTA is drawn, not rendered as a
 * control. The accessible name is the banner's text (or your `aria-label`).
 *
 * Server component: no hooks, no handlers (Button and BannerCountdown are
 * client references it renders). That is why the fill is an attribute rather
 * than React context: context does not exist in a server component.
 * ------------------------------------------------------------------------- */

/** String unions, so a Storyblok option value can be passed straight in. */
export type DisplayBannerSurface = 'subtle' | 'solid' | 'gradient' | 'image' | 'glass';
export type DisplayBannerTone = 'brand' | 'accent1' | 'accent2' | 'neutral' | 'inverse';
export type DisplayBannerMediaPlacement = 'end' | 'start' | 'bottom' | 'background' | 'popout';
export type DisplayBannerLayout = 'stacked' | 'split' | 'wide';
export type DisplayBannerSize = 'md' | 'lg';
export type DisplayBannerActionAppearance = 'button' | 'arrow';
export type DisplayBannerElement = 'div' | 'section' | 'article' | 'aside' | 'li';
export type DisplayBannerMediaFit = 'auto' | 'cover' | 'contain';

/** How the banner inks its content: page roles, an on-solid fill, or a photograph. */
type Ink = 'page' | 'solid' | 'image';

/* ---- surface x tone -------------------------------------------------------
 * Every value is a semantic token. These are the banner's OWN properties, read
 * only by its own parts: `--db-ink` / `--db-ink-2` the inner layer's text
 * colour and the muted title line, `--db-scrim` what sits under text over
 * background media, `--db-panel` the fill of a `DisplayBannerPanel`.
 * `surfaceInk` is the contract value the inner layer declares, for everyone
 * else to read.
 * ------------------------------------------------------------------------- */

const PANEL_TINT = '[--db-panel:color-mix(in_srgb,var(--surface-default)_64%,transparent)]';
const PANEL_GLASS = '[--db-panel:color-mix(in_srgb,var(--surface-default)_88%,transparent)]';
const INK_INVERSE =
  '[--db-ink:var(--on-inverse-ink)] [--db-ink-2:var(--on-inverse-ink-secondary)] [--db-scrim:var(--surface-inverse)] [--db-panel:color-mix(in_srgb,var(--on-inverse-ink)_8%,transparent)]';

const GRADIENT: Record<DisplayBannerTone, string> = {
  brand: 'bg-linear-to-br from-surface-brand-subtle to-page [--db-scrim:var(--surface-brand-subtle)]',
  accent1: 'bg-linear-to-br from-accent1-surface to-page [--db-scrim:var(--accent1-surface)]',
  accent2: 'bg-linear-to-br from-accent2-surface to-page [--db-scrim:var(--accent2-surface)]',
  neutral: 'border-border-decorative bg-linear-to-br from-surface-sunken to-page [--db-scrim:var(--surface-sunken)]',
  inverse:
    'bg-linear-to-br from-surface-inverse to-[color-mix(in_srgb,var(--surface-brand-solid)_40%,var(--surface-inverse))]',
};

const LOOK: Record<
  Exclude<DisplayBannerSurface, 'image'>,
  Record<DisplayBannerTone, { className: string; ink: Ink; surfaceInk?: SurfaceInk }>
> = {
  subtle: {
    brand: { ink: 'page', className: `bg-surface-brand-subtle [--db-scrim:var(--surface-brand-subtle)] ${PANEL_TINT}` },
    accent1: { ink: 'page', className: `bg-accent1-surface [--db-scrim:var(--accent1-surface)] ${PANEL_TINT}` },
    accent2: { ink: 'page', className: `bg-accent2-surface [--db-scrim:var(--accent2-surface)] ${PANEL_TINT}` },
    neutral: {
      ink: 'page',
      className: `border-border-decorative bg-surface-subtle [--db-scrim:var(--surface-subtle)] ${PANEL_TINT}`,
    },
    // Inverse has one strength: `subtle` and `solid` are the same fill.
    inverse: { ink: 'solid', surfaceInk: 'on-inverse', className: `bg-surface-inverse ${INK_INVERSE}` },
  },
  solid: {
    brand: {
      ink: 'solid',
      surfaceInk: 'on-brand-solid',
      className:
        'bg-surface-brand-solid [--db-ink:var(--on-brand-solid-ink)] [--db-ink-2:var(--on-brand-solid-ink-secondary)] [--db-scrim:var(--surface-brand-solid)] [--db-panel:transparent]',
    },
    accent1: {
      ink: 'solid',
      surfaceInk: 'on-accent1-solid',
      className:
        'bg-accent1 [--db-ink:var(--on-accent1-solid-ink)] [--db-ink-2:var(--on-accent1-solid-ink-secondary)] [--db-scrim:var(--accent1-solid)] [--db-panel:transparent]',
    },
    accent2: {
      ink: 'solid',
      surfaceInk: 'on-accent2-solid',
      className:
        'bg-accent2 [--db-ink:var(--on-accent2-solid-ink)] [--db-ink-2:var(--on-accent2-solid-ink-secondary)] [--db-scrim:var(--accent2-solid)] [--db-panel:transparent]',
    },
    neutral: {
      ink: 'page',
      className: `border-border-decorative bg-surface-sunken [--db-scrim:var(--surface-sunken)] ${PANEL_TINT}`,
    },
    inverse: { ink: 'solid', surfaceInk: 'on-inverse', className: `bg-surface-inverse ${INK_INVERSE}` },
  },
  gradient: {
    brand: { ink: 'page', className: `${GRADIENT.brand} ${PANEL_TINT}` },
    accent1: { ink: 'page', className: `${GRADIENT.accent1} ${PANEL_TINT}` },
    accent2: { ink: 'page', className: `${GRADIENT.accent2} ${PANEL_TINT}` },
    neutral: { ink: 'page', className: `${GRADIENT.neutral} ${PANEL_TINT}` },
    inverse: { ink: 'solid', surfaceInk: 'on-inverse', className: `${GRADIENT.inverse} ${INK_INVERSE}` },
  },
  // The tone's wash (or the photograph) behind a frosted content panel; the
  // panel is page-coloured, so there is no contract to declare.
  glass: {
    brand: { ink: 'page', className: `${GRADIENT.brand} ${PANEL_GLASS}` },
    accent1: { ink: 'page', className: `${GRADIENT.accent1} ${PANEL_GLASS}` },
    accent2: { ink: 'page', className: `${GRADIENT.accent2} ${PANEL_GLASS}` },
    neutral: { ink: 'page', className: `${GRADIENT.neutral} ${PANEL_GLASS}` },
    inverse: { ink: 'page', className: `${GRADIENT.inverse} ${PANEL_GLASS}` },
  },
};

/** The photograph is the surface, so the tone does not apply. The fill under
 *  it shows only while the image loads (or when none is given). */
const IMAGE_LOOK =
  'bg-surface-inverse-sunken [--db-ink:var(--on-image-ink)] [--db-ink-2:var(--on-image-ink-secondary)] [--db-scrim:var(--surface-image-scrim)] [--db-panel:var(--surface-image-scrim)]';

/* ---- inner grid: areas per layout x placement ------------------------------
 * `has-[>media]` so a banner with no media keeps one full-width column. Areas
 * are literal class strings (Tailwind reads the source). Stacked, the MEDIA
 * row takes the spare height (a tall card's screenshot grows into it); with
 * the media first, the content row does (so fine print sits at the bottom).
 * ------------------------------------------------------------------------- */

const STACK_AFTER =
  "has-[>[data-slot=display-banner-media]]:[grid-template-areas:'content'_'media'] has-[>[data-slot=display-banner-media]]:grid-rows-[auto_minmax(0,1fr)]";
const STACK_BEFORE =
  "has-[>[data-slot=display-banner-media]]:[grid-template-areas:'media'_'content'] has-[>[data-slot=display-banner-media]]:grid-rows-[auto_minmax(0,1fr)]";

const AREAS: Record<DisplayBannerLayout, Record<DisplayBannerMediaPlacement, string>> = {
  stacked: {
    end: STACK_AFTER,
    bottom: STACK_AFTER,
    start: STACK_BEFORE,
    popout: STACK_BEFORE,
    background: '',
  },
  split: {
    end: `${STACK_AFTER} @min-[36rem]/display-banner:has-[>[data-slot=display-banner-media]]:[grid-template-areas:'content_media'] @min-[36rem]/display-banner:has-[>[data-slot=display-banner-media]]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @min-[36rem]/display-banner:has-[>[data-slot=display-banner-media]]:grid-rows-[minmax(0,1fr)]`,
    popout: `${STACK_BEFORE} @min-[36rem]/display-banner:has-[>[data-slot=display-banner-media]]:[grid-template-areas:'content_media'] @min-[36rem]/display-banner:has-[>[data-slot=display-banner-media]]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @min-[36rem]/display-banner:has-[>[data-slot=display-banner-media]]:grid-rows-[minmax(0,1fr)]`,
    start: `${STACK_BEFORE} @min-[36rem]/display-banner:has-[>[data-slot=display-banner-media]]:[grid-template-areas:'media_content'] @min-[36rem]/display-banner:has-[>[data-slot=display-banner-media]]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @min-[36rem]/display-banner:has-[>[data-slot=display-banner-media]]:grid-rows-[minmax(0,1fr)]`,
    bottom: STACK_AFTER,
    background:
      "@min-[36rem]/display-banner:[grid-template-areas:'content_.'] @min-[36rem]/display-banner:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
  },
  wide: {
    end: `${STACK_AFTER} @min-[48rem]/display-banner:has-[>[data-slot=display-banner-media]]:[grid-template-areas:'content_media'] @min-[48rem]/display-banner:has-[>[data-slot=display-banner-media]]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @min-[48rem]/display-banner:has-[>[data-slot=display-banner-media]]:grid-rows-[minmax(0,1fr)]`,
    popout: `${STACK_BEFORE} @min-[48rem]/display-banner:has-[>[data-slot=display-banner-media]]:[grid-template-areas:'content_media'] @min-[48rem]/display-banner:has-[>[data-slot=display-banner-media]]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @min-[48rem]/display-banner:has-[>[data-slot=display-banner-media]]:grid-rows-[minmax(0,1fr)]`,
    start: `${STACK_BEFORE} @min-[48rem]/display-banner:has-[>[data-slot=display-banner-media]]:[grid-template-areas:'media_content'] @min-[48rem]/display-banner:has-[>[data-slot=display-banner-media]]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @min-[48rem]/display-banner:has-[>[data-slot=display-banner-media]]:grid-rows-[minmax(0,1fr)]`,
    bottom: STACK_AFTER,
    background:
      "@min-[48rem]/display-banner:[grid-template-areas:'content_.'] @min-[48rem]/display-banner:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]",
  },
};

/** Padding (and the glass inset) per size, stepping with the CONTAINER. */
const PAD: Record<DisplayBannerSize, string> = {
  md: '[--db-pad:var(--space-5)] [--db-inset:var(--space-3)] @min-[36rem]/display-banner:[--db-pad:var(--space-8)] @min-[36rem]/display-banner:[--db-inset:var(--space-5)]',
  lg: '[--db-pad:var(--space-6)] [--db-inset:var(--space-4)] @min-[36rem]/display-banner:[--db-pad:var(--space-10)] @min-[36rem]/display-banner:[--db-inset:var(--space-6)] @min-[56rem]/display-banner:[--db-pad:var(--space-12)]',
};

export const displayBannerVariants = cva(
  [
    '@container/display-banner group/display-banner',
    'relative isolate flex min-w-0 flex-col rounded-2xl border border-transparent font-sans',
    // The page's inks, replaced by a fill's (LOOK / IMAGE_LOOK, later in the class list).
    '[--db-ink:var(--content-primary)] [--db-ink-2:var(--content-secondary)]',
    // How far a scrim fades out past the content box it sits under.
    '[--db-fade:var(--space-20)]',
  ],
  {
    variants: {
      size: {
        md: '[--display-banner-popout:var(--space-10)]',
        lg: '[--display-banner-popout:var(--space-12)]',
      },
      mediaPlacement: {
        end: 'overflow-hidden',
        start: 'overflow-hidden',
        bottom: 'overflow-hidden',
        background: 'overflow-hidden',
        // The art breaks out of the top edge: no clip on the root, and room
        // reserved above it so it cannot collide with whatever sits above.
        // The media frame clips itself (bottom-end corner) instead.
        popout: 'overflow-visible mt-(--display-banner-popout)',
      },
      linked: {
        true: [
          'm-0 cursor-pointer text-left no-underline outline-none',
          'transition-[transform,box-shadow] duration-[var(--motion-duration-normal)] ease-[var(--motion-easing-productive-in-out)]',
          'hover:-translate-y-0.5 hover:shadow-raised',
          'active:translate-y-0 active:duration-[var(--motion-duration-instant)]',
          'focus-visible:ring-[3px] focus-visible:ring-border-focus/50',
          // Reduced motion: no lift; the shadow alone says "hover".
          'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        ],
        false: '',
      },
    },
    defaultVariants: { size: 'md', mediaPlacement: 'end', linked: false },
  },
);

/* ---- flat CMS fields -------------------------------------------------------- */

/** A flat CTA, as a Storyblok link field stores it. */
export interface DisplayBannerAction {
  /** The visible label: "Apply now". */
  label: string;
  /** Where it goes. Without it, a `type="button"` is rendered (wire it from a Client Component). */
  href?: string;
  /** Anchor target; `_blank` gets `rel="noopener noreferrer"`. */
  target?: string;
}

export interface DisplayBannerContentFields {
  /** Kicker line above the title (12px caps), a `DisplayBannerEyebrow`. */
  eyebrow?: React.ReactNode;
  /** The title, a `DisplayBannerTitle`. */
  title?: React.ReactNode;
  /**
   * A second title line in the muted ink ("Gamification / **Marketing**"),
   * a `DisplayBannerTitleMuted`. On a solid fill with no secondary ink it is
   * set in the regular weight instead of a lighter colour.
   */
  titleMuted?: React.ReactNode;
  /**
   * The title's outline level. Pick it for the page; the size follows `size`.
   *
   * @default 'h2'
   */
  titleAs?: HeadingElement;
  /** One or two sentences under the title, a `DisplayBannerDescription`. */
  description?: React.ReactNode;
  /** The main CTA. A primary Button (or an arrow link, see `actionAppearance`). */
  primaryAction?: DisplayBannerAction;
  /** The alternative CTA. A secondary Button. Not rendered on a linked banner. */
  secondaryAction?: DisplayBannerAction;
  /**
   * `button` Buttons · `arrow` a "Learn more" text link with a circled arrow.
   *
   * @default 'button'
   */
  actionAppearance?: DisplayBannerActionAppearance;
  /** Image URL for the artwork, a `DisplayBannerMedia`. On `surface="image"`, the background photo. */
  mediaSrc?: string;
  /**
   * Alt text for `mediaSrc`. Empty (the default) marks the art decorative,
   * which is right when the copy already says what it shows.
   *
   * @default ''
   */
  mediaAlt?: string;
  /** Your own media element instead of `mediaSrc` (an inline SVG, `next/image` with `fill`). */
  media?: React.ReactNode;
  /**
   * How the artwork fills its frame. `auto`: cover, except `popout`, which
   * is contained and anchored to the bottom.
   *
   * @default 'auto'
   */
  mediaFit?: DisplayBannerMediaFit;
  /** A countdown slot (a `DisplayBannerCountdown`, or anything). Wins over `countdownTo`. */
  countdown?: React.ReactNode;
  /** Flat countdown: the deadline, ISO 8601 with offset (`2026-09-30T23:59:00+05:30`). */
  countdownTo?: string;
  /** Flat countdown: the deadline in words, read to screen readers ("30 Sep, 11:59 PM IST"). */
  countdownLabel?: string;
  /**
   * Flat countdown: the words before the digits.
   *
   * @default 'Ends in'
   */
  countdownText?: string;
  /** Terms, a disclaimer: a `DisplayBannerFinePrint`, pinned to the bottom of the content. */
  finePrint?: React.ReactNode;
}

export type DisplayBannerProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> &
  DisplayBannerContentFields & {
    /**
     * `subtle` the tone's tint · `solid` the tone's strong fill, on-solid ink ·
     * `gradient` a wash from the tone's tint into the page (inverse: a dark
     * brand-shifted wash) · `image` a full-bleed photograph (`mediaSrc`) under
     * a scrim · `glass` a frosted content panel over the photograph or wash.
     *
     * @default 'subtle'
     */
    surface?: DisplayBannerSurface;
    /**
     * The colour family: `brand` · `accent1` (yellow) · `accent2` (orange-red)
     * · `neutral` · `inverse` (dark in light mode, light in dark mode).
     * Ignored by `surface="image"`.
     *
     * @default 'brand'
     */
    tone?: DisplayBannerTone;
    /**
     * Where the artwork goes. `end` / `start` a column, cropped flush at the
     * card's edges (below the content when stacked) · `bottom` under the
     * content, inset from the start and flush with the end and bottom edges
     * (a UI screenshot bleeding off the corner) · `background` behind the
     * content, which gets a scrim · `popout` breaks out above the top edge
     * (a transparent PNG or SVG); room is reserved above the banner
     * (`--display-banner-popout`). `surface="image"` always uses `background`.
     *
     * @default 'end'
     */
    mediaPlacement?: DisplayBannerMediaPlacement;
    /**
     * `stacked` always one column · `split` content and media side by side
     * from a 36rem CONTAINER · `wide` a strip, side by side from 48rem, the
     * content taking three fifths.
     *
     * @default 'split'
     */
    layout?: DisplayBannerLayout;
    /**
     * Padding and type ramp. `md`: title `type-h2`, body `type-body`. `lg`:
     * title `type-h1`, `type-display` from a 48rem container, body
     * `type-body-lg`, larger buttons.
     *
     * @default 'md'
     */
    size?: DisplayBannerSize;
    /**
     * The element, when not linked.
     *
     * @default 'div'
     */
    as?: DisplayBannerElement;
    /**
     * Make the whole banner one link. Nothing interactive may go inside it:
     * the flat CTA is drawn, not rendered as a control.
     */
    href?: string;
    /** Anchor `target`, with `href`. `_blank` gets `rel="noopener noreferrer"`. */
    target?: string;
    /** Anchor `rel`, with `href`. */
    rel?: string;
    /**
     * Lend every style to your own link (`next/link`) as the ONE child; the
     * banner becomes that link (as `href`). The flat fields and the link's
     * own children render inside it.
     *
     * @default false
     */
    asChild?: boolean;
  };

function lookFor(
  surface: DisplayBannerSurface,
  tone: DisplayBannerTone,
): { className: string; ink: Ink; surfaceInk?: SurfaceInk } {
  if (surface === 'image') return { className: IMAGE_LOOK, ink: 'image', surfaceInk: 'on-image' };
  return (LOOK[surface] ?? LOOK.subtle)[tone] ?? LOOK.subtle.brand;
}

function renderAction(
  action: DisplayBannerAction,
  variant: 'primary' | 'secondary',
  appearance: DisplayBannerActionAppearance,
  size: ButtonSize,
  linked: boolean,
) {
  if (appearance === 'arrow') {
    return (
      <DisplayBannerArrowLink href={linked ? undefined : action.href} target={linked ? undefined : action.target}>
        {action.label}
      </DisplayBannerArrowLink>
    );
  }
  if (linked) {
    // Drawn, not a control: the banner itself is the link.
    return (
      <Button asChild variant={variant} size={size}>
        <span data-slot="display-banner-cta">{action.label}</span>
      </Button>
    );
  }
  if (action.href) {
    const rel = action.target === '_blank' ? 'noopener noreferrer' : undefined;
    return (
      <Button asChild variant={variant} size={size}>
        <a href={action.href} target={action.target} rel={rel}>
          {action.label}
        </a>
      </Button>
    );
  }
  return (
    <Button variant={variant} size={size}>
      {action.label}
    </Button>
  );
}

function renderFlat(
  fields: DisplayBannerContentFields,
  size: DisplayBannerSize,
  linked: boolean,
) {
  const {
    eyebrow,
    title,
    titleMuted,
    titleAs = 'h2',
    description,
    primaryAction,
    secondaryAction,
    actionAppearance = 'button',
    mediaSrc,
    mediaAlt = '',
    media,
    mediaFit = 'auto',
    countdown,
    countdownTo,
    countdownLabel,
    countdownText = 'Ends in',
    finePrint,
  } = fields;
  const buttonSize: ButtonSize = size === 'lg' ? 'lg' : 'md';
  const timer =
    countdown ??
    (countdownTo ? (
      <DisplayBannerCountdown to={countdownTo} label={countdownLabel || countdownTo}>
        {countdownText}
      </DisplayBannerCountdown>
    ) : null);
  const primary = primaryAction?.label
    ? renderAction(primaryAction, 'primary', actionAppearance, buttonSize, linked)
    : null;
  const secondary =
    secondaryAction?.label && !linked
      ? renderAction(secondaryAction, 'secondary', actionAppearance, buttonSize, linked)
      : null;
  const hasContent =
    eyebrow != null || title != null || description != null || timer != null || primary || secondary || finePrint != null;
  const hasMedia = media != null || !!mediaSrc;
  if (!hasContent && !hasMedia) return null;

  return (
    <>
      {hasContent ? (
        <DisplayBannerContent>
          {eyebrow != null ? <DisplayBannerEyebrow>{eyebrow}</DisplayBannerEyebrow> : null}
          {title != null ? (
            <DisplayBannerTitle as={titleAs}>
              {title}
              {titleMuted != null ? (
                <>
                  {' '}
                  <DisplayBannerTitleMuted>{titleMuted}</DisplayBannerTitleMuted>
                </>
              ) : null}
            </DisplayBannerTitle>
          ) : null}
          {description != null ? <DisplayBannerDescription>{description}</DisplayBannerDescription> : null}
          {timer}
          {primary || secondary ? (
            <DisplayBannerActions>
              {primary}
              {secondary}
            </DisplayBannerActions>
          ) : null}
          {finePrint != null ? <DisplayBannerFinePrint>{finePrint}</DisplayBannerFinePrint> : null}
        </DisplayBannerContent>
      ) : null}
      {hasMedia ? (
        <DisplayBannerMedia
          src={media != null ? undefined : mediaSrc}
          alt={mediaAlt}
          fit={mediaFit}
        >
          {media}
        </DisplayBannerMedia>
      ) : null}
    </>
  );
}

export const DisplayBanner = React.forwardRef<HTMLElement, DisplayBannerProps>(function DisplayBanner(
  {
    className,
    surface = 'subtle',
    tone = 'brand',
    mediaPlacement = 'end',
    layout = 'split',
    size = 'md',
    as = 'div',
    href,
    target,
    rel,
    asChild = false,
    eyebrow,
    title,
    titleMuted,
    titleAs,
    description,
    primaryAction,
    secondaryAction,
    actionAppearance,
    mediaSrc,
    mediaAlt,
    media,
    mediaFit,
    countdown,
    countdownTo,
    countdownLabel,
    countdownText,
    finePrint,
    children,
    ...props
  },
  ref,
) {
  // A photograph surface is always behind the content.
  const placement: DisplayBannerMediaPlacement = surface === 'image' ? 'background' : mediaPlacement;
  const linked = asChild || href != null;
  const look = lookFor(surface, tone);
  const scrim = surface === 'image' || (placement === 'background' && surface !== 'glass');
  // No secondary ink exists for these fills (the brand fill and the orange:
  // only the full ink clears 4.5:1), so the muted title line is set in the
  // regular weight instead of a lighter colour.
  const flatMuted = look.surfaceInk === 'on-brand-solid' || look.surfaceInk === 'on-accent2-solid';

  const flat = renderFlat(
    {
      eyebrow,
      title,
      titleMuted,
      titleAs,
      description,
      primaryAction,
      secondaryAction,
      actionAppearance,
      mediaSrc,
      mediaAlt,
      media,
      mediaFit,
      countdown,
      countdownTo,
      countdownLabel,
      countdownText,
      finePrint,
    },
    size,
    linked,
  );

  const innerClassName = cn(
    'grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] [grid-template-areas:"content"]',
    // Its own text colour: the page's, or the fill's ink (inherited by the
    // banner's own parts; Heading, Text, Link and Button pick their own from
    // the contract below).
    'text-(--db-ink)',
    PAD[size] ?? PAD.md,
    (AREAS[layout] ?? AREAS.split)[placement] ?? '',
    surface === 'image' && 'content-end',
  );
  const renderInner = (kids: React.ReactNode) => (
    // The surface-ink contract is declared on the inner layer, not the root,
    // so the root's own focus ring (linked form) keeps the page's focus
    // colour against the page around the banner.
    <div data-slot="display-banner-inner" data-surface-ink={look.surfaceInk} className={innerClassName}>
      {flat}
      {kids}
    </div>
  );

  const shared = {
    'data-slot': 'display-banner',
    'data-surface': surface,
    'data-tone': tone,
    'data-media-placement': placement,
    'data-layout': layout,
    'data-size': size,
    'data-ink': look.ink,
    'data-scrim': scrim ? '' : undefined,
    'data-muted': flatMuted ? 'weight' : 'colour',
    'data-linked': linked ? '' : undefined,
    className: cn(
      displayBannerVariants({ size, mediaPlacement: placement, linked }),
      look.className,
      surface === 'image' && (size === 'lg' ? 'min-h-[22rem]' : 'min-h-[18rem]'),
      className,
    ),
    ...props,
  };

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<{ children?: React.ReactNode }>;
    return (
      <Slot {...(shared as React.HTMLAttributes<HTMLElement>)} ref={ref as React.Ref<HTMLElement>}>
        {React.cloneElement(child, undefined, renderInner(child.props.children))}
      </Slot>
    );
  }
  if (href != null) {
    const safeRel = target === '_blank' && !rel ? 'noopener noreferrer' : rel;
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={safeRel}
        {...(shared as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {renderInner(children)}
      </a>
    );
  }
  return React.createElement(as, { ref, ...shared }, renderInner(children));
});
DisplayBanner.displayName = 'DisplayBanner';

/* ---- DisplayBannerContent -------------------------------------------------- */

export type DisplayBannerContentProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * The text column: eyebrow, title, description, countdown, actions, fine
 * print, in that order. Carries its own scrim when the banner puts media
 * behind it, and becomes the frosted panel on `surface="glass"`.
 */
export const DisplayBannerContent = React.forwardRef<HTMLDivElement, DisplayBannerContentProps>(
  function DisplayBannerContent({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="display-banner-content"
        className={cn(
          'relative flex min-w-0 flex-col items-start gap-3 p-(--db-pad) [grid-area:content]',
          'group-data-[size=lg]/display-banner:gap-4',
          // A photograph: the text sits at the bottom, the picture above it.
          'group-data-[surface=image]/display-banner:justify-end',
          // Glass: the content IS a frosted panel, inset from the edges.
          'group-data-[surface=glass]/display-banner:m-(--db-inset) group-data-[surface=glass]/display-banner:rounded-xl',
          'group-data-[surface=glass]/display-banner:border group-data-[surface=glass]/display-banner:border-border-decorative',
          'group-data-[surface=glass]/display-banner:bg-surface/88 group-data-[surface=glass]/display-banner:shadow-raised',
          'group-data-[surface=glass]/display-banner:backdrop-blur-md',
          // The panel hugs its copy and sits at the bottom of the art.
          'group-data-[surface=glass]/display-banner:self-end',
          className,
        )}
        {...props}
      >
        {/* The scrim. Solid under the whole content box and fading out past
            it (`--db-fade`), so text is on the scrim however long it runs.
            Under the content when stacked; beside it (fading to the end)
            when the layout puts content and media side by side. */}
        <span
          aria-hidden="true"
          data-slot="display-banner-scrim"
          className={cn(
            'pointer-events-none absolute -z-10 hidden group-data-[scrim]/display-banner:block',
            'inset-x-0 bottom-0 -top-(--db-fade)',
            '[background:linear-gradient(to_top,var(--db-scrim)_calc(100%-var(--db-fade)),color-mix(in_srgb,var(--db-scrim)_55%,transparent)_calc(100%-var(--db-fade)*0.6),color-mix(in_srgb,var(--db-scrim)_20%,transparent)_calc(100%-var(--db-fade)*0.3),transparent)]',
            '@min-[36rem]/display-banner:group-data-[layout=split]/display-banner:inset-y-0 @min-[36rem]/display-banner:group-data-[layout=split]/display-banner:start-0 @min-[36rem]/display-banner:group-data-[layout=split]/display-banner:-end-(--db-fade)',
            '@min-[36rem]/display-banner:group-data-[layout=split]/display-banner:[background:linear-gradient(to_right,var(--db-scrim)_calc(100%-var(--db-fade)),color-mix(in_srgb,var(--db-scrim)_55%,transparent)_calc(100%-var(--db-fade)*0.6),color-mix(in_srgb,var(--db-scrim)_20%,transparent)_calc(100%-var(--db-fade)*0.3),transparent)]',
            '@min-[36rem]/display-banner:group-data-[layout=split]/display-banner:rtl:[background:linear-gradient(to_left,var(--db-scrim)_calc(100%-var(--db-fade)),color-mix(in_srgb,var(--db-scrim)_55%,transparent)_calc(100%-var(--db-fade)*0.6),color-mix(in_srgb,var(--db-scrim)_20%,transparent)_calc(100%-var(--db-fade)*0.3),transparent)]',
            '@min-[48rem]/display-banner:group-data-[layout=wide]/display-banner:inset-y-0 @min-[48rem]/display-banner:group-data-[layout=wide]/display-banner:start-0 @min-[48rem]/display-banner:group-data-[layout=wide]/display-banner:-end-(--db-fade)',
            '@min-[48rem]/display-banner:group-data-[layout=wide]/display-banner:[background:linear-gradient(to_right,var(--db-scrim)_calc(100%-var(--db-fade)),color-mix(in_srgb,var(--db-scrim)_55%,transparent)_calc(100%-var(--db-fade)*0.6),color-mix(in_srgb,var(--db-scrim)_20%,transparent)_calc(100%-var(--db-fade)*0.3),transparent)]',
            '@min-[48rem]/display-banner:group-data-[layout=wide]/display-banner:rtl:[background:linear-gradient(to_left,var(--db-scrim)_calc(100%-var(--db-fade)),color-mix(in_srgb,var(--db-scrim)_55%,transparent)_calc(100%-var(--db-fade)*0.6),color-mix(in_srgb,var(--db-scrim)_20%,transparent)_calc(100%-var(--db-fade)*0.3),transparent)]',
          )}
        />
        {children}
      </div>
    );
  },
);
DisplayBannerContent.displayName = 'DisplayBannerContent';

/* ---- DisplayBannerEyebrow -------------------------------------------------- */

export type DisplayBannerEyebrowProps = React.HTMLAttributes<HTMLParagraphElement>;

/** The kicker above the title: `Heading size="eyebrow"`, kept out of the outline. */
export const DisplayBannerEyebrow = React.forwardRef<HTMLParagraphElement, DisplayBannerEyebrowProps>(
  function DisplayBannerEyebrow({ className, ...props }, ref) {
    return (
      <Heading
        ref={ref as React.Ref<HTMLHeadingElement>}
        as="p"
        size="eyebrow"
        data-slot="display-banner-eyebrow"
        className={className}
        {...props}
      />
    );
  },
);
DisplayBannerEyebrow.displayName = 'DisplayBannerEyebrow';

/* ---- DisplayBannerTitle ---------------------------------------------------- */

export type DisplayBannerTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  /**
   * The outline level. The size follows the banner's `size`: `type-h2` (md),
   * `type-h1` (lg), `type-display` (lg in a 48rem container).
   *
   * @default 'h2'
   */
  as?: HeadingElement;
};

export const DisplayBannerTitle = React.forwardRef<HTMLHeadingElement, DisplayBannerTitleProps>(
  function DisplayBannerTitle({ className, as = 'h2', ...props }, ref) {
    return (
      <Heading
        ref={ref}
        as={as}
        size="2"
        data-slot="display-banner-title"
        className={cn(
          'max-w-full text-balance',
          'group-data-[size=lg]/display-banner:type-h1',
          '@min-[48rem]/display-banner:group-data-[size=lg]/display-banner:type-display',
          className,
        )}
        {...props}
      />
    );
  },
);
DisplayBannerTitle.displayName = 'DisplayBannerTitle';

export type DisplayBannerTitleMutedProps = React.HTMLAttributes<HTMLSpanElement>;

/**
 * The muted second line of a title, inside `DisplayBannerTitle`. Put a space
 * before it so the heading's name reads as two words.
 */
export const DisplayBannerTitleMuted = React.forwardRef<HTMLSpanElement, DisplayBannerTitleMutedProps>(
  function DisplayBannerTitleMuted({ className, ...props }, ref) {
    return (
      <span
        ref={ref}
        data-slot="display-banner-title-muted"
        className={cn(
          'block text-(--db-ink-2)',
          'group-data-[muted=weight]/display-banner:font-regular',
          className,
        )}
        {...props}
      />
    );
  },
);
DisplayBannerTitleMuted.displayName = 'DisplayBannerTitleMuted';

/* ---- DisplayBannerDescription ---------------------------------------------- */

export type DisplayBannerDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/** Supporting copy: `Text tone="secondary"`, `type-body` (md) or `type-body-lg` (lg). */
export const DisplayBannerDescription = React.forwardRef<HTMLParagraphElement, DisplayBannerDescriptionProps>(
  function DisplayBannerDescription({ className, ...props }, ref) {
    return (
      <Text
        ref={ref}
        as="p"
        size="base"
        tone="secondary"
        data-slot="display-banner-description"
        className={cn(
          'm-0 max-w-(--size-measure-max) group-data-[size=lg]/display-banner:type-body-lg',
          className,
        )}
        {...props}
      />
    );
  },
);
DisplayBannerDescription.displayName = 'DisplayBannerDescription';

/* ---- DisplayBannerActions -------------------------------------------------- */

export type DisplayBannerActionsProps = React.HTMLAttributes<HTMLDivElement>;

/** The CTA row. Wraps; a CTA is never wider than the banner. */
export const DisplayBannerActions = React.forwardRef<HTMLDivElement, DisplayBannerActionsProps>(
  function DisplayBannerActions({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="display-banner-actions"
        className={cn('flex max-w-full min-w-0 flex-wrap items-center gap-3 pt-1', className)}
        {...props}
      />
    );
  },
);
DisplayBannerActions.displayName = 'DisplayBannerActions';

/* ---- DisplayBannerArrowLink ------------------------------------------------ */

export type DisplayBannerArrowLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  /**
   * Render as your own link (`next/link`) instead. Without `asChild` and
   * without `href` it is a `<span>`: the drawn CTA inside a linked banner.
   *
   * @default false
   */
  asChild?: boolean;
};

/**
 * "Learn more" with a circled arrow: the quiet CTA of a feature card. A thin
 * wrapper that renders `<Link variant="quiet" standalone trailingIcon="arrow-circle">`
 * and nothing else: colour, hover, focus and the glyph are all Link's own
 * (on a fill too, through the surface-ink contract). Kept for the flat
 * `actionAppearance="arrow"` field and for code that already uses it.
 */
export const DisplayBannerArrowLink = React.forwardRef<HTMLAnchorElement, DisplayBannerArrowLinkProps>(
  function DisplayBannerArrowLink({ asChild = false, href, children, rel, target, ...props }, ref) {
    const shared = {
      ref,
      variant: 'quiet' as const,
      standalone: true,
      trailingIcon: 'arrow-circle' as const,
      'data-slot': 'display-banner-arrow-link',
      ...props,
    };
    if (asChild) {
      return (
        <Link {...shared} asChild>
          {children}
        </Link>
      );
    }
    if (href == null) {
      // Drawn, not a control: a link inside a linked banner would nest <a>s.
      return (
        <Link {...shared} asChild>
          <span>{children}</span>
        </Link>
      );
    }
    const safeRel = target === '_blank' && !rel ? 'noopener noreferrer' : rel;
    return (
      <Link {...shared} href={href} target={target} rel={safeRel}>
        {children}
      </Link>
    );
  },
);
DisplayBannerArrowLink.displayName = 'DisplayBannerArrowLink';

/* ---- DisplayBannerCountdown ------------------------------------------------ */

export type DisplayBannerCountdownProps = React.HTMLAttributes<HTMLParagraphElement> & {
  /** The deadline: ISO 8601 with offset, a `Date`, or epoch ms. See `BannerCountdown`. */
  to: string | number | Date;
  /** The deadline in words, read instead of the ticking digits: "30 Sep, 11:59 PM IST". */
  label: string;
  /**
   * Shown once the deadline has passed.
   *
   * @default '0s'
   */
  expiredText?: string;
};

/** "Ends in 2d 04h 12m 09s": the words (children) and a `BannerCountdown`. */
export const DisplayBannerCountdown = React.forwardRef<HTMLParagraphElement, DisplayBannerCountdownProps>(
  function DisplayBannerCountdown({ className, to, label, expiredText, children, ...props }, ref) {
    return (
      <p
        ref={ref}
        data-slot="display-banner-countdown"
        className={cn(
          'm-0 flex max-w-full flex-wrap items-baseline gap-x-2 font-sans type-body font-medium',
          className,
        )}
        {...props}
      >
        {children != null ? <span>{children}</span> : null}
        {/* The digits' size is passed to BannerCountdown as ITS className (its
            documented escape hatch), not reached into with a descendant rule. */}
        <BannerCountdown to={to} label={label} expiredText={expiredText} className="type-h3" />
      </p>
    );
  },
);
DisplayBannerCountdown.displayName = 'DisplayBannerCountdown';

/* ---- DisplayBannerFinePrint ------------------------------------------------ */

export type DisplayBannerFinePrintProps = React.HTMLAttributes<HTMLParagraphElement>;

/** Terms and disclaimers: the caption role (12px, the floor), pinned to the content's bottom. */
export const DisplayBannerFinePrint = React.forwardRef<HTMLParagraphElement, DisplayBannerFinePrintProps>(
  function DisplayBannerFinePrint({ className, ...props }, ref) {
    return (
      <Text
        ref={ref}
        as="p"
        size="xs"
        tone="secondary"
        data-slot="display-banner-fine-print"
        className={cn('m-0 mt-auto pt-2', className)}
        {...props}
      />
    );
  },
);
DisplayBannerFinePrint.displayName = 'DisplayBannerFinePrint';

/* ---- DisplayBannerMedia ---------------------------------------------------- */

export type DisplayBannerMediaProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Image URL. Or pass your own `<img>`, inline `<svg>` or `next/image fill` as the child. */
  src?: string;
  /**
   * Alt text for `src`. Empty marks the art decorative.
   *
   * @default ''
   */
  alt?: string;
  /**
   * How a direct `img` / `svg` / `video` child fills the frame. `auto`: cover,
   * except `popout`, which is contained and anchored to the bottom.
   *
   * @default 'auto'
   */
  fit?: DisplayBannerMediaFit;
  /**
   * Pad the media by the banner's padding and centre it, instead of running
   * it to the edges: for sub-cards, a QR code, a stat block.
   *
   * @default false
   */
  inset?: boolean;
};

const FILL_CHILD =
  '[&>:is(img,svg,video)]:absolute [&>:is(img,svg,video)]:inset-0 [&>:is(img,svg,video)]:block [&>:is(img,svg,video)]:size-full';

const FIT: Record<DisplayBannerMediaFit, string> = {
  auto: [
    '[&>:is(img,video)]:object-cover',
    'group-data-[media-placement=popout]/display-banner:[&>:is(img,video)]:object-contain',
    'group-data-[media-placement=popout]/display-banner:[&>:is(img,video)]:object-bottom',
    '@min-[36rem]/display-banner:group-data-[media-placement=popout]/display-banner:[&>:is(img,video)]:object-[100%_100%]',
    '@min-[36rem]/display-banner:group-data-[media-placement=popout]/display-banner:rtl:[&>:is(img,video)]:object-[0%_100%]',
    'group-data-[media-placement=bottom]/display-banner:[&>:is(img,video)]:object-[0%_0%]',
    'group-data-[media-placement=bottom]/display-banner:rtl:[&>:is(img,video)]:object-[100%_0%]',
  ].join(' '),
  cover: '[&>:is(img,video)]:object-cover',
  contain: '[&>:is(img,video)]:object-contain',
};

/**
 * The artwork. Where it sits is the banner's `mediaPlacement`; this part only
 * frames and crops. A direct `img`, `svg` or `video` child fills the frame
 * (with `inset`, children flow normally instead).
 */
export const DisplayBannerMedia = React.forwardRef<HTMLDivElement, DisplayBannerMediaProps>(
  function DisplayBannerMedia({ className, src, alt = '', fit = 'auto', inset = false, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="display-banner-media"
        data-fit={fit}
        data-inset={inset ? '' : undefined}
        className={cn(
          'relative min-w-0 [grid-area:media]',
          inset ? 'flex items-center justify-center p-(--db-pad)' : [FILL_CHILD, FIT[fit] ?? FIT.auto],
          // A column at the end or start: cropped flush at the card's edges.
          !inset && 'group-data-[media-placement=end]/display-banner:min-h-[12rem]',
          !inset && 'group-data-[media-placement=start]/display-banner:min-h-[12rem]',
          // Under the content, inset from the start, flush with the end and
          // bottom edges: a screenshot bleeding off the corner.
          !inset && [
            'group-data-[media-placement=bottom]/display-banner:ms-(--db-pad) group-data-[media-placement=bottom]/display-banner:min-h-[10rem]',
            'group-data-[media-placement=bottom]/display-banner:overflow-hidden group-data-[media-placement=bottom]/display-banner:rounded-ss-xl',
          ],
          // Above the top edge: pulled up by the reserved space, clipped only
          // at the card's bottom-end corner (the inner clipped layer).
          'group-data-[media-placement=popout]/display-banner:-mt-(--display-banner-popout)',
          'group-data-[media-placement=popout]/display-banner:min-h-[calc(var(--display-banner-popout)+9rem)]',
          'group-data-[media-placement=popout]/display-banner:overflow-hidden',
          '@min-[36rem]/display-banner:group-data-[media-placement=popout]/display-banner:rounded-ee-2xl',
          // Behind everything; the content brings a scrim.
          'group-data-[media-placement=background]/display-banner:absolute group-data-[media-placement=background]/display-banner:inset-0',
          'group-data-[media-placement=background]/display-banner:-z-20 group-data-[media-placement=background]/display-banner:overflow-hidden',
          className,
        )}
        {...props}
      >
        {src ? <img src={src} alt={alt} loading="lazy" decoding="async" /> : children}
      </div>
    );
  },
);
DisplayBannerMedia.displayName = 'DisplayBannerMedia';

/* ---- DisplayBannerPanel ---------------------------------------------------- */

export type DisplayBannerPanelProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * A glassy sub-card for the media side of a strip (a stat, a feature, a QR
 * code). Its fill is chosen per surface so the banner's text ink still clears
 * 4.5:1 on it: a pale frost on tints, a light veil on inverse, the scrim on a
 * photograph, and no fill (a hairline only) on the saturated solids, which
 * have no contrast to spare.
 */
export const DisplayBannerPanel = React.forwardRef<HTMLDivElement, DisplayBannerPanelProps>(
  function DisplayBannerPanel({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="display-banner-panel"
        className={cn(
          'min-w-0 rounded-xl border border-[color-mix(in_srgb,currentColor_22%,transparent)] bg-(--db-panel) p-4 backdrop-blur-md',
          className,
        )}
        {...props}
      />
    );
  },
);
DisplayBannerPanel.displayName = 'DisplayBannerPanel';
