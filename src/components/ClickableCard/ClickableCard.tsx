import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Card, type CardProps, type CardVariant } from '../Card';

/* ---------------------------------------------------------------------------
 * ClickableCard
 *
 * A Card whose whole surface is ONE target leading to ONE destination. Use it
 * when there is exactly one thing the card does.
 *
 * THE NESTING RULE. Nothing interactive goes inside: no Button, no Link, no
 * IconButton, no form control. A link inside a link is invalid HTML, a button
 * inside a button is invalid HTML, and either is ambiguous to click and to
 * announce. A card that carries its own actions is a `Card` with a
 * `CardFooter`, not this.
 *
 * The element is always real: `href` renders an `<a>`, no `href` renders a
 * `<button type="button">`, and `asChild` lends every style to your own link
 * (`next/link`, a router link) — the package never imports `next/*`:
 *
 *   <ClickableCard asChild title="Data Structures & Algorithms">
 *     <NextLink href="/modules/dsa" />
 *   </ClickableCard>
 *
 * Hover: the border turns `border-brand` and the card lifts 2px
 * (`translateY(-2px)`, `motion-duration-normal`) — the same motion the Button
 * uses. Both signals are needed: under `prefers-reduced-motion` the lift is
 * dropped and only the border colour remains. A press settles it back.
 * Focus: the shared 3px ring. On `variant="media"` the hover deepens the scrim
 * instead of recolouring a border the media card does not have; the photo
 * itself never moves relative to the card.
 *
 * Server component: we attach no handler. (An `onClick` you pass is yours, and
 * only works from a Client Component; for navigation use `href` / `asChild`.)
 * ------------------------------------------------------------------------- */

export const clickableCardVariants = cva(
  [
    // Resets for the <button> case (UA padding, margin, font size), and the
    // <a> case (underline). Width fills its grid cell or list item.
    'm-0 w-full cursor-pointer p-0 text-left no-underline',
    '[font-size:inherit] [font-weight:inherit] [line-height:inherit]',
    // `translate` and `scale` are their own properties in Tailwind v4, not
    // `transform`, so they are named here or the lift and press would snap.
    'outline-none transition-[border-color,translate,scale]',
    'duration-[var(--motion-duration-normal)] ease-[var(--motion-easing-productive-in-out)]',
    // The Button's order, at a surface's size: hover (pointer devices only)
    // lifts by --motion-offset-lift; a press drops back to rest and scales in
    // to --motion-scale-press-surface (0.99: a card is big, so it moves half
    // as far as a control), instantly, then springs back on release.
    'hover:-translate-y-(--motion-offset-lift)',
    'active:translate-y-0 active:scale-(--motion-scale-press-surface) active:duration-(--motion-duration-instant)',
    'focus-visible:ring-halo focus-visible:ring-focus-halo',
    'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100',
    // A disabled <button> card: no lift, no pointer, a disabled fill and the
    // disabled ink for its own text (the title inherits it). The eyebrow and
    // description dim themselves: Heading and Text read `in-disabled:` in
    // their own recipes. Nothing here re-points their roles.
    'disabled:pointer-events-none disabled:bg-surface-disabled disabled:text-content-disabled',
    'aria-disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        default: 'hover:border-border-brand focus-visible:border-border-focus',
        // The scrim deepens from 42% to 58% solid on hover, so the caption
        // gains contrast rather than the photo gaining a frame.
        media: 'hover:before:from-58%',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type ClickableCardProps = Omit<CardProps, 'as'> & {
  /**
   * Destination. Set: the card renders as `<a href>`. Unset: a
   * `<button type="button">` for an in-page action. Ignored with `asChild`
   * (put `href` on your link).
   */
  href?: string;
  /** Anchor `target`, with `href`. A new tab needs `rel="noopener"`, which is added. */
  target?: string;
  /** Anchor `rel`, with `href`. */
  rel?: string;
  /**
   * Button only (no `href`): disables the card. A link cannot be disabled;
   * remove the `href` or render a Card instead.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Button only (no `href`).
   *
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';
};

export const ClickableCard = React.forwardRef<HTMLElement, ClickableCardProps>(
  function ClickableCard(
    {
      className,
      variant = 'default',
      asChild = false,
      href,
      target,
      rel,
      disabled,
      type = 'button',
      children,
      ...props
    },
    ref,
  ) {
    const resolvedVariant: CardVariant = variant === 'media' ? 'media' : 'default';
    let element: React.ReactElement;
    if (asChild) {
      element = React.Children.only(children) as React.ReactElement;
    } else if (href != null) {
      const safeRel = target === '_blank' && !rel ? 'noopener noreferrer' : rel;
      element = (
        <a href={href} target={target} rel={safeRel}>
          {children}
        </a>
      );
    } else {
      element = (
        <button type={type} disabled={disabled}>
          {children}
        </button>
      );
    }

    return (
      <Card
        ref={ref}
        asChild
        variant={resolvedVariant}
        data-slot="clickable-card"
        className={cn(clickableCardVariants({ variant: resolvedVariant }), className)}
        {...props}
      >
        {element}
      </Card>
    );
  },
);
ClickableCard.displayName = 'ClickableCard';
