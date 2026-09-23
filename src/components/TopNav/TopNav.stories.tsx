import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  TopNav,
  TopNavActions,
  TopNavBrand,
  TopNavLink,
  TopNavLinks,
  TopNavMenu,
  type TopNavActionData,
  type TopNavActionsOnMobile,
  type TopNavCollapse,
  type TopNavCollapseBelow,
  type TopNavLinkData,
  type TopNavSize,
} from './TopNav';
import { TopNavToggle } from './TopNavToggle';
import { Avatar, AvatarFallback } from '../Avatar';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Input } from '../Input';
import { Logo } from '../Logo';
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '../Menu';
import { Bell, SignOut, User } from '@phosphor-icons/react';

const SIZES: TopNavSize[] = ['md', 'sm'];
const COLLAPSES: TopNavCollapse[] = ['drawer', 'menu', 'scroll', 'none'];
const COLLAPSE_BELOW: TopNavCollapseBelow[] = ['sm', 'md', 'lg'];
const ACTIONS_ON_MOBILE: TopNavActionsOnMobile[] = ['primary', 'menu', 'bar'];

const LANDING_LINKS: TopNavLinkData[] = [
  { label: 'Programmes', href: '#programmes', current: true },
  { label: 'Curriculum', href: '#curriculum' },
  {
    label: 'Outcomes',
    items: [
      { label: 'Placements', href: '#placements', description: 'Median CTC, top recruiters, the 2026 report' },
      { label: 'Alumni stories', href: '#alumni', description: 'Where the Batch of 2025 went next' },
    ],
  },
  { label: 'Campus life', href: '#campus' },
  { label: 'Fees & scholarships', href: '#fees' },
];

const LANDING_ACTIONS: TopNavActionData[] = [
  { label: 'Student login', href: '#login', variant: 'tertiary' },
  { label: 'Apply now', href: '#apply', variant: 'primary' },
];

const meta = {
  title: 'Organisms/TopNav',
  component: TopNav,
  subcomponents: { TopNavBrand, TopNavLinks, TopNavLink, TopNavMenu, TopNavActions, TopNavToggle } as Record<
    string,
    React.ComponentType<unknown>
  >,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'The horizontal bar: brand mark, primary section links (one `aria-current="page"`), and a right',
          'cluster — "Student login" / "Apply now" on a landing page, notifications and the account menu in the',
          'LMS. Page-level actions do NOT go here; they belong in a Toolbar beside the content.',
          '',
          'Below `collapseBelow` (default `md`, 1056px — the same breakpoint as AppShell), `collapse="drawer"`',
          '(the default) folds the links and actions behind a menu button at the leading edge that opens a side',
          'drawer: the links as rows, each `TopNavMenu` as an expandable section, the actions as full-width buttons.',
          '`collapse="menu"` is the push-down panel under the bar (a disclosure: `aria-expanded`, Escape closes',
          'and returns focus); `collapse="scroll"` is the HTML shell\'s fallback (the bar wraps and the link row',
          'scrolls). From the breakpoint up, links that do not fit scroll with a fade instead of overlapping.',
          '',
          '**The primary action stays in the bar.** Collapsed (`drawer`, `menu`), the bar is menu button + brand +',
          'the primary action at the trailing edge; the other actions fold away. The primary action is the first',
          '`Button` with `variant="primary"` in a `TopNavActions` (or the child marked `data-topnav-primary`); in the',
          'flat form, the first `variant: \'primary\'` action. `TopNavActions mobile` / flat `actionsOnMobile`:',
          '`primary` (default) · `menu` (fold everything, the old default) · `bar` (keep everything;',
          '`collapsible={false}` is the older spelling). The modal drawer repeats the primary action in its footer,',
          'because the bar behind its scrim is inert while it is open; the non-modal `menu` panel does not.',
          '`TopNavLink asChild` wraps `next/link`.',
          '',
          'Server component; only the menu button is client code. Compound API first; the flat `brandLabel` /',
          '`links` / `actions` form maps onto a Storyblok blok.',
        ].join('\n'),
      },
    },
  },
  args: {
    brandLabel: 'Scaler',
    brandHref: '#',
    links: LANDING_LINKS,
    linksLabel: 'Primary',
    actions: LANDING_ACTIONS,
    size: 'md',
    collapse: 'drawer',
    collapseBelow: 'md',
    actionsOnMobile: 'primary',
    menuLabel: 'Menu',
    menuCloseLabel: 'Close menu',
    defaultMenuOpen: false,
  },
  argTypes: {
    brandLabel: { control: 'text' },
    brandHref: { control: 'text' },
    logoSrc: { control: 'text' },
    links: { control: 'object' },
    linksLabel: { control: 'text' },
    actions: { control: 'object' },
    size: { control: 'select', options: SIZES },
    collapse: { control: 'select', options: COLLAPSES },
    collapseBelow: { control: 'select', options: COLLAPSE_BELOW },
    menuCloseLabel: { control: 'text' },
    actionsOnMobile: {
      control: 'select',
      options: ACTIONS_ON_MOBILE,
      description:
        'Below `collapseBelow`: `primary` keeps the first primary action in the bar, `menu` folds every action, `bar` keeps them all.',
      table: { defaultValue: { summary: "'primary'" } },
    },
    menuLabel: { control: 'text' },
    defaultMenuOpen: { control: 'boolean' },
    className: { control: 'text' },
    children: { control: false },
  },
  render: (args) => (
    <TopNav key={`${args.collapse}-${args.collapseBelow}-${String(args.defaultMenuOpen)}`} {...args} />
  ),
} satisfies Meta<typeof TopNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The flat form, driven by the controls. Narrow the canvas below 1056px for the menu button. */
export const Playground: Story = {};

