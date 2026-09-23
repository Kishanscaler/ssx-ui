import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ArrowCounterClockwise,
  Code,
  DotsThree,
  DownloadSimple,
  Image,
  LinkSimple,
  ShareNetwork,
  TextB,
  TextItalic,
  Trash,
} from '@phosphor-icons/react';

import { IconButton } from '../IconButton';
import { Menu, MenuContent, MenuGroup, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '../Menu';
import { SearchInput } from '../SearchInput';
import { SegmentedControl, SegmentedControlItem } from '../SegmentedControl';
import { Spec } from '../Icon/_fixtures/story-layout';
import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarSpacer, ToolbarToggle, type ToolbarProps } from './Toolbar';

const meta = {
  title: 'Organisms/Toolbar',
  component: Toolbar,
  subcomponents: { ToolbarGroup, ToolbarSeparator, ToolbarSpacer, ToolbarToggle } as Record<
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
        ].join(' '),
      },
    },
  },
  args: { 'aria-label': 'Lecture note formatting', orientation: 'horizontal', loop: true },
  argTypes: {
    'aria-label': { control: 'text' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    loop: { control: 'boolean', description: 'Wrap around at the ends.' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

function MoreMenu() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <IconButton variant="tertiary" size="sm" aria-label="More note actions">
          <DotsThree weight="bold" />
        </IconButton>
      </MenuTrigger>
      <MenuContent align="end">
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
      </MenuContent>
    </Menu>
  );
}

function NotesToolbar(props: ToolbarProps) {
  return (
    <Toolbar {...props}>
      <ToolbarGroup aria-label="Text style">
        <ToolbarToggle aria-label="Bold" defaultPressed>
          <TextB weight="bold" />
        </ToolbarToggle>
        <ToolbarToggle aria-label="Italic">
          <TextItalic weight="bold" />
        </ToolbarToggle>
        <ToolbarToggle aria-label="Insert a link">
          <LinkSimple weight="bold" />
        </ToolbarToggle>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup aria-label="Insert">
        <IconButton variant="tertiary" size="sm" aria-label="Insert an image">
          <Image weight="bold" />
        </IconButton>
        <IconButton variant="tertiary" size="sm" aria-label="Insert a code block">
          <Code weight="bold" />
        </IconButton>
        <IconButton variant="tertiary" size="sm" aria-label="Undo — nothing to undo" disabled>
          <ArrowCounterClockwise weight="bold" />
        </IconButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <SegmentedControl aria-label="Note view" defaultValue="write">
        <SegmentedControlItem value="write">Write</SegmentedControlItem>
        <SegmentedControlItem value="preview">Preview</SegmentedControlItem>
        <SegmentedControlItem value="split">Split</SegmentedControlItem>
      </SegmentedControl>
      <ToolbarSpacer />
      <MoreMenu />
    </Toolbar>
  );
}

/** The HTML's faculty notes editor: toggle group, separator, actions, segmented view, overflow Menu. */
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
