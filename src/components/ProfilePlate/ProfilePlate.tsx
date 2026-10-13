import * as React from 'react';

import { cn } from '../../lib/cn';
import { GlassPlate, type GlassPlateTone } from '../GlassPlate';
import { LogoTile } from '../LogoTile';
import type { MarketingLogo } from '../MarketingCard/fields';
import { Text } from '../Text';

/* ---------------------------------------------------------------------------
 * ProfilePlate (marketing, INTERNAL)
 *
 * An internal part of the marketing entry, not exported from
 * `@kishanscaler/ssx-ui/marketing`: only Breaker composes it (a slide's
 * `profile` field). No Storybook page of its own: it is seen in Breaker's.
 *
 * Who said it, under a statement on a photo: the name, a credential, the
 * companies behind them ("Ex-" Google, Meta) on a glass plate. The SSB
 * testimonial band's profile card (`.oc-profile`): not everyone knows the
 * faces, so the plate says who they are.
 *
 *   <ProfilePlate
 *     name="Anupam Mittal"
 *     credential="Founder, Shaadi.com · Shark Tank India"
 *     logos={[{ name: 'Shaadi.com', src: '/logos/shaadi.svg' }]}
 *   />
 *
 * A GlassPlate (`tone`: `light` the on-image glass on a dark scene, `dark` the
 * fixed dark plate on a pale one), so the type is white in both themes and
 * the plate's 8px corners and 16×20 padding are the card standard's. It hugs
 * its content up to the cell's width (no width prop).
 *
 * Laid out in one row from `sm`: the avatar, the name over the credential,
 * then a hairline and the logos. Below `sm` the logos take a row of their own
 * under the name, so a long credential is never squeezed by them.
 *
 * EVERY OPTIONAL SLOT OMITTED IS A VARIANT: no `avatar`, no photo (the name
 * leads); no credential, no second line; no `logos`, no logo row (and no
 * rule). `logosPrefix` ("Ex-") sits before the logos and is read with them.
 *
 * The avatar is a server `<img>`, 32px round, `alt=""` (the name beside it
 * says who it is). Logos are `LogoTile`s on glass, the mark flattened white
 * (`native` keeps a multi-colour mark's colours); each tile's alt is the
 * company's name.
 *
 * `as` sets the element, as the family's cards do: `div` by default, `aside`
 * for the attribution beside a statement, `figure` where the page's outline
 * wants the plate as a figure of its own.
 *
 * An empty string is an unset field (Storyblok's blank text field): no
 * credential, prefix or photo is drawn for it.
 *
 * MARKERS, NOT MOTION. `data-slot="profile-plate"` (`data-tone`) on the root;
 * `profile-plate-avatar`, `profile-plate-name` (`data-part="title"`),
 * `profile-plate-credential` (`subline`), `profile-plate-logos` (`logos`).
 *
 * Server component: no hooks, no handlers. React 16 safe.
 * ------------------------------------------------------------------------- */

/** The element a ProfilePlate renders as. */
export type ProfilePlateElement = 'div' | 'aside' | 'figure';

export interface ProfilePlateProps extends React.HTMLAttributes<HTMLElement> {
  /** The person's full name. */
  name: string;
  /** Who they are, one line ("Founder, Shaadi.com · Shark Tank India"). Omit it for none. */
  credential?: string;
  /** The companies behind them, as white marks on glass. Omit them for no logo row. */
  logos?: MarketingLogo[];
  /** A word set before the logos and read with them: "Ex-" for where they were. */
  logosPrefix?: string;
  /** A square photo URL, drawn 32px round. Omit it for no photo. */
  avatar?: string;
  /**
   * `light` the on-image glass, for a dark scene · `dark` the fixed dark
   * plate, for a pale photo.
   *
   * @default 'light'
   */
  tone?: GlassPlateTone;
  /**
   * The element: `aside` for the attribution beside a statement, `figure`
   * where the page's outline wants the plate as a figure of its own.
   *
   * @default 'div'
   */
  as?: ProfilePlateElement;
}

export const ProfilePlate = React.forwardRef<HTMLElement, ProfilePlateProps>(function ProfilePlate(
  { className, name, credential, logos, logosPrefix, avatar, tone = 'light', as = 'div', ...props },
  ref,
) {
  const hasLogos = Boolean(logos && logos.length);
  return (
    <GlassPlate
      ref={ref}
      as={as}
      tone={tone}
      data-slot="profile-plate"
      className={cn(
        'flex w-fit max-w-full flex-wrap items-center gap-x-3 gap-y-2',
        'sm:flex-nowrap',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">
        {avatar ? (
          <img
            data-slot="profile-plate-avatar"
            src={avatar}
            alt=""
            loading="lazy"
            decoding="async"
            className="block size-8 shrink-0 rounded-full object-cover"
          />
        ) : null}
        <div className="grid min-w-0 gap-0.5">
          <Text as="p" data-slot="profile-plate-name" data-part="title" className="font-semibold">
            {name}
          </Text>
          {credential ? (
            <Text
              as="p"
              size="sm"
              tone="secondary"
              data-slot="profile-plate-credential"
              data-part="subline"
              className="text-balance"
            >
              {credential}
            </Text>
          ) : null}
        </div>
      </div>
      {hasLogos ? (
        <div
          data-slot="profile-plate-logos"
          data-part="logos"
          className={cn(
            'flex basis-full items-center gap-2',
            // From `sm` beside the name, behind a hairline that runs the plate's height.
            'sm:ms-2 sm:basis-auto sm:shrink-0 sm:self-stretch sm:border-s sm:border-glass-on-image-hover sm:ps-5',
          )}
        >
          {logosPrefix ? (
            <Text as="span" size="xs" tone="secondary" data-slot="profile-plate-prefix" className="font-medium">
              {logosPrefix}
            </Text>
          ) : null}
          {logos!.map((logo, i) => (
            <LogoTile key={`${logo.name}-${i}`} logo={logo} fill="glass" shape="wide" size="sm" className="w-20" />
          ))}
        </div>
      ) : null}
    </GlassPlate>
  );
});
ProfilePlate.displayName = 'ProfilePlate';
