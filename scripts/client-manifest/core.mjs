/**
 * "use client" manifest — CORE. dist-relative paths, no extension, of modules
 * that must start with "use client". Read by scripts/check-directives.mjs,
 * which merges every file in this directory.
 *
 * One file per batch so parallel agents never edit the same lines. Batch
 * agents: edit only your own batch-*.mjs. See docs/05-react-architecture.md
 * section 5 for which atoms are client.
 *
 * Entries under `lib/` may be absent from dist (a helper is only emitted once
 * an atom imports it); entries under `components/` must exist.
 */
export default [
  'components/Button/Button',
  // Compat hooks for atoms (React 16.12-safe). Client because they are hooks.
  'lib/use-id',
  'lib/use-composed-refs',
];
