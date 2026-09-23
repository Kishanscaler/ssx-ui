'use client';

// Client: Button attaches its own click handler (the `loading` guard below),
// and a function prop on a host element cannot cross the RSC boundary.
import * as React from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { announce, ensureAnnouncer, withdraw } from '../../lib/announce';
import { cn } from '../../lib/cn';
import { Spinner } from '../Spinner';

/* ---------------------------------------------------------------------------
 * Button
 *
 * Structure and API follow shadcn/ui: a `cva` recipe + a `React.forwardRef`
 * component (not shadcn's plain function: `ref` is only a prop from React 19,
 * and this package supports 16.12+), `data-slot` for styling hooks, `asChild` for polymorphism, icons
 * composed as CHILDREN rather than passed as props, and a square `icon-*` size
 * instead of a boolean. Only the token values and the variant vocabulary are
 * ours.
 *
 * The variants ARE the meaning. `primary` is the one thing this screen is for,
 * `secondary` is the alternative, `tertiary` is a ghost action, `danger`
 * destroys something, and `neutral` dismisses or clears. Nothing here is
 * decorative, which is why there is no `outline` or `ghost` alias: two names
 * for one meaning is how a system starts drifting.
 * ------------------------------------------------------------------------- */

export const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2',
    // `border` is 1px, which is `--border-hair`. The radius ladder is gated in
    // the Python build, so `rounded-md` and the token cannot drift apart.
    'rounded-md border border-transparent',
    'font-sans font-semibold leading-none whitespace-nowrap',
    'cursor-pointer outline-none transition-all',
    'duration-[var(--motion-duration-normal)] ease-[var(--motion-easing-productive-in-out)]',

    // Focus: shadcn's ring contract — a 3px ring at half strength plus a solid
    // border, so the control is legible against both a page and a raised card.
    'focus-visible:border-border-focus focus-visible:ring-border-focus/50 focus-visible:ring-[3px]',

    // Disabled is a fill, not an opacity. Fading a button also fades the
    // surface behind it and the result is unreadable on a raised card — this
    // is the one place we knowingly diverge from `disabled:opacity-50`.
    'disabled:pointer-events-none disabled:border-action-disabled-border',
    'disabled:bg-action-disabled disabled:text-action-disabled-fg',
    // `aria-disabled` alone (a consumer's) still takes the pointer away. A
    // LOADING button keeps it, so the cursor can say "working": `cursor-progress`
    // is the arrow-plus-wait that means "the page still works, this control is
    // busy". It cannot react to that pointer, because every hover and press
    // style below is written `idle:` (`:enabled` and not `[data-loading]`, see
    // theme.css) rather than `enabled:`; the click is swallowed in the handler.
    'aria-disabled:not-data-loading:pointer-events-none',
    'data-loading:cursor-progress',

    'aria-invalid:border-danger-border aria-invalid:ring-danger/20',

    // Hover lifts the button 2px; a press drops it back to rest, instantly, so
    // the press reads as contact rather than as a slow slide. The same on every
    // variant. `border border-transparent` above is what stops the per-variant
    // hover border from shifting the layout by a pixel.
    'idle:hover:-translate-y-0.5',
    'idle:active:translate-y-0 idle:active:duration-[var(--motion-duration-instant)]',
    // Reduced motion: no transition and no lift. Written with `idle:` so it
    // matches the specificity of the lift it cancels; a bare `hover:` would
    // lose to `idle:hover:` and the button would still jump.
    'motion-reduce:transition-none motion-reduce:idle:hover:translate-y-0',
    // Inside a ButtonGroup the buttons share borders, and one lifting out of
    // the row tears the group apart.
    '[[data-slot=button-group]_&]:idle:hover:translate-y-0',

    // Icons are children. `:not([class*='size-'])` is shadcn's escape hatch:
    // an icon that sets its own size keeps it.
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-sm",
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-action-primary text-action-primary-fg',
          'idle:hover:bg-action-primary-hover idle:hover:border-action-primary-border-hover',
          'idle:active:bg-action-primary-active idle:active:border-action-primary-active',
        ],
        secondary: [
          'border-action-secondary-border bg-action-secondary text-action-secondary-fg',
          'idle:hover:border-action-secondary-border-hover idle:hover:bg-action-secondary-hover',
          'idle:active:bg-action-secondary-active',
        ],
        tertiary: [
          'text-action-tertiary-fg',
          'idle:hover:bg-action-tertiary-hover idle:hover:border-action-tertiary-border-hover',
          'idle:active:bg-action-tertiary-active',
        ],
        danger: [
          'bg-action-danger text-action-danger-fg',
          'idle:hover:bg-action-danger-hover idle:hover:border-action-danger-border-hover',
          'idle:active:bg-action-danger-active idle:active:border-action-danger-active',
        ],
        // `tertiary` is brand-inked, which is right for a ghost ACTION ("Add
        // another") and wrong for every dismiss, close and clear control in
        // the system — those inherited brand colour and became the most
        // saturated thing in the component they were dismissing, including a
        // green close button on a danger toast. An affordance that REMOVES
        // something must not advertise itself in the brand colour.
        neutral: [
          'text-content-secondary',
          'idle:hover:bg-action-neutral-hover idle:hover:border-action-neutral-border-hover idle:hover:text-content',
          'idle:active:bg-action-neutral-active idle:active:text-content',
          // `neutral` takes its colour from the PAGE's content roles, so every
          // surface that is not the page owes it a context rule — on a raised
          // surface the hover has to move the other way, or the dismiss button
          // in a toast lights up darker than the toast it sits in.
          // `[data-elevation="raised"]` is the contract: Card, Toast, Menu,
          // Popover and Drawer set it.
          '[[data-elevation=raised]_&]:idle:hover:bg-surface-raised-hover',
          '[[data-elevation=raised]_&]:idle:active:bg-surface-raised-active',
        ],
      },
      size: {
        // `has-[>svg]:px-*` is shadcn's optical correction: a leading icon
        // already reads as padding, so the box tightens when one is present.
        sm: 'h-control-sm min-w-control-sm gap-1.5 px-3 text-sm has-[>svg]:px-2.5',
        md: 'h-control-md min-w-control-md px-4 text-base has-[>svg]:px-3',
        lg: 'h-control-lg min-w-control-lg px-6 text-md has-[>svg]:px-4',

        // Square. `size-*` sets width AND min-width together — setting only
        // width leaves `min-w-control-*` from a text size in play and every
        // small icon button in the system becomes a squashed rectangle.
        //
        // Alone, the icon IS the button and grows with it; beside a label the
        // label sets the optical scale, which is why the text sizes above keep
        // the base 16px icon.
        'icon-sm': "size-control-sm p-0 [&_svg:not([class*='size-'])]:size-icon-sm",
        'icon-md': "size-control-md p-0 [&_svg:not([class*='size-'])]:size-icon-md",
        'icon-lg': "size-control-lg p-0 [&_svg:not([class*='size-'])]:size-icon-lg",
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export type ButtonVariant = NonNullable<ButtonVariantProps['variant']>;
export type ButtonSize = NonNullable<ButtonVariantProps['size']>;

export type ButtonProps = React.ComponentPropsWithoutRef<'button'> &
  ButtonVariantProps & {
    /**
     * Render as the child element instead of a `<button>`, keeping every style
     * and prop. This is how a link gets a button's appearance without a
     * duplicate `LinkButton` component:
     *
     *   <Button asChild><a href="/apply">Apply now</a></Button>
     *
     * @default false
     */
    asChild?: boolean;
    /**
     * Busy. Renders a `<Spinner>` before the label and blocks clicks, while
     * keeping the button focusable and keeping its accessible name — so a
     * screen reader is told the control is busy rather than finding it gone.
     *
     * The spinner follows the system rule — small sizes use the dots loader,
     * bigger sizes use the monogram: `sm` and `icon-sm` get the six-dot grid;
     * `md`, `lg`, `icon-md` and `icon-lg` get the monogram (the solid
     * silhouette inking upward, as the HTML `.btn.is-loading` draws it).
     *
     * The shadcn way is to compose the spinner yourself
     * (`<Button disabled><Spinner />Saving</Button>`). This prop exists only
     * because that composition also has to get `aria-busy`, `aria-disabled`
     * and click suppression right, and a prop is the cheapest place to encode
     * a contract three call sites will otherwise each invent.
     *
     * How a user knows it is loading, per channel:
     *   - **sighted**: the loader beside the label. Under
     *     `prefers-reduced-motion` it holds a visibly UNFINISHED frame (the
     *     dots with their leading dot lit, the mark half-inked), never the
     *     finished mark, which would read as "done".
     *   - **pointer**: `cursor: progress` over the button. It keeps pointer
     *     events for that, but neither lifts nor lights up on hover or press.
     *   - **screen reader**: `aria-busy` alone is mostly silent, so turning
     *     `loading` on announces `loadingAnnouncement` once through a polite
     *     live region, and turning it off withdraws it. See that prop.
     *
     * @default false
     */
    loading?: boolean;
    /**
     * The visible label WHILE `loading` — "Submitting…", "Saving draft…". Unset,
     * the label stays exactly as it is, which is the right default: the button
     * keeps saying what it is doing.
     *
     * Name the action, not the wait. A generic "Loading…" is discouraged: it
     * throws away the context the label carried (loading WHAT?), and it is a
     * different width from the label it replaces.
     *
     * Width: the original label is kept in the layout, invisible and out of
     * the accessibility tree, in the same grid cell as this text, so the button
     * never gets NARROWER when it starts loading. A `loadingText` longer than
     * the label still widens it — keep it no longer than the label. (The
     * loader itself adds its own 16px and gap, as it always has.)
     *
     * While it shows, it IS the accessible name ("Submitting…"), matching what
     * is on screen. Ignored on the square `icon-*` sizes, which have no room
     * for text, and under `asChild`, whose child owns its own content; it
     * still becomes the default announcement in both cases.
     */
    loadingText?: string;
    /**
     * What a screen reader is told, once, when `loading` turns on: written to
     * a single, visually hidden, polite live region shared by the whole
     * package, and withdrawn when `loading` turns off. The button's own
     * accessible name is never touched by it.
     *
     * Announced on the `false -> true` CHANGE only. A button that mounts
     * already loading (a page rendered mid-request) stays silent, so a screen
     * full of them is not read out one by one. Several buttons that start
     * loading at the same moment are announced once.
     *
     * Pass `null` when the surrounding UI already announces the wait itself.
     *
     * @default loadingText ?? 'Loading'
     */
    loadingAnnouncement?: string | null;
    /**
     * A specular sweep that travels across the fill, on a long loop with most
     * of the cycle spent still. It is a MODIFIER, not a variant: it adds
     * nothing to the button's meaning, so it stacks on any of them without
     * changing what they are.
     *
     * It belongs to delight — a hero call to action, a confirmation of
     * success — and explicitly nowhere near a decline or a destructive
     * confirm. `danger` therefore never shines; the suppression lives in
     * `styles/components.css` next to the rule it overrides, so the two cannot
     * be read apart. It is also suppressed while `loading` (a button cannot be
     * busy and enticing at once), while disabled, and under
     * `prefers-reduced-motion`.
     *
     * @default false
     */
    shine?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    asChild = false,
    loading = false,
    loadingText,
    loadingAnnouncement,
    shine = false,
    children,
    type,
    onClick,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot : 'button';

  // A square button has room for exactly one glyph. Left alone, the spinner
  // lands BESIDE the icon and the two share a 40px box, so the control reads as
  // broken rather than busy. Its accessible name comes from `aria-label` (which
  // an icon-only button must carry anyway), so dropping the icon costs nothing.
  // Not under `asChild`: Slot needs its single child element to exist.
  const replacesChildren = loading && !asChild && size != null && size.startsWith('icon');

  // Small sizes use the six-dot grid; bigger sizes use the monogram. The glyph
  // is 16px either way (a Spinner `sm`); what changes is what it draws.
  const spinnerKind = size === 'sm' || size === 'icon-sm' ? 'dots' : 'monogram';

  // The visible label swap. Not on a square button (no room) and not under
  // asChild (Slot's child owns its content).
  const isSquare = size != null && size.startsWith('icon');
  const swapsLabel = loading && !asChild && !isSquare && loadingText != null && loadingText !== '';

  // Announce the wait once, on the false -> true change. The message is read
  // from a ref so a changing label does not re-announce; the previous-value
  // ref makes the effect safe under StrictMode's mount/unmount/mount, which
  // re-runs it with `loading` unchanged.
  const announcement =
    loadingAnnouncement === undefined ? (loadingText || 'Loading') : loadingAnnouncement;
  const announcementRef = React.useRef(announcement);
  announcementRef.current = announcement;
  const wasLoading = React.useRef(loading);
  // The live region must exist BEFORE its first message, or several screen
  // readers skip that message. Mounting any Button puts it in the page, empty.
  React.useEffect(() => {
    ensureAnnouncer();
  }, []);
  React.useEffect(() => {
    const turnedOn = loading && !wasLoading.current;
    wasLoading.current = loading;
    if (!turnedOn || !announcementRef.current) return undefined;
    const ticket = announce(announcementRef.current);
    return () => withdraw(ticket);
  }, [loading]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // `loading` uses aria-disabled rather than the disabled attribute, so
    // focus is kept and the busy state is announced. That means the click has
    // to be stopped here.
    if (loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (onClick) onClick(event);
  };

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      // Emitted as asked, even on `danger`, so the DOM reflects the call site
      // rather than quietly disagreeing with it. The stylesheet is the single
      // place that decides where a shine is allowed to land.
      data-shine={shine || undefined}
      // A <button> inside a <form> submits it unless told otherwise, and that
      // default has cost more forms than it has ever saved.
      type={asChild ? type : (type ?? 'button')}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      {...props}
    >
      {/* Silent: the wait is announced once, through the shared live region
          (`loadingAnnouncement`), and a second "Loading" from the mark would
          double it up. */}
      {loading ? <Spinner label={null} kind={spinnerKind} /> : null}
      {/* Slottable is what lets the spinner sit OUTSIDE the slotted child when
          asChild is set. Without it, Slot sees two children and throws. */}
      <Slottable>
        {replacesChildren ? null : swapsLabel ? (
          // One grid cell, two layers: the original label holds the width
          // (invisible, so it is out of the accessible name too), and the
          // loading text is drawn over it. `gap-[inherit]` carries the
          // button's icon-to-label gap into the hidden copy so it measures
          // exactly what was on screen.
          <span data-slot="button-label" className="inline-grid gap-[inherit]">
            <span
              aria-hidden="true"
              className="invisible col-start-1 row-start-1 inline-flex items-center justify-center gap-[inherit]"
            >
              {children}
            </span>
            <span className="col-start-1 row-start-1">{loadingText}</span>
          </span>
        ) : (
          children
        )}
      </Slottable>
    </Comp>
  );
});
Button.displayName = 'Button';