/** The marketing landing's bar (`50-landing.html`), compound API, with a dropdown group. */
export const MarketingLanding: Story = {
  name: 'Marketing landing',
  render: () => (
    <TopNav>
      {/* No children: the Scaler <Logo>, following the toolbar's brand and theme. */}
      <TopNavBrand href="#" />
      <TopNavLinks>
        <TopNavLink href="#programmes" current>
          Programmes
        </TopNavLink>
        <TopNavLink href="#curriculum">Curriculum</TopNavLink>
        <TopNavMenu label="Outcomes">
          <MenuItem asChild description="Median CTC, top recruiters, the 2026 report">
            <a href="#placements">Placements</a>
          </MenuItem>
          <MenuItem asChild description="Where the Batch of 2025 went next">
            <a href="#alumni">Alumni stories</a>
          </MenuItem>
        </TopNavMenu>
        <TopNavLink href="#campus">Campus life</TopNavLink>
        <TopNavLink href="#fees">Fees &amp; scholarships</TopNavLink>
      </TopNavLinks>
      <TopNavActions>
        <Button asChild variant="tertiary" size="sm">
          <a href="#login">Student login</a>
        </Button>
        <Button asChild size="sm">
          <a href="#apply">Apply now</a>
        </Button>
      </TopNavActions>
    </TopNav>
  ),
};

function AccountMenu({ size = 'md' as 'sm' | 'md' }) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <IconButton variant="tertiary" size={size} aria-label="Account menu for Aarav Krishnan">
          <Avatar size="sm" aria-hidden="true">
            <AvatarFallback>AK</AvatarFallback>
          </Avatar>
        </IconButton>
      </MenuTrigger>
      <MenuContent align="end">
        <MenuLabel>Aarav Krishnan · SST-2029-0416</MenuLabel>
        <MenuItem icon={<User />}>Profile</MenuItem>
        <MenuSeparator />
        <MenuItem icon={<SignOut />}>Sign out</MenuItem>
      </MenuContent>
    </Menu>
  );
}

/**
 * The HTML's default app bar: logo slot, four links (Modules current),
 * search, and a right cluster (notifications, account menu) that stays in the
 * bar on a phone (`collapsible={false}`).
 */
export const AppBar: Story = {
  name: 'App bar · LMS',
  render: () => (
    <TopNav>
      <TopNavBrand href="#" />
      <TopNavLinks>
        <TopNavLink href="#dashboard">Dashboard</TopNavLink>
        <TopNavLink href="#modules" current>
          Modules
        </TopNavLink>
        <TopNavLink href="#mentors">Mentors</TopNavLink>
        <TopNavLink href="#placements">Placements</TopNavLink>
      </TopNavLinks>
      <TopNavActions className="ms-0">
        <Input
          type="search"
          aria-label="Search students, modules and mentors"
          placeholder="Search students, modules, mentors…"
          className="w-[280px] max-sm:w-full"
        />
      </TopNavActions>
      <TopNavActions collapsible={false}>
        <IconButton variant="tertiary" aria-label="Notifications, 4 unread">
          <Bell />
        </IconButton>
        <AccountMenu />
      </TopNavActions>
    </TopNav>
  ),
};

