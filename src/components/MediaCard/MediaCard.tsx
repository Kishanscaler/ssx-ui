import * as React from 'react';

import { cn } from '../../lib/cn';
import { Badge } from '../Badge';
import { CardBody, CardDescription, CardEyebrow, CardTitle, cardVariants } from '../Card';
import type { CardMediaRatio } from '../Card';
import { Figure } from '../Figure';
import { GlassPlate } from '../GlassPlate';
import { Heading } from '../Heading';
import { Link } from '../Link';
import { LogoTile } from '../LogoTile';
import type { MarketingCardFields } from '../MarketingCard/fields';
import { PhotoFrame } from '../PhotoFrame';
import { Text } from '../Text';

/* ---------------------------------------------------------------------------
 * MediaCard (marketing)
 *
 * Media, then copy: a news story, a recorded session, an immersion, a live
 * project. It is `Card` with the marketing slots (a tag, a figure, a play
 * control, logos, a company line) and two more places for the copy:
 *
 *   - `below` the bordered Card: the media edge to edge across its head, the
 *     copy in a `CardBody` under it (In the news, Super Mentor Sessions).
 *   - `plate` the media fills the card and the copy sits on a glass plate
 *     over its foot, in white (the immersion features).
 *   - `overlay` the copy sits on the photo itself, over a progressive blur
 *     and a scrim rising to the foot (the live projects).
 *
 *   <MediaCard ratio="16:9" eyebrow="Economic Times" title="…" href={url} descriptionLines={3} />
 *   <MediaCard copy="overlay" ratio="3:4" image={url} company="Zepto" title="…" description="…" />
 *
 * EVERY OPTIONAL SLOT OMITTED IS A VARIANT (src/marketing/README.md). No
 * `image`: the frame's ground (the sunken grey under copy `below`, the fixed
 * dark plate under white copy). No `tag`: no chip. No `figure`: no blur on a
 * `below` card's media (an `overlay` card always blurs: its copy stands on
 * it). No `videoUrl` and no `playSlot`: no play control.
 *
 * ONE MEDIA IMPLEMENTATION: every copy placement draws its media with
 * `PhotoFrame`, so the photo is always `data-part="photo"` and a tag, a figure
 * or a play disc can be laid on it. Under `below` the frame runs square-cornered
 * into the card's own rounded clip, as `CardMedia` does.
 *
 * WHITE TYPE ON THE PHOTO is declared, not re-pointed: `plate` puts it on the
 * plate (`GlassPlate` declares `data-surface-ink="on-image"`), `overlay` on
 * the card's root; the Heading, Text, Figure and Link inside ink themselves.
 *
 * THE PLAY CONTROL. With `videoUrl`, a round glass disc centred on the media
 * links to the video (a new tab), named "Play <title>". `playSlot` replaces it
 * with the page's own (a player swapped in place, a lightbox trigger): it is
 * laid over the media, centred, and may fill it (`size-full`).
 *
 * THE LINK. `href` links the title. With `hrefLabel` too, the title stays plain
 * and a quiet arrow link with those words follows the copy instead, so the
 * card never offers the same destination twice.
 *
 * Markers, no motion: `data-slot="media-card"` (`data-copy`, `data-size`) with
 * `media-card-media`, `-tag`, `-figure`, `-play`, `-body`, `-plate`,
 * `-company`, `-eyebrow`, `-title`, `-description`, `-footer` (the logos and
 * the action), `-logos`, `-action` and
 * the `data-part`s `eyebrow`, `title`, `description`, `logos`, `action`
 * (`photo` comes from PhotoFrame, `figure` from Figure). Width comes from the
 * cell. Server component: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

/** Where the copy sits: under the media, on a glass plate over its foot, or on the photo. */
export type MediaCardCopy = 'below' | 'plate' | 'overlay';
/** The media's ratio, width:height. */
export type MediaCardRatio = CardMediaRatio;
/** `sm` the story card · `md` the feature. */
export type MediaCardSize = 'sm' | 'md';
/** The element a MediaCard renders as. */
export type MediaCardElement = 'article' | 'li' | 'div';

