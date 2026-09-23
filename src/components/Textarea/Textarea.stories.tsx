import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Textarea } from './Textarea';

const SOP =
  "I started writing code in Class 9 because our school library's issue register kept losing entries, and the librarian in Nashik let me replace it with a small Python script that eventually tracked four thousand books. That project taught me more about edge cases than any exam has — returns dated before issues, two students with identical names, a power cut mid-write that corrupted the CSV. I want the four-year residential programme because I have hit the ceiling of what I can teach myself alone.";

const meta = {
  title: 'Atoms/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Multi-line free text where the applicant genuinely needs room: a statement of purpose,',
          'mentor feedback, an incident note. Do not use it for anything you intend to parse.',
          '',
          'It is the **Input recipe** (`inputVariants`) called as a recipe, so the border, fill,',
          'focus ring, `aria-invalid`, disabled fill and dashed read-only are Input’s exactly. Only',
          'the geometry differs: height from `rows` (or the content with `autoResize`), even padding.',
          '',
          '"Over the limit" is an **invalid state** (`aria-invalid` + an error), not a `maxLength` that',
          'stops typing mid-sentence. The counter belongs to Field, opposite the label.',
        ].join('\n'),
      },
    },
  },
  args: {
    placeholder: 'Tell us in your own words. 200–1500 characters.',
    rows: 4,
    size: 'md',
    'aria-label': 'Why Scaler School of Technology?',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    rows: { control: { type: 'number', min: 1, max: 12 } },
    autoResize: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    'aria-invalid': { control: 'boolean', name: 'aria-invalid' },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', maxWidth: 1200 }}>
    {children}
  </div>
);

const labelStyle: React.CSSProperties = {
  font: 'var(--font-weight-semibold) var(--font-size-sm)/1.4 var(--font-family-sans)',
  color: 'var(--content-primary)',
};

const Spec = ({ tag, label, htmlFor, count, countDanger, children }: {
  tag: string;
  label: string;
  htmlFor: string;
  count?: string;
  countDanger?: boolean;
  children: React.ReactNode;
}) => (
  <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
    <span style={{ font: '600 11px/1 var(--font-family-mono)', color: 'var(--content-secondary)', textTransform: 'uppercase' }}>{tag}</span>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <label htmlFor={htmlFor} style={labelStyle}>{label}</label>
      {count ? (
        <span
          id={`${htmlFor}-count`}
          className={`shrink-0 whitespace-nowrap text-sm tabular-nums ${countDanger ? 'text-danger-content' : 'text-content-secondary'}`}
        >
          {count}
        </span>
      ) : null}
    </div>
    {children}
  </div>
);

const FieldError = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <p id={id} className="text-sm text-danger-content">{children}</p>
);

/** Every prop, live. */
export const Playground: Story = {};

/** The preview's state row: rest, filled, read-only, disabled, and the two invalid cases. */
export const States: Story = {
  render: () => (
    <Grid>
      <Spec tag="rest" label="Why Scaler School of Technology?" htmlFor="ta-rest">
        <Textarea id="ta-rest" placeholder="Tell us in your own words. 200–1500 characters." />
      </Spec>
      <Spec tag="read-only · locked draft" label="Why Scaler School of Technology?" htmlFor="ta-ro">
        <Textarea
          id="ta-ro"
          readOnly
          defaultValue="Draft autosaved 4 Mar 2026, 11:42 PM. Reopen the application from Admissions → My Application to keep editing."
        />
      </Spec>
      <Spec tag="filled · counter opposite the label" label="Why Scaler School of Technology?" htmlFor="ta-filled" count="842 / 1500">
        <Textarea id="ta-filled" rows={7} defaultValue={SOP} aria-describedby="ta-filled-count" />
      </Spec>
      <Spec tag="disabled · after submission" label="Why Scaler School of Technology?" htmlFor="ta-dis">
        <Textarea
          id="ta-dis"
          rows={3}
          disabled
          defaultValue="Submitted 4 Mar 2026, 11:42 PM. Applications cannot be edited after submission."
        />
      </Spec>
      <Spec tag="invalid · below the minimum" label="Why Scaler School of Technology? *" htmlFor="ta-inv" count="148 / 1500" countDanger>
        <Textarea
          id="ta-inv"
          rows={3}
          aria-invalid
          aria-describedby="ta-inv-err ta-inv-count"
          defaultValue="I want to join because I like computers and I think this will be good for my career and I have always been interested in technology since childhood."
        />
        <FieldError id="ta-inv-err">At least 200 characters are required.</FieldError>
      </Spec>
      <Spec tag="invalid · over the limit" label="Mentor feedback — DSA Week 6 *" htmlFor="ta-over" count="1612 / 1500" countDanger>
        <Textarea
          id="ta-over"
          rows={3}
          aria-invalid
          aria-describedby="ta-over-err ta-over-count"
          defaultValue="Aarav's solution to the sliding-window problem is correct and his complexity analysis is sound, but the write-up spends four paragraphs restating the problem before it reaches the invariant."
        />
        <FieldError id="ta-over-err">112 characters over the 1500-character limit.</FieldError>
      </Spec>
    </Grid>
  ),
};

/** Type size follows Input's scale so a text field and a text area in one form match. */
export const Sizes: Story = {
  render: () => (
    <Grid>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Spec key={size} tag={size} label="Incident note" htmlFor={`ta-${size}`}>
          <Textarea id={`ta-${size}`} size={size} rows={3} defaultValue="Projector in Lab 2 failed at 10:05." />
        </Spec>
      ))}
    </Grid>
  ),
};

/** `autoResize` grows with the content (`field-sizing: content`); elsewhere it keeps `rows`. */
export const AutoResize: Story = {
  args: { autoResize: true, rows: 2, defaultValue: SOP },
};

/** Controlled: the counter is the caller's, and "over" is aria-invalid rather than a wall. */
export const Controlled: Story = {
  render: () => {
    const Demo = () => {
      const [text, setText] = React.useState('Short answer.');
      const max = 120;
      const over = text.length > max;
      return (
        <div style={{ maxWidth: 420 }}>
          <Spec tag="controlled · live counter" label="Mentor feedback" htmlFor="ta-ctl" count={`${text.length} / ${max}`} countDanger={over}>
            <Textarea
              id="ta-ctl"
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-invalid={over || undefined}
              aria-describedby="ta-ctl-count"
            />
          </Spec>
        </div>
      );
    };
    return <Demo />;
  },
};
