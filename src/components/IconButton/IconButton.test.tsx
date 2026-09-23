import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { IconButton } from './IconButton';

const Glyph = () => <svg data-testid="glyph" viewBox="0 0 256 256" aria-hidden="true" />;

describe('IconButton', () => {
  it('is a Button with a square size, named by aria-label', () => {
    render(
      <IconButton aria-label="Search students" variant="secondary">
        <Glyph />
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Search students' });
    expect(button).toHaveAttribute('data-slot', 'button');
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('data-size', 'icon-md');
    expect(button).toHaveAttribute('type', 'button');
  });

  it.each([
    ['sm', 'icon-sm'],
    ['md', 'icon-md'],
    ['lg', 'icon-lg'],
  ] as const)('size %s maps to Button size %s', (size, buttonSize) => {
    render(
      <IconButton aria-label="Add module" size={size}>
        <Glyph />
      </IconButton>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('data-size', buttonSize);
  });

  it('requires aria-label in its type', () => {
    // @ts-expect-error aria-label is required
    const el = <IconButton><Glyph /></IconButton>;
    expect(el).toBeTruthy();
  });

  it('replaces the glyph with the loader while loading, keeping the name', () => {
    const { container } = render(
      <IconButton aria-label="Refreshing applicant list" loading>
        <Glyph />
      </IconButton>,
    );
    expect(screen.queryByTestId('glyph')).toBeNull();
    expect(container.querySelector('[data-slot="spinner"]')).not.toBeNull();
    expect(screen.getByRole('button')).toHaveAccessibleName('Refreshing applicant list');
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('forwards the ref and merges className last', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <IconButton ref={ref} aria-label="Close panel" className="size-12">
        <Glyph />
      </IconButton>,
    );
    expect(ref.current).toBe(screen.getByRole('button'));
    expect(ref.current).toHaveClass('size-12');
    expect(ref.current).not.toHaveClass('size-control-md');
  });

  it('passes clicks through and respects disabled', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <IconButton aria-label="Star" onClick={onClick}>
        <Glyph />
      </IconButton>,
    );
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(
      <IconButton aria-label="Star" onClick={onClick} disabled>
        <Glyph />
      </IconButton>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
