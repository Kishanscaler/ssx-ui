import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { SpinnerCore } from '../Spinner/Spinner';
import { LOGO_ART, LOGO_PALETTE, type LogoPart } from './marks';

/* ---------------------------------------------------------------------------
 * Logo
 *
 * The SST and SSB brand logos, drawn inline from the approved artwork
 * (`assets/{sst,ssb}/logos`, generated into `marks.ts`). It is the one place a
 * Scaler logo comes from: the TopNav's default brand renders it, the Spinner
 * traces the same monogram, and brand.css's `--brand-mark` mask is built from
 * the same path. A partner or employer logo is NOT this — that is an image
 * (`Avatar`, the Logo Wall).
 *
 * Four axes, all flat strings so a Storyblok option maps straight onto them:
 *   brand    sst | ssb | auto    — auto follows the nearest `data-brand`
 *   variant  full | monogram     — the combination mark, or the mark alone
 *   tone     color | mono        — the artwork's colours, or one colour
 *   surface  auto | light | dark — which artwork: Color/Mono for a light
 *                                  surface, Inverse Color/Inverse Mono for a
 *                                  dark one; auto follows the theme
 *
 * `auto` works with no JavaScript, so it is right in a Server Component and on
 * the first paint. Every colour is a custom property set by brand.css under the
 * same selectors as the tokens, and custom properties inherit, so the nearest
 * `data-brand` / `data-theme` ancestor decides exactly as it does for
 * `bg-surface`. `brand="auto"` renders both lockups (their viewBoxes differ, so
 * they cannot share one <svg>) and a `display` variable shows one; the hidden
 * one is `display: none`, so it is out of the accessibility tree too.
 *
 * A pinned `surface` needs no stylesheet at all: its colours are presentation
 * attributes on the paths. `auto` also carries the light colours as attributes,
 * so the logo is still the light artwork where components.css never loaded.
 *
 * Mono paints in `currentColor`, with the artwork's mono colour set on each
 * <svg> (`#171717` SST, black SSB, white on dark). The SST glyph is cut out of
 * the shield (one evenodd path, the same one the mask uses), so it shows the
 * surface underneath rather than a hard-coded white or near-black. To paint mono
 * in another colour, colour the svg: `className="[&_svg]:text-content-brand"`.
 *
 * Server component: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

/** String unions, so a Storyblok option value can be passed straight in. */
export type LogoBrand = 'sst' | 'ssb' | 'auto';
export type LogoVariant = 'full' | 'monogram';
export type LogoTone = 'color' | 'mono';
export type LogoSurface = 'auto' | 'light' | 'dark';
export type LogoSize = 'sm' | 'md' | 'lg';
export type LogoLoaderSize = 'sm' | 'md' | 'lg' | 'xl';

/** The accessible name each brand's logo carries by default. */
export const logoBrandNames = {
  sst: 'Scaler School of Technology',
  ssb: 'Scaler School of Business',
} as const;

const BRANDS = ['sst', 'ssb'] as const;

