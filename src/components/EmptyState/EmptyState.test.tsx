import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  EmptyState,
  EmptyStateActions,
  EmptyStateArt,
  EmptyStateDescription,
  EmptyStateTitle,
} from './EmptyState';

describe('EmptyState', () => {
  it('builds art, title, description and action from the flat fields', () => {
    const { container } = render(
      <EmptyState
        icon={<svg data-testid="glyph" />}
        title="No cohorts yet"
        description="Create your first one."
        actionLabel="Create a cohort"
        actionHref="/cohorts/new"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-slot', 'empty-state');
    expect(Array.from(root.children).map((c) => c.getAttribute('data-slot'))).toEqual([
      'empty-state-art',
      'empty-state-title',
      'empty-state-description',
      'empty-state-actions',
    ]);
    const art = container.querySelector('[data-slot="empty-state-art"]') as HTMLElement;
    expect(art).toHaveAttribute('aria-hidden', 'true');
    expect(art).toHaveAttribute('data-tone', 'brand');
    expect(screen.getByRole('heading', { level: 3, name: 'No cohorts yet' })).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: 'Create a cohort' });
    expect(cta).toHaveAttribute('href', '/cohorts/new');
    expect(cta).toHaveAttribute('data-variant', 'primary');
    expect(root).not.toHaveAttribute('title');
  });

  it('artTone, titleAs and actionVariant', () => {
    const { container } = render(
      <EmptyState
        icon={<svg />}
        artTone="danger"
        title="We couldn’t load the placement report"
        titleAs="h2"
        actionLabel="Clear all filters"
        actionHref="?"
        actionVariant="secondary"
      />,
    );
    const art = container.querySelector('[data-slot="empty-state-art"]') as HTMLElement;
    expect(art).toHaveAttribute('data-tone', 'danger');
    expect(art.className).toContain('bg-danger-surface');
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('data-variant', 'secondary');
  });

  it('every art tone of the .empty__art family maps to a class', () => {
    for (const tone of ['brand', 'neutral', 'info', 'success', 'warning', 'danger', 'solid'] as const) {
      const { container, unmount } = render(
        <EmptyStateArt tone={tone}>
          <svg />
        </EmptyStateArt>,
      );
      const el = container.firstElementChild as HTMLElement;
      expect(el).toHaveAttribute('data-tone', tone);
      expect(el.className).toMatch(/\bbg-/);
      unmount();
    }
  });

  it('no icon, no art; no href, no flat action; `actions` wins', () => {
    const { container } = render(
      <EmptyState title="Nothing" actionLabel="orphan" actions={<button type="button">Try again</button>} />,
    );
    expect(container.querySelector('[data-slot="empty-state-art"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('orphan')).toBeNull();
    const { container: c2 } = render(<EmptyState title="x" actionLabel="no href" />);
    expect(c2.querySelector('[data-slot="empty-state-actions"]')).toBeNull();
  });

  it('compound parts render as given', () => {
    render(
      <EmptyState>
        <EmptyStateArt tone="neutral">
          <svg />
        </EmptyStateArt>
        <EmptyStateTitle as="h4">No students match</EmptyStateTitle>
        <EmptyStateDescription>Try a shorter query.</EmptyStateDescription>
        <EmptyStateActions>
          <button type="button">Clear all filters</button>
        </EmptyStateActions>
      </EmptyState>,
    );
    expect(screen.getByRole('heading', { level: 4 })).toHaveAttribute('data-slot', 'empty-state-title');
    expect(screen.getByText('Try a shorter query.').tagName).toBe('P');
  });

  it('forwards refs and merges className last', () => {
    const ref = React.createRef<HTMLDivElement>();
    const artRef = React.createRef<HTMLDivElement>();
    render(
      <EmptyState ref={ref} className="py-6" data-testid="es">
        <EmptyStateArt ref={artRef} className="size-16">
          <svg />
        </EmptyStateArt>
      </EmptyState>,
    );
    expect(ref.current).toBe(screen.getByTestId('es'));
    expect(ref.current!.className).toContain('py-6');
    expect(ref.current!.className).not.toContain('py-12');
    expect(artRef.current!.className).toContain('size-16');
    expect(artRef.current!.className).not.toContain('size-24');
  });
});
