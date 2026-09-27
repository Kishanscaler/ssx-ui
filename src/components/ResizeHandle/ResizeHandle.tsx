'use client';

// Client: ResizeGroup keeps the split in state (and context), ResizePane
// generates an id, and ResizeHandle attaches pointer and keyboard handlers.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { useId } from '../../lib/use-id';

/* ---------------------------------------------------------------------------
 * ResizeGroup · ResizePane · ResizeHandle
 *
 * A draggable divider that lets a person rebalance two adjacent panes. Use it
 * only where the ideal split genuinely differs per person or per task (the
 * capstone code editor, the admissions reviewer who widens the applicant list
 * to scan and narrows it to read), never as a substitute for choosing a good
 * default. On a marketing page or a student dashboard a resizable pane is an
 * unanswered design question handed to the reader.
 *
 *   <ResizeGroup defaultValue={32}>
 *     <ResizePane>file tree</ResizePane>
 *     <ResizeHandle aria-label="Resize the file tree" />
 *     <ResizePane>editor</ResizePane>
 *   </ResizeGroup>
 *
 * MARKUP ORDER IS LOAD-BEARING, as in the preview: start pane, handle, growing
 * pane, as direct children of the group. `value` is the START pane's share,
 * in percent (0-100) of the space the two panes split. The panes are sized by
 * flex-grow ratios (value : 100 - value) from a zero basis, not by a
 * percentage width, so a `vertical` group works with only a min-height (a
 * percentage flex-basis in a column needs a definite height and silently does
 * nothing without one) and the two panes always add up exactly.
 *
 * `direction` is the axis the PANES are laid out on (as in
 * react-resizable-panels): `horizontal` side by side, `vertical` stacked. The
 * handle's `aria-orientation` is the other one: panes side by side are split
 * by a vertical separator.
 *
 * THE HANDLE IS A WAI-ARIA WINDOW SPLITTER. It owns `role="separator"`,
 * `tabIndex`, `aria-orientation`, `aria-valuemin/max` and a live
 * `aria-valuenow`, and it sets `aria-controls` to the start pane's id (read
 * from the DOM after mount: the previous sibling, which is always a
 * ResizePane with an id). The caller writes only an `aria-label` saying what
 * is being resized. Keys (the preview's, plus Enter from the APG):
 *   ← / →  (↑ / ↓ in a vertical group)   move by `step` (2%)
 *   Shift + arrow                         move by `largeStep` (10%)
 *   Home / End                            jump to `min` / `max`
 *   Enter                                 collapse / restore (`collapsible`)
 * In a right-to-left page ← grows the start pane, because the start pane is
 * on the right.
 *
 * POINTER: one path for mouse, trackpad, pen and touch, with pointer capture,
 * so a drag keeps tracking outside the handle and ends wherever it is
 * released. The drag is relative (grab the handle off-centre and it does not
 * jump). `touch-action: none` so a touch drag does not scroll the page, and a
 * 44px invisible hit area on a coarse pointer (`touch-target`; the handle is
 * 8px drawn).
 *
 * The panes have `overflow: auto` and `min-width: 0`: their content scrolls
 * rather than holding the split open. A collapsed start pane is
 * `visibility: hidden`, so what is inside it leaves the tab order.
 *
 * Outside a ResizeGroup the handle has nothing to resize, so it renders as a
 * static, unfocusable separator rather than a focusable one that does nothing
 * on arrow keys (which announces a contract it does not honour).
 *
 * Two panes per group. A three-way split is two groups nested.
 * ------------------------------------------------------------------------- */

/** The axis the panes are laid out on: `horizontal` side by side, `vertical` stacked. */
export type ResizeDirection = 'horizontal' | 'vertical';

interface ResizeContextValue {
  direction: ResizeDirection;
  value: number;
  min: number;
  max: number;
  step: number;
  largeStep: number;
  collapsible: boolean;
  disabled: boolean;
  groupRef: React.RefObject<HTMLDivElement | null>;
  /** Clamps to [min, max] (0 is allowed when collapsible) and stores. */
  setValue: (next: number) => void;
  commit: () => void;
  toggleCollapsed: () => void;
}

const ResizeContext = React.createContext<ResizeContextValue | null>(null);

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/* ---------------------------------------------------------------- group */

