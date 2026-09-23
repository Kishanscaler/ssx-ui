'use client';

// Client: Radix Collapsible keeps the open state and wires the disclosure
// button. The links inside stay whatever the caller rendered (server markup).
import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

import { cn } from '../../lib/cn';
import { sideNavGroupLabelClass } from './sideNavGroupLabel';

/* ---------------------------------------------------------------------------
 * SideNavCollapsibleGroup (internal)
 *
 * `SideNavGroup collapsible`: the heading is a disclosure button (full width,
 * caret at the end, `aria-expanded` + `aria-controls`), and the links fold
 * under it with the accordion's height motion. The region stays a
 * `role="group"` named by the heading text.
 * ------------------------------------------------------------------------- */

/** Phosphor 2.1.1 `caret-down` bold (MIT), 16px beside a 12px heading. */
function CaretGlyph() {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn(
        'ms-auto size-icon-sm shrink-0',
        'transition-transform duration-[var(--motion-duration-normal)] ease-productive-in-out motion-reduce:transition-none',
        'group-data-[state=closed]/sidenav-group:-rotate-90',
      )}
    >
      <path d="M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z" />
    </svg>
  );
}

export type SideNavCollapsibleGroupProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  label: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  /** `onOpenChange`, under a name the server SideNavGroup can pass without an `on*` key. */
  openChangeHandler?: (open: boolean) => void;
};

export const SideNavCollapsibleGroup = React.forwardRef<HTMLDivElement, SideNavCollapsibleGroupProps>(
  function SideNavCollapsibleGroup(
    { className, label, defaultOpen = true, open, openChangeHandler, children, ...props },
    ref,
  ) {
    return (
      <CollapsiblePrimitive.Root
        ref={ref}
        data-slot="sidenav-group"
        data-collapsible=""
        defaultOpen={defaultOpen}
        open={open}
        onOpenChange={openChangeHandler}
        className={cn('group/sidenav-group grid', className)}
        {...props}
      >
        <CollapsiblePrimitive.Trigger
          data-slot="sidenav-group-trigger"
          className={cn(
            sideNavGroupLabelClass,
            'flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent text-start',
            'transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',
            'hover:text-content',
            'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus',
          )}
        >
          <span data-slot="sidenav-group-label">{label}</span>
          <CaretGlyph />
        </CollapsiblePrimitive.Trigger>
        <CollapsiblePrimitive.Content
          data-slot="sidenav-group-content"
          role="group"
          aria-label={typeof label === 'string' ? label : undefined}
          className={cn(
            'grid gap-0.5 overflow-hidden',
            // The focus outline of an item sits 2px outside it; keep it visible.
            'p-0.5 -m-0.5',
            'data-[state=open]:animate-ssx-sidenav-group-down data-[state=closed]:animate-ssx-sidenav-group-up',
            'motion-reduce:animate-none',
          )}
        >
          {children}
        </CollapsiblePrimitive.Content>
      </CollapsiblePrimitive.Root>
    );
  },
);
SideNavCollapsibleGroup.displayName = 'SideNavCollapsibleGroup';
