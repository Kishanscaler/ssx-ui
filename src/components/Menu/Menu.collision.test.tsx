import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { Menu, MenuContent, MenuItem, MenuTrigger } from './Menu';

/**
 * Radix hands `collisionPadding` to floating-ui, so it never reaches the DOM.
 * The Content primitive is wrapped to record the props MenuContent gives it.
 */
const seen: Array<Record<string, unknown>> = [];
vi.mock('@radix-ui/react-dropdown-menu', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/react-dropdown-menu')>();
  const Content = React.forwardRef<HTMLDivElement, Record<string, unknown>>(function Content(props, ref) {
    seen.push(props);
    return React.createElement(actual.Content as React.ElementType, { ...props, ref });
  });
  return { ...actual, Content };
});


function Open(props: Partial<React.ComponentProps<typeof MenuContent>>) {
  return (
    <Menu defaultOpen>
      <MenuTrigger>Cohort actions</MenuTrigger>
      <MenuContent {...props}>
        <MenuItem>Export CSV</MenuItem>
      </MenuContent>
    </Menu>
  );
}

describe('MenuContent · edge padding (M-15)', () => {
  it('keeps 8px from the viewport edge, like Popover, Select and Tooltip', () => {
    seen.length = 0;
    render(<Open />);
    expect(seen[seen.length - 1]?.collisionPadding).toBe(8);
  });

  it('a caller can still set its own', () => {
    seen.length = 0;
    render(<Open collisionPadding={16} />);
    expect(seen[seen.length - 1]?.collisionPadding).toBe(16);
  });
});