/**
 * The brand slot takes any `<Logo>`: here the monogram alone, pinned to SSB,
 * for a bar that needs the room. The default (no children) is the full lockup.
 */
export const MonogramBrand: Story = {
  name: 'Brand · monogram',
  render: () => (
    <TopNav>
      <TopNavBrand href="#">
        <Logo brand="ssb" variant="monogram" />
      </TopNavBrand>
      <TopNavLinks>
        <TopNavLink href="#programmes" current>
          Programmes
        </TopNavLink>
        <TopNavLink href="#curriculum">Curriculum</TopNavLink>
      </TopNavLinks>
    </TopNav>
  ),
};

/** `.topnav--sm`: the 48px admissions ops console bar, bold 16px glyphs. */
export const AdminBar: Story = {
  name: 'Density · sm (admin bar)',
  render: () => (
    <TopNav size="sm">
      <TopNavBrand href="#" aria-label="Scaler admissions console" />
      <TopNavLinks aria-label="Console sections">
        <TopNavLink href="#applicants" current>
          Applicants
        </TopNavLink>
        <TopNavLink href="#slots">Interview slots</TopNavLink>
        <TopNavLink href="#scholarships">Scholarships</TopNavLink>
      </TopNavLinks>
      <TopNavActions collapsible={false}>
        <IconButton variant="tertiary" size="sm" aria-label="Notifications, 12 unread">
          <Bell weight="bold" />
        </IconButton>
        <AccountMenu size="sm" />
      </TopNavActions>
    </TopNav>
  ),
};

/** The link states side by side: rest and current (`aria-current="page"`). */
export const LinkStates: Story = {
  name: 'States · links',
  render: () => (
    <div style={{ display: 'flex', gap: 24, padding: 24 }}>
      <TopNavLink href="#placements">Placements</TopNavLink>
      <TopNavLink href="#modules" current>
        Modules
      </TopNavLink>
    </div>
  ),
};

/** `collapse="scroll"`: the HTML shell's small-screen rule (the bar wraps, the link row scrolls). */
export const ScrollCollapse: Story = {
  name: 'Small screen · scroll',
  args: { collapse: 'scroll', actions: [{ label: 'Apply now', href: '#apply' }] },
};

/** Phone width with the drawer open (the default `collapse="drawer"`), flat form. */
export const MobileDrawerOpen: Story = {
  name: 'Small screen · drawer open',
  args: { defaultMenuOpen: true },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

/** `collapse="menu"`: the push-down panel, open; "Outcomes" expands inline. "Apply now" stays in the bar. */
export const MobileMenuOpen: Story = {
  name: 'Small screen · menu open',
  args: { collapse: 'menu', defaultMenuOpen: true },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

/**
 * Phone width, closed (the default): menu button, logo, and the primary
 * action ("Apply now") at the trailing edge. "Student login" is in the drawer.
 */
export const MobilePrimaryAction: Story = {
  name: 'Small screen · primary CTA in the bar',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

/** The compound form: mark any child `data-topnav-primary` to choose which action stays in the bar. */
export const MobilePrimaryMarked: Story = {
  name: 'Small screen · marked primary (compound)',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <TopNav>
      <TopNavBrand href="#" />
      <TopNavLinks>
        <TopNavLink href="#programmes" current>
          Programmes
        </TopNavLink>
        <TopNavLink href="#curriculum">Curriculum</TopNavLink>
      </TopNavLinks>
      <TopNavActions>
        <Button asChild variant="tertiary" size="sm">
          <a href="#login">Student login</a>
        </Button>
        <Button asChild variant="secondary" size="sm" data-topnav-primary="">
          <a href="#brochure">Brochure</a>
        </Button>
      </TopNavActions>
    </TopNav>
  ),
};

/** `actionsOnMobile="menu"`: the behaviour before 2026-09-23, every action in the drawer. */
export const MobileAllActionsFolded: Story = {
  name: 'Small screen · all actions in the drawer',
  args: { actionsOnMobile: 'menu' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

/** `collapseBelow="sm"`: inline from 672px. Too many links for the width scroll with a fade, never overlapping. */
export const InlineOverflow: Story = {
  name: 'Inline · links that do not fit',
  args: {
    collapseBelow: 'sm',
    links: [
      ...LANDING_LINKS,
      { label: 'Admissions', href: '#admissions' },
      { label: 'Hostel & campus', href: '#hostel' },
      { label: 'Research', href: '#research' },
    ],
  },
};
