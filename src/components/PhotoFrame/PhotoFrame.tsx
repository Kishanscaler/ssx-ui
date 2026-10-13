import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * PhotoFrame (marketing)
 *
 * A photo in a ratio, positioned, with an optional progressive blur, and a
 * plate when there is no photo. Whatever is passed as children sits on top:
 * a tag, a figure, a glass plate, a play disc. In-flow children settle at the
 * frame's foot; position anything else yourself (`absolute top-4 start-4`).
 *
 *   <PhotoFrame src={url} alt="" ratio="1:1" blur="bottom">
 *     <Badge tone="glass" className="absolute top-4 start-4">Food & beverage</Badge>
 *     <GlassPlate inset="foot"><Figure value="₹50L" /></GlassPlate>
 *   </PhotoFrame>
 *
 * THE PROGRESSIVE BLUR is blurred COPIES of the photo, not `backdrop-filter`
 * (which re-runs on every scrolled frame): `bottom` lays a soft copy then a
 * deep one toward the foot, `end` one copy toward the inline end (where a
 * column of logos floats). Each copy is revealed by its own gradient mask
 * (src/styles/batches/marketing.css, from the `from` prop), under a scrim so
 * white type reads. Blur fades an element's edges to transparent, which would
 * show the sharp photo there, so with a blur every layer is drawn a margin
 * larger than the frame (three soft steps of the glass blur), alike, and the
 * rim falls outside the clip. The photo and its copies move as ONE layer
 * (`data-part="photo"`, `will-change: transform`), so an entrance that zooms
 * it never re-blurs and never pulls the copies out of register.
 *
 * Glass on top: nothing between a child's `backdrop-filter` and the photo may
 * have a mask, filter or opacity (each makes a backdrop root, and the glass
 * then blurs nothing). The masked layers are the photo's siblings, never a
 * child's ancestor, so a GlassPlate or a glass Badge passed in still frosts.
 *
 * White type on the photo: with a scrim, or on the plate, the frame declares
 * `data-surface-ink="on-image"` and Heading, Text, Figure, Button and Link
 * inside ink themselves for it.
 *
 * Markers, no motion: `data-slot="photo-frame"` with `photo-frame-media`
 * (`data-part="photo"`), `-image`, `-blur` (`data-layer="soft|deep|end"`),
 * `-scrim` and `-placeholder`. Server component.
 * ------------------------------------------------------------------------- */

/** The frame's shape, width:height; `fill` takes its parent's height. */
export type PhotoFrameRatio = '16:9' | '4:3' | '3:2' | '1:1' | '4:5' | '3:4' | '9:16' | 'fill';
/** Where the photo blurs: nowhere, toward the foot, or toward the inline end. */
export type PhotoFrameBlur = 'none' | 'bottom' | 'end';
/** The ground when there is no photo: the fixed dark plate, or the page's sunken grey. */
export type PhotoFramePlaceholder = 'plate' | 'sunken';

export const photoFrameVariants = cva(
  'relative isolate flex w-full min-w-0 flex-col justify-end overflow-hidden rounded-lg',
  {
    variants: {
      ratio: {
        '16:9': 'aspect-video',
        '4:3': 'aspect-landscape',
        '3:2': 'aspect-photo',
        '1:1': 'aspect-square',
        // No 4:5 token yet (src/marketing/README.md, token requests): the
        // page's value comes in on `--ssx-aspect-4-5`; until then, 3:4.
        '4:5': 'aspect-[var(--ssx-aspect-4-5,calc(1/(var(--aspect-landscape))))]',
        // 3:4 is 4:3 turned upright: the landscape token, inverted.
        '3:4': 'aspect-[calc(1/(var(--aspect-landscape)))]',
        '9:16': 'aspect-portrait',
        fill: 'h-full min-h-0',
      },
    },
    defaultVariants: { ratio: '4:3' },
  },
);

const GROUND: Record<PhotoFramePlaceholder, string> = {
  // The fixed dark plate (README token request `surface.inverse.fixed`).
  plate: 'bg-(--ssx-surface-fixed-dark,var(--surface-inverse))',
  sunken: 'bg-surface-sunken',
};

/** Every layer is the frame's box, or (with a blur) a margin larger on every side. */
const layer = 'absolute inset-0';
const bleed = 'inset-[calc(var(--glass-blur)*-3)]';
const photo = 'absolute size-full max-w-none object-cover';

/** `from` as a percentage along the frame, kept inside it. */
const pct = (n: number) => `${Math.round(Math.min(100, Math.max(0, n)) * 100) / 100}%`;

