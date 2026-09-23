import type { Samples } from './types';

/**
 * Batch B samples. Only the batch B agent edits this file. See ./index.tsx.
 * Server Component: no function props (formatValue, getAriaValueText, ...).
 */
const samples: Samples = {
  Checkbox: (ui) => (
    <div className="flex items-center gap-4">
      <ui.Checkbox aria-label="Send me placement updates" />
      <ui.Checkbox aria-label="Marksheet is accurate" defaultChecked />
      <ui.Checkbox aria-label="All modules" checked="indeterminate" />
      <ui.Checkbox aria-label="Accept terms" aria-invalid />
      <ui.Checkbox aria-label="Locked by ops" defaultChecked disabled />
    </div>
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
    <div className="flex items-center gap-4">
      <ui.Switch aria-label="Email notifications" />
      <ui.Switch aria-label="Show my profile to recruiters" defaultChecked />
      <ui.Switch aria-label="Two-factor authentication" defaultChecked disabled />
      <ui.Switch aria-label="Recruiter visibility" defaultChecked pending />
    </div>
  ),
  SwitchStatus: (ui) => <ui.SwitchStatus pending label="Saving recruiter visibility" />,
  ToggleButton: (ui) => (
    <div className="flex items-center gap-4">
      <ui.ToggleButton>Bookmark</ui.ToggleButton>
      <ui.ToggleButton defaultPressed>Bookmarked</ui.ToggleButton>
      <ui.ToggleButton defaultPressed disabled>
        Bookmarked
      </ui.ToggleButton>
    </div>
  ),
  Slider: (ui) => (
    <div className="grid w-full gap-6">
      <ui.Slider aria-label="Weekly study hours" max={60} defaultValue={[30]} />
      <ui.Slider
        thumbLabels={['Minimum annual fee, in lakh', 'Maximum annual fee, in lakh']}
        max={12}
        defaultValue={[3, 9]}
        tooltip="always"
      />
      <ui.Slider aria-label="Set by your mentor" max={60} defaultValue={[22]} disabled />
    </div>
  ),
  ProgressBar: (ui) => (
    <div className="grid w-full gap-3">
      <ui.ProgressBar aria-label="Module 4 of 12" value={33} />
      <ui.ProgressBar aria-label="Year 1 modules" min={0} max={12} value={4} aria-valuetext="Module 4 of 12 complete" />
      <ui.ProgressBar aria-label="Uploading transcript.pdf" />
    </div>
  ),
};

export default samples;
