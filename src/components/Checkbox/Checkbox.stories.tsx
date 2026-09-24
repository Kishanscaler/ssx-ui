import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from './Checkbox';

const meta = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A binary opt-in toggled independently of its siblings. Several may be chosen at once;',
          'exactly-one is **RadioGroup**, and a setting that applies immediately is **Switch**.',
          '',
          'The atom is the box. The label is a `<label htmlFor>` with the text **inside** it, so the',
          'whole row is a hit target; a description is referenced with `aria-describedby`.',
          'Invalid is `aria-invalid`. `checked="indeterminate"` announces as mixed.',
          '',
          'Hover and pressed are live: point at and press the boxes below.',
        ].join('\n'),
      },
    },
  },
  args: { 'aria-label': 'Send me placement updates' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- story-only layout -------------------------------------------- */

const Spec = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-semibold text-content-secondary">{label}</span>
    {children}
  </div>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-start gap-x-10 gap-y-6">{children}</div>
);

/** The HTML `.check` row: box + label text inside one label element. */
function Row({
  id,
  children,
  disabled,
  ...props
}: React.ComponentProps<typeof Checkbox> & { id: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-start gap-2 text-base text-content">
      <Checkbox id={id} disabled={disabled} className="mt-0.5" {...props} />
      <label
        htmlFor={id}
        className={disabled ? 'cursor-not-allowed text-content-disabled' : 'cursor-pointer'}
      >
        {children}
      </label>
    </span>
  );
}

/* ---------- stories -------------------------------------------------------- */

export const Playground: Story = {
  argTypes: {
    // Radix only renders the hidden "bubble" input that carries `name` when
    // the control sits inside a <form>. This Playground has none, so
    // changing `name` has nothing to attach to — it is correct, not broken.
    name: {
      control: false,
      description: 'Only rendered (as a hidden native input) inside a <form> — invisible in this Playground.',
    },
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid>
      <Spec label="unchecked">
        <Row id="cb-1">Send me placement updates</Row>
      </Spec>
      <Spec label="checked">
        <Row id="cb-2" defaultChecked>
          I confirm my Class 12 marksheet is accurate
        </Row>
      </Spec>
      <Spec label="indeterminate">
        <Row id="cb-3" checked="indeterminate">
          All 12 modules selected
        </Row>
      </Spec>
      <Spec label="disabled">
        <Row id="cb-4" disabled>
          Defer to the next intake
        </Row>
      </Spec>
      <Spec label="disabled + checked">
        <Row id="cb-5" disabled defaultChecked>
          Bengaluru campus (locked by ops)
        </Row>
      </Spec>
    </Grid>
  ),
};

export const Invalid: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid max-w-xl gap-2">
      <Row id="cb-inv" aria-invalid aria-describedby="cb-inv-err" required>
        I accept the Scaler School of Technology scholarship terms{' '}
        <span className="text-danger-content">*</span>
      </Row>
      <p id="cb-inv-err" className="m-0 text-sm text-danger-content">
        You must accept the terms before the 14 Mar 2026 deadline.
      </p>
    </div>
  ),
};

export const WithDescription: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid max-w-2xl gap-2">
      <Row id="cb-desc" defaultChecked aria-describedby="cb-desc-help">
        Share my capstone repository with hiring partners
      </Row>
      <p id="cb-desc-help" className="m-0 text-sm text-content-secondary">
        Recruiters taking part in the Batch of 2029 placement drive will see your capstone README,
        commit history and demo video. You can withdraw this at any time from Profile → Privacy.
      </p>
    </div>
  ),
};

/** Controlled: the parent owns the value, including the tri-state "select all". */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const modules = ['DSA', 'System design', 'Web development'];
    const [picked, setPicked] = React.useState<string[]>(['DSA']);
    const all = picked.length === modules.length ? true : picked.length ? 'indeterminate' : false;
    return (
      <div className="grid gap-2">
        <Row
          id="cb-all"
          checked={all}
          onCheckedChange={(v) => setPicked(v === true ? modules : [])}
        >
          All modules ({picked.length} of {modules.length})
        </Row>
        <div className="grid gap-2 pl-6">
          {modules.map((m) => (
            <Row
              key={m}
              id={`cb-${m}`}
              checked={picked.includes(m)}
              onCheckedChange={(v) =>
                setPicked((p) => (v === true ? [...p, m] : p.filter((x) => x !== m)))
              }
            >
              {m}
            </Row>
          ))}
        </div>
      </div>
    );
  },
};

/** Review artifact: flip brand and theme in the toolbar. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid>
      <Spec label="rest">
        <Checkbox aria-label="rest" />
      </Spec>
      <Spec label="checked">
        <Checkbox aria-label="checked" defaultChecked />
      </Spec>
      <Spec label="indeterminate">
        <Checkbox aria-label="indeterminate" checked="indeterminate" />
      </Spec>
      <Spec label="invalid">
        <Checkbox aria-label="invalid" aria-invalid />
      </Spec>
      <Spec label="invalid + checked">
        <Checkbox aria-label="invalid checked" aria-invalid defaultChecked />
      </Spec>
      <Spec label="disabled">
        <Checkbox aria-label="disabled" disabled />
      </Spec>
      <Spec label="disabled + checked">
        <Checkbox aria-label="disabled checked" disabled defaultChecked />
      </Spec>
      <Spec label="disabled + indeterminate">
        <Checkbox aria-label="disabled indeterminate" disabled checked="indeterminate" />
      </Spec>
    </Grid>
  ),
};