export const resizeGroupVariants = cva(
  [
    'flex min-h-40 w-full min-w-0 overflow-hidden rounded-lg border border-border-decorative',
    // A collapsed start pane is out of the tab order, not just 0px wide.
    'data-collapsed:[&>[data-slot=resize-pane]:first-child]:invisible',
  ],
  {
    variants: {
      direction: {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      },
    },
    defaultVariants: { direction: 'horizontal' },
  },
);

export type ResizeGroupProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> & {
  /**
   * The axis the panes sit on. `horizontal` side by side (a file tree beside
   * an editor), `vertical` stacked (an editor above a test console).
   *
   * @default 'horizontal'
   */
  direction?: ResizeDirection;
  /** The start pane's share in percent, controlled. Pair with `onValueChange`. */
  value?: number;
  /**
   * The start pane's initial share in percent, uncontrolled.
   *
   * @default 32
   */
  defaultValue?: number;
  /** Called on every change: each pointer move and each key press. */
  onValueChange?: (value: number) => void;
  /**
   * Called once a change is finished: pointer released, or a key pressed.
   * The place to persist a person's split.
   */
  onValueCommit?: (value: number) => void;
  /**
   * The smallest share the start pane can be dragged or stepped to.
   *
   * @default 20
   */
  min?: number;
  /**
   * The largest share the start pane can be dragged or stepped to.
   *
   * @default 80
   */
  max?: number;
  /**
   * The arrow-key step, in percent.
   *
   * @default 2
   */
  step?: number;
  /**
   * The Shift + arrow step, in percent.
   *
   * @default 10
   */
  largeStep?: number;
  /**
   * Enter on the handle collapses the start pane to 0 and restores it to the
   * previous split. `aria-valuemin` becomes 0 so the collapsed state is a
   * reportable value.
   *
   * @default false
   */
  collapsible?: boolean;
  /**
   * Freeze the split: the handle leaves the tab order and ignores the pointer.
   *
   * @default false
   */
  disabled?: boolean;
};

export const ResizeGroup = React.forwardRef<HTMLDivElement, ResizeGroupProps>(function ResizeGroup(
  {
    className,
    style,
    direction = 'horizontal',
    value: valueProp,
    defaultValue = 32,
    onValueChange,
    onValueCommit,
    min: minProp = 20,
    max: maxProp = 80,
    step = 2,
    largeStep = 10,
    collapsible = false,
    disabled = false,
    ...props
  },
  forwardedRef,
) {
  const min = clamp(Math.min(minProp, maxProp), 0, 100);
  const max = clamp(Math.max(minProp, maxProp), 0, 100);
  const groupRef = React.useRef<HTMLDivElement>(null);
  const ref = useComposedRefs(forwardedRef, groupRef);

  const [raw, setRaw] = useControllableState<number>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange,
    caller: 'ResizeGroup',
  });
  const collapsed = collapsible && raw === 0;
  const value = collapsed ? 0 : clamp(raw, min, max);

  // The latest value, for commit and restore without stale closures.
  const valueRef = React.useRef(value);
  valueRef.current = value;
  // Where Enter restores a collapsed pane to.
  const restoreRef = React.useRef(collapsed ? clamp(defaultValue, min, max) : value);

  const ctx = React.useMemo<ResizeContextValue>(
    () => ({
      direction,
      value,
      min,
      max,
      step,
      largeStep,
      collapsible,
      disabled,
      groupRef,
      setValue: (next) => {
        const v = collapsible && next === 0 ? 0 : clamp(next, min, max);
        if (v !== 0) restoreRef.current = v;
        valueRef.current = v;
        setRaw(v);
      },
      commit: () => onValueCommit?.(valueRef.current),
      toggleCollapsed: () => {
        if (!collapsible) return;
        const v = valueRef.current === 0 ? restoreRef.current : 0;
        valueRef.current = v;
        setRaw(v);
        onValueCommit?.(v);
      },
    }),
    [direction, value, min, max, step, largeStep, collapsible, disabled, setRaw, onValueCommit],
  );

  return (
    <ResizeContext.Provider value={ctx}>
      <div
        ref={ref}
        data-slot="resize-group"
        data-direction={direction}
        data-collapsed={collapsed ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        className={cn(resizeGroupVariants({ direction }), className)}
        style={{ ['--ssx-resize-size' as string]: String(value), ...style }}
        {...props}
      />
    </ResizeContext.Provider>
  );
});
ResizeGroup.displayName = 'ResizeGroup';

