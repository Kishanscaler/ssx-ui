import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Badge } from '../Badge';
import { Figure } from '../Figure';
import { Heading } from '../Heading';
import type { MarketingCardFields, MarketingPerson } from '../MarketingCard/fields';
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
 * THE COPY: the title (a link to `href`, with an arrow at the row's end), the
 * `people` (32px round photos, initials until there is one) with their names
 * and `peopleRole` under them, and the `description` at the foot, level with
 * the figure. Every optional slot omitted is a variant (README rule 3).
 *
 * WIDTH comes from the cell (the page's rail gives 38rem). The card is a size
 * container: from `region-sm` (480px) of its OWN width up it is a row, the
 * square taking two fifths; narrower it stacks, the media a 16:9 cut over the
 * copy (the page's call: a square over the copy made a phone's card tall).
 * A viewport breakpoint would set a narrow grid cell's card as a row.
 *
 * PEOPLE are server `<img>`s with an initials fallback, not Radix Avatar
 * (which paints its initials first on a server-rendered page). Photos
 * overlap, cut out of each other by a surface ring, as AvatarGroup's; an
 * initials disc never overlaps a neighbour, which would cut its letters. The
 * row is decorative to assistive tech: the names are written beside it.
 *
 * THE PLAY CONTROL: with `videoUrl`, a play disc linking to it, the whole
 * square its hit area. `playSlot` replaces it (a button that opens the page's
 * lightbox): it is placed centred over the square; make it `size-full` for
 * the whole square to be the hit area. The tag and the figure sit above it
 * and let the pointer through.
 *
 * Markers, no motion (README rule 4): `data-slot="showcase-card"` and
 * `showcase-card-{media,banner,tag,figure,figure-label,play,body,head,title,
 * link,people,avatar,names,role,description}`; `data-part` photo (PhotoFrame's
 * layer), figure (the Figure), title, avatars, subline, description. Server
 * component. React 16 safe.
 * ------------------------------------------------------------------------- */

/** The element a ShowcaseCard renders as: `li` inside a list or a Rail. */
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
   * The element. `li` inside a list or a Rail.
   *
   * @default 'article'
   */
  as?: ShowcaseCardElement;
}

/** First letters of up to two words: "Mayank Kelwani" → "MK". */
export function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

const ARROW = 'M7 17 17 7M8 7h9v9';
const PLAY = 'M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z';

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
      <a
        href={videoUrl}
        aria-label={`Play video: ${title}`}
        className="group/play grid size-full place-items-center outline-none"
      >
        <span
          className={cn(
            'grid size-control-lg place-items-center rounded-full shadow-2',
            'bg-on-image-ink text-on-image-action-fg group-hover/play:bg-on-image-action-bg-hover',
            'transition-[background-color,scale] duration-(--motion-duration-fast) ease-(--motion-easing-productive-in-out)',
            'group-active/play:scale-(--motion-scale-press) motion-reduce:transition-none',
            // The focus ring on the disc: the square clips anything at its own edge.
            'group-focus-visible/play:outline-focus group-focus-visible/play:outline-solid',
            'group-focus-visible/play:outline-on-image-ink group-focus-visible/play:outline-offset-focus',
          )}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className="size-icon-md">
            <path d={PLAY} />
          </svg>
        </span>
      </a>
    ) : null;

  const titleText = href ? (
    <a
      href={href}
      aria-label={hrefLabel}
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
        ratio="1:1"
        blur={hasFigure ? 'bottom' : 'none'}
        placeholder="plate"
        // 16:9 while the card is stacked, the square beside the copy.
        className="aspect-video @min-region-sm/showcase-card:aspect-square"
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
      {description != null && description !== '' ? (
        <Text
          size="sm"
          tone="secondary"
          data-slot="showcase-card-description"
          data-part="description"
          className="mt-auto"
        >
          {description}
        </Text>
      ) : null}
      {children}
    </div>,
  );
});
ShowcaseCard.displayName = 'ShowcaseCard';
