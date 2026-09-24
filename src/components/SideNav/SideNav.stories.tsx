import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import {
  Briefcase,
  CalendarDots,
  ChalkboardTeacher,
  ChatsCircle,
  Exam,
  FileText,
  Gear,
  House,
  IdentificationCard,
  Medal,
  UsersThree,
  VideoCamera,
  Books,
} from '@phosphor-icons/react';

import { SideNav, SideNavGroup, SideNavItem, type SideNavEntry } from './SideNav';
import { SideNavCollapseTrigger } from './SideNavRail';
import { Badge } from '../Badge';
import { Row, Spec } from '../Icon/_fixtures/story-layout';

const ADMISSIONS: SideNavEntry[] = [
  {
    label: 'Pipeline',
    items: [
      { label: 'Overview', href: '#overview', icon: <House /> },
      {
        label: 'Applicants',
        href: '#applicants',
        current: true,
        icon: <IdentificationCard />,
        currentIcon: <IdentificationCard weight="fill" />,
      },
      { label: 'Interview slots', href: '#slots', icon: <CalendarDots />, badge: '18', badgeTone: 'brand' },
      { label: 'Scholarship review', href: '#scholarships', icon: <Medal /> },
    ],
  },
  {
    label: 'Cohorts',
    items: [
      { label: 'Batch of 2029', href: '#batch-2029', icon: <UsersThree /> },
      { label: 'Placement drives', href: '#placements', icon: <Briefcase /> },
    ],
  },
  { label: 'Account', items: [{ label: 'Console settings', href: '#settings', icon: <Gear /> }] },
];

/** A rail-width frame, so the specimen wraps the way it does in the shell. */
const Rail = ({ children, surface = false }: { children: React.ReactNode; surface?: boolean }) => (
  <div
    style={{
      width: 240,
      padding: surface ? 'var(--space-4)' : undefined,
      background: surface ? 'var(--surface-subtle)' : undefined,
      borderRadius: surface ? 'var(--radius-lg)' : undefined,
    }}
  >
    {children}
  </div>
);

const meta = {
  title: 'Organisms/SideNav',
  component: SideNav,
  subcomponents: { SideNavGroup, SideNavItem, SideNavCollapseTrigger } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The vertical rail of destinations inside an app shell, grouped by area. One item is the page you are',
          'on (`current` → `aria-current="page"`, the solid brand fill); an item can carry a count `Badge`,',
          'pushed to the trailing edge. Glyphs and badges are children; `SideNavItem asChild` wraps `next/link`.',
          '',
          'Do NOT nest more than one level — a deeper hierarchy is a TreeList, not navigation. A group can fold',
          '(`collapsible`), which is opt-in: the HTML draws plain headings.',
          '',
          'The rail can collapse to its glyphs: give it `defaultCollapsed` (uncontrolled; `false` starts open) or',
          '`collapsed` + `onCollapsedChange`, and put a `SideNavCollapseTrigger` in it. The width animates',
          '(`--sidenav-width` 13rem ↔ `--sidenav-rail-width` 2.875rem), labels fade but stay in each link’s name,',
          'headings fade to a hairline, a count becomes a dot, and each item shows its name in a Tooltip on hover',
          'and focus. Every item needs a glyph in this mode. Reduced motion: it switches without animating.',
          '',
          'Server component; a collapsible group and the collapsible rail are the client islands. Compound API',
          'first; the flat `items` form maps onto a Storyblok blok.',
        ].join('\n'),
      },
    },
  },
  args: {
    'aria-label': 'Admissions operations',
    items: ADMISSIONS,
  },
  argTypes: {
    'aria-label': { control: 'text', description: 'The navigation landmark name.' },
    items: { control: 'object' },
    collapsed: {
      control: 'boolean',
      description: 'Collapsed to its glyphs (controlled). Setting it makes the rail collapsible.',
    },
    defaultCollapsed: { control: false },
    onCollapsedChange: { control: false },
    className: { control: 'text' },
    children: { control: false },
  },
  render: (args) => (
    <Rail>
      <SideNav {...args} />
    </Rail>
  ),
} satisfies Meta<typeof SideNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The flat form, driven by the controls: the admissions ops console (`#side-nav`, "Default"). */
export const Playground: Story = {};

