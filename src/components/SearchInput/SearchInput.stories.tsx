import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field } from '../Field';
import { SearchInput, type SearchInputProps, type SearchInputSize } from './SearchInput';

const meta = {
  title: 'Molecules/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A query that narrows a set already on screen: leading magnifier, a clear button once there is',
          'something to clear (Escape does the same), an optional live result count. A query that navigates',
          'to a results page is a search **form**, not this.',
          '',
          'The field is `Input` (same recipe). `className` goes on the root; every other prop, the ref and',
          '`id` go on the `<input>`. Without a visible label, give it an `aria-label`.',
        ].join('\n'),
      },
    },
  },
  args: {
    'aria-label': 'Search students',
    placeholder: 'Search students, cohorts, application IDs…',
    value: 'system design capstone',
    size: 'md',
    loading: false,
    loadingText: 'Searching…',
    resultCount: '27 of 412 students match',
    clearLabel: 'Clear search',
    disabled: false,
    readOnly: false,
  },
  argTypes: {
    value: { control: 'text' },
    // `value` is always pinned (and two-way bound) in this Playground, so the
    // field is always fully controlled and `defaultValue` — only consulted
    // when `value` is left unset — never gets read here.
    defaultValue: {
      control: false,
      description: 'Ignored here: `value` is always set in this story, so the field never falls back to it.',
    },
    placeholder: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] satisfies SearchInputSize[] },
    loading: { control: 'boolean' },
    loadingText: { control: 'text' },
    resultCount: { control: 'text' },
    clearLabel: { control: 'text' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    'aria-label': { control: 'text' },
    onValueChange: { control: false },
    onClear: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="max-w-[420px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const Spec = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex min-w-[min(300px,100%)] flex-1 flex-col gap-2">
    <span className="text-xs font-semibold text-content-secondary">{label}</span>
    {children}
  </div>
);

/** Two-way: typing and clearing update the `value` control, and the control drives the field. */
export const Playground: Story = {
  render: function PlaygroundStory(args) {
    const [, updateArgs] = useArgs<SearchInputProps>();
    return <SearchInput {...args} onValueChange={(value) => updateArgs({ value })} />;
  },
};

/** A real filter: the count follows the query. */
export const LiveFilter: Story = {
  parameters: { controls: { disable: true } },
  render: function LiveFilterStory() {
    const students = ['Aarav Krishnan', 'Ishita Raghunathan', 'Meera Subramaniam', 'Rohan Iyer', 'Sushmita Krishnan'];
    const [q, setQ] = React.useState('krish');
    const hits = students.filter((s) => s.toLowerCase().includes(q.toLowerCase()));
    return (
      <div className="flex flex-col gap-3">
        <SearchInput
          aria-label="Search students"
          placeholder="Search students…"
          value={q}
          onValueChange={setQ}
          resultCount={`${hits.length} of ${students.length} students match`}
        />
        <ul className="m-0 list-none p-0 text-sm text-content">
          {hits.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    );
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  decorators: [(Story) => <div className="max-w-none"><Story /></div>],
  render: () => (
    <div className="flex max-w-[720px] flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="empty">
        <SearchInput aria-label="Search students" placeholder="Search students, cohorts, application IDs…" />
      </Spec>
      <Spec label="with a query typed + clear">
        <SearchInput aria-label="Search students" defaultValue="system design capstone" resultCount="27 of 412 students match" />
      </Spec>
      <Spec label="no matches">
        <SearchInput
          aria-label="Search students"
          defaultValue="quantitative finance elective — Hyderabad campus, Batch of 2029"
          resultCount="0 of 412 students match"
        />
      </Spec>
      <Spec label="loading results">
        <SearchInput aria-label="Search students" defaultValue="GSoC 2026" loading />
      </Spec>
      <Spec label="disabled">
        <SearchInput aria-label="Search students" placeholder="Search students…" disabled />
      </Spec>
      <Spec label="small">
        <SearchInput aria-label="Search modules" placeholder="Filter modules…" size="sm" />
      </Spec>
    </div>
  ),
};

export const InAField: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Find a student" help="Name, roll number or application ID.">
      <SearchInput placeholder="e.g. SST-2029-0416" />
    </Field>
  ),
};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <SearchInput key={size} size={size} aria-label={`Search ${size}`} defaultValue="capstone" />
      ))}
      <SearchInput aria-label="Search loading" defaultValue="GSoC" loading />
      <SearchInput aria-label="Search disabled" placeholder="Search students…" disabled />
      <SearchInput aria-label="Search invalid" defaultValue="x" aria-invalid />
    </div>
  ),
};