export interface PhotoFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The photo's URL. Without it the frame shows its `placeholder` ground. */
  src?: string;
  /** The photo's `srcset`, so a phone loads a small file and a retina desktop a sharp one. */
  srcSet?: string;
  /** The photo's `sizes`, for `srcSet`: the width the frame is drawn at. */
  sizes?: string;
  /**
   * Alt text. Leave it empty when the photo is decoration and the copy beside
   * it says what it shows.
   *
   * @default ''
   */
  alt?: string;
  /** Where the subject sits, as CSS `object-position` ("50% 30%"), so the crop keeps it in frame. */
  position?: string;
  /**
   * Above the fold: load eagerly at high fetch priority. Otherwise lazy and
   * decoded off the main thread.
   *
   * @default false
   */
  priority?: boolean;
  /**
   * The frame's shape. `fill` takes its parent's height (a card's media
   * column). `4:5` and `3:4` are portrait cuts for a phone.
   *
   * @default '4:3'
   */
  ratio?: PhotoFrameRatio;
  /**
   * A progressive blur: `bottom` (soft, then deep toward the foot: a figure
   * or copy sits there) · `end` (toward the inline end: a column of logos
   * floats there) · `none`.
   *
   * @default 'none'
   */
  blur?: PhotoFrameBlur;
  /**
   * A dark scrim rising to the foot, so white type reads. With it the frame
   * declares on-image ink for its children.
   *
   * @default blur !== 'none'
   */
  scrim?: boolean;
  /**
   * Where the blur and the scrim begin, 0 (the top, or the start) to 1. Start
   * it below any face in the photo.
   *
   * @default 0.4
   */
  from?: number;
  /**
   * The ground when there is no `src`: `plate` the fixed dark plate (white
   * type on it), `sunken` the page's sunken grey.
   *
   * @default 'plate'
   */
  placeholder?: PhotoFramePlaceholder;
}

/** React 19 knows `fetchPriority`; earlier Reacts pass the lowercase attribute through untouched. */
const FETCH_PRIORITY = parseInt(React.version, 10) >= 19 ? 'fetchPriority' : 'fetchpriority';

export const PhotoFrame = React.forwardRef<HTMLDivElement, PhotoFrameProps>(function PhotoFrame(
  {
    className,
    style,
    src,
    srcSet,
    sizes,
    alt = '',
    position,
    priority = false,
    ratio = '4:3',
    blur = 'none',
    scrim,
    from = 0.4,
    placeholder = 'plate',
    children,
    ...props
  },
  ref,
) {
  const blurred = Boolean(src) && blur !== 'none';
  const scrimmed = scrim ?? blur !== 'none';
  const onImage = scrimmed || (!src && placeholder === 'plate');

  // The ramps, as fractions of what is left after `from`: the soft copy is in
  // by a third of the way, the deep one starts a quarter in and is in by two
  // thirds; the single `end` copy is in halfway. The page's values at 0.4.
  const f = Math.min(1, Math.max(0, from)) * 100;
  const rest = 100 - f;
  const ramps = {
    soft: [f, f + rest / 3],
    deep: [f + rest / 4, f + (rest * 2) / 3],
    end: [f, f + rest / 2],
  } as const;
  const layers: Array<keyof typeof ramps> = blur === 'bottom' ? ['soft', 'deep'] : blur === 'end' ? ['end'] : [];

  const loading = priority
    ? ({ loading: 'eager', [FETCH_PRIORITY]: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>)
    : ({ loading: 'lazy', decoding: 'async' } as React.ImgHTMLAttributes<HTMLImageElement>);
  const img = { src, srcSet, sizes, ...loading, style: position ? { objectPosition: position } : undefined };

  return (
    <div
      ref={ref}
      data-slot="photo-frame"
      data-ratio={ratio}
      data-blur={blurred ? blur : undefined}
      data-scrim={scrimmed || undefined}
      data-placeholder={src ? undefined : placeholder}
      data-surface-ink={onImage ? 'on-image' : undefined}
      className={cn(photoFrameVariants({ ratio }), className)}
      style={{ '--ssx-photo-from': pct(f), ...style } as React.CSSProperties}
      {...props}
    >
      {src ? (
        <div data-slot="photo-frame-media" data-part="photo" className={cn(layer, 'z-below will-change-transform')}>
          <img data-slot="photo-frame-image" alt={alt} className={cn(photo, blurred ? bleed : 'inset-0')} {...img} />
          {layers.map((name) => (
            <div
              key={name}
              data-slot="photo-frame-blur"
              data-layer={name}
              aria-hidden="true"
              className={layer}
              style={
                {
                  '--ssx-photo-mask-from': pct(ramps[name][0]),
                  '--ssx-photo-mask-to': pct(ramps[name][1]),
                } as React.CSSProperties
              }
            >
              <img
                alt=""
                className={cn(
                  photo,
                  bleed,
                  name === 'soft' && 'blur-[calc(var(--glass-blur)/2)]',
                  name === 'deep' && 'blur-[calc(var(--glass-blur)*1.5)]',
                  name === 'end' && 'blur-glass',
                )}
                {...img}
              />
            </div>
          ))}
          {scrimmed ? (
            <span data-slot="photo-frame-scrim" aria-hidden="true" className={cn(layer, 'bg-surface-image-scrim')} />
          ) : null}
        </div>
      ) : (
        <span
          data-slot="photo-frame-placeholder"
          aria-hidden="true"
          className={cn(layer, 'z-below', GROUND[placeholder] ?? GROUND.plate)}
        >
          {scrimmed ? (
            <span data-slot="photo-frame-scrim" aria-hidden="true" className={cn(layer, 'bg-surface-image-scrim')} />
          ) : null}
        </span>
      )}
      {children}
    </div>
  );
});
PhotoFrame.displayName = 'PhotoFrame';
