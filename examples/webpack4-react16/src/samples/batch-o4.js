import * as React from 'react';

/** Batch O4 (organisms O4) samples. Only the batch O4 agent edits this file. See ./index.js. */
const samples = {
  SideNav: (ui) => (
    <ui.SideNav
      aria-label="Admissions operations"
      items={[
        {
          label: 'Pipeline',
          items: [
            { label: 'Overview', href: '/overview' },
            { label: 'Applicants', href: '/applicants', current: true },
            { label: 'Interview slots', href: '/slots', badge: '18', badgeTone: 'brand' },
          ],
        },
        { label: 'Cohorts', collapsible: true, items: [{ label: 'Batch of 2029', href: '/cohorts/2029' }] },
        { label: 'Console settings', href: '/settings' },
      ]}
    />
  ),
  // A collapsible rail (client SideNavRail under the server SideNav).
  SideNavCollapseTrigger: (ui) => (
    <ui.SideNav aria-label="Console navigation" defaultCollapsed>
      <ui.SideNavItem href="/overview">Overview</ui.SideNavItem>
      <ui.SideNavCollapseTrigger />
    </ui.SideNav>
  ),
  SideNavGroup: 'SideNav',
  SideNavItem: 'SideNav',
  // Compound, with the small-screen trigger in the top bar.
  AppShell: (ui) => (
    <ui.AppShell variant="embedded">
      <ui.AppShellSide>
        <ui.SideNav aria-label="Student navigation">
          <ui.SideNavGroup label="Learn">
            <ui.SideNavItem href="/dashboard">Dashboard</ui.SideNavItem>
            <ui.SideNavItem href="/modules" current>
              Modules
            </ui.SideNavItem>
          </ui.SideNavGroup>
        </ui.SideNav>
      </ui.AppShellSide>
      <ui.AppShellMain>
        <ui.TopNav collapse="scroll">
          <ui.AppShellNavTrigger />
          <ui.TopNavBrand href="/" aria-label="Scaler home" />
        </ui.TopNav>
        <ui.AppShellContent>Data Structures &amp; Algorithms · Week 6 of 14</ui.AppShellContent>
      </ui.AppShellMain>
    </ui.AppShell>
  ),
  AppShellSide: 'AppShell',
  AppShellMain: 'AppShell',
  AppShellContent: 'AppShell',
  AppShellNavTrigger: 'AppShell',
  FileUpload: (ui) => (
    <ui.Field label="Week 6 submission">
      <ui.FileUpload accept=".pdf,.zip,.ipynb,.py" maxSize={25 * 1024 * 1024} title="Drop your submission here" />
    </ui.Field>
  ),
  // Row actions need handlers, which cannot cross from a Server Component.
  FileUploadList: (ui) => (
    <ui.FileUploadList aria-label="Attached files">
      <ui.FileUploadItem name="avl-order-statistic-trees.ipynb" size={12373196} status="uploading" progress={36} />
      <ui.FileUploadItem name="week-6-writeup.pdf" size={1468006} status="complete" />
    </ui.FileUploadList>
  ),
  FileUploadItem: 'FileUploadList',
  DatePicker: (ui) => (
    <ui.Field label="Interview date" help="Weekends are closed. Slots release 10 days ahead.">
      <ui.DatePicker
        defaultValue="2026-03-18"
        today="2026-03-12"
        min="2026-03-12"
        disabledDaysOfWeek={[0, 6]}
        calendarLabel="Choose an interview date"
        presets={[{ label: 'Next open slot', value: '2026-03-13' }]}
      />
    </ui.Field>
  ),
  Calendar: (ui) => <ui.Calendar today="2026-03-12" defaultValue="2026-03-14" disabledDates={['2026-03-21']} />,
};

export default samples;
