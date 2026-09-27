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
 * `secondary` is the alternative (an outline), `tertiary` is a link-only action, `danger`
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
    'disabled:bg-action-disabled disabled:text-action-disabled-fg disabled:[--button-well:var(--action-disabled-fg)] disabled:[--button-well-ink:var(--action-disabled-bg)]',
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
    // A region over a strong fill says which with `data-surface-ink` (today
    // only `on-image`, a media Card's content over its photograph);
    // the button reads it HERE and loads that fill's action inks into its own
    // private properties. The variants below then draw with them under
    // `in-data-[surface-ink]:`. Every value is a semantic `--on-<fill>-*`
    // token, gated for contrast in scripts/build.py:
    //   --button-ink            the fill's ink: the primary's fill, the
    //                           outline's edge and label, the focus ring
    //   --button-ink-fg(-hover) the primary's label at rest / hovered+pressed
    //   --button-ink-hover/-active  the primary's fill, hovered / pressed
    //   --button-wash-hover/-active an outline or ghost, hovered / pressed
    'in-data-[surface-ink=on-image]:[--button-ink:var(--on-image-ink)] in-data-[surface-ink=on-image]:[--button-ink-fg:var(--on-image-action-fg)] in-data-[surface-ink=on-image]:[--button-ink-fg-hover:var(--on-image-action-fg-hover)] in-data-[surface-ink=on-image]:[--button-ink-hover:var(--on-image-action-bg-hover)] in-data-[surface-ink=on-image]:[--button-ink-active:var(--on-image-action-bg-active)] in-data-[surface-ink=on-image]:[--button-wash-hover:var(--on-image-wash-bg-hover)] in-data-[surface-ink=on-image]:[--button-wash-active:var(--on-image-wash-bg-active)]',
    // Focus on a fill: the ring and edge in the fill's ink (the page's brand
    // blue can vanish on a fill). Disabled keeps its page fill on
    // purpose: a grey chip reads as "off" on every fill, and `disabled:`
    // outranks everything below.
    'in-data-[surface-ink]:focus-visible:border-(--button-ink) in-data-[surface-ink]:focus-visible:ring-(--button-ink)/50',

    // The trailing icon well (`ButtonIcon`). It is a PART of this button, not
    // a second control: one element, one focus stop, one hover. Each variant
    // that takes a well (primary, secondary, danger) names two colours, the
    // same in every state: `--button-well` (the well's fill: the variant's
    // resting LABEL colour) and `--button-well-ink` (the glyph: its resting
    // FILL colour). THE INVERSION: hovered or keyboard-focused, the well's
    // fill EXPANDS from its square to cover the whole button, and the glyph
    // rides its leading edge to the end (ButtonIcon); the label turns the
    // glyph's colour as the fill passes under it. The result is the variant's
    // own gated fg/bg pair, swapped, so its contrast is the same ratio by
    // construction. `--button-well-edge` is the colour of the 4px edge the
    // open fill draws (primary, danger); secondary's is transparent, its
    // edge already being the fill colour. `group/button` is what the well's glide keys
    // on (see ButtonIcon and the sizes below).
    'group/button',
    // The well's expansion runs at `--motion-duration-normal` (250ms) on the
    // system's EASE-OUT, `--motion-easing-productive-entrance` (decided
    // 2026-09-27, after 350ms in-out felt slow): most of the move happens up
    // front, then it settles. Every moving part of the well uses the same
    // pair. The press still drops back instantly (`idle:active:` above wins).
    'has-[>[data-slot=button-icon]]:ease-[var(--motion-easing-productive-entrance)]',
    // The well's fill paints UNDER the label (z-index -1 inside this button's
    // own stacking context) and over the button's own background.
    'has-[>[data-slot=button-icon]]:isolate',
    // Busy: nothing moves. Hover does not open the well (every rule is
    // `idle:` / `well-open:`), and the moment `loading` turns on the button
    // snaps to rest rather than animating back while it works.
    'has-[>[data-slot=button-icon]]:data-loading:transition-none',
    // With a well, the button's own loader moves INTO the well (ButtonIcon
    // renders it there); this hides the leading one Button would otherwise
    // draw. Button already skips it when it sees the part among its children;
    // this covers `asChild`, where the part is inside the child.
    'has-[>[data-slot=button-icon]]:[&>[data-slot=spinner]]:hidden',
  ],
  {
    variants: {
      variant: {
        // On a fill (see the base): the fill's ink as the fill and the fill's
        // own colour as the label, the same pair as the text, inverted. Hover
        // washes the ink and deepens the label; press washes it further.
        primary: [
          'bg-action-primary text-action-primary-fg',
          // With a well: a white well and a brand glyph at rest; hovered, a
          // white button with a brand edge and label, the well melted into it.
          '[--button-well:var(--action-primary-fg)] [--button-well-ink:var(--action-primary-bg)] [--button-well-edge:var(--button-well-ink)]',
          'in-data-[surface-ink]:[--button-well:var(--button-ink-fg)] in-data-[surface-ink]:[--button-well-ink:var(--button-ink)]',
          'has-[>[data-slot=button-icon]]:idle:hover:text-(--button-well-ink) has-[>[data-slot=button-icon]]:idle:hover:border-(--button-well-ink)',
          'has-[>[data-slot=button-icon]]:idle:active:text-(--button-well-ink) has-[>[data-slot=button-icon]]:idle:active:border-(--button-well-ink)',
          'has-[>[data-slot=button-icon]]:idle:focus-visible:text-(--button-well-ink)',
          'idle:hover:bg-action-primary-hover idle:hover:border-action-primary-border-hover',
          'idle:active:bg-action-primary-active idle:active:border-action-primary-active',
          'in-data-[surface-ink]:bg-(--button-ink) in-data-[surface-ink]:text-(--button-ink-fg)',
          'in-data-[surface-ink]:idle:hover:bg-(--button-ink-hover) in-data-[surface-ink]:idle:hover:text-(--button-ink-fg-hover) in-data-[surface-ink]:idle:hover:border-transparent',
          'in-data-[surface-ink]:idle:active:bg-(--button-ink-active) in-data-[surface-ink]:idle:active:text-(--button-ink-fg-hover) in-data-[surface-ink]:idle:active:border-transparent',
        ],
        // An outline in the label's own colour (`border-current`), on every
        // surface and in every state, and NO fill on hover or press: the lift
        // is the hover, the drop back to rest is the press (decided
        // 2026-09-27). A brand-tinted hover fill made the alternative action
        // light up like the primary one. On a fill the outline is the ink over
        // the photograph itself. Focus, invalid and disabled still set their
        // own edge (base recipe).
        secondary: [
          'border-current bg-action-secondary text-action-secondary-fg',
          // With a well: a dark well (the label colour) and a light glyph at
          // rest; hovered, a dark button with a light label, its edge still
          // the dark label colour, the well melted into it. A neutral fill in
          // the label's colour: the one fill this variant allows.
          '[--button-well:var(--action-secondary-fg)] [--button-well-ink:var(--action-secondary-bg)] [--button-well-edge:transparent]',
          // On a fill the outline is transparent over the photograph, so the
          // well is the ink and its glyph the fill's dark label colour.
          'in-data-[surface-ink]:[--button-well:var(--button-ink)] in-data-[surface-ink]:[--button-well-ink:var(--button-ink-fg)]',
          'has-[>[data-slot=button-icon]]:idle:hover:text-(--button-well-ink) has-[>[data-slot=button-icon]]:idle:hover:border-(--button-well)',
          'has-[>[data-slot=button-icon]]:idle:active:text-(--button-well-ink) has-[>[data-slot=button-icon]]:idle:active:border-(--button-well)',
          'has-[>[data-slot=button-icon]]:idle:focus-visible:text-(--button-well-ink)',
          'in-data-[surface-ink]:bg-transparent in-data-[surface-ink]:text-(--button-ink)',
        ],
        // A link-only button (decided 2026-09-27): brand text, no fill, no
        // edge, no lift, underlined on hover the way a quiet Link is (2px, 2px
        // offset). It keeps the button's box (height, padding, touch target,
        // focus ring) so it still lines up in a row of buttons. It is still a
        // button: it DOES something ("Add another", "Cancel"). If it goes
        // somewhere, use Link. The square `icon-*` sizes cannot show an
        // underline, so they keep the ghost fill (see compoundVariants).
        // On a fill: ink text, the same underline.
        tertiary: [
          'text-action-tertiary-fg decoration-2 underline-offset-2',
          'idle:hover:underline idle:hover:translate-y-0',
          'in-data-[surface-ink]:text-(--button-ink)',
        ],
        danger: [
          'bg-action-danger text-action-danger-fg',
          // With a well: as primary, in the danger pair.
          '[--button-well:var(--action-danger-fg)] [--button-well-ink:var(--action-danger-bg)] [--button-well-edge:var(--button-well-ink)]',
          'has-[>[data-slot=button-icon]]:idle:hover:text-(--button-well-ink) has-[>[data-slot=button-icon]]:idle:hover:border-(--button-well-ink)',
          'has-[>[data-slot=button-icon]]:idle:active:text-(--button-well-ink) has-[>[data-slot=button-icon]]:idle:active:border-(--button-well-ink)',
          'has-[>[data-slot=button-icon]]:idle:focus-visible:text-(--button-well-ink)',
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
        //
        // With an icon well (`has-[>[data-slot=button-icon]]`) the well is
        // out of the flow (ButtonIcon), 4px from an edge, and the label's
        // padding makes room for it on that side: the inset, the well and a
        // gap (sm 0.25 + 1.5 + 0.375 = 2.125rem, md 0.25 + 2 + 0.5 = 2.75rem,
        // lg 0.25 + 2.5 + 0.5 = 3.25rem), and the size's usual padding on
        // the other. THE GLIDE: at rest the well is at the START and the
        // label after it; hovered or keyboard-focused, the well travels to
        // the END and the two paddings swap in the same 250ms, so the label
        // slides over as the well passes and the button's width never
        // changes. Under reduced motion there is no glide: the well sits at
        // the end, still.
        sm: [
          'min-h-control-sm min-w-control-sm gap-1.5 px-3 py-1 text-sm leading-snug has-[>svg]:px-2.5',
          'has-[>[data-slot=button-icon]]:ps-3 has-[>[data-slot=button-icon]]:pe-[2.125rem]',
          'motion-safe:has-[>[data-slot=button-icon]]:ps-[2.125rem] motion-safe:has-[>[data-slot=button-icon]]:pe-3',
          'motion-safe:idle:hover:has-[>[data-slot=button-icon]]:ps-3 motion-safe:idle:hover:has-[>[data-slot=button-icon]]:pe-[2.125rem]',
          'motion-safe:idle:focus-visible:has-[>[data-slot=button-icon]]:ps-3 motion-safe:idle:focus-visible:has-[>[data-slot=button-icon]]:pe-[2.125rem]',
        ],
        md: [
          'min-h-control-md min-w-control-md px-4 py-2 text-base leading-snug has-[>svg]:px-3',
          'has-[>[data-slot=button-icon]]:ps-4 has-[>[data-slot=button-icon]]:pe-[2.75rem]',
          'motion-safe:has-[>[data-slot=button-icon]]:ps-[2.75rem] motion-safe:has-[>[data-slot=button-icon]]:pe-4',
          'motion-safe:idle:hover:has-[>[data-slot=button-icon]]:ps-4 motion-safe:idle:hover:has-[>[data-slot=button-icon]]:pe-[2.75rem]',
          'motion-safe:idle:focus-visible:has-[>[data-slot=button-icon]]:ps-4 motion-safe:idle:focus-visible:has-[>[data-slot=button-icon]]:pe-[2.75rem]',
        ],
        lg: [
          'min-h-control-lg min-w-control-lg px-6 py-2.5 text-md leading-snug has-[>svg]:px-4',
          'has-[>[data-slot=button-icon]]:ps-6 has-[>[data-slot=button-icon]]:pe-[3.25rem]',
          'motion-safe:has-[>[data-slot=button-icon]]:ps-[3.25rem] motion-safe:has-[>[data-slot=button-icon]]:pe-6',
          'motion-safe:idle:hover:has-[>[data-slot=button-icon]]:ps-6 motion-safe:idle:hover:has-[>[data-slot=button-icon]]:pe-[3.25rem]',
          'motion-safe:idle:focus-visible:has-[>[data-slot=button-icon]]:ps-6 motion-safe:idle:focus-visible:has-[>[data-slot=button-icon]]:pe-[3.25rem]',
        ],

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
    compoundVariants: [
      {
        // An icon-only tertiary (a toolbar tool, a calendar arrow, a close ×)
        // has no text to underline, so it keeps the ghost button it was: the
        // lift, a pale fill and edge on hover, a deeper fill on press.
        variant: 'tertiary',
        size: ['icon-sm', 'icon-md', 'icon-lg'],
        className: [
          'idle:hover:no-underline idle:hover:-translate-y-0.5',
          'idle:hover:bg-action-tertiary-hover idle:hover:border-action-tertiary-border-hover',
          'idle:active:bg-action-tertiary-active',
          'in-data-[surface-ink]:idle:hover:bg-(--button-wash-hover) in-data-[surface-ink]:idle:hover:border-transparent',
          'in-data-[surface-ink]:idle:active:bg-(--button-wash-active)',
        ],
      },
    ],
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

/* What a ButtonIcon needs from the button it sits in: whether to draw the
 * loader instead of its glyph, and which size to take. A context rather than
 * cloned props, so it also reaches a well inside an `asChild` child. */
type ButtonContextValue = { loading: boolean; size: ButtonSize; well: boolean };

/* The variants a trailing icon well belongs on: the ones with a fill or an
 * outline for it to sit in. A well on `tertiary` (a link-only action) or
 * `neutral` (a dismiss) would be the loudest thing on a quiet control, and
 * GlassButton has no fill for its glyph to take. On those, a ButtonIcon
 * renders its glyph as a plain icon child instead (decided 2026-09-27). */
const WELL_VARIANTS: ReadonlySet<string> = new Set(['primary', 'secondary', 'danger']);
const ButtonContext = React.createContext<ButtonContextValue | null>(null);

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

  // A trailing icon well is lifted out of the label, so it is drawn LAST
  // (always at the end, whatever order the children came in), stays outside
  // the loadingText swap (it would otherwise be copied into the invisible
  // width-holder and vanish), and takes the loader instead of Button drawing
  // a second one before the label. Direct children only: under `asChild` the
  // child owns its content, and the recipe's `has-[>…]` rule stands in.
  const takesWell = variant != null && WELL_VARIANTS.has(variant);
  let label: React.ReactNode = children;
  let wells: React.ReactElement[] = [];
  if (!asChild && takesWell) {
    const parts = React.Children.toArray(children);
    wells = parts.filter(
      (child): child is React.ReactElement => React.isValidElement(child) && child.type === ButtonIcon,
    );
    if (wells.length > 0) label = parts.filter((child) => !wells.includes(child as React.ReactElement));
  }
  const hasWell = wells.length > 0;
  const context = React.useMemo(
    () => ({ loading, size: (size ?? 'md') as ButtonSize, well: takesWell }),
    [loading, size, takesWell],
  );

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
    <ButtonContext.Provider value={context}>
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
        {loading && !hasWell ? <Spinner label={null} kind={spinnerKind} /> : null}
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
                {label}
              </span>
              <span className="col-start-1 row-start-1">{loadingText}</span>
            </span>
          ) : (
            // `?? null`: React 16 throws on a component that returns
            // undefined, which is what Slottable returns for a childless button.
            (label ?? null)
          )}
        </Slottable>
        {hasWell ? wells : null}
      </Comp>
    </ButtonContext.Provider>
  );
});
Button.displayName = 'Button';

