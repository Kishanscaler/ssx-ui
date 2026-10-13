/**
 * @kishanscaler/ssx-ui/marketing — the marketing vocabulary.
 *
 * Cards, rails, section headers, breakers and figures for a landing page or a
 * CMS block tree (Storyblok): components whose props are flat and
 * serialisable, so a blok maps onto them field for field. The contract every
 * component here follows is in ./README.md.
 *
 * Re-exports ONLY. No directive, no code: marking this file "use client" would
 * turn every server component into a client reference
 * (scripts/check-directives.mjs fails the build if it happens).
 *
 * The components live in src/components/<Name>/ like every other component
 * (the published stylesheet scans dist/components/** for their utilities); this
 * barrel is the allowlist for the entry. A client module goes in
 * scripts/client-manifest/batch-marketing.mjs.
 *
 * PARALLEL WORK. Families are built by several agents at once. Each appends
 * ONLY inside its own section below and never edits another section.
 */

/* ---------- foundations (Phase 0) ------------------------------------------ */
/* fields, PhotoFrame: append below this line.
 *
 * INTERNAL, NOT EXPORTED: Figure, GlassPlate, LogoTile, ProfilePlate. They are
 * building blocks the public components compose (a figure's units a step down,
 * the plate on a photo, a logo on a tile, who said it under a breaker's
 * statement), not things an editor places, so they have no blok and no
 * Storybook page. Their folders stay in src/components/; import them by path
 * from inside the package only. */
export type { MarketingCardFields, MarketingFigure, MarketingLogo, MarketingPerson } from '../components/MarketingCard';
export { PhotoFrame, photoFrameVariants } from '../components/PhotoFrame';
export type { PhotoFrameBlur, PhotoFramePlaceholder, PhotoFrameProps, PhotoFrameRatio } from '../components/PhotoFrame';

/* ---------- SectionHeader -------------------------------------------------- */
export { SectionHeader, sectionHeaderVariants } from '../components/SectionHeader';
export type {
  SectionHeaderProps,
  SectionHeaderAsideAt,
  SectionHeaderAlign,
  SectionHeaderTitleSize,
  SectionHeaderTitleElement,
  SectionHeaderDescriptionSize,
  SectionHeaderSpacing,
} from '../components/SectionHeader';

/* ---------- PersonCard ----------------------------------------------------- */
export { PersonCard, personCardVariants } from '../components/PersonCard';
export type {
  PersonCardProps,
  PersonCardLayout,
  PersonCardAlign,
  PersonCardSize,
  PersonCardElement,
} from '../components/PersonCard';

/* ---------- ShowcaseCard --------------------------------------------------- */
export { ShowcaseCard, showcaseCardVariants } from '../components/ShowcaseCard';
export type { ShowcaseCardElement, ShowcaseCardProps } from '../components/ShowcaseCard';

/* ---------- MediaCard ------------------------------------------------------ */
export { MediaCard } from '../components/MediaCard';
export type {
  MediaCardElement,
  MediaCardLayout,
  MediaCardProps,
  MediaCardRatio,
  MediaCardSize,
} from '../components/MediaCard';

/* ---------- StatCard, StatGroup -------------------------------------------- */
export { StatCard, statCardVariants } from '../components/StatCard';
export type { StatCardElement, StatCardProps, StatCardSize, StatCardTone, StatCardVariant } from '../components/StatCard';
export { StatGroup, statGroupVariants } from '../components/StatGroup';
export type { StatGroupColumns, StatGroupElement, StatGroupProps } from '../components/StatGroup';

/* ---------- Rail, CarouselNav ---------------------------------------------- */
export { Rail, RailItem, railTrackVariants, railStepInterval } from '../components/Rail';
export type { RailAutoplayMode, RailItemProps, RailItemWidth, RailNav, RailProps } from '../components/Rail';
export { CarouselNav } from '../components/CarouselNav';
export type { CarouselNavControls, CarouselNavProps, CarouselNavTone } from '../components/CarouselNav';

/* ---------- Breaker -------------------------------------------------------- */
export { Breaker, breakerInterval } from '../components/Breaker';
export type {
  BreakerBrand,
  BreakerElement,
  BreakerFigure,
  BreakerMedia,
  BreakerProfile,
  BreakerProps,
  BreakerSlideData,
} from '../components/Breaker';