/** The compound API: the student LMS rail, with a `3 due` danger badge and the current page's `-fill` glyph. */
export const StudentLms: Story = {
  name: 'Student LMS (compound)',
  render: () => (
    <Rail surface>
      <SideNav aria-label="Student navigation">
        <SideNavGroup label="Learn">
          <SideNavItem href="#dashboard">
            <House />
            Dashboard
          </SideNavItem>
          <SideNavItem href="#modules" current>
            <Books weight="fill" />
            Modules
          </SideNavItem>
          <SideNavItem href="#assignments">
            <Exam />
            Assignments
            <Badge tone="danger">3 due</Badge>
          </SideNavItem>
          <SideNavItem href="#live">
            <VideoCamera />
            Live classes
          </SideNavItem>
        </SideNavGroup>
        <SideNavGroup label="Community">
          <SideNavItem href="#mentors">
            <ChalkboardTeacher />
            Super Mentors
          </SideNavItem>
          <SideNavItem href="#discussions">
            <ChatsCircle />
            Discussions
          </SideNavItem>
        </SideNavGroup>
      </SideNav>
    </Rail>
  ),
};

/** Every item state side by side (`#side-nav`, "item states"). */
export const ItemStates: Story = {
  name: 'Item states',
  render: () => (
    <Row align="start">
      <Spec label="rest · current · count · disabled · long label">
        <Rail>
          <SideNav aria-label="Side nav item states">
            <SideNavGroup label="States">
              <SideNavItem href="#rest">
                <FileText />
                rest
              </SideNavItem>
              <SideNavItem href="#current" current>
                <FileText weight="fill" />
                current
              </SideNavItem>
              <SideNavItem href="#count">
                <FileText />
                with count
                <Badge tone="danger">12</Badge>
              </SideNavItem>
              <SideNavItem disabled>
                <FileText />
                disabled — Scholarship review, needs Dean approval
              </SideNavItem>
              <SideNavItem href="#long">
                <FileText />a destination whose label is far too long to sit on one line
              </SideNavItem>
            </SideNavGroup>
          </SideNav>
        </Rail>
      </Spec>
      <Spec label="on the rail surface (inside an AppShell)">
        <Rail surface>
          <SideNav aria-label="Side nav on the rail">
            <SideNavItem href="#rest">
              <FileText />
              rest
            </SideNavItem>
            <SideNavItem href="#current" current>
              <FileText weight="fill" />
              current
            </SideNavItem>
            <SideNavItem href="#count">
              <FileText />
              with count
              <Badge tone="brand">18</Badge>
            </SideNavItem>
          </SideNav>
        </Rail>
      </Spec>
    </Row>
  ),
};

/**
 * `collapsible` groups: the heading becomes a disclosure button with a caret.
 * Click or Tab + Enter/Space to fold. "Cohorts" starts closed; the group
 * holding the current page stays open.
 */
export const CollapsibleGroups: Story = {
  name: 'Collapsible groups',
  args: {
    'aria-label': 'Admissions navigation',
    items: [
      {
        label: 'Pipeline',
        collapsible: true,
        items: [
          { label: 'Applications', href: '#applications', current: true, icon: <FileText weight="fill" />, badge: '4,182' },
          { label: 'Interviews', href: '#interviews', icon: <CalendarDots />, badge: '96', badgeTone: 'info' },
          { label: 'Offers', href: '#offers', icon: <Medal />, badge: '41', badgeTone: 'success' },
        ],
      },
      {
        label: 'Cohorts',
        collapsible: true,
        defaultOpen: false,
        items: [
          { label: 'Batch of 2029', href: '#batch-2029', icon: <UsersThree /> },
          { label: 'Placement drives', href: '#placements', icon: <Briefcase /> },
        ],
      },
    ],
  },
};

