import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ArrowCounterClockwise,
  Clock,
  Code,
  DownloadSimple,
  Exam,
  Image,
  LinkSimple,
  ShareNetwork,
  TextB,
  TextItalic,
  Trash,
} from '@phosphor-icons/react';

import { IconButton } from '../IconButton';
import {
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
} from '../Menu';
import { SearchInput } from '../SearchInput';
import { SegmentedControl, SegmentedControlItem } from '../SegmentedControl';
import { Spec } from '../Icon/_fixtures/story-layout';
import {
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
  ToolbarOverflow,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarToggle,
  type ToolbarProps,
} from './Toolbar';

const meta = {
  title: 'Organisms/Toolbar',
  component: Toolbar,
  subcomponents: { ToolbarGroup, ToolbarItem, ToolbarOverflow, ToolbarSeparator, ToolbarSpacer, ToolbarToggle } as Record<
    string,
    React.ComponentType<unknown>
  >,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A grouped strip of controls acting on the content beside it. `role="toolbar"` with a label; ONE tab',
          'stop, then ← / → (↑ / ↓ vertical), Home / End, with disabled controls skipped. A text field keeps its',
          'caret keys; a SegmentedControl keeps its own arrows and hands off at its ends. Hosts the system’s',
          'controls unchanged: `ToolbarToggle` for on/off icons, IconButton, SearchInput, SegmentedControl, and a',
          'Menu for overflow. Not for page navigation.',
          '',
          'When the row is full: `overflow="wrap"` (default) wraps onto more lines; `overflow="menu"` keeps one',
          'line and moves each `ToolbarItem` that does not fit into the ⋯ `ToolbarOverflow` menu (lowest',
          '`priority` first, then from the end). An item’s menu form is a row named after its control (clicking',
          'it clicks the control; a toggle shows as a check), or `onOverflowSelect`, or your own `overflowContent`.',
        ].join(' '),
      },
    },
  },
  args: { 'aria-label': 'Lecture note formatting', orientation: 'horizontal', loop: true, overflow: 'wrap' },
  argTypes: {
    'aria-label': { control: 'text' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    loop: { control: 'boolean', description: 'Wrap around at the ends.' },
    overflow: {
      control: 'inline-radio',
      options: ['wrap', 'menu'],
      description: 'When the row is full: wrap, or move ToolbarItems into the ⋯ menu (horizontal only).',
    },
    overflowMenuLabel: { control: false },
    className: { control: 'text' },
  },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

function NotesToolbar(props: ToolbarProps) {
  const [style, setStyle] = React.useState({ bold: true, italic: false, link: false });
  const [view, setView] = React.useState('write');
  const toggle = (key: keyof typeof style) => (pressed: boolean) => setStyle((s) => ({ ...s, [key]: pressed }));
  return (
    <Toolbar {...props}>
      <ToolbarItem
        priority={2}
        overflowContent={
          <MenuGroup>
            <MenuLabel>Text style</MenuLabel>
            <MenuCheckboxItem icon={<TextB />} checked={style.bold} onCheckedChange={toggle('bold')}>
              Bold
            </MenuCheckboxItem>
            <MenuCheckboxItem icon={<TextItalic />} checked={style.italic} onCheckedChange={toggle('italic')}>
              Italic
            </MenuCheckboxItem>
            <MenuCheckboxItem icon={<LinkSimple />} checked={style.link} onCheckedChange={toggle('link')}>
              Link
            </MenuCheckboxItem>
          </MenuGroup>
        }
      >
        <ToolbarGroup aria-label="Text style">
          <ToolbarToggle aria-label="Bold" pressed={style.bold} onPressedChange={toggle('bold')}>
            <TextB weight="bold" />
          </ToolbarToggle>
          <ToolbarToggle aria-label="Italic" pressed={style.italic} onPressedChange={toggle('italic')}>
            <TextItalic weight="bold" />
          </ToolbarToggle>
          <ToolbarToggle aria-label="Insert a link" pressed={style.link} onPressedChange={toggle('link')}>
            <LinkSimple weight="bold" />
          </ToolbarToggle>
        </ToolbarGroup>
      </ToolbarItem>
      <ToolbarSeparator />
      <ToolbarItem overflowLabel="Insert an image" overflowIcon={<Image />}>
        <IconButton variant="tertiary" size="sm" aria-label="Insert an image">
          <Image weight="bold" />
        </IconButton>
      </ToolbarItem>
      <ToolbarItem overflowLabel="Insert a code block" overflowIcon={<Code />}>
        <IconButton variant="tertiary" size="sm" aria-label="Insert a code block">
          <Code weight="bold" />
        </IconButton>
      </ToolbarItem>
      <ToolbarItem overflowLabel="Undo" overflowIcon={<ArrowCounterClockwise />}>
        <IconButton variant="tertiary" size="sm" aria-label="Undo — nothing to undo" disabled>
          <ArrowCounterClockwise weight="bold" />
        </IconButton>
      </ToolbarItem>
      <ToolbarSeparator />
      <ToolbarItem
        priority={1}
        overflowContent={
          <MenuGroup>
            <MenuLabel>Note view</MenuLabel>
            <MenuRadioGroup value={view} onValueChange={setView}>
              <MenuRadioItem value="write">Write</MenuRadioItem>
              <MenuRadioItem value="preview">Preview</MenuRadioItem>
              <MenuRadioItem value="split">Split</MenuRadioItem>
            </MenuRadioGroup>
          </MenuGroup>
        }
      >
        <SegmentedControl aria-label="Note view" value={view} onValueChange={setView}>
          <SegmentedControlItem value="write">Write</SegmentedControlItem>
          <SegmentedControlItem value="preview">Preview</SegmentedControlItem>
          <SegmentedControlItem value="split">Split</SegmentedControlItem>
        </SegmentedControl>
      </ToolbarItem>
      <ToolbarSpacer />
      <ToolbarOverflow aria-label="More note actions">
        <MenuGroup>
          <MenuLabel>Share</MenuLabel>
          <MenuItem icon={<DownloadSimple />} shortcut="⌘S">
            Download as PDF
          </MenuItem>
          <MenuItem icon={<ShareNetwork />}>Share with Cohort 7</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuLabel>Danger zone</MenuLabel>
          <MenuItem variant="danger" icon={<Trash />}>
            Delete this note
          </MenuItem>
        </MenuGroup>
      </ToolbarOverflow>
    </Toolbar>
  );
}

/**
 * The HTML's faculty notes editor: toggle group, separator, actions, segmented view, overflow Menu.
 * Switch `overflow` to `menu` and narrow the canvas (or see "Overflow into the ⋯ menu").
 */
export const Playground: Story = {
  render: (args) => <NotesToolbar {...args} />,
};

/** Hosting search: M4's SearchInput is one stop and keeps ← / → for its caret. */
export const WithSearch: Story = {
  render: () => (
    <Toolbar aria-label="Submission filters">
      <SearchInput size="sm" aria-label="Search submissions" placeholder="Search name or SST-2029-…" className="w-64" />
      <ToolbarSeparator />
      <SegmentedControl aria-label="Status" defaultValue="all">
        <SegmentedControlItem value="all">All</SegmentedControlItem>
        <SegmentedControlItem value="submitted">Submitted</SegmentedControlItem>
        <SegmentedControlItem value="graded">Graded</SegmentedControlItem>
      </SegmentedControl>
      <ToolbarSpacer />
      <IconButton variant="tertiary" size="sm" aria-label="Download the marks sheet">
        <DownloadSimple weight="bold" />
      </IconButton>
    </Toolbar>
  ),
};

/** The HTML's states: rest, pressed, disabled; and a vertical toolbar. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <Spec label="button · rest">
        <Toolbar aria-label="Rest state">
          <ToolbarToggle aria-label="Bold">
            <TextB weight="bold" />
          </ToolbarToggle>
        </Toolbar>
      </Spec>
      <Spec label="button · pressed">
        <Toolbar aria-label="Pressed state">
          <ToolbarToggle aria-label="Bold, on" defaultPressed>
            <TextB weight="bold" />
          </ToolbarToggle>
        </Toolbar>
      </Spec>
      <Spec label="button · disabled">
        <Toolbar aria-label="Disabled state">
          <IconButton variant="tertiary" size="sm" aria-label="Undo — nothing to undo" disabled>
            <ArrowCounterClockwise weight="bold" />
          </IconButton>
        </Toolbar>
      </Spec>
      <Spec label="vertical">
        <Toolbar aria-label="Vertical formatting" orientation="vertical">
          <ToolbarToggle aria-label="Bold" defaultPressed>
            <TextB weight="bold" />
          </ToolbarToggle>
          <ToolbarToggle aria-label="Italic">
            <TextItalic weight="bold" />
          </ToolbarToggle>
          <ToolbarSeparator />
          <IconButton variant="tertiary" size="sm" aria-label="Insert an image">
            <Image weight="bold" />
          </IconButton>
        </Toolbar>
      </Spec>
    </div>
  ),
};

type OverflowArgs = ToolbarProps & {
  /** The toolbar's container width, in rem. */
  width: number;
};

