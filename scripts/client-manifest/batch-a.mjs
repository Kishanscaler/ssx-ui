/**
 * "use client" manifest — BATCH A. Only the batch A agent edits this file.
 * Add the dist path (no extension) of each client module you create, e.g.
 * 'components/Checkbox/Checkbox'. See ./core.mjs.
 */
export default [
  // Thin wrapper over Button (client); docs/05 section 5 lists it client.
  'components/IconButton/IconButton',
  // Radix Avatar (image loading) + the group-size context.
  'components/Avatar/Avatar',
  // Client leaves beside server atoms: platform detection, clipboard.
  'components/Kbd/KbdMod',
  'components/Code/CopyButton',
];
