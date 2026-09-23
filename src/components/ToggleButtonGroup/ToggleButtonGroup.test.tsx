import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ToggleButtonGroup, ToggleButtonGroupItem } from './ToggleButtonGroup';

const Glyph = ({ name }: { name: string }) => <svg data-testid={name} aria-hidden="true" />;

function Filters(props: Partial<React.ComponentProps<typeof ToggleButtonGroup>>) {
  return (
    <ToggleButtonGroup aria-label="Filter coursework by type" defaultValue={['assignment', 'quiz']} {...(props as object)}>
      <ToggleButtonGroupItem value="assignment">Assignment</ToggleButtonGroupItem>
      <ToggleButtonGroupItem value="quiz">Quiz</ToggleButtonGroupItem>
      <ToggleButtonGroupItem value="project">Project</ToggleButtonGroupItem>
      <ToggleButtonGroupItem value="live" disabled>
        Live class
      </ToggleButtonGroupItem>
    </ToggleButtonGroup>
  );
}

const btn = (name: string) => screen.getByRole('button', { name });

describe('ToggleButtonGroup · multiple', () => {
  it('is a named toolbar of aria-pressed buttons with slot / variant hooks', () => {
    render(<Filters />);
    const group = screen.getByRole('toolbar', { name: 'Filter coursework by type' });
    expect(group).toHaveAttribute('data-slot', 'toggle-button-group');
    expect(group).toHaveAttribute('data-variant', 'welded');
    expect(group).toHaveAttribute('data-size', 'md');
    expect(group).toHaveAttribute('data-type', 'multiple');
    expect(btn('Assignment')).toHaveAttribute('aria-pressed', 'true');
    expect(btn('Quiz')).toHaveAttribute('aria-pressed', 'true');
    expect(btn('Project')).toHaveAttribute('aria-pressed', 'false');
    expect(btn('Project')).toHaveAttribute('data-slot', 'toggle-button-group-item');
  });

  it('toggles members independently and reports the whole set', () => {
    const onValueChange = vi.fn();
    render(<Filters onValueChange={onValueChange} />);
    fireEvent.click(btn('Project'));
    expect(onValueChange).toHaveBeenLastCalledWith(['assignment', 'quiz', 'project']);
    fireEvent.click(btn('Assignment'));
    expect(onValueChange).toHaveBeenLastCalledWith(['quiz', 'project']);
    expect(btn('Assignment')).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(btn('Quiz'));
    fireEvent.click(btn('Project'));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it('a disabled member cannot be toggled', () => {
    render(<Filters />);
    expect(btn('Live class')).toBeDisabled();
    fireEvent.click(btn('Live class'));
    expect(btn('Live class')).toHaveAttribute('aria-pressed', 'false');
  });

  it('one tab stop; arrow keys move focus (not the state), skipping disabled', async () => {
    render(<Filters />);
    act(() => btn('Assignment').focus());
    fireEvent.keyDown(btn('Assignment'), { key: 'ArrowRight' });
    await waitFor(() => expect(btn('Quiz')).toHaveFocus());
    fireEvent.keyDown(btn('Quiz'), { key: 'ArrowRight' });
    await waitFor(() => expect(btn('Project')).toHaveFocus());
    fireEvent.keyDown(btn('Project'), { key: 'ArrowRight' });
    await waitFor(() => expect(btn('Assignment')).toHaveFocus());
    expect(btn('Project')).toHaveAttribute('aria-pressed', 'false');
  });

  it('controlled: follows `value`', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Filters value={[]} onValueChange={onValueChange} />);
    fireEvent.click(btn('Quiz'));
    expect(onValueChange).toHaveBeenCalledWith(['quiz']);
    expect(btn('Quiz')).toHaveAttribute('aria-pressed', 'false');
    rerender(<Filters value={['quiz']} onValueChange={onValueChange} />);
    expect(btn('Quiz')).toHaveAttribute('aria-pressed', 'true');
  });

  it('swaps icon → pressedIcon per member', () => {
    render(
      <ToggleButtonGroup aria-label="Pins">
        <ToggleButtonGroupItem value="a" icon={<Glyph name="regular" />} pressedIcon={<Glyph name="fill" />}>
          Pin
        </ToggleButtonGroupItem>
      </ToggleButtonGroup>,
    );
    expect(screen.getByTestId('regular')).toBeInTheDocument();
    fireEvent.click(btn('Pin'));
    expect(screen.getByTestId('fill')).toBeInTheDocument();
    expect(screen.queryByTestId('regular')).toBeNull();
  });
});

