import * as React from 'react';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * PlayDisc (marketing, internal)
 *
 * The marketing cards' one play control (MediaCard, ShowcaseCard): a round
 * disc on the media linking to a card's `videoUrl`. Not exported from the
 * entry; a page that wants another control passes the card's `playSlot`.
 *
 *   - THE DISC is the fixed dark plate (GlassPlate's `dark` tone: the
 *     README's `glass.on-image.plate` request, `--ssx-plate-on-photo` falling
 *     back to the image scrim), frosted, its edge the on-image glass's hover
 *     step: it reads on a pale photo and a dark one, in both themes. The
 *     control-lg size, the glyph at the md icon size.
 *   - SAME TAB. A video URL is content, like any other link on the card;
 *     opening it elsewhere (a new tab, a lightbox, a player in place) is the
 *     page's call, made with `playSlot`.
 *   - NAMED "Play: <title>" (the card's title), or "Play video" without one.
 *   - `area`: `disc` the disc is the target (laid over media whose copy has
 *     links of its own) · `fill` the link fills its box, the disc centred in
 *     it, so the whole media is the hit area. Either way the focus ring is
 *     drawn on the disc: media clips anything at its own edge.
 *
 * Marker: `data-slot="play-disc"` on the link. Server component.
 * ------------------------------------------------------------------------- */

/** The play triangle, drawn on a 24 grid with softened corners. */
const PLAY = 'M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z';

const DISC = cn(
  'grid size-control-lg shrink-0 place-items-center rounded-full',
  'border border-glass-on-image-hover bg-(--ssx-plate-on-photo,var(--surface-image-scrim)) text-on-image-ink',
  'backdrop-blur-glass backdrop-saturate-(--glass-saturate)',
  'group-hover/play:border-on-image-ink group-active/play:scale-(--motion-scale-press)',
  'transition-[border-color,scale] duration-(--motion-duration-fast) ease-(--motion-easing-productive-in-out)',
  'motion-reduce:transition-none',
  'group-focus-visible/play:outline-focus group-focus-visible/play:outline-solid',
  'group-focus-visible/play:outline-on-image-ink group-focus-visible/play:outline-offset-focus',
);

/** The play control's accessible name, from the card's title. */
export function playName(title?: string): string {
  return title ? `Play: ${title}` : 'Play video';
}

export interface PlayDiscProps {
  /** The video's URL (the card's `videoUrl`). */
  href: string;
  /** The card's title: the link is named "Play: <title>". */
  title?: string;
  /**
   * `disc` the disc is the target · `fill` the link fills its box (the whole
   * media is the hit area), the disc centred in it.
   *
   * @default 'disc'
   */
  area?: 'disc' | 'fill';
}

export function PlayDisc({ href, title, area = 'disc' }: PlayDiscProps) {
  return (
    <a
      href={href}
      aria-label={playName(title)}
      data-slot="play-disc"
      className={cn(
        'group/play outline-none',
        area === 'fill' ? 'grid size-full place-items-center' : 'block rounded-full',
      )}
    >
      <span className={DISC}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className="size-icon-md">
          <path d={PLAY} />
        </svg>
      </span>
    </a>
  );
}
