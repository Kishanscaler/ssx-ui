import * as React from 'react';

/* ---------------------------------------------------------------------------
 * Internal glyphs for the batch C field atoms (Select, PhoneInput).
 *
 * Paths are Phosphor 2.1.1 (`chevron-down` regular and fill, `chevron-up`, `check` bold), the
 * same family consumers use through `@phosphor-icons/react`. Policy: the
 * package ships no icon pack and imports no icon library; a glyph an atom
 * needs for itself is a tiny inline SVG like these.
 *
 * Filled paths (`fill="currentColor"`), never stroke. Decorative: aria-hidden.
 * No size class: the parent sizes them with `[&_svg:not([class*='size-'])]`.
 * Not exported from the package.
 * ------------------------------------------------------------------------- */

type GlyphProps = React.SVGProps<SVGSVGElement>;

function glyph(d: string, displayName: string) {
  const Glyph = (props: GlyphProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={d} />
    </svg>
  );
  Glyph.displayName = displayName;
  return Glyph;
}

export const ChevronDownGlyph = glyph(
  'M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z',
  'ChevronDownGlyph',
);

/** The Select trigger's indicator: a solid caret, as the preview draws it. */
export const ChevronDownFillGlyph = glyph(
  'M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,48,88H208a8,8,0,0,1,5.66,13.66Z',
  'ChevronDownFillGlyph',
);

export const ChevronUpGlyph = glyph(
  'M213.66,165.66a8,8,0,0,1-11.32,0L128,91.31,53.66,165.66a8,8,0,0,1-11.32-11.32l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,213.66,165.66Z',
  'ChevronUpGlyph',
);

export const CheckGlyph = glyph(
  'M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z',
  'CheckGlyph',
);
