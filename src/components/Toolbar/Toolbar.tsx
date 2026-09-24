'use client';

// Client: roving tabindex across the controls (a layout effect and a key
// handler), and ToolbarToggle is Radix Toggle.
import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { buttonVariants } from '../Button';
import { Divider } from '../Divider';
import { IconButton, type IconButtonProps } from '../IconButton';
import { Menu, MenuCheckboxItem, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '../Menu';
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
 * When space runs out there are two behaviours (responsive audit TB1),
 * chosen with `overflow`.
 *
 * `overflow="menu"`: one line, never wrapping. Controls wrapped in a
 * `ToolbarItem` move into the ⋯ menu (`ToolbarOverflow`) when they do not
 * fit, lowest `priority` first and, among equals, from the end. Everything
 * else (a SearchInput, the ⋯ itself) stays. Each item declares its menu form:
 *   - nothing: a menu row named after the control (`overflowLabel`, else
 *     its aria-label or text), with `overflowIcon`; choosing it clicks the
 *     control, and a pressed toggle (`aria-pressed`) shows as a checkbox row;
 *   - `onOverflowSelect`: called instead of the click;
 *   - `overflowContent`: your own Menu rows (a `MenuRadioGroup` for a
 *     SegmentedControl, several rows for a whole ToolbarGroup).
 *   <Toolbar aria-label="Lecture note formatting" overflow="menu">
 *     <ToolbarItem overflowIcon={<TextB />}><ToolbarToggle aria-label="Bold">…</ToolbarToggle></ToolbarItem>
 *     <ToolbarSeparator />
 *     <ToolbarItem priority={1} overflowContent={<MenuRadioGroup …/>}><SegmentedControl …/></ToolbarItem>
 *     <ToolbarSpacer />
 *     <ToolbarOverflow aria-label="More note actions"><MenuItem>Download as PDF</MenuItem></ToolbarOverflow>
 *   </Toolbar>
 * Put `ToolbarItem`s DIRECTLY in the Toolbar (not inside a ToolbarGroup, not
 * inside your own wrapper component). Without a `ToolbarOverflow` the toolbar
 * adds one at the end; it shows only when something has moved into it (or it
 * has rows of its own). A separator never starts or ends the row and never
 * sits beside the spacer or another separator. Widths are measured with a
 * ResizeObserver; the server and the first client render show every control
 * (no hydration mismatch), then the row is fitted before the first paint.
 * Give the toolbar its width from outside (it fills its container:
 * `w-full min-w-0`); a shrink-to-fit parent has no width to fit into.
 *
 * `overflow="wrap"` (default): the toolbar wraps rather than hiding controls:
 *   - with a `ToolbarSpacer` as a direct child, what comes before it wraps
 *     inside its own box and what comes after it (the ⋯ Menu) stays on the
 *     trailing end of the FIRST line, so it never ends up alone on a line;
 *   - a `ToolbarSeparator` that lands at the start or end of a wrapped line
 *     is hidden (measured after layout and on resize), so no line starts
 *     with a stray hairline.
 * ------------------------------------------------------------------------- */

/** `horizontal` a row (← / →) · `vertical` a column (↑ / ↓). */
export type ToolbarOrientation = 'horizontal' | 'vertical';

/** `wrap` onto more lines · `menu` one line, what does not fit goes into the ⋯ menu. */
export type ToolbarOverflowMode = 'wrap' | 'menu';

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex], [contenteditable="true"], [contenteditable=""]';
const COMPOSITE = '[role="radiogroup"], [role="tablist"], [role="listbox"], [role="menubar"], [role="grid"], [role="tree"]';
const TEXT_FIELD = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"], [contenteditable=""]';

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

type Stop = { el: HTMLElement; composite: HTMLElement | null };

/** Two boxes share a line when they overlap vertically. */
const sameLine = (a: DOMRect, b: DOMRect) => a.top < b.bottom - 1 && b.top < a.bottom - 1;

/** The nearest rendered element sibling in a direction. */
function renderedSibling(el: Element, dir: 'previousElementSibling' | 'nextElementSibling'): Element | null {
  let node = el[dir];
  while (node && getComputedStyle(node).display === 'none') {
    node = node[dir];
  }
  return node;
}

