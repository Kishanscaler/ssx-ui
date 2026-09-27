import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ButtonIcon } from '../Button';
import { GlassButton } from './GlassButton';
import { attachLiquid } from './liquid';
import { refractionProfile, supportsRefraction } from './refraction';

describe('GlassButton', () => {
  it('is a Button with no variant, marked as the glass material', () => {
    render(<GlassButton>Watch the trailer</GlassButton>);
    const button = screen.getByRole('button', { name: 'Watch the trailer' });
    expect(button).toHaveAttribute('data-slot', 'button');
    expect(button).toHaveAttribute('data-material', 'glass');
    expect(button).not.toHaveAttribute('data-variant');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('does not carry any Button variant fill', () => {
    render(<GlassButton>Apply now</GlassButton>);
    const cls = screen.getByRole('button').className;
    expect(cls).not.toMatch(/(^|\s)bg-action-primary(\s|$)/);
    expect(cls).toMatch(/backdrop-blur/);
  });

  it('keeps Button behaviour: loading is busy, focusable and swallows clicks', () => {
    const onClick = vi.fn();
    render(
      <GlassButton loading onClick={onClick}>
        Apply now
      </GlassButton>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).not.toBeDisabled();
    button.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards its ref to the button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<GlassButton ref={ref}>Apply now</GlassButton>);
    expect(ref.current).toBe(screen.getByRole('button'));
  });

  it('takes no icon well: a ButtonIcon renders as a plain icon', () => {
    render(
      <GlassButton>
        Explore
        <ButtonIcon>
          <svg data-testid="glyph" aria-hidden="true" />
        </ButtonIcon>
      </GlassButton>,
    );
    const button = screen.getByRole('button');
    expect(button.querySelector('[data-slot="button-icon"]')).toBeNull();
    expect(screen.getByTestId('glyph').parentElement).toBe(button);
  });

  it('renders no filter where refraction is unsupported (jsdom), and says so', () => {
    expect(supportsRefraction()).toBe(false);
    const { container } = render(<GlassButton refraction>Apply now</GlassButton>);
    expect(container.querySelector('filter')).toBeNull();
    expect(screen.getByRole('button')).not.toHaveAttribute('data-refraction');
  });

  it('is a capsule by default, and the system radius when asked', () => {
    const { rerender } = render(<GlassButton>Play</GlassButton>);
    expect(screen.getByRole('button')).toHaveClass('rounded-full');
    expect(screen.getByRole('button')).toHaveAttribute('data-shape', 'capsule');
    rerender(<GlassButton shape="rounded">Play</GlassButton>);
    expect(screen.getByRole('button')).not.toHaveClass('rounded-full');
    expect(screen.getByRole('button')).toHaveClass('rounded-md');
  });

  it('carries the light inside it, hidden from assistive tech, without touching the name', () => {
    render(<GlassButton>Watch the trailer</GlassButton>);
    const button = screen.getByRole('button', { name: 'Watch the trailer' });
    for (const part of ['glass-specular', 'glass-glow']) {
      const layer = button.querySelector(`[data-part="${part}"]`);
      expect(layer, part).not.toBeNull();
      expect(layer).toHaveAttribute('aria-hidden', 'true');
    }
    expect(button).toHaveClass('isolate');
  });

  it('puts the light inside the slotted element under asChild', () => {
    render(
      <GlassButton asChild>
        <a href="/trailer">Watch</a>
      </GlassButton>,
    );
    const link = screen.getByRole('link', { name: 'Watch' });
    expect(link).toHaveAttribute('data-material', 'glass');
    expect(link.querySelector('[data-part="glass-specular"]')).not.toBeNull();
  });

  it('hovers and presses exactly like every other Button', () => {
    render(<GlassButton>Play</GlassButton>);
    const cls = screen.getByRole('button').className;
    expect(cls).toMatch(/(^|\s)idle:hover:-translate-y-\(--motion-offset-lift\)(\s|$)/);
    expect(cls).toMatch(/(^|\s)idle:active:scale-\(--motion-scale-press\)(\s|$)/);
    expect(cls).toMatch(/(^|\s)idle:hover:bg-glass-hover(\s|$)/);
  });
});

describe('the lens (refraction.ts)', () => {
  it('bends most near the rim and not at all on the flat top', () => {
    const p = refractionProfile(20, 20, 1.5);
    expect(p).toHaveLength(128);
    expect(Math.max(...p)).toBeGreaterThan(0);
    expect(p[p.length - 1]!).toBeLessThan(Math.max(...p) * 0.05);
  });

  it('denser glass bends further (Snell)', () => {
    const peak = (n: number) => Math.max(...refractionProfile(20, 20, n));
    expect(peak(1.9)).toBeGreaterThan(peak(1.5));
    expect(peak(1.5)).toBeGreaterThan(peak(1.2));
    expect(peak(1)).toBeCloseTo(0, 6);
  });
});

describe('the light under a pointer (liquid.ts)', () => {
  const TOKENS: Record<string, string> = {
    '--glass-button-lensing-pressed': '1.45',
    '--motion-spring-liquid-stiffness': '380',
    '--motion-spring-liquid-damping': '18',
  };
  const tokened = () => {
    const el = document.createElement('button');
    for (const [k, v] of Object.entries(TOKENS)) el.style.setProperty(k, v);
    document.body.appendChild(el);
    return el;
  };

  it('does nothing without its tokens', () => {
    const el = document.createElement('button');
    const detach = attachLiquid(el);
    fireEvent.pointerDown(el);
    expect(el).not.toHaveAttribute('data-pressed');
    detach();
  });

  it('marks the press from pointer and keyboard, and lets go', () => {
    const el = tokened();
    const detach = attachLiquid(el);
    fireEvent.pointerDown(el, { clientX: 0, clientY: 0 });
    expect(el).toHaveAttribute('data-pressed');
    fireEvent.pointerUp(el);
    expect(el).not.toHaveAttribute('data-pressed');
    fireEvent.keyDown(el, { key: ' ' });
    expect(el).toHaveAttribute('data-pressed');
    fireEvent.keyUp(el, { key: ' ' });
    expect(el).not.toHaveAttribute('data-pressed');
    detach();
    el.remove();
  });

  it('never presses a disabled or busy button', () => {
    const el = tokened();
    el.setAttribute('data-loading', '');
    const detach = attachLiquid(el);
    fireEvent.pointerDown(el);
    expect(el).not.toHaveAttribute('data-pressed');
    detach();
    el.remove();
  });
});
