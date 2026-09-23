'use client';

// Client: keeps expanded / selected / focused state and handles the tree's
// keyboard contract (arrows, Home / End, type-ahead).
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';

/* ---------------------------------------------------------------------------
 * TreeList, TreeListItem
 *
 * A collapsible hierarchy for structures people already hold in their heads:
 * the curriculum, a file store, an org chart. Do NOT use it for a flat set of
 * filters — collapsing hides things people need to see at once.
 *
 *   <TreeList aria-label="SST curriculum" defaultExpanded={['y2', 's3']} defaultSelected="w6">
 *     <TreeListItem value="y2" label="Year 2 — Batch of 2029" icon={<GraduationCap />}>
 *       <TreeListItem value="s3" label="Semester 3" icon={<Folder />}>
 *         <TreeListItem value="w6" label="Week 6 — Balanced BSTs" icon={<FileText />} />
 *       </TreeListItem>
 *     </TreeListItem>
 *   </TreeList>
 *
 * The APG tree view: `role="tree"`, every node a real <button role="treeitem">
 * (so activation works from the keyboard without a tabindex on a div) inside
 * `<li role="none">`, children in `<ul role="group">`, `aria-expanded` on
 * parents, `aria-level` from nesting, `aria-selected` on the selected node.
 * One node is in the tab order (the selected one, else the first); the rest
 * are reached with:
 *
 *   ↓ / ↑        next / previous visible node
 *   →            expand a closed parent; on an open one, go to its first child
 *   ←            collapse an open parent; otherwise go to the parent
 *   Home / End   first / last visible node
 *   Enter/Space  a parent toggles; a leaf is selected
 *   a–z          type-ahead to the next node starting with those letters
 *
 * Parents expand and collapse; leaves are selected (single selection, as in
 * the HTML). Disabled nodes (a locked week) are skipped and cannot be chosen.
 * Collapsed children stay mounted but `hidden`, so a parent keeps its place
 * in the order and find-in-page still sees nothing it should not.
 *
 * Narrow trees (responsive audit TR1). The tree is a size container. Below
 * 480px of its own width (a phone, a sidebar) each level indents 12px
 * instead of 20px, the indent stops growing after level 4, and a deeper node
 * shows its level number instead ("5", "6"…; the level is already
 * `aria-level` for assistive tech). Labels take the free width and wrap
 * (long words break), and the trailing badge wraps under the label rather
 * than overlapping it. On a touch device every row is at least 44px tall.
 * ------------------------------------------------------------------------- */

type TreeContextValue = {
  expanded: Set<string>;
  selected: string | null;
  tabbable: string | null;
  toggle: (value: string) => void;
  select: (value: string) => void;
  setFocused: (value: string) => void;
};

const TreeContext = React.createContext<TreeContextValue | null>(null);
const LevelContext = React.createContext(1);

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/** Levels past this one stop indenting in a narrow tree and show their number. */
const indentCap = 4;

/** Items the keyboard can reach: rendered, not inside a collapsed group, not disabled. */
function visibleItems(root: HTMLElement | null): HTMLButtonElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLButtonElement>('[role="treeitem"]')).filter(
    (el) => !el.disabled && !el.closest('[role="group"][hidden]'),
  );
}

export type TreeListProps = Omit<React.HTMLAttributes<HTMLUListElement>, 'defaultValue'> & {
  /** Values of the expanded parents (controlled). Pair with `onExpandedChange`. */
  expanded?: string[];
  /**
   * Values of the parents expanded at first, when uncontrolled.
   *
   * @default []
   */
  defaultExpanded?: string[];
  /** Called with every expanded parent's value when one opens or closes. */
  onExpandedChange?: (expanded: string[]) => void;
  /** The selected leaf's value (controlled), `null` for none. Pair with `onSelectedChange`. */
  selected?: string | null;
  /**
   * The selected leaf when uncontrolled.
   *
   * @default null
   */
  defaultSelected?: string | null;
  /** Called with the value of the leaf the person selects. */
  onSelectedChange?: (value: string) => void;
  /** Names the tree ("SST curriculum"). Required unless `aria-labelledby` is set. */
  'aria-label'?: string;
};

