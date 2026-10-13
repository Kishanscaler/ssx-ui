import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Badge } from '../Badge';
import { Figure } from '../Figure';
import { Heading } from '../Heading';
import { Link } from '../Link';
import type { MarketingCardFields, MarketingPerson } from '../MarketingCard/fields';
import { initials } from '../MarketingCard/initials';
import { PlayDisc } from '../MarketingCard/PlayDisc';
import { PhotoFrame } from '../PhotoFrame';
import { Text } from '../Text';

/* ---------------------------------------------------------------------------
 * ShowcaseCard (marketing)
 *
 * A venture, a club, a challenge: a square inset at the card's start, the
 * copy beside it. The SSB home page's `VentureCard` (Beyond Placements, the
 * Innovation Lab's startups), its `ClubCard` (campus life) and its
 * `ChallengeCard` (learn by doing), as one card with flat props.
 *
 *   <ShowcaseCard
 *     title="Hummusapiens"
 *     tag="Food & beverage"
 *     image={photo}
 *     figure="₹50L"
 *     figureLabel="offered on Shark Tank India"
 *     people={[{ name: 'Aashish US', avatar: url }]}
 *     peopleRole="Cohort 1"
 *     description="Hummus in jars, sold across Bengaluru."
 *     href="https://example.com"
 *   />
 *
 * THE SQUARE (`PhotoFrame`, inset 8px with its own corners) holds, in order of
 * precedence: the photo (`image`); or a startup's `banner`, a wide logo that
 * cannot be cropped square, laid across the square's middle on a ground of
 * its own two colours (`bannerTop`, `bannerBottom`: the company's, content and
 * not tokens), faded into them at its top and bottom; or the fixed dark plate.
 * On it: the `tag` on the light glass at its top start, the `figure` in white
 * at its foot with `figureLabel` under it, and the play control. A figure is
 * what makes the photo blur toward its foot under a scrim; without one the
 * photo is plain.
 *
 * THE COPY: the title (a link to `href`, named by the title, with an arrow
 * at the row's end), the `people` (32px round photos, initials until there
 * is one) with their names and `peopleRole` under them, and at the foot,
 * level with the figure, the `description` and, with `hrefLabel`, a quiet
 * arrow link with those words (`showcase-card-action`, `data-part="action"`;
 * the title then stays plain, so the destination is offered once: the same
 * `hrefLabel` as MediaCard's and PersonCard's). Every optional slot omitted
 * is a variant (README rule 3); an empty string is an unset field.
 *
 * WIDTH comes from the cell (the page's rail gives 38rem). The card is a size
 * container: from `region-sm` (480px) of its OWN width up it is a row, the
 * square taking two fifths; narrower it stacks, the media a 16:9 cut over the
 * copy (the page's call: a square over the copy made a phone's card tall).
 * A viewport breakpoint would set a narrow grid cell's card as a row. The
 * frame's ratio changes with the container, so it carries no `data-ratio`.
 *
 * PEOPLE are server `<img>`s with an initials fallback, not Radix Avatar
 * (which paints its initials first on a server-rendered page). Photos
 * overlap, cut out of each other by a surface ring, as AvatarGroup's; an
 * initials disc never overlaps a neighbour, which would cut its letters. The
 * row is decorative to assistive tech: the names are written beside it.
 *
 * THE PLAY CONTROL: with `videoUrl`, the family's play disc (the fixed dark
 * glass) linking to it in the same tab, named "Play: <title>", the whole
 * square its hit area. `playSlot` replaces it (a button that opens the
 * page's lightbox, a new tab): it is placed centred over the square; make it
 * `size-full` for the whole square to be the hit area. The tag and the
 * figure sit above it and let the pointer through.
 *
 * Markers, no motion (README rule 4): `data-slot="showcase-card"` and
 * `showcase-card-{media,banner,tag,figure,figure-label,play,body,head,title,
 * link,people,avatar,names,role,footer,description,action}`; `data-part`
 * photo (PhotoFrame's layer), figure (the Figure), title, avatars, subline,
 * description, action. Server component. React 16 safe.
 * ------------------------------------------------------------------------- */

/** The element a ShowcaseCard renders as: `li` in a list of your own (inside a Rail, `article`: RailItem is the `li`). */
export type ShowcaseCardElement = 'article' | 'li' | 'div';

export const showcaseCardVariants = cva([
  // A size container: the layout follows the card's own width (see above).
  '@container/showcase-card',
  'flex h-full w-full min-w-0 flex-wrap overflow-hidden font-sans',
  'rounded-lg border border-border-decorative bg-surface text-content',
]);

