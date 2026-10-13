import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Badge } from '../Badge';
import { Divider } from '../Divider';
import { Figure } from '../Figure';
import { GlassPlate } from '../GlassPlate';
import { Heading } from '../Heading';
import { Link } from '../Link';
import { LogoTile } from '../LogoTile';
import type { MarketingCardFields, MarketingFigure, MarketingLogo } from '../MarketingCard/fields';
import { initials } from '../MarketingCard/initials';
import { MarketingEyebrow, PhotoTag, STRETCH, TitleLink } from '../MarketingCard/parts';
import { PhotoFrame } from '../PhotoFrame';
import { Text } from '../Text';

/* ---------------------------------------------------------------------------
 * PersonCard (marketing)
 *
 * A person: faculty, a mentor, an alumna, a creator, a founder. One card,
 * three shapes (`layout`), every part a flat field a Storyblok blok maps onto:
 *
 *   - `overlay` the photo IS the card (3:4), the copy at its foot over a
 *     progressive blur and scrim, in white in both themes (the root declares
 *     `data-surface-ink="on-image"`). The SSB page's "Meet" cards, the
 *     mentors' compact cards (`size="sm"`), the creator cards (`badge`,
 *     `figures` on a glass plate at the foot). `align="center"` is the
 *     phone's centred card, `start` the row's.
 *   - `stacked` a 4:5 photo inset in the card, the copy under it on the card
 *     surface (`Card`'s border and ground): name, role, logos, a line.
 *   - `split` the photo on the left (about 54%: `--ssx-person-card-split`,
 *     the README's token request), the copy on the right: the
 *     faculty card (`headline` the course, "by" the name, a rule, the
 *     credentials, the logo at the foot) and the alumni card (`headline` the
 *     role, the name, then the move from `moveFrom` to `moveTo`). Below
 *     `--container-person-card-split` (18rem) of its OWN width it stacks
 *     (photo on top, 4:5): a container query, so the card follows its cell,
 *     not the viewport. The page drew these as one 480 x 320 picture scaled
 *     by a ResizeObserver; here the layout is fluid and the type keeps its
 *     roles. The page's dark faculty and alumni cards are this card in a dark
 *     island (`data-brand="ssb" data-theme="dark"` on it, or on an ancestor).
 *
 * EVERY OPTIONAL SLOT OMITTED IS A VARIANT: no `eyebrow`, no kicker; no
 * `logos`, no logo row; no `image`, the plate with the person's initials.
 * `headline` LEADS when given (the course taught; "Brand Marketing at The
 * Whole Truth"): it becomes the heading and the name drops to a byline
 * ("by Priya Sharma"; `bylinePrefix=""` for the name alone). The move
 * renders only with both ends. `bio` is drawn in `stacked` and `split`;
 * `figures` (up to three) on a glass plate: in flow at the overlay's foot,
 * pinned to the photo's foot in the others.
 *
 * WIDTH comes from the cell (no width prop). The split card's root is a
 * size container (`container-type: inline-size`), so give it a definite
 * width (a grid cell, a rail item), never a shrink-to-fit box.
 *
 * MARKERS, NOT MOTION: `data-slot="person-card"` with `data-layout`,
 * `data-align` and `data-size`; parts `person-card-media` (the photo inside
 * carries `data-part="photo"`), `-body`, `-eyebrow`, `-badge`, `-name` or
 * `-headline` (`data-part="title"`), `-byline` and `-role`
 * (`data-part="subline"`), `-rule`, `-bio` (`description`), `-logos`
 * (`logos`), `-figures` (`figure`), `-move`, `-move-step`, `-move-arrow`.
 *
 * THE LINK. `href` makes the heading a link, named by the heading, stretched
 * over the whole card (nothing else in the card is interactive): its
 * `::after` covers the root, the card's positioning context and stacking
 * context (`isolate`), above everything in it. With `hrefLabel` the heading
 * stays plain and a quiet arrow link with those words sits at the copy's
 * foot (`person-card-action`, `data-part="action"`), stretched the same way,
 * so the destination is offered once and every link is named by its words.
 * The same `hrefLabel` as MediaCard's and ShowcaseCard's.
 *
 * AN EMPTY STRING IS AN UNSET FIELD (Storyblok's blank text field): nothing
 * is drawn for it. `videoUrl` is not a field of this card (its type omits it).
 *
 * Server component: no hooks, no handlers. React 16 safe.
 * ------------------------------------------------------------------------- */

