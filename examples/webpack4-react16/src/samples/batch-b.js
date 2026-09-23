import * as React from 'react';

/**
 * Batch B samples. Only the batch B agent edits this file. See ./index.js.
 */
export default {
  Checkbox: (ui) => (
    <>
      <ui.Checkbox aria-label="Send me placement updates" />
      <ui.Checkbox aria-label="Marksheet is accurate" defaultChecked />
      <ui.Checkbox aria-label="All modules" checked="indeterminate" />
      <ui.Checkbox aria-label="Locked by ops" defaultChecked disabled />
    </>
  ),
  RadioGroup: (ui) => (
    <ui.RadioGroup aria-label="Preferred campus" defaultValue="bengaluru">
      <ui.RadioGroupItem value="bengaluru" aria-label="Bengaluru" />
      <ui.RadioGroupItem value="pune" aria-label="Pune" />
      <ui.RadioGroupItem value="online" aria-label="Online" disabled />
    </ui.RadioGroup>
  ),
  RadioGroupItem: 'RadioGroup',
  Switch: (ui) => (
    <>
      <ui.Switch aria-label="Email notifications" />
      <ui.Switch aria-label="Show my profile to recruiters" defaultChecked />
      <ui.Switch aria-label="Recruiter visibility" defaultChecked pending />
    </>
  ),
  SwitchStatus: (ui) => <ui.SwitchStatus pending label="Saving recruiter visibility" />,
  ToggleButton: (ui) => (
    <>
      <ui.ToggleButton>Bookmark</ui.ToggleButton>
      <ui.ToggleButton defaultPressed>Bookmarked</ui.ToggleButton>
    </>
  ),
  Slider: (ui) => (
    <>
      <ui.Slider aria-label="Weekly study hours" max={60} defaultValue={[30]} />
      <ui.Slider
        thumbLabels={['Minimum annual fee', 'Maximum annual fee']}
        max={12}
        defaultValue={[3, 9]}
        tooltip="always"
        formatValue={(v) => `₹${v}L`}
      />
    </>
  ),
  ProgressBar: (ui) => (
    <>
      <ui.ProgressBar aria-label="Module 4 of 12" value={33} />
      <ui.ProgressBar aria-label="Uploading transcript.pdf" />
    </>
  ),
};
