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

/* ---------- SectionHeader -------------------------------------------------- */

/* ---------- PersonCard ----------------------------------------------------- */

/* ---------- ShowcaseCard --------------------------------------------------- */

/* ---------- MediaCard ------------------------------------------------------ */

/* ---------- StatCard, StatGroup, ProfilePlate ------------------------------ */

/* ---------- Rail, CarouselNav ---------------------------------------------- */
export { Rail, RailItem, railTrackVariants, RAIL_STEP_INTERVAL, RAIL_TICKER_SPEED } from '../components/Rail';
export type { RailAutoplayMode, RailItemProps, RailItemWidth, RailNav, RailProps } from '../components/Rail';
export { CarouselNav } from '../components/CarouselNav';
export type { CarouselNavProps, CarouselNavTone } from '../components/CarouselNav';

/* ---------- Breaker -------------------------------------------------------- */

export {};
