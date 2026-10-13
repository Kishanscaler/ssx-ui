import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { LogoTile } from './LogoTile';
import marketingCss from '../../styles/batches/marketing.css?raw';

const ZOMATO = { name: 'Zomato', src: '/logos/zomato.svg', color: 'rebeccapurple' };

describe('LogoTile', () => {
  it('draws the mark in its own colours on white by default', () => {
    const { container } = render(<LogoTile logo={ZOMATO} />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile).toHaveAttribute('data-slot', 'logo-tile');
    expect(tile).toHaveAttribute('data-fill', 'white');
    expect(tile).toHaveAttribute('data-shape', 'wide');
    expect(tile).toHaveAttribute('data-size', 'md');
    expect(tile).not.toHaveAttribute('data-part');
    expect(tile).toHaveClass('bg-on-image-ink', 'aspect-cinema', 'rounded-md', 'w-full');
    // The brand's colour is only the ground of a `brand` tile.
    expect(tile.style.getPropertyValue('--ssx-logo-tile-fill')).toBe('');
    const mark = screen.getByRole('img', { name: 'Zomato' });
    expect(mark).toHaveAttribute('data-slot', 'logo-tile-mark');
    expect(mark).toHaveAttribute('loading', 'lazy');
    expect(mark).not.toHaveClass('invert');
    expect(mark.className).not.toContain('brightness');
  });

  it('brand: the logo colour as the ground (inline), the mark flattened to white', () => {
    const { container } = render(<LogoTile logo={ZOMATO} fill="brand" />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile).toHaveAttribute('data-fill', 'brand');
    expect(tile.style.getPropertyValue('--ssx-logo-tile-fill')).toBe('rebeccapurple');
    expect(tile.className).toContain('bg-(--ssx-logo-tile-fill,');
    // The flatten is the batch's rule on data-fill, never filter utilities (fixed order).
    expect(screen.getByRole('img', { name: 'Zomato' }).className).not.toMatch(/brightness|invert|grayscale/);
  });

  it('flattens with grayscale, invert, then brightness, keyed on data-fill and data-native', () => {
    const css = marketingCss.replace(/\s+/g, ' ');
    for (const fill of ['brand', 'glass']) {
      expect(css).toContain(
        `[data-slot='logo-tile'][data-fill='${fill}']:not([data-native]) > [data-slot='logo-tile-mark']`,
      );
    }
    expect(css).toContain('filter: grayscale(1) invert(1) brightness(1.8);');
    expect(css).not.toContain("[data-fill='white']");
  });

  it('native keeps a multi-colour mark in its colours on any ground', () => {
    const { container } = render(<LogoTile logo={{ ...ZOMATO, native: true }} fill="glass" />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile).toHaveAttribute('data-native');
    expect(tile).toHaveClass('bg-glass-on-image', 'backdrop-blur-glass');
    expect(screen.getByRole('img', { name: 'Zomato' })).not.toHaveClass('invert');
  });

  it('glass flattens the mark for the photo under it (the batch rule keys on data-fill="glass")', () => {
    const { container } = render(<LogoTile logo={ZOMATO} fill="glass" />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile).toHaveAttribute('data-fill', 'glass');
    expect(tile).not.toHaveAttribute('data-native');
    expect(screen.getByRole('img', { name: 'Zomato' })).toHaveAttribute('data-slot', 'logo-tile-mark');
  });

  it('with no file sets the name as a wordmark', () => {
    const { container } = render(<LogoTile logo={{ name: 'Halcyon' }} shape="square" size="sm" />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.querySelector('img')).toBeNull();
    expect(screen.getByText('Halcyon')).toHaveAttribute('data-slot', 'logo-tile-wordmark');
    expect(tile).toHaveAttribute('data-shape', 'square');
    expect(tile).toHaveAttribute('data-size', 'sm');
    expect(tile).toHaveClass('aspect-square', 'px-2.5', 'py-1.5');
  });

  it('forwards the ref and keeps a consumer style beside the fill', () => {
    const ref = React.createRef<HTMLSpanElement>();
    const { container } = render(<LogoTile ref={ref} logo={ZOMATO} fill="brand" style={{ order: 1 }} />);
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current!.style.order).toBe('1');
    expect(ref.current!.style.getPropertyValue('--ssx-logo-tile-fill')).toBe('rebeccapurple');
  });
});
