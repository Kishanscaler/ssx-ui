'use client';

// Client: the platform is only known in the browser, read in an effect.
import * as React from 'react';

import { cn } from '../../lib/cn';
import { kbdClassName } from './Kbd';

/* ---------------------------------------------------------------------------
 * KbdMod
 *
 * The platform-aware modifier key: `⌘` / `⌥` on Apple devices, `Ctrl` / `Alt`
 * everywhere else. Hard-coding the glyph is wrong for most visitors.
 *
 * Hydration-safe on React 16.12 through 19 without `useSyncExternalStore`
 * (absent before 18): the server and the first client render both say `Ctrl`
 * (the majority platform), and an effect switches to `⌘` after mount on a Mac.
 * Pass `platform` when you already know it (from a user-agent header on the
 * server), and nothing switches at all.
 *
 * On Apple the glyph is `aria-hidden` and a visually hidden word ("Command",
 * "Option") is read instead, because `⌘` is announced inconsistently.
 * ------------------------------------------------------------------------- */

export type KbdModifier = 'mod' | 'alt';
export type KbdPlatform = 'mac' | 'other';

const KEYS: Record<KbdModifier, Record<KbdPlatform, { glyph: string; name: string }>> = {
  mod: { mac: { glyph: '⌘', name: 'Command' }, other: { glyph: 'Ctrl', name: 'Control' } },
  alt: { mac: { glyph: '⌥', name: 'Option' }, other: { glyph: 'Alt', name: 'Alt' } },
};

function detectPlatform(): KbdPlatform {
  if (typeof navigator === 'undefined') return 'other';
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '') ? 'mac' : 'other';
}

export type KbdModProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  /**
   * `mod` is ⌘ / Ctrl; `alt` is ⌥ / Alt.
   *
   * @default 'mod'
   */
  modifier?: KbdModifier;
  /**
   * Force the platform instead of detecting it after mount.
   *
   * @default detected in the browser; 'other' on the server and first render
   */
  platform?: KbdPlatform;
};

export const KbdMod = React.forwardRef<HTMLElement, KbdModProps>(function KbdMod(
  { className, modifier = 'mod', platform, ...props },
  ref,
) {
  const [detected, setDetected] = React.useState<KbdPlatform>('other');
  React.useEffect(() => {
    if (platform == null) setDetected(detectPlatform());
  }, [platform]);

  const resolved = platform ?? detected;
  const key = (KEYS[modifier] ?? KEYS.mod)[resolved];
  const spoken = resolved === 'mac';

  return (
    <kbd
      ref={ref}
      data-slot="kbd"
      data-kbd={modifier}
      data-platform={resolved}
      className={cn(kbdClassName, 'min-w-[34px]', className)}
      {...props}
    >
      {spoken ? (
        <>
          <span aria-hidden="true">{key.glyph}</span>
          <span className="sr-only">{key.name}</span>
        </>
      ) : (
        key.glyph
      )}
    </kbd>
  );
});
KbdMod.displayName = 'KbdMod';
