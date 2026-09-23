'use client';

// Client: Radix Tabs keeps the selected value and attaches the roving-focus
// keyboard handlers.
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { scrollFadeClass } from '../ButtonGroup/ButtonGroup';
import { useScrollEdges } from '../ButtonGroup/use-scroll-edges';

/* ---------------------------------------------------------------------------
 * Tabs
 *
 * Parallel panels of different content in one region, exactly one visible at
 * a time. Use it when the panels are peers and a person will move between
 * them. Do NOT use it for a sequence — steps with an order are a Stepper — and
 * never hide a required form field in a tab someone is about to submit past.
 *
 * The ARIA tabs pattern, from Radix: only the selected tab is in the tab order
 * (`tabindex="0"`); the rest are `-1` and reached with the arrow keys, Home and
 * End. `activationMode="automatic"` (default) selects on focus;
 * `"manual"` moves focus only, and Enter / Space selects — use it when a
 * panel is expensive to render. Inactive panels are unmounted, so their
 * content is out of the accessibility tree rather than merely invisible
 * (`forceMount` on a `TabsContent` keeps one mounted and `hidden`).
 *
 * The one visual variant is the HTML's: an underline list. A long list
 * scrolls horizontally rather than wrapping. The selected tab turns
 * `content-brand` and a 2px `border-brand` bar scales in under it.
 * (A button-group "segmented" look is the SegmentedControl, a different
 * component: it selects a value, it does not switch panels.)
 *
 * Two APIs, same output:
 *   compound  <Tabs defaultValue="overview"><TabsList aria-label="…"><TabsTrigger …
 *   flat      <Tabs listLabel="…" items={[{ value, label, content }]} />
 * ------------------------------------------------------------------------- */

/** `automatic` a tab is selected when it receives focus · `manual` Enter / Space selects. */
export type TabsActivationMode = 'automatic' | 'manual';
/** Which way the list runs; also which arrow keys move between tabs. */
export type TabsOrientation = 'horizontal' | 'vertical';

/** One tab of the flat `items` form. */
export interface TabsItemData {
  /** The tab's id, used by `value` / `defaultValue`. */
  value: string;
  /** The tab label: text, or an icon and text, or text and a count Badge. */
  label: React.ReactNode;
  /** The panel content. */
  content: React.ReactNode;
  /** Shown, but cannot be selected or focused. @default false */
  disabled?: boolean;
}

export type TabsProps = Omit<
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
  'activationMode' | 'orientation' | 'dir'
> & {
  /** Controlled selected tab. */
  value?: string;
  /**
   * Uncontrolled initially selected tab. In the flat form it defaults to the
   * first enabled item.
   */
  defaultValue?: string;
  /** Called with the newly selected tab's value. */
  onValueChange?: (value: string) => void;
  /**
   * `automatic` selects a tab as the arrow keys reach it · `manual` only
   * moves focus, Enter or Space selects.
   *
   * @default 'automatic'
   */
  activationMode?: TabsActivationMode;
  /**
   * `horizontal` Left / Right move between tabs · `vertical` Up / Down, and
   * the list stacks with the bar on its leading edge.
   *
   * @default 'horizontal'
   */
  orientation?: TabsOrientation;
  /**
   * Reading direction, for the arrow keys.
   *
   * @default 'ltr'
   */
  dir?: 'ltr' | 'rtl';
  /** Flat form: render this list and these panels instead of `children`. */
  items?: TabsItemData[];
  /**
   * Flat form: the tab list's accessible name ("Programme details"). Required
   * in practice — a tablist with no name is announced as just "tab list".
   */
  listLabel?: string;
};

