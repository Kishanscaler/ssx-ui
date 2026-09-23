import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';

function Programme(props: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs defaultValue="overview" {...props}>
      <TabsList aria-label="Programme details">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
        <TabsTrigger value="archive" disabled>
          Archive
        </TabsTrigger>
        <TabsTrigger value="placements">Placements</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Four residential years</TabsContent>
      <TabsContent value="curriculum">Eight semesters</TabsContent>
      <TabsContent value="archive">Old</TabsContent>
      <TabsContent value="placements">Placement drive</TabsContent>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });

/**
 * Radix Tabs selects on `mousedown` (left button, no ctrl), not on `click`.
 * `fireEvent.mouseDown` defaults to `button: 0`; React 16's synthetic event
 * reads it the same way, so this works on both.
 */
const press = (el: HTMLElement) => fireEvent.mouseDown(el, { button: 0, ctrlKey: false });
// Radix roving focus moves focus in a timeout, hence waitFor on every focus
// assertion below.

describe('Tabs', () => {
  it('is a named tablist of tabs with one panel shown', () => {
    render(<Programme />);
    expect(screen.getByRole('tablist', { name: 'Programme details' })).toHaveAttribute('data-slot', 'tabs-list');
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Overview')).toHaveAttribute('data-slot', 'tabs-trigger');
    expect(tab('Curriculum')).toHaveAttribute('aria-selected', 'false');
    const panel = screen.getByRole('tabpanel', { name: 'Overview' });
    expect(panel).toHaveAttribute('data-slot', 'tabs-content');
    expect(panel).toHaveTextContent('Four residential years');
    expect(panel).toHaveAttribute('tabindex', '0');
    // Inactive panels are not rendered, so not in the accessibility tree.
    expect(screen.queryByText('Eight semesters')).toBeNull();
  });

  it('is one tab stop that lands on the selected tab', async () => {
    render(<Programme defaultValue="curriculum" />);
    // Radix roving focus: until focus enters, the LIST is the single tab stop
    // and every tab is -1; entering it moves focus to the selected tab, which
    // then holds tabindex 0 (the HTML's selected-tab-is-0 contract).
    screen.getAllByRole('tab').forEach((t) => expect(t).toHaveAttribute('tabindex', '-1'));
    act(() => screen.getByRole('tablist').focus());
    await waitFor(() => expect(tab('Curriculum')).toHaveFocus());
    expect(tab('Curriculum')).toHaveAttribute('tabindex', '0');
    expect(tab('Overview')).toHaveAttribute('tabindex', '-1');
  });

  it('selects on press', () => {
    render(<Programme />);
    press(tab('Curriculum'));
    expect(tab('Curriculum')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Eight semesters');
  });

  it('automatic: arrows move focus AND select, skipping disabled; Home / End', async () => {
    render(<Programme />);
    act(() => tab('Overview').focus());
    fireEvent.keyDown(tab('Overview'), { key: 'ArrowRight' });
    await waitFor(() => expect(tab('Curriculum')).toHaveFocus());
    expect(tab('Curriculum')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(tab('Curriculum'), { key: 'ArrowRight' });
    await waitFor(() => expect(tab('Placements')).toHaveFocus());
    fireEvent.keyDown(tab('Placements'), { key: 'Home' });
    await waitFor(() => expect(tab('Overview')).toHaveFocus());
    fireEvent.keyDown(tab('Overview'), { key: 'End' });
    await waitFor(() => expect(tab('Placements')).toHaveFocus());
    expect(tab('Placements')).toHaveAttribute('aria-selected', 'true');
  });

  it('manual: arrows move focus only; Enter selects', async () => {
    render(<Programme activationMode="manual" />);
    act(() => tab('Overview').focus());
    fireEvent.keyDown(tab('Overview'), { key: 'ArrowRight' });
    await waitFor(() => expect(tab('Curriculum')).toHaveFocus());
    expect(tab('Curriculum')).toHaveAttribute('aria-selected', 'false');
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(tab('Curriculum'), { key: 'Enter' });
    expect(tab('Curriculum')).toHaveAttribute('aria-selected', 'true');
  });

  it('vertical orientation uses Up / Down', async () => {
    render(<Programme orientation="vertical" />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    act(() => tab('Overview').focus());
    fireEvent.keyDown(tab('Overview'), { key: 'ArrowDown' });
    await waitFor(() => expect(tab('Curriculum')).toHaveFocus());
  });

  it('a disabled tab cannot be selected', () => {
    render(<Programme />);
    expect(tab('Archive')).toBeDisabled();
    press(tab('Archive'));
    expect(tab('Archive')).toHaveAttribute('aria-selected', 'false');
  });

  it('is controlled', () => {
    const onValueChange = vi.fn();
    render(<Programme defaultValue={undefined} value="overview" onValueChange={onValueChange} />);
    press(tab('Placements'));
    expect(onValueChange).toHaveBeenCalledWith('placements');
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
  });

  it('renders the flat items form, selecting the first enabled item by default', () => {
    render(
      <Tabs
        listLabel="Module workspace"
        items={[
          { value: 'grades', label: 'Grades', content: 'Running grade', disabled: true },
          { value: 'overview', label: 'Overview', content: 'Week 6' },
          { value: 'quizzes', label: 'Quizzes', content: 'Quiz 4' },
        ]}
      />,
    );
    expect(screen.getByRole('tablist', { name: 'Module workspace' })).toBeInTheDocument();
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Week 6');
  });

  it('forwards refs, merges className and spreads props', () => {
    const root = React.createRef<HTMLDivElement>();
    const list = React.createRef<HTMLDivElement>();
    const trigger = React.createRef<HTMLButtonElement>();
    const content = React.createRef<HTMLDivElement>();
    render(
      <Tabs ref={root} defaultValue="a" data-blok-uid="t1" className="gap-2">
        <TabsList ref={list} aria-label="L" className="gap-4">
          <TabsTrigger ref={trigger} value="a" className="px-6">
            A
          </TabsTrigger>
        </TabsList>
        <TabsContent ref={content} value="a" className="pt-4">
          a
        </TabsContent>
      </Tabs>,
    );
    expect(root.current).toHaveAttribute('data-slot', 'tabs');
    expect(root.current).toHaveAttribute('data-blok-uid', 't1');
    expect(list.current).toHaveClass('gap-4');
    expect(list.current).not.toHaveClass('gap-1');
    expect(trigger.current).toHaveClass('px-6');
    expect(trigger.current).not.toHaveClass('px-4');
    expect(content.current).toHaveClass('pt-4');
    expect(content.current).not.toHaveClass('pt-6');
  });
});
