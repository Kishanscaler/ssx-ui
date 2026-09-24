import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Archive,
  Buildings,
  CaretDown,
  Certificate,
  ChalkboardTeacher,
  Copy,
  DotsThree,
  DownloadSimple,
  EnvelopeSimple,
  GraduationCap,
  PencilSimple,
  ShareNetwork,
  Trash,
  UsersThree,
  XCircle,
} from '@phosphor-icons/react';

import { Avatar, AvatarFallback } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
  type MenuItemVariant,
} from './Menu';

const VARIANTS: MenuItemVariant[] = ['default', 'danger'];

/** Open stories render in their own iframe in the docs page, so panels do not stack. */
const openInDocs = (height: number) => ({ docs: { story: { inline: false, height: `${height}px` } } });

const meta = {
  title: 'Molecules/Menu',
  component: MenuItem,
  subcomponents: {
    Menu,
    MenuTrigger,
    MenuContent,
    MenuCheckboxItem,
    MenuRadioGroup,
    MenuRadioItem,
    MenuGroup,
    MenuLabel,
    MenuSeparator,
  } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A list of **actions** on one object, opened from a labelled button, or — as the More',
          'Menu — from an icon-only ⋯ button named for its row ("More actions for Aarav Krishnan").',
          'If the list chooses a value that stays chosen, that is a Select.',
          '',
          '`Menu` › `MenuTrigger asChild` (a `Button` / `IconButton`) · `MenuContent` › `MenuItem`',
          '(`icon`, `description` for a two-line row, `shortcut`, `variant="danger"`, `disabled`,',
          '`asChild` for a link), `MenuSeparator`, `MenuGroup` + `MenuLabel`, `MenuRadioGroup` ›',
          '`MenuRadioItem` and `MenuCheckboxItem` (a trailing, always-reserved check column).',
          '',
          'Radix DropdownMenu: arrows, Home / End, type-ahead on the headline, Escape, disabled rows',
          'announced and skipped. The panel portals to `<body>` and is themed by `data-brand` /',
          '`data-theme` on `<html>`.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: VARIANTS,
      table: { defaultValue: { summary: 'default' } },
      description: '`danger` for a destructive action; it goes last, below a separator.',
    },
    disabled: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    description: { control: 'text', description: 'A supporting line; makes the row two-line.' },
    shortcut: { control: 'text', description: 'A shortcut hint on the trailing edge, drawn as a Kbd.' },
    icon: { control: false, description: 'A leading glyph, 20px, secondary ink.' },
    asChild: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    textValue: { control: 'text', description: 'Type-ahead text when the label is not a plain string.' },
    children: { control: 'text', description: 'The label.' },
  },
} satisfies Meta<typeof MenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- helpers -------------------------------------------------------- */

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' }}>{children}</div>
);
const Spec = ({ tag, children }: { tag: string; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 12, alignContent: 'start', justifyItems: 'start' }}>
    <span style={{ font: '600 12px/1 var(--font-family-sans)', color: 'var(--content-secondary)' }}>{tag}</span>
    {children}
  </div>
);

const LabelledTrigger = ({ children }: { children: React.ReactNode }) => (
  <MenuTrigger asChild>
    <Button variant="secondary">
      {children}
      <CaretDown weight="bold" />
    </Button>
  </MenuTrigger>
);

/* ---------- stories -------------------------------------------------------- */

type PlaygroundArgs = React.ComponentProps<typeof MenuItem> & {
  open?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  withIcons?: boolean;
};

