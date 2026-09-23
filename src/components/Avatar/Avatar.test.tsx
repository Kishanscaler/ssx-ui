import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from './Avatar';

describe('Avatar', () => {
  it('shows the initials, hidden from assistive tech, when there is no image', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AK</AvatarFallback>
      </Avatar>,
    );
    const root = container.querySelector('[data-slot="avatar"]')!;
    expect(root).toHaveAttribute('data-size', 'md');
    expect(root).not.toHaveAttribute('role');
    const fallback = screen.getByText('AK');
    expect(fallback).toHaveAttribute('data-slot', 'avatar-fallback');
    expect(fallback).toHaveAttribute('aria-hidden', 'true');
  });

  it('is a named image when it stands alone', () => {
    render(
      <Avatar aria-label="Aarav Krishnan">
        <AvatarFallback>AK</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByRole('img', { name: 'Aarav Krishnan' })).toHaveAttribute('data-slot', 'avatar');
  });

  it.each([
    ['sm', 'size-7'],
    ['md', 'size-control-md'],
    ['lg', 'size-control-lg'],
  ] as const)('size %s → %s', (size, cls) => {
    const { container } = render(
      <Avatar size={size}>
        <AvatarFallback>AK</AvatarFallback>
      </Avatar>,
    );
    const root = container.querySelector('[data-slot="avatar"]')!;
    expect(root).toHaveAttribute('data-size', size);
    expect(root).toHaveClass(cls);
  });

  it('ring is a flag with an attribute', () => {
    const { container } = render(
      <Avatar ring>
        <AvatarFallback>AK</AvatarFallback>
      </Avatar>,
    );
    const root = container.querySelector('[data-slot="avatar"]')!;
    expect(root).toHaveAttribute('data-ring');
    expect(root).toHaveClass('ring-2', 'ring-border-brand');
  });

  it('renders no <img> before the image has loaded (initials first)', () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="/photo.jpg" alt="" />
        <AvatarFallback>AK</AvatarFallback>
      </Avatar>,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('AK')).toBeInTheDocument();
  });

  it('AvatarBadge hangs a hidden status dot on the corner', () => {
    const { container } = render(
      <Avatar aria-label="Aarav Krishnan — online">
        <AvatarFallback>AK</AvatarFallback>
        <AvatarBadge tone="success" />
      </Avatar>,
    );
    const badge = container.querySelector('[data-slot="avatar-badge"]')!;
    expect(badge).toHaveAttribute('aria-hidden', 'true');
    expect(badge).toHaveAttribute('data-tone', 'success');
    expect(badge).toHaveClass('absolute', 'ring-surface');
    expect(screen.getByRole('img')).toHaveAccessibleName('Aarav Krishnan — online');
  });

  it('a group passes its size down and is named once', () => {
    const { container } = render(
      <AvatarGroup size="sm" aria-label="Panel of 3 interviewers and 3 more">
        <Avatar>
          <AvatarFallback>SV</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>NG</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>,
    );
    expect(screen.getByRole('img', { name: 'Panel of 3 interviewers and 3 more' })).toHaveAttribute(
      'data-slot',
      'avatar-group',
    );
    container.querySelectorAll('[data-slot="avatar"]').forEach((a) => expect(a).toHaveAttribute('data-size', 'sm'));
    const count = screen.getByText('+3');
    expect(count).toHaveAttribute('data-slot', 'avatar-group-count');
    expect(count).toHaveAttribute('data-size', 'sm');
    expect(count).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards refs and merges className last', () => {
    const ref = React.createRef<HTMLSpanElement>();
    const { container } = render(
      <Avatar ref={ref} className="size-16">
        <AvatarFallback>AK</AvatarFallback>
      </Avatar>,
    );
    const root = container.querySelector('[data-slot="avatar"]');
    expect(ref.current).toBe(root);
    expect(root).toHaveClass('size-16');
    expect(root).not.toHaveClass('size-control-md');
  });
});

describe('AvatarGroupCount · labelling', () => {
  it('is hidden when unlabelled, and becomes a named image when given a label', () => {
    const { rerender } = render(<AvatarGroupCount>+3</AvatarGroupCount>);
    expect(screen.getByText('+3')).toHaveAttribute('aria-hidden', 'true');
    rerender(<AvatarGroupCount aria-label="3 more mentors">+3</AvatarGroupCount>);
    expect(screen.getByRole('img', { name: '3 more mentors' })).not.toHaveAttribute('aria-hidden');
  });
});
