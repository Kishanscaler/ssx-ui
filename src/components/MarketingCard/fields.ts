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

/**
 * The fields a marketing card accepts: Card's own (image, imageAlt, titleAs),
 * with its text fields narrowed to strings, and the marketing slots.
 *
 * `eyebrow`, `title` and `description` are `ReactNode` on `Card` (a code-side
 * card may set markup there); here they are blok fields, so plain strings
 * (README rule 1). An empty string is an unset field: Storyblok returns `""`
 * for a text field left blank, and every card draws nothing for it.
 */
export interface MarketingCardFields extends Omit<CardContentFields, 'eyebrow' | 'title' | 'description'> {
  /** A kicker over the title (the outlet, the speaker's role). */
  eyebrow?: string;
  /** The card's heading. */
  title?: string;
  /** A line or two under the title. */
  description?: string;
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
  /**
   * Where the card goes: a URL. Alone, it links the title, and the link's
   * accessible name is the title (what it says on screen).
   */
  href?: string;
  /**
   * The words of a quiet action link to `href` at the copy's foot ("Read the
   * story", with an arrow; `data-part="action"`). With it the title is plain
   * text, so the card offers the destination once. Never an `aria-label`: a
   * link is named by the words it shows (WCAG 2.5.3, label in name).
   */
  hrefLabel?: string;
  /** A video URL the card plays or opens (an MP4, or a YouTube link). */
  videoUrl?: string;
}
