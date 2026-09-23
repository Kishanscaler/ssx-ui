import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type SelectSize,
} from './Select';

/* Story-only glyphs (Phosphor regular, inline). Consumers use @phosphor-icons/react. */
const svg = (d: string) => () => (
  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
    <path d={d} />
  </svg>
);
const DocumentIcon = svg(
  'M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-32-80a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,136Zm0,32a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,168Z',
);
const IdentityIcon = svg(
  'M200,112a8,8,0,0,1-8,8H152a8,8,0,0,1,0-16h40A8,8,0,0,1,200,112Zm-8,24H152a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm40-80V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56ZM216,200V56H40V200H216Zm-80.26-34a8,8,0,1,1-15.5,4c-2.63-10.26-13.060-18-24.25-18s-21.61,7.74-24.25,18a8,8,0,1,1-15.5-4,39.84,39.84,0,0,1,17.19-23.34,32,32,0,1,1,45.12,0A39.76,39.76,0,0,1,135.75,166ZM96,136a16,16,0,1,0-16-16A16,16,0,0,0,96,136Z',
);
const FeeIcon = svg(
  'M208,80a8,8,0,0,1-8,8H167.85c.09,1.32.15,2.65.15,4a60.07,60.07,0,0,1-60,60H92.69l72.69,66.08a8,8,0,1,1-10.76,11.840l-88-80A8,8,0,0,1,72,136h36a44.050,44.050,0,0,0,44-44c0-1.35-.07-2.68-.19-4H72a8,8,0,0,1,0-16h75.17A44,44,0,0,0,108,48H72a8,8,0,0,1,0-16H200a8,8,0,0,1,0,16H148.74a60.13,60.13,0,0,1,15.82,24H200A8,8,0,0,1,208,80Z',
);
const CertificateIcon = svg(
  'M128,136a8,8,0,0,1-8,8H72a8,8,0,0,1,0-16h48A8,8,0,0,1,128,136Zm-8-40H72a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Zm112,65.47V224A8,8,0,0,1,220,231l-24-13.74L172,231A8,8,0,0,1,160,224V200H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216a16,16,0,0,1,16,16V86.53a51.88,51.88,0,0,1,0,74.94ZM160,184V161.47A52,52,0,0,1,216,76V56H40V184Zm56-12a51.88,51.88,0,0,1-40,0v38.22l16-9.16a8,8,0,0,1,7.940,0l16,9.16Zm16-48a36,36,0,1,0-36,36A36,36,0,0,0,232,124Z',
);

type DemoArgs = {
  size?: SelectSize;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
};