export const TreeList = React.forwardRef<HTMLUListElement, TreeListProps>(function TreeList(
  {
    className,
    expanded: expandedProp,
    defaultExpanded,
    onExpandedChange,
    selected: selectedProp,
    defaultSelected = null,
    onSelectedChange,
    onKeyDown,
    children,
    ...props
  },
  forwardedRef,
) {
  const rootRef = React.useRef<HTMLUListElement>(null);
  const ref = useComposedRefs(forwardedRef, rootRef);

  const [expandedState, setExpanded] = useControllableState<string[]>({
    prop: expandedProp,
    defaultProp: defaultExpanded ?? [],
    onChange: onExpandedChange,
    caller: 'TreeList',
  });
  const expandedList = expandedState ?? [];
  const expanded = React.useMemo(() => new Set(expandedList), [expandedList]);

  const [selectedState, setSelected] = useControllableState<string | null>({
    prop: selectedProp,
    defaultProp: defaultSelected,
    onChange: (v) => {
      if (v != null) onSelectedChange?.(v);
    },
    caller: 'TreeList',
  });
  const selected = selectedState ?? null;

  const [focused, setFocused] = React.useState<string | null>(null);
  const [tabbable, setTabbable] = React.useState<string | null>(null);

  const toggle = React.useCallback(
    (value: string) => {
      const next = expanded.has(value) ? expandedList.filter((v) => v !== value) : [...expandedList, value];
      setExpanded(next);
    },
    [expanded, expandedList, setExpanded],
  );
  const select = React.useCallback((value: string) => setSelected(value), [setSelected]);

  // Exactly one node is in the tab order: the last focused (else the
  // selected) node while it is reachable, otherwise the first reachable node.
  // Resolved from the DOM after each render, before paint.
  const preferred = focused ?? selected;
  useIsoLayoutEffect(() => {
    const values = visibleItems(rootRef.current).map((el) => el.dataset.value ?? '');
    const next = preferred != null && values.includes(preferred) ? preferred : (values[0] ?? null);
    if (next !== tabbable) setTabbable(next);
  });

  const items = () => visibleItems(rootRef.current);
  const typeahead = React.useRef({ text: '', at: 0 });

  const focusItem = (el: HTMLButtonElement | undefined) => {
    if (!el) return;
    el.focus();
    setFocused(el.dataset.value ?? null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    if (target.getAttribute('role') !== 'treeitem') return;
    const current = target as HTMLButtonElement;
    const list = items();
    const index = list.indexOf(current);
    const value = current.dataset.value ?? '';
    const isParent = current.hasAttribute('aria-expanded');
    const isOpen = current.getAttribute('aria-expanded') === 'true';

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusItem(list[index + 1]);
        return;
      case 'ArrowUp':
        event.preventDefault();
        focusItem(list[index - 1]);
        return;
      case 'Home':
        event.preventDefault();
        focusItem(list[0]);
        return;
      case 'End':
        event.preventDefault();
        focusItem(list[list.length - 1]);
        return;
      case 'ArrowRight':
        event.preventDefault();
        if (!isParent) return;
        if (!isOpen) toggle(value);
        else {
          const group = current.parentElement?.querySelector<HTMLElement>(':scope > [role="group"]');
          focusItem(group ? visibleItems(group)[0] : undefined);
        }
        return;
      case 'ArrowLeft': {
        event.preventDefault();
        if (isParent && isOpen) {
          toggle(value);
          return;
        }
        const parentGroup = current.closest('li')?.parentElement;
        if (parentGroup?.getAttribute('role') === 'group') {
          const parentItem = parentGroup.parentElement?.querySelector<HTMLButtonElement>(':scope > [role="treeitem"]');
          focusItem(parentItem ?? undefined);
        }
        return;
      }
      default:
        break;
    }

    if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      const state = typeahead.current;
      state.text = now - state.at > 500 ? event.key.toLowerCase() : state.text + event.key.toLowerCase();
      state.at = now;
      const ordered = [...list.slice(index + 1), ...list.slice(0, index + 1)];
      // A repeated single letter cycles; a longer prefix may stay put.
      const pool = state.text.length > 1 ? [current, ...ordered] : ordered;
      const match = pool.find((el) =>
        (el.querySelector('[data-slot="tree-list-item-label"]')?.textContent ?? '')
          .trim()
          .toLowerCase()
          .startsWith(state.text),
      );
      if (match) {
        event.preventDefault();
        focusItem(match);
      }
    }
  };

  const context = React.useMemo<TreeContextValue>(
    () => ({ expanded, selected, tabbable, toggle, select, setFocused }),
    [expanded, selected, tabbable, toggle, select],
  );

  return (
    <TreeContext.Provider value={context}>
      <LevelContext.Provider value={1}>
        <ul
          ref={ref}
          role="tree"
          data-slot="tree-list"
          className={cn('@container m-0 list-none p-0 font-sans text-base leading-body text-content', className)}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {children}
        </ul>
      </LevelContext.Provider>
    </TreeContext.Provider>
  );
});
TreeList.displayName = 'TreeList';

