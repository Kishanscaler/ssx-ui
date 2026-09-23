import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';

import { Code, CodeBlock, CodeBlockGroup, CodeBlockHeader, CodeToken } from './Code';
import { CopyButton } from './CopyButton';

describe('Code', () => {
  it('is an inline <code> with tone on the hook', () => {
    render(<Code>applicant_id</Code>);
    const c = screen.getByText('applicant_id');
    expect(c.tagName).toBe('CODE');
    expect(c).toHaveAttribute('data-slot', 'code');
    expect(c).toHaveAttribute('data-tone', 'default');
    expect(c).toHaveClass('font-mono', 'bg-surface-sunken');
  });

  it.each([
    ['danger', 'bg-danger-surface'],
    ['success', 'bg-success-surface'],
  ] as const)('tone %s', (tone, cls) => {
    render(<Code tone={tone}>solution.py</Code>);
    expect(screen.getByText('solution.py')).toHaveClass(cls);
  });

  it('forwards the ref and merges className last', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Code ref={ref} className="text-xs">
        x
      </Code>,
    );
    expect(ref.current).toBe(screen.getByText('x'));
    expect(ref.current).toHaveClass('text-xs');
    expect(ref.current).not.toHaveClass('text-sm');
  });
});

describe('CodeBlock', () => {
  it('is pre > code on the code surface', () => {
    const { container } = render(<CodeBlock>{'def bfs(): pass'}</CodeBlock>);
    const pre = container.firstChild as HTMLElement;
    expect(pre.tagName).toBe('PRE');
    expect(pre).toHaveAttribute('data-slot', 'code-block');
    expect(pre).toHaveClass('bg-surface-code', 'text-content-code');
    expect(pre.firstChild).toHaveAttribute('data-slot', 'code-block-code');
    expect((pre.firstChild as HTMLElement).tagName).toBe('CODE');
  });

  it('joins a header above it inside a group', () => {
    const { container } = render(
      <CodeBlockGroup>
        <CodeBlockHeader>
          <span>bfs.py</span>
        </CodeBlockHeader>
        <CodeBlock>x</CodeBlock>
      </CodeBlockGroup>,
    );
    const group = container.firstChild as HTMLElement;
    expect(group).toHaveAttribute('data-slot', 'code-block-group');
    expect(group.children[0]).toHaveAttribute('data-slot', 'code-block-header');
    expect(group.children[1]).toHaveClass('[[data-slot=code-block-header]+&]:rounded-t-none');
  });

  it('CodeToken maps a syntax role to its ink', () => {
    render(
      <CodeBlock>
        <CodeToken kind="comment"># shortest path</CodeToken>
      </CodeBlock>,
    );
    const t = screen.getByText('# shortest path');
    expect(t).toHaveAttribute('data-kind', 'comment');
    expect(t).toHaveClass('text-code-comment', 'italic');
  });

  it('forwards refs', () => {
    const pre = React.createRef<HTMLPreElement>();
    const head = React.createRef<HTMLDivElement>();
    render(
      <>
        <CodeBlockHeader ref={head}>h</CodeBlockHeader>
        <CodeBlock ref={pre}>x</CodeBlock>
      </>,
    );
    expect(pre.current?.tagName).toBe('PRE');
    expect(head.current).toHaveAttribute('data-slot', 'code-block-header');
  });
});

describe('CopyButton', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else delete (navigator as unknown as Record<string, unknown>).clipboard;
    vi.useRealTimers();
  });

  it('is a small neutral icon button with a default name', () => {
    render(<CopyButton value="x" />);
    const b = screen.getByRole('button', { name: 'Copy to clipboard' });
    expect(b).toHaveAttribute('data-variant', 'neutral');
    expect(b).toHaveAttribute('data-size', 'icon-sm');
  });

  it('copies the value and announces it', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<CopyButton value="print('hi')" aria-label="Copy streaks.py to the clipboard" />);
    const button = screen.getByRole('button', { name: 'Copy streaks.py to the clipboard' });
    await act(async () => {
      button.click();
    });
    expect(writeText).toHaveBeenCalledWith("print('hi')");
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    expect(button).toHaveAttribute('data-copied');
  });

  it('forwards the ref', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<CopyButton ref={ref} value="x" />);
    expect(ref.current).toBe(screen.getByRole('button'));
  });
});

describe('CodeBlock on narrow screens and for the keyboard', () => {
  it('is a tab stop, so a keyboard can scroll it; a region only when named', () => {
    const { rerender } = render(<CodeBlock>{'x'}</CodeBlock>);
    const pre = () => document.querySelector('[data-slot=code-block]') as HTMLElement;
    expect(pre()).toHaveAttribute('tabindex', '0');
    expect(pre()).not.toHaveAttribute('role');
    rerender(<CodeBlock aria-label="bfs.py">{'x'}</CodeBlock>);
    expect(screen.getByRole('region', { name: 'bfs.py' })).toBe(pre());
    rerender(<CodeBlock tabIndex={-1}>{'x'}</CodeBlock>);
    expect(pre()).toHaveAttribute('tabindex', '-1');
  });

  it('keeps a group at its container width (a 0 minimum track) and lets a header path break', () => {
    render(
      <CodeBlockGroup>
        <CodeBlockHeader>apps/faculty-portal/src/roster/overloaded.ts</CodeBlockHeader>
        <CodeBlock>{'x'}</CodeBlock>
      </CodeBlockGroup>,
    );
    expect((document.querySelector('[data-slot=code-block-group]') as HTMLElement).className).toContain(
      'grid-cols-[minmax(0,1fr)]',
    );
    expect((document.querySelector('[data-slot=code-block-header]') as HTMLElement).className).toContain(
      '[&>:first-child]:[overflow-wrap:anywhere]',
    );
  });
});
