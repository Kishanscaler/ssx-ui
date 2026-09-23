import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { TreeList, TreeListItem, type TreeListProps } from './TreeList';

function Curriculum(props: Partial<TreeListProps>) {
  return (
    <TreeList aria-label="SST curriculum" defaultExpanded={['y2', 's3', 'dsa']} defaultSelected="w6" {...props}>
      <TreeListItem value="y2" label="Year 2 — Batch of 2029" trailing={<span>2 semesters</span>}>
        <TreeListItem value="s3" label="Semester 3">
          <TreeListItem value="dsa" label="Data Structures & Algorithms">
            <TreeListItem value="w5" label="Week 5 — Heaps & priority queues" />
            <TreeListItem value="w6" label="Week 6 — Balanced binary search trees" />
            <TreeListItem value="w7" label="Week 7 — Graphs I" disabled />
          </TreeListItem>
          <TreeListItem value="os" label="Operating Systems">
            <TreeListItem value="os1" label="Week 1 — Processes & scheduling" />
          </TreeListItem>
        </TreeListItem>
        <TreeListItem value="s4" label="Semester 4">
          <TreeListItem value="sd" label="System Design I" />
        </TreeListItem>
      </TreeListItem>
    </TreeList>
  );
}

const item = (name: RegExp | string) => screen.getByRole('treeitem', { name });
const key = (k: string) => fireEvent.keyDown(document.activeElement as Element, { key: k });

describe('TreeList', () => {
  it('renders the APG tree structure with levels, expanded and selected state', () => {
    render(<Curriculum />);
    const tree = screen.getByRole('tree', { name: 'SST curriculum' });
    expect(tree).toHaveAttribute('data-slot', 'tree-list');
    const y2 = item(/Year 2/);
    expect(y2.tagName).toBe('BUTTON');
    expect(y2).toHaveAttribute('aria-level', '1');
    expect(y2).toHaveAttribute('aria-expanded', 'true');
    expect(item('Semester 3')).toHaveAttribute('aria-level', '2');
    expect(item(/Week 6/)).toHaveAttribute('aria-level', '4');
    expect(item(/Week 6/)).toHaveAttribute('aria-selected', 'true');
    expect(item(/Week 5/)).not.toHaveAttribute('aria-selected');
    expect(item(/Week 5/)).not.toHaveAttribute('aria-expanded');
    expect(item('Operating Systems')).toHaveAttribute('aria-expanded', 'false');
    expect(item(/Week 7/)).toBeDisabled();
    expect(screen.getAllByRole('group')[0]).toHaveAttribute('data-slot', 'tree-list-group');
    // Collapsed children are hidden from the tree.
    expect(screen.queryByRole('treeitem', { name: /Processes/ })).toBeNull();
    // One tab stop: the selected leaf.
    const tabbable = screen.getAllByRole('treeitem').filter((el) => el.tabIndex === 0);
    expect(tabbable).toEqual([item(/Week 6/)]);
  });

  it('the first node is the tab stop when nothing is selected', () => {
    render(<Curriculum defaultSelected={null} />);
    expect(item(/Year 2/)).toHaveAttribute('tabindex', '0');
  });

  it('moves with arrows, Home and End, skipping disabled and hidden nodes', () => {
    render(<Curriculum />);
    act(() => item(/Week 6/).focus());
    key('ArrowDown');
    expect(document.activeElement).toBe(item('Operating Systems'));
    expect(item('Operating Systems')).toHaveAttribute('tabindex', '0');
    key('ArrowUp');
    expect(document.activeElement).toBe(item(/Week 6/));
    key('Home');
    expect(document.activeElement).toBe(item(/Year 2/));
    key('End');
    expect(document.activeElement).toBe(item('Semester 4'));
  });

  it('→ expands then enters, ← collapses then goes to the parent', () => {
    const onExpandedChange = vi.fn();
    render(<Curriculum onExpandedChange={onExpandedChange} />);
    act(() => item('Operating Systems').focus());
    key('ArrowRight');
    expect(onExpandedChange).toHaveBeenLastCalledWith(['y2', 's3', 'dsa', 'os']);
    expect(item('Operating Systems')).toHaveAttribute('aria-expanded', 'true');
    key('ArrowRight');
    expect(document.activeElement).toBe(item(/Processes/));
    key('ArrowLeft');
    expect(document.activeElement).toBe(item('Operating Systems'));
    key('ArrowLeft');
    expect(item('Operating Systems')).toHaveAttribute('aria-expanded', 'false');
    key('ArrowLeft');
    expect(document.activeElement).toBe(item('Semester 3'));
  });

  it('click toggles a parent and selects a leaf; disabled nodes do nothing', () => {
    const onSelectedChange = vi.fn();
    render(<Curriculum onSelectedChange={onSelectedChange} />);
    fireEvent.click(item(/Week 5/));
    expect(onSelectedChange).toHaveBeenLastCalledWith('w5');
    expect(item(/Week 5/)).toHaveAttribute('aria-selected', 'true');
    expect(item(/Week 6/)).not.toHaveAttribute('aria-selected');
    fireEvent.click(item('Semester 4'));
    expect(item('Semester 4')).toHaveAttribute('aria-expanded', 'true');
    expect(item('System Design I')).toBeInTheDocument();
    fireEvent.click(item(/Week 7/));
    expect(onSelectedChange).toHaveBeenCalledTimes(1);
  });

  it('type-ahead focuses the next node starting with the letter', () => {
    render(<Curriculum />);
    act(() => item(/Year 2/).focus());
    key('o');
    expect(document.activeElement).toBe(item('Operating Systems'));
  });

  it('a hidden tab stop falls back to the first visible node; controlled expanded is honoured', () => {
    const { rerender } = render(<Curriculum expanded={['y2', 's3', 'dsa']} />);
    rerender(<Curriculum expanded={['y2']} />);
    expect(screen.queryByRole('treeitem', { name: /Week 6/ })).toBeNull();
    expect(item(/Year 2/)).toHaveAttribute('tabindex', '0');
  });

  it('forwards refs and className', () => {
    const treeRef = React.createRef<HTMLUListElement>();
    const itemRef = React.createRef<HTMLButtonElement>();
    render(
      <TreeList ref={treeRef} aria-label="Files" className="max-w-sm">
        <TreeListItem ref={itemRef} value="a" label="Offer letter.pdf" className="py-2" />
      </TreeList>,
    );
    expect(treeRef.current).toHaveClass('max-w-sm');
    expect(itemRef.current).toHaveClass('py-2');
    expect(itemRef.current).not.toHaveClass('py-1');
  });
});