/**
 * The first row takes the item props (variant, disabled, description,
 * shortcut, label); `open`, `side`, `align` drive the panel.
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    children: 'Export CSV',
    variant: 'default',
    disabled: false,
    description: '412 rows · current filters applied',
    shortcut: '⌘E',
    open: true,
    side: 'bottom',
    align: 'start',
    withIcons: true,
  },
  argTypes: {
    open: { control: 'boolean', description: 'Story only: panel open (non-modal).' },
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'], description: 'MenuContent `side`.' },
    align: { control: 'select', options: ['start', 'center', 'end'], description: 'MenuContent `align`.' },
    withIcons: { control: 'boolean', description: 'Story only: leading icons on every row.' },
  },
  parameters: openInDocs(420),
  // `open` is two-way: clicking the trigger updates the control, and the
  // control opens the panel. A one-way `open={open}` pinned the menu, so the
  // trigger appeared broken in this story (reported 2026-09-23).
  render: function PlaygroundStory({ open, side, align, withIcons, ...item }) {
    const [, updateArgs] = useArgs<PlaygroundArgs>();
    return (
    <div style={{ padding: '0 0 320px' }}>
      <Menu open={open} onOpenChange={(next) => updateArgs({ open: next })} modal={false}>
        <LabelledTrigger>Cohort actions</LabelledTrigger>
        <MenuContent side={side} align={align}>
          <MenuItem icon={withIcons ? <DownloadSimple /> : undefined} {...item} />
          <MenuItem icon={withIcons ? <Copy /> : undefined}>Duplicate</MenuItem>
          <MenuItem icon={withIcons ? <Archive /> : undefined} disabled>
            Archive
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={withIcons ? <Trash /> : undefined} variant="danger">
            Delete cohort
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
    );
  },
};

/** Actions on a cohort: shortcut, disabled, and the danger row last below a separator. Open. */
export const WorkingExample: Story = {
  name: 'Working example — actions on a cohort',
  parameters: { ...(openInDocs(300)), controls: { disable: true } },
  render: () => (
    <Menu defaultOpen modal={false}>
      <LabelledTrigger>Cohort actions</LabelledTrigger>
      <MenuContent aria-label="Actions for SSB Cohort 7 · Bengaluru">
        <MenuItem icon={<DownloadSimple />} shortcut="⌘E">
          Export CSV
        </MenuItem>
        <MenuItem icon={<Copy />}>Duplicate</MenuItem>
        <MenuItem icon={<Archive />} disabled>
          Archive
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<Trash />} variant="danger">
          Delete cohort
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/** A headline with a supporting line, one name per row; one-line and two-line mixed. Open. */
export const TwoLine: Story = {
  name: 'Two-line item',
  parameters: { ...(openInDocs(420)), controls: { disable: true } },
  render: () => (
    <Menu defaultOpen modal={false}>
      <LabelledTrigger>Cohort actions</LabelledTrigger>
      <MenuContent aria-label="Actions for SSB Cohort 7 · Bengaluru">
        <MenuItem shortcut="⌘O">Open cohort</MenuItem>
        <MenuItem description="412 rows · current filters applied" shortcut="⌘E">
          Export CSV
        </MenuItem>
        <MenuItem description="Copies the module plan and the mentor roster, not the students">
          Duplicate cohort
        </MenuItem>
        <MenuItem description="Currently Ishita Raghunathan">Reassign mentor</MenuItem>
        <MenuItem description="Available once the last capstone is graded" disabled>
          Archive cohort
        </MenuItem>
        <MenuSeparator />
        <MenuItem description="Removes 48 student records permanently" variant="danger">
          Delete cohort
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/** Leading icons: neutral glyphs, red with the danger row, dimmed with the disabled row. Open. */
export const LeadingIcons: Story = {
  name: 'Leading icons',
  parameters: { ...(openInDocs(320)), controls: { disable: true } },
  render: () => (
    <Menu defaultOpen modal={false}>
      <LabelledTrigger>Student actions</LabelledTrigger>
      <MenuContent aria-label="Actions for Aarav Krishnan">
        <MenuItem icon={<PencilSimple />}>Edit application</MenuItem>
        <MenuItem icon={<EnvelopeSimple />} shortcut="⌘M">
          Email Aarav
        </MenuItem>
        <MenuItem icon={<ChalkboardTeacher />}>Reassign reviewer</MenuItem>
        <MenuItem icon={<Certificate />} disabled>
          Issue offer letter
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<XCircle />} variant="danger">
          Withdraw application
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/** menuitemradio rows: icon left, check right in a reserved column; the check moves. Open. */
export const RadioItems: Story = {
  name: 'Icon + two lines + check (radio)',
  parameters: { ...(openInDocs(420)), controls: { disable: true } },
  render: () => {
    const [scope, setScope] = React.useState('c7');
    return (
      <Menu defaultOpen modal={false}>
        <LabelledTrigger>Reporting scope</LabelledTrigger>
        <MenuContent aria-label="Reporting scope">
          <MenuRadioGroup value={scope} onValueChange={setScope}>
            <MenuRadioItem value="c7" icon={<UsersThree />} description="48 students · intake closes 30 Apr">
              Cohort 7 · Bengaluru
            </MenuRadioItem>
            <MenuRadioItem value="c8" icon={<UsersThree />} description="36 students · intake opens 12 May">
              Cohort 8 · Pune
            </MenuRadioItem>
            <MenuRadioItem
              value="bsc"
              icon={<GraduationCap />}
              description="4-year residential · Bengaluru, Pune and Hyderabad campuses · Batch of 2029"
            >
              B.Sc. Computer Science &amp; AI
            </MenuRadioItem>
            <MenuRadioItem value="blr" icon={<Buildings />} description="3 cohorts · 214 students">
              Bengaluru campus
            </MenuRadioItem>
            <MenuRadioItem value="c9" icon={<UsersThree />} description="Intake not open — nothing to report yet" disabled>
              Cohort 9 · Pune
            </MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
    );
  },
};

/** Group labels and a checkbox item (from the organisms toolbar's More menu). Open. */
export const GroupsAndCheckbox: Story = {
  name: 'Groups, labels, checkbox item',
  parameters: { ...(openInDocs(360)), controls: { disable: true } },
  render: () => (
    <Menu defaultOpen modal={false}>
      <MenuTrigger asChild>
        <IconButton variant="tertiary" size="sm" aria-label="More note actions">
          <DotsThree weight="bold" />
        </IconButton>
      </MenuTrigger>
      <MenuContent aria-label="More note actions">
        <MenuGroup>
          <MenuLabel>Share</MenuLabel>
          <MenuItem icon={<DownloadSimple />} shortcut="⌘S">
            Download as PDF
          </MenuItem>
          <MenuItem icon={<ShareNetwork />}>Share with Cohort 7</MenuItem>
          <MenuCheckboxItem defaultChecked icon={<EnvelopeSimple />}>
            Email me replies
          </MenuCheckboxItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuLabel>Danger zone</MenuLabel>
          <MenuItem icon={<Trash />} variant="danger">
            Delete this note
          </MenuItem>
        </MenuGroup>
      </MenuContent>
    </Menu>
  ),
};

const people = [
  { initials: 'AK', name: 'Aarav Krishnan', id: 'SST-2029-0416', status: <Badge tone="warning">In review</Badge> },
  { initials: 'MS', name: 'Meera Subramaniam', id: 'SSB-2028-1190', status: <Badge tone="success">Offer sent</Badge> },
];

/** More Menu: the same panel from an unlabelled ⋯ button in a dense row. The first row is open. */
export const MoreMenu: Story = {
  name: 'More menu · overflow trigger in a row',
  parameters: { ...(openInDocs(420)), controls: { disable: true } },
  render: () => (
    <div style={{ maxWidth: 560, paddingBottom: 260 }}>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          border: '1px solid var(--border-decorative)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface-default)',
        }}
      >
        {people.map((p, i) => (
          <li
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderTop: i ? '1px solid var(--border-decorative)' : undefined,
            }}
          >
            <Avatar size="sm" aria-hidden>
              <AvatarFallback>{p.initials}</AvatarFallback>
            </Avatar>
            <span style={{ flex: 1, fontSize: 'var(--font-size-sm)' }}>
              {p.name}
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--content-secondary)' }}> · {p.id}</span>
            </span>
            {p.status}
            <Menu defaultOpen={i === 0} modal={false}>
              <MenuTrigger asChild>
                <IconButton variant="tertiary" size="sm" aria-label={`More actions for ${p.name}`}>
                  <DotsThree weight="bold" />
                </IconButton>
              </MenuTrigger>
              <MenuContent aria-label={`Actions for ${p.name}`}>
                <MenuItem>Open application</MenuItem>
                {i === 0 ? (
                  <>
                    <MenuItem shortcut="⌘E">Export CSV</MenuItem>
                    <MenuItem description="Books a panel slot · 27 Mar, 11:00 IST">Move to shortlist</MenuItem>
                    <MenuItem description="Locked while moderation is open" disabled>
                      Reassign reviewer
                    </MenuItem>
                  </>
                ) : (
                  <MenuItem>Resend offer letter</MenuItem>
                )}
                <MenuSeparator />
                <MenuItem variant="danger">{i === 0 ? 'Withdraw application' : 'Rescind offer'}</MenuItem>
              </MenuContent>
            </Menu>
          </li>
        ))}
      </ul>
    </div>
  ),
};

