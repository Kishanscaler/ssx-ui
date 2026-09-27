import * as React from 'react';

/** Batch M7 (InputGroup and form-level patterns) samples. Only the batch M7 agent edits this file. See ./index.js. */
const samples = {
  // Styles the ONE control passed to it and renders nothing of its own, so it
  // needs a child to produce a [data-slot] (the control gets
  // data-slot="input-group-control").
  InputGroupControl: (ui) => (
    <ui.InputGroup>
      <ui.InputGroupAddon>
        <ui.InputGroupText>₹</ui.InputGroupText>
      </ui.InputGroupAddon>
      <ui.InputGroupControl>
        <ui.NumberInput aria-label="Programme fee" stepper={false} defaultValue={195000} />
      </ui.InputGroupControl>
    </ui.InputGroup>
  ),
  // Renders nothing without errors, so it needs data to produce a [data-slot].
  FormErrorSummary: (ui) => (
    <ui.FormErrorSummary
      autoFocus={false}
      errors={[
        { fieldId: 'full-name', message: 'Enter your full name, as on your Class XII marksheet' },
        { fieldId: 'scaler-email', message: 'Enter only the part before @scaler.com' },
      ]}
    />
  ),
};

export default samples;
