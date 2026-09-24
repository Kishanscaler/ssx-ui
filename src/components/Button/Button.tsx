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
    // Long labels (A4). A button is never wider than its container, and a
    // label that does not fit on one line WRAPS inside it, centred and
    // balanced, the height growing from the size's minimum. It is not
    // truncated: an action whose name is cut off is an action nobody can
    // read, and an ellipsis needs a wrapper element around the label that
    // `asChild` children do not have. `shrink-0` keeps a button at its
    // one-line width wherever there is room, so this only ever happens on a
    // full-width button or a screen narrower than the label: an inline button
    // is still one line. `break-words` (not `anywhere`) breaks only a single
    // word too long for the line, and leaves the min-content width alone.
    'max-w-full font-sans font-semibold text-center text-balance break-words',
    // Touch: an invisible hit area of at least 44px, centred on the button,
    // which keeps its drawn size (`touch-target`, theme.css). It only draws
    // on a coarse pointer and never moves layout. The shine is `::after`, so
    // the two do not collide. Inside a group the members sit shoulder to
    // shoulder, so the area stays the member's own width there and grows
    // only vertically; otherwise two members' areas would overlap across the
    // seam and a tap near it would land on whichever was drawn last.
    'touch-target',
    'pointer-coarse:[[data-slot=button-group]>&]:before:w-full',
    'pointer-coarse:[[data-slot=toggle-button-group]>&]:before:w-full',
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

    // ON A COLOURED FILL (the surface-ink contract, src/lib/surface-ink.ts).
    // A section painted in a strong fill says which with `data-surface-ink`;
    // the button reads it HERE and loads that fill's action inks into its own
    // private properties. The variants below then draw with them under
    // `in-data-[surface-ink]:`. Every value is a semantic `--on-<fill>-*`
    // token, gated for contrast in scripts/build.py:
    //   --button-ink            the fill's ink: the primary's fill, the
    //                           outline's edge and label, the focus ring
    //   --button-ink-fg(-hover) the primary's label at rest / hovered+pressed
    //   --button-ink-hover/-active  the primary's fill, hovered / pressed
    //   --button-wash-hover/-active an outline or ghost, hovered / pressed
    'in-data-[surface-ink=on-brand-solid]:[--button-ink:var(--on-brand-solid-ink)] in-data-[surface-ink=on-brand-solid]:[--button-ink-fg:var(--on-brand-solid-action-fg)] in-data-[surface-ink=on-brand-solid]:[--button-ink-fg-hover:var(--on-brand-solid-action-fg-hover)] in-data-[surface-ink=on-brand-solid]:[--button-ink-hover:var(--on-brand-solid-action-bg-hover)] in-data-[surface-ink=on-brand-solid]:[--button-ink-active:var(--on-brand-solid-action-bg-active)] in-data-[surface-ink=on-brand-solid]:[--button-wash-hover:var(--on-brand-solid-wash-bg-hover)] in-data-[surface-ink=on-brand-solid]:[--button-wash-active:var(--on-brand-solid-wash-bg-active)]',
    'in-data-[surface-ink=on-accent1-solid]:[--button-ink:var(--on-accent1-solid-ink)] in-data-[surface-ink=on-accent1-solid]:[--button-ink-fg:var(--on-accent1-solid-action-fg)] in-data-[surface-ink=on-accent1-solid]:[--button-ink-fg-hover:var(--on-accent1-solid-action-fg-hover)] in-data-[surface-ink=on-accent1-solid]:[--button-ink-hover:var(--on-accent1-solid-action-bg-hover)] in-data-[surface-ink=on-accent1-solid]:[--button-ink-active:var(--on-accent1-solid-action-bg-active)] in-data-[surface-ink=on-accent1-solid]:[--button-wash-hover:var(--on-accent1-solid-wash-bg-hover)] in-data-[surface-ink=on-accent1-solid]:[--button-wash-active:var(--on-accent1-solid-wash-bg-active)]',
    'in-data-[surface-ink=on-accent2-solid]:[--button-ink:var(--on-accent2-solid-ink)] in-data-[surface-ink=on-accent2-solid]:[--button-ink-fg:var(--on-accent2-solid-action-fg)] in-data-[surface-ink=on-accent2-solid]:[--button-ink-fg-hover:var(--on-accent2-solid-action-fg-hover)] in-data-[surface-ink=on-accent2-solid]:[--button-ink-hover:var(--on-accent2-solid-action-bg-hover)] in-data-[surface-ink=on-accent2-solid]:[--button-ink-active:var(--on-accent2-solid-action-bg-active)] in-data-[surface-ink=on-accent2-solid]:[--button-wash-hover:var(--on-accent2-solid-wash-bg-hover)] in-data-[surface-ink=on-accent2-solid]:[--button-wash-active:var(--on-accent2-solid-wash-bg-active)]',
    'in-data-[surface-ink=on-inverse]:[--button-ink:var(--on-inverse-ink)] in-data-[surface-ink=on-inverse]:[--button-ink-fg:var(--on-inverse-action-fg)] in-data-[surface-ink=on-inverse]:[--button-ink-fg-hover:var(--on-inverse-action-fg-hover)] in-data-[surface-ink=on-inverse]:[--button-ink-hover:var(--on-inverse-action-bg-hover)] in-data-[surface-ink=on-inverse]:[--button-ink-active:var(--on-inverse-action-bg-active)] in-data-[surface-ink=on-inverse]:[--button-wash-hover:var(--on-inverse-wash-bg-hover)] in-data-[surface-ink=on-inverse]:[--button-wash-active:var(--on-inverse-wash-bg-active)]',
    'in-data-[surface-ink=on-image]:[--button-ink:var(--on-image-ink)] in-data-[surface-ink=on-image]:[--button-ink-fg:var(--on-image-action-fg)] in-data-[surface-ink=on-image]:[--button-ink-fg-hover:var(--on-image-action-fg-hover)] in-data-[surface-ink=on-image]:[--button-ink-hover:var(--on-image-action-bg-hover)] in-data-[surface-ink=on-image]:[--button-ink-active:var(--on-image-action-bg-active)] in-data-[surface-ink=on-image]:[--button-wash-hover:var(--on-image-wash-bg-hover)] in-data-[surface-ink=on-image]:[--button-wash-active:var(--on-image-wash-bg-active)]',
    // Focus on a fill: the ring and edge in the fill's ink (the page's brand
    // blue disappears on a brand fill). Disabled keeps its page fill on
    // purpose: a grey chip reads as "off" on every fill, and `disabled:`
    // outranks everything below.
    'in-data-[surface-ink]:focus-visible:border-(--button-ink) in-data-[surface-ink]:focus-visible:ring-(--button-ink)/50',
  ],
  {
    variants: {
      variant: {
        // On a fill (see the base): the fill's ink as the fill and the fill's
        // own colour as the label, the same pair as the text, inverted. Hover
        // washes the ink and deepens the label; press washes it further.
        primary: [
          'bg-action-primary text-action-primary-fg',
          'idle:hover:bg-action-primary-hover idle:hover:border-action-primary-border-hover',
          'idle:active:bg-action-primary-active idle:active:border-action-primary-active',
          'in-data-[surface-ink]:bg-(--button-ink) in-data-[surface-ink]:text-(--button-ink-fg)',
          'in-data-[surface-ink]:idle:hover:bg-(--button-ink-hover) in-data-[surface-ink]:idle:hover:text-(--button-ink-fg-hover) in-data-[surface-ink]:idle:hover:border-transparent',
          'in-data-[surface-ink]:idle:active:bg-(--button-ink-active) in-data-[surface-ink]:idle:active:text-(--button-ink-fg-hover) in-data-[surface-ink]:idle:active:border-transparent',
        ],
        // On a fill: an ink outline on the fill itself; hover lightens the
        // fill under it, press deepens it. The ink stays the label.
        secondary: [
          'border-action-secondary-border bg-action-secondary text-action-secondary-fg',
          'idle:hover:border-action-secondary-border-hover idle:hover:bg-action-secondary-hover',
          'idle:active:bg-action-secondary-active',
          'in-data-[surface-ink]:border-(--button-ink) in-data-[surface-ink]:bg-transparent in-data-[surface-ink]:text-(--button-ink)',
          'in-data-[surface-ink]:idle:hover:border-(--button-ink) in-data-[surface-ink]:idle:hover:bg-(--button-wash-hover)',
          'in-data-[surface-ink]:idle:active:bg-(--button-wash-active)',
        ],
        // On a fill: ink text, the same washes as the outline, no edge.
        tertiary: [
          'text-action-tertiary-fg',
          'idle:hover:bg-action-tertiary-hover idle:hover:border-action-tertiary-border-hover',
          'idle:active:bg-action-tertiary-active',
          'in-data-[surface-ink]:text-(--button-ink)',
          'in-data-[surface-ink]:idle:hover:bg-(--button-wash-hover) in-data-[surface-ink]:idle:hover:border-transparent',
          'in-data-[surface-ink]:idle:active:bg-(--button-wash-active)',
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
          // On a fill: the fill's ink, and the same washes as tertiary.
          'in-data-[surface-ink]:text-(--button-ink)',
          'in-data-[surface-ink]:idle:hover:bg-(--button-wash-hover) in-data-[surface-ink]:idle:hover:border-transparent in-data-[surface-ink]:idle:hover:text-(--button-ink)',
          'in-data-[surface-ink]:idle:active:bg-(--button-wash-active) in-data-[surface-ink]:idle:active:text-(--button-ink)',
        ],
      },
      size: {
        // `has-[>svg]:px-*` is shadcn's optical correction: a leading icon
        // already reads as padding, so the box tightens when one is present.
        //
        // The height is a MINIMUM, with a little vertical padding, so a label
        // that wraps (see the base recipe) grows the button instead of
        // spilling out of it. On one line the minimum is what you see: the
        // padding plus one line is always shorter than the control height.
        // `leading-snug` (1.15) sits AFTER the text size: tailwind-merge drops
        // a line height that comes before a font size.
        sm: 'min-h-control-sm min-w-control-sm gap-1.5 px-3 py-1 text-sm leading-snug has-[>svg]:px-2.5',
        md: 'min-h-control-md min-w-control-md px-4 py-2 text-base leading-snug has-[>svg]:px-3',
        lg: 'min-h-control-lg min-w-control-lg px-6 py-2.5 text-md leading-snug has-[>svg]:px-4',

        // Square. `size-*` sets width AND min-width together — setting only
        // width leaves `min-w-control-*` from a text size in play and every
        // small icon button in the system becomes a squashed rectangle.
        //
        // Alone, the icon IS the button and grows with it; beside a label the
        // label sets the optical scale, which is why the text sizes above keep
        // the base 16px icon.
        //
        // A square is never wrapped or squeezed: it has one glyph and no label.
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
          // `?? null`: React 16 throws on a component that returns
          // undefined, which is what Slottable returns for a childless button.
          (children ?? null)
        )}
      </Slottable>
    </Comp>
  );
});
Button.displayName = 'Button';
