import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import type { MarketingLogo } from '../MarketingCard/fields';

/* ---------------------------------------------------------------------------
 * LogoTile (marketing, INTERNAL)
 *
 * An internal part of the marketing entry, not exported from
 * `@kishanscaler/ssx-ui/marketing`: a building block, not a thing an editor
 * places. Composed by PersonCard and MediaCard (`logos`), StatCard (its
 * source's logo) and ProfilePlate (so Breaker). No Storybook page of its
 * own: it is seen in theirs.
 *
 * A company's mark on a tile: who a speaker works for, who hires, who backs a
 * venture. The logo is a CMS field (`MarketingLogo`: name, file, the brand's
 * colour, whether its mark is multi-colour), and the tile draws it three ways:
 *
 *   - `white` the mark in its own colours on a white ground: the ground stays
 *     white in both themes (`--on-image-ink`, the fixed white), because a
 *     logo's colours are drawn for white. On a page surface it carries the
 *     decorative hairline (a white tile on a white card), on a photo none.
 *   - `brand` the brand's own colour as the ground (`logo.color`, set inline
 *     as `--ssx-logo-tile-fill`: a company's colour is content, not a token)
 *     and the mark flattened to white on it, as the brand presents itself
 *     (Zomato on red). `native` keeps the mark's own colours (a file already
 *     drawn for that ground). No colour: the fixed dark plate.
 *   - `glass` the on-image glass, frosted, for a tile laid on a photo; the
 *     mark white unless `native`.
 *
 * THE FLATTEN (`brand`, `glass`, not `native`) is
 * `grayscale(1) invert(1) brightness(1.8)`: the mark's colour goes white and
 * its WHITE details go dark, so a pin, a counter or a cut-out "C" stays a
 * shape instead of melting into a solid blob (`brightness(0) invert(1)`, the
 * usual one-liner, turns every pixel white). Filters apply in the order they
 * are written, and Tailwind's filter utilities always compose in a fixed
 * order (brightness before grayscale and invert), so it cannot be said with
 * utilities: it is a rule in `src/styles/batches/marketing.css` (the LogoTile
 * block), keyed on the tile's `data-fill` and `data-native`. A light or
 * yellow mark comes out dark by the same rule: a file already drawn for the
 * ground (a white wordmark) is `native`.
 *
 * With no file the name is set as a wordmark. The mark is contained in the
 * tile's inset, so a tall badge never runs out of it.
 *
 * Width comes from the cell (a row of tiles is the card's, which marks it
 * `data-part="logos"`); `shape` sets the height from it: `wide` for wordmarks,
 * `square` for marks. `size` scales the inset and the wordmark only.
 * Corners `radius-md`, as a tag or a badge. Server component.
 * ------------------------------------------------------------------------- */

/** `white` own colours on white · `brand` white mark on the brand's colour · `glass` on a photo. */
export type LogoTileFill = 'white' | 'brand' | 'glass';
/** `wide` for a wordmark · `square` for a mark. */
export type LogoTileShape = 'wide' | 'square';
/** The inset and the wordmark's size. */
export type LogoTileSize = 'sm' | 'md';

export const logoTileVariants = cva(
  ['relative flex w-full min-w-0 items-center justify-center overflow-hidden rounded-md font-sans'],
  {
    variants: {
      fill: {
        // On a page surface the white tile takes the decorative hairline, so it
        // reads on a white card (every card that lays one there: PersonCard,
        // MediaCard, StatCard); on a photo the photo is its edge.
        white: [
          'border border-border-decorative bg-on-image-ink text-on-image-action-fg',
          'in-data-[surface-ink=on-image]:border-transparent',
        ],
        brand: 'bg-(--ssx-logo-tile-fill,var(--ssx-surface-fixed-dark,var(--surface-inverse))) text-on-image-ink',
        glass: [
          'border border-glass-on-image-hover bg-glass-on-image text-on-image-ink',
          'backdrop-blur-glass backdrop-saturate-(--glass-saturate)',
        ],
      },
      shape: {
        // The widest ratio a wordmark sits in without shrinking to a line.
        wide: 'aspect-cinema',
        square: 'aspect-square',
      },
      // The wordmark (no file) is set in a type role: the label's at `sm`, the
      // card title's at `md`.
      size: {
        sm: 'px-2.5 py-1.5 type-label',
        md: 'px-4 py-2 type-h3',
      },
    },
    defaultVariants: { fill: 'white', shape: 'wide', size: 'md' },
  },
);

export interface LogoTileProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The company: its name (the alt text, or the wordmark), its file, its colour, whether its mark is multi-colour. */
  logo: MarketingLogo;
  /**
   * `white` the mark in its own colours on white · `brand` the mark white on
   * the brand's colour (`logo.color`) · `glass` on a photo, frosted.
   *
   * @default 'white'
   */
  fill?: LogoTileFill;
  /**
   * The tile's proportion; the width is the cell's. `wide` for a wordmark,
   * `square` for a mark.
   *
   * @default 'wide'
   */
  shape?: LogoTileShape;
  /**
   * The inset round the mark and the wordmark's size. `sm` in a card's foot
   * on a phone.
   *
   * @default 'md'
   */
  size?: LogoTileSize;
}

export const LogoTile = React.forwardRef<HTMLSpanElement, LogoTileProps>(function LogoTile(
  { className, style, logo, fill = 'white', shape = 'wide', size = 'md', ...props },
  ref,
) {
  // Flattened to white wherever the ground is a colour or a photo, unless the
  // mark is multi-colour (or its file is already drawn for that ground): the
  // filter is the marketing batch's rule on `data-fill` and `data-native`.
  const tileStyle =
    fill === 'brand' && logo.color
      ? ({ '--ssx-logo-tile-fill': logo.color, ...style } as React.CSSProperties)
      : style;
  return (
    <span
      ref={ref}
      data-slot="logo-tile"
      data-fill={fill}
      data-shape={shape}
      data-size={size}
      data-native={logo.native || undefined}
      className={cn(logoTileVariants({ fill, shape, size }), className)}
      style={tileStyle}
      {...props}
    >
      {logo.src ? (
        <img
          data-slot="logo-tile-mark"
          src={logo.src}
          alt={logo.name}
          loading="lazy"
          decoding="async"
          className="block size-full min-h-0 object-contain"
        />
      ) : (
        <span data-slot="logo-tile-wordmark" className="truncate">
          {logo.name}
        </span>
      )}
    </span>
  );
});
LogoTile.displayName = 'LogoTile';
