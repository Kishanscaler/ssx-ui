import * as React from 'react';

/* ---------------------------------------------------------------------------
 * Built-in status glyphs (internal, never exported from the package).
 *
 * The HTML preview's sprite symbols `#ph-info-fill`, `#ph-success-fill`,
 * `#ph-warning-fill`, `#ph-error-fill`, `#ph-announcement-fill`,
 * `#ph-check-bold` and `#ph-close-bold` (Phosphor 2.1.1, 256 viewBox), inlined
 * so Alert, Banner and Stepper can draw their default mark without importing
 * an icon library. A consumer's own svg always replaces these.
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

export const InfoGlyph = glyph(
  'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z',
  'InfoGlyph',
);

export const SuccessGlyph = glyph(
  'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z',
  'SuccessGlyph',
);

export const WarningGlyph = glyph(
  'M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z',
  'WarningGlyph',
);

export const ErrorGlyph = glyph(
  'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z',
  'ErrorGlyph',
);

export const AnnouncementGlyph = glyph(
  'M200,72H160.2c-2.91-.17-53.62-3.74-101.91-44.24A16,16,0,0,0,32,40V200a16,16,0,0,0,26.29,12.25c37.77-31.68,77-40.76,93.71-43.3v31.72A16,16,0,0,0,159.12,214l11,7.33A16,16,0,0,0,194.5,212l11.77-44.36A48,48,0,0,0,200,72ZM179,207.89l0,.11-11-7.33V168h21.6ZM200,152H168V88h32a32,32,0,1,1,0,64Z',
  'AnnouncementGlyph',
);

export const CheckGlyph = glyph(
  'M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z',
  'CheckGlyph',
);

export const CloseGlyph = glyph(
  'M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z',
  'CloseGlyph',
);

/** Exclamation mark, bold cut, for a step in error (a glyph on a solid disc). */
export const ExclamationGlyph = glyph(
  'M116,48a12,12,0,0,1,24,0v96a12,12,0,0,1-24,0ZM128,176a16,16,0,1,0,16,16A16,16,0,0,0,128,176Z',
  'ExclamationGlyph',
);

/** The default glyph for each status tone. */
export const STATUS_GLYPH = {
  info: InfoGlyph,
  success: SuccessGlyph,
  warning: WarningGlyph,
  danger: ErrorGlyph,
  brand: AnnouncementGlyph,
} as const;
