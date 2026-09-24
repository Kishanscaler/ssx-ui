import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Badge, type BadgeTone } from './Badge';

const TONES: BadgeTone[] = ['default', 'brand', 'accent', 'highlight', 'yellowSubtle', 'success', 'warning', 'danger', 'info', 'solid'];

describe('Badge', () => {
  it('is a passive span with resolved defaults on the hooks', () => {
    render(<Badge>Draft</Badge>);
    const badge = screen.getByText('Draft');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveAttribute('data-slot', 'badge');
    expect(badge).toHaveAttribute('data-tone', 'default');
    expect(badge).toHaveAttribute('data-size', 'md');
    expect(badge).not.toHaveAttribute('tabindex');
    expect(badge).not.toHaveAttribute('role');
  });

  it.each(TONES)('tone %s is emitted as data-tone', (tone) => {
    render(<Badge tone={tone}>x</Badge>);
    expect(screen.getByText('x')).toHaveAttribute('data-tone', tone);
  });

  it.each([
    ['sm', 'h-[1.125rem]'],
    ['md', 'h-[1.375rem]'],
    ['lg', 'h-[1.625rem]'],
  ] as const)('size %s → %s', (size, cls) => {
    render(<Badge size={size}>x</Badge>);
    expect(screen.getByText('x')).toHaveClass(cls);
  });

  it('dot adds a hidden leading dot in the badge ink', () => {
    const { container } = render(
      <Badge tone="success" dot>
        Placed
      </Badge>,
    );
    const dot = container.querySelector('[data-slot="badge-dot"]');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot).toHaveClass('bg-current');
    expect(screen.getByText('Placed')).toHaveAttribute('data-dot');
    expect(screen.getByText('Placed').firstChild).toBe(dot);
  });

  it('sizes a child icon to 16px unless the icon sets its own size', () => {
    render(
      <Badge>
        <svg data-testid="i" />
        Submitted
      </Badge>,
    );
    expect(screen.getByText('Submitted').className).toContain("[&_svg:not([class*='size-'])]:size-icon-sm");
  });

  it('forwards the ref and merges className last', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(
      <Badge ref={ref} className="rounded-full px-4">
        12,480
      </Badge>,
    );
    expect(ref.current).toBe(screen.getByText('12,480'));
    expect(ref.current).toHaveClass('rounded-full', 'px-4');
    expect(ref.current).not.toHaveClass('rounded-md', 'px-2');
  });
});
