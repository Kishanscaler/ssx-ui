import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookOpen, Briefcase, DownloadSimple, Medal, Plus, Trash } from '@phosphor-icons/react';

import {
  CommandPalette,
  CommandPaletteShortcut,
  type CommandPaletteGroup,
  type CommandPaletteItem,
} from './CommandPalette';
import { Avatar, AvatarFallback } from '../Avatar';
import { Button, type ButtonVariant } from '../Button';
import { Kbd, KbdGroup } from '../Kbd';
import { Text } from '../Text';
import { Row, Spec } from '../Icon/_fixtures/story-layout';

const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'danger', 'neutral'];

const initials = (text: string) => (
  <Avatar size="sm">
    <AvatarFallback>{text}</AvatarFallback>
  </Avatar>
);

const then = (a: string, b: string) => (
  <KbdGroup separator="then">
    <Kbd>{a}</Kbd>
    <Kbd>{b}</Kbd>
  </KbdGroup>
);

/** The HTML's `palette-cmdk` rows. */
const GROUPS: CommandPaletteGroup[] = [
  {
    heading: 'Students',
    items: [
      {
        value: 'sst-2029-0416',
        label: 'Aarav Krishnan',
        detail: '· SST-2029-0416 · Cohort 7',
        icon: initials('AK'),
      },
      {
        value: 'sst-2029-0733',
        label: 'Meher Iyengar',
        detail: '· SST-2029-0733 · Cohort 7',
        icon: initials('MI'),
      },
    ],
  },
  {
    heading: 'Go to',
    items: [
      {
        value: 'go-dsa-week-6',
        label: 'Data Structures & Algorithms — Week 6',
        icon: <BookOpen />,
        shortcut: then('G', 'M'),
      },
      {
        value: 'go-placements-2027',
        label: 'Placement drives · Batch of 2027',
        icon: <Briefcase />,
        shortcut: then('G', 'P'),
      },
    ],
  },
  {
    heading: 'Commands',
    items: [
      { value: 'new-interview-slot', label: 'Create an interview slot', icon: <Plus />, shortcut: '⌘N' },
      {
        value: 'export-pipeline',
        label: 'Export the applicant pipeline as CSV',
        icon: <DownloadSimple />,
        shortcut: '⌘E',
      },
      {
        value: 'withdraw-application',
        label: 'Withdraw the selected application',
        icon: <Trash />,
        shortcut: '⌘⌫',
        variant: 'danger',
        separatorBefore: true,
      },
      {
        value: 'release-scholarships',
        label: 'Release scholarship decisions',
        detail: '· needs Dean approval',
        icon: <Medal />,
        disabled: true,
      },
    ],
  },
];