/** The ⋯ trigger sizes and its disabled state (closed). */
export const MoreMenuTriggers: Story = {
  parameters: { controls: { disable: true } },
  name: 'More menu · trigger sizes, disabled',
  render: () => (
    <Row>
      <Spec tag="sizes">
        <div style={{ display: 'flex', gap: 8 }}>
          <Menu>
            <MenuTrigger asChild>
              <IconButton variant="tertiary" size="sm" aria-label="More actions">
                <DotsThree weight="bold" />
              </IconButton>
            </MenuTrigger>
            <MenuContent>
              <MenuItem>Open application</MenuItem>
            </MenuContent>
          </Menu>
          <Menu>
            <MenuTrigger asChild>
              <IconButton variant="tertiary" aria-label="More actions">
                <DotsThree />
              </IconButton>
            </MenuTrigger>
            <MenuContent>
              <MenuItem>Open application</MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </Spec>
      <Spec tag="disabled">
        <Menu>
          <MenuTrigger asChild disabled>
            <IconButton variant="tertiary" aria-label="More actions for archived cohort" disabled>
              <DotsThree />
            </IconButton>
          </MenuTrigger>
          <MenuContent>
            <MenuItem>Open</MenuItem>
          </MenuContent>
        </Menu>
      </Spec>
    </Row>
  ),
};