describe('TreeList in a narrow container', () => {
  function Deep() {
    const ids = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6'];
    let node: React.ReactNode = <TreeListItem value="l7" label="webhook.test.ts" trailing={<span>Passing</span>} />;
    for (let i = ids.length - 1; i >= 0; i -= 1) {
      node = (
        <TreeListItem value={ids[i] as string} label={`Level ${i + 1}`}>
          {node}
        </TreeListItem>
      );
    }
    return (
      <TreeList aria-label="Repository" defaultExpanded={ids}>
        {node}
      </TreeList>
    );
  }

  it('caps the indent after level 4 and shows deeper levels as a number (TR1)', () => {
    const { container } = render(<Deep />);
    expect(screen.getByRole('tree')).toHaveClass('@container');
    const groups = Array.from(container.querySelectorAll('[role="group"]'));
    // Groups hold levels 2..7; those holding level 5 and deeper are capped.
    expect(groups.map((g) => g.hasAttribute('data-capped'))).toEqual([false, false, false, true, true, true]);
    const depth = (name: string) =>
      screen.getByRole('treeitem', { name: new RegExp(name) }).querySelector('[data-slot="tree-list-item-depth"]');
    expect(depth('Level 4')).toBeNull();
    expect(depth('Level 5')).toHaveTextContent('5');
    expect(depth('Level 5')).toHaveAttribute('aria-hidden', 'true');
    expect(depth('webhook')).toHaveTextContent('7');
  });

  it('labels take the free width; the trailing badge wraps; rows are 44px on touch', () => {
    render(<Deep />);
    const item = screen.getByRole('treeitem', { name: /webhook/ });
    expect(item).toHaveClass('flex-wrap', 'pointer-coarse:min-h-(--size-touch-min)');
    expect(item.querySelector('[data-slot="tree-list-item-label"]')).toHaveClass('min-w-0', 'flex-1');
    expect(item.querySelector('[data-slot="tree-list-item-trailing"]')).toHaveClass('ms-auto', 'flex-wrap');
  });
});
