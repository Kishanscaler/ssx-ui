'use client';

// Client: this module creates a React context and exports the hook that reads it.
import * as React from 'react';

/* ---------------------------------------------------------------------------
 * Control size cascade
 *
 * A container that holds a row of controls (Toolbar today) can set their size
 * ONCE instead of on every child:
 *
 *   <Toolbar aria-label="Message options" size="sm">
 *     <IconButton aria-label="Attach a file"><Paperclip /></IconButton>   // icon-sm
 *     <Button variant="tertiary">Auto</Button>                             // sm
 *     <IconButton size="md" aria-label="Voice input"><Microphone /></IconButton> // md: explicit wins
 *   </Toolbar>
 *
 * The rule every reader follows: the context is consulted ONLY when the
 * control's own `size` prop is `undefined`. An explicit size (including
 * `null` on Button, which means "no size class") always wins. With no
 * provider above it, the hook returns `undefined` and each control falls
 * back to the default it always had, so a control outside a sized container
 * renders exactly what it rendered before the cascade existed.
 *
 * The value is the SCALE step (`sm` / `md` / `lg`), not a component's own
 * size name. Each reader maps it: Button `sm` -> `sm`; IconButton `sm` ->
 * `icon-sm` (it already maps its own prop that way); ToggleButton picks the
 * text or the square size by whether it has a text label.
 *
 * Portals: React context passes through them, so every overlay that can hold
 * Buttons (Popover, Dialog, Menu, SideDrawer, BottomSheet, HoverCard,
 * CommandPalette) resets the cascade just inside its portal with
 * `<ControlSizeProvider value={undefined}>`. Content opened FROM a sized
 * toolbar starts from each control's own default.
 * ------------------------------------------------------------------------- */

/** One step of the shared control scale: 32 / 40 / 48px. */
export type ControlSize = 'sm' | 'md' | 'lg';

const ControlSizeContext = React.createContext<ControlSize | undefined>(undefined);
ControlSizeContext.displayName = 'ControlSizeContext';

/**
 * Sets the size of the Buttons, IconButtons and ToggleButtons below it.
 * `undefined` resets the cascade (children take their own defaults).
 */
export const ControlSizeProvider = ControlSizeContext.Provider;

/** The size a sized container asks for, or `undefined` when none does. */
export function useControlSize(): ControlSize | undefined {
  return React.useContext(ControlSizeContext);
}