const meta = {
  title: 'Atoms/Select',
  component: SelectTrigger,
  // Select is compound: the root holds the value, the trigger holds the look.
  // Listing the parts gives each its own props tab on the Docs page.
  subcomponents: { Select, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'One value from a known, closed list the user does not need to see all at once. Radix',
          'Select, so the open panel is **ours** (the Menu / Popover surface), not the operating',
          'system’s. Past ~25 options switch to a Combobox.',
          '',
          '`Select` › `SelectTrigger` (sizes `sm` / `md` / `lg` = 32 / 40 / 48px, `aria-invalid`) ›',
          '`SelectValue` (placeholder) · `SelectContent` › `SelectItem` (`description` for a second',
          'line, `disabled`), `SelectGroup`, `SelectLabel`, `SelectSeparator`.',
          '',
          '**Two-line options** keep only the headline in the item text, so the trigger shows the',
          'headline alone. A **leading icon** is a child of the item and is carried into the trigger.',
          '',
          'The panel portals to `<body>`; it is themed because `data-brand` / `data-theme` sit on',
          '`<html>`. Flip the toolbar with a panel open to check it.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof SelectTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- helpers -------------------------------------------------------- */

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', maxWidth: 1200, alignItems: 'start' }}>
    {children}
  </div>
);

const Spec = ({ tag, label, id, children, help }: {
  tag: string;
  label?: string;
  id?: string;
  children: React.ReactNode;
  help?: React.ReactNode;
}) => (
  <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
    <span style={{ font: '600 11px/1 var(--font-family-mono)', color: 'var(--content-secondary)', textTransform: 'uppercase' }}>{tag}</span>
    {label ? (
      <span id={id} style={{ font: 'var(--font-weight-semibold) var(--font-size-sm)/1.4 var(--font-family-sans)' }}>
        {label}
      </span>
    ) : null}
    {children}
    {help}
  </div>
);

const Cohorts = () => (
  <>
    <SelectItem value="c5">Cohort 5 · Bengaluru</SelectItem>
    <SelectItem value="c6">Cohort 6 · Bengaluru</SelectItem>
    <SelectItem value="c7">Cohort 7 · Bengaluru</SelectItem>
    <SelectItem value="c8">Cohort 8 · Pune</SelectItem>
    <SelectItem value="c9" disabled>
      Cohort 9 · Pune — intake not open
    </SelectItem>
  </>
);

const CohortSelect = ({ size, disabled, invalid, placeholder = 'Choose a cohort…', ...root }: DemoArgs & React.ComponentProps<typeof Select>) => (
  <Select disabled={disabled} {...root}>
    <SelectTrigger size={size} aria-label="Cohort" aria-invalid={invalid || undefined}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      <Cohorts />
    </SelectContent>
  </Select>
);

/* ---------- stories -------------------------------------------------------- */

/** Trigger props live (size, disabled, aria-invalid) on a real select. */
export const Playground: Story = {
  args: { size: 'md' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    'aria-invalid': { control: 'boolean', name: 'aria-invalid' },
  },
  render: (args) => (
    <div style={{ maxWidth: 320 }}>
      <Select defaultValue="c7">
        <SelectTrigger aria-label="Cohort" {...args}>
          <SelectValue placeholder="Choose a cohort…" />
        </SelectTrigger>
        <SelectContent>
          <Cohorts />
        </SelectContent>
      </Select>
    </div>
  ),
};

/** Rest (placeholder), chosen, disabled and invalid. Hover, pressed and focus are live: point, press, Tab. */
export const States: Story = {
  render: () => (
    <Row>
      <Spec tag="rest · nothing chosen" label="Programme">
        <Select>
          <SelectTrigger aria-label="Programme">
            <SelectValue placeholder="Choose a programme…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sst-ug">B.Sc. Computer Science &amp; AI — 4-year residential</SelectItem>
            <SelectItem value="ssb-ug">Scaler School of Business — AI-first business programme</SelectItem>
          </SelectContent>
        </Select>
      </Spec>
      <Spec tag="chosen value" label="Cohort">
        <CohortSelect defaultValue="c7" />
      </Spec>
      <Spec tag="disabled" label="Campus">
        <Select disabled defaultValue="blr">
          <SelectTrigger aria-label="Campus">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blr">Bengaluru — Electronic City</SelectItem>
          </SelectContent>
        </Select>
      </Spec>
      <Spec
        tag="invalid · aria-invalid + error"
        label="Cohort *"
        help={
          <p id="sel-invalid-err" className="text-sm text-danger-content">
            Pick a cohort before allocating a hostel room.
          </p>
        }
      >
        <Select>
          <SelectTrigger aria-label="Cohort" aria-invalid aria-describedby="sel-invalid-err">
            <SelectValue placeholder="Choose a cohort…" />
          </SelectTrigger>
          <SelectContent>
            <Cohorts />
          </SelectContent>
        </Select>
      </Spec>
      <Spec
        tag="long option label · truncates"
        label="Campus allocation"
        help={
          <p className="text-sm text-content-secondary">
            The closed trigger truncates; the open panel wraps the option in full.
          </p>
        }
      >
        <Select defaultValue="blr-c">
          <SelectTrigger aria-label="Campus allocation">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blr-c">
              Bengaluru — Electronic City Phase II residential campus, Block C hostel, allocated for Cohort 7 intake January 2026
            </SelectItem>
            <SelectItem value="pun">Pune — Hinjawadi Phase I, day-scholar only</SelectItem>
          </SelectContent>
        </Select>
      </Spec>
    </Row>
  ),
};

/** 32 / 40 / 48px on the shared control tokens. The chevron is flex-centred, so it holds its position at every height. */
export const Sizes: Story = {
  render: () => (
    <Row>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Spec key={size} tag={`${size}${size === 'md' ? ' (default)' : ''}`}>
          <CohortSelect size={size} defaultValue="c7" />
        </Spec>
      ))}
    </Row>
  ),
};

