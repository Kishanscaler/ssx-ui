import * as React from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Link
 *
 * Navigation: it changes where you are, not what is true. If activating it
 * writes something, it is a Button wearing a link costume — fix the element.
 *
 * Routing goes through `asChild`, never an `href` that renders `next/link`
 * (this package must not import `next/*`):
 *
 *   <Link asChild><NextLink href="/apply">Apply</NextLink></Link>
 *
 * Colour comes from `--content-link`, which inverse and brand-solid surfaces
 * remap for everything inside them, so a plain Link is right on those
 * surfaces with no modifier.
 *
 * `visited` is a prop, not `:visited`: browsers cripple `:visited` styling to
 * stop history sniffing, so a system that relies on it gets a colour it can
 * neither control nor test. Read state comes from your own data.
 *
 * Disabled is `aria-disabled`, and a disabled link has no `href`: removing it
 * is what takes the anchor out of the tab order and stops navigation, while
 * `role="link"` + `aria-disabled` keep it announced. (Under `asChild` the
 * child owns `href`, so the caller omits it.)
 *
 * `standalone`: a link with nothing else on its line (a card action, a footer
 * link, a "View all") is only as tall as its text — 19px at `body`, well
 * under the 44px a thumb needs. Set it and the link gets `touch-target`, the
 * same invisible hit area Button gets, centred on the link and drawn only on
 * a coarse pointer. An inline link inside running text must NEVER get it: the
 * invisible area would spill onto the line above and below and swallow taps
 * meant for the words next to it, not just the link itself.
 *
 * Server atom: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

export const linkVariants = cva(
  [
    'cursor-pointer text-content-link underline decoration-1 underline-offset-2',
    'transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out',
    'motion-reduce:transition-none',
  ],
  {
    variants: {
      variant: {
        default: '',
        // Underline on hover only: lists of links, footers, dense nav.
        quiet: 'no-underline',
      },
      visited: {
        true: 'text-content-link-hover',
        false: '',
      },
      disabled: {
        // The hover rules below are only added when NOT disabled, so there is
        // no specificity race to lose here.
        true: 'cursor-not-allowed text-content-disabled no-underline',
        false: 'hover:text-content-link-hover hover:decoration-2',
      },
    },
    compoundVariants: [{ variant: 'quiet', disabled: false, className: 'hover:underline' }],
    defaultVariants: { variant: 'default', visited: false, disabled: false },
  },
);

export type LinkVariant = 'default' | 'quiet';

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  Omit<VariantProps<typeof linkVariants>, 'disabled' | 'visited' | 'variant'> & {
    /**
     * `default` is underlined (running text, standalone links). `quiet`
     * underlines on hover only, for dense lists where every row is a link.
     *
     * @default 'default'
     */
    variant?: LinkVariant;
    /**
     * Render as the child element (e.g. `next/link`), keeping every style.
     *
     * @default false
     */
    asChild?: boolean;
    /**
     * The link opens somewhere else (usually a new tab). Adds a trailing
     * open-external glyph and a visually hidden "(opens in a new tab)". It
     * does NOT set `target`: the caller decides that.
     *
     * @default false
     */
    external?: boolean;
    /**
     * Already opened, from YOUR data (a completed module). Shown in the
     * link-hover ink.
     *
     * @default false
     */
    visited?: boolean;
    /**
     * This link stands alone — nothing else shares its line (a card action, a
     * footer link, a "View all", a nav item) — rather than sitting inline in
     * running text. Adds an invisible ≥44px hit area on a coarse pointer
     * (`touch-target`), centred on the link, with no change to its drawn
     * size. Leave it `false` for a link inside a paragraph or sentence: the
     * hit area would overlap the lines above and below it.
     *
     * @default false
     */
    standalone?: boolean;
  };

/** Phosphor 2.1.1 `arrow-square-out`, bold (MIT). Inline so the atom has no icon dependency. */
const OPEN_EXTERNAL =
  'M228,104a12,12,0,0,1-24,0V69l-59.51,59.51a12,12,0,0,1-17-17L187,52H152a12,12,0,0,1,0-24h64a12,12,0,0,1,12,12Zm-44,24a12,12,0,0,0-12,12v64H52V84h64a12,12,0,0,0,0-24H48A20,20,0,0,0,28,80V208a20,20,0,0,0,20,20H176a20,20,0,0,0,20-20V140A12,12,0,0,0,184,128Z';

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    className,
    variant = 'default',
    asChild = false,
    external = false,
    visited = false,
    standalone = false,
    href,
    role,
    children,
    ...props
  },
  ref,
) {
  const disabled = props['aria-disabled'] === true || props['aria-disabled'] === 'true';
  const Comp = asChild ? Slot : 'a';
  return (
    <Comp
      ref={ref}
      data-slot="link"
      data-variant={variant}
      data-visited={visited || undefined}
      data-external={external || undefined}
      data-standalone={standalone || undefined}
      href={disabled && !asChild ? undefined : href}
      role={role ?? (disabled && !asChild ? 'link' : undefined)}
      className={cn(linkVariants({ variant, visited, disabled }), standalone && 'touch-target', className)}
      {...props}
    >
      <Slottable>{children}</Slottable>
      {external ? (
        <>
          <svg
            data-slot="link-external-icon"
            viewBox="0 0 256 256"
            aria-hidden="true"
            focusable="false"
            className="ml-1 inline-block size-icon-sm shrink-0 fill-current align-middle"
          >
            <path d={OPEN_EXTERNAL} />
          </svg>
          <span className="sr-only">(opens in a new tab)</span>
        </>
      ) : null}
    </Comp>
  );
});
Link.displayName = 'Link';
