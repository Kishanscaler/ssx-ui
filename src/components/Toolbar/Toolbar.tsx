'use client';

// Client: roving tabindex across the controls (a layout effect and a key
// handler), and ToolbarToggle is Radix Toggle.
import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { buttonVariants } from '../Button';
import { Divider } from '../Divider';
import { toggleButtonVariants } from '../ToggleButton';

/* ---------------------------------------------------------------------------
 * Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarSpacer, ToolbarToggle
 *
 * A grouped strip of controls that act on the content directly beside it:
 * formatting, view mode, overflow. `role="toolbar"` with a label, so it is
 * announced as one thing. Not for navigation between pages.
 *
 *   <Toolbar aria-label="Lecture note formatting">
 *     <ToolbarGroup aria-label="Text style">
 *       <ToolbarToggle aria-label="Bold" defaultPressed><TextB weight="bold" /></ToolbarToggle>
 *       <ToolbarToggle aria-label="Italic"><TextItalic weight="bold" /></ToolbarToggle>
 *     </ToolbarGroup>
 *     <ToolbarSeparator />
 *     <IconButton variant="tertiary" size="sm" aria-label="Insert an image"><Image weight="bold" /></IconButton>
 *     <ToolbarSeparator />
 *     <SegmentedControl aria-label="Note view" defaultValue="write">…</SegmentedControl>
 *     <ToolbarSpacer />
 *     <Menu>
 *       <MenuTrigger asChild>
 *         <IconButton variant="tertiary" size="sm" aria-label="More note actions"><DotsThree weight="bold" /></IconButton>
 *       </MenuTrigger>
 *       <MenuContent align="end">…</MenuContent>
 *     </Menu>
 *   </Toolbar>
 *
 * Put ANY of the system's controls in it (IconButton, Button, SearchInput,
 * SegmentedControl, a Menu trigger); the toolbar does not restyle them.
 *
 * Keyboard (APG toolbar): the toolbar is ONE tab stop. ← / → (↑ / ↓ when
 * vertical) move between controls, Home / End jump to the ends, and Tab
 * leaves. The last control used stays the entry point. Disabled controls are
 * skipped. Two exceptions keep their own keys:
 *   - a text field (SearchInput): ← / → / Home / End move the caret;
 *   - a composite widget (SegmentedControl's radio group, a tab list) is one
 *     stop, entered on its current item, and keeps its own arrow keys; Tab
 *     moves on from it.
 *
 * Overflow is a Menu at the trailing end, as in the HTML; the toolbar wraps
 * rather than hiding controls when space runs out.
 * ------------------------------------------------------------------------- */

/** `horizontal` a row (← / →) · `vertical` a column (↑ / ↓). */
export type ToolbarOrientation = 'horizontal' | 'vertical';

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex], [contenteditable="true"], [contenteditable=""]';
const COMPOSITE = '[role="radiogroup"], [role="tablist"], [role="listbox"], [role="menubar"], [role="grid"], [role="tree"]';
const TEXT_FIELD = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"], [contenteditable=""]';

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

type Stop = { el: HTMLElement; composite: HTMLElement | null };

/** The toolbar's stops, in order. A composite widget counts once, as the member it makes tabbable. */
function stopsOf(root: HTMLElement): Stop[] {
  const stops: Stop[] = [];
  const seen = new Set<HTMLElement>();
  root.querySelectorAll<HTMLElement>(FOCUSABLE).forEach((el) => {
    if ((el as HTMLButtonElement).disabled || el.closest('[hidden], [inert], [aria-hidden="true"]')) return;
    if (el instanceof HTMLInputElement && el.type === 'hidden') return;
    const composite = el.parentElement?.closest<HTMLElement>(COMPOSITE) ?? null;
    if (composite && root.contains(composite)) {
      if (seen.has(composite)) return;
      const members = Array.from(composite.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (m) => !(m as HTMLButtonElement).disabled,
      );
      const rep = members.find((m) => m.tabIndex >= 0) ?? members[0];
      if (!rep) return;
      seen.add(composite);
      stops.push({ el: rep, composite });
      return;
    }
    stops.push({ el, composite: null });
  });
  return stops;
}