export interface MediaCardProps extends MarketingCardFields, Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /**
   * Where the copy sits: under the media (`below`), on a glass plate over its
   * foot (`plate`), or on the photo over a progressive blur (`overlay`).
   *
   * @default 'below'
   */
  copy?: MediaCardCopy;
  /**
   * The media's ratio. Under `plate` and `overlay` it is the card's shape (the
   * card grows taller only if its copy needs the room).
   *
   * @default '4:3'
   */
  ratio?: MediaCardRatio;
  /** A company line over a hairline above the title (the live projects' brief). */
  company?: string;
  /**
   * `sm` the news or story card (title at the card title's size, h3 role) ·
   * `md` the feature (title at the h1 role, body-size copy, a deeper plate
   * inset). It scales type and insets, never the width.
   *
   * @default 'sm'
   */
  size?: MediaCardSize;
  /** Clamp the description to this many lines (CSS only: the full text stays in the markup). */
  descriptionLines?: 2 | 3;
  /**
   * Code-side escape hatch for the play control (an in-place player, a
   * lightbox). Not a CMS field. Default: with `videoUrl`, a play disc linking
   * to it over the media.
   */
  playSlot?: React.ReactNode;
  /**
   * The element. `li` inside a list or a rail.
   *
   * @default 'article'
   */
  as?: MediaCardElement;
}

const CLAMP: Record<2 | 3, string> = { 2: 'line-clamp-2', 3: 'line-clamp-3' };

/** The title link: the heading's own ink, underlined on hover; the fill's ink for its focus outline. */
const TITLE_LINK = cn(
  'text-current no-underline decoration-hair underline-offset-link hover:underline',
  'in-data-[surface-ink=on-image]:focus-visible:outline-on-image-ink',
);

/**
 * The play disc: the fixed dark plate (the README's `glass.on-image.plate`
 * request, as GlassPlate's `dark` tone), frosted, so it reads on a pale photo
 * in both themes; centred by `inset-0 m-auto`, which holds in RTL.
 */
const PLAY_DISC = cn(
  'grid size-12 place-items-center rounded-full',
  'border border-glass-on-image-hover bg-(--ssx-plate-on-photo,var(--surface-image-scrim)) text-on-image-ink',
  'backdrop-blur-glass backdrop-saturate-(--glass-saturate)',
  'focus-visible:outline-on-image-ink',
);

