import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Combobox, type ComboboxOption } from './Combobox';
import { Button } from '../Button';
import { Field } from '../Field';
import { Input, type InputSize } from '../Input';
import {
  SideDrawer,
  SideDrawerBody,
  SideDrawerContent,
  SideDrawerHeader,
  SideDrawerTitle,
  SideDrawerTrigger,
} from '../SideDrawer';
import { Text } from '../Text';
import { Row, Spec } from '../Icon/_fixtures/story-layout';

const SIZES: InputSize[] = ['sm', 'md', 'lg'];

/** The HTML's `combo-mentor` list. */
const MENTORS: ComboboxOption[] = [
  {
    value: 'nishant',
    label: 'Nishant Bhaskar — Staff Engineer, Google · distributed systems',
    group: 'Systems & infrastructure',
  },
  {
    value: 'kabir',
    label: 'Kabir Sethi — Engineering Manager, Uber · backend architecture',
    group: 'Systems & infrastructure',
  },
  {
    value: 'tejas',
    label: 'Tejas Iyer — Principal Engineer, Atlassian · low-level design and systems programming for the capstone track',
    group: 'Systems & infrastructure',
  },
  {
    value: 'ritika',
    label: 'Ritika Menon — SDE III, Amazon · interview preparation',
    group: 'Placements & interviews',
  },
  {
    value: 'aditya',
    label: "Aditya Venkatesh — Founder's Office, Flipkart · GTM strategy",
    group: 'Placements & interviews',
  },
  { value: 'sanya', label: 'Sanya Nair — Applied Scientist, Microsoft · machine learning', group: 'AI & research' },
  {
    value: 'priyanka',
    label: 'Priyanka Ghosh — Senior SWE, Meta · at capacity for Cohort 7',
    group: 'AI & research',
    disabled: true,
  },
];

/** The HTML's `combo-course` list (no groups). */
const COURSES: ComboboxOption[] = [
  'Data Structures & Algorithms — Semester 3',
  'Operating Systems — Semester 3',
  'System Design I — Semester 4',
  'Applied Machine Learning — Semester 5',
  'Financial Analysis for Founders — SSB, Term 2',
].map((label, i) => ({ value: `course-${i + 1}`, label }));

/** The HTML's static "open" state: the Amazon mentors. */
const AMAZON: ComboboxOption[] = [
  { value: 'ritika', label: 'Ritika Menon — SDE III, Amazon · interview preparation', group: 'Amazon' },
  { value: 'zoya', label: 'Zoya Ramachandran — SDM, Amazon · operations research', group: 'Amazon' },
  {
    value: 'farhan',
    label: 'Farhan Amanullah — Principal SDE, Amazon · at capacity until Term 4',
    group: 'Amazon',
    disabled: true,
  },
];

const mentorEmpty = (text: string) => `No mentor matches “${text}”. Request one from the programme office.`;

