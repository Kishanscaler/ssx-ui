import * as React from 'react';

/** Batch M5 (molecules M5) samples. Only the batch M5 agent edits this file. See ./index.js. */
const samples = {
  Alert: (ui) => (
    <>
      <ui.Alert
        tone="danger"
        title="Document rejected · Class XII marksheet"
        description="Re-upload a full-page scan before 18 Mar 2026."
        actionLabel="Re-upload document"
        actionHref="/documents"
        dismissible
        dismissLabel="Dismiss the document rejection message"
      />
      <ui.Alert tone="warning" icon={false}>
        <ui.AlertTitle>Second fee instalment due 30 Nov 2026</ui.AlertTitle>
        <ui.AlertDescription>
          ₹2,75,000 outstanding. <ui.Link href="/pay">Pay now</ui.Link>.
        </ui.AlertDescription>
        <ui.AlertActions>
          <ui.Button size="sm" variant="secondary">Request the deferred plan</ui.Button>
        </ui.AlertActions>
      </ui.Alert>
    </>
  ),
  AlertTitle: 'Alert',
  AlertDescription: 'Alert',
  AlertActions: 'Alert',
  Banner: (ui) => (
    <ui.Banner tone="brand" actionLabel="Register interest" actionHref="/apply" dismissible>
      Applications for the Batch of 2030 open on <strong>1 Aug 2026</strong>.
    </ui.Banner>
  ),
  EmptyState: (ui) => (
    <>
      <ui.EmptyState
        icon={
          <svg viewBox="0 0 256 256">
            <circle cx="128" cy="128" r="96" />
          </svg>
        }
        title="No cohorts yet"
        description="Create your first one and applications will start landing here."
        actionLabel="Create a cohort"
        actionHref="/cohorts/new"
      />
      <ui.EmptyState>
        <ui.EmptyStateArt tone="danger">
          <svg viewBox="0 0 256 256">
            <circle cx="128" cy="128" r="96" />
          </svg>
        </ui.EmptyStateArt>
        <ui.EmptyStateTitle>We couldn’t load the placement report</ui.EmptyStateTitle>
        <ui.EmptyStateDescription>Quote reference PLC-5502 to support.</ui.EmptyStateDescription>
        <ui.EmptyStateActions>
          <ui.Button>Try again</ui.Button>
        </ui.EmptyStateActions>
      </ui.EmptyState>
    </>
  ),
  EmptyStateArt: 'EmptyState',
  EmptyStateTitle: 'EmptyState',
  EmptyStateDescription: 'EmptyState',
  EmptyStateActions: 'EmptyState',
  Stepper: (ui) => (
    <>
      <ui.Stepper
        aria-label="Application progress"
        currentStep={3}
        steps={[
          { label: 'Personal details' },
          { label: 'Academic record' },
          { label: 'Aptitude test slot' },
          { label: 'Payment' },
        ]}
      />
      <ui.Stepper orientation="vertical" aria-label="Admissions progress">
        <ui.StepperItem status="complete" label="Submission" description="Submitted 4 Mar 2026" />
        <ui.StepperItem status="error">
          <ui.StepperLabel>Documents</ui.StepperLabel>
          <ui.StepperDescription>Marksheet rejected</ui.StepperDescription>
        </ui.StepperItem>
        <ui.StepperItem status="current" label="Interview Round" />
      </ui.Stepper>
    </>
  ),
  StepperItem: 'Stepper',
  StepperLabel: 'Stepper',
  StepperDescription: 'Stepper',
  Timestamp: (ui) => (
    <>
      <ui.Timestamp date="2026-03-04T23:42:00+05:30" />
      <ui.Timestamp date="2026-03-04T23:42:00+05:30" format="both" />
      <ui.Timestamp date="2026-03-04T23:42:00+05:30" format="relative" tone="danger" />
      <ui.Timestamp date="2026-03-04T23:42:00+05:30" format="date" />
    </>
  ),
  MetadataList: (ui) => (
    <ui.MetadataList
      aria-label="Student record"
      items={[
        { term: 'Application ID', value: 'SST-2029-0416' },
        { term: 'Interview panel', value: '' },
      ]}
    >
      <ui.MetadataItem term="Submitted">
        <ui.Timestamp date="2026-03-04T23:42:00+05:30" />
      </ui.MetadataItem>
      <ui.MetadataItem>
        <ui.MetadataTerm>Status</ui.MetadataTerm>
        <ui.MetadataDescription>
          <ui.Badge tone="warning">In review</ui.Badge>
        </ui.MetadataDescription>
      </ui.MetadataItem>
    </ui.MetadataList>
  ),
  MetadataItem: 'MetadataList',
  MetadataTerm: 'MetadataList',
  MetadataDescription: 'MetadataList',
};

export default samples;
