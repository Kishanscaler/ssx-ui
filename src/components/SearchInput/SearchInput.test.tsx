import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Field } from '../Field';
import { SearchInput } from './SearchInput';

const box = () => screen.getByRole('searchbox') as HTMLInputElement;

describe('SearchInput', () => {
  it('is a searchbox built on Input, with slot and size hooks', () => {
    const { container } = render(<SearchInput aria-label="Search students" size="lg" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-slot', 'search-input');
    expect(root).toHaveAttribute('data-size', 'lg');
    expect(box()).toHaveAttribute('data-slot', 'search-input-field');
    expect(box()).toHaveAttribute('type', 'search');
    expect(box()).toHaveAccessibleName('Search students');
    // Input's own recipe (size lg), with the glyph gutter.
    expect(box()).toHaveClass('h-control-lg', 'ps-10');
    expect(root.querySelector('[data-slot="search-input-icon"]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the clear button only when there is a query', () => {
    render(<SearchInput aria-label="Search" />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    fireEvent.change(box(), { target: { value: 'system design' } });
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('clear empties the query, calls onClear, reports "" and refocuses the field', () => {
    const onClear = vi.fn();
    const onValueChange = vi.fn();
    render(
      <SearchInput aria-label="Search" defaultValue="capstone" onClear={onClear} onValueChange={onValueChange} clearLabel="Clear student search" />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear student search' }));
    expect(box().value).toBe('');
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith('');
    expect(box()).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear student search' })).toBeNull();
  });

  it('Escape clears a non-empty query', () => {
    const onClear = vi.fn();
    render(<SearchInput aria-label="Search" defaultValue="GSoC" onClear={onClear} />);
    act(() => box().focus());
    fireEvent.keyDown(box(), { key: 'Escape' });
    expect(box().value).toBe('');
    expect(onClear).toHaveBeenCalled();
  });

  it('typing reports the query (uncontrolled and controlled)', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<SearchInput aria-label="Search" value="" onValueChange={onValueChange} />);
    fireEvent.change(box(), { target: { value: 'a' } });
    expect(onValueChange).toHaveBeenCalledWith('a');
    expect(box().value).toBe('');
    rerender(<SearchInput aria-label="Search" value="ab" onValueChange={onValueChange} />);
    expect(box().value).toBe('ab');
  });

  it('result count: a role=status line linked by aria-describedby', () => {
    render(<SearchInput aria-label="Search" defaultValue="capstone" resultCount="27 of 412 students match" aria-describedby="hint" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('27 of 412 students match');
    expect(status).toHaveAttribute('data-slot', 'search-input-status');
    expect(box().getAttribute('aria-describedby')).toBe(`hint ${status.id}`);
  });

  it('keeps an empty status region mounted but unlinked', () => {
    render(<SearchInput aria-label="Search" />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(box()).not.toHaveAttribute('aria-describedby');
  });

  it('loading: the loader replaces clear, the status reads loadingText, aria-busy', () => {
    const { container, rerender } = render(<SearchInput aria-label="Search" defaultValue="GSoC 2026" loading />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('[data-slot="spinner"]')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Searching…');
    expect(box()).toHaveAttribute('aria-busy', 'true');
    expect(container.firstElementChild).toHaveAttribute('data-loading');
    rerender(<SearchInput aria-label="Search" defaultValue="GSoC 2026" loading loadingText="Fetching students…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Fetching students…');
  });

  it('disabled / read-only: no clear button', () => {
    const { rerender } = render(<SearchInput aria-label="Search" defaultValue="x" disabled />);
    expect(box()).toBeDisabled();
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<SearchInput aria-label="Search" defaultValue="x" readOnly />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('wires into a Field (label, help, error, disabled)', () => {
    render(
      <Field label="Search students" help="Name or application ID" error="Type at least two characters">
        <SearchInput resultCount="0 of 412 students match" />
      </Field>,
    );
    const input = screen.getByRole('searchbox', { name: 'Search students' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toHaveLength(3);
    expect(ids).toContain(screen.getByRole('status').id);
  });

  it('forwards the ref to the input, className to the root, props to the input', () => {
    const ref = React.createRef<HTMLInputElement>();
    const { container } = render(<SearchInput ref={ref} aria-label="S" className="max-w-sm custom" id="s1" data-blok-uid="3" />);
    expect(ref.current).toBe(box());
    expect(container.firstElementChild).toHaveClass('max-w-sm', 'custom');
    expect(box()).toHaveAttribute('id', 's1');
    expect(box()).toHaveAttribute('data-blok-uid', '3');
  });
});