export const logoVariants = cva(
  // The svg fills the height and takes its width from its own viewBox, so the
  // aspect ratio is the artwork's at any height a className sets.
  'inline-flex shrink-0 items-center align-middle [&>svg]:h-full [&>svg]:w-auto [&>svg]:shrink-0',
  {
    variants: {
      size: {
        /** 24px. Inline, a footer, a dense app bar. */
        sm: 'h-6',
        /** 32px. The default. */
        md: 'h-8',
        /** 40px, the artwork's own height. A hero, a sign-in card. */
        lg: 'h-10',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

type Paint = Record<string, string>;

function LogoArtwork({
  brand,
  variant,
  tone,
  surface,
  name,
}: {
  brand: 'sst' | 'ssb';
  variant: LogoVariant;
  tone: LogoTone;
  surface: LogoSurface;
  /** Set: this svg names itself (brand="auto" with no label). Unset: hidden. */
  name?: string;
}) {
  const art = LOGO_ART[brand][variant];
  const parts: readonly LogoPart[] = tone === 'mono' ? art.solid : art.parts;
  // `auto` carries the light artwork as its no-CSS fallback; brand.css and
  // components.css repaint it for the current mode.
  const paint = LOGO_PALETTE[brand][surface === 'dark' ? 'dark' : 'light'] as Paint;
  return (
    <svg
      data-logo-mark={brand}
      viewBox={art.viewBox}
      color={tone === 'mono' ? paint.mono : undefined}
      role={name ? 'img' : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
      focusable="false"
    >
      {parts.map((part, i) => (
        <path
          key={i}
          data-logo-part={part.role}
          d={part.d}
          fill={tone === 'mono' ? 'currentColor' : paint[part.role]}
          fillRule={part.evenodd ? 'evenodd' : undefined}
          clipRule={part.evenodd ? 'evenodd' : undefined}
        />
      ))}
    </svg>
  );
}

export type LogoProps = Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> & {
  /**
   * Which school. `auto` follows the nearest `data-brand` ancestor (the same
   * signal the tokens read) and re-themes with no JavaScript.
   *
   * @default 'auto'
   */
  brand?: 'sst' | 'ssb' | 'auto';
  /**
   * `full` is the combination mark (monogram + wordmark); `monogram` is the
   * mark alone, for a square slot, a favicon-sized place, or a tight bar.
   *
   * @default 'full'
   */
  variant?: 'full' | 'monogram';
  /**
   * `color` is the artwork's own colours (Color on light, Inverse Color on
   * dark). `mono` is one colour (Mono / Inverse Mono) in `currentColor`.
   *
   * @default 'color'
   */
  tone?: 'color' | 'mono';
  /**
   * The surface the logo sits on. `auto` follows `data-theme`, or the OS
   * preference when nothing pins it, exactly like the tokens. Pin `dark` for a
   * surface that is dark in both modes (brand-filled, a photo, a dark
   * footer), and `light` for a white card in a dark page.
   *
   * @default 'auto'
   */
  surface?: 'auto' | 'light' | 'dark';
  /**
   * Height; the width follows the artwork. A `className` height (`h-[1.75rem]`)
   * replaces it.
   *
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * The accessible name. Defaults to the school's name ("Scaler School of
   * Technology" / "Scaler School of Business"); with `brand="auto"` each
   * lockup names itself and only the visible one is read.
   */
  label?: string;
  /**
   * Hide it from assistive technology, for a logo beside text that already
   * says the name, or inside a link that is named another way.
   *
   * @default false
   */
  decorative?: boolean;
};

/**
 * The SST / SSB logo. `<Logo />` is the full colour lockup of whichever brand
 * the page is in, in its light or dark artwork as the theme says.
 */
export const Logo = React.forwardRef<HTMLSpanElement, LogoProps>(function Logo(
  {
    className,
    brand = 'auto',
    variant = 'full',
    tone = 'color',
    surface = 'auto',
    size = 'md',
    label,
    decorative = false,
    ...props
  },
  ref,
) {
  // The root names the logo unless it cannot know which one is showing.
  const rootName = decorative ? undefined : (label ?? (brand === 'auto' ? undefined : logoBrandNames[brand]));
  const shown = brand === 'auto' ? BRANDS : [brand];
  return (
    <span
      ref={ref}
      data-slot="logo"
      data-logo-brand={brand}
      data-variant={variant}
      data-tone={tone}
      data-surface={surface}
      data-size={size}
      role={rootName ? 'img' : undefined}
      aria-label={rootName}
      aria-hidden={decorative || undefined}
      className={cn(logoVariants({ size }), className)}
      {...props}
    >
      {shown.map((b) => (
        <LogoArtwork
          key={b}
          brand={b}
          variant={variant}
          tone={tone}
          surface={surface}
          name={decorative || rootName ? undefined : logoBrandNames[b]}
        />
      ))}
    </span>
  );
});
Logo.displayName = 'Logo';

/* ---- LogoLoader --------------------------------------------------------- */

export type LogoLoaderProps = Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> & {
  /**
   * Which school's monogram. `auto` follows the nearest `data-brand`.
   *
   * @default 'auto'
   */
  brand?: 'sst' | 'ssb' | 'auto';
  /**
   * `color` draws in the brand colour (white on dark, as the Inverse Color
   * mark's shield is); `mono` in the mono colour.
   *
   * @default 'color'
   */
  tone?: 'color' | 'mono';
  /**
   * The surface it sits on; `auto` follows the theme. As on `Logo`.
   *
   * @default 'auto'
   */
  surface?: 'auto' | 'light' | 'dark';
  /**
   * The Spinner's sizes. `md` (24px) and up trace the monogram; `sm` (16px)
   * inks the solid silhouette upward (the `<Button loading>` mark), because the
   * trace has no room at 16px.
   *
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * What a screen reader is told while it is on screen (`role="status"`).
   *
   * @default 'Loading'
   */
  label?: string;
  /**
   * Silence it, for a parent that already announces the wait (`aria-busy`).
   *
   * @default false
   */
  decorative?: boolean;
};

/**
 * The logo monogram as a loader: the Spinner's monogram draw (contour, glyph,
 * inked in), in the logo's colours. It IS the Spinner — the same element,
 * `data-slot="spinner" data-kind="monogram"`, the same keyframes — with the
 * brand pinnable and the colour taken from the logo palette instead of the
 * surrounding text. For a loader in running text use `Spinner` (its small
 * size is the six-dot grid).
 */
export const LogoLoader = React.forwardRef<HTMLSpanElement, LogoLoaderProps>(function LogoLoader(
  {
    className,
    brand = 'auto',
    tone = 'color',
    surface = 'auto',
    size = 'md',
    label = 'Loading',
    decorative = false,
    ...props
  },
  ref,
) {
  return (
    <SpinnerCore
      ref={ref}
      kind="monogram"
      size={size}
      markBrand={brand}
      label={decorative ? null : label}
      data-logo-loader=""
      data-logo-brand={brand}
      data-tone={tone}
      data-surface={surface}
      className={className}
      {...props}
    />
  );
});
LogoLoader.displayName = 'LogoLoader';
