/**
 * Samples for the marketing entry (`@kishanscaler/ssx-ui/marketing`), rendered by
 * ../index.js after the main entry's exports, with the same rules: `(m) => element`
 * for an export that needs props, or the NAME of the export whose sample renders it.
 * Function props are fine here (client only), but keep them to what a page would pass.
 */
const PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#4a6"/><circle cx="420" cy="180" r="90" fill="#dfe"/></svg>',
  );
const LOGO = { name: 'Acme', src: PHOTO, color: '#1D925B' };

export const marketingSamples = {
  SectionHeader: (m) => <m.SectionHeader eyebrow="Placements" title="Where the cohort landed" description="A line under the title." />,
  PhotoFrame: (m) => <m.PhotoFrame src={PHOTO} alt="" ratio="4:3" blur="bottom" />,
  LogoTile: (m) => <m.LogoTile logo={LOGO} />,
  Figure: (m) => <m.Figure value="₹19L" />,
  Rail: (m) => (
    <m.Rail label="Mentors" itemName="mentor" nav="both">
      <m.RailItem>One</m.RailItem>
      <m.RailItem>Two</m.RailItem>
      <m.RailItem>Three</m.RailItem>
    </m.Rail>
  ),
  RailItem: 'Rail',
  CarouselNav: (m) => <m.CarouselNav count={3} active={0} itemName="slide" onSelect={() => {}} />,
  PersonCard: (m) => <m.PersonCard name="Ananya Gupta" role="Brand Marketing" image={PHOTO} logos={[LOGO]} />,
  ShowcaseCard: (m) => <m.ShowcaseCard title="Gredo" tag="Food tech" figure="₹1Cr+" figureLabel="ARR" image={PHOTO} people={[{ name: 'Mayank Kelwani' }]} />,
  MediaCard: (m) => <m.MediaCard title="In the news" eyebrow="Economic Times" description="A line." image={PHOTO} ratio="16:9" />,
  StatCard: (m) => <m.StatCard value="94%" label="placed in 3 months" />,
  StatGroup: (m) => (
    <m.StatGroup columns={2}>
      <m.StatCard value="94%" label="placed" />
      <m.StatCard value="₹19L" label="median" />
    </m.StatGroup>
  ),
  ProfilePlate: (m) => <m.ProfilePlate name="Anupam Mittal" credential="Founder, Shaadi.com" logos={[LOGO]} />,
  Breaker: (m) => (
    <m.Breaker
      label="Founders and investors"
      itemName="person"
      slides={[
        {
          eyebrow: 'Founders and investors have noticed',
          statement: 'Anupam Mittal offered ₹50 lakh to back a student startup.',
          profile: { name: 'Anupam Mittal', credential: 'Founder, Shaadi.com', logos: [LOGO] },
          figures: [{ value: '60%', label: 'of MBA students', source: 'Forbes' }],
          media: { poster: PHOTO, fit: 'height' },
        },
        { statement: 'Don’t get intellectually comfortable.', profile: { name: 'Ankur Warikoo' }, media: { poster: PHOTO, bright: true } },
      ]}
    />
  ),
};