/* ---------------------------------------------------------------------------
 * ButtonIcon
 *
 * The trailing icon well: a glyph in a square set into the button's end edge,
 * the IconButton's shape inside the Button. It is NOT an IconButton, and must
 * never become one: a button inside a button is invalid HTML, gives a
 * keyboard two tab stops for one action, and gives a pointer two hover
 * states that fight. This is a `<span>`, hidden from assistive technology
 * (the label is the name), with no pointer events of its own. Hover, focus,
 * press and loading all belong to the one button around it.
 *
 * Variants: `primary`, `secondary` and `danger` only. On `tertiary`,
 * `neutral` and GlassButton the well is not drawn: the glyph renders as a
 * plain icon child, exactly as if it had been passed without the ButtonIcon.
 *
 * Colour: the well is the button's resting LABEL colour and the glyph its
 * resting FILL colour, so on `primary` and `danger` it is a white well with
 * a coloured glyph, and on `secondary` a dark well with a light glyph. They
 * do not change on hover: the BUTTON does. Hovered or keyboard-focused it
 * inverts to the well's own pair (fill = the well's colour, label = the
 * glyph's), so the well melts into it and only the glyph is left at the end
 * edge. It follows the surface-ink contract with no props.
 *
 * Motion (decided 2026-09-27): at rest the well sits at the START of the
 * button and the label after it. Hovered, or focused from the keyboard, the
 * well glides to the END and the label slides over to where the well was,
 * in 250ms (ease-out), and back when the pointer leaves. The button keeps its width.
 * It is logical, so it runs right-to-left in RTL. Under reduced motion there
 * is no glide: the well sits at the end, still. A busy button keeps the well
 * where it is (the loader is inside it); a disabled one never hovers.
 *
 * Loading: the well swaps its glyph for the loader, and the button does not
 * draw a second one before the label.
 *
 * Place it last among the children. In a button wider than its content
 * (`className="w-full"`) the well travels the full width, edge to edge, and
 * the label stays centred between the paddings. Text sizes only: a square `icon-*` button has no
 * room for a well. A directional glyph (an arrow) is not mirrored for you in
 * RTL; pass one that is (Phosphor's `mirrored`).
 *
 *   <Button>Apply now<ButtonIcon><ArrowRight /></ButtonIcon></Button>
 * ------------------------------------------------------------------------- */