/**
 * `overflow="menu"` at a width you choose (the `width` control, in rem). As it
 * narrows, the insert buttons go first, then the text style group (it has
 * `priority={2}`, the view switcher `1`), each into the ⋯ menu above the
 * menu's own rows. No line ever starts or ends with a separator. Arrow keys
 * skip what moved; a control that moves while focused hands focus to the ⋯.
 */
export const OverflowMenu: StoryObj<OverflowArgs> = {
  name: 'Overflow into the ⋯ menu',
  args: { 'aria-label': 'Lecture note formatting', overflow: 'menu', width: 26, loop: true },
  argTypes: {
    width: { control: { type: 'range', min: 8, max: 48, step: 1 }, description: 'Container width (rem).' },
    'aria-label': { control: 'text' },
    overflow: { control: 'inline-radio', options: ['wrap', 'menu'] },
    loop: { control: 'boolean' },
    orientation: { control: false },
    overflowMenuLabel: { control: false },
    className: { control: false },
  },
  render: ({ width, ...args }) => (
    <div style={{ width: `${width}rem`, maxWidth: '100%', resize: 'horizontal', overflow: 'hidden' }}>
      <NotesToolbar {...args} />
    </div>
  ),
};

/**
 * No `ToolbarOverflow` of your own: the toolbar adds a ⋯ ("More filters",
 * `overflowMenuLabel`) that appears only once something has moved into it.
 * Each item's row is built from its control: the name, `overflowIcon`, and a
 * check for a pressed toggle. Drag the frame's corner to resize.
 */
