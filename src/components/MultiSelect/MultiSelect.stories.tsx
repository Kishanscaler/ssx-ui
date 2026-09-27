import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MultiSelect, type MultiSelectOption, type MultiSelectSize } from './MultiSelect';
import { Button } from '../Button';
import { Field } from '../Field';
import { Text } from '../Text';
import { Row, Spec } from '../Icon/_fixtures/story-layout';

const SIZES: MultiSelectSize[] = ['sm', 'md', 'lg'];

/** Skills a learner lists on their Scaler profile. */
const SKILLS: MultiSelectOption[] = [
  { value: 'python', label: 'Python', group: 'Languages' },
  { value: 'java', label: 'Java', group: 'Languages' },
  { value: 'cpp', label: 'C++', group: 'Languages', keywords: ['cpp'] },
  { value: 'go', label: 'Go', group: 'Languages', keywords: ['golang'] },
  { value: 'sql', label: 'SQL', group: 'Languages', keywords: ['postgres', 'mysql'] },
  { value: 'react', label: 'React', group: 'Frameworks & tools', keywords: ['frontend'] },
  { value: 'spring', label: 'Spring Boot', group: 'Frameworks & tools', keywords: ['java', 'backend'] },
  { value: 'django', label: 'Django', group: 'Frameworks & tools', keywords: ['python', 'backend'] },
  { value: 'pytorch', label: 'PyTorch', group: 'Frameworks & tools', keywords: ['ml', 'deep learning'] },
  { value: 'kafka', label: 'Kafka', group: 'Frameworks & tools', keywords: ['streaming'] },
  { value: 'docker', label: 'Docker', group: 'Frameworks & tools', keywords: ['containers'] },
  { value: 'kubernetes', label: 'Kubernetes', group: 'Frameworks & tools', keywords: ['k8s'] },
  { value: 'dsa', label: 'Data Structures & Algorithms', group: 'Concepts' },
  { value: 'lld', label: 'Low-level design', group: 'Concepts', keywords: ['lld', 'oop'] },
  { value: 'hld', label: 'System design (HLD)', group: 'Concepts', keywords: ['hld', 'distributed'] },
  {
    value: 'genai',
    label: 'Generative AI — module opens with Term 4',
    group: 'Concepts',
    disabled: true,
  },
];

/** Programmes a Super Mentor covers. */
const PROGRAMMES: MultiSelectOption[] = [
  'Scaler Academy — Software Development',
  'Scaler Data Science & Machine Learning',
  'Scaler DevOps & Cloud Computing',
  'Scaler Neovarsity — MS in Computer Science',
  'Scaler School of Technology — B.Tech Cohort 2026',
  'Scaler School of Business — PGP Management, Term 2',
].map((label, i) => ({ value: `programme-${i + 1}`, label }));

/** Interview cities a candidate will relocate to. */
const CITIES: MultiSelectOption[] = [
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Gurugram',
  'Noida',
  'Mumbai',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Remote (India)',
].map((label) => ({ value: label.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, ''), label }));

const meta = {
  title: 'Molecules/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Several values from a list too long for checkboxes: skills, programmes, relocation cities. Not for',
          'five options (a Checkbox group, or `ToggleButtonGroup variant="chips"` for a filter bar).',
          '',
          'The APG combobox with a multi-select listbox (`aria-multiselectable`, `aria-selected` = chosen): the',
          'field keeps focus; typing filters; ↓ / ↑ move; Enter toggles and the list stays open; Escape closes, a',
          'second Escape clears the text; Backspace in an empty field removes the last chip; ← walks onto the',
          'chips (Backspace / Delete remove one). Adds and removes are announced. `max` caps the selection.',
          '',
          'Its own component, not `Combobox multiple`: the value is an array shown as chips, the list stays open,',
          'and `aria-selected` means chosen rather than active. The options are the same `ComboboxOption` shape.',
          'Blurred, chips past `maxRows` rows or `maxVisibleChips` collapse into "+N more"; focused, all show.',
          'With `name`, one hidden input per value.',
        ].join('\n'),
      },
    },
  },
  args: {
    options: SKILLS,
    placeholder: 'Search skills…',
    listLabel: 'Skills',
    'aria-label': 'Skills',
    size: 'md',
    defaultValue: ['python', 'sql', 'dsa'],
    max: 8,
    maxRows: 2,
    clearInputOnSelect: true,
    shouldFilter: true,
    loading: false,
    disabled: false,
    name: 'skills',
  },
  argTypes: {
    options: { control: 'object' },
    placeholder: { control: 'text' },
    listLabel: { control: 'text' },
    size: { control: 'inline-radio', options: SIZES },
    value: { control: false, description: 'Controlled values. Use `defaultValue` here; see the Controlled story.' },
    defaultValue: { control: 'object' },
    max: { control: 'number' },
    maxVisibleChips: { control: 'number' },
    maxRows: { control: 'number' },
    clearInputOnSelect: { control: 'boolean' },
    inputValue: { control: false },
    open: { control: false },
    shouldFilter: { control: 'boolean' },
    filter: { control: false },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    name: { control: 'text' },
    container: { control: false },
    onValueChange: { action: 'valueChange' },
    onInputValueChange: { action: 'inputValueChange' },
    onOpenChange: { action: 'openChange' },
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Driven by the controls. Click the field, type “py”, “k8s” or “design”. */
export const Playground: Story = {
  render: (args) => (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <MultiSelect key={`${JSON.stringify(args.defaultValue)}-${String(args.max)}`} {...args} />
    </div>
  ),
};

/** The common case, in a Field: profile skills with a cap. */
export const InAField: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row align="start">
      <Spec label="profile skills · max 5 · grouped, one module not yet open">
        <div style={{ width: '100%', maxWidth: 420 }}>
          <Field label="Skills" help="Pick up to 5. Recruiters on Scaler Careers filter on these.">
            <MultiSelect
              options={SKILLS}
              max={5}
              listLabel="Skills"
              placeholder="Search skills…"
              defaultValue={['java', 'spring', 'lld']}
              name="skills"
              emptyText={(text) => `No skill matches “${text}”. Add it in your profile’s free-text section.`}
            />
          </Field>
        </div>
      </Spec>
      <Spec label="mentor programmes · long labels wrap in the list, truncate in a chip">
        <div style={{ width: '100%', maxWidth: 360 }}>
          <Field label="Programmes you mentor">
            <MultiSelect
              options={PROGRAMMES}
              listLabel="Programmes"
              placeholder="Search programmes…"
              defaultValue={['programme-1', 'programme-4']}
            />
          </Field>
        </div>
      </Spec>
    </Row>
  ),
};

