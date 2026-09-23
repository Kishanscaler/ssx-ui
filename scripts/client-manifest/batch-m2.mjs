/**
 * "use client" manifest — BATCH M2 (molecules M2). Only the batch M2 agent edits this file.
 * Add the dist path (no extension) of each client module you create. See ./core.mjs.
 */
export default [
  'components/Accordion/Accordion',
  'components/Tabs/Tabs',
];

// Card and ClickableCard are batch M2 too, and deliberately absent: they are
// server components (no hooks, no handlers attached).