export type ToolbarProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Which arrow keys move between controls.
   *
   * @default 'horizontal'
   */
  orientation?: ToolbarOrientation;
  /**
   * Wrap to the start at the ends when arrowing.
   *
   * @default true
   */
  loop?: boolean;
  /** Names the toolbar ("Lecture note formatting"). Required unless `aria-labelledby` is set. */
  'aria-label'?: string;
};

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  {
    className,
    orientation = 'horizontal',
    loop = true,
    onKeyDown,
    onKeyDownCapture,
    onFocus,
    onPointerDown,
    children,
    ...props
  },
  forwardedRef,
) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const ref = useComposedRefs(forwardedRef, rootRef);
  const active = React.useRef<HTMLElement | null>(null);
  const pointer = React.useRef(false);

  const findCurrent = (stops: Stop[]) =>
    stops.find(
      (s) => s.el === active.current || (s.composite !== null && active.current !== null && s.composite.contains(active.current)),
    ) ?? stops[0];

  /** Exactly one plain stop is tabbable: the active one, else the first. Composites keep their own. */
  const sync = React.useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const stops = stopsOf(root);
    const current = findCurrent(stops);
    for (const stop of stops) {
      if (stop.composite) continue;
      const want = stop === current ? '0' : '-1';
      if (stop.el.getAttribute('tabindex') !== want) stop.el.setAttribute('tabindex', want);
    }
  }, []);

  useIsoLayoutEffect(() => {
    sync();
  });

  const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    onFocus?.(event);
    const root = rootRef.current;
    if (!root) return;
    const target = event.target as HTMLElement;
    const from = event.relatedTarget as Node | null;
    // Entering from outside (Tab or Shift+Tab) lands on the remembered stop,
    // even when a composite's own tab stop is what the browser picked.
    const byPointer = pointer.current;
    pointer.current = false;
    if (!byPointer && (!from || !root.contains(from))) {
      const current = findCurrent(stopsOf(root));
      if (current && current.el !== target && !(current.composite && current.composite.contains(target))) {
        if (active.current && root.contains(active.current)) {
          current.el.focus();
          return;
        }
      }
    }
    active.current = target;
    sync();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const root = rootRef.current;
    if (!root) return;
    const target = event.target as HTMLElement;

    if (event.key === 'Tab') {
      // Tab leaves the toolbar: every other stop (a composite's own tab stop
      // included) is taken out of the order for this one keystroke.
      const parked: Array<[HTMLElement, string | null]> = [];
      for (const stop of stopsOf(root)) {
        if (stop.el === target || (stop.composite && stop.composite.contains(target))) continue;
        if (stop.el.tabIndex >= 0) {
          parked.push([stop.el, stop.el.getAttribute('tabindex')]);
          stop.el.setAttribute('tabindex', '-1');
        }
      }
      if (parked.length) {
        window.setTimeout(() => {
          for (const [el, value] of parked) {
            if (value === null) el.removeAttribute('tabindex');
            else el.setAttribute('tabindex', value);
          }
          sync();
        }, 0);
      }
      return;
    }

    const prev = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const next = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    if (![prev, next, 'Home', 'End'].includes(event.key)) return;
    // A text field keeps its caret keys; a nested composite has already
    // handled (and prevented) its own arrows.
    if (target.matches(TEXT_FIELD)) return;
    const stops = stopsOf(root);
    const index = stops.findIndex(
      (s) => s.el === target || (s.composite !== null && s.composite.contains(target)),
    );
    if (index < 0) return;
    if (moveTo(stops, index, event.key, next)) event.preventDefault();
  };

  const moveTo = (stops: Stop[], from: number, key: string, next: string) => {
    let to = from;
    if (key === 'Home') to = 0;
    else if (key === 'End') to = stops.length - 1;
    else if (key === next) to = from + 1 >= stops.length ? (loop ? 0 : from) : from + 1;
    else to = from - 1 < 0 ? (loop ? stops.length - 1 : from) : from - 1;
    const stop = stops[to];
    if (!stop || to === from) return false;
    // Entering a composite lands on its current item.
    active.current = stop.el;
    sync();
    stop.el.focus();
    return true;
  };

  // At the edge of a nested composite (the last segment, going right), the
  // arrow continues along the toolbar instead of looping inside the widget.
  const handleKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDownCapture?.(event);
    const root = rootRef.current;
    if (!root || event.defaultPrevented) return;
    const prev = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const next = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    if (event.key !== prev && event.key !== next) return;
    const target = event.target as HTMLElement;
    const composite = target.closest<HTMLElement>(COMPOSITE);
    if (!composite || composite === root || !root.contains(composite)) return;
    const members = Array.from(composite.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (m) => !(m as HTMLButtonElement).disabled,
    );
    const atEdge = event.key === next ? members[members.length - 1] === target : members[0] === target;
    if (!atEdge) return;
    const stops = stopsOf(root);
    const index = stops.findIndex((s) => s.composite === composite);
    if (index < 0) return;
    if (moveTo(stops, index, event.key, next)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div
      ref={ref}
      role="toolbar"
      data-slot="toolbar"
      data-orientation={orientation}
      aria-orientation={orientation}
      className={cn(
        'flex flex-wrap items-center gap-1 p-2',
        'rounded-md border border-border-decorative bg-surface font-sans text-content',
        'data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
        className,
      )}
      onKeyDown={handleKeyDown}
      onKeyDownCapture={handleKeyDownCapture}
      onFocus={handleFocus}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        // A click lands where it lands; only keyboard entry is redirected.
        pointer.current = true;
        window.setTimeout(() => {
          pointer.current = false;
        }, 0);
      }}
      {...props}
    >
      {children}
    </div>
  );
});
Toolbar.displayName = 'Toolbar';

