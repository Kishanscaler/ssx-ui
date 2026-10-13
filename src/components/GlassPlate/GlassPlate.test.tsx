import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { GlassPlate } from './GlassPlate';
import { Text } from '../Text';

describe('GlassPlate', () => {
  it('is a light, frosted plate in flow that declares on-image ink', () => {
    render(<GlassPlate>₹50L</GlassPlate>);
    const plate = screen.getByText('₹50L');
    expect(plate.tagName).toBe('DIV');
    expect(plate).toHaveAttribute('data-slot', 'glass-plate');
    expect(plate).toHaveAttribute('data-tone', 'light');
    expect(plate).toHaveAttribute('data-inset', 'none');
    expect(plate).toHaveAttribute('data-blur');
    expect(plate).toHaveAttribute('data-surface-ink', 'on-image');
    expect(plate).toHaveClass(
      'bg-glass-on-image',
      'border-glass-on-image-hover',
      'backdrop-blur-glass',
      'backdrop-saturate-(--glass-saturate)',
      'px-5',
      'py-4',
      'rounded-lg',
      'text-on-image-ink',
    );
    expect(plate).not.toHaveClass('absolute');
  });

  it('dark tone is the fixed dark plate, through its custom property', () => {
    render(<GlassPlate tone="dark">x</GlassPlate>);
    const plate = screen.getByText('x');
    expect(plate).toHaveAttribute('data-tone', 'dark');
    expect(plate).toHaveClass('bg-(--ssx-plate-on-photo,var(--surface-image-scrim))');
    expect(plate).not.toHaveClass('bg-glass-on-image');
  });

  it('inset="foot" pins it to the foot of its parent, --space-2 in', () => {
    render(<GlassPlate inset="foot">x</GlassPlate>);
    const plate = screen.getByText('x');
    expect(plate).toHaveAttribute('data-inset', 'foot');
    expect(plate).toHaveClass('absolute', 'inset-x-2', 'bottom-2');
  });

  it('blur={false} drops the frost', () => {
    render(<GlassPlate blur={false}>x</GlassPlate>);
    const plate = screen.getByText('x');
    expect(plate).not.toHaveAttribute('data-blur');
    expect(plate).not.toHaveClass('backdrop-blur-glass');
  });

  it('inks the Text inside through the surface-ink contract', () => {
    render(
      <GlassPlate as="footer">
        <Text tone="secondary">offered on Shark Tank India</Text>
      </GlassPlate>,
    );
    const text = screen.getByText('offered on Shark Tank India');
    expect(text.closest('[data-surface-ink="on-image"]')?.tagName).toBe('FOOTER');
    expect(text.className).toContain('in-data-[surface-ink=on-image]:text-on-image-ink-secondary');
  });

  it('forwards the ref and merges className', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <GlassPlate ref={ref} as="dl" className="grid gap-2">
        <dt>Founded</dt>
      </GlassPlate>,
    );
    expect(ref.current?.tagName).toBe('DL');
    expect(ref.current).toHaveClass('grid', 'gap-2');
  });
});
