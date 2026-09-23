import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  EmptyState,
  EmptyStateActions,
  EmptyStateArt,
  EmptyStateDescription,
  EmptyStateTitle,
  type EmptyStateActionVariant,
  type EmptyStateArtTone,
} from './EmptyState';
import { Button } from '../Button';
import { ArrowClockwise, MagnifyingGlass, Plus, UsersThree, WarningCircle } from '../Icon/_fixtures/phosphor';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const ART_TONES: EmptyStateArtTone[] = ['brand', 'neutral', 'info', 'success', 'warning', 'danger', 'solid'];
const ACTION_VARIANTS: EmptyStateActionVariant[] = ['primary', 'secondary', 'tertiary'];
const ICONS = { cohort: <UsersThree />, search: <MagnifyingGlass />, error: <WarningCircle />, none: undefined };

/** The HTML's `.spec` frame: a bordered region the empty state fills. */
const Region = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      border: '1px solid var(--border-decorative)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-default)',
      maxWidth: 720,
    }}
  >
    {children}
  </div>
);

const meta = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
  subcomponents: {
    EmptyStateArt,
    EmptyStateTitle,
    EmptyStateDescription,
    EmptyStateActions,
  } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'What fills a region that has nothing in it. Three different reasons — nothing created yet, nothing',
          'matched, something broke — each with its own words and action. One generic "No data" for all',
          'three is the most common way this goes wrong.',
          '',
          'Delight is allowed on an empty state; never on an error. An error says what failed, what survived,',
          'gives a way forward and a reference to quote, and sets `artTone="danger"` so the glyph agrees with',
          'the state.',
        ].join('\n'),
      },
    },
  },
  args: {
    icon: 'cohort' as unknown as React.ReactNode,
    artTone: 'brand',
    title: 'No cohorts yet',
    titleAs: 'h3',
    description:
      'Cohorts group students by intake, campus and programme. Create your first one and applications will start landing here.',
    actionLabel: 'Create a cohort',
    actionHref: '#empty-state',
    actionVariant: 'primary',
  },
  argTypes: {
    icon: { control: 'select', options: Object.keys(ICONS), mapping: ICONS, description: 'The art glyph (your svg).' },
    artTone: { control: 'select', options: ART_TONES },
    title: { control: 'text' },
    titleAs: { control: 'select', options: ['h2', 'h3', 'h4', 'h5', 'h6'] },
    description: { control: 'text' },
    actionLabel: { control: 'text' },
    actionHref: { control: 'text' },
    actionVariant: { control: 'select', options: ACTION_VARIANTS },
    className: { control: 'text' },
    actions: { control: false },
  },
  render: (args) => (
    <Region>
      <EmptyState {...args} />
    </Region>
  ),
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The HTML's `#empty-state` section: the three reasons for emptiness. */
export const ThreeReasons: Story = {
  render: () => (
    <Stack>
      <Spec label="first run · invitational" wide>
        <Region>
          <EmptyState
            icon={<UsersThree />}
            title="No cohorts yet"
            description="Cohorts group students by intake, campus and programme. Create your first one and applications will start landing here."
            actions={
              <Button>
                <Plus weight="bold" />
                Create a cohort
              </Button>
            }
          />
        </Region>
      </Spec>
      <Spec label="no results · neutral, offers a way back" wide>
        <Region>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="No students match that search"
            description="Nothing matched “quantitative finance elective — Hyderabad campus, Batch of 2029”. Try a shorter query, or clear the campus and cohort filters and search across all 412 students."
            actions={<Button variant="secondary">Clear all filters</Button>}
          />
        </Region>
      </Spec>
      <Spec label="error · plain, no jokes, offers a retry" wide>
        <Region>
          <EmptyState>
            <EmptyStateArt tone="danger">
              <WarningCircle />
            </EmptyStateArt>
            <EmptyStateTitle>We couldn’t load the placement report</EmptyStateTitle>
            <EmptyStateDescription>
              The placements service didn’t respond. Nothing has been lost — your filters are still applied. Try
              again, and if it keeps failing quote reference <span className="tabular-nums">PLC-5502</span> to support.
            </EmptyStateDescription>
            <EmptyStateActions>
              <Button>
                <ArrowClockwise weight="bold" />
                Try again
              </Button>
              <Button variant="tertiary">Contact support</Button>
            </EmptyStateActions>
          </EmptyState>
        </Region>
      </Spec>
    </Stack>
  ),
};

/** The `.empty__art--*` family. */
export const ArtTones: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      {ART_TONES.map((tone) => (
        <Spec key={tone} label={tone}>
          <EmptyStateArt tone={tone}>{tone === 'danger' ? <WarningCircle /> : <UsersThree />}</EmptyStateArt>
        </Spec>
      ))}
    </div>
  ),
};