export const MediaCard = React.forwardRef<HTMLElement, MediaCardProps>(function MediaCard(
  {
    className,
    copy = 'below',
    ratio = '4:3',
    size = 'sm',
    as = 'article',
    eyebrow,
    title,
    titleAs = 'h3',
    description,
    descriptionLines,
    image,
    imageAlt = '',
    imagePosition,
    imageSrcSet,
    imageSizes,
    priority,
    tag,
    figure,
    figureLabel,
    company,
    logos,
    href,
    hrefLabel,
    videoUrl,
    playSlot,
    children,
    ...props
  },
  ref,
) {
  const below = copy === 'below';
  const md = size === 'md';
  const hasLogos = Boolean(logos && logos.length);
  const titleLinked = Boolean(href) && !hrefLabel;
  const playName = typeof title === 'string' ? `Play ${title}` : 'Play video';

  /* ---- the parts ---------------------------------------------------------- */

  const tagNode = tag ? (
    <span data-slot="media-card-tag" className="absolute start-4 top-4">
      <Badge tone="glass">{tag}</Badge>
    </span>
  ) : null;

  const play =
    playSlot != null && playSlot !== false ? (
      playSlot
    ) : videoUrl ? (
      <a href={videoUrl} target="_blank" rel="noopener noreferrer" aria-label={playName} className={PLAY_DISC}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-icon-md fill-current">
          <path d="M8 5.5v13l10.5-6.5z" />
        </svg>
      </a>
    ) : null;
  // Laid over the media and centred; it lets the pointer through to what is
  // under it except on the control itself, which may fill it.
  const playNode = play ? (
    <div
      data-slot="media-card-play"
      className="pointer-events-none absolute inset-0 grid place-items-center [&>*]:pointer-events-auto"
    >
      {play}
    </div>
  ) : null;

  const figureNode = figure ? (
    <div data-slot="media-card-figure" className={cn('grid gap-1', below && 'p-5')}>
      <Figure value={figure} size={md ? 'md' : 'sm'} />
      {figureLabel ? (
        <Text as="p" size="sm" tone="secondary">
          {figureLabel}
        </Text>
      ) : null}
    </div>
  ) : null;

  const titleText = titleLinked ? (
    <a href={href} className={TITLE_LINK}>
      {title}
    </a>
  ) : (
    title
  );
  const titleNode =
    title != null ? (
      md ? (
        <Heading as={titleAs} size="1" data-slot="media-card-title" data-part="title">
          {titleText}
        </Heading>
      ) : (
        <CardTitle as={titleAs} data-slot="media-card-title" data-part="title">
          {titleText}
        </CardTitle>
      )
    ) : null;

  const clamp = descriptionLines ? CLAMP[descriptionLines] : undefined;
  const action =
    href && hrefLabel ? (
      <Link
        href={href}
        variant="quiet"
        trailingIcon="arrow"
        standalone
        data-slot="media-card-action"
        data-part="action"
        className="self-start"
      >
        {hrefLabel}
      </Link>
    ) : null;

  const copyParts = (
    <>
      {!below ? figureNode : null}
      {eyebrow != null ? (
        <CardEyebrow data-slot="media-card-eyebrow" data-part="eyebrow">
          {eyebrow}
        </CardEyebrow>
      ) : null}
      {company ? (
        <Heading
          as="p"
          size="2"
          data-slot="media-card-company"
          className={cn(
            'mb-1 border-b border-border-decorative pb-3',
            'in-data-[surface-ink=on-image]:border-glass-on-image',
          )}
        >
          {company}
        </Heading>
      ) : null}
      {titleNode}
      {description != null ? (
        md ? (
          <Text
            as="p"
            size="base"
            tone="secondary"
            data-slot="media-card-description"
            data-part="description"
            className={clamp}
          >
            {description}
          </Text>
        ) : (
          <CardDescription data-slot="media-card-description" data-part="description" className={clamp}>
            {description}
          </CardDescription>
        )
      ) : null}
      {hasLogos || action ? (
        // The foot of the copy. Under `below` it sinks to the card's foot, so
        // the logos of cards sharing a row line up.
        <div data-slot="media-card-footer" className="mt-auto flex flex-col gap-3 pt-2">
          {hasLogos ? (
            <div data-slot="media-card-logos" data-part="logos" className="grid grid-cols-3 gap-2">
              {logos!.map((logo, i) => (
                <LogoTile key={`${logo.name}-${i}`} logo={logo} size="sm" fill={below ? 'white' : 'glass'} />
              ))}
            </div>
          ) : null}
          {action}
        </div>
      ) : null}
    </>
  );

  /* ---- the media ---------------------------------------------------------- */

  const frame = {
    src: image,
    alt: imageAlt,
    srcSet: imageSrcSet,
    sizes: imageSizes,
    position: imagePosition,
    priority,
    ratio,
  };

  let body: React.ReactNode;
  if (below) {
    body = (
      <>
        <div data-slot="media-card-media" className="relative shrink-0">
          <PhotoFrame
            {...frame}
            // No figure, no blur: the photo is shown whole.
            blur={figure ? 'bottom' : 'none'}
            placeholder={figure ? 'plate' : 'sunken'}
            className="rounded-none"
          >
            {tagNode}
            {playNode}
            {figureNode}
          </PhotoFrame>
        </div>
        <CardBody data-slot="media-card-body" className="flex flex-col">
          {copyParts}
        </CardBody>
      </>
    );
  } else {
    body = (
      <div data-slot="media-card-media" className="relative flex grow flex-col">
        <PhotoFrame
          {...frame}
          blur={copy === 'overlay' ? 'bottom' : 'none'}
          placeholder="plate"
          // The ratio is the card's shape; copy that needs more room grows it
          // rather than being clipped (an aspect box with `overflow: hidden`
          // has no automatic minimum height of its own).
          className="min-h-min grow"
        >
          {tagNode}
          {playNode}
          {copy === 'plate' ? (
            <GlassPlate
              tone="dark"
              data-slot="media-card-plate"
              className={cn('m-2 flex flex-col gap-2', md && 'sm:m-4')}
            >
              {copyParts}
            </GlassPlate>
          ) : (
            <div data-slot="media-card-body" className="flex flex-col gap-2 p-5">
              {copyParts}
            </div>
          )}
        </PhotoFrame>
      </div>
    );
  }

  return React.createElement(
    as,
    {
      ref,
      'data-slot': 'media-card',
      'data-copy': copy,
      'data-size': size,
      'data-surface-ink': copy === 'overlay' ? 'on-image' : undefined,
      className: cn(
        cardVariants({ variant: 'default' }),
        // The photo is the card under `plate` and `overlay`: no frame round it.
        !below && 'border-0',
        copy === 'overlay' && 'text-on-image-ink',
        className,
      ),
      ...props,
    },
    body,
    children,
  );
});
MediaCard.displayName = 'MediaCard';
