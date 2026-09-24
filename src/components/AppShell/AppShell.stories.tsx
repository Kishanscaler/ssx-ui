import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Bell,
  Books,
  CalendarDots,
  ChalkboardTeacher,
  ChartBar,
  ChatsCircle,
  CheckCircle,
  CurrencyInr,
  Exam,
  FileText,
  House,
  MagnifyingGlass,
  Medal,
  VideoCamera,
} from "@phosphor-icons/react";

import {
  AppShell,
  AppShellContent,
  AppShellMain,
  AppShellSide,
  type AppShellMobileNav,
  type AppShellVariant,
} from "./AppShell";
import { AppShellNavTrigger } from "./AppShellNav";
import { Avatar, AvatarFallback } from "../Avatar";
import { Badge } from "../Badge";
import { Breadcrumbs } from "../Breadcrumbs";
import { Button } from "../Button";
import {
  Card,
  CardBody,
  CardEyebrow,
  CardFooter,
  CardTitle,
  CardDescription,
} from "../Card";
import { Heading } from "../Heading";
import { IconButton } from "../IconButton";
import { Logo } from "../Logo";
import { ProgressBar } from "../ProgressBar";
import {
  SideNav,
  SideNavGroup,
  SideNavItem,
  type SideNavEntry,
} from "../SideNav";
import { Text } from "../Text";
import {
  TopNav,
  TopNavActions,
  TopNavBrand,
  TopNavLink,
  TopNavLinks,
} from "../TopNav";

const VARIANTS: AppShellVariant[] = ["page", "embedded"];
const MOBILE_NAV: AppShellMobileNav[] = ["drawer", "stack"];

const LMS_NAV: SideNavEntry[] = [
  {
    label: "Learn",
    items: [
      { label: "Dashboard", href: "#dashboard", icon: <House /> },
      {
        label: "Modules",
        href: "#modules",
        current: true,
        icon: <Books />,
        currentIcon: <Books weight="fill" />,
      },
      {
        label: "Assignments",
        href: "#assignments",
        icon: <Exam />,
        badge: "3 due",
        badgeTone: "danger",
      },
      { label: "Live classes", href: "#live", icon: <VideoCamera /> },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Super Mentors", href: "#mentors", icon: <ChalkboardTeacher /> },
      { label: "Discussions", href: "#discussions", icon: <ChatsCircle /> },
    ],
  },
];

/** The LMS top bar (`.shell__main > .topnav`), with the small-screen nav trigger before the brand. */
function LmsBar() {
  return (
    <TopNav collapse="scroll" collapseBelow="sm">
      <AppShellNavTrigger />
      <TopNavBrand href="#" aria-label="Scaler School of Technology home" />
      <TopNavLinks aria-label="Section">
        <TopNavLink href="#overview">Overview</TopNavLink>
        <TopNavLink href="#modules" current>
          Modules
        </TopNavLink>
        <TopNavLink href="#placements">Placements</TopNavLink>
      </TopNavLinks>
      <TopNavActions collapsible={false}>
        <IconButton variant="tertiary" aria-label="Notifications, 4 unread">
          <Bell />
        </IconButton>
        <Avatar aria-label="Signed in as Aarav Krishnan">
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
      </TopNavActions>
    </TopNav>
  );
}

/** Cancels the canvas decorator's gutter padding, so a `page` shell meets the viewport edges. */
const Bleed = ({ children }: { children: React.ReactNode }) => (
  <div style={{ margin: "calc(var(--space-gutter) * -1)" }}>{children}</div>
);

