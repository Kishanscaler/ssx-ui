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
  // Rail's autoplay: the stepping timer, paused by observers (useInView, usePageHidden: Breaker shares them).
  'components/Rail/use-rail-autoplay',
  // (RailItem, rail-geometry and on-sideways are server-safe: no directive.)
  // CarouselNav: the active dot and its timed fill.
  'components/CarouselNav/CarouselNav',
  // Breaker: the turn between slides (the active slide and its direction, the dot's fill as the
  // clock, a sideways swipe), the band's in-view state, the inert slides.
  'components/Breaker/Breaker',
  // Breaker's picture: each clip played and paused from state.
  'components/Breaker/BreakerMedia',
  // Breaker's clip: play / pause / restart a <video> from state.
  'components/Breaker/use-breaker-clip',
  // Breaker's brand: the nearest data-brand read on mount, for the dark island.
  'components/Breaker/use-breaker-brand',
  // (BreakerSlide and types are server-safe: no directive.)
];