export const AutomaticOverflow: StoryObj<OverflowArgs> = {
  name: 'Overflow (automatic ⋯)',
  args: { 'aria-label': 'Submission filters', overflow: 'menu', overflowMenuLabel: 'More filters', width: 20 },
  argTypes: {
    width: { control: { type: 'range', min: 8, max: 40, step: 1 }, description: 'Container width (rem).' },
    'aria-label': { control: 'text' },
    overflowMenuLabel: { control: 'text' },
    overflow: { control: false },
    orientation: { control: false },
    loop: { control: false },
    className: { control: false },
  },
  render: ({ width, ...args }) => (
    <div style={{ width: `${width}rem`, maxWidth: '100%', resize: 'horizontal', overflow: 'hidden' }}>
      <Toolbar {...args}>
        <SearchInput size="sm" aria-label="Search submissions" placeholder="Search…" className="w-40" />
        <ToolbarSeparator />
        <ToolbarItem overflowIcon={<Exam />}>
          <ToolbarToggle aria-label="Graded only" defaultPressed>
            <Exam weight="bold" />
          </ToolbarToggle>
        </ToolbarItem>
        <ToolbarItem overflowIcon={<Clock />}>
          <ToolbarToggle aria-label="Late submissions">
            <Clock weight="bold" />
          </ToolbarToggle>
        </ToolbarItem>
        <ToolbarItem overflowIcon={<DownloadSimple />}>
          <IconButton variant="tertiary" size="sm" aria-label="Download the marks sheet">
            <DownloadSimple weight="bold" />
          </IconButton>
        </ToolbarItem>
      </Toolbar>
    </div>
  ),
};
