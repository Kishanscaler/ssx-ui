import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import {
  Breadcrumbs,
  BreadcrumbsEllipsis,
  BreadcrumbsIconLabel,
  BreadcrumbsItem,
  BreadcrumbsLink,
  BreadcrumbsSeparator,
} from './Breadcrumbs';

function HouseIcon(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" data-testid="house-icon" {...props}>
      <path d="M0 0" />
    </svg>
  );
}

function CapIcon(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" data-testid="cap-icon" {...props}>
      <path d="M0 0" />
    </svg>
  );
}

const SIX = [
  { label: 'Home', href: '#home' },
  { label: 'Programmes', href: '#programmes' },
  { label: 'B.Sc CS & AI', href: '#bsc' },
  { label: 'Year 2', href: '#y2' },
  { label: 'Semester 4', href: '#s4' },
  { label: 'Data Structures & Algorithms — Week 6: Balanced Trees and Amortised Analysis' },
];

describe('Breadcrumbs', () => {
  it('is a nav named "Breadcrumb" around an ordered list; the last item is the current page, unlinked', () => {
    render(<Breadcrumbs items={SIX.slice(0, 3)} />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav).toHaveAttribute('data-slot', 'breadcrumbs');
    const list = within(nav).getByRole('list');
    expect(list.tagName).toBe('OL');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(within(items[0] as HTMLElement).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '#home');
    const current = items[2] as HTMLElement;
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveTextContent('B.Sc CS & AI');
    expect(within(current).queryByRole('link')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('separators are aria-hidden and the last item hides its own', () => {
    const { container } = render(<Breadcrumbs items={SIX.slice(0, 3)} />);
    const seps = container.querySelectorAll('[data-slot=breadcrumbs-separator]');
    expect(seps).toHaveLength(3);
    seps.forEach((s) => {
      expect(s).toHaveAttribute('aria-hidden', 'true');
      expect(s).toHaveTextContent('/');
    });
    // The hiding rule is on the li (a `last:` utility), so it holds for any composition.
    expect(container.querySelector('li:last-child')?.className).toContain('last:[&>[data-slot=breadcrumbs-separator]]:hidden');
    // A link's name is its own text; the slash beside it is not part of it.
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAccessibleName('Home');
  });

  it('collapses the middle into a named "…" menu of links', async () => {
    render(<Breadcrumbs items={SIX} maxItems={4} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);
    const trigger = screen.getByRole('button', {
      name: 'Show 3 hidden levels: Programmes, B.Sc CS & AI, Year 2',
    });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.closest('li')).toHaveAttribute('data-slot', 'breadcrumbs-ellipsis');
    expect(screen.getByRole('link', { name: 'Semester 4' })).toBeInTheDocument();
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    const menu = await screen.findByRole('menu');
    const rows = within(menu).getAllByRole('menuitem');
    expect(rows.map((r) => r.textContent)).toEqual(['Programmes', 'B.Sc CS & AI', 'Year 2']);
    expect(rows[0]).toHaveAttribute('href', '#programmes');
    await waitFor(() => expect(rows[0]).toHaveFocus());
    fireEvent.keyDown(rows[0] as HTMLElement, { key: 'ArrowDown' });
    await waitFor(() => expect(rows[1]).toHaveFocus());
    fireEvent.keyDown(rows[1] as HTMLElement, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it('does not collapse at or under maxItems, or without it', () => {
    const { rerender } = render(<Breadcrumbs items={SIX.slice(0, 5)} maxItems={5} />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<Breadcrumbs items={SIX} autoCollapse={false} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('itemsBeforeCollapse / itemsAfterCollapse choose what stays', () => {
    render(<Breadcrumbs items={SIX} maxItems={4} itemsBeforeCollapse={2} itemsAfterCollapse={1} />);
    expect(screen.getByRole('button', { name: 'Show 3 hidden levels: B.Sc CS & AI, Year 2, Semester 4' })).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual(['Home', 'Programmes']);
  });

  it('truncate caps a crumb and keeps the full text in the DOM and a title', () => {
    render(<Breadcrumbs items={SIX.slice(4)} truncate />);
    const current = screen.getAllByRole('listitem')[1] as HTMLElement;
    expect(current).toHaveAttribute('data-truncate', 'true');
    const crumb = current.querySelector('[data-slot=breadcrumbs-crumb]') as HTMLElement;
    expect(crumb).toHaveClass('truncate', 'max-w-[22ch]');
    expect(crumb).toHaveAttribute('title', SIX[5]?.label);
    expect(crumb).toHaveTextContent(SIX[5]?.label as string);
    // A linked crumb is capped too, and titled from the link's text.
    const linked = screen.getAllByRole('listitem')[0]?.querySelector('[data-slot=breadcrumbs-crumb]');
    expect(linked).toHaveAttribute('title', 'Semester 4');
  });

  it('linkAs renders the router link in the trail and in the menu', async () => {
    const RouterLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function RouterLink(props, ref) {
        return <a ref={ref} data-router="" {...props} />;
      },
    );
    render(<Breadcrumbs items={SIX} maxItems={3} linkAs={RouterLink} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('data-router');
    const trigger = screen.getByRole('button');
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    const menu = await screen.findByRole('menu');
    within(menu).getAllByRole('menuitem').forEach((row) => expect(row).toHaveAttribute('data-router'));
  });

  it('composes: BreadcrumbsLink asChild, a custom separator, a custom nav name', () => {
    render(
      <Breadcrumbs aria-label="Course path">
        <BreadcrumbsItem>
          <BreadcrumbsLink asChild>
            <a href="#admissions">Admissions ops</a>
          </BreadcrumbsLink>
        </BreadcrumbsItem>
        <BreadcrumbsItem current>Application SST-2029-0416</BreadcrumbsItem>
      </Breadcrumbs>,
    );
    const link = screen.getByRole('link', { name: 'Admissions ops' });
    expect(link).toHaveAttribute('data-slot', 'breadcrumbs-link');
    expect(link).toHaveAttribute('data-variant', 'quiet');
    expect(screen.getByRole('navigation', { name: 'Course path' })).toBeInTheDocument();
    render(<BreadcrumbsSeparator data-testid="sep">›</BreadcrumbsSeparator>);
    expect(screen.getByTestId('sep')).toHaveTextContent('›');
  });

  it('BreadcrumbsEllipsis names a single hidden level in the singular, or takes a label', () => {
    render(
      <Breadcrumbs>
        <BreadcrumbsEllipsis items={[{ label: 'Programmes', href: '#p' }]} />
        <BreadcrumbsEllipsis items={[{ label: 'Year 2', href: '#y' }]} label="More levels" />
      </Breadcrumbs>,
    );
    expect(screen.getByRole('button', { name: 'Show 1 hidden level: Programmes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More levels' })).toBeInTheDocument();
  });

  it('forwards refs, merges className, spreads props on every part', () => {
    const nav = React.createRef<HTMLElement>();
    const li = React.createRef<HTMLLIElement>();
    const a = React.createRef<HTMLAnchorElement>();
    render(
      <Breadcrumbs ref={nav} className="mb-6" data-testid="bc">
        <BreadcrumbsItem ref={li} className="text-xs" data-testid="item">
          <BreadcrumbsLink ref={a} href="#home" className="font-bold">
            Home
          </BreadcrumbsLink>
        </BreadcrumbsItem>
      </Breadcrumbs>,
    );
    expect(nav.current).toBe(screen.getByTestId('bc'));
    expect(nav.current).toHaveClass('mb-6');
    expect(li.current).toBe(screen.getByTestId('item'));
    expect(li.current).toHaveClass('text-xs');
    expect(li.current).toHaveAttribute('data-slot', 'breadcrumbs-item');
    expect(a.current).toBe(screen.getByRole('link'));
    expect(a.current).toHaveClass('font-bold');
  });
});

describe('Breadcrumbs · narrow containers (M-10)', () => {
  it('without maxItems, both states are in the markup and a container query picks one', () => {
    render(<Breadcrumbs items={SIX} />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('@container/breadcrumbs', 'w-full', 'min-w-0');
    // The "…" (menu of the hidden middle) shows only under 480px…
    const ellipsis = nav.querySelector('[data-slot=breadcrumbs-ellipsis]') as HTMLElement;
    expect(ellipsis).toHaveAttribute('data-auto-collapse');
    expect(ellipsis).toHaveClass('hidden', '@max-[30rem]/breadcrumbs:flex');
    expect(ellipsis).not.toHaveClass('flex');
    expect(
      screen.getByRole('button', { name: 'Show 3 hidden levels: Programmes, B.Sc CS & AI, Year 2' }),
    ).toBeInTheDocument();
    // …and the middle levels it stands for hide there, in the same order.
    const middle = [...nav.querySelectorAll('[data-slot=breadcrumbs-item]')].filter((li) =>
      li.className.includes('@max-[30rem]/breadcrumbs:hidden'),
    );
    expect(middle.map((li) => li.textContent?.replace('/', ''))).toEqual(['Programmes', 'B.Sc CS & AI', 'Year 2']);
  });

  it('a trail too short to collapse renders no "…" (and no stray classes on its items)', () => {
    render(<Breadcrumbs items={SIX.slice(0, 3)} />);
    expect(screen.queryByRole('button')).toBeNull();
    for (const li of screen.getAllByRole('listitem')) {
      expect(li.className).not.toMatch(/\blabel\b|\bhref\b|@max-\[30rem\]\/breadcrumbs:hidden/);
    }
  });

  it('one line, never wrapping; crumbs truncate, the current page first', () => {
    render(<Breadcrumbs items={SIX.slice(3)} />);
    const list = screen.getByRole('list');
    expect(list).toHaveClass('flex-nowrap');
    expect(list).not.toHaveClass('flex-wrap');
    const [level, , current] = screen.getAllByRole('listitem') as HTMLElement[];
    expect(level).toHaveClass('shrink', 'min-w-0');
    expect(current).toHaveClass('shrink-[10000]');
    // Plain text is boxed so it can end in "…".
    expect(current?.querySelector('[data-slot=breadcrumbs-crumb]')).toHaveClass('truncate');
  });

  it('the "…" has a 44px touch hit area', () => {
    render(<Breadcrumbs items={SIX} maxItems={4} />);
    expect(screen.getByRole('button')).toHaveClass('touch-target');
  });
});

describe('Breadcrumbs · icon variants', () => {
  const WITH_ICONS = [
    { label: 'Home', href: '#home', icon: <HouseIcon /> },
    { label: 'Programmes', href: '#programmes', icon: <CapIcon /> },
    { label: 'B.Sc CS & AI' },
  ];

  it('display="text" (default): the label, whatever icons are set', () => {
    render(<Breadcrumbs items={WITH_ICONS} />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.queryByTestId('house-icon')).toBeNull();
  });

  it('display="icons": the icon alone, label kept as the accessible name and title; the current page stays text', () => {
    render(<Breadcrumbs items={WITH_ICONS} display="icons" />);
    const home = screen.getByRole('link', { name: 'Home' });
    expect(within(home).getByTestId('house-icon')).toBeInTheDocument();
    expect(within(home).getByText('Home')).toHaveClass('sr-only');
    expect(home.querySelector('[data-slot="breadcrumbs-icon-label"]')).toHaveAttribute('title', 'Home');
    // The current page ignores `display` and always shows full text.
    const current = screen.getByText('B.Sc CS & AI');
    expect(current.closest('[data-slot="breadcrumbs-item"]')).toHaveAttribute('aria-current', 'page');
  });

  it('display="icons": falls back to text when an item has no icon', () => {
    render(<Breadcrumbs items={[{ label: 'Admissions', href: '#a' }, { label: 'Current' }]} display="icons" />);
    expect(screen.getByRole('link', { name: 'Admissions' })).toBeInTheDocument();
  });

  it('display="icons-text": icon beside the label', () => {
    render(<Breadcrumbs items={WITH_ICONS} display="icons-text" />);
    const programmes = screen.getByRole('link', { name: /Programmes/ });
    expect(within(programmes).getByTestId('cap-icon')).toBeInTheDocument();
    expect(programmes).toHaveTextContent('Programmes');
  });

  it('homeIcon swaps just the first level, independent of `display`', () => {
    render(<Breadcrumbs items={SIX} homeIcon={<HouseIcon />} />);
    const home = screen.getByRole('link', { name: 'Home' });
    expect(within(home).getByTestId('house-icon')).toBeInTheDocument();
    // Every other level stays plain text: no other icon-label wrapper in the trail.
    expect(screen.getByRole('link', { name: 'Programmes' }).textContent).toBe('Programmes');
    expect(document.querySelectorAll('[data-slot="breadcrumbs-icon-label"]')).toHaveLength(1);
  });

  it('homeIcon is ignored when the first level is also the current page', () => {
    render(<Breadcrumbs items={[{ label: 'Home' }]} homeIcon={<HouseIcon />} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByTestId('house-icon')).toBeNull();
  });

  it('BreadcrumbsIconLabel: aria-hidden icon, sr-only label, hover title', () => {
    render(<BreadcrumbsIconLabel label="Home">{<HouseIcon />}</BreadcrumbsIconLabel>);
    const wrapper = screen.getByText('Home').closest('[data-slot="breadcrumbs-icon-label"]') as HTMLElement;
    expect(wrapper).toHaveAttribute('title', 'Home');
    expect(screen.getByText('Home')).toHaveClass('sr-only');
    expect(screen.getByTestId('house-icon').closest('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
