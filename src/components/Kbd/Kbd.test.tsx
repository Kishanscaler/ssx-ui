import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Kbd, KbdGroup } from './Kbd';
import { KbdMod } from './KbdMod';

describe('Kbd', () => {
  it('is a <kbd> with the slot hook', () => {
    render(<Kbd>Esc</Kbd>);
    const k = screen.getByText('Esc');
    expect(k.tagName).toBe('KBD');
    expect(k).toHaveAttribute('data-slot', 'kbd');
  });

  it('forwards the ref and merges className last', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Kbd ref={ref} className="h-8">
        K
      </Kbd>,
    );
    expect(ref.current).toBe(screen.getByText('K'));
    expect(ref.current).toHaveClass('h-8');
    expect(ref.current).not.toHaveClass('h-[22px]');
  });
});

describe('KbdGroup', () => {
  it('is a kbd of kbds with "+" between the keys', () => {
    const { container } = render(
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>R</Kbd>
      </KbdGroup>,
    );
    const group = container.firstChild as HTMLElement;
    expect(group.tagName).toBe('KBD');
    expect(group).toHaveAttribute('data-slot', 'kbd-group');
    expect(group.querySelectorAll('[data-slot="kbd"]')).toHaveLength(3);
    expect(group.querySelectorAll('[data-slot="kbd-separator"]')).toHaveLength(2);
    expect(group).toHaveTextContent('⌘+⇧+R');
  });

  it('separator={null} puts nothing between', () => {
    const { container } = render(
      <KbdGroup separator={null}>
        <Kbd>G</Kbd>
        <Kbd>G</Kbd>
      </KbdGroup>,
    );
    expect(container.querySelectorAll('[data-slot="kbd-separator"]')).toHaveLength(0);
  });
});

describe('KbdMod', () => {
  it('says Ctrl off Apple platforms', () => {
    render(<KbdMod platform="other" />);
    const k = screen.getByText('Ctrl');
    expect(k).toHaveAttribute('data-kbd', 'mod');
    expect(k).toHaveAttribute('data-platform', 'other');
  });

  it('shows ⌘ on Apple, with the word for screen readers', () => {
    const { container } = render(<KbdMod platform="mac" />);
    const k = container.firstChild as HTMLElement;
    expect(k).toHaveTextContent('⌘Command');
    expect(screen.getByText('⌘')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Command')).toHaveClass('sr-only');
  });

  it('alt is ⌥ / Alt', () => {
    const { rerender } = render(<KbdMod modifier="alt" platform="mac" />);
    expect(screen.getByText('Option')).toBeInTheDocument();
    rerender(<KbdMod modifier="alt" platform="other" />);
    expect(screen.getByText('Alt')).toBeInTheDocument();
  });

  it('detects the platform after mount when not given one', () => {
    const { container } = render(<KbdMod />);
    // jsdom's navigator.platform is '' and its UA is not Apple: stays "other".
    expect(container.firstChild).toHaveAttribute('data-platform', 'other');
  });

  it('forwards the ref', () => {
    const ref = React.createRef<HTMLElement>();
    const { container } = render(<KbdMod ref={ref} platform="other" />);
    expect(ref.current).toBe(container.firstChild);
  });
});
