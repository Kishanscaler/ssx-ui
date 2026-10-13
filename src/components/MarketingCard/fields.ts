import type { CardContentFields } from '../Card';

/* ---------------------------------------------------------------------------
 * The marketing vocabulary's shared fields (`@kishanscaler/ssx-ui/marketing`)
 *
 * Types only. These are the CMS-shaped props every marketing card speaks: flat
 * strings, string unions, image URLs and arrays of small objects, so a
 * Storyblok blok maps onto a card field for field (src/marketing/README.md,
 * rule 1). A card picks the fields it shows; one it omits is simply not drawn
 * (rule 3: an omitted slot is a variant).
 * ------------------------------------------------------------------------- */

/** A company's mark, as a CMS logo field. */
export interface MarketingLogo {
  /** The company's name: the mark's alt text, and its wordmark when there is no `src`. */
  name: string;
  /** The mark's file URL. Without one the name is set as a wordmark. */
  src?: string;
  /** The brand's own colour (any CSS colour): the tile's ground when a tile is filled `brand`. Content, not a token. */
  color?: string;
  /** Draw the mark in its own colours (a multi-colour mark), never flattened to one ink. */
  native?: boolean;
}

/** A figure with what it counts ("₹50L" / "offered on Shark Tank"). */
export interface MarketingFigure {
  /** The figure as written, units and all: "₹1Cr+", "200K", "60%". */
  value: string;
  /** What it counts, one short line. */
  label: string;
}

/** A person in a row of people (founders, a panel). */
export interface MarketingPerson {
  /** Full name: the avatar's initials come from it until there is a photo. */
  name: string;
  /** Photo URL, square. */
  avatar?: string;
}

/** The fields a marketing card accepts on top of Card's own (eyebrow, title, description, image, imageAlt, titleAs). */
export interface MarketingCardFields extends CardContentFields {
  /** Where the photo's subject sits, as CSS `object-position` ("50% 30%"), so a crop keeps it in frame. */
  imagePosition?: string;
  /** The photo's `srcset` ("photo-800.webp 800w, photo-1600.webp 1600w"). */
  imageSrcSet?: string;
  /** The photo's `sizes`, for `imageSrcSet` ("(min-width: 672px) 256px, 90vw"). */
  imageSizes?: string;
  /** Load the photo first: it is above the fold (eager, high fetch priority). */
  priority?: boolean;
  /** A short label on the photo's corner: the field, the sector, "Highlight". */
  tag?: string;
  /** The headline figure on the photo, units and all ("₹50L"); with it the photo blurs at its foot. */
  figure?: string;
  /** What the figure counts, one line under it. */
  figureLabel?: string;
  /** The company marks the card shows. */
  logos?: MarketingLogo[];
  /** Where the card goes: a URL. */
  href?: string;
  /** The link's visible words ("Read the story"), or its accessible name when it is an icon. */
  hrefLabel?: string;
  /** A video URL the card plays or opens (an MP4, or a YouTube link). */
  videoUrl?: string;
}