export type ToolbarGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Names the group for assistive tech ("Text style"). */
  'aria-label'?: string;
};

/** A labelled cluster of related controls; the arrow keys run straight through it. */
export const ToolbarGroup = React.forwardRef<HTMLDivElement, ToolbarGroupProps>(function ToolbarGroup(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="group"
      data-slot="toolbar-group"
      className={cn('flex flex-wrap items-center gap-1 in-data-[orientation=vertical]:flex-col', className)}
      {...props}
    />
  );
});
ToolbarGroup.displayName = 'ToolbarGroup';

export type ToolbarSeparatorProps = Omit<React.ComponentPropsWithoutRef<typeof Divider>, 'orientation' | 'children'>;

/** A hairline between groups, across the toolbar's flow. Decorative. */
export const ToolbarSeparator = React.forwardRef<HTMLElement, ToolbarSeparatorProps>(function ToolbarSeparator(
  { className, ...props },
  ref,
) {
  return (
    <Divider
      ref={ref}
      orientation="vertical"
      data-slot="toolbar-separator"
      className={cn(
        'in-data-[orientation=vertical]:mx-0 in-data-[orientation=vertical]:my-2 in-data-[orientation=vertical]:h-px in-data-[orientation=vertical]:w-auto',
        className,
      )}
      {...props}
    />
  );
});
ToolbarSeparator.displayName = 'ToolbarSeparator';

export type ToolbarSpacerProps = React.HTMLAttributes<HTMLSpanElement>;

/** Takes the free space, pushing what follows (the overflow Menu) to the trailing end. */
export const ToolbarSpacer = React.forwardRef<HTMLSpanElement, ToolbarSpacerProps>(function ToolbarSpacer(
  { className, ...props },
  ref,
) {
  return <span ref={ref} aria-hidden="true" data-slot="toolbar-spacer" className={cn('flex-1', className)} {...props} />;
});
ToolbarSpacer.displayName = 'ToolbarSpacer';

export type ToolbarToggleProps = Omit<React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>, 'aria-label'> & {
  /** The accessible name — required: name the thing toggled ("Bold"), not the verb. */
  'aria-label': string;
};

/**
 * An icon-only on/off control (Bold, Italic): the tertiary 32px icon button at
 * rest and ToggleButton's pressed fill when on (`aria-pressed`). Pass the
 * glyph as the child; Phosphor's bold weight at this size.
 */
export const ToolbarToggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToolbarToggleProps
>(function ToolbarToggle({ className, ...props }, ref) {
  return (
    <TogglePrimitive.Root
      ref={ref}
      data-slot="toolbar-toggle"
      className={cn(
        buttonVariants({ variant: 'tertiary', size: 'icon-sm' }),
        toggleButtonVariants({ size: 'icon-sm' }),
        className,
      )}
      {...props}
    />
  );
});
ToolbarToggle.displayName = 'ToolbarToggle';
