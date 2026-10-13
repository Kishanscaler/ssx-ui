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
/* fields, PhotoFrame, GlassPlate, LogoTile, Figure: append below this line. */
export type { MarketingCardFields, MarketingFigure, MarketingLogo, MarketingPerson } from '../components/MarketingCard';
export { PhotoFrame, photoFrameVariants } from '../components/PhotoFrame';
export type { PhotoFrameBlur, PhotoFramePlaceholder, PhotoFrameProps, PhotoFrameRatio } from '../components/PhotoFrame';
export { GlassPlate, glassPlateVariants } from '../components/GlassPlate';
export type { GlassPlateElement, GlassPlateInset, GlassPlateProps, GlassPlateTone } from '../components/GlassPlate';
export { LogoTile, logoTileVariants } from '../components/LogoTile';
export type { LogoTileFill, LogoTileProps, LogoTileShape, LogoTileSize } from '../components/LogoTile';
export { Figure, figureVariants, splitFigure } from '../components/Figure';
export type { FigureElement, FigurePart, FigureProps, FigureSize, FigureTone } from '../components/Figure';

/* ---------- SectionHeader -------------------------------------------------- */

/* ---------- PersonCard ----------------------------------------------------- */

/* ---------- ShowcaseCard --------------------------------------------------- */

/* ---------- MediaCard ------------------------------------------------------ */

/* ---------- StatCard, StatGroup, ProfilePlate ------------------------------ */

/* ---------- Rail, CarouselNav ---------------------------------------------- */

/* ---------- Breaker -------------------------------------------------------- */
