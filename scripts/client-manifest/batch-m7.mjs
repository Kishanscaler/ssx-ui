/**
 * "use client" manifest — BATCH M7 (M7 (InputGroup and form-level patterns)). Only the batch M7 agent edits this file.
 * Add the dist path (no extension) of each client module you create. See ./core.mjs.
 */
export default [
  // Context (size, disabled, forwarded control props, addon-text ids), a
  // layout effect in InputGroupText, the addon click-to-focus handler.
  'components/InputGroup/InputGroup',
  // The submit handler and the post-commit focus effect.
  'components/Form/Form',
  // Focus-on-appear effect and the link click handler.
  'components/Form/FormErrorSummary',
];
