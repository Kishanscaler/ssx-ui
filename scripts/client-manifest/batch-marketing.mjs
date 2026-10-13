/**
 * "use client" manifest — the MARKETING batch (`@kishanscaler/ssx-ui/marketing`,
 * src/marketing/index.ts). See ./core.mjs.
 *
 * Marketing components are server components by default: a card is markup. Only
 * the pieces that hold state are client (a scroller's pages and autoplay, the
 * carousel nav, a breaker's turn), and each is listed here by the family that
 * owns it. The `marketing/index` barrel must NOT carry the directive.
 */
export default [
  // Rail: pages measured from the scroller, autoplay, the sideways takeover.
  'components/Rail/Rail',
  // Rail's pages: scroll and resize listeners (ResizeObserver) over the scroller.
  'components/Rail/use-rail-pages',
  // Rail's autoplay: the stepping timer and the ticker's requestAnimationFrame loop, paused by observers.
  'components/Rail/use-rail-autoplay',
  // (RailItem, rail-geometry and on-sideways are server-safe: no directive.)
  // CarouselNav: the active dot and its timed fill.
  'components/CarouselNav/CarouselNav',
  // Breaker: the turn between slides.
];