export interface ShowcaseCardProps
  extends Omit<MarketingCardFields, 'title' | 'eyebrow' | 'logos'>,
    Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** The company, the club, the challenge: the card's heading. With `href` it is the link. */
  title: string;
  /**
   * A wide logo banner instead of a photo: the square takes `bannerTop`/
   * `bannerBottom` as its ground and the banner sits across its middle, faded
   * in at its top and bottom. Colours are content (the company's), not
   * tokens. `image` wins when both are given.
   */
  banner?: string;
  /** The banner's top colour (any CSS colour, sampled from its top rows). */
  bannerTop?: string;
  /** The banner's bottom colour (any CSS colour, sampled from its bottom rows). */
  bannerBottom?: string;
  /**
   * Founders / the channel: 32px avatars (initials until there is one,
   * overlapping) with names; `peopleRole` under them ("Cohort 1",
   * "761 views · 10 months ago"). Omit for no people row.
   */
  people?: MarketingPerson[];
  /** The line under the names: who they are to it, or the video's facts. */
  peopleRole?: string;
  /**
   * Code-side escape hatch for the play control (a lightbox button). Default:
   * with `videoUrl`, a play disc link to it. Not a CMS field.
   */
  playSlot?: React.ReactNode;
  /**
   * The element. `li` as a direct child of a `ul`/`ol` of your own; inside a
   * `Rail` keep `article` (`RailItem` is the `li`).
   *
   * @default 'article'
   */
  as?: ShowcaseCardElement;
}

const ARROW = 'M7 17 17 7M8 7h9v9';

/** Above the play control's hit area, letting the pointer through to it. */
const OVER_PLAY = 'z-raised pointer-events-none';

function People({ people, role }: { people: MarketingPerson[]; role?: string }) {
  return (
    <div data-slot="showcase-card-people" data-part="avatars" className="flex min-w-0 items-center gap-2.5">
      <span aria-hidden="true" className="flex shrink-0">
        {people.map((person, i) => {
          const prev = i > 0 ? people[i - 1] : undefined;
          // Photos overlap; an initials disc keeps a hair of room either side.
          const overlap = Boolean(prev && prev.avatar && person.avatar);
          const offset = i === 0 ? undefined : overlap ? '-ms-2' : 'ms-1';
          const ring = 'size-8 shrink-0 rounded-full ring-thick ring-surface';
          return person.avatar ? (
            <img
              key={i}
              data-slot="showcase-card-avatar"
              src={person.avatar}
              alt=""
              width={32}
              height={32}
              loading="lazy"
              decoding="async"
              // A hairline inside the edge, so a white mark (a channel's) still reads on the card.
              className={cn(
                ring,
                'block object-cover outline outline-border-decorative -outline-offset-(--border-hair)',
                offset,
              )}
            />
          ) : (
            <span
              key={i}
              data-slot="showcase-card-avatar"
              data-fallback=""
              className={cn(
                ring,
                'grid place-items-center bg-surface-active text-xs leading-flat font-semibold text-content-secondary',
                offset,
              )}
            >
              {initials(person.name)}
            </span>
          );
        })}
      </span>
      <span className="grid min-w-0">
        <Text as="span" size="sm" data-slot="showcase-card-names" className="font-medium">
          {people.map((p) => p.name).join(', ')}
        </Text>
        {role ? (
          <Text as="span" size="xs" tone="secondary" data-slot="showcase-card-role" data-part="subline">
            {role}
          </Text>
        ) : null}
      </span>
    </div>
  );
}