export const Tabs = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, TabsProps>(
  function Tabs(
    {
      className,
      activationMode = 'automatic',
      orientation = 'horizontal',
      defaultValue,
      items,
      listLabel,
      children,
      ...props
    },
    ref,
  ) {
    const firstEnabled = items?.find((item) => !item.disabled)?.value;
    return (
      <TabsPrimitive.Root
        ref={ref}
        data-slot="tabs"
        activationMode={activationMode}
        orientation={orientation}
        defaultValue={defaultValue ?? (props.value === undefined ? firstEnabled : undefined)}
        className={cn(
          'font-sans',
          'data-[orientation=vertical]:flex data-[orientation=vertical]:gap-6',
          className,
        )}
        {...props}
      >
        {items ? (
          <>
            <TabsList aria-label={listLabel}>
              {items.map((item) => (
                <TabsTrigger key={item.value} value={item.value} disabled={item.disabled}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {items.map((item) => (
              <TabsContent key={item.value} value={item.value}>
                {item.content}
              </TabsContent>
            ))}
          </>
        ) : (
          children
        )}
      </TabsPrimitive.Root>
    );
  },
);
Tabs.displayName = 'Tabs';

/* ---- TabsList ------------------------------------------------------------- */

export type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>;

/**
 * The row of tabs. Give it an `aria-label`. Scrolls horizontally when it
 * overflows, and fades the edge that hides tabs (only the side that does), so
 * a phone user can see there is more.
 */
export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(function TabsList({ className, ...props }, forwardedRef) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const ref = useComposedRefs(forwardedRef, listRef);
  // A vertical list never overflows sideways, so it is never marked.
  useScrollEdges(listRef);
  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      className={cn(
        'flex gap-1 overflow-x-auto overscroll-x-contain border-b border-border-decorative',
        scrollFadeClass,
        'data-[orientation=vertical]:shrink-0 data-[orientation=vertical]:flex-col',
        'data-[orientation=vertical]:overflow-visible data-[orientation=vertical]:border-b-0',
        'data-[orientation=vertical]:border-l',
        className,
      )}
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';

/* ---- TabsTrigger ---------------------------------------------------------- */

export type TabsTriggerProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;

/**
 * One tab. Children are the label: text, an icon + text (the icon is sized
 * for you), or text + a count `Badge`.
 */
export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      className={cn(
        'relative m-0 inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap',
        'border-0 bg-transparent px-4 py-3',
        'font-sans text-base leading-body font-semibold text-content-secondary',
        'transition-colors duration-[var(--motion-duration-instant)] ease-[var(--motion-easing-productive-in-out)]',
        'hover:text-content data-[state=active]:text-content-brand',
        // The bar: 2px, brand, inset 12px from each side, scaling in from the
        // centre. It sits on the list's 1px rule (bottom: -1px).
        "after:pointer-events-none after:absolute after:inset-x-3 after:-bottom-px after:h-(--border-thick) after:content-['']",
        'after:origin-center after:scale-x-0 after:rounded-t-full after:bg-border-brand',
        'after:transition-transform after:duration-[var(--motion-duration-normal)] after:ease-[var(--motion-easing-productive-in-out)]',
        'data-[state=active]:after:scale-x-100',
        // Vertical: the bar moves to the leading edge and scales vertically.
        'data-[orientation=vertical]:justify-start',
        'data-[orientation=vertical]:after:inset-x-auto data-[orientation=vertical]:after:inset-y-2',
        'data-[orientation=vertical]:after:-left-px',
        'data-[orientation=vertical]:after:h-auto data-[orientation=vertical]:after:w-(--border-thick)',
        'data-[orientation=vertical]:after:scale-x-100 data-[orientation=vertical]:after:scale-y-0',
        'data-[orientation=vertical]:after:rounded-t-none data-[orientation=vertical]:after:rounded-r-full',
        'data-[orientation=vertical]:data-[state=active]:after:scale-y-100',
        // Inset ring: the list scrolls (overflow-x: auto), which would clip an
        // outside ring.
        'rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-border-focus/50 focus-visible:ring-inset',
        'disabled:cursor-not-allowed disabled:text-content-disabled',
        'motion-reduce:transition-none motion-reduce:after:transition-none',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-sm",
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = 'TabsTrigger';

/* ---- TabsContent ---------------------------------------------------------- */

export type TabsContentProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

/** One panel, labelled by its tab. Focusable (`tabindex="0"`), as the pattern requires. */
export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      data-slot="tabs-content"
      className={cn(
        'pt-6 outline-none data-[orientation=vertical]:min-w-0 data-[orientation=vertical]:flex-1 data-[orientation=vertical]:pt-0',
        'rounded-sm focus-visible:ring-[3px] focus-visible:ring-border-focus/50',
        'data-[state=inactive]:hidden',
        className,
      )}
      {...props}
    />
  );
});
TabsContent.displayName = 'TabsContent';