/** `SideNavItem asChild` renders your router link (here a plain `<a>` standing in for `next/link`). */
export const AsChildLinks: Story = {
  name: 'asChild (next/link)',
  render: () => (
    <Rail>
      <SideNav aria-label="Faculty portal">
        <SideNavItem asChild current>
          <a href="#grading">
            <Exam weight="fill" />
            Grading queue
            <Badge tone="warning">27</Badge>
          </a>
        </SideNavItem>
        <SideNavItem asChild>
          <a href="#cohort">
            <UsersThree />
            Cohort 7 · Bengaluru
          </a>
        </SideNavItem>
      </SideNav>
    </Rail>
  ),
};

/** The frame a collapsible rail sits in: the rail surface, sized by the nav, beside some content. */
const RailFrame = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'flex',
      minHeight: '30rem',
      maxWidth: '100%',
      border: '1px solid var(--border-decorative)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        flex: 'none',
        padding: 'var(--space-4)',
        background: 'var(--surface-subtle)',
        borderInlineEnd: '1px solid var(--border-decorative)',
      }}
    >
      {children}
    </div>
    <div className="type-body text-content-secondary" style={{ flex: 1, minWidth: 0, padding: 'var(--space-6)' }}>
      <p className="type-h3 text-content" style={{ margin: 0 }}>
        Assignments
      </p>
      <p style={{ marginBlock: 'var(--space-2) 0' }}>
        The content column takes the width the rail gives back.
      </p>
    </div>
  </div>
);

const LMS: SideNavEntry[] = [
  {
    label: 'Learn',
    items: [
      { label: 'Dashboard', href: '#dashboard', icon: <House /> },
      { label: 'Modules', href: '#modules', icon: <Books /> },
      {
        label: 'Assignments',
        href: '#assignments',
        current: true,
        icon: <Exam />,
        currentIcon: <Exam weight="fill" />,
        badge: '3 due',
        badgeTone: 'danger',
      },
      { label: 'Live classes', href: '#live', icon: <VideoCamera /> },
    ],
  },
  {
    label: 'Community',
    items: [
      { label: 'Super Mentors', href: '#mentors', icon: <ChalkboardTeacher /> },
      { label: 'Discussions', href: '#discussions', icon: <ChatsCircle />, badge: '12', badgeTone: 'brand' },
    ],
  },
  {
    label: 'Career',
    collapsible: true,
    items: [
      { label: 'Placement drives', href: '#placements', icon: <Briefcase /> },
      { label: 'Mock interviews', href: '#mocks', icon: <CalendarDots /> },
    ],
  },
];

/**
 * The collapsed icon rail, controlled by the `collapsed` control (the trigger
 * also flips it). Hover or Tab onto an item for its name; counts are dots;
 * the headings are hairlines. The width and the labels animate both ways.
 */
export const Collapsed: Story = {
  args: { 'aria-label': 'Student navigation', items: LMS, collapsed: true },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return (
      <RailFrame>
        <SideNav {...args} onCollapsedChange={(collapsed) => updateArgs({ collapsed })}>
          <SideNavCollapseTrigger />
        </SideNav>
      </RailFrame>
    );
  },
};

/**
 * Uncontrolled (`defaultCollapsed={false}`): the trigger at the foot of the
 * rail folds it and opens it again. `aria-expanded` on the trigger says
 * whether the labels are showing. The "Career" group is collapsible: it is
 * held open while the rail is collapsed and keeps its own state.
 */
export const ToggleInteractive: Story = {
  name: 'Toggle (interactive)',
  args: { 'aria-label': 'Student navigation', items: LMS, collapsed: undefined },
  argTypes: { collapsed: { control: false } },
  render: (args) => (
    <RailFrame>
      <SideNav {...args} defaultCollapsed={false}>
        <SideNavCollapseTrigger />
      </SideNav>
    </RailFrame>
  ),
};
