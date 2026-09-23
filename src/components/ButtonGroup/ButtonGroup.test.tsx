import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { ToggleButton } from '../ToggleButton';
import { ButtonGroup } from './ButtonGroup';

describe('ButtonGroup', () => {
  it('is a named group of its members', () => {
    render(
      <ButtonGroup aria-label="Submission actions">
        <Button variant="secondary">Preview</Button>
        <Button variant="secondary">Download</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group', { name: 'Submission actions' });
    expect(group).toHaveAttribute('data-slot', 'button-group');
    expect(screen.getAllByRole('button')).toHaveLength(2);
    // Members keep their own slot, which is what cancels Button's hover lift.
    for (const b of screen.getAllByRole('button')) {
      expect(b).toHaveAttribute('data-slot', 'button');
      expect(b.parentElement).toBe(group);
    }
  });

  it('welds the members: square inner corners, a shared seam, raised on hover / focus / pressed', () => {
    render(<ButtonGroup aria-label="g" />);
    const cls = screen.getByRole('group').className;
    for (const c of [
      '[&>*]:rounded-none',
      '[&>*:first-child]:rounded-s-md',
      '[&>*:last-child]:rounded-e-md',
      '[&>*:not(:first-child)]:-ms-px',
      '[&>*:focus-visible]:z-raised',
      '[&>[data-state=on]]:z-raised',
    ]) {
      expect(cls).toContain(c);
    }
  });

  it('holds disabled, loading, icon-only and pressed members', () => {
    render(
      <ButtonGroup aria-label="Text alignment">
        <ToggleButton size="icon-md" aria-label="Align left" defaultPressed>
          <svg />
        </ToggleButton>
        <IconButton variant="secondary" aria-label="Align centre">
          <svg />
        </IconButton>
        <Button variant="secondary" disabled>
          Publish
        </Button>
        <Button variant="secondary" loading>
          Syncing
        </Button>
      </ButtonGroup>,
    );
    const left = screen.getByRole('button', { name: 'Align left' });
    expect(left).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(left);
    expect(left).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Syncing' })).toHaveAttribute('aria-busy', 'true');
  });

  it('members stay in Tab order, one stop each', () => {
    render(
      <ButtonGroup aria-label="g">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );
    for (const b of screen.getAllByRole('button')) expect(b).not.toHaveAttribute('tabindex');
  });

  it('forwards the ref, merges className last and spreads props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ButtonGroup ref={ref} aria-label="g" className="inline-grid" data-testid="g" />);
    const g = screen.getByTestId('g');
    expect(ref.current).toBe(g);
    expect(g).toHaveClass('inline-grid');
    expect(g).not.toHaveClass('inline-flex');
  });

  it('lets the caller override the role (a toolbar)', () => {
    render(<ButtonGroup role="toolbar" aria-label="Formatting" />);
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toHaveAttribute('data-slot', 'button-group');
  });
});

describe('ButtonGroup · narrow containers (S4 / M-03)', () => {
  it('never wider than its container: scrolls inside itself, members keep their size and snap', () => {
    render(<ButtonGroup aria-label="g" />);
    const cls = screen.getByRole('group').className;
    for (const c of [
      'max-w-full',
      'overflow-x-auto',
      'overflow-y-hidden',
      'snap-x',
      '[&>*]:shrink-0',
      '[&>*]:snap-start',
      '[&>*]:ring-inset',
      // Room for the members' touch hit areas, taken back by a negative margin.
      'pointer-coarse:py-[6px]',
      'pointer-coarse:-my-[6px]',
    ]) {
      expect(cls).toContain(c);
    }
  });

  it('the hover lift goes through `hover:` (hover-capable devices only), not a raw :hover selector', () => {
    render(<ButtonGroup aria-label="g" />);
    const cls = screen.getByRole('group').className;
    expect(cls).toContain('[&>*]:hover:z-raised');
    expect(cls).not.toContain('[&>*:hover]');
  });

  it('carries the edge fade, keyed on the data-overflow marks', () => {
    render(<ButtonGroup aria-label="g" />);
    const cls = screen.getByRole('group').className;
    expect(cls).toContain('data-[overflow]:[mask-image:');
    expect(cls).toContain('data-[overflow-end]:[--ssx-fade-e:24px]');
  });
});
