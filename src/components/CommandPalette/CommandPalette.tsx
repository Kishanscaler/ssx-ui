'use client';

// Client: Radix Dialog (focus trap, scroll lock, portal), the query and the
// active row are state, and the ⌘K / Ctrl+K hotkey is a document listener.
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useId } from '../../lib/use-id';
import { Button, type ButtonVariant } from '../Button';
import { EmptyState, EmptyStateActions, EmptyStateArt, EmptyStateDescription, EmptyStateTitle } from '../EmptyState';
import { Kbd, KbdGroup, KbdMod } from '../Kbd';
import { menuItemVariants } from '../Menu';
import { Spinner } from '../Spinner';

/* ---------------------------------------------------------------------------
 * CommandPalette
 *
 * Keyboard-first jump-to-anything for staff surfaces: one field that searches
 * students, cohorts and commands at once. It is an accelerator layered over
 * navigation that already exists, never the only route to an action.
 *
 *   <CommandPalette
 *     trigger="Search everything"
 *     groups={[
 *       { heading: 'Students', items: [{ value: 'sst-2029-0416', label: 'Aarav Krishnan',
 *           detail: '· SST-2029-0416 · Cohort 7', icon: <Avatar size="sm">…</Avatar> }] },
 *       { heading: 'Commands', items: [{ value: 'new-slot', label: 'Create an interview slot',
 *           icon: <Plus />, shortcut: '⌘N', onSelect: openSlotForm }] },
 *     ]}
 *   />
 *
 * Data in, not a compound tree: the palette must filter, count, group and
 * walk the rows, and it has to do that on React 16.12 too (no
 * `useSyncExternalStore`, which is what a registering compound API like cmdk
 * needs; cmdk also does not support React 16). A Storyblok blok maps onto the
 * same arrays.
 *
 * Accessibility: the panel is a modal Radix Dialog (focus in and trapped,
 * Escape and the scrim close it, focus returns to whatever opened it, scroll
 * lock), named by `label`. Inside, the APG combobox-with-listbox pattern: the
 * field is `role="combobox"` and keeps DOM focus; ↑ / ↓ move the active row,
 * which is announced through `aria-activedescendant`; Enter runs it. Rows are
 * `role="option"` in `role="group"`s labelled by their heading; a disabled row
 * stays visible, is announced as unavailable and is skipped.
 *
 * ⌘K on Apple, Ctrl+K elsewhere, toggles it from anywhere on the page
 * (`hotkey`; `false` to switch off). Shown with `CommandPaletteShortcut`,
 * which is `KbdMod` + `Kbd`, so the modifier is right per platform.
 *
 * Geometry is the HTML's `.palette`: 18vh from the top, min(560px, 92vw), a
 * 52px borderless field over a hairline, a list at most 320px tall. The row
 * under the keyboard is brand-subtle, brand ink, semibold. Motion: a short
 * scale-and-fade on the productive entrance easing; reduced motion: none.
 * ------------------------------------------------------------------------- */

/* ---- glyph ---------------------------------------------------------------- */

/** Phosphor 2.1.1 `magnifying-glass` regular (`ph-search` in the preview sprite). */
function SearchGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
    </svg>
  );
}

const isRendered = (node: React.ReactNode) => node != null && node !== false && node !== '';

/* ---- data ----------------------------------------------------------------- */

/** String union, so a Storyblok option value can be passed straight in. */
export type CommandPaletteItemVariant = 'default' | 'danger';

export type CommandPaletteItem = {
  /** Unique across the whole palette; passed to `onSelect`. */
  value: string;
  /** The row's text, and what the default filter matches. */
  label: string;
  /**
   * A quieter run of text after the label, on the same line
   * ("· SST-2029-0416 · Cohort 7"). Matched by the filter when it is a string.
   */
  detail?: React.ReactNode;
  /** The leading glyph or a small `Avatar`. Decorative. */
  icon?: React.ReactNode;
  /**
   * The row's own shortcut, at the end: a string becomes a `Kbd`
   * (`'⌘N'`); pass a `KbdGroup` for a sequence ("G then M").
   */
  shortcut?: React.ReactNode;
  /** Extra words the filter matches (a student ID, a synonym). */
  keywords?: string[];
  /**
   * `danger` for a destructive command. It goes last in its group, after a
   * `separatorBefore`.
   *
   * @default 'default'
   */
  variant?: CommandPaletteItemVariant;
  /** Shown, announced as unavailable, skipped by the arrows and not runnable. */
  disabled?: boolean;
  /** Draw a hairline above this row (before the destructive command). */
  separatorBefore?: boolean;
  /** Runs when the row is chosen (Enter or click), before `onSelect`. */
  onSelect?: (item: CommandPaletteItem) => void;
};