export const ShowcaseCard = React.forwardRef<HTMLElement, ShowcaseCardProps>(function ShowcaseCard(
  {
    className,
    as = 'article',
    title,
    titleAs = 'h3',
    description,
    image,
    imageAlt = '',
    imagePosition,
    imageSrcSet,
    imageSizes,
    priority = false,
    tag,
    figure,
    figureLabel,
    href,
    hrefLabel,
    videoUrl,
    banner,
    bannerTop,
    bannerBottom,
    people,
    peopleRole,
    playSlot,
    children,
    ...props
  },
  ref,
) {
  const hasFigure = Boolean(figure);
  const showBanner = !image && Boolean(banner);
  const play =
    playSlot != null && playSlot !== false ? (
      playSlot
    ) : videoUrl ? (
      <PlayDisc href={videoUrl} title={title} area="fill" />
    ) : null;

  const titleLinked = Boolean(href) && !hrefLabel;
  const action =
    href && hrefLabel ? (
      <Link
        href={href}
        variant="quiet"
        trailingIcon="arrow"
        standalone
        data-slot="showcase-card-action"
        data-part="action"
        className="self-start"
      >
        {hrefLabel}
      </Link>
    ) : null;

  const titleText = titleLinked ? (
    <a
      href={href}
      data-slot="showcase-card-link"
      className={cn(
        'group/link flex items-start justify-between gap-3 rounded-md text-inherit no-underline outline-none',
        'focus-visible:outline-focus focus-visible:outline-solid focus-visible:outline-border-focus',
        'focus-visible:outline-offset-focus',
      )}
    >
      <span className="min-w-0 decoration-hair underline-offset-link group-hover/link:underline">{title}</span>
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
          'transition-colors duration-(--motion-duration-fast) group-hover/link:text-content',
        )}
      >
        <path d={ARROW} />
      </svg>
    </a>
  ) : (
    title
  );

  return React.createElement(
    as,
    {
      ref,
      'data-slot': 'showcase-card',
      'data-media': image ? 'photo' : showBanner ? 'banner' : 'plate',
      className: cn(showcaseCardVariants(), className),
      ...props,
    },
    <div
      data-slot="showcase-card-media"
      className={cn(
        'min-w-0 basis-full p-2 pb-0',
        '@min-region-sm/showcase-card:basis-2/5 @min-region-sm/showcase-card:pb-2 @min-region-sm/showcase-card:pe-0',
      )}
    >
      <PhotoFrame
        src={image}
        srcSet={imageSrcSet}
        sizes={imageSizes}
        alt={imageAlt}
        position={imagePosition}
        priority={priority}
        // 16:9 while the card is stacked, the square beside the copy. The
        // ratio follows the container, so no `data-ratio` names one.
        ratio="16:9"
        data-ratio={undefined}
        blur={hasFigure ? 'bottom' : 'none'}
        placeholder="plate"
        className="@min-region-sm/showcase-card:aspect-square"
      >
        {showBanner ? (
          <div
            data-slot="showcase-card-banner"
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden bg-linear-to-b from-(--ssx-banner-top) to-(--ssx-banner-bottom)"
            style={
              {
                ...(bannerTop ? { '--ssx-banner-top': bannerTop } : null),
                ...(bannerBottom ? { '--ssx-banner-bottom': bannerBottom } : null),
              } as React.CSSProperties
            }
          >
            <img
              src={banner}
              alt=""
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              className="absolute inset-x-0 top-1/2 block h-auto w-full max-w-none -translate-y-1/2"
            />
          </div>
        ) : null}
        {play ? (
          <div data-slot="showcase-card-play" className="absolute inset-0 grid place-items-center">
            {play}
          </div>
        ) : null}
        {tag ? (
          <Badge tone="glass" data-slot="showcase-card-tag" className={cn('absolute top-4 start-4', OVER_PLAY)}>
            {tag}
          </Badge>
        ) : null}
        {hasFigure ? (
          <div
            data-slot="showcase-card-figure"
            data-surface-ink="on-image"
            className={cn('relative flex flex-col gap-1 p-4', OVER_PLAY)}
          >
            <Figure value={figure as string} size="md" />
            {figureLabel ? (
              <Text size="sm" tone="secondary" data-slot="showcase-card-figure-label">
                {figureLabel}
              </Text>
            ) : null}
          </div>
        ) : null}
      </PhotoFrame>
    </div>,
    <div
      data-slot="showcase-card-body"
      className="flex min-w-0 basis-full flex-col gap-5 p-5 @min-region-sm/showcase-card:basis-3/5"
    >
      <div data-slot="showcase-card-head" className="flex min-w-0 flex-col gap-3">
        <Heading as={titleAs} size="2" data-slot="showcase-card-title" data-part="title">
          {titleText}
        </Heading>
        {people && people.length ? <People people={people} role={peopleRole} /> : null}
      </div>
      {description || action ? (
        // The foot, level with the figure.
        <div data-slot="showcase-card-footer" className="mt-auto flex min-w-0 flex-col gap-3">
          {description ? (
            <Text size="sm" tone="secondary" data-slot="showcase-card-description" data-part="description">
              {description}
            </Text>
          ) : null}
          {action}
        </div>
      ) : null}
      {children}
    </div>,
  );
});
ShowcaseCard.displayName = 'ShowcaseCard';
