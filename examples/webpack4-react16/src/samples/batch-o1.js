import * as React from 'react';

/** Batch O1 (organisms O1) samples. Only the batch O1 agent edits this file. See ./index.js. */
const samples = {
  TopNav: (ui) => (
    <>
      {/* Compound. The bar, brand, links and actions are server markup; the
          menu toggle (client) and the dropdown group's Menu hydrate. */}
      <ui.TopNav>
        <ui.TopNavBrand href="/" aria-label="Scaler home" />
        <ui.TopNavLinks>
          <ui.TopNavLink href="/programmes" current>
            Programmes
          </ui.TopNavLink>
          <ui.TopNavLink href="/curriculum">Curriculum</ui.TopNavLink>
          <ui.TopNavMenu label="Outcomes">
            <ui.MenuItem asChild>
              <a href="/placements">Placements</a>
            </ui.MenuItem>
          </ui.TopNavMenu>
        </ui.TopNavLinks>
        <ui.TopNavActions>
          <ui.Button asChild variant="tertiary" size="sm">
            <a href="/login">Student login</a>
          </ui.Button>
          <ui.Button asChild size="sm">
            <a href="/apply">Apply now</a>
          </ui.Button>
        </ui.TopNavActions>
      </ui.TopNav>
      {/* Flat (the Storyblok shape): plain data, no functions. */}
      <ui.TopNav
        size="sm"
        brandLabel="Scaler"
        brandHref="/"
        links={[
          { label: 'Applicants', href: '/applicants', current: true },
          { label: 'Scholarships', items: [{ label: 'Merit', href: '/scholarships/merit' }] },
        ]}
        actions={[{ label: 'Apply now', href: '/apply' }]}
        actionsOnMobile="bar"
      />
    </>
  ),
  TopNavBrand: 'TopNav',
  TopNavLinks: 'TopNav',
  TopNavLink: 'TopNav',
  TopNavMenu: 'TopNav',
  TopNavActions: 'TopNav',
  TopNavToggle: 'TopNav',
  Dialog: (ui) => (
    // Closed: the server renders the trigger only (Radix portals the panel on
    // the client, when opened).
    <>
      <ui.Dialog>
        <ui.DialogTrigger asChild>
          <ui.Button>Publish Week 6 grades</ui.Button>
        </ui.DialogTrigger>
        <ui.DialogContent>
          <ui.DialogHeader>
            <ui.DialogTitle>Publish Week 6 grades?</ui.DialogTitle>
            <ui.DialogDescription>84 students in Cohort 7 will be emailed.</ui.DialogDescription>
          </ui.DialogHeader>
          <ui.DialogBody>Include the cohort percentile.</ui.DialogBody>
          <ui.DialogFooter>
            <ui.DialogClose asChild>
              <ui.Button variant="tertiary">Cancel</ui.Button>
            </ui.DialogClose>
          </ui.DialogFooter>
        </ui.DialogContent>
      </ui.Dialog>
      <ui.Dialog
        title="Withdraw application SST-2029-0416?"
        description="This cannot be undone."
        trigger="Withdraw application"
        variant="destructive"
        cancelLabel="Keep application"
        confirmLabel="Withdraw application"
      />
    </>
  ),
  DialogTrigger: 'Dialog',
  DialogContent: 'Dialog',
  DialogHeader: 'Dialog',
  DialogTitle: 'Dialog',
  DialogDescription: 'Dialog',
  DialogBody: 'Dialog',
  DialogFooter: 'Dialog',
  DialogClose: 'Dialog',
  Carousel: (ui) => (
    <>
      {/* Compound: the track and slides are server components; the arrows
          and dots (client) measure the track once hydrated. */}
      <ui.Carousel label="Super Mentors for Cohort 7">
        <ui.CarouselPrevious label="Previous mentors" />
        <ui.CarouselTrack>
          <ui.CarouselSlide>
            <ui.Card title="Nishant Bhaskar" description="Staff Software Engineer · Google" />
          </ui.CarouselSlide>
          <ui.Card title="Ritika Menon" description="SDE III · Amazon" />
        </ui.CarouselTrack>
        <ui.CarouselNext label="Next mentors" />
        <ui.CarouselDots label="Mentor pages" />
      </ui.Carousel>
      <ui.Carousel
        label="Campus life"
        perView="2"
        items={[{ title: 'Hostel' }, { title: 'Library', href: '/campus/library' }]}
      />
    </>
  ),
  CarouselTrack: 'Carousel',
  CarouselSlide: 'Carousel',
  CarouselPrevious: 'Carousel',
  CarouselNext: 'Carousel',
  CarouselDots: 'Carousel',
};

export default samples;
