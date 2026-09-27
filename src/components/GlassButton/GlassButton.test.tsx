import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ButtonIcon } from '../Button';
import { GlassButton } from './GlassButton';
import { supportsRefraction } from './refraction';

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
});
