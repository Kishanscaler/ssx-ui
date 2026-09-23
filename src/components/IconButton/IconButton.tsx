'use client';

// Client: a thin wrapper over Button, which is client (it attaches the
// `loading` click guard). Listed client in docs/05 section 5.
import * as React from 'react';

import { Button, type ButtonProps } from '../Button';

/* ---------------------------------------------------------------------------
 * IconButton
 *
 * A button whose whole label is an icon, for dense toolbars and row actions
 * where the context already names the object. It is `Button` with a square
 * `icon-*` size and nothing else: same variants, focus ring, lift, disabled
 * fill and loading behaviour (loading replaces the glyph with the spinner: the
 * six-dot grid at `sm`, the monogram at `md` / `lg`).
 * Its whole value is the TYPE: `aria-label` is required, because an icon is
 * not an accessible name.
 *
 * Pass the glyph as the child. Button sizes it (16 / 20 / 24px for sm / md /
 * lg); use Phosphor's `weight="bold"` at `sm`, as the HTML does.
 *
 * Loading: there is no room for text, so there is no `loadingText`. The name
 * stays the `aria-label`; the wait is announced once through the shared live
 * region as `loadingAnnouncement` (default "Loading") — set it to name the
 * action ("Refreshing applicant list") where that helps.
 *
 * Not this: a pressed/unpressed toggle (`aria-pressed`) is ToggleButton. Never
 * use an icon-only button for a destructive action a user meets for the first
 * time. A 32px `sm` button is below the 44px touch minimum: space them apart
 * on touch-first surfaces, or use `md`.
 * ------------------------------------------------------------------------- */

export type IconButtonSize = 'sm' | 'md' | 'lg';

const SIZE = { sm: 'icon-sm', md: 'icon-md', lg: 'icon-lg' } as const;

export type IconButtonProps = Omit<ButtonProps, 'size' | 'aria-label' | 'loadingText'> & {
  /**
   * The accessible name — required. Name the action AND its object when a
   * row has several ("More actions for Aarav Krishnan").
   */
  'aria-label': string;
  /**
   * 32 / 40 / 48px square. Maps to Button's `icon-sm` / `icon-md` / `icon-lg`.
   *
   * @default 'md'
   */
  size?: IconButtonSize;
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ size = 'md', ...props }, ref) {
    return <Button ref={ref} size={SIZE[size] ?? 'icon-md'} {...props} />;
  },
);
IconButton.displayName = 'IconButton';
