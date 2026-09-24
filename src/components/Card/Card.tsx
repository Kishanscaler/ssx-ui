import * as React from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Heading, type HeadingElement } from '../Heading';
import { Text } from '../Text';

/* ---------------------------------------------------------------------------
 * Card
 *
 * A bordered container that turns a group of related facts into one object
 * you can scan, count and lay out on a grid: modules, cohorts, drives. Do NOT
 * nest a card inside a card; two borders around one thing means neither is
 * doing any work. A card that goes somewhere is a `ClickableCard`.
 *
 * Borders over shadows. In light the card is the page's own white and only its
 * 1px border separates it; in dark `surface-default` lifts a step above the
 * black page, because lightness carries elevation there. No shadow in either.
 *
 * PADDING LIVES ON THE PARTS, not the root: `CardMedia` must run edge to edge,
 * and `CardFooter` draws its own rule. Put content in `CardBody`.
 *
 * No width is baked in, so a Card sits in a grid cell or a Carousel track
 * slide and takes that width. It is a column flexbox and `CardBody` grows, so
 * cards in a row share a height and their footers line up.
 *
 * `variant="media"`: the photograph IS the card (a background image), with
 * the body pinned to the bottom over a scrim. The text is fixed white in both
 * themes — a photograph does not get lighter when the theme does — and the
 * scrim pairing is gated against the worst case it can land on (9.29:1).
 * Nothing may sit in the unveiled top half: that is the bug the variant exists
 * to prevent.
 *
 * Server component: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

/** `default` bordered surface · `media` image behind, text on top. */
export type CardVariant = 'default' | 'media';
/** The element a Card renders as, when not `asChild`. */
export type CardElement = 'div' | 'article' | 'section' | 'li' | 'aside';
/** The CardMedia aspect ratio. */
export type CardMediaRatio = '16:9' | '4:3' | '3:2' | '1:1';

export const cardVariants = cva(
  ['flex min-w-0 flex-col overflow-hidden rounded-lg font-sans text-content'],
  {
    variants: {
      variant: {
        default: 'border border-border-decorative bg-surface',
        media: [
          // The scrim is fixed white text's backdrop, so the content roles are
          // re-pointed at `content-on-image` for everything inside — Heading,
          // Text and Link keep reading their usual roles and get white.
          '[--content-primary:var(--content-on-image)] [--content-secondary:var(--content-on-image)]',
          '[--content-link:var(--content-on-image)] [--content-link-hover:var(--content-on-image)]',
          'relative isolate min-h-[15rem] justify-end border-0 bg-surface-inverse-sunken',
          // Pinned to the bottom, where the scrim is solid. CardBody grows to
          // fill the card, so its content must sit at ITS end too.
          '[&>[data-slot=card-body]]:content-end',
          'bg-(image:--card-image) bg-cover bg-center bg-no-repeat',
          // The veil: solid scrim for the bottom 42%, fading out towards the
          // top so the picture is still a picture.
          "before:absolute before:inset-0 before:-z-10 before:content-['']",
          'before:bg-linear-to-t before:from-surface-image-scrim before:from-42% before:to-transparent',
        ],
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

const RATIO: Record<CardMediaRatio, string> = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '3:2': 'aspect-[3/2]',
  '1:1': 'aspect-square',
};

/** The flat, CMS-shaped fields both Card and ClickableCard accept. */
export interface CardContentFields {
  /**
   * Kicker line above the title (12px caps). Flat field: with any flat field
   * set, the Card builds its own `CardMedia` + `CardBody`, and `children`
   * render after them (a `CardFooter`, say).
   */
  eyebrow?: React.ReactNode;
  /**
   * The card title, a `CardTitle`. Replaces the native `title` tooltip
   * attribute, which a card should not have anyway.
   */
  title?: React.ReactNode;
  /** One or two lines of supporting detail under the title, a `CardDescription`. */
  description?: React.ReactNode;
  /**
   * Image URL. `default` variant: a 16:9 `CardMedia` above the body. `media`
   * variant: the card's background photograph (sets `--card-image`).
   */
  image?: string;
  /**
   * Alt text for `image` in the `default` variant. Leave empty only if the
   * image is decorative (the title already says what it shows). A `media`
   * card's photograph is a backdrop and is always decorative: the title and
   * description carry the meaning.
   *
   * @default ''
   */
  imageAlt?: string;
  /**
   * The title's outline level. Pick it for the page's outline; the size stays
   * the card title's.
   *
   * @default 'h3'
   */
  titleAs?: HeadingElement;
}

export type CardProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> &
  CardContentFields & {
    /**
     * `default` bordered surface · `media` the image is the card and the text
     * sits over a scrim at the bottom.
     *
     * @default 'default'
     */
    variant?: CardVariant;
    /**
     * The element. `article` for a self-contained item (a module, a report),
     * `li` inside a list or a Carousel track.
     *
     * @default 'div'
     */
    as?: CardElement;
    /**
     * Render as the child element instead, keeping every style and prop.
     * `ClickableCard` is built on this.
     *
     * @default false
     */
    asChild?: boolean;
  };

/** Renders the flat fields as parts; `null` when none is set. */
function renderFlat(
  { eyebrow, title, description, image, imageAlt = '', titleAs = 'h3' }: CardContentFields,
  variant: CardVariant,
) {
  const hasBody = eyebrow != null || title != null || description != null;
  const media = variant === 'default' && image ? <CardMedia src={image} alt={imageAlt} /> : null;
  if (!hasBody && !media) return null;
  return (
    <>
      {media}
      {hasBody ? (
        <CardBody>
          {eyebrow != null ? <CardEyebrow>{eyebrow}</CardEyebrow> : null}
          {title != null ? <CardTitle as={titleAs}>{title}</CardTitle> : null}
          {description != null ? <CardDescription>{description}</CardDescription> : null}
        </CardBody>
      ) : null}
    </>
  );
}

export const Card = React.forwardRef<HTMLElement, CardProps>(function Card(
  {
    className,
    style,
    variant = 'default',
    as = 'div',
    asChild = false,
    eyebrow,
    title,
    description,
    image,
    imageAlt,
    titleAs,
    children,
    ...props
  },
  ref,
) {
  const flat = renderFlat({ eyebrow, title, description, image, imageAlt, titleAs }, variant);
  const mediaStyle =
    variant === 'media' && image
      ? ({ '--card-image': `url(${JSON.stringify(image)})`, ...style } as React.CSSProperties)
      : style;
  const shared = {
    ref,
    'data-slot': 'card',
    'data-variant': variant,
    className: cn(cardVariants({ variant }), className),
    style: mediaStyle,
    ...props,
  };

  if (asChild) {
    return (
      <Slot {...(shared as React.HTMLAttributes<HTMLElement>)} ref={ref as React.Ref<HTMLElement>}>
        {flat}
        <Slottable>{children}</Slottable>
      </Slot>
    );
  }
  return React.createElement(
    as,
    shared,
    flat,
    children,
  );
});
Card.displayName = 'Card';

/* ---- CardMedia ------------------------------------------------------------ */

export type CardMediaProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Image URL. Omit it and pass your own `<img>` / `next/image` as the child
   * instead; the frame sizes and crops either.
   */
  src?: string;
  /**
   * Alt text for `src`. With no `src` and no child, a non-empty `alt` names
   * the placeholder frame (`role="img"`), as the HTML's stand-in does.
   *
   * @default ''
   */
  alt?: string;
  /**
   * Frame aspect ratio. The image is cropped to it (`object-cover`).
   *
   * @default '16:9'
   */
  ratio?: CardMediaRatio;
};

/** Edge-to-edge image frame at the top of a Card, above `CardBody`. */
export const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(function CardMedia(
  { className, src, alt = '', ratio = '16:9', children, ...props },
  ref,
) {
  const placeholder = !src && children == null;
  return (
    <div
      ref={ref}
      data-slot="card-media"
      data-ratio={ratio}
      role={placeholder && alt ? 'img' : undefined}
      aria-label={placeholder && alt ? alt : undefined}
      className={cn(
        'relative block w-full shrink-0 overflow-hidden border-b border-border-decorative bg-surface-sunken',
        '[&>img]:block [&>img]:size-full [&>img]:object-cover',
        RATIO[ratio] ?? RATIO['16:9'],
        className,
      )}
      {...props}
    >
      {src ? <img src={src} alt={alt} loading="lazy" decoding="async" /> : children}
    </div>
  );
});
CardMedia.displayName = 'CardMedia';

/* ---- CardBody ------------------------------------------------------------- */

export type CardBodyProps = React.HTMLAttributes<HTMLDivElement>;

/** The padded content region. Grows, so footers in a row of cards line up. */
export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(function CardBody(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="card-body"
      className={cn('grid grow content-start gap-2 p-5', className)}
      {...props}
    />
  );
});
CardBody.displayName = 'CardBody';

/* ---- CardHeader ----------------------------------------------------------- */

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * A row inside `CardBody`: a `CardTitle` that takes the space and trailing
 * actions (an `IconButton` "More actions"). The actions sit OUTSIDE any
 * ClickableCard — a card with its own buttons is a Card.
 */
export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="card-header"
      className={cn(
        'flex items-center gap-2 [&>[data-slot=card-title]]:min-w-0 [&>[data-slot=card-title]]:grow',
        className,
      )}
      {...props}
    />
  );
});
CardHeader.displayName = 'CardHeader';

