import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Button } from '../Button';
import { IconButton } from '../IconButton';
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from './Menu';

/* jsdom has no pointer capture. */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
}

const glyph = <svg data-testid="glyph" />;

function CohortMenu({
  onSelect,
  contentProps,
  ...root
}: React.ComponentProps<typeof Menu> & {
  onSelect?: (e: Event) => void;
  contentProps?: Partial<React.ComponentProps<typeof MenuContent>>;
}) {
  return (
    <Menu {...root}>
      <MenuTrigger asChild>
        <Button variant="secondary">Cohort actions</Button>
      </MenuTrigger>
      <MenuContent {...contentProps}>
        <MenuItem icon={glyph} shortcut="⌘E" onSelect={onSelect}>
          Export CSV
        </MenuItem>
        <MenuItem description="Copies the module plan, not the students">Duplicate cohort</MenuItem>
        <MenuItem disabled>Archive</MenuItem>
        <MenuSeparator />
        <MenuItem variant="danger" icon={glyph}>
          Delete cohort
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Cohort actions', hidden: true });
const openWith = (key: string) => {
  const t = trigger();
  t.focus();
  fireEvent.keyDown(t, { key });
};

describe('Menu', () => {
  it('the trigger announces a menu and keeps its Button slot', () => {
    render(<CohortMenu />);
    const t = trigger();
    expect(t).toHaveAttribute('aria-haspopup', 'menu');
    expect(t).toHaveAttribute('aria-expanded', 'false');
    expect(t).toHaveAttribute('data-slot', 'button');
    expect(t).toHaveAttribute('data-state', 'closed');
  });

  it('opens from the keyboard into a menu labelled by its trigger, first item focused', async () => {
    render(<CohortMenu />);
    openWith('Enter');
    const menu = screen.getByRole('menu');
    expect(menu).toHaveAttribute('data-slot', 'menu-content');
    expect(menu).toHaveAttribute('data-elevation', 'raised');
    expect(menu).toHaveAttribute('aria-labelledby', trigger().id);
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(4);
    await waitFor(() => expect(document.activeElement).toBe(items[0]));
    expect(screen.getByRole('separator')).toHaveAttribute('data-slot', 'menu-separator');
  });

  it('arrows move focus and skip the disabled row; Escape closes and returns focus', async () => {
    render(<CohortMenu />);
    openWith('ArrowDown');
    const [exp, dup, archive, del] = screen.getAllByRole('menuitem') as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    await waitFor(() => expect(document.activeElement).toBe(exp));
    fireEvent.keyDown(exp, { key: 'ArrowDown' });
    await waitFor(() => expect(document.activeElement).toBe(dup));
    fireEvent.keyDown(dup, { key: 'ArrowDown' });
    await waitFor(() => expect(document.activeElement).toBe(del));
    fireEvent.keyDown(del, { key: 'End' });
    fireEvent.keyDown(del, { key: 'Home' });
    await waitFor(() => expect(document.activeElement).toBe(exp));
    expect(archive).toHaveAttribute('aria-disabled', 'true');
    expect(archive).toHaveAttribute('data-disabled');
    fireEvent.keyDown(del, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });

  it('type-ahead matches the headline, not the subline', async () => {
    render(<CohortMenu />);
    openWith('Enter');
    const first = screen.getAllByRole('menuitem')[0]!;
    await waitFor(() => expect(document.activeElement).toBe(first));
    fireEvent.keyDown(first, { key: 'd' });
    await waitFor(() =>
      expect(document.activeElement?.querySelector('[data-slot=menu-item-label]')).toHaveTextContent(
        'Duplicate cohort',
      ),
    );
  });

  it('Enter fires onSelect and closes the menu', async () => {
    const onSelect = vi.fn();
    render(<CohortMenu onSelect={onSelect} />);
    openWith('Enter');
    const first = screen.getAllByRole('menuitem')[0]!;
    await waitFor(() => expect(document.activeElement).toBe(first));
    fireEvent.keyDown(first, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('rows carry their slots: icon, label, description, shortcut (a Kbd), variant', () => {
    render(<CohortMenu defaultOpen />);
    const [exp, dup, , del] = screen.getAllByRole('menuitem') as [HTMLElement, HTMLElement, HTMLElement, HTMLElement];
    expect(exp).toHaveAttribute('data-slot', 'menu-item');
    expect(exp).toHaveAttribute('data-variant', 'default');
    expect(exp.querySelector('[data-slot=menu-item-icon] [data-testid=glyph]')).not.toBeNull();
    expect(exp.querySelector('[data-slot=menu-item-shortcut] kbd[data-slot=kbd]')).toHaveTextContent('⌘E');
    expect(dup).toHaveAttribute('data-two-line');
    expect(dup.querySelector('[data-slot=menu-item-label]')).toHaveTextContent('Duplicate cohort');
    expect(dup.querySelector('[data-slot=menu-item-description]')).toHaveTextContent(
      'Copies the module plan, not the students',
    );
    // One row, one name: the subline is part of the item's accessible name.
    expect(screen.getByRole('menuitem', { name: /Duplicate cohort.*Copies the module plan/ })).toBe(dup);
    expect(del).toHaveAttribute('data-variant', 'danger');
  });

  it('radio items: menuitemradio with aria-checked, a reserved check column, onValueChange', () => {
    const onValueChange = vi.fn();
    render(
      <Menu defaultOpen>
        <MenuTrigger asChild>
          <Button>Reporting scope</Button>
        </MenuTrigger>
        <MenuContent>
          <MenuRadioGroup defaultValue="c7" onValueChange={onValueChange}>
            <MenuRadioItem value="c7" icon={glyph} description="48 students">
              Cohort 7 · Bengaluru
            </MenuRadioItem>
            <MenuRadioItem value="c8">Cohort 8 · Pune</MenuRadioItem>
            <MenuRadioItem value="c9" disabled>
              Cohort 9 · Pune
            </MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </Menu>,
    );
    const [c7, c8, c9] = screen.getAllByRole('menuitemradio') as [HTMLElement, HTMLElement, HTMLElement];
    expect(c7).toHaveAttribute('aria-checked', 'true');
    expect(c8).toHaveAttribute('aria-checked', 'false');
    expect(c7).toHaveAttribute('data-slot', 'menu-radio-item');
    // Every row reserves the check column, so the selection never reflows.
    for (const row of [c7, c8, c9]) expect(row.querySelector('[data-slot=menu-item-check]')).not.toBeNull();
    fireEvent.click(c8);
    expect(onValueChange).toHaveBeenCalledWith('c8');
  });

  it('radio group and checkbox item also work uncontrolled (defaultValue / defaultChecked)', () => {
    render(
      <Menu defaultOpen>
        <MenuTrigger asChild>
          <Button>View</Button>
        </MenuTrigger>
        <MenuContent>
          <MenuCheckboxItem defaultChecked onSelect={(e) => e.preventDefault()}>
            Show archived
          </MenuCheckboxItem>
          <MenuRadioGroup defaultValue="a">
            <MenuRadioItem value="a" onSelect={(e) => e.preventDefault()}>
              A
            </MenuRadioItem>
            <MenuRadioItem value="b" onSelect={(e) => e.preventDefault()}>
              B
            </MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </Menu>,
    );
    const box = screen.getByRole('menuitemcheckbox');
    expect(box).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(box);
    expect(box).toHaveAttribute('aria-checked', 'false');
    const [a, b] = screen.getAllByRole('menuitemradio') as [HTMLElement, HTMLElement];
    expect(a).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(b);
    expect(b).toHaveAttribute('aria-checked', 'true');
    expect(a).toHaveAttribute('aria-checked', 'false');
  });

  it('checkbox items toggle', () => {
    const onCheckedChange = vi.fn();
    render(
      <Menu defaultOpen>
        <MenuTrigger asChild>
          <Button>View</Button>
        </MenuTrigger>
        <MenuContent>
          <MenuCheckboxItem checked={false} onCheckedChange={onCheckedChange}>
            Show archived cohorts
          </MenuCheckboxItem>
        </MenuContent>
      </Menu>,
    );
    const item = screen.getByRole('menuitemcheckbox', { name: 'Show archived cohorts' });
    expect(item).toHaveAttribute('aria-checked', 'false');
    expect(item).toHaveAttribute('data-slot', 'menu-checkbox-item');
    fireEvent.click(item);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('groups are named by their label', () => {
    render(
      <Menu defaultOpen>
        <MenuTrigger asChild>
          <Button>More</Button>
        </MenuTrigger>
        <MenuContent>
          <MenuGroup aria-labelledby="share">
            <MenuLabel id="share">Share</MenuLabel>
            <MenuItem>Download as PDF</MenuItem>
          </MenuGroup>
        </MenuContent>
      </Menu>,
    );
    const group = screen.getByRole('group', { name: 'Share' });
    expect(group).toHaveAttribute('data-slot', 'menu-group');
    expect(screen.getByText('Share')).toHaveAttribute('data-slot', 'menu-label');
  });

  it('asChild renders a link row with the same layout', () => {
    render(
      <Menu defaultOpen>
        <MenuTrigger asChild>
          <Button>Account</Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem asChild icon={glyph}>
            <a href="/profile">Profile</a>
          </MenuItem>
        </MenuContent>
      </Menu>,
    );
    const link = screen.getByRole('menuitem', { name: 'Profile' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/profile');
    expect(link).toHaveAttribute('data-slot', 'menu-item');
    expect(link.querySelector('[data-slot=menu-item-label]')).toHaveTextContent('Profile');
  });

  it('opens from an icon-only More trigger named for its row', () => {
    render(
      <Menu>
        <MenuTrigger asChild>
          <IconButton variant="tertiary" size="sm" aria-label="More actions for Aarav Krishnan">
            <svg />
          </IconButton>
        </MenuTrigger>
        <MenuContent>
          <MenuItem>Open application</MenuItem>
        </MenuContent>
      </Menu>,
    );
    const more = screen.getByRole('button', { name: 'More actions for Aarav Krishnan' });
    more.focus();
    fireEvent.keyDown(more, { key: 'Enter' });
    expect(screen.getByRole('menu', { name: 'More actions for Aarav Krishnan' })).toBeInTheDocument();
  });

  it('forwards refs, merges className last, and a bare trigger gets its own slot', () => {
    const content = React.createRef<HTMLDivElement>();
    const item = React.createRef<HTMLDivElement>();
    const trig = React.createRef<HTMLButtonElement>();
    render(
      <Menu defaultOpen>
        <MenuTrigger ref={trig}>Open</MenuTrigger>
        <MenuContent ref={content} className="min-w-80 p-2">
          <MenuItem ref={item} className="px-4">
            One
          </MenuItem>
        </MenuContent>
      </Menu>,
    );
    expect(trig.current).toHaveAttribute('data-slot', 'menu-trigger');
    expect(content.current).toBe(screen.getByRole('menu'));
    expect(content.current).toHaveClass('min-w-80', 'p-2');
    expect(content.current).not.toHaveClass('min-w-[13.75rem]');
    expect(content.current).not.toHaveClass('p-1');
    expect(item.current).toHaveClass('px-4');
    expect(item.current).not.toHaveClass('px-3');
  });

  it('portals into the container given', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(<CohortMenu defaultOpen contentProps={{ container: host }} />);
    expect(host.querySelector('[data-slot=menu-content]')).not.toBeNull();
    host.remove();
  });
});