export type CommandPaletteGroup = {
  /** The small caps section label ("Students", "Go to", "Commands"). */
  heading: string;
  items: CommandPaletteItem[];
};

/** The default filter: every word of the query appears in the label, detail or keywords. */
export function commandPaletteFilter(item: CommandPaletteItem, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [item.label, typeof item.detail === 'string' ? item.detail : '', ...(item.keywords ?? [])]
    .join(' ')
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/* ---- CommandPaletteShortcut ----------------------------------------------- */

export type CommandPaletteShortcutProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  /**
   * The letter after the platform modifier.
   *
   * @default 'K'
   */
  hotkey?: string;
};

/**
 * The palette's hotkey as keycaps: ⌘ K on Apple, Ctrl K elsewhere (`KbdMod`
 * decides after mount). Put it in whatever opens the palette.
 */
export const CommandPaletteShortcut = React.forwardRef<HTMLElement, CommandPaletteShortcutProps>(
  function CommandPaletteShortcut({ hotkey = 'K', className, ...props }, ref) {
    return (
      <KbdGroup
        ref={ref}
        separator={null}
        data-slot="command-palette-shortcut"
        // A touch device has no ⌘K to press.
        className={cn('gap-0.5 pointer-coarse:hidden', className)}
        {...props}
      >
        <KbdMod />
        <Kbd>{hotkey.toUpperCase()}</Kbd>
      </KbdGroup>
    );
  },
);
CommandPaletteShortcut.displayName = 'CommandPaletteShortcut';

/* ---- recipes -------------------------------------------------------------- */

export const commandPaletteContentVariants = cva([
  // 18vh from the top, centred with `translate` (its own property) so the
  // entrance can animate `scale` without fighting the centring.
  'fixed top-[18vh] left-1/2 z-dialog -translate-x-1/2',
  // Phones and short screens (a landscape phone, 200% zoom): pinned near the
  // top, clear of the notch, so the keyboard leaves the most room below.
  'max-sm:top-[max(12px,env(safe-area-inset-top,0px))] [@media(max-height:560px)]:top-[max(8px,env(safe-area-inset-top,0px))]',
  'w-[min(560px,92vw)] overflow-hidden',
  // A column that never runs off the screen: the field stays, the list
  // flexes and scrolls (N-03). `vh` where `dvh` is unknown.
  'flex flex-col',
  'max-h-[calc(82vh-16px)] supports-[height:100dvh]:max-h-[calc(82dvh-16px)]',
  'max-sm:max-h-[calc(100vh-24px)] max-sm:supports-[height:100dvh]:max-h-[calc(100dvh-24px)]',
  '[@media(max-height:560px)]:max-h-[calc(100vh-16px)] [@media(max-height:560px)]:supports-[height:100dvh]:max-h-[calc(100dvh-16px)]',
  'rounded-xl border border-border-raised bg-surface-raised text-content shadow-overlay',
  'font-sans outline-none',
  'data-[state=open]:animate-ssx-palette-in data-[state=closed]:animate-ssx-palette-out',
  'motion-reduce:animate-none',
]);

const itemClass = [
  // The row under the keyboard (or the pointer): the HTML's `.menu__item.is-active`.
  'data-[active]:bg-surface-brand-subtle data-[active]:font-semibold data-[active]:text-content-brand',
  'data-[active]:data-[variant=danger]:text-danger-content',
];

/* ---- CommandPalette ------------------------------------------------------- */

