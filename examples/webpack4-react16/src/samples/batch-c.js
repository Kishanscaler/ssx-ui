import * as React from 'react';

/**
 * Batch C samples. Only the batch C agent edits this file. See ./index.js.
 *
 *   Checkbox: (ui) => <ui.Checkbox aria-label="Accept terms" />,
 *   SelectItem: 'Select',  // rendered inside the Select sample
 */

/** A controlled PhoneInput + readout, so the legacy smoke exercises state on 16.12. */
function PhoneReadout({ ui }) {
  const [value, setValue] = React.useState('+919845021174');
  return (
    <>
      <ui.PhoneInput aria-label="Guardian mobile" value={value} onValueChange={setValue} />
      <output data-testid="phone-e164">{value}</output>
    </>
  );
}

export default {
  Textarea: (ui) => (
    <>
      <ui.Textarea aria-label="Why SST?" placeholder="Tell us in your own words." />
      <ui.Textarea aria-label="Invalid" aria-invalid defaultValue="Too short." rows={3} />
      <ui.Textarea aria-label="Read only" readOnly defaultValue="Draft autosaved." rows={3} />
    </>
  ),
  NumberInput: (ui) => (
    <>
      <ui.NumberInput aria-label="Credits" defaultValue={18} min={12} max={24} />
      <ui.NumberInput aria-label="Credits, bare" stepper={false} defaultValue={18} />
      <ui.NumberInput aria-label="Credits, disabled" defaultValue={18} disabled />
    </>
  ),
  Select: (ui) => (
    <>
      <ui.Select defaultValue="c7">
        <ui.SelectTrigger aria-label="Cohort">
          <ui.SelectValue placeholder="Choose a cohort…" />
        </ui.SelectTrigger>
        <ui.SelectContent>
          <ui.SelectGroup>
            <ui.SelectLabel>Bengaluru</ui.SelectLabel>
            <ui.SelectItem value="c7">Cohort 7 · Bengaluru</ui.SelectItem>
          </ui.SelectGroup>
          <ui.SelectSeparator />
          <ui.SelectItem value="c8" description="Day-scholar only">
            Cohort 8 · Pune
          </ui.SelectItem>
          <ui.SelectItem value="c9" disabled>
            Cohort 9 · intake not open
          </ui.SelectItem>
        </ui.SelectContent>
      </ui.Select>
      <ui.Select>
        <ui.SelectTrigger size="sm" aria-label="Programme" aria-invalid>
          <ui.SelectValue placeholder="Choose a programme…" />
        </ui.SelectTrigger>
        <ui.SelectContent>
          <ui.SelectItem value="sst">B.Sc. Computer Science &amp; AI</ui.SelectItem>
        </ui.SelectContent>
      </ui.Select>
    </>
  ),
  SelectContent: 'Select',
  SelectGroup: 'Select',
  SelectItem: 'Select',
  SelectLabel: 'Select',
  SelectScrollDownButton: 'Select',
  SelectScrollUpButton: 'Select',
  SelectSeparator: 'Select',
  SelectTrigger: 'Select',
  SelectValue: 'Select',
  OtpInput: (ui) => (
    <>
      <ui.OtpInput aria-label="Verification code" />
      <ui.OtpInput aria-label="Wrong code" aria-invalid defaultValue="284190" />
      <ui.OtpInput aria-label="Four digits" maxLength={4}>
        <ui.OtpInputGroup>
          <ui.OtpInputSlot index={0} />
          <ui.OtpInputSlot index={1} />
        </ui.OtpInputGroup>
        <ui.OtpInputGroup>
          <ui.OtpInputSlot index={2} />
          <ui.OtpInputSlot index={3} />
        </ui.OtpInputGroup>
      </ui.OtpInput>
    </>
  ),
  OtpInputGroup: 'OtpInput',
  OtpInputSlot: 'OtpInput',
  PhoneInput: (ui) => (
    <>
      <PhoneReadout ui={ui} />
      <ui.PhoneInput aria-label="Overseas mobile" defaultValue="+971501234567" flag="iso" />
    </>
  ),
};
