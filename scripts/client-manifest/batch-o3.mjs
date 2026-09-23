/**
 * "use client" manifest — BATCH O3 (organisms O3). Only the batch O3 agent edits this file.
 */
export default [
  // The one client part of Table: the sort button attaches the click handler.
  'components/Table/TableSortButton',
  // Sort / selection / page state; composes Checkbox, Select, Menu, Pagination.
  'components/DataTable/DataTable',
  // Expanded / selected / focus state and the tree keyboard contract.
  'components/TreeList/TreeList',
  // Roving tabindex (layout effect + key handler); ToolbarToggle is Radix Toggle.
  'components/Toolbar/Toolbar',
];

// Table.tsx and List.tsx are batch O3 too, and deliberately absent: server
// components (no hooks, no handlers). A sortable TableHead renders the client
// TableSortButton.
