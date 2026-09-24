import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Button } from '../Button';
import { MenuItem } from '../Menu';
import themeCss from '../../styles/theme.css?raw';
import { TopNav, TopNavActions, TopNavBrand, TopNavLink, TopNavLinks, TopNavMenu, topNavLinkVariants } from './TopNav';
import { navCollapseBreakpoints, navWideQuery } from './collapseBreakpoints';

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
        <Button asChild variant="tertiary" size="sm">
          <a href="/login">Student login</a>
        </Button>
        <Button asChild size="sm">
          <a href="/apply">Apply now</a>
        </Button>
      </TopNavActions>
    </TopNav>
  );
}

// `hidden: true`: while the modal drawer is open, Radix hides the page (the bar included) from AT.
const bar = () => screen.getByRole('banner', { hidden: true });
const toggle = () => screen.getByRole('button', { name: 'Menu', hidden: true });

describe('TopNav', () => {
  it('is a banner with a named navigation landmark and exactly one current link', () => {
    render(<Landing />);
    expect(bar()).toHaveAttribute('data-slot', 'topnav');
    expect(bar()).toHaveAttribute('data-size', 'md');
    expect(bar()).toHaveAttribute('data-collapse', 'drawer');
    expect(bar()).toHaveAttribute('data-collapse-below', 'md');
    expect(bar()).toHaveAttribute('data-fold', 'md');
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
    expect(logo?.className).toContain('h-[1.75rem]');
  });

  it('collapse="menu" puts the menu button right after the brand (tab order: brand, menu, panel)', () => {
    render(<Landing collapse="menu" />);
    const children = [...bar().children].map((el) => el.getAttribute('data-slot'));
    expect(children).toEqual(['topnav-brand', 'topnav-toggle', 'topnav-links', 'topnav-actions', 'topnav-primary-action']);
  });

  it('the menu button discloses the links and actions', async () => {
    render(<Landing collapse="menu" />);
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
    render(<Landing collapse="menu" />);
    fireEvent.click(toggle());
    const link = screen.getByRole('link', { name: 'Curriculum' });
    link.focus();
    fireEvent.keyDown(link, { key: 'Escape' });
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(bar()).not.toHaveAttribute('data-open');
    expect(document.activeElement).toBe(toggle());
  });

  it('following a link in the panel closes it', () => {
    render(<Landing collapse="menu" />);
    fireEvent.click(toggle());
    const link = screen.getByRole('link', { name: 'Curriculum' });
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('defaultMenuOpen starts open', () => {
    render(<Landing collapse="menu" defaultMenuOpen />);
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
    expect(bar().className).toContain('h-[calc(var(--spacing)*12+env(safe-area-inset-top,0px))]');
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
      // Drawer (the default): the menu button leads, at the edge the drawer opens from.
      expect(order).toEqual(['topnav-toggle', 'topnav-brand', 'topnav-links', 'topnav-actions']);
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
  describe('collapse="drawer" (the default)', () => {
    const drawer = () => screen.getByRole('dialog', { name: 'Menu' });

    it('puts the menu button first, hidden from the breakpoint up, and opens a modal side drawer', () => {
      render(<Landing />);
      const order = [...bar().children].map((el) => el.getAttribute('data-slot'));
      expect(order).toEqual(['topnav-toggle', 'topnav-brand', 'topnav-links', 'topnav-actions', 'topnav-primary-action']);
      expect(toggle().className).toContain('md:hidden');
      expect(toggle()).toHaveAttribute('aria-haspopup', 'dialog');
      expect(toggle()).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(toggle());
      expect(toggle()).toHaveAttribute('aria-expanded', 'true');
      const panel = drawer();
      expect(panel).toHaveAttribute('aria-modal', 'true');
      expect(panel).toHaveAttribute('data-topnav-drawer');
      expect(panel).toHaveAttribute('data-side', 'left');
      expect(panel).toHaveAttribute('data-size', 'normal');
      // The bar's own parts stay where they are (hidden by CSS below md).
      expect(bar().querySelector('[data-slot="topnav-links"]')).not.toBeNull();
    });

    it('holds the links (current marked), the brand, and the actions as full-width buttons in the footer', () => {
      render(<Landing defaultMenuOpen />);
      const panel = drawer();
      const nav = panel.querySelector('nav[aria-label="Primary"]') as HTMLElement;
      expect(nav).not.toBeNull();
      const current = panel.querySelector('[aria-current="page"]');
      expect(current).toHaveTextContent('Programmes');
      expect(panel.querySelector('[data-slot="topnav-drawer-brand"] [data-slot="topnav-brand"]')).not.toBeNull();
      const footer = panel.querySelector('[data-slot="topnav-drawer-actions"]') as HTMLElement;
      expect(footer.querySelector('a[href="/apply"]')).toHaveAttribute('data-slot', 'button');
      expect(footer.querySelector('[data-slot="topnav-actions"]')?.className).toContain(
        'in-data-[topnav-drawer]:[&>*]:w-full',
      );
    });

    it('draws a TopNavMenu as an expandable section, its items as plain links', () => {
      render(<Landing defaultMenuOpen />);
      const panel = drawer();
      const section = panel.querySelector('[data-slot="topnav-menu-trigger"]') as HTMLElement;
      expect(section).toHaveTextContent('Outcomes');
      expect(section).not.toHaveAttribute('aria-haspopup');
      expect(section).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(section);
      expect(section).toHaveAttribute('aria-expanded', 'true');
      const item = panel.querySelector('a[href="/placements"]') as HTMLElement;
      expect(item).toHaveAttribute('data-slot', 'topnav-menu-item');
      expect(item).not.toHaveAttribute('role');
    });

    it('a group holding the current page starts expanded, the item marked current', () => {
      render(
        <TopNav
          brandLabel="Scaler"
          links={[
            { label: 'Outcomes', current: true, items: [{ label: 'Placements', href: '/placements', current: true }] },
          ]}
          defaultMenuOpen
        />,
      );
      const panel = drawer();
      expect(panel.querySelector('[data-slot="topnav-menu-trigger"]')).toHaveAttribute('aria-expanded', 'true');
      expect(panel.querySelector('a[href="/placements"]')).toHaveAttribute('aria-current', 'page');
    });

    it('closes on a followed link, a chosen item, Escape (focus back on the button) and navigation', async () => {
      const onSelect = vi.fn();
      render(
        <TopNav>
          <TopNavLinks>
            <TopNavLink href="/a">A</TopNavLink>
            <TopNavMenu label="More">
              <MenuItem onSelect={onSelect}>Refer a friend</MenuItem>
            </TopNavMenu>
          </TopNavLinks>
        </TopNav>,
      );
      fireEvent.click(toggle());
      const link = drawer().querySelector('a[href="/a"]') as HTMLElement;
      link.addEventListener('click', (e) => e.preventDefault());
      fireEvent.click(link);
      expect(screen.queryByRole('dialog')).toBeNull();

      fireEvent.click(toggle());
      fireEvent.click(drawer().querySelector('[data-slot="topnav-menu-trigger"]') as HTMLElement);
      fireEvent.click(screen.getByRole('button', { name: 'Refer a friend' }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).toBeNull();

      fireEvent.click(toggle());
      fireEvent.keyDown(drawer(), { key: 'Escape' });
      expect(screen.queryByRole('dialog')).toBeNull();
      await waitFor(() => expect(document.activeElement).toBe(toggle()));

      fireEvent.click(toggle());
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('closes when the window widens past collapseBelow, using the shared breakpoint', () => {
      const listeners: Array<() => void> = [];
      const state = { matches: false };
      const queries: string[] = [];
      const original = window.matchMedia;
      window.matchMedia = ((query: string) => {
        queries.push(query);
        return {
          get matches() {
            return state.matches;
          },
          media: query,
          addEventListener: (_: string, fn: () => void) => listeners.push(fn),
          removeEventListener: () => {},
        };
      }) as unknown as typeof window.matchMedia;
      try {
        render(<Landing collapseBelow="lg" />);
        expect(bar()).toHaveAttribute('data-fold', 'lg');
        expect(toggle().className).toContain('lg:hidden');
        fireEvent.click(toggle());
        expect(queries).toContain('(min-width: 1312px)');
        expect(drawer()).toBeInTheDocument();
        state.matches = true;
        act(() => listeners.forEach((fn) => fn()));
        expect(screen.queryByRole('dialog')).toBeNull();
      } finally {
        window.matchMedia = original;
      }
    });

    it('keeps a collapsible={false} cluster in the bar and out of the drawer', () => {
      render(
        <TopNav brandLabel="Scaler" links={[{ label: 'A', href: '/a' }]} defaultMenuOpen>
          <TopNavActions collapsible={false}>
            <button type="button">Notifications</button>
          </TopNavActions>
        </TopNav>,
      );
      expect(drawer().querySelector('[data-slot="topnav-actions"]')).toBeNull();
      expect(bar()).toHaveTextContent('Notifications');
    });

    it('actionsOnMobile="bar" keeps the flat actions out of the drawer', () => {
      render(
        <TopNav
          brandLabel="Scaler"
          links={[{ label: 'A', href: '/a' }]}
          actions={[{ label: 'Apply now', href: '/apply' }]}
          actionsOnMobile="bar"
          defaultMenuOpen
        />,
      );
      expect(drawer().querySelector('a[href="/apply"]')).toBeNull();
    });

    it('renders no menu button when nothing folds away', () => {
      render(
        <TopNav brandLabel="Scaler">
          <TopNavActions collapsible={false}>
            <button type="button">Notifications</button>
          </TopNavActions>
        </TopNav>,
      );
      expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull();
    });
  });

  describe('collapse="menu" panel', () => {
    it('a TopNavMenu in the open panel expands inline, and choosing an item closes the panel (N-07)', async () => {
      render(<Landing collapse="menu" />);
      fireEvent.click(toggle());
      const section = await waitFor(() => {
        const node = bar().querySelector('[data-slot="topnav-menu-section"] [data-slot="topnav-menu-trigger"]');
        expect(node).not.toBeNull();
        return node as HTMLElement;
      });
      expect(section).not.toHaveAttribute('aria-haspopup');
      // The dropdown trigger steps aside while the panel is open.
      expect(bar().querySelector('[aria-haspopup="menu"]')).toHaveAttribute('hidden');
      fireEvent.click(section);
      const item = bar().querySelector('a[href="/placements"]') as HTMLElement;
      item.addEventListener('click', (e) => e.preventDefault());
      fireEvent.click(item);
      expect(toggle()).toHaveAttribute('aria-expanded', 'false');
      await waitFor(() => expect(bar().querySelector('[data-slot="topnav-menu-section"]')).toBeNull());
    });

    it('the open bar scrolls on its own (a sticky panel taller than the screen, N-06)', () => {
      render(<Landing collapse="menu" collapseBelow="sm" />);
      expect(bar().className).toContain('data-[open]:overflow-y-auto');
      expect(bar().className).toContain('supports-[height:100dvh]:data-[open]:max-h-dvh');
      expect(toggle().className).toContain('sm:hidden');
    });
  });

  describe('the primary action stays in the bar on small screens', () => {
    const slot = () => bar().querySelector('[data-slot="topnav-primary-action"]') as HTMLElement | null;
    const cluster = () => bar().querySelector('[data-slot="topnav-actions"]') as HTMLElement;

    it('compound: the first primary Button gets a bar slot shown only below the breakpoint', () => {
      render(<Landing />);
      expect(cluster()).toHaveAttribute('data-topnav-mobile', 'primary');
      const kept = slot();
      expect(kept).not.toBeNull();
      expect(kept?.querySelectorAll('a')).toHaveLength(1);
      expect(kept?.querySelector('a')).toHaveAttribute('href', '/apply');
      expect(kept?.className).toMatch(/(^| )hidden( |$)/);
      expect(kept?.className).toContain('max-md:group-data-[fold=md]/topnav:flex');
      // In the cluster the same action is marked, and hidden below the breakpoint (its slot shows instead).
      expect(cluster().querySelector('a[href="/apply"]')).toHaveAttribute('data-topnav-primary');
      expect(cluster().querySelector('a[href="/login"]')).not.toHaveAttribute('data-topnav-primary');
      expect(cluster().className).toContain('max-md:group-data-[fold=md]/topnav:[&>[data-topnav-primary]]:hidden');
    });

    it('the secondary action folds into the drawer, and the modal drawer repeats the primary one', () => {
      render(<Landing defaultMenuOpen />);
      const panel = screen.getByRole('dialog', { name: 'Menu' });
      const footer = panel.querySelector('[data-slot="topnav-drawer-actions"]') as HTMLElement;
      expect(footer.querySelector('a[href="/login"]')).not.toBeNull();
      expect(footer.querySelector('a[href="/apply"]')).not.toBeNull();
      // The drawer has no bar around it: its own primary slot never shows.
      expect(footer.querySelector('[data-slot="topnav-primary-action"]')?.className).toMatch(/(^| )hidden( |$)/);
    });

    it('collapse="menu": the slot follows the cluster, outside the panel', async () => {
      render(<Landing collapse="menu" />);
      const nav = screen.getByRole('navigation', { name: 'Primary' });
      await waitFor(() => expect(toggle().getAttribute('aria-controls')).toBe(`${nav.id} ${cluster().id}`));
      expect(slot()?.previousElementSibling).toBe(cluster());
      expect(slot()).not.toHaveAttribute('data-topnav-collapse');
    });

    it('data-topnav-primary picks the kept action explicitly (any element)', () => {
      render(
        <TopNav brandLabel="Scaler" links={[{ label: 'A', href: '/a' }]}>
          <TopNavActions>
            <Button asChild size="sm">
              <a href="/brochure">Brochure</a>
            </Button>
            <a href="/apply" data-topnav-primary="">
              Apply
            </a>
          </TopNavActions>
        </TopNav>,
      );
      expect(slot()?.querySelector('a')).toHaveAttribute('href', '/apply');
    });

    it('a cluster with only the primary action: no panel part, and no drawer when nothing else folds', () => {
      render(
        <TopNav brandLabel="Scaler">
          <TopNavActions>
            <Button asChild size="sm">
              <a href="/apply">Apply now</a>
            </Button>
          </TopNavActions>
        </TopNav>,
      );
      expect(cluster()).not.toHaveAttribute('data-topnav-collapse');
      expect(slot()).not.toBeNull();
      expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull();
    });

    it('mobile="menu" folds everything (the old default); a cluster with no primary Button does the same', () => {
      render(
        <TopNav brandLabel="Scaler" links={[{ label: 'A', href: '/a' }]}>
          <TopNavActions mobile="menu">
            <Button asChild size="sm">
              <a href="/apply">Apply now</a>
            </Button>
          </TopNavActions>
          <TopNavActions>
            <Button asChild variant="secondary" size="sm">
              <a href="/login">Log in</a>
            </Button>
          </TopNavActions>
        </TopNav>,
      );
      expect(slot()).toBeNull();
      expect(bar().querySelector('[data-topnav-primary]')).toBeNull();
    });

    it('mobile="bar" keeps the whole cluster in the bar', () => {
      render(
        <TopNav brandLabel="Scaler" links={[{ label: 'A', href: '/a' }]}>
          <TopNavActions mobile="bar">
            <Button size="sm">Apply</Button>
          </TopNavActions>
        </TopNav>,
      );
      expect(cluster()).toHaveAttribute('data-topnav-mobile', 'bar');
      expect(cluster()).not.toHaveAttribute('data-topnav-collapse');
      expect(slot()).toBeNull();
    });

    it('flat: the first primary action stays in the bar by default; the rest fold into the drawer', () => {
      render(
        <TopNav
          brandLabel="Scaler"
          links={[{ label: 'A', href: '/a' }]}
          actions={[
            { label: 'Student login', href: '/login', variant: 'tertiary' },
            { label: 'Apply now', href: '/apply' },
            { label: 'Brochure', href: '/brochure' },
          ]}
          defaultMenuOpen
        />,
      );
      const kept = slot();
      expect(kept?.querySelectorAll('a')).toHaveLength(1);
      expect(kept?.querySelector('a')).toHaveAttribute('href', '/apply');
      expect(kept?.querySelector('a')).toHaveAttribute('data-size', 'sm');
      const footer = screen.getByRole('dialog', { name: 'Menu' }).querySelector('[data-slot="topnav-drawer-actions"]');
      expect(footer?.querySelector('a[href="/login"]')).not.toBeNull();
      expect(footer?.querySelector('a[href="/brochure"]')).not.toBeNull();
    });

    it('flat: actionsOnMobile="menu" folds every action', () => {
      render(
        <TopNav
          brandLabel="Scaler"
          links={[{ label: 'A', href: '/a' }]}
          actions={[{ label: 'Apply now', href: '/apply' }]}
          actionsOnMobile="menu"
        />,
      );
      expect(slot()).toBeNull();
      expect(cluster()).toHaveAttribute('data-topnav-mobile', 'menu');
    });

    it('a ref or id on the kept action stays on the cluster copy only', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <TopNav brandLabel="Scaler" links={[{ label: 'A', href: '/a' }]}>
          <TopNavActions>
            <Button ref={ref} id="apply" size="sm">
              Apply
            </Button>
          </TopNavActions>
        </TopNav>,
      );
      expect(ref.current?.closest('[data-slot="topnav-actions"]')).not.toBeNull();
      expect(document.querySelectorAll('#apply')).toHaveLength(1);
    });
  });

  it('the link row scrolls instead of overlapping when it does not fit (N-01 safety net)', () => {
    render(<Landing />);
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav.className).toContain('overflow-x-auto');
    expect(nav.className).toContain('min-w-0');
  });

  it('link hover is guarded by `hover:` (so a tap does not leave it stuck)', () => {
    expect(topNavLinkVariants()).toContain('hover:not-aria-[current=page]:bg-surface-hover');
    expect(topNavLinkVariants()).not.toContain('[&:not([aria-current=page]):hover]');
  });

  it('the collapse breakpoints match theme.css', () => {
    for (const [name, px] of Object.entries(navCollapseBreakpoints)) {
      expect(themeCss).toContain(`--breakpoint-${name}: ${px}px;`);
    }
    expect(navWideQuery('md')).toBe('(min-width: 1056px)');
  });
});