/** Open, with a cap reached: the list says why the rest are unavailable. */
export const OpenAtTheCap: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ width: '100%', maxWidth: 420, minHeight: 360 }}>
      <Field label="Preferred interview cities" help="Choose up to 3.">
        <MultiSelect
          options={CITIES}
          max={3}
          listLabel="Cities"
          defaultValue={['bengaluru', 'pune', 'remote-india']}
          defaultOpen
        />
      </Field>
    </div>
  ),
};

/** Many chips: blurred they collapse into "+N more" (by rows, or `maxVisibleChips`); focus the field and all show. */
export const Collapsed: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row align="start">
      <Spec label="maxRows = 1 (measured) · click to expand">
        <div style={{ width: 320, maxWidth: '100%' }}>
          <MultiSelect
            aria-label="Relocation cities"
            options={CITIES}
            maxRows={1}
            defaultValue={CITIES.slice(0, 7).map((c) => c.value)}
          />
        </div>
      </Spec>
      <Spec label="maxVisibleChips = 3">
        <div style={{ width: 360, maxWidth: '100%' }}>
          <MultiSelect
            aria-label="Skills"
            options={SKILLS}
            maxVisibleChips={3}
            defaultValue={['python', 'java', 'cpp', 'go', 'sql', 'react']}
          />
        </div>
      </Spec>
      <Spec label="maxRows = 0 · always wraps">
        <div style={{ width: 360, maxWidth: '100%' }}>
          <MultiSelect
            aria-label="Skills"
            options={SKILLS}
            maxRows={0}
            defaultValue={['python', 'java', 'cpp', 'go', 'sql', 'react', 'docker', 'kafka']}
          />
        </div>
      </Spec>
    </Row>
  ),
};

/** Invalid (a Field error), disabled, and empty with a placeholder. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row align="start">
      <Spec label="invalid">
        <div style={{ width: 320, maxWidth: '100%' }}>
          <Field label="Skills" error="Add at least one skill to apply for this role." required>
            <MultiSelect options={SKILLS} placeholder="Search skills…" />
          </Field>
        </div>
      </Spec>
      <Spec label="disabled">
        <div style={{ width: 320, maxWidth: '100%' }}>
          <Field label="Skills" help="Locked while your profile is under review." disabled>
            <MultiSelect options={SKILLS} defaultValue={['python', 'pytorch']} />
          </Field>
        </div>
      </Spec>
      <Spec label="empty list">
        <div style={{ width: 320, maxWidth: '100%' }}>
          <Field label="Electives" help="No electives open for Term 3 yet.">
            <MultiSelect options={[]} placeholder="Search electives…" emptyText="No electives are open yet." />
          </Field>
        </div>
      </Spec>
    </Row>
  ),
};

/** Heights match Input: 32 / 40 / 48px on one row. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 16, width: '100%', maxWidth: 420 }}>
      {SIZES.map((size) => (
        <MultiSelect
          key={size}
          size={size}
          aria-label={`Skills, ${size}`}
          options={SKILLS}
          defaultValue={['python', 'sql']}
          placeholder="Search skills…"
        />
      ))}
    </div>
  ),
};

/** `value` + `onValueChange`, with a submit that reads the hidden inputs. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const [value, setValue] = React.useState<string[]>(['hld']);
    const [posted, setPosted] = React.useState('');
    return (
      <form
        style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 420 }}
        onSubmit={(event) => {
          event.preventDefault();
          setPosted(new FormData(event.currentTarget).getAll('skills').join(', '));
        }}
      >
        <Field label="Interview focus areas" help="The panel prepares questions on these.">
          <MultiSelect options={SKILLS} value={value} onValueChange={setValue} name="skills" max={4} />
        </Field>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button type="button" variant="secondary" size="sm" onClick={() => setValue(['dsa', 'lld', 'hld'])}>
            Use the SDE II preset
          </Button>
          <Button type="submit" size="sm">
            Submit
          </Button>
        </div>
        <Text size="sm" tone="secondary">
          value: {value.join(', ') || '—'} · posted: {posted || '—'}
        </Text>
      </form>
    );
  },
};