export type CommandPaletteProps = {
  /**
   * The rows, in sections. Order is kept; a section with no match is hidden.
   *
   * @default []
   */
  groups?: CommandPaletteGroup[];
  /** Controlled open state. Pair with `onOpenChange`. */
  open?: boolean;
  /**
   * Initial open state when uncontrolled.
   *
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the palette opens or closes (hotkey, trigger, Escape, scrim, a run row). */
  onOpenChange?: (open: boolean) => void;
  /** Controlled query. Pair with `onQueryChange`. */
  query?: string;
  /**
   * Initial query when uncontrolled; the palette returns to it on close.
   *
   * @default ''
   */
  defaultQuery?: string;
  /** Called on every keystroke in the field (fetch remote results here). */
  onQueryChange?: (query: string) => void;
  /** Called when a row is run, after the row's own `onSelect`. */
  onSelect?: (value: string, item: CommandPaletteItem) => void;
  /**
   * Filter `groups` by the query. Turn off when the results come from a
   * server that already filtered them (then pass `loading` while it works).
   *
   * @default true
   */
  shouldFilter?: boolean;
  /**
   * Your own match test.
   *
   * @default commandPaletteFilter (every word, case-insensitive)
   */
  filter?: (item: CommandPaletteItem, query: string) => boolean;
  /**
   * Close after a row runs.
   *
   * @default true
   */
  closeOnSelect?: boolean;
  /**
   * The letter that, with ⌘ (Apple) or Ctrl, toggles the palette from
   * anywhere on the page. `false`: no global hotkey.
   *
   * @default 'k'
   */
  hotkey?: string | false;
  /**
   * The dialog's accessible name (visually hidden) and the listbox's.
   *
   * @default 'Command palette'
   */
  label?: string;
  /**
   * The field's placeholder.
   *
   * @default 'Search…'
   */
  placeholder?: string;
  /**
   * The field's accessible name.
   *
   * @default the placeholder without its ellipsis
   */
  inputLabel?: string;
  /**
   * Results are loading: a spinner row with `loadingText` replaces the
   * empty state.
   *
   * @default false
   */
  loading?: boolean;
  /**
   * The loading row's text.
   *
   * @default 'Searching…'
   */
  loadingText?: string;
  /**
   * The empty state's title, shown when nothing matches.
   *
   * @default 'No matches'
   */
  emptyTitle?: React.ReactNode;
  /** The empty state's advice ("Try a student ID, a module name or a command verb."). */
  emptyDescription?: React.ReactNode;
  /**
   * The empty state's close button. Empty string: none.
   *
   * @default 'Close'
   */
  emptyCloseLabel?: string;
  /**
   * The button that opens the palette. A string becomes a `Button` with a
   * search glyph, the label and `CommandPaletteShortcut`; an element is used
   * as-is (it must accept a ref and `onClick`). Unset: open it with the
   * hotkey or `open`.
   */
  trigger?: React.ReactNode;
  /**
   * The trigger Button's variant, when `trigger` is a string.
   *
   * @default 'secondary'
   */
  triggerVariant?: ButtonVariant;
  /** Classes for the panel, merged last. */
  className?: string;
  /**
   * Where the portal mounts. Defaults to `document.body`, which is themed by
   * the `data-brand` / `data-theme` attributes on `<html>`.
   */
  container?: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>['container'];
};

type Row = { item: CommandPaletteItem; id: string };

/**
 * The palette: an optional trigger, the global hotkey, and the modal panel
 * with its field, grouped results and empty state. `ref` is the panel.
 */
