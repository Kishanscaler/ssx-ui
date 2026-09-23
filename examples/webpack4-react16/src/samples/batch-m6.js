import * as React from 'react';

/** Batch M6 (molecules M6) samples. Only the batch M6 agent edits this file. See ./index.js. */
const samples = {
  Breadcrumbs: (ui) => (
    <>
      <ui.Breadcrumbs
        maxItems={4}
        items={[
          { label: 'Home', href: '/' },
          { label: 'Programmes', href: '/programmes' },
          { label: 'B.Sc CS & AI', href: '/programmes/bsc' },
          { label: 'Year 2', href: '/programmes/bsc/year-2' },
          { label: 'Semester 4', href: '/programmes/bsc/year-2/semester-4' },
          { label: 'Data Structures & Algorithms — Week 6', truncate: true },
        ]}
      />
      <ui.Breadcrumbs aria-label="Course path">
        <ui.BreadcrumbsItem>
          <ui.BreadcrumbsLink href="/ops">Admissions ops</ui.BreadcrumbsLink>
        </ui.BreadcrumbsItem>
        <ui.BreadcrumbsEllipsis items={[{ label: 'Batch of 2029', href: '/ops/2029' }]} />
        <ui.BreadcrumbsItem current truncate>
          Application SST-2029-0416
        </ui.BreadcrumbsItem>
      </ui.Breadcrumbs>
    </>
  ),
  BreadcrumbsItem: 'Breadcrumbs',
  BreadcrumbsLink: 'Breadcrumbs',
  BreadcrumbsEllipsis: 'Breadcrumbs',
  Pagination: (ui) => (
    <>
      <ui.Pagination count={128} defaultPage={18} aria-label="Applicant pages" />
      <ui.Pagination count={42} defaultPage={3} hrefTemplate="?page={page}" aria-label="Submissions pages" />
      <ui.Pagination count={42} defaultPage={3} variant="compact" aria-label="Graded pages, compact" />
    </>
  ),
  SelectableCard: (ui) => (
    <>
      <ui.SelectableCardGroup aria-label="Choose a fee plan" defaultValue="a" name="plan">
        <ui.SelectableCard value="a" eyebrow="Plan A" title="Pay in two instalments" description="₹2,75,000 now" />
        <ui.SelectableCard value="b" eyebrow="Plan B" title="Deferred, income-share" description="60% after placement" disabled>
          <ui.Badge>Closed</ui.Badge>
        </ui.SelectableCard>
      </ui.SelectableCardGroup>
      <ui.SelectableCardGroup type="multiple" aria-label="Electives" defaultValue={['ds']} columns="3">
        <ui.SelectableCard value="ds" eyebrow="Elective" title="Distributed Systems" />
        <ui.SelectableCard value="ml" eyebrow="Elective" title="Applied Machine Learning" />
      </ui.SelectableCardGroup>
      <ui.SelectableCard eyebrow="SST" title="Hostel on campus" defaultChecked />
    </>
  ),
  SelectableCardGroup: 'SelectableCard',
};

export default samples;
