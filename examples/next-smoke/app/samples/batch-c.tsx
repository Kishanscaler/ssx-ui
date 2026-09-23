import type { Samples } from './types';

/**
 * Batch C samples. Only the batch C agent edits this file. See ./index.tsx.
 *
 *   Checkbox: (ui) => <ui.Checkbox aria-label="Accept terms" />,
 *   SelectItem: 'Select', // rendered inside the Select sample
 */
const samples: Samples = {
  Textarea: (ui) => (
    <div className="grid w-full gap-3 md:grid-cols-2">
      <ui.Textarea aria-label="Why SST?" placeholder="Tell us in your own words." />
      <ui.Textarea aria-label="Invalid" aria-invalid defaultValue="Too short." rows={3} />
      <ui.Textarea aria-label="Read only" readOnly defaultValue="Draft autosaved." rows={3} />
      <ui.Textarea aria-label="Disabled" disabled defaultValue="Submitted." rows={3} />
    </div>
  ),
  NumberInput: (ui) => (
    <>
      <ui.NumberInput
        aria-label="Credits"
        defaultValue={18}
        min={12}
        max={24}
        decrementLabel="Decrease credits"
        incrementLabel="Increase credits"
      />
      <ui.NumberInput aria-label="Credits, at maximum" defaultValue={24} min={12} max={24} />
      <ui.NumberInput aria-label="Credits, bare" stepper={false} defaultValue={18} />
      <ui.NumberInput aria-label="Credits, disabled" defaultValue={18} disabled />
    </>
  ),
  Select: (ui) => (
    <div className="grid w-full gap-3 md:grid-cols-3">
      <ui.Select>
        <ui.SelectTrigger aria-label="Programme">
          <ui.SelectValue placeholder="Choose a programme…" />
        </ui.SelectTrigger>
        <ui.SelectContent>
          <ui.SelectGroup>
            <ui.SelectLabel>Undergraduate</ui.SelectLabel>
            <ui.SelectItem value="sst-ug" description="4-year residential · Bengaluru">
              B.Sc. Computer Science &amp; AI
            </ui.SelectItem>
            <ui.SelectItem value="ssb-ug" description="AI-first business programme">
              Scaler School of Business
            </ui.SelectItem>
          </ui.SelectGroup>
          <ui.SelectSeparator />
          <ui.SelectItem value="cert" disabled>
            Certificate in Data Science — intake closed
          </ui.SelectItem>
        </ui.SelectContent>
      </ui.Select>
      <ui.Select defaultValue="c7">
        <ui.SelectTrigger size="sm" aria-label="Cohort">
          <ui.SelectValue />
        </ui.SelectTrigger>
        <ui.SelectContent>
          <ui.SelectItem value="c7">Cohort 7 · Bengaluru</ui.SelectItem>
          <ui.SelectItem value="c8">Cohort 8 · Pune</ui.SelectItem>
        </ui.SelectContent>
      </ui.Select>
      <ui.Select disabled>
        <ui.SelectTrigger size="lg" aria-label="Campus" aria-invalid>
          <ui.SelectValue placeholder="Campus" />
        </ui.SelectTrigger>
        <ui.SelectContent>
          <ui.SelectItem value="blr">Bengaluru</ui.SelectItem>
        </ui.SelectContent>
      </ui.Select>
    </div>
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
    <div className="grid w-full gap-3 md:grid-cols-2">
      <ui.PhoneInput aria-label="Guardian mobile" name="guardian" />
      <ui.PhoneInput aria-label="Guardian mobile, filled" defaultValue="+919845021174" />
      <ui.PhoneInput aria-label="Overseas mobile" defaultValue="+971501234567" flag="iso" />
      <ui.PhoneInput aria-label="Invalid mobile" aria-invalid defaultValue="+91984502" />
    </div>
  ),
};

export default samples;