/** Phosphor 2.1.1 `caret-right` regular, the HTML's `#ph-chevron-right`. */
function ChevronGlyph() {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      data-slot="tree-list-item-chevron"
      className={cn(
        'size-icon-sm shrink-0 text-content-secondary',
        'transition-transform duration-(--motion-duration-normal) ease-productive-in-out motion-reduce:transition-none',
        'in-aria-expanded:rotate-90',
      )}
    >
      <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
    </svg>
  );
}

export type TreeListItemProps = Omit<React.ComponentPropsWithoutRef<'button'>, 'value' | 'children'> & {
  /** Unique value: what `expanded` / `selected` hold. */
  value: string;
  /** The node's text. Wraps when long. */
  label: React.ReactNode;
  /** A leading glyph (20px). Swap to the fill weight for a selected leaf. */
  icon?: React.ReactNode;
  /** Trailing content after the label: a Badge ("14 weeks", "Graded"). */
  trailing?: React.ReactNode;
  /**
   * Skipped by the keyboard and cannot be expanded or selected (a week that
   * has not unlocked).
   *
   * @default false
   */
  disabled?: boolean;
  /** Nested `TreeListItem`s. With children the node is a parent (it expands); without, a leaf. */
  children?: React.ReactNode;
};

export const TreeListItem = React.forwardRef<HTMLButtonElement, TreeListItemProps>(function TreeListItem(
  { className, value, label, icon, trailing, disabled = false, children, onClick, onFocus, ...props },
  ref,
) {
  const tree = React.useContext(TreeContext);
  const level = React.useContext(LevelContext);
  if (!tree) throw new Error('TreeListItem must be used inside a TreeList.');

  const isParent = React.Children.toArray(children).some(Boolean);
  const isOpen = isParent && tree.expanded.has(value);
  const isSelected = !isParent && tree.selected === value;

  return (
    <li role="none" data-slot="tree-list-node">
      <button
        ref={ref}
        type="button"
        role="treeitem"
        data-slot="tree-list-item"
        data-value={value}
        data-state={isSelected ? 'selected' : undefined}
        aria-level={level}
        aria-expanded={isParent ? isOpen : undefined}
        aria-selected={isSelected ? true : undefined}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        tabIndex={tree.tabbable === value ? 0 : -1}
        className={cn(
          'flex w-full cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 rounded-sm border-0 bg-transparent px-2 py-1',
          'pointer-coarse:min-h-(--size-touch-min)',
          'text-left font-sans text-base text-inherit',
          'outline-none transition-colors duration-(--motion-duration-instant) ease-productive-in-out motion-reduce:transition-none',
          'enabled:hover:bg-surface-hover',
          'focus-visible:ring-[3px] focus-visible:ring-border-focus/50',
          // Selected beats hover, and goes a step deeper under the pointer.
          'data-[state=selected]:bg-surface-brand-subtle data-[state=selected]:font-semibold data-[state=selected]:text-content-brand',
          'data-[state=selected]:enabled:hover:bg-surface-active',
          'disabled:cursor-not-allowed disabled:text-content-disabled',
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          tree.setFocused(value);
          if (isParent) tree.toggle(value);
          else tree.select(value);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          tree.setFocused(value);
        }}
        {...props}
      >
        {level > indentCap ? (
          <span
            data-slot="tree-list-item-depth"
            aria-hidden="true"
            className={cn(
              'hidden @max-[480px]:inline-flex',
              'h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1',
              'border border-border-decorative text-[10px] font-semibold leading-none tabular-nums text-content-secondary',
            )}
          >
            {level}
          </span>
        ) : null}
        {isParent ? <ChevronGlyph /> : null}
        {icon != null && icon !== false ? (
          <span
            data-slot="tree-list-item-icon"
            aria-hidden="true"
            className="flex shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-icon-md"
          >
            {icon}
          </span>
        ) : null}
        <span data-slot="tree-list-item-label" className="min-w-0 flex-1 basis-[96px] [overflow-wrap:anywhere]">
          {label}
        </span>
        {trailing != null && trailing !== false ? (
          <span
            data-slot="tree-list-item-trailing"
            className="ms-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2"
          >
            {trailing}
          </span>
        ) : null}
      </button>
      {isParent ? (
        <LevelContext.Provider value={level + 1}>
          <ul
            role="group"
            data-slot="tree-list-group"
            hidden={!isOpen}
            data-capped={level >= indentCap || undefined}
            className={cn(
              'm-0 list-none border-l border-border-decorative p-0 ps-5',
              // Narrow: a tighter indent, and none past the cap (the level number takes over).
              '@max-[480px]:ps-3',
              '@max-[480px]:data-[capped]:border-l-0 @max-[480px]:data-[capped]:ps-0',
            )}
          >
            {children}
          </ul>
        </LevelContext.Provider>
      ) : null}
    </li>
  );
});
TreeListItem.displayName = 'TreeListItem';
