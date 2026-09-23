import * as React from 'react';

/** Batch M3 (molecules M3) samples. Only the batch M3 agent edits this file. See ./index.js. */
const samples = {
  Popover: (ui) => (
    // Open: the server renders the trigger (Radix portals only on the client),
    // the client then mounts the panel.
    <ui.Popover defaultOpen>
      <ui.PopoverAnchor>
        <ui.PopoverTrigger asChild>
          <ui.Button variant="secondary">Invite reviewer</ui.Button>
        </ui.PopoverTrigger>
      </ui.PopoverAnchor>
      <ui.PopoverContent aria-label="Invite a reviewer to Cohort 7">
        <ui.Field label="Reviewer email" help="They will be added to the SSB Cohort 7 shortlisting queue.">
          <ui.Input type="email" defaultValue="meera.subramaniam@scaler.com" />
        </ui.Field>
        <ui.PopoverClose asChild>
          <ui.Button size="sm">Send invite</ui.Button>
        </ui.PopoverClose>
      </ui.PopoverContent>
    </ui.Popover>
  ),
  PopoverTrigger: 'Popover',
  PopoverAnchor: 'Popover',
  PopoverClose: 'Popover',
  PopoverContent: 'Popover',
  Tooltip: (ui) => (
    <ui.TooltipProvider>
      <ui.Tooltip defaultOpen>
        <ui.TooltipTrigger asChild>
          <ui.IconButton variant="secondary" aria-label="Download cohort roster">
            <svg viewBox="0 0 256 256" aria-hidden="true" />
          </ui.IconButton>
        </ui.TooltipTrigger>
        <ui.TooltipContent>Download roster (.csv)</ui.TooltipContent>
      </ui.Tooltip>
    </ui.TooltipProvider>
  ),
  TooltipProvider: 'Tooltip',
  TooltipTrigger: 'Tooltip',
  TooltipContent: 'Tooltip',
  HoverCard: (ui) => (
    <p>
      Week 9 System Design review is led by{' '}
      <ui.HoverCard>
        <ui.HoverCardTrigger asChild>
          <ui.Button variant="tertiary" size="sm">
            Ishita Raghunathan
          </ui.Button>
        </ui.HoverCardTrigger>
        <ui.HoverCardContent aria-label="Profile preview: Ishita Raghunathan">
          <ui.Text size="sm" tone="secondary">
            Principal Engineer · Distributed Systems
          </ui.Text>
        </ui.HoverCardContent>
      </ui.HoverCard>
      .
    </p>
  ),
  HoverCardTrigger: 'HoverCard',
  HoverCardContent: 'HoverCard',
  Toast: (ui) => (
    // The toasts and the viewport render nothing on the server (the viewport
    // mounts on the client); the Button is what an app renders beside them.
    <ui.ToastProvider>
      <ui.Button variant="secondary">Submit DSA Week 6</ui.Button>
      <ui.Toast variant="success" title="Assignment submitted" description="DSA Week 6 · 2 minutes early.">
        <ui.ToastAction altText="Open Submissions to undo">Undo</ui.ToastAction>
      </ui.Toast>
      <ui.Toast variant="danger">
        <ui.ToastTitle>Upload failed</ui.ToastTitle>
        <ui.ToastDescription>transcript.pdf exceeds the 10 MB limit.</ui.ToastDescription>
        <ui.ToastClose>Got it</ui.ToastClose>
      </ui.Toast>
      <ui.ToastViewport />
    </ui.ToastProvider>
  ),
  ToastProvider: 'Toast',
  ToastViewport: 'Toast',
  ToastAction: 'Toast',
  ToastClose: 'Toast',
  Toaster: (ui) => (
    // The imperative host renders nothing until toast() is called (client only).
    <>
      <ui.Toaster />
      <ui.Button variant="secondary">Upload transcript.pdf</ui.Button>
    </>
  ),
};

export default samples;
