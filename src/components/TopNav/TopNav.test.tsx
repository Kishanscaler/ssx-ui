import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Button } from '../Button';
import { MenuItem } from '../Menu';
import { TopNav, TopNavActions, TopNavBrand, TopNavLink, TopNavLinks, TopNavMenu } from './TopNav';

/* jsdom has no pointer capture. */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
}

function Landing(props: Partial<React.ComponentProps<typeof TopNav>>) {
  return (
    <TopNav {...props}>
      <TopNavBrand href="/" aria-label="Scaler home" />
      <TopNavLinks>
        <TopNavLink href="/programmes" current>
          Programmes
        </TopNavLink>
        <TopNavLink href="/curriculum">Curriculum</TopNavLink>
        <TopNavMenu label="Outcomes">
          <MenuItem asChild>
            <a href="/placements">Placements</a>
          </MenuItem>
        </TopNavMenu>
      </TopNavLinks>
      <TopNavActions>
        <Button asChild size="sm">
          <a href="/apply">Apply now</a>
        </Button>
      </TopNavActions>
    </TopNav>
  );
}

const bar = () => screen.getByRole('banner');
const toggle = () => screen.getByRole('button', { name: 'Menu' });

describe('TopNav', () => {
  it('is a banner with a named navigation landmark and exactly one current link', () => {
    render(<Landing />);
    expect(bar()).toHaveAttribute('data-slot', 'topnav');
    expect(bar()).toHaveAttribute('data-size', 'md');
    expect(bar()).toHaveAttribute('data-collapse', 'menu');
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav).toHaveAttribute('data-slot', 'topnav-links');
    expect(screen.getByRole('link', { name: 'Programmes' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Curriculum' })).not.toHaveAttribute('aria-current');
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Scaler home' })).toHaveAttribute('data-slot', 'topnav-brand');
    // No children: the Scaler Logo, brand and theme from context.
    const logo = screen.getByRole('link', { name: 'Scaler home' }).querySelector('[data-slot="logo"]');
    expect(logo).toHaveAttribute('data-logo-brand', 'auto');
    expect(logo).toHaveAttribute('data-variant', 'full');
    expect(logo?.className).toContain('h-[28px]');
  });

  it('puts the menu button right after the brand (tab order: brand, menu, panel)', () => {
    render(<Landing />);
    const children = [...bar().children].map((el) => el.getAttribute('data-slot'));
    expect(children).toEqual(['topnav-brand', 'topnav-toggle', 'topnav-links', 'topnav-actions']);
  });

  it('the menu button discloses the links and actions', async () => {
    render(<Landing />);
    const button = toggle();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const actions = document.querySelector('[data-slot="topnav-actions"]') as HTMLElement;
    await waitFor(() => expect(button.getAttribute('aria-controls')).toBe(`${nav.id} ${actions.id}`));
    expect(nav.id).not.toBe('');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(bar()).toHaveAttribute('data-open');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(bar()).not.toHaveAttribute('data-open');
  });

  it('Escape closes the panel and returns focus to the menu button', () => {
    render(<Landing />);
    fireEvent.click(toggle());
    const link = screen.getByRole('link', { name: 'Curriculum' });
    link.focus();
    fireEvent.keyDown(link, { key: 'Escape' });
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(bar()).not.toHaveAttribute('data-open');
    expect(document.activeElement).toBe(toggle());
  });

  it('following a link in the panel closes it', () => {
    render(<Landing />);
    fireEvent.click(toggle());
    const link = screen.getByRole('link', { name: 'Curriculum' });
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('defaultMenuOpen starts open', () => {
    render(<Landing defaultMenuOpen />);
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(bar()).toHaveAttribute('data-open');
  });

  it('collapse="scroll" and "none" render no menu button', () => {
    const { rerender } = render(<Landing collapse="scroll" />);
    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull();
    expect(bar()).toHaveAttribute('data-collapse', 'scroll');
    rerender(<Landing collapse="none" />);
    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull();
  });

  it('TopNavActions collapsible={false} stays out of the panel', () => {
    render(
      <TopNav>
        <TopNavActions collapsible={false}>
          <button type="button">Notifications</button>
        </TopNavActions>
      </TopNav>,
    );
    expect(document.querySelector('[data-slot="topnav-actions"]')).not.toHaveAttribute('data-topnav-collapse');
  });

  it('TopNavLink asChild renders the router link, keeping the look and current state', () => {
    const RouterLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function RouterLink(props, ref) {
        return <a ref={ref} data-router="" {...props} />;
      },
    );
    render(
      <TopNavLink asChild current>
        <RouterLink href="/modules">Modules</RouterLink>
      </TopNavLink>,
    );
    const link = screen.getByRole('link', { name: 'Modules' });
    expect(link).toHaveAttribute('data-router');
    expect(link).toHaveAttribute('data-slot', 'topnav-link');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link.className).toContain('rounded-md');
  });

  it('TopNavMenu opens a menu of links from the keyboard', () => {
    render(<Landing />);
    const trigger = screen.getByRole('button', { name: 'Outcomes' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('data-slot', 'topnav-menu-trigger');
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    const item = screen.getByRole('menuitem', { name: 'Placements' });
    expect(item.tagName).toBe('A');
    expect(item).toHaveAttribute('href', '/placements');
  });

  it('forwards refs and merges className', () => {
    const root = React.createRef<HTMLElement>();
    const link = React.createRef<HTMLAnchorElement>();
    render(
      <TopNav ref={root} className="sticky top-0 px-8" collapse="none">
        <TopNavLinks>
          <TopNavLink ref={link} href="/a" className="px-4">
            A
          </TopNavLink>
        </TopNavLinks>
      </TopNav>,
    );
    expect(root.current).toBe(bar());
    expect(root.current?.className).toContain('px-8');
    expect(root.current?.className).not.toMatch(/\bpx-5\b/);
    expect(link.current?.className).toContain('px-4');
    expect(link.current?.className).not.toMatch(/\bpx-3\b/);
  });

  it('size="sm" is the 48px bar with a small menu button', () => {
    render(<Landing size="sm" />);
    expect(bar()).toHaveAttribute('data-size', 'sm');
    expect(bar().className).toContain('h-12');
    expect(toggle()).toHaveAttribute('data-size', 'icon-sm');
  });

  describe('flat form', () => {
    it('builds brand, links (with a dropdown group) and actions from data', () => {
      render(
        <TopNav
          brandLabel="Scaler"
          brandHref="/"
          links={[
            { label: 'Programmes', href: '/programmes', current: true },
            { label: 'Outcomes', items: [{ label: 'Placements', href: '/placements' }] },
          ]}
          linksLabel="Main"
          actions={[
            { label: 'Student login', href: '/login', variant: 'tertiary' },
            { label: 'Apply now', href: '/apply' },
          ]}
          actionsOnMobile="bar"
        />,
      );
      expect(screen.getByRole('link', { name: 'Scaler' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Programmes' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('button', { name: 'Outcomes' })).toHaveAttribute('aria-haspopup', 'menu');
      const apply = screen.getByRole('link', { name: 'Apply now' });
      expect(apply).toHaveAttribute('data-slot', 'button');
      expect(apply).toHaveAttribute('data-variant', 'primary');
      expect(screen.getByRole('link', { name: 'Student login' })).toHaveAttribute('data-variant', 'tertiary');
      expect(document.querySelector('[data-slot="topnav-actions"]')).not.toHaveAttribute('data-topnav-collapse');
      const order = [...bar().children].map((el) => el.getAttribute('data-slot'));
      expect(order).toEqual(['topnav-brand', 'topnav-toggle', 'topnav-links', 'topnav-actions']);
    });

    it('brandLabel alone draws the Scaler Logo, named by the label', () => {
      render(<TopNav brandLabel="Scaler" brandHref="/" />);
      const img = screen.getByRole('img', { name: 'Scaler' });
      expect(img).toHaveAttribute('data-slot', 'logo');
      expect(screen.getByRole('link', { name: 'Scaler' })).toContainElement(img);
    });

    it('logoSrc draws the image, named by brandLabel', () => {
      render(<TopNav logoSrc="/sst.svg" brandLabel="Scaler School of Technology" brandHref="/" />);
      expect(screen.getByRole('img', { name: 'Scaler School of Technology' })).toHaveAttribute('src', '/sst.svg');
      expect(document.querySelector('[data-slot="logo"]')).toBeNull();
    });
  });
});
