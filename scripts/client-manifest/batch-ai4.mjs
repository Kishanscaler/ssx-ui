/**
 * "use client" manifest — BATCH AI4 (AI4 (ChatLayout)). Only the batch AI4 agent edits this file.
 * Add the dist path (no extension) of each client module you create. See ./core.mjs.
 */
export default [
  // Stick-to-bottom, the dock measurement, the new-message count and the
  // scroll button's context: hooks, observers and listeners.
  'components/ChatLayout/ChatLayout',
  // The stick-to-bottom hook (state, effects, scroll listeners, ResizeObserver).
  'lib/use-stick-to-bottom',
];
