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
const COLLAPSES: TopNavCollapse[] = ['menu', 'scroll', 'none'];
const ACTIONS_ON_MOBILE: TopNavActionsOnMobile[] = ['menu', 'bar'];

const LANDING_LINKS: TopNavLinkData[] = [
  { label: 'Programmes', href: '#programmes', current: true },
  { label: 'Curriculum', href: '#curriculum' },
  { label: 'Outcomes', href: '#outcomes' },
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
          'Below `sm` (672px), `collapse="menu"` folds the links and actions behind a menu button (a disclosure',
          'panel under the bar: `aria-expanded`, Escape closes and returns focus); `collapse="scroll"` is the HTML',
          "shell's fallback (the bar wraps and the link row scrolls). `TopNavLink asChild` wraps `next/link`.",
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
    collapse: 'menu',
    actionsOnMobile: 'menu',
    menuLabel: 'Menu',
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
    actionsOnMobile: { control: 'select', options: ACTIONS_ON_MOBILE },
    menuLabel: { control: 'text' },
    defaultMenuOpen: { control: 'boolean' },
    className: { control: 'text' },
    children: { control: false },
  },
  render: (args) => <TopNav key={`${args.collapse}-${String(args.defaultMenuOpen)}`} {...args} />,
} satisfies Meta<typeof TopNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The flat form, driven by the controls. Narrow the canvas below 672px for the menu button. */
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

/** Phone width with the menu open, flat form, "Apply now" pinned in the bar. */
export const MobileMenuOpen: Story = {
  name: 'Small screen · menu open',
  args: { defaultMenuOpen: true, actionsOnMobile: 'menu' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
