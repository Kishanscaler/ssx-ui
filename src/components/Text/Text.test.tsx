import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SURFACE_INKS } from '../../lib/surface-ink';
import { Text } from './Text';

describe('Text on a coloured fill', () => {
  it('each tone names its own ink for every fill, and dims inside a disabled control', () => {
    render(
      <>
        <Text tone="primary">p</Text>
        <Text tone="secondary">s</Text>
      </>,
    );
    const [p, s] = [screen.getByText('p'), screen.getByText('s')];
    for (const fill of SURFACE_INKS) {
      expect(p).toHaveClass(`in-data-[surface-ink=${fill}]:text-${fill}-ink`);
      expect(s).toHaveClass(`in-data-[surface-ink=${fill}]:text-${fill}-ink-secondary`);
    }
    expect(p).toHaveClass('in-disabled:text-content-disabled');
  });
});

describe('Text', () => {
  it('is a paragraph by default, with resolved defaults on the hooks', () => {
    render(<Text>Aarav Krishnan</Text>);
    const el = screen.getByText('Aarav Krishnan');
    expect(el.tagName).toBe('P');
    expect(el).toHaveAttribute('data-slot', 'text');
    expect(el).toHaveAttribute('data-tone', 'primary');
    expect(el).toHaveAttribute('data-size', 'base');
    expect(el).toHaveClass('text-content', 'type-body');
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

  it.each([
    ['xs', 'type-caption'],
    ['sm', 'type-body-sm'],
    ['base', 'type-body'],
    ['md', 'type-body'],
    ['lg', 'type-body-lg'],
  ] as const)('size %s is the %s role', (size, role) => {
    render(<Text size={size}>x</Text>);
    // Every size is a type role: size, leading and tracking from one token.
    expect(screen.getByText('x')).toHaveClass(role);
    expect(screen.getByText('x').className).not.toMatch(/\bleading-/);
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

describe('Text on narrow screens', () => {
  it('breaks a long unbroken word instead of overflowing', () => {
    render(<Text>https://www.scaler.com/academy/mentee-dashboard/core-curriculum</Text>);
    expect(screen.getByText(/scaler\.com/).className).toContain('[overflow-wrap:anywhere]');
  });
});

describe('Text body size', () => {
  it('uses the body role by default, and a caller size is added after it', () => {
    const { rerender } = render(<Text>Body</Text>);
    expect(screen.getByText('Body')).toHaveClass('type-body');
    rerender(<Text className="text-sm">Body</Text>);
    const c = screen.getByText('Body').className.split(/\s+/);
    // The role stays (its leading and tracking are still wanted) and the
    // single-property `text-sm` wins on size: Tailwind sorts it after type-*.
    expect(c).toContain('text-sm');
    expect(c).toContain('type-body');
    expect(c.indexOf('text-sm')).toBeGreaterThan(c.indexOf('type-body'));
  });

  it('a caller role replaces the default role', () => {
    render(<Text className="type-caption">Fine print</Text>);
    const c = screen.getByText('Fine print').className.split(/\s+/);
    expect(c).toContain('type-caption');
    expect(c).not.toContain('type-body');
  });
});
