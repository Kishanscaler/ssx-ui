/**
 * "use client" manifest — BATCH M3 (molecules M3). Only the batch M3 agent edits this file.
 * Add the dist path (no extension) of each client module you create. See ./core.mjs.
 */
export default [
  // Radix Popover (state, handlers, portal).
  'components/Popover/Popover',
  // Radix Tooltip (state, delay timers, portal) + provider context.
  'components/Tooltip/Tooltip',
  // Radix HoverCard (intent timers, portal) + controllable state for the description wiring.
  'components/HoverCard/HoverCard',
  // Radix Toast (timers, swipe, hotkey, portal) + the Toaster's store subscription.
  'components/Toast/Toast',
];