const meta = {
  title: 'Organisms/CommandPalette',
  component: CommandPalette,
  subcomponents: { CommandPaletteShortcut } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Keyboard-first jump-to-anything for staff surfaces: search students, cohorts and commands in one',
          'field. An accelerator over navigation that already exists, never the only route to an action.',
          '',
          'A modal Radix Dialog (focus trap and return, Escape, scrim, scroll lock) holding the APG',
          'combobox-with-listbox pattern: the field keeps focus, ↑ / ↓ move the active row',
          '(`aria-activedescendant`), Enter runs it, Ctrl+Home / Ctrl+End jump. ⌘K on Apple, Ctrl+K elsewhere,',
          'toggles it from anywhere (`hotkey`). No match: the EmptyState.',
          '',
          'Data in (`groups`), not a compound tree: it filters, groups and walks the rows on React 16.12 too.',
          'For server results pass `shouldFilter={false}`, `onQueryChange` and `loading`.',
        ].join('\n'),
      },
    },
  },
  args: {
    groups: GROUPS,
    trigger: 'Search everything',
    triggerVariant: 'secondary',
    label: 'Command palette',
    placeholder: 'Search students, cohorts and commands…',
    defaultOpen: false,
    defaultQuery: '',
    shouldFilter: true,
    closeOnSelect: true,
    hotkey: 'k',
    loading: false,
    loadingText: 'Searching…',
    emptyTitle: 'No matches',
    emptyDescription: 'Cohort 12 has not been created yet. Try a student ID, a module name or a command verb.',
    emptyCloseLabel: 'Close',
  },
  argTypes: {
    groups: { control: 'object' },
    trigger: { control: 'text' },
    triggerVariant: { control: 'select', options: BUTTON_VARIANTS },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    inputLabel: { control: 'text' },
    open: { control: false, description: 'Controlled state. Use `defaultOpen` or the hotkey here.' },
    defaultOpen: { control: 'boolean' },
    query: { control: false, description: 'Controlled query. Use `defaultQuery` here; see the Async story.' },
    defaultQuery: { control: 'text' },
    shouldFilter: { control: 'boolean' },
    filter: { control: false },
    closeOnSelect: { control: 'boolean' },
    hotkey: { control: 'text' },
    loading: { control: 'boolean' },
    loadingText: { control: 'text' },
    emptyTitle: { control: 'text' },
    emptyDescription: { control: 'text' },
    emptyCloseLabel: { control: 'text' },
    className: { control: 'text' },
    container: { control: false },
    onOpenChange: { action: 'openChange' },
    onQueryChange: { action: 'queryChange' },
    onSelect: { action: 'select' },
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Driven by the controls. Press ⌘K / Ctrl+K anywhere in the canvas, or the trigger. */
export const Playground: Story = {
  render: (args) => <CommandPalette key={`${String(args.defaultOpen)}-${args.defaultQuery}`} {...args} />,
};

/** The HTML's working example: trigger with its ⌘K keycaps; the palette opens on the first student. */
export const Cmdk: Story = {
  parameters: { controls: { disable: true } },
  name: 'Palette (HTML)',
  render: () => (
    <Row>
      <Spec label="trigger">
        <CommandPalette groups={GROUPS} trigger="Search everything" placeholder="Search students, cohorts and commands…" />
      </Spec>
    </Row>
  ),
};

/** Open on load, for review in the four brand × theme combinations and at phone width. */
export const Open: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <CommandPalette defaultOpen groups={GROUPS} trigger="Search everything" placeholder="Search students, cohorts and commands…" />
  ),
};

/** The HTML's `palette-empty`: a query with no match shows the EmptyState. */
export const Empty: Story = {
  parameters: { controls: { disable: true } },
  name: 'Empty state (HTML)',
  render: () => (
    <Spec label="trigger · a query with no match">
      <CommandPalette
        groups={GROUPS}
        hotkey={false}
        defaultQuery="capstone reviewer for cohort 12"
        placeholder="Search students, cohorts and commands…"
        emptyDescription="Cohort 12 has not been created yet. Try a student ID, a module name or a command verb."
        trigger={<Button variant="tertiary">Open the palette on “cohort 12”</Button>}
      />
    </Spec>
  ),
};

const ROSTER: CommandPaletteItem[] = [
  'Aarav Krishnan',
  'Meher Iyengar',
  'Ishaan Chatterjee',
  'Zoya Ramachandran',
  'Kabir Sethi',
  'Ritika Menon',
].map((name, i) => ({
  value: `sst-2029-${String(400 + i * 37).padStart(4, '0')}`,
  label: name,
  detail: `· SST-2029-${String(400 + i * 37).padStart(4, '0')}`,
  icon: initials(
    name
      .split(' ')
      .map((part) => part[0])
      .join(''),
  ),
}));

/** Server results: `shouldFilter={false}`, the query controlled, `loading` while the "request" runs. */
export const Async: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [query, setQuery] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [results, setResults] = React.useState<CommandPaletteItem[]>(ROSTER);
    React.useEffect(() => {
      setLoading(true);
      setResults([]);
      const id = window.setTimeout(() => {
        const q = query.toLowerCase();
        setResults(ROSTER.filter((row) => row.label.toLowerCase().includes(q)));
        setLoading(false);
      }, 600);
      return () => window.clearTimeout(id);
    }, [query]);
    return (
      <CommandPalette
        trigger="Find a student"
        placeholder="Search 412 students…"
        groups={results.length ? [{ heading: 'Students', items: results }] : []}
        shouldFilter={false}
        query={query}
        onQueryChange={setQuery}
        loading={loading}
        loadingText="Searching 412 students…"
        emptyDescription="No student by that name in Cohort 7."
      />
    );
  },
};

/** The keycaps on their own, for a trigger you build yourself (a TopNav search field). */
export const Shortcut: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      <Spec label="CommandPaletteShortcut">
        <CommandPaletteShortcut />
      </Spec>
      <Spec label="in a custom trigger">
        <Text size="sm" tone="secondary">
          Press <CommandPaletteShortcut /> to search
        </Text>
      </Spec>
    </Row>
  ),
};
