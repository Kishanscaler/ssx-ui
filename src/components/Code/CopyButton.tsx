'use client';

// Client: writes to the clipboard on click and keeps a "copied" state.
import * as React from 'react';

import { cn } from '../../lib/cn';
import { IconButton, type IconButtonProps } from '../IconButton';

/* ---------------------------------------------------------------------------
 * CopyButton
 *
 * The copy affordance in a `CodeBlockHeader`: a neutral, small IconButton.
 * It is a separate client leaf so Code / CodeBlock stay server atoms.
 *
 * After a copy the glyph turns to a check for two seconds and a polite live
 * region says "Copied", so the result is announced, not just drawn.
 *
 * On the code header (dark in both themes) the neutral ink is re-pointed at
 * the code-head roles: `--content-secondary` and the header fill are the same
 * grey in light mode, and a plain neutral button there was invisible.
 * ------------------------------------------------------------------------- */

/* Phosphor 2.1.1 `copy` and `check`, bold (MIT). Inline: no icon dependency. */
const COPY =
  'M216,28H88A12,12,0,0,0,76,40V76H40A12,12,0,0,0,28,88V216a12,12,0,0,0,12,12H168a12,12,0,0,0,12-12V180h36a12,12,0,0,0,12-12V40A12,12,0,0,0,216,28ZM156,204H52V100H156Zm48-48H180V88a12,12,0,0,0-12-12H100V52H204Z';
const CHECK =
  'M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z';

const RESET_MS = 2000;

async function writeClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext !== false) {
    return navigator.clipboard.writeText(text);
  }
  // Insecure context (plain http) or an old browser: the legacy path.
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try {
    if (!document.execCommand('copy')) throw new Error('copy failed');
  } finally {
    document.body.removeChild(area);
  }
}

export type CopyButtonProps = Omit<IconButtonProps, 'children' | 'aria-label' | 'value'> & {
  /** The text written to the clipboard. */
  value: string;
  /**
   * The accessible name. Say WHAT is copied ("Copy streaks.py to the
   * clipboard").
   *
   * @default 'Copy to clipboard'
   */
  'aria-label'?: string;
  /**
   * Announced (politely) after a successful copy.
   *
   * @default 'Copied'
   */
  copiedLabel?: string;
};

export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton(
  {
    value,
    className,
    onClick,
    variant = 'neutral',
    size = 'sm',
    'aria-label': ariaLabel = 'Copy to clipboard',
    copiedLabel = 'Copied',
    ...props
  },
  ref,
) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(event);
    if (event.defaultPrevented) return;
    writeClipboard(value).then(
      () => {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), RESET_MS);
      },
      () => setCopied(false),
    );
  };

  return (
    <>
      <IconButton
        ref={ref}
        data-copied={copied || undefined}
        variant={variant}
        size={size}
        aria-label={ariaLabel}
        onClick={handleClick}
        className={cn(
          '[[data-slot=code-block-header]_&]:text-content-code-head',
          '[[data-slot=code-block-header]_&]:enabled:hover:bg-surface-code [[data-slot=code-block-header]_&]:enabled:hover:text-content-code',
          '[[data-slot=code-block-header]_&]:enabled:active:bg-surface-code [[data-slot=code-block-header]_&]:enabled:active:text-content-code',
          className,
        )}
        {...props}
      >
        <svg viewBox="0 0 256 256" aria-hidden="true" focusable="false" className="fill-current">
          <path d={copied ? CHECK : COPY} />
        </svg>
      </IconButton>
      <span role="status" data-slot="copy-button-status" className="sr-only">
        {copied ? copiedLabel : ''}
      </span>
    </>
  );
});
CopyButton.displayName = 'CopyButton';
