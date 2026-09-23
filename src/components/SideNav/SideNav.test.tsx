import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Badge } from '../Badge';
import { SideNav, SideNavGroup, SideNavItem } from './SideNav';

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
    const item = screen.getByText('Scholarship review, needs Dean approval');
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
