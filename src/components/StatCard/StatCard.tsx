import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Figure, type FigureSize, type FigureTone } from '../Figure';
import { LogoTile } from '../LogoTile';
import type { MarketingLogo } from '../MarketingCard/fields';
import { MarketingEyebrow } from '../MarketingCard/parts';
import { Text } from '../Text';

/* ---------------------------------------------------------------------------
 * StatCard (marketing)
 *
 * One figure and what it counts: "₹1Cr+ / annual recurring revenue". The SSB
 * page's figures, one component: the Innovation Lab's three ($1B+ in the
 * accent, a label under each), the internship's grey boxes (an eyebrow, the
 * figure, a caption), Placements' strip of four (Apple's camera spec row) and
 * its figures on a plate over a photo, and the Why breaker's spec figures (a
 * hairline, the figure, its line, then its source's logo).
 *
 *   <StatGroup columns={3}>
 *     <StatCard value="$1B+" label="raised by the lab's mentors" tone="brand" />
 *     …
 *
 * The parts, in this order, top to bottom: eyebrow · figure · label ·
 * description · source. EVERY OPTIONAL SLOT OMITTED IS A VARIANT: no eyebrow,
 * no kicker; no description, no line; no source, no source row.
 *
 * FIGURES LEVEL. The card is a grid of five rows, one per part (eyebrow,
 * figure, label, description, source; a part left out leaves its row empty,
 * 0 tall), the last row taking any spare height with the source at its foot.
 * In a StatGroup the cards share those rows (CSS subgrid), so every figure in
 * a row of cards sits on one line whatever the eyebrows' and labels' lengths,
 * and the sources sit level at the foot. Where subgrid is not supported the
 * card keeps its own rows: the figures line up when the eyebrows take the
 * same lines, and the source still finds the foot.
 *
 * Three shapes (`variant`), one decision each:
 *   - `plain` the figure over its label (the lab's, the plate's);
 *   - `ruled` a hairline over it (the breaker's figures; the strip);
 *   - `boxed` on the sunken surface with the card's 20px padding (the
 *     internship's boxes). On a photo or a plate (inside
 *     `data-surface-ink="on-image"`) a box has no fill and no padding: the
 *     plate is the box.
 *
 * The value is a `Figure` (units a step down; one text node run, so it copies
 * and reads as written); `size` and `tone` go straight to it. The label is
 * `Text size="sm" tone="secondary"`, so on a photo it takes the on-image
 * secondary ink by itself (the surface-ink contract); nothing here re-points
 * it.
 *
 * In a `dl` (StatGroup `as="dl"` sets `definition`), the eyebrow and label are
 * the terms (`dt`) and the figure, description and source the definitions
 * (`dd`): HTML wants terms first, so they come first in the source; each part
 * is placed in its row, so the visual order is the same.
 *
 * MARKERS, NOT MOTION. `data-slot="stat-card"` (`data-variant`, `data-size`,
 * `data-tone`) on the root; parts `stat-card-eyebrow` (`data-part="eyebrow"`),
 * `stat-card-value` (the Figure, `data-part="figure"`), `stat-card-label`
 * (`subline`), `stat-card-description` (`description`), `stat-card-source`
 * (`logos`). A count-up or a reel is the page's motion, bound to these.
 *
 * Server component: no hooks, no handlers. React 16 safe.
 * ------------------------------------------------------------------------- */

/** `plain` figure over label · `ruled` a hairline on top · `boxed` on the sunken surface. */
export type StatCardVariant = 'plain' | 'ruled' | 'boxed';
/** The figure's size (`Figure`): `sm` h2 · `md` h1 · `lg` billboard-sm. */
export type StatCardSize = FigureSize;
/** `default` the page's ink · `brand` the accent. */
export type StatCardTone = FigureTone;
/** The root element. */
export type StatCardElement = 'div' | 'li' | 'article';

// Five rows, one per part; the last takes the spare height (the source at the
// foot). `gap-y-0` explicitly, so as a subgrid it does not take its group's
// row gap between its own rows. Class names are written out whole (never
// built from a constant) so Tailwind's scanner finds them.
export const statCardVariants = cva('grid min-w-0 grid-rows-[repeat(4,auto)_1fr] gap-y-0 font-sans', {
  variants: {
    variant: {
      plain: '',
      ruled: [
        'border-t border-border-decorative pt-4',
        'in-data-[surface-ink=on-image]:border-glass-on-image-hover',
      ],
      // Off a photo only: on one, the plate (or the photo) is the box.
      boxed: [
        'rounded-lg',
        'not-in-data-[surface-ink=on-image]:bg-surface-sunken',
        'not-in-data-[surface-ink=on-image]:p-5',
      ],
    },
  },
  defaultVariants: { variant: 'plain' },
});

/** The gap from the figure down to its label, by size. */
const LABEL_GAP: Record<StatCardSize, string> = {
  sm: 'mt-1',
  md: 'mt-1',
  lg: 'mt-2',
};

