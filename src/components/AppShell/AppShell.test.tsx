import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { SideNav, SideNavItem } from '../SideNav';
import { TopNav, TopNavBrand } from '../TopNav';
import { AppShell, AppShellContent, AppShellMain, AppShellSide } from './AppShell';
import { AppShellNavTrigger } from './AppShellNav';

function Lms(props: Partial<React.ComponentProps<typeof AppShell>>) {
  return (
    <AppShell {...props}>
      <AppShellSide>
        <SideNav aria-label="Student navigation">
          <SideNavItem href="#dashboard">Dashboard</SideNavItem>
          <SideNavItem href="#modules" current>
            Modules
          </SideNavItem>
        </SideNav>
      </AppShellSide>
      <AppShellMain>
        <TopNav collapse="scroll">
          <AppShellNavTrigger />
          <TopNavBrand href="/" aria-label="Scaler home" />
        </TopNav>
        <AppShellContent>
          <h1>Data Structures &amp; Algorithms</h1>
        </AppShellContent>
      </AppShellMain>
    </AppShell>
  );
}

describe('AppShell', () => {
  it('has the three landmarks, the skip link first', () => {
    const { container } = render(<Lms />);
    const root = container.querySelector('[data-slot="app-shell"]')!;
    expect(root).toHaveAttribute('data-variant', 'page');
    expect(root).toHaveAttribute('data-mobile-nav', 'drawer');
    expect(screen.getByRole('navigation', { name: 'Student navigation' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveAttribute('data-slot', 'topnav');
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip).toHaveAttribute('href', '#main-content');
    expect(root.firstElementChild).toBe(skip);
    expect(skip.className).toContain('sr-only');
    expect(skip.className).toContain('focus:not-sr-only');
  });

  it('the skip link targets a custom main id', () => {
    render(<AppShell mainId="page" side={<p>rail</p>} skipLinkLabel="Skip to content">body</AppShell>);
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#page');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'page');
  });

  it('flat form builds the rail, the bar and the well', () => {
    render(
      <AppShell
        variant="embedded"
        navItems={[{ label: 'Pipeline', items: [{ label: 'Applications', href: '/a', current: true }] }]}
        navItemsLabel="Admissions navigation"
        header={<TopNav collapse="none" aria-label="Console bar" />}
      >
        Round 2 applications
      </AppShell>,
    );
    expect(screen.getByRole('navigation', { name: 'Admissions navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Applications' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('main')).toHaveTextContent('Round 2 applications');
    expect(document.querySelector('[data-slot="app-shell"]')).toHaveAttribute('data-variant', 'embedded');
  });

  it('the trigger opens the rail in a modal drawer, and it closes on Escape', async () => {
    render(<Lms />);
    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    expect(trigger).toHaveAttribute('data-slot', 'app-shell-nav-trigger');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.className).toContain('md:hidden');
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(trigger);
    const drawer = await screen.findByRole('dialog', { name: 'Navigation' });
    expect(drawer).toHaveAttribute('data-slot', 'app-shell-nav-drawer');
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // The rail's own links, drawn again inside.
    expect(drawer.querySelector('[aria-current="page"]')).toHaveTextContent('Modules');

    fireEvent.keyDown(drawer, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it('never widens the page: minmax(0,1fr) columns on the shell and the main column (N-02)', () => {
    render(<Lms />);
    expect(document.querySelector('[data-slot="app-shell"]')?.className).toContain('max-md:grid-cols-[minmax(0,1fr)]');
    expect(document.querySelector('[data-slot="app-shell-main"]')?.className).toContain('grid-cols-[minmax(0,1fr)]');
    expect(document.querySelector('[data-slot="app-shell"]')?.className).toContain('supports-[height:100dvh]:min-h-dvh');
  });

  it('the drawer is a SideDrawer panel from the leading edge (dvh with a vh fallback, safe areas)', async () => {
    render(<Lms defaultNavOpen />);
    const drawer = await screen.findByRole('dialog', { name: 'Navigation' });
    expect(drawer).toHaveAttribute('data-side', 'left');
    expect(drawer).toHaveAttribute('data-size', 'normal');
    expect(drawer.className).toContain('h-screen');
    expect(drawer.className).toContain('pl-[env(safe-area-inset-left,0px)]');
    expect(document.querySelector('[data-slot="side-drawer-overlay"]')).not.toBeNull();
  });

  it('a followed link and the close button close the drawer', async () => {
    const onNavOpenChange = vi.fn();
    render(<Lms defaultNavOpen onNavOpenChange={onNavOpenChange} />);
    const drawer = await screen.findByRole('dialog');
    const links = drawer.querySelectorAll('a[href]');
    fireEvent.click(links[0]!);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onNavOpenChange).toHaveBeenLastCalledWith(false);

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Close navigation' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('stack mode has no trigger and no drawer', () => {
    render(<Lms mobileNav="stack" defaultNavOpen />);
    expect(screen.queryByRole('button', { name: 'Open navigation' })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('[data-slot="app-shell"]')).toHaveAttribute('data-mobile-nav', 'stack');
  });

  it('the trigger renders nothing outside an AppShell', () => {
    const { container } = render(<AppShellNavTrigger />);
    expect(container).toBeEmptyDOMElement();
  });

  it('merges className last and forwards refs', () => {
    const rootRef = React.createRef<HTMLDivElement>();
    const sideRef = React.createRef<HTMLDivElement>();
    const mainRef = React.createRef<HTMLDivElement>();
    const contentRef = React.createRef<HTMLElement>();
    render(
      <AppShell ref={rootRef} className="bg-surface">
        <AppShellSide ref={sideRef} className="p-6">
          rail
        </AppShellSide>
        <AppShellMain ref={mainRef}>
          <AppShellContent ref={contentRef} className="p-8">
            page
          </AppShellContent>
        </AppShellMain>
      </AppShell>,
    );
    expect(rootRef.current).toHaveAttribute('data-slot', 'app-shell');
    expect(rootRef.current?.className).toContain('bg-surface');
    expect(rootRef.current?.className).not.toContain('bg-page');
    expect(sideRef.current).toHaveAttribute('data-slot', 'app-shell-side');
    expect(sideRef.current?.className).toContain('p-6');
    expect(sideRef.current?.className).not.toMatch(/(^|\s)p-4(\s|$)/);
    expect(mainRef.current).toHaveAttribute('data-slot', 'app-shell-main');
    expect(contentRef.current?.tagName).toBe('MAIN');
    expect(contentRef.current?.className).toContain('p-8');
  });
});
