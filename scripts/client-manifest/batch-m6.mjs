/**
 * "use client" manifest — BATCH M6 (molecules M6). Only the batch M6 agent edits this file.
 */
export default [
  // useControllableState for the page; click handlers on every control.
  'components/Pagination/Pagination',
  // Group state + context; composes the client Checkbox / RadioGroup atoms.
  'components/SelectableCard/SelectableCard',
];

// Breadcrumbs is batch M6 too, and deliberately absent: it is a server
// component (no hooks, no handlers); the collapsed "…" renders the client Menu.