/* ---- CardEyebrow ---------------------------------------------------------- */

export type CardEyebrowProps = React.HTMLAttributes<HTMLParagraphElement>;

/** The kicker above the title: a `Heading size="eyebrow"` kept out of the outline. */
export const CardEyebrow = React.forwardRef<HTMLParagraphElement, CardEyebrowProps>(
  function CardEyebrow({ className, ...props }, ref) {
    return (
      <Heading
        ref={ref as React.Ref<HTMLHeadingElement>}
        as="p"
        size="eyebrow"
        data-slot="card-eyebrow"
        className={className}
        {...props}
      />
    );
  },
);
CardEyebrow.displayName = 'CardEyebrow';

/* ---- CardTitle ------------------------------------------------------------ */

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  /**
   * The outline level. The visual size is always the card title's (`3`).
   * Long titles wrap; they never truncate.
   *
   * @default 'h3'
   */
  as?: HeadingElement;
};

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
  { className, as = 'h3', ...props },
  ref,
) {
  return (
    <Heading
      ref={ref}
      as={as}
      size="3"
      data-slot="card-title"
      className={className}
      {...props}
    />
  );
});
CardTitle.displayName = 'CardTitle';

/* ---- CardDescription ------------------------------------------------------ */

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/** Supporting detail under the title: `Text size="sm" tone="secondary"`. */
export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  function CardDescription({ className, ...props }, ref) {
    return (
      <Text
        ref={ref}
        as="p"
        size="sm"
        tone="secondary"
        data-slot="card-description"
        className={className}
        {...props}
      />
    );
  },
);
CardDescription.displayName = 'CardDescription';

/* ---- CardFooter ----------------------------------------------------------- */

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

/** A ruled row under the body: a status Badge and a Link, or actions. */
export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn(
        'flex flex-wrap items-center gap-2 border-t border-border-decorative px-5 py-4',
        className,
      )}
      {...props}
    />
  );
});
CardFooter.displayName = 'CardFooter';
