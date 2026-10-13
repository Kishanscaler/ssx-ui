import * as React from 'react';

import { cn } from '../../lib/cn';
import { AVATAR_CUTOUT, AVATAR_OVERLAP, avatarVariants } from '../Avatar/avatar-variants';
import { Badge, type BadgeProps } from '../Badge';
import { Heading } from '../Heading';
import type { MarketingPerson } from './fields';
import { initials } from './initials';

/* ---------------------------------------------------------------------------
 * The marketing family's shared parts (internal; not exported from the entry)
 *
 * Each part here is drawn ONCE so the cards that show it cannot drift apart:
 *
 *   ACCENT_INK        the accent phrase (SectionHeader) and the brand figure
 *                     (Figure, so StatCard): `--ssx-content-accent`, falling
 *                     back to `--content-brand`; the on-image ink on a photo.
 *   MarketingEyebrow  the kicker over a title (SectionHeader, StatCard,
 *                     PersonCard, MediaCard): the eyebrow role in the brand
 *                     ink on the page, the full on-image ink on a photo.
 *   PhotoTag          a card's tag on its photo (PersonCard, ShowcaseCard,
 *                     MediaCard): the system's glass `Badge`, top start, 16px
 *                     in (as Badge's own "glass on a photo" story places it),
 *                     above a play control and letting the pointer through.
 *   TitleLink         a card's linked title (PersonCard, ShowcaseCard,
 *                     MediaCard): the heading's own ink, underlined on hover
 *                     as a quiet Link is; the focus outline is the base
 *                     layer's, in the on-image ink on a photo (as Link's).
 *   PersonAvatar      a person in a people row or on a plate (ShowcaseCard,
 *                     ProfilePlate): the system's Avatar recipe at `sm`, as a
 *                     server `<img>` with an initials fallback (README rule 5).
 *
 * Server components. React 16 safe.
 * ------------------------------------------------------------------------- */

/** The accent ink: the README's `content.accent` request, white on a photo. */
export const ACCENT_INK = cn(
  'text-(color:--ssx-content-accent,var(--content-brand))',
  'in-data-[surface-ink=on-image]:text-on-image-ink',
);

/** The eyebrow's ink: the brand's on the page, the full on-image ink on a photo. */
export const EYEBROW_INK = 'text-content-brand in-data-[surface-ink=on-image]:text-on-image-ink';

export type MarketingEyebrowProps = React.HTMLAttributes<HTMLParagraphElement>;

/** The kicker over a title: `Heading size="eyebrow"`, kept out of the outline, in the brand ink. */
export const MarketingEyebrow = React.forwardRef<HTMLParagraphElement, MarketingEyebrowProps>(
  function MarketingEyebrow({ className, ...props }, ref) {
    return (
      <Heading
        ref={ref as React.Ref<HTMLHeadingElement>}
        as="p"
        size="eyebrow"
        data-part="eyebrow"
        className={cn(EYEBROW_INK, className)}
        {...props}
      />
    );
  },
);
MarketingEyebrow.displayName = 'MarketingEyebrow';

/** A card's tag on its photo: the glass Badge at the photo's top start. */
export function PhotoTag({ className, ...props }: Omit<BadgeProps, 'tone'>) {
  return (
    <Badge
      tone="glass"
      className={cn('pointer-events-none absolute start-4 top-4 z-raised', className)}
      {...props}
    />
  );
}

/**
 * The stretched link: its `::after` covers the nearest positioned ancestor (the
 * card) above everything in it, so the whole card is the target.
 */
export const STRETCH = "after:absolute after:inset-0 after:z-raised after:rounded-lg after:content-['']";

const TITLE_LINK = cn(
  'text-inherit no-underline decoration-hair underline-offset-link hover:underline',
  'in-data-[surface-ink=on-image]:focus-visible:outline-on-image-ink',
);

/** An arrow pointing up and out, drawn on a 24 grid: "go there". Mirrored in RTL. */
const ARROW_OUT = 'M7 17 17 7M8 7h9v9';

export interface TitleLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Stretch the link over the card (its `::after`); the card must be positioned. */
  stretch?: boolean;
  /** An arrow at the title row's end; the title then underlines, not the row. */
  arrow?: boolean;
}

/** A card's linked title, in the heading's own ink. */
export function TitleLink({ stretch = false, arrow = false, className, children, ...props }: TitleLinkProps) {
  return (
    <a
      className={cn(
        TITLE_LINK,
        arrow && 'group/title-link flex items-start justify-between gap-3 hover:no-underline',
        stretch && STRETCH,
        className,
      )}
      {...props}
    >
      {arrow ? (
        <>
          <span className="min-w-0 decoration-hair underline-offset-link group-hover/title-link:underline">
            {children}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className={cn(
              'mt-1 size-icon-md shrink-0 text-content-secondary rtl:-scale-x-100',
              'transition-colors duration-(--motion-duration-fast) motion-reduce:transition-none',
              'group-hover/title-link:text-content',
            )}
          >
            <path d={ARROW_OUT} />
          </svg>
        </>
      ) : (
        children
      )}
    </a>
  );
}

export interface PersonAvatarProps {
  person: MarketingPerson;
  /** The slot name the card marks it with. */
  slot: string;
  /** Pull it under the avatar before it (AvatarGroup's overlap), cut out by a surface ring. */
  overlap?: boolean;
  /** Cut it out of what is behind by a surface ring (a row of avatars). */
  cutout?: boolean;
  className?: string;
}

/**
 * A person's avatar, drawn as the system's Avatar (`sm`, 28px): the photo, or
 * their initials on the brand's subtle tint. Decorative: the name is beside it.
 */
export function PersonAvatar({ person, slot, overlap = false, cutout = false, className }: PersonAvatarProps) {
  const classes = cn(
    avatarVariants({ size: 'sm' }),
    cutout && AVATAR_CUTOUT,
    overlap && AVATAR_OVERLAP,
    className,
  );
  if (person.avatar) {
    return (
      <img
        data-slot={slot}
        src={person.avatar}
        alt=""
        width={28}
        height={28}
        loading="lazy"
        decoding="async"
        // A hairline inside the edge, so a white mark (a channel's) still reads on the card.
        className={cn(classes, 'block object-cover outline outline-border-decorative -outline-offset-(--border-hair)')}
      />
    );
  }
  return (
    <span data-slot={slot} data-fallback="" aria-hidden="true" className={classes}>
      {initials(person.name)}
    </span>
  );
}
