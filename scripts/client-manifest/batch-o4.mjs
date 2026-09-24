/**
 * "use client" manifest — BATCH O4 (organisms O4). Only the batch O4 agent edits this file.
 */
export default [
  // Radix Collapsible: a SideNavGroup with `collapsible` (the rest of SideNav is server markup).
  'components/SideNav/SideNavCollapsibleGroup',
  // The collapsible rail: its state and context, the item tooltips (Radix Tooltip), the collapse trigger.
  'components/SideNav/SideNavRail',
  // Radix Dialog: the AppShell's small-screen nav drawer, its root and trigger (the shell is server markup).
  'components/AppShell/AppShellNav',
  // Drag / drop / change handlers and rejection state; row action handlers and ids.
  'components/FileUpload/FileUpload',
  // Visible month, roving focus, controllable value, the grid's key handler.
  'components/DatePicker/Calendar',
  // Controllable value and open state; the Popover closes on a pick.
  'components/DatePicker/DatePicker',
];