/** Hides (visibility, so nothing reflows) each separator that starts or ends a wrapped line. */
function markSeparatorEdges(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-slot="toolbar-separator"]').forEach((sep) => {
    const box = sep.getBoundingClientRect();
    // Not laid out (hidden, or no layout engine): leave it alone.
    if (box.width === 0 && box.height === 0) {
      sep.removeAttribute('data-line-edge');
      return;
    }
    const prev = renderedSibling(sep, 'previousElementSibling');
    const next = renderedSibling(sep, 'nextElementSibling');
    const edge =
      !prev || !next || !sameLine(box, prev.getBoundingClientRect()) || !sameLine(box, next.getBoundingClientRect());
    if (edge !== sep.hasAttribute('data-line-edge')) {
      if (edge) sep.setAttribute('data-line-edge', '');
      else sep.removeAttribute('data-line-edge');
    }
  });
}

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

/* ---- Overflow into the ⋯ menu ----------------------------------------------- */

/** Styles an element the fitter took out of the row: out of flow and unseen, but still measurable. */
const OVERFLOWED =
  'data-[overflowed]:pointer-events-none data-[overflowed]:invisible data-[overflowed]:absolute data-[overflowed]:start-0 data-[overflowed]:top-0';

type Fit = { hidden: number[]; separators: HTMLElement[] };

type Entry = {
  el: HTMLElement;
  kind: 'item' | 'separator' | 'spacer' | 'overflow' | 'other';
  width: number;
  index: number;
  priority: number;
};

function outerWidth(el: HTMLElement) {
  const style = getComputedStyle(el);
  return el.getBoundingClientRect().width + (parseFloat(style.marginLeft) || 0) + (parseFloat(style.marginRight) || 0);
}

/** Drops each separator that would start or end the row, or touch the spacer, the ⋯, or another separator. */
function pruneSeparators(visible: Entry[]) {
  const content = (e: Entry | undefined) => !!e && (e.kind === 'item' || e.kind === 'other');
  const dropped: Entry[] = [];
  const forward: Entry[] = [];
  for (const e of visible) {
    if (e.kind === 'separator' && !content(forward[forward.length - 1])) dropped.push(e);
    else forward.push(e);
  }
  const kept: Entry[] = [];
  for (const e of forward.slice().reverse()) {
    if (e.kind === 'separator' && !content(kept[0])) dropped.push(e);
    else kept.unshift(e);
  }
  return { kept, dropped };
}

/**
 * Which items leave the row: the fewest, in (priority, from the end) order,
 * that let the rest fit. Widths come from every child, in the row or not
 * (an overflowed one is absolutely positioned, so it keeps its own width).
 * `null` when the toolbar is not laid out (hidden, or no layout engine).
 */
function fitRow(root: HTMLElement): Fit | null {
  if (root.clientWidth === 0) return null;
  const style = getComputedStyle(root);
  const avail = root.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
  const gap = parseFloat(style.columnGap) || 0;
  const entries: Entry[] = Array.from(root.children)
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
    .map((el) => {
      const slot = el.getAttribute('data-slot');
      const index = Number(el.getAttribute('data-overflow-index'));
      const kind: Entry['kind'] =
        slot === 'toolbar-item' && el.hasAttribute('data-overflow-index')
          ? 'item'
          : slot === 'toolbar-separator'
            ? 'separator'
            : slot === 'toolbar-spacer'
              ? 'spacer'
              : slot === 'toolbar-overflow'
                ? 'overflow'
                : 'other';
      return {
        el,
        kind,
        width: kind === 'spacer' ? 0 : outerWidth(el),
        index,
        priority: Number(el.getAttribute('data-priority')) || 0,
      };
    });
  const order = entries
    .filter((e) => e.kind === 'item')
    .sort((a, b) => a.priority - b.priority || b.index - a.index);
  const permanent = entries.some((e) => e.kind === 'overflow' && e.el.hasAttribute('data-permanent'));
  for (let k = 0; k <= order.length; k += 1) {
    const out = new Set(order.slice(0, k).map((e) => e.index));
    const visible = entries.filter(
      (e) => !(e.kind === 'item' && out.has(e.index)) && !(e.kind === 'overflow' && k === 0 && !permanent),
    );
    const { kept, dropped } = pruneSeparators(visible);
    const total = kept.reduce((sum, e) => sum + e.width, 0) + gap * Math.max(0, kept.length - 1);
    if (total <= avail + 0.5 || k === order.length) {
      return { hidden: Array.from(out).sort((a, b) => a - b), separators: dropped.map((e) => e.el) };
    }
  }
  return null;
}

const sameList = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

type OverflowContextValue = {
  /** Indices of the ToolbarItems now in the menu, in row order. */
  hidden: number[];
  /** Every ToolbarItem's props, by index. */
  items: ToolbarItemProps[];
  /** Every ToolbarItem's section (how many separators come before it), by index. */
  sections: number[];
  /** An item's element in the row. */
  itemElement: (index: number) => HTMLElement | null;
};