/** The HTML anatomy's content well: course header, progress, two cards, week list. */
function LmsPage() {
  return (
    <div style={{ display: "grid", gap: "var(--space-6)" }}>
      <div style={{ display: "grid", gap: "var(--space-2)" }}>
        <Heading as="p" size="eyebrow">
          Batch of 2029 · Cohort 7 · Bengaluru
        </Heading>
        <Heading as="h1" size="1">
          Data Structures &amp; Algorithms
        </Heading>
        <Text size="sm" tone="secondary">
          Week 6 of 14 · Aarav Krishnan · SST-2029-0416
        </Text>
      </div>
      <div style={{ display: "grid", gap: "var(--space-2)" }}>
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            alignItems: "center",
          }}
        >
          <Text size="sm" tone="secondary">
            Module progress
          </Text>
          <Badge tone="brand">62% complete</Badge>
        </div>
        <ProgressBar value={62} aria-label="Module progress" />
      </div>
      <div
        style={{
          display: "grid",
          gap: "var(--space-4)",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
        }}
      >
        <Card>
          <CardBody>
            <CardEyebrow>Next live class</CardEyebrow>
            <CardTitle>Balanced BSTs &amp; AVL rotations</CardTitle>
            <CardDescription>
              Tue 10 Mar 2026, 6:30 PM IST · Auditorium 2
            </CardDescription>
          </CardBody>
          <CardFooter>
            <Button size="sm">Join class</Button>
            <Button size="sm" variant="tertiary">
              Add to calendar
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardBody>
            <CardEyebrow>Due next</CardEyebrow>
            <CardTitle>Assignment 6 — Order-statistic trees</CardTitle>
            <CardDescription>
              Due 14 Mar 2026, 11:59 PM · 2 attempts left
            </CardDescription>
          </CardBody>
          <CardFooter>
            <Button size="sm" variant="secondary">
              Open assignment
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

