import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  List,
  ListItem,
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
