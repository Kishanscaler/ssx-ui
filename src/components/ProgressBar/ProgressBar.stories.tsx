import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ProgressBar } from './ProgressBar';

const meta = {
  title: 'Atoms/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Determinate progress through a task with a knowable end. No `value` = indeterminate',
          '(duration genuinely unknown); no notion of "how far" at all = Spinner.',
          '',
          '`role="progressbar"` with `aria-valuemin/max/now` in the task\'s own units — `min={0}',
          'max={12} value={4}` fills a third. Indeterminate omits `aria-valuenow`. Needs a name',
          '(`aria-label` / `aria-labelledby`); `aria-valuetext` says it in words.',
        ].join('\n'),
      },
    },
  },
  args: { 'aria-label': 'Module 4 of 12 complete', value: 33 },
  decorators: [(Story) => <div className="max-w-2xl">{Story()}</div>],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Spec = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid gap-2">
    <span className="text-xs font-semibold text-content-secondary">{label}</span>
    {children}
  </div>
);

export const Playground: Story = {};

export const Determinate: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-6">
      <Spec label="0% · empty track"><ProgressBar aria-label="Capstone project progress" value={0} /></Spec>
      <Spec label="33%"><ProgressBar aria-label="Module 4 of 12 complete" value={33} /></Spec>
      <Spec label="72%"><ProgressBar aria-label="Uploading transcript.pdf, 72 percent" value={72} /></Spec>
      <Spec label="own units · 4 of 12 modules">
        <ProgressBar aria-label="B.Sc. Computer Science & AI — Year 1 modules" min={0} max={12} value={4} aria-valuetext="Module 4 of 12 complete" />
      </Spec>
      <Spec label="complete · 100%"><ProgressBar aria-label="Data Structures & Algorithms — Week 6 complete" value={100} /></Spec>
    </div>
  ),
};

export const Indeterminate: Story = {
  args: { value: null, 'aria-label': 'Uploading transcript.pdf' },
};

export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
        <div className="flex items-baseline justify-between">
          <span id="pb-mod" className="text-sm font-semibold text-content">Module 4 of 12 complete</span>
          <span className="text-sm text-content-secondary tabular-nums">33%</span>
        </div>
        <ProgressBar aria-labelledby="pb-mod" value={33} aria-valuetext="Module 4 of 12 complete" />
        <p className="m-0 text-sm text-content-secondary">
          Next up: Data Structures &amp; Algorithms — Week 6. Due <span className="tabular-nums">14 Mar 2026, 11:59 PM</span>.
        </p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <span className="truncate text-sm font-semibold text-content">Aarav_Krishnan_Class12_Marksheet_CBSE_2025_attested.pdf</span>
          <span className="text-sm text-content-secondary tabular-nums">72%</span>
        </div>
        <ProgressBar aria-label="Uploading the attested Class 12 marksheet" value={72} />
        <p className="m-0 text-sm text-content-secondary"><span className="tabular-nums">6.1 MB</span> of <span className="tabular-nums">8.4 MB</span> — about 4 seconds left.</p>
      </div>
    </div>
  ),
};

/** Controlled from outside: the fill animates between values (static under reduced motion). */
export const Live: Story = {
  parameters: { controls: { disable: true } },
  render: function LiveStory() {
    const [v, setV] = React.useState(10);
    React.useEffect(() => {
      const t = window.setInterval(() => setV((x) => (x >= 100 ? 0 : x + 10)), 700);
      return () => window.clearInterval(t);
    }, []);
    return <ProgressBar aria-label="Uploading" value={v} />;
  },
};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-4">
      {[0, 33, 72, 100].map((v) => <ProgressBar key={v} aria-label={`${v}%`} value={v} />)}
      <ProgressBar aria-label="indeterminate" />
    </div>
  ),
};
