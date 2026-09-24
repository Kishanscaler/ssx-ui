import * as React from 'react';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Kbd, KbdGroup
 *
 * A literal key the user should press. Only for real keystrokes: never to
 * make a UI label look technical, and never for a value to copy (that is
 * Code). The glyphs are real characters inside `<kbd>`, not icons, so they are
 * read out and searchable. `⌘` is announced inconsistently across screen
 * readers: where a shortcut is the ONLY way to reach a feature, spell it out
 * in text as well.
 *
 * A combination is a `KbdGroup`, which renders the HTML-spec form of a key
 * combination — a `<kbd>` containing `<kbd>`s — and puts the `+` between the
 * keys for you. It never breaks across a line.
 *
 * For the platform modifier (⌘ on Apple, Ctrl elsewhere) use `KbdMod`, a
 * separate client leaf, so these two stay server atoms (no hooks, no
 * handlers).
 * ------------------------------------------------------------------------- */

export const kbdClassName = [
  'inline-flex h-[1.375rem] min-w-[1.375rem] shrink-0 items-center justify-center px-1.5',
  // The 2px bottom edge is the keycap; `border-b-2` over the 1px hairline.
  'rounded-sm border border-b-2 border-border-decorative bg-surface-sunken',
  'font-mono text-xs leading-none font-regular text-content-secondary',
].join(' ');

export type KbdProps = React.HTMLAttributes<HTMLElement>;

export const Kbd = React.forwardRef<HTMLElement, KbdProps>(function Kbd({ className, ...props }, ref) {
  return <kbd ref={ref} data-slot="kbd" className={cn(kbdClassName, className)} {...props} />;
});
Kbd.displayName = 'Kbd';

export type KbdGroupProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * What goes between the keys. `null` for none (a sequence you have
   * separated yourself).
   *
   * @default '+'
   */
  separator?: React.ReactNode;
};

export const KbdGroup = React.forwardRef<HTMLElement, KbdGroupProps>(function KbdGroup(
  { className, separator = '+', children, ...props },
  ref,
) {
  const keys = React.Children.toArray(children);
  return (
    <kbd
      ref={ref}
      data-slot="kbd-group"
      className={cn('inline-flex items-center gap-1 font-sans whitespace-nowrap', className)}
      {...props}
    >
      {keys.map((key, i) => (
        <React.Fragment key={i}>
          {i > 0 && separator != null ? (
            <span data-slot="kbd-separator" className="text-xs text-content-secondary">
              {separator}
            </span>
          ) : null}
          {key}
        </React.Fragment>
      ))}
    </kbd>
  );
});
KbdGroup.displayName = 'KbdGroup';
