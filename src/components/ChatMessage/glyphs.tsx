import * as React from 'react';

/* ---------------------------------------------------------------------------
 * Chat glyphs (internal, never exported from the package). Phosphor 2.1.1
 * (MIT), 256 viewBox, inlined so the chat parts draw their defaults without
 * an icon dependency. Bold at 16px, as IconButton `sm` asks; the pressed
 * thumbs swap to the fill weight (ToggleButton's rule).
 *
 * No hooks, no handlers: safe in a Server Component.
 * ------------------------------------------------------------------------- */

type GlyphProps = React.SVGProps<SVGSVGElement>;

function glyph(d: string, name: string) {
  const Glyph = (props: GlyphProps) => (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d={d} />
    </svg>
  );
  Glyph.displayName = name;
  return Glyph;
}

export const RegenerateGlyph = glyph(
  'M244,56v48a12,12,0,0,1-12,12H184a12,12,0,1,1,0-24H201.1l-19-17.38c-.13-.12-.26-.24-.38-.37A76,76,0,1,0,127,204h1a75.53,75.53,0,0,0,52.15-20.72,12,12,0,0,1,16.49,17.45A99.45,99.45,0,0,1,128,228h-1.37A100,100,0,1,1,198.51,57.06L220,76.72V56a12,12,0,0,1,24,0Z',
  'RegenerateGlyph',
);

export const ThumbsUpGlyph = glyph(
  'M237,77.47A28,28,0,0,0,216,68H164V56a44.05,44.05,0,0,0-44-44,12,12,0,0,0-10.73,6.63L72.58,92H32a20,20,0,0,0-20,20v88a20,20,0,0,0,20,20H204a28,28,0,0,0,27.78-24.53l12-96A28,28,0,0,0,237,77.47ZM36,116H68v80H36ZM220,96.5l-12,96a4,4,0,0,1-4,3.5H92V106.83L126.82,37.2A20,20,0,0,1,140,56V80a12,12,0,0,0,12,12h64a4,4,0,0,1,4,4.5Z',
  'ThumbsUpGlyph',
);

export const ThumbsUpFillGlyph = glyph(
  'M234,80.12A24,24,0,0,0,216,72H160V56a40,40,0,0,0-40-40,8,8,0,0,0-7.16,4.42L75.06,96H32a16,16,0,0,0-16,16v88a16,16,0,0,0,16,16H204a24,24,0,0,0,23.82-21l12-96A24,24,0,0,0,234,80.12ZM32,112H72v88H32Z',
  'ThumbsUpFillGlyph',
);

export const ThumbsDownGlyph = glyph(
  'M243.78,156.53l-12-96A28,28,0,0,0,204,36H32A20,20,0,0,0,12,56v88a20,20,0,0,0,20,20H72.58l36.69,73.37A12,12,0,0,0,120,244a44.05,44.05,0,0,0,44-44V188h52a28,28,0,0,0,27.78-31.47ZM68,140H36V60H68Zm151,22.65a4,4,0,0,1-3,1.35H152a12,12,0,0,0-12,12v24a20,20,0,0,1-13.18,18.8L92,149.17V60H204a4,4,0,0,1,4,3.5l12,96A4,4,0,0,1,219,162.65Z',
  'ThumbsDownGlyph',
);

export const ThumbsDownFillGlyph = glyph(
  'M239.82,157l-12-96A24,24,0,0,0,204,40H32A16,16,0,0,0,16,56v88a16,16,0,0,0,16,16H75.06l37.78,75.58A8,8,0,0,0,120,240a40,40,0,0,0,40-40V184h56a24,24,0,0,0,23.82-27ZM72,144H32V56H72Z',
  'ThumbsDownFillGlyph',
);

export const MoreGlyph = glyph(
  'M144,128a16,16,0,1,1-16-16A16,16,0,0,1,144,128ZM60,112a16,16,0,1,0,16,16A16,16,0,0,0,60,112Zm136,0a16,16,0,1,0,16,16A16,16,0,0,0,196,112Z',
  'MoreGlyph',
);

export const CaretRightGlyph = glyph(
  'M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z',
  'CaretRightGlyph',
);