/** `overlay` copy over the photo · `stacked` photo above the copy · `split` photo beside the copy. */
export type PersonCardLayout = 'overlay' | 'stacked' | 'split';
/** The overlay's copy alignment: the phone's centred card, or the row's. */
export type PersonCardAlign = 'start' | 'center';
/** `sm` the mentors' compact card · `md` the row card. */
export type PersonCardSize = 'sm' | 'md';
/** The element a PersonCard renders as. */
export type PersonCardElement = 'article' | 'li' | 'div';

// `relative isolate` on the root: the stretched link's `::after` is placed
// against the card's whole box and stacked above everything in it.
export const personCardVariants = cva('group/person-card relative isolate min-w-0 font-sans', {
  variants: {
    layout: {
      // The 3:4 is a minimum: copy taller than the photo grows the card (no
      // overflow clip on the root), and the photo, laid behind, grows with it.
      overlay: [
        'flex flex-col justify-end rounded-lg text-on-image-ink',
        'aspect-[calc(1/(var(--aspect-landscape)))]',
      ],
      stacked: 'flex flex-col rounded-lg border border-border-decorative bg-surface p-2 text-content',
      split: '@container/person-card rounded-lg border border-border-decorative bg-surface text-content',
    },
    size: { sm: '', md: '' },
  },
  defaultVariants: { layout: 'overlay', size: 'md' },
});

export interface PersonCardProps
  extends Omit<MarketingCardFields, 'title' | 'description' | 'eyebrow' | 'videoUrl'>,
    Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Full name. The heading, or the byline when `headline` leads; the initials on the plate come from it. */
  name: string;
  /**
   * Role or credentials: a caption line under the name (`overlay`,
   * `stacked`), or the credentials under the rule (`split`, up to three
   * lines). Not the ARIA `role` attribute.
   */
  role?: string;
  /**
   * A headline that LEADS when given (the course taught; "Brand Marketing at
   * The Whole Truth"): it becomes the heading and the name moves to a byline.
   */
  headline?: string;
  /**
   * The word before the name on the byline, when `headline` leads. Empty for
   * the name alone (an alumna under her role).
   *
   * @default 'by'
   */
  bylinePrefix?: string;
  /** A line or two about them (`stacked`, `split`). */
  bio?: string;
  /** A kicker over the name ("Meet"), with a rule under it. */
  eyebrow?: string;
  /** A solid badge over the name ("Creator"), with a star. */
  badge?: string;
  /** Up to three achievements on a glass plate (creator cards). Read before `figure`. */
  figures?: MarketingFigure[];
  /** Where they were before (the alumni move). The move renders only when both ends are given. */
  moveFrom?: string;
  /** Where they are now (the alumni move). The move renders only when both ends are given. */
  moveTo?: string;
  /** The label over `moveFrom` ("Before SSB"). */
  moveFromLabel?: string;
  /** The label over `moveTo` ("After SSB"). */
  moveToLabel?: string;
  /** `moveTo`'s mark, on a white tile. Without it the tile shows a building. */
  moveToLogo?: MarketingLogo;
  /**
   * `overlay` the copy over the photo · `stacked` the photo above the copy ·
   * `split` the photo beside the copy (stacking below 18rem of its width).
   *
   * @default 'overlay'
   */
  layout?: PersonCardLayout;
  /**
   * `overlay` only: `center` the phone's centred card, `start` the row's
   * left-aligned one. The other layouts are always `start`.
   *
   * @default 'start'
   */
  align?: PersonCardAlign;
  /**
   * `sm` the mentors' compact card (tighter inset, smaller tiles and
   * initials; the name keeps the card title's role, as every card's does) ·
   * `md` the row card. Never the width.
   *
   * @default 'md'
   */
  size?: PersonCardSize;
  /**
   * The element. `li` as a direct child of a `ul`/`ol` of your own; inside a
   * `Rail` keep `article` (`RailItem` is the `li`).
   *
   * @default 'article'
   */
  as?: PersonCardElement;
}

/* ---- Glyphs: Phosphor 2.1.1, drawn inline (no icon dependency in a server card) ---- */

/** Phosphor `star` fill: the creator badge's mark. */
const StarGlyph = () => (
  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z" />
  </svg>
);

/** Phosphor `briefcase` regular: the move's "before" tile, as the page draws it. */
const BriefcaseGlyph = () => (
  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M216,56H176V48a24,24,0,0,0-24-24H104A24,24,0,0,0,80,48v8H40A16,16,0,0,0,24,72V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V72A16,16,0,0,0,216,56ZM96,48a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96ZM216,72v41.61A184,184,0,0,1,128,136a184.07,184.07,0,0,1-88-22.38V72Zm0,128H40V131.64A200.19,200.19,0,0,0,128,152a200.25,200.25,0,0,0,88-20.37V200ZM104,112a8,8,0,0,1,8-8h32a8,8,0,0,1,0,16H112A8,8,0,0,1,104,112Z" />
  </svg>
);

