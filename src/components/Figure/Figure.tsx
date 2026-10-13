import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Figure (marketing)
 *
 * A figure as a marketing page sets it: "₹1Cr+", "200K", "60%", the digits
 * carrying it and the unit glyphs (currency, %, +, ×, L, Cr, K, M and any
 * other letters) a step down in the secondary ink. A leading currency sits at
 * the top of the digits, as a price does.
 *
 *   <Figure value="₹50L" size="lg" />
 *
 * One value, one element: the units are spans INSIDE it, so the figure copies
 * as written and a screen reader reads "₹50L", never "₹", "50", "L". No
 * `aria-label`, no visually hidden duplicate.
 *
 * Tabular figures, so a column of figures lines up and a figure that changes
 * does not shift. The size is a type role (`sm` h2 · `md` h1 · `lg`
 * billboard-sm), the units one role down (`sm` body · `md` h3 · `lg` h1).
 * `brand` tone sets it in the accent (`--ssx-content-accent`, the README's
 * token request `content.accent`, falling back to `--content-brand`), units
 * included: grey units under a coloured figure read as two figures.
 *
 * On a photo (inside `data-surface-ink="on-image"`: a GlassPlate, a scrimmed
 * PhotoFrame) the default tone inks itself white, units in the on-image
 * secondary ink. Markers: `data-slot="figure"`, `data-part="figure"` on the
 * root (motion binds the figure's entrance to it), `figure-unit` on units.
 * Server component.
 * ------------------------------------------------------------------------- */

/** The figure's type role: `sm` h2 · `md` h1 · `lg` billboard-sm. */
export type FigureSize = 'sm' | 'md' | 'lg';
/** `default` the page's ink · `brand` the accent. */
export type FigureTone = 'default' | 'brand';
/** The element a Figure renders as. */
export type FigureElement = 'p' | 'span' | 'div' | 'dd' | 'dt' | 'strong';

export const figureVariants = cva('font-sans tabular-nums', {
  variants: {
    size: {
      sm: 'type-h2',
      md: 'type-h1',
      lg: 'type-billboard-sm',
    },
    tone: {
      default: 'text-content in-data-[surface-ink=on-image]:text-on-image-ink',
      brand: 'text-(color:--ssx-content-accent,var(--content-brand))',
    },
  },
  defaultVariants: { size: 'md', tone: 'default' },
});

const UNIT_SIZE: Record<FigureSize, string> = {
  sm: 'text-(length:--type-body-size)',
  md: 'text-(length:--type-h3-size)',
  lg: 'text-(length:--type-h1-size)',
};

const UNIT_INK: Record<FigureTone, string> = {
  default: 'text-content-secondary in-data-[surface-ink=on-image]:text-on-image-ink-secondary',
  brand: '',
};

/** One run of a figure: digits (with their separators), or unit glyphs. */
export interface FigurePart {
  text: string;
  /** A unit run (currency, %, +, ×, letters), set a step down. */
  unit: boolean;
  /** A unit before the first digit (a currency), set at the digits' top. */
  lead: boolean;
}

const DIGITS = /\d(?:[\d.,]*\d)?/;

/**
 * Splits a figure into digit runs and unit runs: "₹1Cr+" → ₹ · 1 · Cr+,
 * "12,000+" → 12,000 · +. Whitespace on its own stays plain text. A value
 * with no digits is one plain run.
 */
export function splitFigure(value: string): FigurePart[] {
  const parts: FigurePart[] = [];
  let at = 0;
  let seenDigit = false;
  const push = (text: string, digit: boolean) => {
    if (!text) return;
    const unit = !digit && /\S/.test(text);
    parts.push({ text, unit, lead: unit && !seenDigit });
    if (digit) seenDigit = true;
  };
  // `exec`, not `matchAll`: an ES2019 runtime (the legacy consumer) has no matchAll.
  const digits = new RegExp(DIGITS.source, 'g');
  for (let m = digits.exec(value); m; m = digits.exec(value)) {
    push(value.slice(at, m.index), false);
    push(m[0], true);
    at = m.index + m[0].length;
  }
  if (!seenDigit) return value ? [{ text: value, unit: false, lead: false }] : [];
  push(value.slice(at), false);
  return parts;
}

export interface FigureProps extends React.HTMLAttributes<HTMLElement> {
  /** The figure as written, units and all: "₹1Cr+", "200K", "60%", "3×". */
  value: string;
  /**
   * Set the unit glyphs a step down in the secondary ink. Off, the value is
   * set as one run.
   *
   * @default true
   */
  units?: boolean;
  /**
   * The type role: `sm` h2 (a card's figure) · `md` h1 · `lg` billboard-sm (a
   * section's headline figure).
   *
   * @default 'md'
   */
  size?: FigureSize;
  /**
   * `default` the page's ink (white on a photo) · `brand` the accent green.
   *
   * @default 'default'
   */
  tone?: FigureTone;
  /**
   * The element. `dd` inside a `dl` of figures and their labels.
   *
   * @default 'p'
   */
  as?: FigureElement;
}

export const Figure = React.forwardRef<HTMLElement, FigureProps>(function Figure(
  { className, value, units = true, size = 'md', tone = 'default', as = 'p', children, ...props },
  ref,
) {
  const parts = units ? splitFigure(value) : [{ text: value, unit: false, lead: false }];
  return React.createElement(
    as,
    {
      ref,
      'data-slot': 'figure',
      'data-part': 'figure',
      'data-size': size,
      'data-tone': tone,
      className: cn(figureVariants({ size, tone }), className),
      ...props,
    },
    parts.map((part, i) =>
      part.unit ? (
        <span
          key={i}
          data-slot="figure-unit"
          data-lead={part.lead || undefined}
          className={cn(
            'tracking-normal',
            UNIT_SIZE[size] ?? UNIT_SIZE.md,
            UNIT_INK[tone] ?? UNIT_INK.default,
            part.lead && 'align-text-top',
          )}
        >
          {part.text}
        </span>
      ) : (
        <React.Fragment key={i}>{part.text}</React.Fragment>
      ),
    ),
    children,
  );
});
Figure.displayName = 'Figure';