describe('ToggleButtonGroup · single', () => {
  function Grade(props: Partial<React.ComponentProps<typeof ToggleButtonGroupItem>> & { onValueChange?: (v: string) => void; value?: string }) {
    return (
      <ToggleButtonGroup type="single" aria-label="Grade view" defaultValue="letter" onValueChange={props.onValueChange} value={props.value}>
        <ToggleButtonGroupItem value="percent">Percent</ToggleButtonGroupItem>
        <ToggleButtonGroupItem value="letter">Letter grade</ToggleButtonGroupItem>
        <ToggleButtonGroupItem value="percentile">Percentile</ToggleButtonGroupItem>
      </ToggleButtonGroup>
    );
  }
  const radio = (name: string) => screen.getByRole('radio', { name });

  it('is a radiogroup; one pressed at a time', () => {
    const onValueChange = vi.fn();
    render(<Grade onValueChange={onValueChange} />);
    expect(screen.getByRole('radiogroup', { name: 'Grade view' })).toHaveAttribute('data-type', 'single');
    expect(radio('Letter grade')).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(radio('Percent'));
    expect(radio('Percent')).toHaveAttribute('aria-checked', 'true');
    expect(radio('Letter grade')).toHaveAttribute('aria-checked', 'false');
    expect(onValueChange).toHaveBeenLastCalledWith('percent');
  });

  it('pressing the pressed member releases it (zero or one)', () => {
    const onValueChange = vi.fn();
    render(<Grade onValueChange={onValueChange} />);
    fireEvent.click(radio('Letter grade'));
    expect(onValueChange).toHaveBeenLastCalledWith('');
    screen.getAllByRole('radio').forEach((r) => expect(r).toHaveAttribute('aria-checked', 'false'));
  });
});

describe('ToggleButtonGroup · looks and plumbing', () => {
  it('welded reuses ButtonGroup + ToggleButton recipes; chips reuses Chip', () => {
    const { rerender } = render(<Filters size="sm" />);
    expect(screen.getByRole('toolbar')).toHaveClass('isolate', '[&>*]:rounded-none');
    expect(btn('Quiz')).toHaveClass('data-[state=on]:bg-surface-brand-solid');
    // Button's size recipe (`h-` or `min-h-control-sm`, whichever Button uses).
    expect(btn('Quiz').className).toMatch(/\bh-control-sm\b|min-h-control-sm/);
    rerender(<Filters variant="chips" />);
    expect(screen.getByRole('toolbar')).toHaveAttribute('data-variant', 'chips');
    expect(screen.getByRole('toolbar')).toHaveClass('flex-wrap', 'gap-2');
    expect(btn('Quiz')).toHaveClass('rounded-full', 'h-7');
  });

  it('forwards refs, merges className last, spreads props on the root', () => {
    const ref = React.createRef<HTMLDivElement>();
    const itemRef = React.createRef<HTMLButtonElement>();
    render(
      <ToggleButtonGroup ref={ref} aria-label="x" className="custom" data-blok-uid="7">
        <ToggleButtonGroupItem ref={itemRef} value="a" className="px-8">
          A
        </ToggleButtonGroupItem>
      </ToggleButtonGroup>,
    );
    expect(ref.current).toBe(screen.getByRole('toolbar'));
    expect(ref.current).toHaveClass('custom');
    expect(ref.current).toHaveAttribute('data-blok-uid', '7');
    expect(itemRef.current).toBe(btn('A'));
    expect(itemRef.current).toHaveClass('px-8');
    expect(itemRef.current).not.toHaveClass('px-4');
  });
});

describe('ToggleButtonGroup · narrow containers (M-04)', () => {
  /** Pretends every toggle-button-group is 600px of content in a 300px box. */
  function overflowing() {
    const sw = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.dataset.slot === 'toggle-button-group' ? 600 : 0;
    });
    const cw = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.dataset.slot === 'toggle-button-group' ? 300 : 0;
    });
    return () => {
      sw.mockRestore();
      cw.mockRestore();
    };
  }

  it('welded: scrolls inside itself (the ButtonGroup recipe) and marks the hidden edge for the fade', () => {
    const restore = overflowing();
    try {
      render(<Filters />);
      const group = screen.getByRole('toolbar');
      expect(group).toHaveClass('overflow-x-auto', 'max-w-full');
      expect(group).toHaveAttribute('data-overflow');
      expect(group).toHaveAttribute('data-overflow-end');
      expect(group).not.toHaveAttribute('data-overflow-start');
    } finally {
      restore();
    }
  });

  it('chips: wraps instead, and is never measured', () => {
    const restore = overflowing();
    try {
      render(<Filters variant="chips" />);
      const group = screen.getByRole('toolbar');
      expect(group).toHaveClass('flex-wrap');
      expect(group).not.toHaveAttribute('data-overflow');
    } finally {
      restore();
    }
  });
});