const ToolbarOverflowContext = React.createContext<OverflowContextValue | null>(null);

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
  /**
   * When the controls do not fit: `wrap` onto more lines, or `menu` (one
   * line; `ToolbarItem`s that do not fit move into the ⋯ menu). Horizontal
   * toolbars only.
   *
   * @default 'wrap'
   */
  overflow?: ToolbarOverflowMode;
  /**
   * With `overflow="menu"` and no `ToolbarOverflow` of your own: the name of
   * the ⋯ button the toolbar adds.
   *
   * @default 'More actions'
   */
  overflowMenuLabel?: string;
};

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  {
    className,
    orientation = 'horizontal',
    loop = true,
    overflow = 'wrap',
    overflowMenuLabel = 'More actions',
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

  const menuMode = overflow === 'menu' && orientation === 'horizontal';
  const [hidden, setHidden] = React.useState<number[]>([]);

  // `overflow="menu"`: fit the row after every render and whenever the toolbar
  // or any control changes size. Server and first client render show every
  // control; this runs before the first paint.
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !menuMode) return undefined;
    const run = () => {
      const fit = fitRow(root);
      if (!fit) return;
      root.querySelectorAll<HTMLElement>(':scope > [data-slot="toolbar-separator"]').forEach((sep) => {
        const out = fit.separators.includes(sep);
        if (out !== sep.hasAttribute('data-overflowed')) {
          if (out) sep.setAttribute('data-overflowed', '');
          else sep.removeAttribute('data-overflowed');
        }
      });
      setHidden((prev) => (sameList(prev, fit.hidden) ? prev : fit.hidden));
    };
    run();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', run);
      return () => window.removeEventListener('resize', run);
    }
    const ro = new ResizeObserver(run);
    ro.observe(root);
    Array.from(root.children).forEach((child) => ro.observe(child));
    return () => ro.disconnect();
  });

  // A control that moved into the menu while focused hands focus to the ⋯.
  // When the ⋯ ITSELF just went away (everything fits again) while focused,
  // it cannot take focus back: the last control still in the row does, so
  // focus never falls to <body>.
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !menuMode) return;
    const focused = document.activeElement;
    if (focused && root.contains(focused) && focused.closest('[data-overflowed]')) {
      const more = root.querySelector<HTMLElement>(':scope > [data-slot="toolbar-overflow"] button');
      let next: HTMLElement | null | undefined = more && !more.closest('[data-overflowed]') ? more : null;
      if (!next) {
        const visible = stopsOf(root).filter((s) => !s.el.closest('[data-overflowed]'));
        next = visible[visible.length - 1]?.el;
      }
      if (next) {
        active.current = next;
        sync();
        next.focus();
      }
    }
  }, [hidden, menuMode, sync]);

  // Separators at the edge of a wrapped line: after every render and on resize.
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || orientation === 'vertical' || menuMode) return undefined;
    markSeparatorEdges(root);
    let raf = 0;
    const schedule = () => {
      if (typeof requestAnimationFrame === 'undefined') markSeparatorEdges(root);
      else if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          markSeparatorEdges(root);
        });
    };
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(schedule);
      ro.observe(root);
    } else {
      window.addEventListener('resize', schedule);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', schedule);
      if (raf && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf);
    };
  });

  const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    onFocus?.(event);
    const root = rootRef.current;
    if (!root) return;
    const target = event.target as HTMLElement;
    // Focus inside a portal (an open ⋯ menu) bubbles here through React, but
    // is not a stop of this toolbar.
    if (!root.contains(target)) return;
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

  // With a ToolbarSpacer as a direct child: the leading controls wrap in
  // their own box; the trailing ones (the ⋯ Menu) hold the first line's end.
  const items = React.Children.toArray(children);

  // `overflow="menu"`: number the ToolbarItems (the fitter and the menu both
  // use the index), mark the ones in the menu, and add a ⋯ if there is none.
  const itemProps: ToolbarItemProps[] = [];
  const sections: number[] = [];
  let section = 0;
  const hiddenSet = new Set(hidden);
  const rowItems = menuMode
    ? items.map((child) => {
        if (React.isValidElement(child) && child.type === ToolbarSeparator) section += 1;
        if (!React.isValidElement(child) || child.type !== ToolbarItem) return child;
        const index = itemProps.length;
        itemProps.push(child.props as ToolbarItemProps);
        sections.push(section);
        const out = hiddenSet.has(index);
        return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
          'data-overflow-index': index,
          'data-overflowed': out ? '' : undefined,
          'aria-hidden': out ? true : undefined,
        });
      })
    : items;
  const hasOverflow = items.some((child) => React.isValidElement(child) && child.type === ToolbarOverflow);
  // Rebuilt every render: it carries the items' current props.
  const overflowContext: OverflowContextValue = {
    hidden,
    items: itemProps,
    sections,
    itemElement: (index) =>
      rootRef.current?.querySelector<HTMLElement>(`:scope > [data-overflow-index="${index}"]`) ?? null,
  };

  const spacerAt =
    orientation === 'horizontal' && !menuMode
      ? items.findIndex((child) => React.isValidElement(child) && child.type === ToolbarSpacer)
      : -1;
  const split = spacerAt > 0 && spacerAt < items.length - 1;
  const content = menuMode ? (
    <ToolbarOverflowContext.Provider value={overflowContext}>
      {rowItems}
      {hasOverflow ? null : <ToolbarOverflow aria-label={overflowMenuLabel} />}
    </ToolbarOverflowContext.Provider>
  ) : split ? (
    <>
      <div data-slot="toolbar-main" className="flex min-w-0 flex-wrap items-center gap-1">
        {items.slice(0, spacerAt)}
      </div>
      {items[spacerAt]}
      <div data-slot="toolbar-end" className="flex shrink-0 items-center gap-1 self-start">
        {items.slice(spacerAt + 1)}
      </div>
    </>
  ) : (
    children
  );

  return (
    <div
      ref={ref}
      role="toolbar"
      data-slot="toolbar"
      data-orientation={orientation}
      data-split={split || undefined}
      data-overflow={menuMode ? 'menu' : undefined}
      aria-orientation={orientation}
      className={cn(
        'flex flex-wrap items-center gap-1 p-2 data-[split]:flex-nowrap',
        // One line that never wraps; what does not fit is in the ⋯ menu. The
        // clip only hides the moment before the first fit (server HTML).
        'data-[overflow=menu]:relative data-[overflow=menu]:w-full data-[overflow=menu]:min-w-0',
        'data-[overflow=menu]:flex-nowrap data-[overflow=menu]:overflow-hidden data-[overflow=menu]:[&>*]:shrink-0',
        'data-[overflow=menu]:[&>[data-slot=toolbar-group]]:flex-nowrap',
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
      {content}
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
        // At the start or end of a wrapped line (set by the Toolbar): hidden, without reflow.
        'data-[line-edge]:invisible',
        // `overflow="menu"`: a separator that would dangle leaves the row.
        OVERFLOWED,
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

/* ---- Item ----------------------------------------------------------------- */

export type ToolbarItemProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * The row's text in the ⋯ menu. Defaults to the control's `aria-label`, or
   * its text.
   */
  overflowLabel?: string;
  /** The row's leading glyph in the ⋯ menu (the control's icon, at 20px). */
  overflowIcon?: React.ReactNode;
  /**
   * Called when the item's menu row is chosen. Without it, choosing the row
   * clicks the control (a button or toggle then does what it always does).
   */
  onOverflowSelect?: (event: Event) => void;
  /**
   * Your own menu rows for this item, in place of the default row: a
   * `MenuRadioGroup` for a SegmentedControl, several rows for a whole group,
   * the submenu of a Menu trigger.
   */
  overflowContent?: React.ReactNode;
  /**
   * Higher stays in the row longer. Among equals, the last item goes first.
   *
   * @default 0
   */
  priority?: number;
};

/**
 * One control (or one group) that can move into the ⋯ menu when the row is
 * full, in a `Toolbar overflow="menu"`. A direct child of the Toolbar; it
 * draws nothing of its own. In a `wrap` toolbar it is just a wrapper.
 */
export const ToolbarItem = React.forwardRef<HTMLDivElement, ToolbarItemProps>(function ToolbarItem(
  { className, overflowLabel, overflowIcon, onOverflowSelect, overflowContent, priority = 0, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="toolbar-item"
      data-priority={priority}
      className={cn('flex shrink-0 items-center gap-1', OVERFLOWED, className)}
      {...props}
    />
  );
});
ToolbarItem.displayName = 'ToolbarItem';

/* ---- Overflow menu -------------------------------------------------------- */

/** Phosphor 2.1.1 `dots-three` bold (MIT). */
function DotsGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M144,128a16,16,0,1,1-16-16A16,16,0,0,1,144,128ZM60,112a16,16,0,1,0,16,16A16,16,0,0,0,60,112Zm136,0a16,16,0,1,0,16,16A16,16,0,0,0,196,112Z" />
    </svg>
  );
}

