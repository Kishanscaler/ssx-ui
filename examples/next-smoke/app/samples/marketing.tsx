/**
 * Renders EVERY PascalCase export of @kishanscaler/ssx-ui/marketing, in a Server
 * Component, the way a Storyblok block tree would: flat props only, no function
 * props (a handler cannot cross from here into a client island, which is the
 * point of the test). scripts/smoke.mjs checks each one produced a [data-slot].
 *
 * Coverage is automatic: a new export of the marketing barrel renders here with
 * no props unless it has a sample below (a required prop, a compound part that
 * another sample already renders — written as that export's NAME).
 */
import type * as React from 'react';
import * as marketing from '@kishanscaler/ssx-ui/marketing';

type Sample = ((m: typeof marketing) => React.ReactNode) | string;

const PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#4a6"/><circle cx="420" cy="180" r="90" fill="#dfe"/></svg>',
  );
const LOGO = { name: 'Acme', src: PHOTO, color: '#1D925B' };

const samples: Partial<Record<keyof typeof marketing, Sample>> = {
  SectionHeader: (m) => (
    <m.SectionHeader eyebrow="Placements" title="Where the cohort landed" description="A line under the title." />
  ),
  PhotoFrame: (m) => <m.PhotoFrame src={PHOTO} alt="" ratio="4:3" blur="bottom" />,
  LogoTile: (m) => <m.LogoTile logo={LOGO} />,
  Figure: (m) => <m.Figure value="₹19L" />,
  Rail: (m) => (
    <m.Rail label="Mentors" itemName="mentor" nav="both" autoplay="step">
      <m.RailItem>One</m.RailItem>
      <m.RailItem>Two</m.RailItem>
      <m.RailItem>Three</m.RailItem>
    </m.Rail>
  ),
  RailItem: 'Rail',
  // Takes an onSelect handler: rendered by Rail's nav, never bare from a server page.
  CarouselNav: 'Rail',
  PersonCard: (m) => <m.PersonCard name="Ananya Gupta" role="Brand Marketing" image={PHOTO} logos={[LOGO]} />,
  ShowcaseCard: (m) => (
    <m.ShowcaseCard title="Gredo" tag="Food tech" figure="₹1Cr+" figureLabel="ARR" image={PHOTO} people={[{ name: 'Mayank Kelwani' }]} />
  ),
  MediaCard: (m) => <m.MediaCard title="In the news" eyebrow="Economic Times" description="A line." image={PHOTO} ratio="16:9" />,
  StatCard: (m) => <m.StatCard value="94%" label="placed in 3 months" />,
  StatGroup: (m) => (
    <m.StatGroup columns={2}>
      <m.StatCard value="94%" label="placed" />
      <m.StatCard value="₹19L" label="median" />
    </m.StatGroup>
  ),
  ProfilePlate: (m) => <m.ProfilePlate name="Anupam Mittal" credential="Founder, Shaadi.com" logos={[LOGO]} />,
};

const components = Object.keys(marketing)
  .filter((name) => /^[A-Z]/.test(name))
  .sort() as Array<keyof typeof marketing>;

export function MarketingSamples() {
  return (
    <>
      {components.map((name) => {
        const sample = samples[name];
        if (typeof sample === 'string') {
          return <div key={name} hidden data-sample={`marketing:${name}`} data-covered-by={`marketing:${sample}`} />;
        }
        let content: React.ReactNode;
        if (typeof sample === 'function') {
          content = sample(marketing);
        } else {
          const Component = (marketing as unknown as Record<string, React.ElementType>)[name]!;
          content = <Component />;
        }
        return (
          <section key={name} data-sample={`marketing:${name}`} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">marketing/{name}</h2>
            <div className="flex flex-col gap-3">{content}</div>
          </section>
        );
      })}
    </>
  );
}