/** Phosphor `buildings` regular: the move's "after" tile when there is no logo. */
const BuildingsGlyph = () => (
  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M240,208H224V96a16,16,0,0,0-16-16H144V32a16,16,0,0,0-24.88-13.32L39.12,72A16,16,0,0,0,32,85.34V208H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM208,96V208H144V96ZM48,85.34,128,32V208H48ZM112,112v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm-32,0v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm0,56v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Zm32,0v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Z" />
  </svg>
);

/** Phosphor `caret-up` bold: the move's arrow, two overlapped as the page draws it. */
const CaretUpGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
    <path d="M216.49,168.49a12,12,0,0,1-17,0L128,97,56.49,168.49a12,12,0,0,1-17-17l80-80a12,12,0,0,1,17,0l80,80A12,12,0,0,1,216.49,168.49Z" />
  </svg>
);

/** Column counts for the figures plate, written out so the stylesheet scan finds them. */
const FIGURE_COLS = ['grid-cols-1', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3'] as const;

/** A square tile in the move: the page's sunken tile, the on-image glass on a photo. */
const MOVE_TILE = [
  'grid shrink-0 place-items-center overflow-hidden rounded-md',
  'bg-surface-sunken text-content',
  'in-data-[surface-ink=on-image]:border in-data-[surface-ink=on-image]:border-glass-on-image-hover',
  'in-data-[surface-ink=on-image]:bg-glass-on-image in-data-[surface-ink=on-image]:text-on-image-ink',
  '[&_svg]:size-icon-md',
];

export const PersonCard = React.forwardRef<HTMLElement, PersonCardProps>(function PersonCard(
  {
    className,
    name,
    role,
    headline,
    bylinePrefix = 'by',
    bio,
    eyebrow,
    badge,
    figures,
    figure,
    figureLabel,
    moveFrom,
    moveTo,
    moveFromLabel,
    moveToLabel,
    moveToLogo,
    logos,
    image,
    imageAlt = '',
    imagePosition,
    imageSrcSet,
    imageSizes,
    priority = false,
    tag,
    href,
    hrefLabel,
    titleAs = 'h3',
    layout = 'overlay',
    align = 'start',
    size = 'md',
    as = 'article',
    ...props
  },
  ref,
) {
  const overlay = layout === 'overlay';
  const split = layout === 'split';
  const sm = size === 'sm';
  const center = overlay && align === 'center';

  const facts: MarketingFigure[] = (
    figures && figures.length ? figures : figure ? [{ value: figure, label: figureLabel ?? '' }] : []
  ).slice(0, 3);
  const hasMove = Boolean(moveFrom && moveTo);
  const hasLogos = Boolean(logos && logos.length);

  /* ---- the parts ---------------------------------------------------------- */

  const titleText = headline || name;
  const titleLinked = Boolean(href) && !hrefLabel;
  const title = (
    <Heading
      as={titleAs}
      size="3"
      data-slot={headline ? 'person-card-headline' : 'person-card-name'}
      data-part="title"
      className="text-balance"
    >
      {titleLinked ? (
        // Stretched over the card: the whole card is the target.
        <TitleLink href={href} stretch data-slot="person-card-link">
          {titleText}
        </TitleLink>
      ) : (
        titleText
      )}
    </Heading>
  );

  // `hrefLabel`: the destination as a quiet arrow link at the copy's foot,
  // stretched over the card as the title link would be.
  const actionEl =
    href && hrefLabel ? (
      <Link
        href={href}
        variant="quiet"
        trailingIcon="arrow"
        data-slot="person-card-action"
        data-part="action"
        // No press scale: a scaled link is the containing block of its own
        // `::after`, which would shrink to the link mid-press and lose the
        // click that ends it on the card.
        className={cn('self-start', STRETCH, 'active:scale-none')}
      >
        {hrefLabel}
      </Link>
    ) : null;

  const byline = headline ? (
    <Text as="p" size="sm" data-slot="person-card-byline" data-part="subline" className="font-medium">
      {bylinePrefix ? `${bylinePrefix} ${name}` : name}
    </Text>
  ) : null;

  // The family's eyebrow (SectionHeader's, StatCard's), with the "Meet"
  // kicker's rule under it in its own ink.
  const eyebrowEl = eyebrow ? (
    <MarketingEyebrow data-slot="person-card-eyebrow" className="mb-1 border-b-thick border-current pb-1">
      {eyebrow}
    </MarketingEyebrow>
  ) : null;

  // The system's Badge as it is drawn everywhere: no capitals of its own.
  const badgeEl = badge ? (
    <Badge tone="solid" data-slot="person-card-badge" className="mb-1">
      <StarGlyph />
      {badge}
    </Badge>
  ) : null;

  const roleEl = role ? (
    <Text
      as="p"
      size={split ? 'sm' : 'xs'}
      tone="secondary"
      data-slot="person-card-role"
      data-part="subline"
      className={split ? 'line-clamp-3' : 'text-balance'}
    >
      {role}
    </Text>
  ) : null;

  const ruleEl =
    split && role ? (
      // The system's Divider; the body's gap is its spacing.
      <Divider data-slot="person-card-rule" className="my-0" />
    ) : null;

  const bioEl =
    bio && !overlay ? (
      <Text as="p" size="sm" tone="secondary" data-slot="person-card-bio" data-part="description">
        {bio}
      </Text>
    ) : null;

  const logosEl = hasLogos ? (
    <ul
      data-slot="person-card-logos"
      data-part="logos"
      className={cn(
        'm-0 flex w-full list-none gap-2 p-0',
        logos!.length > 1 ? 'max-w-panel-xs' : 'max-w-[calc(var(--size-panel-xs)/2)]',
      )}
    >
      {logos!.map((logo, i) => (
        <li key={`${i}-${logo.name}`} className="min-w-0 flex-1">
          <LogoTile
            logo={logo}
            fill={logo.color ? 'brand' : 'white'}
            size={sm ? 'sm' : 'md'}
          />
        </li>
      ))}
    </ul>
  ) : null;

  const tile = sm ? 'size-10' : 'size-12';
  // A move's labels are the eyebrow role (as the page's alumni card sets them),
  // in the secondary ink; its values the label role.
  const moveLabel = 'type-eyebrow text-content-secondary in-data-[surface-ink=on-image]:text-on-image-ink-secondary';
  const moveValue = 'type-label';
  const moveEl = hasMove ? (
    // DOM order is the story's (before, then after); drawn reversed, the
    // page's picture: after on top, the arrow pointing up to it.
    <div data-slot="person-card-move" className="flex flex-col-reverse items-start">
      <div data-slot="person-card-move-step" data-step="from" className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className={cn(MOVE_TILE, tile)}>
          <BriefcaseGlyph />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          {moveFromLabel ? <span className={moveLabel}>{moveFromLabel}</span> : null}
          <span className={moveValue}>{moveFrom}</span>
        </span>
      </div>
      <span
        data-slot="person-card-move-arrow"
        aria-hidden="true"
        className={cn(
          'flex flex-col items-center py-1 text-content-secondary in-data-[surface-ink=on-image]:text-on-image-ink',
          sm ? 'w-10' : 'w-12',
        )}
      >
        <CaretUpGlyph className="size-icon-sm" />
        <CaretUpGlyph className="-mt-2 size-icon-sm" />
      </span>
      <div data-slot="person-card-move-step" data-step="to" className="flex min-w-0 items-center gap-3">
        {moveToLogo ? (
          <span aria-hidden="true" className={cn('block shrink-0', tile)}>
            <LogoTile
              logo={moveToLogo}
              fill="white"
              shape="square"
              size="sm"
              className="size-full"
            />
          </span>
        ) : (
          <span aria-hidden="true" className={cn(MOVE_TILE, tile)}>
            <BuildingsGlyph />
          </span>
        )}
        <span className="flex min-w-0 flex-col gap-0.5">
          {moveToLabel ? <span className={moveLabel}>{moveToLabel}</span> : null}
          <span className={moveValue}>{moveTo}</span>
        </span>
      </div>
    </div>
  ) : null;

  const figuresEl = facts.length ? (
    <GlassPlate
      as="dl"
      tone="dark"
      inset={overlay ? 'none' : 'foot'}
      data-slot="person-card-figures"
      data-part="figure"
      className={cn(
        'm-0 grid divide-x divide-glass-on-image-hover rtl:divide-x-reverse',
        FIGURE_COLS[facts.length],
      )}
    >
      {facts.map((fact, i) => (
        <div
          key={`${fact.value}-${i}`}
          className={cn('flex min-w-0 flex-col-reverse gap-1 px-2 first:ps-0 last:pe-0', center && 'items-center text-center')}
        >
          {fact.label ? (
            <dt className="m-0">
              <Text as="span" size="sm" tone="secondary">
                {fact.label}
              </Text>
            </dt>
          ) : null}
          <Figure as="dd" value={fact.value} size="sm" className="m-0" />
        </div>
      ))}
    </GlassPlate>
  ) : null;

  const tagEl = tag ? <PhotoTag data-slot="person-card-tag">{tag}</PhotoTag> : null;

  const initialsEl = image ? null : (
    <span
      data-slot="person-card-initials"
      aria-hidden="true"
      className={cn(
        // The type role at its own weight.
        'absolute inset-x-0 top-0 grid place-items-center text-on-image-ink-secondary',
        overlay ? 'h-1/2' : 'bottom-0',
        sm ? 'type-h1' : 'type-display',
      )}
    >
      {initials(name)}
    </span>
  );

  const photoProps = {
    src: image,
    alt: imageAlt,
    srcSet: imageSrcSet,
    sizes: imageSizes,
    position: imagePosition,
    priority,
  };

  const head = (
    <div className={cn('flex min-w-0 flex-col gap-1', center ? 'items-center' : 'items-start')}>
      {eyebrowEl}
      {badgeEl}
      {title}
      {byline}
      {split ? null : roleEl}
    </div>
  );

  /* ---- the layouts -------------------------------------------------------- */

  let content: React.ReactNode;
  if (overlay) {
    content = (
      <>
        {/* Behind the copy (under the root's stacking context), so the body
            needs no position of its own: the stretched link then covers the
            whole card, not just the copy. */}
        <div data-slot="person-card-media" className="absolute inset-0 z-below">
          <PhotoFrame {...photoProps} ratio="fill" blur="bottom" from={facts.length ? 0.4 : 0.5} className="size-full">
            {initialsEl}
          </PhotoFrame>
        </div>
        {tagEl}
        <div
          data-slot="person-card-body"
          className={cn(
            'flex min-w-0 flex-col gap-3',
            sm ? 'p-4' : 'p-5',
            facts.length ? 'pb-3' : null,
            center ? 'items-center text-center' : 'items-start text-start',
          )}
        >
          {head}
          {logosEl}
          {moveEl}
          {actionEl}
        </div>
        {figuresEl ? <div className="px-2 pb-2">{figuresEl}</div> : null}
      </>
    );
  } else {
    const media = (
      <div data-slot="person-card-media" className={cn('relative min-w-0', split && '@min-person-card-split/person-card:h-full')}>
        <PhotoFrame
          {...photoProps}
          ratio="4:5"
          blur={facts.length ? 'bottom' : 'none'}
          from={0.35}
          className={cn(
            split && '@min-person-card-split/person-card:aspect-auto @min-person-card-split/person-card:h-full',
          )}
        >
          {initialsEl}
          {tagEl}
          {figuresEl}
        </PhotoFrame>
      </div>
    );
    const foot =
      hasLogos || hasMove || actionEl ? (
        <div className="mt-auto flex min-w-0 flex-col gap-3 pt-1">
          {logosEl}
          {moveEl}
          {actionEl}
        </div>
      ) : null;
    const body = (
      <div data-slot="person-card-body" className={cn('flex min-w-0 flex-1 flex-col gap-3', sm ? 'p-2' : 'p-3')}>
        {head}
        {split ? (
          <>
            {ruleEl}
            {roleEl}
            {bioEl}
            {foot}
          </>
        ) : (
          <>
            {logosEl}
            {bioEl}
            {moveEl}
            {actionEl}
          </>
        )}
      </div>
    );
    content = split ? (
      <div
        className={cn(
          // No height of its own: the 3:2 is a minimum the copy can grow
          // (a percentage height here stops the aspect ratio's automatic
          // minimum, and the copy overflowed the card).
          'grid grid-cols-1 p-2',
          '@min-person-card-split/person-card:aspect-photo',
          // The photo's share: `--ssx-person-card-split` (README token
          // requests), 54 / 46 by default.
          '@min-person-card-split/person-card:grid-cols-[var(--ssx-person-card-split,minmax(0,54fr)_minmax(0,46fr))]',
        )}
      >
        {media}
        {body}
      </div>
    ) : (
      <>
        {media}
        {body}
      </>
    );
  }

  return React.createElement(
    as,
    {
      ref,
      'data-slot': 'person-card',
      'data-layout': layout,
      'data-align': center ? 'center' : 'start',
      'data-size': size,
      'data-surface-ink': overlay ? 'on-image' : undefined,
      className: cn(personCardVariants({ layout, size }), className),
      ...props,
    },
    content,
  );
});
PersonCard.displayName = 'PersonCard';
