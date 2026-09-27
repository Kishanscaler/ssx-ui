import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  List,
  ListItem,
  ListItemButton,
  ListItemLink,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from './List';

describe('List', () => {
  it('is a list of rows with slotted parts', () => {
    render(
      <List aria-label="Week 6 submissions">
        <ListItem>
          <ListItemLeading>AK</ListItemLeading>
          <ListItemContent>
            <ListItemTitle meta="SST-2029-0416">Aarav Krishnan</ListItemTitle>
            <ListItemDescription>Submitted 4 Mar 2026, 11:42 PM</ListItemDescription>
          </ListItemContent>
          <ListItemTrailing>
            <button type="button">Open</button>
          </ListItemTrailing>
        </ListItem>
        <ListItem selected>Meher Iyengar</ListItem>
      </List>,
    );
    const list = screen.getByRole('list', { name: 'Week 6 submissions' });
    expect(list.tagName).toBe('UL');
    expect(list).toHaveAttribute('data-slot', 'list');
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute('data-slot', 'list-item');
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(items[1]).toHaveAttribute('aria-current', 'true');
    expect(items[1]).toHaveAttribute('data-state', 'selected');
    for (const slot of ['list-item-leading', 'list-item-content', 'list-item-title', 'list-item-description', 'list-item-trailing', 'list-item-meta']) {
      expect(list.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument();
    }
    expect(list.querySelector('[data-slot="list-item-title"]')).toHaveTextContent('Aarav Krishnan · SST-2029-0416');
  });

  it('renders an ordered list, forwards refs, and puts className last', () => {
    const listRef = React.createRef<HTMLUListElement>();
    const itemRef = React.createRef<HTMLLIElement>();
    render(
      <List as="ol" ref={listRef} className="rounded-none">
        <ListItem ref={itemRef} className="px-6">
          Rank 1
        </ListItem>
      </List>,
    );
    expect(listRef.current?.tagName).toBe('OL');
    expect(listRef.current).toHaveClass('rounded-none');
    expect(listRef.current).not.toHaveClass('rounded-lg');
    expect(itemRef.current).toHaveClass('px-6');
    expect(itemRef.current).not.toHaveClass('px-4');
  });

  it('omits the meta separator when there is no meta', () => {
    render(<ListItemTitle>Rehan Qureshi</ListItemTitle>);
    expect(screen.getByText('Rehan Qureshi')).toHaveTextContent(/^Rehan Qureshi$/);
  });
});

describe('List on narrow rows', () => {
  it('wraps the trailing slot under the content instead of squeezing it (L1)', () => {
    render(
      <List aria-label="Submissions">
        <ListItem>
          <ListItemContent>
            <ListItemTitle>Meher Iyengar</ListItemTitle>
          </ListItemContent>
          <ListItemTrailing>
            <button type="button">Review</button>
          </ListItemTrailing>
        </ListItem>
      </List>,
    );
    const item = screen.getByRole('listitem');
    expect(item).toHaveClass('flex-wrap');
    const content = item.querySelector('[data-slot="list-item-content"]');
    expect(content).toHaveClass('min-w-0', 'flex-1', 'basis-40', '[overflow-wrap:anywhere]');
    expect(item.querySelector('[data-slot="list-item-trailing"]')).toHaveClass('ms-auto', 'flex-wrap', 'shrink-0');
  });
});

describe('Interactive rows (ListItemLink, ListItemButton)', () => {
  const interactive = (root: HTMLElement) =>
    root.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');

  it('a link row is ONE interactive element holding the row parts', () => {
    render(
      <List aria-label="Recent chats">
        <ListItem>
          <ListItemLink href="/chat/rotated-array">
            <ListItemContent>
              <ListItemTitle>Binary search on a rotated array</ListItemTitle>
              <ListItemDescription>Yesterday · 14 messages</ListItemDescription>
            </ListItemContent>
            <ListItemTrailing>
              <span>Assignment 3</span>
            </ListItemTrailing>
          </ListItemLink>
        </ListItem>
      </List>,
    );
    const item = screen.getByRole('listitem');
    expect(interactive(item)).toHaveLength(1);
    const link = screen.getByRole('link', { name: /Binary search on a rotated array/ });
    expect(link).toHaveAttribute('data-slot', 'list-item-link');
    expect(link).toHaveAttribute('href', '/chat/rotated-array');
    expect(link).not.toHaveAttribute('aria-current');
    expect(link.parentElement).toBe(item);
    // The link carries the row padding; the row gives it up (only when it holds a target).
    expect(link).toHaveClass('flex-1', 'px-4', 'py-3', 'focus-visible:ring-inset');
    expect(item.className).toContain('has-[>[data-list-item-target]]:p-0');
  });

  it('current marks the open conversation with aria-current (page for a link, true for a button)', () => {
    render(
      <List aria-label="Chats">
        <ListItem>
          <ListItemLink href="/chat/1" current>
            One
          </ListItemLink>
        </ListItem>
        <ListItem>
          <ListItemButton current>Two</ListItemButton>
        </ListItem>
        <ListItem>
          <ListItemLink href="/chat/3" current="location">
            Three
          </ListItemLink>
        </ListItem>
      </List>,
    );
    expect(screen.getByRole('link', { name: 'One' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'One' })).toHaveAttribute('data-current', '');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'Three' })).toHaveAttribute('aria-current', 'location');
    // The row itself is not also marked: one aria-current per row.
    for (const li of screen.getAllByRole('listitem')) expect(li).not.toHaveAttribute('aria-current');
  });

  it('a separate trailing action is a sibling of the target, never inside it', () => {
    render(
      <List aria-label="Chats">
        <ListItem>
          <ListItemButton onClick={() => {}}>
            <ListItemContent>
              <ListItemTitle>Open chat</ListItemTitle>
            </ListItemContent>
          </ListItemButton>
          <ListItemTrailing>
            <button type="button">More actions for this chat</button>
          </ListItemTrailing>
        </ListItem>
      </List>,
    );
    const row = screen.getByRole('button', { name: 'Open chat' });
    const more = screen.getByRole('button', { name: 'More actions for this chat' });
    expect(row.contains(more)).toBe(false);
    expect(row).toHaveAttribute('type', 'button');
    expect(row).toHaveAttribute('data-slot', 'list-item-button');
    expect(more.closest('[data-slot="list-item-trailing"]')?.parentElement).toBe(screen.getByRole('listitem'));
  });

  it('asChild lends the row to your own link and forwards refs', () => {
    const ref = React.createRef<HTMLAnchorElement>();
    render(
      <List aria-label="Chats">
        <ListItem>
          <ListItemLink asChild current ref={ref} className="px-6">
            <a href="/chat/9" data-router="">
              Heaps
            </a>
          </ListItemLink>
        </ListItem>
      </List>,
    );
    const link = screen.getByRole('link', { name: 'Heaps' });
    expect(link).toBe(ref.current);
    expect(link).toHaveAttribute('data-router', '');
    expect(link).toHaveAttribute('data-slot', 'list-item-link');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveClass('px-6');
    expect(link).not.toHaveClass('px-4');
  });

  it('a plain row is unchanged: no target attributes appear', () => {
    render(
      <List aria-label="Week 6 submissions">
        <ListItem selected>Meher Iyengar</ListItem>
      </List>,
    );
    const item = screen.getByRole('listitem');
    expect(item).toHaveClass('px-4', 'py-3', 'hover:bg-surface-hover');
    expect(item.querySelector('[data-list-item-target]')).toBeNull();
    expect(item).toHaveAttribute('aria-current', 'true');
  });
});
