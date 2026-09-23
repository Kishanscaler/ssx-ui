import type { Samples } from './types';

/** Batch M1 (molecules M1) samples. Only the batch M1 agent edits this file. See ./index.tsx. */
const samples: Samples = {
  Field: (ui) => (
    <>
      <ui.Field label="Scaler email" help="We send cohort announcements here." required>
        <ui.Input type="email" defaultValue="aarav.k@sst.scaler.com" />
      </ui.Field>
      <ui.Field>
        <ui.FieldLabel>SST roll number</ui.FieldLabel>
        <ui.FieldControl>
          <ui.Input defaultValue="SST-2029-41" />
        </ui.FieldControl>
        <ui.FieldHelp>Printed on your admission letter.</ui.FieldHelp>
        <ui.FieldError>Roll numbers are 13 characters.</ui.FieldError>
      </ui.Field>
      <ui.FieldSet legend="Which placement drives?" help="Pick every track." variant="choices">
        <ui.Field label="Product engineering" orientation="horizontal">
          <ui.Checkbox defaultChecked />
        </ui.Field>
      </ui.FieldSet>
    </>
  ),
  FieldControl: 'Field',
  FieldHelp: 'Field',
  FieldError: 'Field',
  Menu: (ui) => (
    // Open, non-modal: the server renders the trigger (Radix portals only on
    // the client), the client then mounts the panel without locking the page.
    <ui.Menu defaultOpen modal={false}>
      <ui.MenuTrigger asChild>
        <ui.Button variant="secondary">Cohort actions</ui.Button>
      </ui.MenuTrigger>
      <ui.MenuContent>
        <ui.MenuGroup>
          <ui.MenuLabel>Share</ui.MenuLabel>
          <ui.MenuItem shortcut="⌘E">Export CSV</ui.MenuItem>
          <ui.MenuItem description="Copies the module plan, not the students">Duplicate cohort</ui.MenuItem>
          <ui.MenuItem disabled>Archive</ui.MenuItem>
        </ui.MenuGroup>
        <ui.MenuCheckboxItem defaultChecked>Show archived</ui.MenuCheckboxItem>
        <ui.MenuRadioGroup defaultValue="c7">
          <ui.MenuRadioItem value="c7">Cohort 7 · Bengaluru</ui.MenuRadioItem>
          <ui.MenuRadioItem value="c8">Cohort 8 · Pune</ui.MenuRadioItem>
        </ui.MenuRadioGroup>
        <ui.MenuSeparator />
        <ui.MenuItem variant="danger">Delete cohort</ui.MenuItem>
      </ui.MenuContent>
    </ui.Menu>
  ),
  MenuTrigger: 'Menu',
  MenuContent: 'Menu',
  MenuItem: 'Menu',
  MenuCheckboxItem: 'Menu',
  MenuRadioGroup: 'Menu',
  MenuRadioItem: 'Menu',
  MenuGroup: 'Menu',
  MenuLabel: 'Menu',
  MenuSeparator: 'Menu',
};

export default samples;
