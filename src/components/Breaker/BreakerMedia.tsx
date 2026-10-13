'use client';

// Client: each clip is played and paused from state (useBreakerClip).
import * as React from 'react';

import { cn } from '../../lib/cn';
import type { BreakerMedia as BreakerMediaData } from './types';
import { useBreakerClip } from './use-breaker-clip';

/* ---------------------------------------------------------------------------
 * The band's picture (internal to Breaker): the stage of shots, and the frost
 * over it.
 *
 *   breaker-media     the layer behind the words; its opacity eases out over
 *                     the band's foot (a mask: it melts into the page rather
 *                     than greying). A mask makes it a backdrop root, so the
 *                     frost inside it blurs the stage and nothing else.
 *   breaker-stage     the shots, one per slide that has its own media (and the
 *                     plate, if any slide has none at all); the one on shows,
 *                     fading in over the last, which stays whole under it
 *                     until it is covered (two half-faded layers would let the
 *                     page through). `data-breaker-stage` for the page's zoom.
 *     breaker-haze    the POSTER, blurred: the still under the frost (never a
 *                     second video: two stacked videos halved the frame rate).
 *                     On a phone it covers the band under the framed clip; on
 *                     desktop it fills the room beyond a `fit="height"` clip.
 *     breaker-clip    the muted loop (or the still, with no video): framed at
 *                     the band's top on a phone, feathered at its foot; from
 *                     `md` it covers the band (`cover`) or stands at the band's
 *                     full height from its inline start, feathered at its end
 *                     into the haze (`height`).
 *   breaker-frost     the progressive blur under the words: `rise` on a phone
 *                     (from above the words to the foot), `side` from `md`
 *                     (strengthening toward the words at the inline end). A
 *                     blur over the stage, its tint (the image scrim) at a
 *                     strength the root sets: darker when the scene is
 *                     `bright`.
 *
 * The masks and the frost's strengths are the Breaker block of
 * src/styles/batches/marketing.css.
 * ------------------------------------------------------------------------- */

/** One shot on the stage: the media of slide `index`, or the plate when `media` is absent. */
export interface BreakerShot {
  key: string;
  media?: BreakerMediaData;
}

export interface BreakerMediaProps {
  shots: BreakerShot[];
  /** Index into `shots` of the one on show. */
  active: number;
  /** The band is on screen, the tab visible and motion allowed: the active clip plays. */
  playing: boolean;
}

/** Bleed: a blurred still is drawn larger than the stage on every side, so its soft rim falls outside. */
const HAZE =
  'absolute inset-[calc(var(--glass-blur)*-6)] size-[calc(100%+var(--glass-blur)*12)] max-w-none object-cover blur-[calc(var(--glass-blur)*3)]';

// Phone: the clip framed at the band's top, `--ssx-breaker-frame` tall, its foot feathered (CSS).
const CLIP = 'absolute inset-x-0 top-0 block h-(--ssx-breaker-frame) w-full max-w-none object-cover';
const CLIP_FIT = {
  cover: 'md:h-full',
  // The band's full height, as wide as a 16:9 frame of it, from the inline start.
  height: 'md:end-auto md:h-full md:w-auto md:aspect-video',
} as const;

// The one on show fades in over the last; the last stays whole under it, then hides.
const SHOT = cn(
  'absolute inset-0 invisible opacity-0',
  'transition-[opacity,visibility] duration-0 delay-(--motion-duration-slowest)',
  'data-active:visible data-active:z-lift data-active:opacity-100',
  'data-active:delay-0 data-active:duration-(--motion-duration-slowest) data-active:ease-productive-in-out',
  'motion-reduce:transition-none',
);

const FROST_TINT = cn(
  'absolute inset-0 bg-surface-image-scrim',
  'transition-opacity duration-(--motion-duration-slowest) ease-productive-in-out motion-reduce:transition-none',
);

function Clip({ media, active, playing }: { media: BreakerMediaData; active: boolean; playing: boolean }) {
  const ref = React.useRef<HTMLVideoElement>(null);
  useBreakerClip(ref, active, playing);
  const fit = media.fit === 'height' ? 'height' : 'cover';
  const style = media.position ? { objectPosition: media.position } : undefined;
  return (
    <video
      ref={ref}
      data-slot="breaker-clip"
      data-fit={fit}
      className={cn(CLIP, CLIP_FIT[fit])}
      style={style}
      src={media.video}
      poster={media.poster}
      muted
      playsInline
      loop
      // The first paint's slide starts at once; a later slide is played by state.
      autoPlay={active}
      preload="metadata"
      aria-label={media.alt || undefined}
      aria-hidden={media.alt ? undefined : true}
    />
  );
}

function Shot({ shot, active, playing }: { shot: BreakerShot; active: boolean; playing: boolean }) {
  const media = shot.media;
  const fit = media && media.fit === 'height' ? 'height' : 'cover';
  const style = media && media.position ? { objectPosition: media.position } : undefined;
  return (
    <div
      data-slot="breaker-shot"
      data-active={active ? '' : undefined}
      data-fit={media ? fit : undefined}
      data-plate={media ? undefined : ''}
      className={SHOT}
    >
      {!media ? (
        // No picture: the fixed dark plate (README token request `surface.inverse.fixed`).
        <span aria-hidden="true" className="absolute inset-0 bg-(--ssx-surface-fixed-dark,var(--surface-inverse))" />
      ) : (
        <>
          {media.poster ? (
            <img
              data-slot="breaker-haze"
              src={media.poster}
              alt=""
              aria-hidden="true"
              decoding="async"
              // Desktop `cover` draws the clip over all of it: no haze to keep.
              className={cn(HAZE, fit === 'cover' && 'md:hidden')}
              style={style}
            />
          ) : null}
          {media.video ? (
            <Clip media={media} active={active} playing={active && playing} />
          ) : media.poster ? (
            <img
              data-slot="breaker-clip"
              data-fit={fit}
              src={media.poster}
              alt={media.alt || ''}
              decoding="async"
              className={cn(CLIP, CLIP_FIT[fit])}
              style={style}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

export function BreakerMedia({ shots, active, playing }: BreakerMediaProps) {
  return (
    <div data-slot="breaker-media" data-breaker-part="media" className="absolute inset-0 z-below overflow-hidden">
      <div data-slot="breaker-stage" data-breaker-stage="" className="absolute inset-0 overflow-hidden will-change-transform">
        {shots.map((shot, i) => (
          <Shot key={shot.key} shot={shot} active={i === active} playing={playing} />
        ))}
      </div>
      {/* Phone: rising from above the words to the band's foot. */}
      <div
        data-slot="breaker-frost"
        data-layer="rise"
        aria-hidden="true"
        className={cn(
          'absolute inset-x-0 bottom-0 top-[calc(var(--ssx-breaker-frame)*0.48-var(--space-24))] md:hidden',
          'backdrop-blur-[calc(var(--glass-blur)*2)] backdrop-saturate-(--glass-saturate)',
        )}
      >
        <span className={cn(FROST_TINT, 'opacity-(--ssx-breaker-frost)')} />
      </div>
      {/* Desktop: clear over the subject, full under the words. */}
      <div
        data-slot="breaker-frost"
        data-layer="side"
        aria-hidden="true"
        className={cn(
          'absolute inset-0 max-md:hidden',
          'backdrop-blur-[calc(var(--glass-blur)*2)] backdrop-saturate-(--glass-saturate)',
        )}
      >
        <span className={cn(FROST_TINT, 'opacity-(--ssx-breaker-frost-wide)')} />
      </div>
    </div>
  );
}