export interface StatCardProps extends React.HTMLAttributes<HTMLElement> {
  /** The figure as written, units and all: "₹1Cr+", "200K", "60%", "3–6 months". */
  value: string;
  /** What it counts, one short line under the figure. */
  label: string;
  /** A kicker over the figure ("Internship placement"), in the brand ink. Omit it for none. */
  eyebrow?: string;
  /** A longer line under the label (the breaker's figures). Omit it for none. */
  description?: string;
  /**
   * Where the figure comes from, as words ("Forbes", "PwC India, 2025"). With
   * a `sourceLogo` of the same name only the logo shows (the name is its alt
   * text); a different one is set beside it.
   */
  source?: string;
  /** The source's mark, on a small white tile. */
  sourceLogo?: MarketingLogo;
  /** A note on the source, at the caption size ("survey of 1,200 managers"). */
  sourceNote?: string;
  /**
   * `plain` figure over label · `ruled` a hairline on top · `boxed` on the
   * sunken surface with padding (no fill on a photo or a plate).
   *
   * @default 'plain'
   */
  variant?: StatCardVariant;
  /**
   * The figure's size: `sm` h2 (a card's) · `md` h1 (a row of three or four)
   * · `lg` billboard-sm (two spec figures). Scales the type only.
   *
   * @default 'md'
   */
  size?: StatCardSize;
  /**
   * `default` the page's ink (white on a photo) · `brand` the figure in the
   * accent green.
   *
   * @default 'default'
   */
  tone?: StatCardTone;
  /**
   * The root element. `li` in a `ul` (StatGroup `as="ul"` sets it on its
   * cards).
   *
   * @default 'div'
   */
  as?: StatCardElement;
  /**
   * Mark the stat up as a term and its definition, for a card inside a `dl`:
   * the root is a `div`, the eyebrow and label `dt`, the figure, description
   * and source `dd`. StatGroup `as="dl"` sets it; set it yourself only in a
   * `dl` of your own.
   *
   * @default false
   */
  definition?: boolean;
}

/**
 * One part: inside a `dl` it is wrapped in its `dt`/`dd`, which takes the
 * part's layout classes (its row, its margin); otherwise the part takes them
 * itself.
 */
function Part({
  term,
  className,
  children,
}: {
  term: 'dt' | 'dd' | null;
  className: string;
  children: React.ReactElement<{ className?: string }>;
}) {
  if (term) return React.createElement(term, { className: cn('m-0 min-w-0', className) }, children);
  return React.cloneElement(children, { className: cn(children.props.className, className) });
}

export const StatCard = React.forwardRef<HTMLElement, StatCardProps>(function StatCard(
  {
    className,
    value,
    label,
    eyebrow,
    description,
    source,
    sourceLogo,
    sourceNote,
    variant = 'plain',
    size = 'md',
    tone = 'default',
    as = 'div',
    definition = false,
    ...props
  },
  ref,
) {
  const dt = definition ? 'dt' : null;
  const dd = definition ? 'dd' : null;
  const sourceText = source && (!sourceLogo || source !== sourceLogo.name) ? source : undefined;
  const hasSource = Boolean(sourceLogo || sourceText || sourceNote);

  // The family's eyebrow (SectionHeader's): the brand ink, the on-image ink on a photo.
  const eyebrowPart = eyebrow ? (
    <Part term={dt} className="row-start-1 mb-2">
      <MarketingEyebrow data-slot="stat-card-eyebrow">{eyebrow}</MarketingEyebrow>
    </Part>
  ) : null;

  const figurePart = (
    <Figure
      value={value}
      size={size}
      tone={tone}
      as={definition ? 'dd' : 'p'}
      data-slot="stat-card-value"
      className="row-start-2 m-0"
    />
  );

  // In a `dl` the label (a term) comes before the figure in the source; its
  // row keeps it under the figure on screen.
  const labelPart = (
    <Part term={dt} className={cn('row-start-3', LABEL_GAP[size] ?? LABEL_GAP.md)}>
      <Text as="p" size="sm" tone="secondary" data-slot="stat-card-label" data-part="subline" className="text-balance">
        {label}
      </Text>
    </Part>
  );

  const descriptionPart = description ? (
    <Part term={dd} className="row-start-4 mt-3">
      <Text as="p" size="sm" data-slot="stat-card-description" data-part="description">
        {description}
      </Text>
    </Part>
  ) : null;

  const sourcePart = hasSource ? (
    // At the foot of the last row, so the logos sit level across a group.
    <Part term={dd} className="row-start-5 self-end pt-4">
      <div data-slot="stat-card-source" data-part="logos" className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        {sourceLogo ? (
          <LogoTile logo={sourceLogo} fill="white" shape="wide" size="sm" className="w-20 shrink-0" />
        ) : null}
        {sourceText ? (
          <Text as="span" size="sm" className="font-medium">
            {sourceText}
          </Text>
        ) : null}
        {sourceNote ? (
          <Text as="span" size="xs" tone="secondary">
            {sourceNote}
          </Text>
        ) : null}
      </div>
    </Part>
  ) : null;

  return React.createElement(
    definition ? 'div' : as,
    {
      ref,
      'data-slot': 'stat-card',
      'data-variant': variant,
      'data-size': size,
      'data-tone': tone,
      className: cn(statCardVariants({ variant }), className),
      ...props,
    },
    eyebrowPart,
    // Terms before definitions in a `dl`; otherwise the reading order.
    definition ? labelPart : figurePart,
    definition ? figurePart : labelPart,
    descriptionPart,
    sourcePart,
  );
});
StatCard.displayName = 'StatCard';
