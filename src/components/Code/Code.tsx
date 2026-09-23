import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Code, CodeBlock, CodeBlockHeader, CodeBlockGroup, CodeToken
 *
 * A literal identifier, value or snippet the user might copy. `Code` sits
 * inside a sentence; `CodeBlock` takes a whole snippet. Neither is for
 * emphasis. Both are JetBrains Mono (`--font-family-mono`): a proportional
 * face makes `SST-2029-0416` and `SST-2029-O416` look alike.
 *
 * Inline code stays on the light sunken fill ON PURPOSE: inside a sentence a
 * dark block reads as a redaction. Only the block moves to the code surface,
 * which is dark in BOTH themes (so a snippet is never the grey of a disabled
 * input, and never needs re-highlighting for a light page).
 *
 * With a filename bar, wrap the two in a `CodeBlockGroup`: the header and the
 * block are one object, and a parent's flex gap must not push them apart.
 *
 *   <CodeBlockGroup>
 *     <CodeBlockHeader>
 *       <span>streaks.py</span>
 *       <CopyButton value={source} aria-label="Copy streaks.py to the clipboard" />
 *     </CodeBlockHeader>
 *     <CodeBlock>{source}</CodeBlock>
 *   </CodeBlockGroup>
 *
 * The block does NOT highlight. It takes pre-tokenised children: wrap tokens
 * in `CodeToken` (or map a highlighter's output — e.g. shiki in a Server
 * Component — onto it). The syntax inks are solved against the code surface,
 * not the page.
 *
 * Server atoms: no hooks, no handlers. `CopyButton` is the client leaf.
 * ------------------------------------------------------------------------- */

/* ---- Code (inline) ---------------------------------------------------------- */

export const codeVariants = cva(
  'rounded-sm px-1.5 py-0.5 font-mono text-sm [overflow-wrap:anywhere]',
  {
    variants: {
      tone: {
        default: 'bg-surface-sunken text-content',
        // A failing / passing identifier in a sentence ("solution.py exceeded").
        danger: 'bg-danger-surface text-danger-content',
        success: 'bg-success-surface text-success-content',
      },
    },
    defaultVariants: { tone: 'default' },
  },
);

export type CodeTone = NonNullable<VariantProps<typeof codeVariants>['tone']>;

export type CodeProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * `danger` / `success` for an identifier whose state the sentence reports.
   *
   * @default 'default'
   */
  tone?: CodeTone;
};

export const Code = React.forwardRef<HTMLElement, CodeProps>(function Code(
  { className, tone = 'default', ...props },
  ref,
) {
  return (
    <code
      ref={ref}
      data-slot="code"
      data-tone={tone}
      className={cn(codeVariants({ tone }), className)}
      {...props}
    />
  );
});
Code.displayName = 'Code';

/* ---- CodeBlock -------------------------------------------------------------- */

/**
 * A `<pre>`. Long lines scroll sideways inside it (they never wrap: wrapped
 * code reads as a different program), so it is always in the tab order
 * (`tabIndex={0}`) — the only way a keyboard user can scroll a region that
 * holds nothing focusable (WCAG 2.1.1; axe `scrollable-region-focusable`).
 * Pass `tabIndex={-1}` for a short snippet you know never overflows.
 *
 * Give it an `aria-label` ("bfs.py") or `aria-labelledby` (the header's
 * id) and it also becomes a named `role="region"`, so the focus stop is
 * announced by name rather than read out line by line. Without a name it gets
 * no role: an unnamed region is noise in a landmark list.
 */
export type CodeBlockProps = React.HTMLAttributes<HTMLPreElement>;

export const CodeBlock = React.forwardRef<HTMLPreElement, CodeBlockProps>(function CodeBlock(
  { className, children, tabIndex = 0, role, ...props },
  ref,
) {
  const named = props['aria-label'] != null || props['aria-labelledby'] != null;
  return (
    <pre
      ref={ref}
      data-slot="code-block"
      tabIndex={tabIndex}
      role={role ?? (named ? 'region' : undefined)}
      className={cn(
        'm-0 max-w-full overflow-x-auto rounded-lg border border-surface-code-head bg-surface-code p-4',
        'font-mono text-sm leading-(--font-leading-code) text-content-code',
        // Directly under a header, the two are one object.
        '[[data-slot=code-block-header]+&]:rounded-t-none [[data-slot=code-block-header]+&]:border-t-0',
        className,
      )}
      {...props}
    >
      <code data-slot="code-block-code">{children}</code>
    </pre>
  );
});
CodeBlock.displayName = 'CodeBlock';

/* ---- CodeBlockHeader -------------------------------------------------------- */

export type CodeBlockHeaderProps = React.HTMLAttributes<HTMLDivElement>;

/** The filename bar: a filename on the left, a meta line or a CopyButton on the right. */
export const CodeBlockHeader = React.forwardRef<HTMLDivElement, CodeBlockHeaderProps>(
  function CodeBlockHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="code-block-header"
        className={cn(
          'flex items-center justify-between gap-3 px-4 py-2',
          // On a phone a long path breaks (anywhere: a path has no spaces)
          // rather than pushing the copy button off screen; the meta line
          // after it wraps at its spaces only.
          '[&>:first-child]:min-w-0 [&>:first-child]:[overflow-wrap:anywhere]',
          'rounded-t-lg border border-b-0 border-surface-code-head bg-surface-code-head',
          'font-mono text-xs text-content-code-head',
          className,
        )}
        {...props}
      />
    );
  },
);
CodeBlockHeader.displayName = 'CodeBlockHeader';

/* ---- CodeBlockGroup --------------------------------------------------------- */

export type CodeBlockGroupProps = React.HTMLAttributes<HTMLDivElement>;

/** Holds a header and its block together, whatever gap the parent has. */
export const CodeBlockGroup = React.forwardRef<HTMLDivElement, CodeBlockGroupProps>(
  function CodeBlockGroup({ className, ...props }, ref) {
    // `minmax(0,1fr)`, not the implicit `auto` track: an auto track sizes to
    // the longest code line and pushes the page wide (A3); a 0 minimum keeps
    // the group at its container's width and lets the block scroll inside.
    return (
      <div
        ref={ref}
        data-slot="code-block-group"
        className={cn('grid min-w-0 grid-cols-[minmax(0,1fr)]', className)}
        {...props}
      />
    );
  },
);
CodeBlockGroup.displayName = 'CodeBlockGroup';

/* ---- CodeToken -------------------------------------------------------------- */

export const codeTokenVariants = cva('', {
  variants: {
    kind: {
      keyword: 'font-semibold text-code-keyword',
      string: 'text-code-string',
      number: 'text-code-number',
      comment: 'text-code-comment italic',
      function: 'text-code-function',
    },
  },
  defaultVariants: { kind: 'keyword' },
});

export type CodeTokenKind = NonNullable<VariantProps<typeof codeTokenVariants>['kind']>;

export type CodeTokenProps = React.HTMLAttributes<HTMLSpanElement> & {
  /**
   * The syntax role. Only inside a `CodeBlock`: the inks are solved against
   * the dark code surface.
   *
   * @default 'keyword'
   */
  kind?: CodeTokenKind;
};

export const CodeToken = React.forwardRef<HTMLSpanElement, CodeTokenProps>(function CodeToken(
  { className, kind = 'keyword', ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      data-slot="code-token"
      data-kind={kind}
      className={cn(codeTokenVariants({ kind }), className)}
      {...props}
    />
  );
});
CodeToken.displayName = 'CodeToken';
