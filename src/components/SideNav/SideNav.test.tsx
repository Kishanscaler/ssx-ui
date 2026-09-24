import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Badge } from '../Badge';
import { SideNav, SideNavGroup, SideNavItem } from './SideNav';
import { SideNavCollapseTrigger } from './SideNavRail';

function Glyph() {
  return <svg data-testid="glyph" />;
}

function Console(props: Partial<React.ComponentProps<typeof SideNav>>) {
  return (
    <SideNav aria-label="Admissions operations" {...props}>
      <SideNavGroup label="Pipeline">
        <SideNavItem href="/overview">
          <Glyph />
          Overview
        </SideNavItem>
        <SideNavItem href="/applicants" current>
          Applicants
        </SideNavItem>
        <SideNavItem href="/slots">
          Interview slots
          <Badge tone="brand">18</Badge>
        </SideNavItem>
      </SideNavGroup>
      <SideNavGroup label="Account">
        <SideNavItem disabled>Scholarship review, needs Dean approval</SideNavItem>
      </SideNavGroup>
    </SideNav>
  );
}

describe('SideNav', () => {
  it('is a named navigation landmark with one current page', () => {
    render(<Console />);
    const nav = screen.getByRole('navigation', { name: 'Admissions operations' });
    expect(nav).toHaveAttribute('data-slot', 'sidenav');
    expect(screen.getByRole('link', { name: 'Applicants' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Applicants' })).toHaveAttribute('data-current', '');
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  it('defaults the landmark name to Primary', () => {
    render(<SideNav />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });

  it('names each group by its heading and reads the heading once', () => {
    render(<Console />);
    const group = screen.getByRole('group', { name: 'Pipeline' });
    expect(group).toHaveAttribute('data-slot', 'sidenav-group');
    const heading = group.querySelector('[data-slot="sidenav-group-label"]');
    expect(heading).toHaveTextContent('Pipeline');
    expect(heading).toHaveAttribute('aria-hidden', 'true');
  });

  it('names a non-string heading through an id', () => {
    render(
      <SideNav>
        <SideNavGroup id="cohorts" label={<span>Cohorts</span>}>
          <SideNavItem href="/2029">Batch of 2029</SideNavItem>
        </SideNavGroup>
      </SideNav>,
    );
    expect(screen.getByRole('group', { name: 'Cohorts' })).toHaveAttribute('aria-labelledby', 'cohorts-label');
  });

  it('puts the badge in the link name and at the trailing edge', () => {
    render(<Console />);
    const link = screen.getByRole('link', { name: 'Interview slots 18' });
    expect(link.querySelector('[data-slot="badge"]')).toBeInTheDocument();
    expect(link.className).toContain('[&>[data-slot=badge]]:ms-auto');
  });

  it('renders a disabled item as a span that is not a link or a tab stop', () => {
    render(<Console />);
    const label = screen.getByText('Scholarship review, needs Dean approval');
    expect(label).toHaveAttribute('data-slot', 'sidenav-item-label');
    const item = label.closest('[data-slot="sidenav-item"]') as HTMLElement;
    expect(item.tagName).toBe('SPAN');
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(item).not.toHaveAttribute('href');
    expect(item).not.toHaveAttribute('tabindex');
  });

  it('asChild renders the caller link (next/link) with every style', () => {
    render(
      <SideNav>
        <SideNavItem asChild current>
          <a href="/modules" data-router="">
            Modules
          </a>
        </SideNavItem>
      </SideNav>,
    );
    const link = screen.getByRole('link', { name: 'Modules' });
    expect(link).toHaveAttribute('data-router', '');
    expect(link).toHaveAttribute('data-slot', 'sidenav-item');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('href', '/modules');
  });

  it('merges className last and forwards refs', () => {
    const navRef = React.createRef<HTMLElement>();
    const itemRef = React.createRef<HTMLAnchorElement>();
    const groupRef = React.createRef<HTMLDivElement>();
    render(
      <SideNav ref={navRef} className="gap-4">
        <SideNavGroup ref={groupRef} label="Learn" className="gap-2">
          <SideNavItem ref={itemRef} href="/x" className="px-4">
            X
          </SideNavItem>
        </SideNavGroup>
      </SideNav>,
    );
    expect(navRef.current?.tagName).toBe('NAV');
    expect(groupRef.current).toHaveAttribute('data-slot', 'sidenav-group');
    expect(itemRef.current?.tagName).toBe('A');
    expect(navRef.current?.className).toContain('gap-4');
    expect(navRef.current?.className).not.toContain('gap-0.5');
    expect(itemRef.current?.className).toContain('px-4');
    expect(itemRef.current?.className).not.toContain('px-3');
  });

  it('flat form: items and groups, badge tone, current glyph', () => {
    render(
      <SideNav
        aria-label="Student navigation"
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          {
            label: 'Learn',
            items: [
              {
                label: 'Modules',
                href: '/modules',
                current: true,
                icon: <svg data-testid="regular" />,
                currentIcon: <svg data-testid="fill" />,
              },
              { label: 'Assignments', href: '/assignments', badge: '3 due', badgeTone: 'danger' },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('group', { name: 'Learn' })).toBeInTheDocument();
    expect(screen.getByTestId('fill')).toBeInTheDocument();
    expect(screen.queryByTestId('regular')).toBeNull();
    const badge = screen.getByText('3 due');
    expect(badge).toHaveAttribute('data-tone', 'danger');
  });

  it('a collapsible group is a disclosure the keyboard can fold', () => {
    render(
      <SideNav>
        <SideNavGroup label="Cohorts" collapsible>
          <SideNavItem href="/2029">Batch of 2029</SideNavItem>
        </SideNavGroup>
      </SideNav>,
    );
    const trigger = screen.getByRole('button', { name: 'Cohorts' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('data-slot', 'sidenav-group-trigger');
    const region = screen.getByRole('group', { name: 'Cohorts' });
    expect(trigger).toHaveAttribute('aria-controls', region.id);
    expect(screen.getByRole('link', { name: 'Batch of 2029' })).toBeVisible();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Batch of 2029' })).toBeNull();

    // Buttons activate on Enter / Space natively; the click is what Radix handles.
    trigger.focus();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Batch of 2029' })).toBeInTheDocument();
  });

  it('a collapsible group can start closed', () => {
    render(
      <SideNav items={[{ label: 'Insight', collapsible: true, defaultOpen: false, items: [{ label: 'Funnel reports', href: '/f' }] }]} />,
    );
    expect(screen.getByRole('button', { name: 'Insight' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Funnel reports' })).toBeNull();
  });
});

function Rail(props: Partial<React.ComponentProps<typeof SideNav>>) {
  return (
    <SideNav aria-label="Student navigation" {...props}>
      <SideNavGroup label="Learn">
        <SideNavItem href="/dashboard">
          <Glyph />
          Dashboard
        </SideNavItem>
        <SideNavItem href="/assignments" current>
          <Glyph />
          Assignments
          <Badge tone="danger">3 due</Badge>
        </SideNavItem>
      </SideNavGroup>
      <SideNavGroup label="Cohorts" collapsible defaultOpen={false}>
        <SideNavItem href="/2029">
          <Glyph />
          Batch of 2029
        </SideNavItem>
      </SideNavGroup>
      <SideNavCollapseTrigger />
    </SideNav>
  );
}

describe('SideNav collapsed rail', () => {
  it('a fixed rail (no collapse props) is unchanged: no rail attributes, no tooltip wiring', () => {
    render(<Console />);
    const nav = screen.getByRole('navigation');
    expect(nav).not.toHaveAttribute('data-rail');
    expect(nav.className).not.toContain('--sidenav-width');
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('data-state');
  });

  it('the trigger toggles the rail, with aria-expanded and aria-controls (uncontrolled)', () => {
    const onCollapsedChange = vi.fn();
    render(<Rail defaultCollapsed={false} onCollapsedChange={onCollapsedChange} />);
    const nav = screen.getByRole('navigation', { name: 'Student navigation' });
    expect(nav).toHaveAttribute('data-rail', '');
    expect(nav).not.toHaveAttribute('data-collapsed');
    const trigger = screen.getByRole('button', { name: 'Collapse navigation' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', nav.id);
    expect(nav.id).not.toBe('');

    fireEvent.click(trigger);
    expect(nav).toHaveAttribute('data-collapsed', '');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAccessibleName('Expand navigation');
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(trigger);
    expect(nav).not.toHaveAttribute('data-collapsed');
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
  });

  it('controlled: follows `collapsed` and reports the request', () => {
    const onCollapsedChange = vi.fn();
    const { rerender } = render(<Rail collapsed onCollapsedChange={onCollapsedChange} />);
    const nav = screen.getByRole('navigation');
    const trigger = screen.getByRole('button', { name: 'Expand navigation' });
    fireEvent.click(trigger);
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    expect(nav).toHaveAttribute('data-collapsed', ''); // the owner has not changed it
    rerender(<Rail collapsed={false} onCollapsedChange={onCollapsedChange} />);
    expect(nav).not.toHaveAttribute('data-collapsed');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('collapsed: every link, group and count keeps its accessible name', () => {
    render(<Rail defaultCollapsed />);
    expect(screen.getByRole('navigation')).toHaveAttribute('data-collapsed', '');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Assignments 3 due' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('group', { name: 'Learn' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Cohorts' })).toBeInTheDocument();
    // The labels are faded by CSS on the rail, never removed.
    expect(screen.getByText('Dashboard')).toHaveAttribute('data-slot', 'sidenav-item-label');
  });

  it('collapsed: an item shows its name (and count) in a tooltip on focus', async () => {
    render(<Rail defaultCollapsed />);
    act(() => screen.getByRole('link', { name: 'Assignments 3 due' }).focus());
    const tip = await screen.findByRole('tooltip');
    expect(tip).toHaveTextContent('Assignments · 3 due');
  });

  it('open: focusing an item shows no tooltip', async () => {
    render(<Rail defaultCollapsed={false} />);
    act(() => screen.getByRole('link', { name: 'Dashboard' }).focus());
    await act(() => new Promise((r) => setTimeout(r, 0)));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('a collapsible group is held open while collapsed, and gets its own state back', () => {
    render(<Rail defaultCollapsed={false} />);
    const heading = screen.getByRole('button', { name: 'Cohorts' });
    expect(heading).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Batch of 2029' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse navigation' }));
    expect(screen.getByRole('link', { name: 'Batch of 2029' })).toBeInTheDocument();
    // The heading leaves the tab order and the tree while collapsed.
    expect(screen.queryByRole('button', { name: 'Cohorts' })).toBeNull();
    expect(heading).toHaveAttribute('tabindex', '-1');

    fireEvent.click(screen.getByRole('button', { name: 'Expand navigation' }));
    expect(screen.getByRole('button', { name: 'Cohorts' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Batch of 2029' })).toBeNull();
  });

  it('the trigger renders nothing outside a collapsible rail', () => {
    render(
      <SideNav>
        <SideNavItem href="/x">X</SideNavItem>
        <SideNavCollapseTrigger />
      </SideNav>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('the rail takes a className last and forwards its ref', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <SideNav ref={ref} defaultCollapsed={false} className="[--sidenav-width:15rem]">
        <SideNavCollapseTrigger />
      </SideNav>,
    );
    expect(ref.current?.tagName).toBe('NAV');
    expect(ref.current?.className).toContain('[--sidenav-width:15rem]');
    expect(ref.current).toHaveAttribute('data-slot', 'sidenav');
  });
});
