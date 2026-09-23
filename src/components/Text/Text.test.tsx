import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Text } from './Text';

describe('Text', () => {
  it('is a paragraph by default, with resolved defaults on the hooks', () => {
    render(<Text>Aarav Krishnan</Text>);
    const el = screen.getByText('Aarav Krishnan');
    expect(el.tagName).toBe('P');
    expect(el).toHaveAttribute('data-slot', 'text');
    expect(el).toHaveAttribute('data-tone', 'primary');
    expect(el).toHaveAttribute('data-size', 'base');
    expect(el).toHaveClass('text-content', 'text-base');
  });

  it.each([
    ['secondary', 'text-content-secondary'],
    ['brand', 'text-content-brand'],
    ['disabled', 'text-content-disabled'],
    ['link', 'text-content-link'],
  ] as const)('tone %s → %s', (tone, cls) => {
    render(<Text tone={tone}>x</Text>);
    expect(screen.getByText('x')).toHaveClass(cls);
    expect(screen.getByText('x')).toHaveAttribute('data-tone', tone);
  });

  it.each(['xs', 'sm', 'base', 'md', 'lg'] as const)('size %s', (size) => {
    render(<Text size={size}>x</Text>);
    expect(screen.getByText('x')).toHaveClass(`text-${size}`);
  });

  it('renders the element given in `as`', () => {
    render(
      <Text as="label" htmlFor="email">
        Email
      </Text>,
    );
    const label = screen.getByText('Email');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for', 'email');
  });

  it('forwards the ref and merges className last', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Text ref={ref} tone="secondary" className="text-content tabular-nums">
        ₹19,50,000
      </Text>,
    );
    expect(ref.current).toBe(screen.getByText('₹19,50,000'));
    expect(ref.current).toHaveClass('text-content', 'tabular-nums');
    expect(ref.current).not.toHaveClass('text-content-secondary');
  });

  it('accepts Storyblok strings for every axis', () => {
    const blok = { tone: 'brand', size: 'lg' } as { tone: string; size: string };
    render(
      <Text tone={blok.tone as 'brand'} size={blok.size as 'lg'}>
        x
      </Text>,
    );
    expect(screen.getByText('x')).toHaveAttribute('data-tone', 'brand');
  });
});