export const CommandPalette = React.forwardRef<HTMLDivElement, CommandPaletteProps>(function CommandPalette(
  {
    groups = [],
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    query: queryProp,
    defaultQuery = '',
    onQueryChange,
    onSelect,
    shouldFilter = true,
    filter = commandPaletteFilter,
    closeOnSelect = true,
    hotkey = 'k',
    label = 'Command palette',
    placeholder = 'Search…',
    inputLabel,
    loading = false,
    loadingText = 'Searching…',
    emptyTitle = 'No matches',
    emptyDescription,
    emptyCloseLabel = 'Close',
    trigger,
    triggerVariant = 'secondary',
    className,
    container,
  },
  ref,
) {
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    caller: 'CommandPalette',
  });
  const [query, setQuery] = useControllableState({
    prop: queryProp,
    defaultProp: defaultQuery,
    onChange: onQueryChange,
    caller: 'CommandPalette',
  });
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  /* The global hotkey. The latest `open` lives in a ref so the listener is
     attached once per hotkey, not once per render. */
  const openRef = React.useRef(open);
  openRef.current = open;
  React.useEffect(() => {
    if (!hotkey) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== hotkey.toLowerCase()) return;
      event.preventDefault();
      setOpen(!openRef.current);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [hotkey, setOpen]);

  /* Filter, then give every visible row a stable id for aria-activedescendant. */
  const q = query ?? '';
  let index = 0;
  const visible = groups
    .map((group, g) => {
      const items = shouldFilter ? group.items.filter((item) => filter(item, q)) : group.items;
      const rows: Row[] = items.map((item) => ({ item, id: `${baseId}-option-${index++}` }));
      return { group, rows, headingId: `${baseId}-group-${g}` };
    })
    .filter((section) => section.rows.length > 0);
  const flat = visible.flatMap((section) => section.rows);
  const enabled = flat.filter((row) => !row.item.disabled);

  /* The active row is a value, so it survives a re-filter when still visible;
     otherwise it falls back to the first runnable row. */
  const [activeValue, setActiveValue] = React.useState<string | null>(null);
  const active = enabled.find((row) => row.item.value === activeValue) ?? enabled[0] ?? null;

  // A new query starts at the top, as cmdk and the APG examples do.
  React.useEffect(() => {
    setActiveValue(null);
  }, [q]);

  // Keep the active row in view while arrowing through a long list.
  const activeId = active?.id;
  React.useEffect(() => {
    if (!open || !activeId) return;
    const node = document.getElementById(activeId);
    if (node && typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest' });
  }, [open, activeId]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      if (queryProp === undefined) setQuery(defaultQuery);
      setActiveValue(null);
    }
  };

  const run = (item: CommandPaletteItem) => {
    if (item.disabled) return;
    item.onSelect?.(item);
    onSelect?.(item.value, item);
    if (closeOnSelect) handleOpenChange(false);
  };

  const move = (delta: number) => {
    if (enabled.length === 0) return;
    const at = active ? enabled.indexOf(active) : -1;
    const next = enabled[(at + delta + enabled.length) % enabled.length];
    if (next) setActiveValue(next.item.value);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        break;
      case 'Home':
      case 'End': {
        // With Ctrl, jump to the first / last row; alone, the caret moves.
        const edge = enabled[event.key === 'Home' ? 0 : enabled.length - 1];
        if (event.ctrlKey && edge) {
          event.preventDefault();
          setActiveValue(edge.item.value);
        }
        break;
      }
      case 'Enter':
        if (active) {
          event.preventDefault();
          run(active.item);
        }
        break;
      default:
    }
  };

  const resolvedInputLabel = inputLabel ?? placeholder.replace(/…$|\.\.\.$/, '');
  const empty = flat.length === 0;

  let triggerNode: React.ReactNode = null;
  if (isRendered(trigger)) {
    triggerNode = (
      <DialogPrimitive.Trigger asChild>
        {React.isValidElement(trigger) ? (
          trigger
        ) : (
          <Button variant={triggerVariant}>
            <SearchGlyph />
            {trigger}
            {hotkey ? <CommandPaletteShortcut hotkey={hotkey} /> : null}
          </Button>
        )}
      </DialogPrimitive.Trigger>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      {triggerNode}
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay
          data-slot="command-palette-overlay"
          className={cn(
            // The ONE modal scrim, as Dialog paints it (alpha in the colour).
            'fixed inset-0 z-overlay bg-surface-overlay-scrim',
            'data-[state=open]:animate-ssx-overlay-in data-[state=closed]:animate-ssx-overlay-out',
            'motion-reduce:animate-none',
          )}
        />
        <DialogPrimitive.Content
          ref={ref}
          data-slot="command-palette"
          // The Button `neutral` contract: a raised surface flips its hover.
          data-elevation="raised"
          aria-modal="true"
          className={cn(commandPaletteContentVariants(), className)}
        >
          <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
          <input
            data-slot="command-palette-input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={active?.id}
            aria-label={resolvedInputLabel}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={placeholder}
            value={q}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            className={cn(
              // The HTML's `.palette__input`: 52px, no box, a hairline under it.
              'block h-[52px] w-full shrink-0 border-0 border-b border-border-decorative bg-transparent px-5',
              'font-sans text-md text-content placeholder:text-field-placeholder outline-none',
              // The field always has focus while open; the HTML draws that as a brand hairline.
              'focus-visible:border-border-focus',
              '[&::-webkit-search-cancel-button]:appearance-none',
            )}
          />
          <div
            data-slot="command-palette-list"
            className="max-h-80 min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 max-sm:max-h-none [@media(max-height:560px)]:max-h-none"
          >
            <div role="listbox" id={listboxId} aria-label={label} data-slot="command-palette-listbox">
              {visible.map(({ group, rows, headingId }) => (
                <div key={headingId} role="group" aria-labelledby={headingId} data-slot="command-palette-group">
                  <div
                    id={headingId}
                    data-slot="command-palette-group-heading"
                    className="px-3 pt-2 pb-1 text-xs font-bold tracking-wide text-content-secondary uppercase"
                  >
                    {group.heading}
                  </div>
                  {rows.map(({ item, id }) => {
                    const isActive = active?.id === id;
                    const variant = item.variant ?? 'default';
                    return (
                      <React.Fragment key={id}>
                        {item.separatorBefore ? (
                          <div
                            aria-hidden="true"
                            data-slot="command-palette-separator"
                            className="my-1 h-px bg-border-decorative"
                          />
                        ) : null}
                        <div
                          id={id}
                          role="option"
                          aria-selected={isActive}
                          aria-disabled={item.disabled || undefined}
                          data-slot="command-palette-item"
                          data-value={item.value}
                          data-variant={variant}
                          data-active={isActive ? '' : undefined}
                          data-disabled={item.disabled ? '' : undefined}
                          className={cn(menuItemVariants({ variant }), itemClass)}
                          // Pointer and keyboard share one active row, as in the HTML.
                          onPointerMove={() => {
                            if (!item.disabled && !isActive) setActiveValue(item.value);
                          }}
                          // Keep focus in the field.
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => run(item)}
                        >
                          {isRendered(item.icon) ? (
                            <span
                              data-slot="command-palette-item-icon"
                              aria-hidden="true"
                              className="flex shrink-0 items-center [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-icon-md"
                            >
                              {item.icon}
                            </span>
                          ) : null}
                          <span data-slot="command-palette-item-label" className="min-w-0 flex-1">
                            {item.label}
                            {isRendered(item.detail) ? (
                              <>
                                {' '}
                                <span
                                  data-slot="command-palette-item-detail"
                                  className="text-sm font-regular text-content-secondary"
                                >
                                  {item.detail}
                                </span>
                              </>
                            ) : null}
                          </span>
                          {isRendered(item.shortcut) ? (
                            <span
                              data-slot="command-palette-item-shortcut"
                              // No keyboard on a touch device: the hint is noise.
                              className="ms-auto flex shrink-0 items-center font-regular pointer-coarse:hidden"
                            >
                              {typeof item.shortcut === 'string' ? <Kbd>{item.shortcut}</Kbd> : item.shortcut}
                            </span>
                          ) : isActive ? (
                            // The Enter hint on the active row, as the HTML pins on "Aarav Krishnan".
                            <Kbd
                              aria-hidden="true"
                              data-slot="command-palette-enter-hint"
                              className="ms-auto pointer-coarse:hidden"
                            >
                              ↵
                            </Kbd>
                          ) : null}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              ))}
            </div>
            {empty && loading ? (
              <div
                role="status"
                data-slot="command-palette-loading"
                className="flex items-center gap-2 px-3 py-2 text-sm text-content-secondary"
              >
                <Spinner size="sm" label={null} />
                <span>{loadingText}</span>
              </div>
            ) : null}
            {empty && !loading ? (
              <EmptyState data-slot="command-palette-empty" role="status">
                <EmptyStateArt>
                  <SearchGlyph />
                </EmptyStateArt>
                <EmptyStateTitle as="p" size="3">
                  {emptyTitle}
                </EmptyStateTitle>
                {isRendered(emptyDescription) ? <EmptyStateDescription>{emptyDescription}</EmptyStateDescription> : null}
                {emptyCloseLabel ? (
                  <EmptyStateActions>
                    <DialogPrimitive.Close asChild>
                      <Button variant="tertiary" size="sm">
                        {emptyCloseLabel}
                      </Button>
                    </DialogPrimitive.Close>
                  </EmptyStateActions>
                ) : null}
              </EmptyState>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
});
CommandPalette.displayName = 'CommandPalette';