const meta = {
  title: "Organisms/AppShell",
  component: AppShell,
  subcomponents: {
    AppShellSide,
    AppShellMain,
    AppShellContent,
    AppShellNavTrigger,
  } as Record<string, React.ComponentType<unknown>>,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "The persistent frame every signed-in surface sits inside: side rail (a SideNav), top bar (a TopNav),",
          "scrolling content well. The student LMS, the faculty portal, the admissions console — never a",
          "marketing or landing page.",
          "",
          "Landmarks: the SideNav is the `nav`, the TopNav the `header`, `AppShellContent` the `main`. The first",
          'tab stop is a skip link ("Skip to main content") that appears on focus.',
          "",
          'Below `md` (1056px) the shell is one column. `mobileNav="drawer"` (default) moves the rail into a modal',
          "drawer from the leading edge, opened by `AppShellNavTrigger` — put it in your TopNav, before the brand",
          '(the HTML: "the app owns the trigger"). `mobileNav="stack"` is the HTML\'s literal rule: the rail stacks',
          "above the content. Narrow the canvas below 1056px to see it.",
          "",
          '`variant="page"` is the real frame (full viewport, sticky rail and bar); `embedded` is the HTML\'s',
          "bordered specimen. Server component; the drawer is the client island.",
        ].join("\n"),
      },
    },
  },
  args: {
    variant: "page",
    mobileNav: "drawer",
    navLabel: "Navigation",
    defaultNavOpen: false,
    skipLinkLabel: "Skip to main content",
    mainId: "main-content",
    navItems: LMS_NAV,
    navItemsLabel: "Student navigation",
  },
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    mobileNav: { control: "select", options: MOBILE_NAV },
    navLabel: { control: "text" },
    defaultNavOpen: { control: "boolean" },
    navOpen: { control: false },
    onNavOpenChange: { control: false },
    skipLinkLabel: { control: "text" },
    mainId: { control: "text" },
    navItems: { control: "object" },
    navItemsLabel: { control: "text" },
    side: { control: false },
    header: { control: false },
    className: { control: "text" },
    children: { control: false },
  },
  render: (args) => {
    const shell = (
      <AppShell
        key={`${args.mobileNav}-${String(args.defaultNavOpen)}`}
        {...args}
        header={<LmsBar />}
      >
        <LmsPage />
      </AppShell>
    );
    return args.variant === "embedded" ? shell : <Bleed>{shell}</Bleed>;
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The flat form, driven by the controls: the SST student LMS. Tab once for the skip link. */
export const Playground: Story = {};

/** The HTML anatomy (`#app-shell`), compound API, in the bordered `embedded` specimen. */
export const StudentLms: Story = {
  name: "Student LMS (embedded, compound)",
  render: () => (
    <div style={{ padding: "var(--space-6)" }}>
      <AppShell variant="embedded">
        <AppShellSide>
          <SideNav aria-label="Student navigation" items={LMS_NAV} />
        </AppShellSide>
        <AppShellMain>
          <LmsBar />
          <AppShellContent>
            <LmsPage />
          </AppShellContent>
        </AppShellMain>
      </AppShell>
    </div>
  ),
};

/**
 * The admissions ops console (`admissions-ops-console.html`): the brand at
 * the top of the rail, a 48px bar with breadcrumbs, count badges on the rail.
 */
export const AdmissionsConsole: Story = {
  name: "Admissions ops console",
  render: () => (
    <Bleed>
      <AppShell>
        <AppShellSide>
          <span
            style={{
              display: "flex",
              padding: "0 var(--space-3) var(--space-2)",
            }}
          >
            <Logo className="h-[22px]" />
          </span>
          <SideNav aria-label="Admissions navigation">
            <SideNavGroup label="Pipeline">
              <SideNavItem href="#applications" current>
                <FileText weight="fill" />
                Applications
                <Badge>4,182</Badge>
              </SideNavItem>
              <SideNavItem href="#screening">
                <MagnifyingGlass />
                Screening
                <Badge tone="warning">318</Badge>
              </SideNavItem>
              <SideNavItem href="#interviews">
                <CalendarDots />
                Interviews
                <Badge tone="info">96</Badge>
              </SideNavItem>
              <SideNavItem href="#offers">
                <CheckCircle />
                Offers
                <Badge tone="success">41</Badge>
              </SideNavItem>
            </SideNavGroup>
            <SideNavGroup label="Operations">
              <SideNavItem href="#scholarships">
                <Medal />
                Scholarships
              </SideNavItem>
              <SideNavItem href="#fees">
                <CurrencyInr />
                Fees &amp; payments
              </SideNavItem>
              <SideNavItem href="#documents">
                <FileText />
                Documents
                <Badge tone="danger">7</Badge>
              </SideNavItem>
            </SideNavGroup>
            <SideNavGroup label="Insight">
              <SideNavItem href="#funnel">
                <ChartBar />
                Funnel reports
              </SideNavItem>
            </SideNavGroup>
          </SideNav>
        </AppShellSide>
        <AppShellMain>
          <TopNav size="sm" collapse="none" aria-label="Console bar">
            <AppShellNavTrigger size="sm" />
            <Breadcrumbs
              items={[
                { label: "Admissions", href: "#" },
                { label: "Batch of 2030", href: "#" },
                { label: "Round 2 applications" },
              ]}
            />
            <TopNavActions collapsible={false}>
              <Badge tone="warning">Round 2 closes in 6 days</Badge>
              <IconButton
                variant="tertiary"
                size="sm"
                aria-label="Notifications, 12 unread"
              >
                <Bell weight="bold" />
              </IconButton>
              <Avatar
                size="sm"
                aria-label="Kishan Vagale, admissions operations"
              >
                <AvatarFallback>KV</AvatarFallback>
              </Avatar>
            </TopNavActions>
          </TopNav>
          <AppShellContent className="grid content-start gap-2">
            <Heading as="h1" size="2">
              Round 2 applications
            </Heading>
            <Text tone="secondary" size="sm">
              4,182 applications · 318 awaiting review · 96 interviews booked
            </Text>
          </AppShellContent>
        </AppShellMain>
      </AppShell>
    </Bleed>
  ),
};

/** `mobileNav="drawer"`, starting open: below 1056px the rail is a modal drawer from the leading edge. Narrow the canvas. */
export const MobileDrawer: Story = {
  name: "Mobile · drawer (open)",
  args: { defaultNavOpen: true },
};

/** `mobileNav="stack"`: below 1056px the HTML's literal rule, the rail above the content. Narrow the canvas. */
export const MobileStack: Story = {
  name: "Mobile · stack",
  args: { mobileNav: "stack", variant: "embedded" },
};
