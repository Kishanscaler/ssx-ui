import * as React from 'react';

/** Batch O5 (organisms O5) samples. Only the batch O5 agent edits this file. See ./index.js. */
const samples = {
  DisplayBanner: (ui) => (
    <>
      <ui.DisplayBanner
        surface="solid"
        tone="brand"
        eyebrow="Admissions open"
        title="Become a full-stack"
        titleMuted="AI engineer"
        description="A 12-month programme with live classes and placement support."
        primaryAction={{ label: 'Apply now', href: '/apply' }}
        secondaryAction={{ label: 'Brochure', href: '/brochure.pdf' }}
        countdownTo="2030-01-01T00:00:00+05:30"
        countdownLabel="1 Jan 2030, 12:00 AM IST"
        finePrint="T&C apply."
        mediaSrc="/art.png"
      />
      <ui.DisplayBanner href="/programmes/ai" surface="image" title="Open day" mediaSrc="/campus.jpg" />
      <ui.DisplayBanner surface="glass" tone="inverse" layout="wide">
        <ui.DisplayBannerContent>
          <ui.DisplayBannerEyebrow>Placements</ui.DisplayBannerEyebrow>
          <ui.DisplayBannerTitle>
            Hire from Scaler <ui.DisplayBannerTitleMuted>in 30 days</ui.DisplayBannerTitleMuted>
          </ui.DisplayBannerTitle>
          <ui.DisplayBannerDescription>1,200+ partner companies.</ui.DisplayBannerDescription>
          <ui.DisplayBannerCountdown to="2030-01-01T00:00:00Z" label="1 Jan 2030">
            Drive closes in
          </ui.DisplayBannerCountdown>
          <ui.DisplayBannerActions>
            <ui.DisplayBannerArrowLink href="/hire">Post a role</ui.DisplayBannerArrowLink>
          </ui.DisplayBannerActions>
          <ui.DisplayBannerFinePrint>Terms apply.</ui.DisplayBannerFinePrint>
        </ui.DisplayBannerContent>
        <ui.DisplayBannerMedia inset>
          <ui.DisplayBannerPanel>92% placed</ui.DisplayBannerPanel>
        </ui.DisplayBannerMedia>
      </ui.DisplayBanner>
    </>
  ),
  DisplayBannerContent: 'DisplayBanner',
  DisplayBannerEyebrow: 'DisplayBanner',
  DisplayBannerTitle: 'DisplayBanner',
  DisplayBannerTitleMuted: 'DisplayBanner',
  DisplayBannerDescription: 'DisplayBanner',
  DisplayBannerActions: 'DisplayBanner',
  DisplayBannerArrowLink: 'DisplayBanner',
  DisplayBannerCountdown: 'DisplayBanner',
  DisplayBannerFinePrint: 'DisplayBanner',
  DisplayBannerMedia: 'DisplayBanner',
  DisplayBannerPanel: 'DisplayBanner',
};

export default samples;