/* ----------------------------------------------------------------- pane */

export const resizePaneVariants = cva([
  'min-h-0 min-w-0 shrink basis-0 overflow-auto',
  // flex-grow ratios: the start pane takes `value`, the last one the rest.
  // The fallback keeps a pane rendered outside a group from collapsing to 0.
  'first:grow-[var(--ssx-resize-size,50)] last:grow-[calc(100_-_var(--ssx-resize-size,50))]',
]);

export type ResizePaneProps = React.HTMLAttributes<HTMLDivElement>;

export const ResizePane = React.forwardRef<HTMLDivElement, ResizePaneProps>(function ResizePane(
  { className, id: idProp, ...props },
  ref,
) {
  // Always carries an id, so the handle beside it can point aria-controls here.
  const id = useId(idProp);
  return <div ref={ref} id={id} data-slot="resize-pane" className={cn(resizePaneVariants(), className)} {...props} />;
});
ResizePane.displayName = 'ResizePane';

/* --------------------------------------------------------------- handle */

export const resizeHandleVariants = cva(
  [
    'relative z-raised flex shrink-0 grow-0 items-center justify-center bg-surface-sunken',
    'touch-none select-none outline-none touch-target',
    'transition-colors duration-[var(--motion-duration-instant)] ease-[var(--motion-easing-productive-in-out)] motion-reduce:transition-none',
    'focus-visible:ring-halo focus-visible:ring-focus-halo',
    'data-interactive:hover:bg-surface-hover data-dragging:bg-surface-active',
    // The grip: a 2 x 24px pill, darker while the handle is in use.
    '[&>[data-slot=resize-handle-grip]]:rounded-full [&>[data-slot=resize-handle-grip]]:bg-border-strong',
    'focus-visible:[&>[data-slot=resize-handle-grip]]:bg-border-focus data-dragging:[&>[data-slot=resize-handle-grip]]:bg-border-focus',
  ],
  {
    variants: {
      direction: {
        // Panes side by side: a vertical bar between them.
        horizontal: [
          'w-2 self-stretch border-x border-border-decorative',
          '[&>[data-slot=resize-handle-grip]]:h-6 [&>[data-slot=resize-handle-grip]]:w-0.5',
        ],
        // Panes stacked: a horizontal bar.
        vertical: [
          'h-2 self-stretch border-y border-border-decorative',
          '[&>[data-slot=resize-handle-grip]]:h-0.5 [&>[data-slot=resize-handle-grip]]:w-6',
        ],
      },
      interactive: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { direction: 'horizontal', interactive: true, className: 'cursor-col-resize' },
      { direction: 'vertical', interactive: true, className: 'cursor-row-resize' },
    ],
    defaultVariants: { direction: 'horizontal', interactive: true },
  },
);

export type ResizeHandleProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /**
   * What is being resized, read by a screen reader when the handle takes
   * focus: "Resize the capstone file tree". Required in practice (or
   * `aria-labelledby`): a separator with no name is announced as nothing.
   */
  'aria-label'?: string;
};

interface DragState {
  pointerId: number;
  origin: number;
  startValue: number;
  total: number;
  sign: 1 | -1;
}

