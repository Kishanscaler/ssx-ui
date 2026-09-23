/**
 * "use client" manifest — BATCH O1 (organisms O1). Only the batch O1 agent edits this file.
 * Add the dist path (no extension) of each client module you create. See ./core.mjs.
 */
export default [
  'components/Dialog/Dialog',
  'components/TopNav/TopNavToggle',
  'components/Carousel/CarouselControls',
];

// Deliberately absent: components/TopNav/TopNav and components/Carousel/Carousel
// are server components. The bar, its links and the carousel track are plain
// markup; only the menu toggle and the carousel controls hold state, and they
// reach the markup through the DOM (`data-open` on the bar, the track's scroll
// position), not through a context.
