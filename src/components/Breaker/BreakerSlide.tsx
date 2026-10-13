import * as React from 'react';

import { cn } from '../../lib/cn';
import { ProfilePlate } from '../ProfilePlate';
import { SectionHeader } from '../SectionHeader';
import { StatCard } from '../StatCard';
import { StatGroup } from '../StatGroup';
import { Text } from '../Text';
import type { BreakerSlideData } from './types';

/* ---------------------------------------------------------------------------
 * One slide's words (internal to Breaker): the statement with its eyebrow (a
 * SectionHeader, display title: its own markers name them,
 * `section-header-eyebrow` / `data-part="eyebrow"` and `section-header-title` /
 * `data-part="headline"`, inside `breaker-say`), who said it (a footnote), who it is (a
 * ProfilePlate), and the spec figures (a StatGroup of ruled StatCards). Every
 * optional slot omitted is a variant.
 *
 * Breaker stacks every slide in one grid cell, so the band is as tall as its
 * longest and never changes height on a turn; the ones not on show are
 * invisible, `aria-hidden` and `inert` (Breaker sets it). The one on show
 * carries the page motion's `data-breaker-part` markers; the others none, so a
 * scroll entrance fades in only what is seen.
 *
 * THE TURN. Once the band has turned (`data-turned` on the root), the slide
 * coming on fades in after the last has faded out, and its words, then its
 * profile, slide in a step (`--motion-offset-enter`) from the side the band
 * turned from (`data-direction`): the `ssx-breaker-in` keyframe, on inner
 * wrappers (`breaker-say`, the profile's inner box), never on the
 * `data-breaker-part`s a page's scroll entrance tweens. Not under reduced
 * motion, and not on the first paint.
 *
 * No hooks, no handlers: server-safe markup (React 16 safe).
 * ------------------------------------------------------------------------- */

// The slide-in keyframe, only once the band has turned and only on the slide on show.
const TURN_IN = cn(
  'in-data-[turned]:group-data-[active]/slide:animate-ssx-breaker-in',
  'motion-reduce:animate-none in-data-[motion=reduce]:animate-none',
);

// Stacked in one cell. The one going off fades out; the one coming on shows once it has (its
// parts then slide in). Visibility rides the same transition, so the outgoing one stays visible
// while it fades and the incoming one appears at its delay.
const SLIDE = cn(
  'group/slide col-start-1 row-start-1 min-w-0',
  'invisible opacity-0',
  'transition-[opacity,visibility] duration-(--motion-duration-slow) ease-productive-exit',
  'data-active:visible data-active:opacity-100 data-active:duration-0 data-active:delay-(--motion-duration-slow)',
  'motion-reduce:transition-none',
);

export interface BreakerSlideProps extends React.HTMLAttributes<HTMLDivElement> {
  slide: BreakerSlideData;
  /** On show. */
  active: boolean;
  /** Its place and the count, for the slide's name in a carousel. */
  index: number;
  count: number;
  /** The scene is pale: the profile sits on the dark plate. */
  bright?: boolean;
}

export const BreakerSlide = React.forwardRef<HTMLDivElement, BreakerSlideProps>(function BreakerSlide(
  { slide, active, index, count, bright = false, className, ...props },
  ref,
) {
  const many = count > 1;
  const part = (name: string) => (active ? name : undefined);
  const { eyebrow, statement, attribution, figures, profile } = slide;
  const named = profile ? `: ${profile.name}` : '';

  return (
    <div
      ref={ref}
      data-slot="breaker-slide"
      data-active={active ? '' : undefined}
      role={many ? 'group' : undefined}
      aria-roledescription={many ? 'slide' : undefined}
      aria-label={many ? `${index + 1} of ${count}${named}` : undefined}
      aria-hidden={active ? undefined : true}
      className={cn(SLIDE, className)}
      {...props}
    >
      <div data-slot="breaker-say" className={TURN_IN}>
        <SectionHeader
          eyebrow={eyebrow}
          title={statement}
          titleAs="h2"
          titleSize="display"
          spacing="sm"
          className="mb-0 sm:mb-0"
        />
        {attribution ? (
          // The footnote on the secondary on-image ink; the statement above it is full white.
          <Text
            as="p"
            tone="secondary"
            data-slot="breaker-attribution"
            data-breaker-part={part('attribution')}
            className="mt-3"
          >
            {attribution}
          </Text>
        ) : null}
      </div>
      {profile ? (
        <div data-slot="breaker-profile" data-breaker-part={part('profile')} className="mt-6 sm:mt-8">
          <div className={cn(TURN_IN, '[--ssx-breaker-in-step:1]')}>
            <ProfilePlate
              name={profile.name}
              credential={profile.credential}
              logos={profile.logos}
              logosPrefix={profile.logosPrefix}
              avatar={profile.avatar}
              tone={bright ? 'dark' : 'light'}
            />
          </div>
        </div>
      ) : null}
      {figures && figures.length ? (
        <div data-slot="breaker-figures" data-breaker-part={part('figures')} className="mt-8 md:mt-12">
          <StatGroup columns={2} as="ul">
            {figures.map((figure, i) => (
              <StatCard
                key={`${figure.value}-${i}`}
                variant="ruled"
                size="lg"
                value={figure.value}
                label={figure.label}
                description={figure.description}
                source={figure.source}
                sourceLogo={figure.sourceLogo}
              />
            ))}
          </StatGroup>
        </div>
      ) : null}
    </div>
  );
});
BreakerSlide.displayName = 'BreakerSlide';
