import type { Samples } from './types';

/** Batch O2 (organisms O2) samples. Only the batch O2 agent edits this file. See ./index.tsx. */
const samples: Samples = {
  SideDrawer: (ui) => (
    // Closed: the server renders the triggers only (Radix portals the panel on
    // the client, when opened).
    <>
      <ui.SideDrawer>
        <ui.SideDrawerTrigger asChild>
          <ui.Button>Log a mentor session</ui.Button>
        </ui.SideDrawerTrigger>
        <ui.SideDrawerContent>
          <ui.SideDrawerHeader eyebrow="Aarav Krishnan · SST-2029-0416">
            <ui.SideDrawerTitle>Log a mentor session</ui.SideDrawerTitle>
            <ui.SideDrawerDescription>Visible to the student and their mentor.</ui.SideDrawerDescription>
          </ui.SideDrawerHeader>
          <ui.SideDrawerBody>Session form</ui.SideDrawerBody>
          <ui.SideDrawerFooter>
            <ui.SideDrawerClose asChild>
              <ui.Button variant="tertiary">Cancel</ui.Button>
            </ui.SideDrawerClose>
          </ui.SideDrawerFooter>
        </ui.SideDrawerContent>
      </ui.SideDrawer>
      <ui.SideDrawer title="Filter the roster" trigger="Filter the roster" side="left" confirmLabel="Show 84 students" />
    </>
  ),
  SideDrawerTrigger: 'SideDrawer',
  SideDrawerContent: 'SideDrawer',
  SideDrawerHeader: 'SideDrawer',
  SideDrawerTitle: 'SideDrawer',
  SideDrawerDescription: 'SideDrawer',
  SideDrawerBody: 'SideDrawer',
  SideDrawerFooter: 'SideDrawer',
  SideDrawerClose: 'SideDrawer',
  BottomSheet: (ui) => (
    <>
      <ui.BottomSheet>
        <ui.BottomSheetTrigger asChild>
          <ui.Button variant="secondary">Filter applicants</ui.Button>
        </ui.BottomSheetTrigger>
        <ui.BottomSheetContent>
          <ui.BottomSheetHeader eyebrow="Admissions · Batch of 2029">
            <ui.BottomSheetTitle>Filter applicants</ui.BottomSheetTitle>
            <ui.BottomSheetDescription>214 applicants match.</ui.BottomSheetDescription>
          </ui.BottomSheetHeader>
          <ui.BottomSheetBody>
            <ui.BottomSheetActions>
              <ui.BottomSheetClose asChild>
                <ui.Button>Show 214 applicants</ui.Button>
              </ui.BottomSheetClose>
            </ui.BottomSheetActions>
          </ui.BottomSheetBody>
        </ui.BottomSheetContent>
      </ui.BottomSheet>
      <ui.BottomSheet title="Sort applicants" trigger="Sort by" confirmLabel="Apply" />
    </>
  ),
  BottomSheetTrigger: 'BottomSheet',
  BottomSheetContent: 'BottomSheet',
  BottomSheetHeader: 'BottomSheet',
  BottomSheetTitle: 'BottomSheet',
  BottomSheetDescription: 'BottomSheet',
  BottomSheetBody: 'BottomSheet',
  BottomSheetActions: 'BottomSheet',
  BottomSheetClose: 'BottomSheet',
  CommandPalette: (ui) => (
    // Closed: the trigger (and its ⌘K keycaps) only; the palette portals on the client.
    <ui.CommandPalette
      trigger="Search everything"
      placeholder="Search students, cohorts and commands…"
      groups={[
        {
          heading: 'Students',
          items: [{ value: 'sst-2029-0416', label: 'Aarav Krishnan', detail: '· SST-2029-0416 · Cohort 7' }],
        },
        { heading: 'Commands', items: [{ value: 'new-slot', label: 'Create an interview slot', shortcut: '⌘N' }] },
      ]}
    />
  ),
};

export default samples;