export const ResizeHandle = React.forwardRef<HTMLDivElement, ResizeHandleProps>(function ResizeHandle(
  {
    className,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    'aria-controls': ariaControlsProp,
    ...props
  },
  forwardedRef,
) {
  const ctx = React.useContext(ResizeContext);
  const handleRef = React.useRef<HTMLDivElement>(null);
  const ref = useComposedRefs(forwardedRef, handleRef);
  const drag = React.useRef<DragState | null>(null);
  const [dragging, setDragging] = React.useState(false);

  // aria-controls: the start pane is the previous sibling (markup order is
  // the contract). Read after mount; a caller's aria-controls wins.
  const [controls, setControls] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    const prev = handleRef.current?.previousElementSibling;
    setControls(prev && prev.id ? prev.id : undefined);
  }, []);

  const direction: ResizeDirection = ctx?.direction ?? 'horizontal';
  const interactive = ctx != null && !ctx.disabled;

  const isRtl = () => {
    const group = ctx?.groupRef.current;
    return !!group && typeof window !== 'undefined' && window.getComputedStyle(group).direction === 'rtl';
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !ctx || ctx.disabled) return;
    const vertical = ctx.direction === 'vertical';
    const decKey = vertical ? 'ArrowUp' : 'ArrowLeft';
    const incKey = vertical ? 'ArrowDown' : 'ArrowRight';
    const flip = !vertical && isRtl() ? -1 : 1;
    const amount = event.shiftKey ? ctx.largeStep : ctx.step;
    let next: number | null = null;
    if (event.key === decKey || event.key === incKey) {
      const delta = (event.key === incKey ? amount : -amount) * flip;
      // Collapsed and asked to shrink further: stay collapsed.
      if (ctx.value === 0 && delta < 0) {
        event.preventDefault();
        return;
      }
      next = ctx.value + delta;
    } else if (event.key === 'Home') {
      next = ctx.min;
    } else if (event.key === 'End') {
      next = ctx.max;
    } else if (event.key === 'Enter' && ctx.collapsible) {
      event.preventDefault();
      ctx.toggleCollapsed();
      return;
    }
    if (next == null) return;
    event.preventDefault();
    // From collapsed, a step re-opens at `min`, never at a value under it.
    ctx.setValue(ctx.value === 0 ? Math.max(next, ctx.min) : next);
    ctx.commit();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || !ctx || ctx.disabled) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const group = ctx.groupRef.current;
    const handle = event.currentTarget;
    if (!group) return;
    const vertical = ctx.direction === 'vertical';
    const g = group.getBoundingClientRect();
    const h = handle.getBoundingClientRect();
    const total = vertical ? g.height - h.height : g.width - h.width;
    if (!(total > 0)) return;
    // No text selection while dragging; keep keyboard focus on the handle.
    event.preventDefault();
    handle.focus();
    handle.setPointerCapture?.(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      origin: vertical ? event.clientY : event.clientX,
      startValue: ctx.value,
      total,
      sign: !vertical && isRtl() ? -1 : 1,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    const d = drag.current;
    if (!d || !ctx || event.pointerId !== d.pointerId) return;
    const pos = ctx.direction === 'vertical' ? event.clientY : event.clientX;
    const next = d.startValue + (((pos - d.origin) * d.sign) / d.total) * 100;
    // A drag never collapses (that is Enter's job); it clamps to [min, max].
    ctx.setValue(clamp(next, ctx.min, ctx.max));
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture?.(d.pointerId)) {
      event.currentTarget.releasePointerCapture(d.pointerId);
    }
    ctx?.commit();
  };

  if (!ctx) {
    // Nothing to resize: a static separator, not a focusable promise.
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="vertical"
        data-slot="resize-handle"
        data-direction={direction}
        className={cn(resizeHandleVariants({ direction, interactive: false }), className)}
        {...props}
      >
        <span aria-hidden="true" data-slot="resize-handle-grip" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="separator"
      tabIndex={ctx.disabled ? -1 : 0}
      aria-orientation={ctx.direction === 'horizontal' ? 'vertical' : 'horizontal'}
      aria-valuenow={Math.round(ctx.value)}
      aria-valuemin={ctx.collapsible ? 0 : ctx.min}
      aria-valuemax={ctx.max}
      aria-controls={ariaControlsProp ?? controls}
      aria-disabled={ctx.disabled || undefined}
      data-slot="resize-handle"
      data-direction={ctx.direction}
      data-interactive={interactive ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
      className={cn(resizeHandleVariants({ direction: ctx.direction, interactive }), className)}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => {
        onPointerUp?.(e);
        endDrag(e);
      }}
      onPointerCancel={(e) => {
        onPointerCancel?.(e);
        endDrag(e);
      }}
      onLostPointerCapture={(e) => {
        onLostPointerCapture?.(e);
        endDrag(e);
      }}
      {...props}
    >
      <span aria-hidden="true" data-slot="resize-handle-grip" />
    </div>
  );
});
ResizeHandle.displayName = 'ResizeHandle';
