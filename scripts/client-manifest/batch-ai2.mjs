/**
 * "use client" manifest — BATCH AI2 (AI2 (groundwork + ChatComposer)). Only the batch AI2 agent edits this file.
 * Add the dist path (no extension) of each client module you create. See ./core.mjs.
 *
 * Server (no directive, must stay that way): components/VisuallyHidden/VisuallyHidden,
 * and components/List/List (ListItemLink / ListItemButton attach no handler).
 */
export default [
  // The Toolbar size cascade: a React context and the hook that reads it.
  'lib/control-size',
  // Draft state, the parts' shared context, key / click / focus handlers.
  'components/ChatComposer/ChatComposer',
];