type Snapshot = { control: HTMLElement | null; label: string; pressed?: boolean; disabled: boolean };

/** What an item's control looks like right now: its name, pressed and disabled state. */
function snapshotOf(el: HTMLElement | null): Snapshot {
  const control = el?.querySelector<HTMLElement>(FOCUSABLE) ?? null;
  const pressed = control?.getAttribute('aria-pressed');
  return {
    control,
    label: (control?.getAttribute('aria-label') ?? control?.textContent ?? el?.textContent ?? '').trim(),
    pressed: pressed === 'true' ? true : pressed === 'false' ? false : undefined,
    disabled: !!control && ((control as HTMLButtonElement).disabled || control.getAttribute('aria-disabled') === 'true'),
  };
}

export type ToolbarOverflowProps = Omit<IconButtonProps, 'aria-label' | 'children'> & {
  /**
   * The ⋯ button's name.
   *
   * @default 'More actions'
   */
  'aria-label'?: string;
  /** The button's glyph. Defaults to ⋯ (`dots-three`). */
  icon?: React.ReactNode;
  /**
   * The menu's alignment under the button.
   *
   * @default 'end'
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Menu rows that are always there (Download, Share, Delete). They follow
   * the controls that moved in, after a separator.
   */
  children?: React.ReactNode;
};