export const buttonIconVariants = cva(
  [
    // A layer over the whole button, UNDER its label (the button isolates),
    // holding the two moving parts. Nothing in it takes the pointer.
    'pointer-events-none absolute inset-0 z-[-1]',
  ],
  {
    variants: {
      // `--well`: the square's side, the control height minus the 4px inset
      // on both sides. Every position below is computed from it.
      size: {
        sm: '[--well:1.5rem]',
        md: '[--well:var(--size-control-sm)]',
        lg: '[--well:var(--size-control-md)]',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

/* The two moving parts. Every place each one can be is written in the SAME
 * properties (the four insets, radius, shadow), so every change between them
 * is one continuous transition.
 *
 *   rest (motion allowed)   the square at the START, 4px in, centred
 *   rest (reduced motion)   the square at the END, still
 *   open (`well-open:`)     the fill covers the button, 4px edge in
 *                           `--button-well-edge` (1px border + 3px inset);
 *                           the glyph sits in the last square at the END
 *
 * `well-open:` (theme.css) is the button hovered or keyboard-focused and not
 * busy or disabled. Under reduced motion the change is instant. */
const WELL_TIMING =
  'duration-[var(--motion-duration-normal)] ease-[var(--motion-easing-productive-entrance)] motion-reduce:transition-none [[data-loading]_&]:transition-none';
const SQUARE_Y = 'top-[calc(50%-var(--well)/2)] bottom-[calc(50%-var(--well)/2)]';
const AT_END = 'start-[calc(100%-0.25rem-var(--well))]';

const wellFillClass = cn(
  'absolute bg-(--button-well)',
  SQUARE_Y,
  // Its two edges: at rest a square (the end edge 100% minus the square
  // back from the far side), open the full box.
  'start-[calc(100%-0.25rem-var(--well))] end-1',
  'motion-safe:start-1 motion-safe:end-[calc(100%-0.25rem-var(--well))]',
  'well-open:top-0 well-open:bottom-0 well-open:start-0 well-open:end-0',
  // One step down the radius ladder from the button's at rest (concentric at
  // the 4px inset); open, the button's own inner radius.
  'rounded-sm well-open:rounded-[calc(var(--radius-md)-var(--border-hair))]',
  'shadow-[inset_0_0_0_0_var(--button-well-edge)]',
  'well-open:shadow-[inset_0_0_0_calc(var(--border-thick)*2-var(--border-hair))_var(--button-well-edge)]',
  'transition-[top,bottom,inset-inline-start,inset-inline-end,border-radius,box-shadow,background-color]',
  WELL_TIMING,
);

/* The glyph never travels ACROSS the label (a single glyph gliding from the
 * start to the end crossed the text mid-way). There are two copies instead,
 * each half of the move: the one in the square at the start fades out
 * early while the fill grows; the one
 * at the end slides in from 8px back and fades in during the second half. It
 * reads as the icon moving to the end. Leaving, the same in reverse. (The
 * start copy fades in place, faster: see wellGlyphOutClass.) Each
 * copy's delay is set on the state it is moving TO, which is how a transition
 * picks its delay. Under reduced motion only the end copy exists, still. */
const HALF = 'duration-[calc(var(--motion-duration-normal)/2)]';
const AFTER_HALF = 'delay-[calc(var(--motion-duration-normal)/2)]';
const GLYPH = cn(
  'absolute inline-flex w-(--well) items-center justify-center text-(--button-well-ink)',
  SQUARE_Y,
  'transition-[opacity,translate] ease-[var(--motion-easing-productive-entrance)] motion-reduce:transition-none [[data-loading]_&]:transition-none',
  HALF,
);

const wellGlyphOutClass = cn(
  GLYPH,
  'start-1',
  // At rest: shown, and it comes back only once the fill has shrunk.
  'opacity-100 motion-reduce:opacity-0',
  AFTER_HALF,
  // Open: a fade in place, in the first THIRD. On the ease-out the label
  // slides most of its way toward this square early, so a slower fade (or a
  // forward slide) left the arrow on top of the label's first letter.
  'well-open:opacity-0 well-open:delay-0 well-open:duration-[calc(var(--motion-duration-normal)/3)]',
);

const wellGlyphInClass = cn(
  GLYPH,
  AT_END,
  // At rest: hidden 8px back, leaving straight away. Reduced motion: shown.
  'opacity-0 -translate-x-2 rtl:translate-x-2 delay-0',
  'motion-reduce:opacity-100 motion-reduce:translate-x-0',
  // Open: arrives in the second half.
  'well-open:opacity-100 well-open:translate-x-0',
  `well-open:${AFTER_HALF}`,
);

export type ButtonIconProps = React.ComponentPropsWithoutRef<'span'>;

const WELL_SIZE: Partial<Record<ButtonSize, 'sm' | 'md' | 'lg'>> = { sm: 'sm', md: 'md', lg: 'lg' };

export const ButtonIcon = React.forwardRef<HTMLSpanElement, ButtonIconProps>(function ButtonIcon(
  { className, children, ...props },
  ref,
) {
  const button = React.useContext(ButtonContext);
  // A variant with no well: the glyph is just an icon child of the button,
  // sized and spaced by Button's own `[&_svg]` and `has-[>svg]` rules.
  if (button && !button.well) return <>{children ?? null}</>;
  const size = button ? (WELL_SIZE[button.size] ?? 'md') : 'md';
  const loading = button?.loading ?? false;
  const glyph = loading ? <Spinner label={null} kind={size === 'sm' ? 'dots' : 'monogram'} /> : (children ?? null);
  return (
    <span
      ref={ref}
      data-slot="button-icon"
      data-size={size}
      aria-hidden="true"
      className={cn(buttonIconVariants({ size }), className)}
      {...props}
    >
      <span data-part="fill" className={wellFillClass} />
      <span data-part="glyph" data-at="start" className={wellGlyphOutClass}>
        {glyph}
      </span>
      <span data-part="glyph" data-at="end" className={wellGlyphInClass}>
        {glyph}
      </span>
    </span>
  );
});
ButtonIcon.displayName = 'ButtonIcon';