const meta = {
  title: 'Organisms/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A text field that filters a list as you type, for sets too long for a Select: mentors, courses,',
          'companies. Not for four options.',
          '',
          'The APG combobox with a listbox popup: the field keeps focus; typing opens and filters; ↓ / ↑ move the',
          'active option (`aria-activedescendant`); Enter picks and writes the label into the field; Escape closes,',
          'a second Escape clears; Alt+↓ / Alt+↑ open and close. Disabled options stay visible and are skipped.',
          '',
          'The field is our `Input` (size, invalid, disabled) and takes every Input prop and the `ref`, so a `Field`',
          'wires its label, help and error onto it. The popup is M3 `PopoverContent`, exactly the field’s width.',
          'Remote options: `shouldFilter={false}` + `onInputValueChange` + `loading`.',
        ].join('\n'),
      },
    },
  },
  args: {
    options: MENTORS,
    placeholder: 'Search by name, company or specialism…',
    listLabel: 'Super Mentors',
    'aria-label': 'Assign a Super Mentor',
    size: 'md',
    defaultValue: null,
    defaultOpen: false,
    shouldFilter: true,
    loading: false,
    loadingText: 'Searching 412 mentors…',
    emptyText: 'No mentor matches. Request one from the programme office.',
    disabled: false,
    name: 'mentor',
  },
  argTypes: {
    options: { control: 'object' },
    placeholder: { control: 'text' },
    listLabel: { control: 'text' },
    'aria-label': { control: 'text' },
    size: { control: 'inline-radio', options: SIZES },
    value: { control: false, description: 'Controlled value. Use `defaultValue` here; see the Controlled story.' },
    defaultValue: { control: 'text' },
    inputValue: { control: false, description: 'Controlled text. Use `defaultInputValue` here; see the Async story.' },
    defaultInputValue: { control: 'text' },
    open: { control: false, description: 'Controlled open state. Use `defaultOpen` here.' },
    defaultOpen: { control: 'boolean' },
    shouldFilter: { control: 'boolean' },
    filter: { control: false },
    loading: { control: 'boolean' },
    loadingText: { control: 'text' },
    emptyText: { control: 'text' },
    disabled: { control: 'boolean' },
    name: { control: 'text' },
    container: { control: false },
    className: { control: 'text' },
    onValueChange: { action: 'valueChange' },
    onInputValueChange: { action: 'inputValueChange' },
    onOpenChange: { action: 'openChange' },
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Driven by the controls. Type “ama”, “goo” or “sys”. */
export const Playground: Story = {
  render: (args) => (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <Combobox key={`${String(args.defaultOpen)}-${String(args.defaultValue)}-${args.defaultInputValue}`} {...args} />
    </div>
  ),
};

/** The HTML's working examples: find a Super Mentor, and course search. */
export const WorkingExamples: Story = {
  name: 'Type to filter (HTML)',
  render: () => (
    <Row align="start">
      <Spec label="combobox · find a Super Mentor (try “ama”, “goo”, “sys”)">
        <div style={{ width: '100%', maxWidth: 420 }}>
          <Field label="Assign a Super Mentor" help="Only mentors with capacity in Cohort 7 are listed.">
            <Combobox
              options={MENTORS}
              listLabel="Super Mentors"
              placeholder="Search by name, company or specialism…"
              emptyText={mentorEmpty}
            />
          </Field>
        </div>
      </Spec>
      <Spec label="combobox · course search">
        <div style={{ width: '100%', maxWidth: 360 }}>
          <Field label="Course">
            <Combobox options={COURSES} listLabel="Courses" placeholder="Search courses…" />
          </Field>
        </div>
      </Spec>
    </Row>
  ),
};

/** The HTML's “States” row. The open ones start open; click outside and they close like any other. */
export const States: Story = {
  render: () => (
    <Row align="start">
      <Spec label="open · grouped, one option highlighted, one at capacity and disabled">
        <div style={{ width: '100%', maxWidth: 360, height: 220 }}>
          <Combobox
            aria-label="Super Mentor, open"
            listLabel="Super Mentors, filtered"
            options={AMAZON}
            defaultInputValue="ama"
            defaultOpen
          />
        </div>
      </Spec>
      <Spec label="no match">
        <div style={{ width: '100%', maxWidth: 360, height: 120 }}>
          <Combobox
            aria-label="Super Mentor, no match"
            listLabel="Super Mentors, no results"
            options={MENTORS}
            defaultInputValue="quantum"
            defaultOpen
            emptyText={mentorEmpty}
          />
        </div>
      </Spec>
    </Row>
  ),
};

/** Invalid, disabled, and the loading row, closed. */
export const InvalidDisabledLoading: Story = {
  name: 'Invalid, disabled, loading',
  render: () => (
    <Row align="start">
      <Spec label="invalid">
        <Combobox aria-label="Super Mentor, invalid" options={MENTORS} defaultInputValue="Nishant Bhaskarr" aria-invalid />
      </Spec>
      <Spec label="disabled">
        <Combobox aria-label="Super Mentor, disabled" options={MENTORS} defaultValue="nishant" disabled />
      </Spec>
      <Spec label="in a Field with an error">
        <div style={{ width: '100%', maxWidth: 320 }}>
          <Field label="Super Mentor" error="Pick a mentor from the list.">
            <Combobox options={MENTORS} defaultInputValue="Nishant Bhaskarr" />
          </Field>
        </div>
      </Spec>
      <Spec label="loading remote options (the list row)">
        <div style={{ width: '100%', maxWidth: 320, height: 90 }}>
          <Combobox
            aria-label="Super Mentor, loading"
            options={[]}
            shouldFilter={false}
            loading
            loadingText="Searching 412 mentors…"
            defaultInputValue="sys"
            defaultOpen
          />
        </div>
      </Spec>
    </Row>
  ),
};

const REMOTE = MENTORS.concat(AMAZON.map((option) => ({ ...option, value: `${option.value}-amzn` })));

/** Remote options: the text is controlled, the list is fetched (600ms here) with `loading` in between. */
export const Async: Story = {
  render: function Render() {
    const [text, setText] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [results, setResults] = React.useState<ComboboxOption[]>([]);
    React.useEffect(() => {
      if (!text) {
        setResults([]);
        return undefined;
      }
      setLoading(true);
      const id = window.setTimeout(() => {
        const q = text.toLowerCase();
        setResults(REMOTE.filter((option) => option.label.toLowerCase().includes(q)).map(({ group: _, ...o }) => o));
        setLoading(false);
      }, 600);
      return () => window.clearTimeout(id);
    }, [text]);
    return (
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Field label="Assign a Super Mentor" help="Searches all 412 mentors on the server.">
          <Combobox
            options={loading ? [] : results}
            shouldFilter={false}
            inputValue={text}
            onInputValueChange={setText}
            loading={loading}
            loadingText="Searching 412 mentors…"
            emptyText={mentorEmpty}
            listLabel="Super Mentors"
            placeholder="Search by name, company or specialism…"
          />
        </Field>
      </div>
    );
  },
};

/** Controlled value, two-way, so the story still works when you pick. */
export const Controlled: Story = {
  render: function Render() {
    const [value, setValue] = React.useState<string | null>('ritika');
    return (
      <div style={{ width: '100%', maxWidth: 420, display: 'grid', gap: 12 }}>
        <Field label="Assign a Super Mentor">
          <Combobox options={MENTORS} value={value} onValueChange={(next) => setValue(next)} listLabel="Super Mentors" />
        </Field>
        <Row>
          <Text size="sm" tone="secondary">
            value: {String(value)}
          </Text>
          <Button size="sm" variant="secondary" onClick={() => setValue('sanya')}>
            Assign Sanya
          </Button>
        </Row>
      </div>
    );
  },
};

/** Sizes follow Input. */
export const Sizes: Story = {
  render: () => (
    <Row align="start">
      {SIZES.map((size) => (
        <Spec key={size} label={size}>
          <div style={{ width: '100%', maxWidth: 280 }}>
            <Combobox size={size} aria-label={`Course, ${size}`} options={COURSES} placeholder="Search courses…" />
          </div>
        </Spec>
      ))}
    </Row>
  ),
};

/** Inside a SideDrawer: the list portals above the modal, and the drawer's Escape waits for the list's. */
export const InASideDrawer: Story = {
  name: 'In a SideDrawer',
  render: () => (
    <SideDrawer>
      <SideDrawerTrigger asChild>
        <Button>Reassign mentor</Button>
      </SideDrawerTrigger>
      <SideDrawerContent>
        <SideDrawerHeader eyebrow="Aarav Krishnan · SST-2029-0416">
          <SideDrawerTitle>Reassign mentor</SideDrawerTitle>
        </SideDrawerHeader>
        <SideDrawerBody className="grid content-start gap-6">
          <Field label="Assign a Super Mentor" help="Only mentors with capacity in Cohort 7 are listed.">
            <Combobox options={MENTORS} listLabel="Super Mentors" placeholder="Search by name…" emptyText={mentorEmpty} />
          </Field>
          <Field label="Reason">
            <Input defaultValue="Schedule clash with the Week 6 assessment" />
          </Field>
        </SideDrawerBody>
      </SideDrawerContent>
    </SideDrawer>
  ),
};