/**
 * The open panel, held open for review: the chosen row carries the check and the
 * brand ink; the highlighted row (arrow keys / pointer) is a position, not a
 * selection; the disabled row is still listed. Groups and a separator included.
 */
export const Open: Story = {
  parameters: { a11y: { test: 'off' } },
  render: () => (
    <div style={{ maxWidth: 320, minHeight: 360 }}>
      <Select defaultOpen defaultValue="c7">
        <SelectTrigger aria-label="Cohort">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Bengaluru</SelectLabel>
            <SelectItem value="c5">Cohort 5 · Bengaluru</SelectItem>
            <SelectItem value="c7">Cohort 7 · Bengaluru</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Pune</SelectLabel>
            <SelectItem value="c8">Cohort 8 · Pune</SelectItem>
            <SelectItem value="c9" disabled>
              Cohort 9 · Pune — intake not open
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

const programmes = (
  <>
    <SelectItem value="sst-ug" description="4-year residential · Bengaluru">
      B.Sc. Computer Science &amp; AI
    </SelectItem>
    <SelectItem value="ssb-ug" description="AI-first business programme · 3-year residential, Bengaluru">
      Scaler School of Business
    </SelectItem>
    <SelectItem
      value="msc"
      description="2-year, part-time · awarded with Woolf · live online cohort with an optional Bengaluru immersion week each semester"
    >
      M.Sc. Computer Science
    </SelectItem>
    <SelectItem value="cert" disabled description="11 months · weekend live classes — intake closed">
      Certificate in Data Science &amp; ML
    </SelectItem>
  </>
);

/** Closed: the trigger shows the headline only, never the subline. */
export const TwoLine: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Select defaultValue="sst-ug">
        <SelectTrigger aria-label="Programme">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{programmes}</SelectContent>
      </Select>
    </div>
  ),
};

/** Open: headline + secondary subline; the check aligns to the headline. */
export const TwoLineOpen: Story = {
  parameters: { a11y: { test: 'off' } },
  render: () => (
    <div style={{ maxWidth: 320, minHeight: 380 }}>
      <Select defaultOpen defaultValue="sst-ug">
        <SelectTrigger aria-label="Programme">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{programmes}</SelectContent>
      </Select>
    </div>
  ),
};

const documents = (
  <>
    <SelectItem value="marksheet">
      <DocumentIcon />
      Class 12 marksheet
    </SelectItem>
    <SelectItem value="identity">
      <IdentityIcon />
      Photo ID — Aadhaar or passport
    </SelectItem>
    <SelectItem value="fee">
      <FeeIcon />
      Fee receipt
    </SelectItem>
    <SelectItem value="scholarship" disabled>
      <CertificateIcon />
      Scholarship certificate — window closed
    </SelectItem>
  </>
);

/** A leading icon is a category, carried up into the closed trigger. The check column stays before it. */
export const WithIcons: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Select defaultValue="marksheet">
        <SelectTrigger aria-label="Document type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{documents}</SelectContent>
      </Select>
    </div>
  ),
};

export const WithIconsOpen: Story = {
  parameters: { a11y: { test: 'off' } },
  render: () => (
    <div style={{ maxWidth: 320, minHeight: 300 }}>
      <Select defaultOpen defaultValue="marksheet">
        <SelectTrigger aria-label="Document type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{documents}</SelectContent>
      </Select>
    </div>
  ),
};

/** Controlled (`value` / `onValueChange`) next to uncontrolled (`defaultValue`). */
export const ControlledAndUncontrolled: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = React.useState('c8');
      return (
        <Row>
          <Spec tag={`controlled · value = ${value}`}>
            <CohortSelect value={value} onValueChange={setValue} />
          </Spec>
          <Spec tag="uncontrolled · defaultValue = c6">
            <CohortSelect defaultValue="c6" />
          </Spec>
        </Row>
      );
    };
    return <Demo />;
  },
};