/**
 * The ⋯ button and its Menu. In a `Toolbar overflow="menu"` it lists the
 * `ToolbarItem`s that did not fit, then its own `children`; it is only shown
 * when it has something to list. Put it after a `ToolbarSpacer` to hold the
 * trailing end. In a `wrap` toolbar it is a plain ⋯ menu of its `children`.
 */
export const ToolbarOverflow = React.forwardRef<HTMLButtonElement, ToolbarOverflowProps>(function ToolbarOverflow(
  {
    className,
    'aria-label': label = 'More actions',
    icon,
    align = 'end',
    variant = 'tertiary',
    size = 'sm',
    children,
    ...props
  },
  ref,
) {
  const ctx = React.useContext(ToolbarOverflowContext);
  const [open, setOpen] = React.useState(false);
  const [snaps, setSnaps] = React.useState<Record<number, Snapshot>>({});
  const hidden = ctx?.hidden ?? [];
  const permanent = React.Children.count(children) > 0;
  const shown = hidden.length > 0 || permanent;
  if (!ctx && !permanent) return null;

  const onOpenChange = (next: boolean) => {
    if (next && ctx) {
      const taken: Record<number, Snapshot> = {};
      for (const index of ctx.hidden) taken[index] = snapshotOf(ctx.itemElement(index));
      setSnaps(taken);
    }
    setOpen(next);
  };

  const row = (index: number) => {
    const item = ctx?.items[index];
    if (!item) return null;
    if (item.overflowContent != null) return <React.Fragment key={index}>{item.overflowContent}</React.Fragment>;
    const snap = snaps[index] ?? snapshotOf(ctx?.itemElement(index) ?? null);
    const text = item.overflowLabel ?? snap.label;
    const select = (event: Event) => {
      if (item.onOverflowSelect) item.onOverflowSelect(event);
      else snap.control?.click();
    };
    if (snap.pressed !== undefined) {
      return (
        <MenuCheckboxItem key={index} checked={snap.pressed} disabled={snap.disabled} icon={item.overflowIcon} onSelect={select}>
          {text}
        </MenuCheckboxItem>
      );
    }
    return (
      <MenuItem key={index} icon={item.overflowIcon} disabled={snap.disabled} onSelect={select}>
        {text}
      </MenuItem>
    );
  };

  return (
    <div
      data-slot="toolbar-overflow"
      data-permanent={permanent ? '' : undefined}
      data-overflowed={shown ? undefined : ''}
      aria-hidden={shown ? undefined : true}
      className={cn('flex shrink-0 items-center', OVERFLOWED)}
    >
      <Menu open={open} onOpenChange={onOpenChange}>
        <MenuTrigger asChild>
          <IconButton ref={ref} variant={variant} size={size} aria-label={label} className={className} {...props}>
            {icon ?? <DotsGlyph />}
          </IconButton>
        </MenuTrigger>
        <MenuContent align={align}>
          {hidden.map((index, i) => {
            // A separator in the row between two moved-in items is one in the menu too.
            const prev = hidden[i - 1];
            const split = prev !== undefined && ctx?.sections[prev] !== ctx?.sections[index];
            return (
              <React.Fragment key={index}>
                {split ? <MenuSeparator /> : null}
                {row(index)}
              </React.Fragment>
            );
          })}
          {hidden.length > 0 && permanent ? <MenuSeparator /> : null}
          {children}
        </MenuContent>
      </Menu>
    </div>
  );
});
ToolbarOverflow.displayName = 'ToolbarOverflow';
