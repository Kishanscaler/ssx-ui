import type { MarketingFigure, MarketingLogo } from '../MarketingCard/fields';

/* ---------------------------------------------------------------------------
 * Breaker's content shapes (types only, no directive): the blok schema. Every
 * field is a string, a boolean, a string union or an array of small objects.
 * ------------------------------------------------------------------------- */

/** A spec figure under the words: the figure, its line, then its source (Apple's spec row). */
export interface BreakerFigure extends MarketingFigure {
  /** A longer line under the label. */
  description?: string;
  /** Where it comes from, as words ("Forbes"); with a `sourceLogo` of the same name only the logo shows. */
  source?: string;
  /** The source's mark. */
  sourceLogo?: MarketingLogo;
}

/** Who said or did it: a ProfilePlate under the statement. */
export interface BreakerProfile {
  /** Full name. */
  name: string;
  /** Who they are, one line ("Founder & CEO, Shaadi.com · Shark Tank India judge"). */
  credential?: string;
  /** Where they built it, as white marks. */
  logos?: MarketingLogo[];
  /** A word read before the logos: "Ex-". */
  logosPrefix?: string;
  /** A square photo URL, drawn 32px round. */
  avatar?: string;
}

/** The band's picture: a muted looping clip, or a still. */
export interface BreakerMedia {
  /** A muted looping clip (MP4). */
  video?: string;
  /**
   * Its poster: shown until it plays, and blurred as the still under the frost. Required when
   * there is a video; alone it is the picture.
   */
  poster?: string;
  /**
   * `cover` fills the band · `height` draws the clip at the band's height from its inline start,
   * feathered into its blurred poster at its end (a subject on the left looking right). Below
   * desktop both frame the clip at the top of the band.
   *
   * @default 'cover'
   */
  fit?: 'cover' | 'height';
  /** CSS `object-position` for the subject ("25% 50%"), so the crop keeps them in frame. */
  position?: string;
  /** A pale scene (a white tent): the frost under the words darkens so white type still reads. */
  bright?: boolean;
  /** Alt text for the still. The band's picture is decoration by default (the words carry it). */
  alt?: string;
}

/** One slide: what is said, by whom, over what. */
export interface BreakerSlideData {
  /** The line over the statement, white (the on-image ink, not the brand's). */
  eyebrow?: string;
  /** The statement: the band's title, at the display size. */
  statement: string;
  /** Who said it, a small footnote under the statement ("— Nikhil Kamath, Zerodha"). */
  attribution?: string;
  /** Spec figures under the words (two, side by side). */
  figures?: BreakerFigure[];
  /** Who it is, on a glass plate under the statement (the testimonial band's profile card). */
  profile?: BreakerProfile;
  /** The slide's picture. A slide without one keeps the first slide's; none at all is the dark plate. */
  media?: BreakerMedia;
}
