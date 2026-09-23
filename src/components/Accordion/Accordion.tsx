'use client';

// Client: Radix Accordion keeps the open state and attaches the keyboard
// handlers (arrows / Home / End between headers).
import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Accordion
 *
 * Stacked headers that each reveal a panel, for content most people will skip
 * and a few will need: FAQs and secondary detail. Do NOT hide anything a
 * person must read to finish the task — a fee deadline behind a chevron is a
 * fee deadline nobody saw.
 *
 * Each header is a real <button> inside a heading (`headingLevel`, default
 * h3), so the accordion is a list of headings for a screen-reader user and a
 * set of controls for a keyboard user. The chevron is aria-hidden:
 * `aria-expanded` already says which way it points.
 *
 * `type="multiple"` is the default, because that is the HTML contract: every
 * header toggles on its own. `type="single"` keeps one open at a time, and is
 * `collapsible` (the open one can be closed) unless you say otherwise.
 *
 * The panel animates its height from Radix's measured
 * `--radix-accordion-content-height` (keyframes in theme.css, batch M2), so it
 * opens to its real height with no hard-coded max-height, and it does not
 * animate at all under `prefers-reduced-motion`.
 *
 * Two APIs, same output:
 *   compound  <Accordion><AccordionItem value="fees"><AccordionTrigger>…
 *   flat      <Accordion items={[{ title: 'What does it cost?', content: '…' }]} />
 * The flat form maps one-to-one onto a Storyblok FAQ blok (title/content
 * strings); the compound form is primary.
 * ------------------------------------------------------------------------- */

/** `multiple` every item toggles on its own · `single` one open at a time. */
export type AccordionType = 'single' | 'multiple';
/** The heading element that wraps each trigger. Choose it for the page outline. */
export type AccordionHeadingLevel = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/** One item of the flat `items` form. */
export interface AccordionItemData {
  /** Stable id for `value` / `defaultValue`. @default `item-<index>` */
  value?: string;
  /** The header text. */
  title: React.ReactNode;
  /** The panel content: a string or any nodes. */
  content: React.ReactNode;
  /** Shown, but cannot be toggled. @default false */
  disabled?: boolean;
}

type RootDivProps = Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'defaultValue' | 'value' | 'onChange' | 'dir'
>;

export type AccordionProps = RootDivProps & {
  /**
   * `multiple` each item toggles independently (the HTML's behaviour) ·
   * `single` opening one closes the others.
   *
   * @default 'multiple'
   */
  type?: AccordionType;
  /**
   * `single` only: the open item can be closed again, leaving none open.
   *
   * @default true
   */
  collapsible?: boolean;
  /**
   * Controlled open item(s). A string for `single`, an array for `multiple`
   * (a string is accepted there too and treated as one item).
   */
  value?: string | string[];
  /** Uncontrolled initial open item(s). Same shape as `value`. */
  defaultValue?: string | string[];
  /** Called with the new open item: a string for `single`, a string[] for `multiple`. */
  onValueChange?: (value: string | string[]) => void;
  /**
   * Disables every item.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Reading direction, for the arrow keys.
   *
   * @default 'ltr'
   */
  dir?: 'ltr' | 'rtl';
  /**
   * Flat form: render these items instead of `children`. Each maps to an
   * `AccordionItem` + `AccordionTrigger` + `AccordionContent`.
   */
  items?: AccordionItemData[];
  /**
   * Flat form: the heading level wrapping each trigger.
   *
   * @default 'h3'
   */
  headingLevel?: AccordionHeadingLevel;
};

const toSingle = (v: string | string[] | undefined) =>
  v === undefined ? undefined : Array.isArray(v) ? (v[0] ?? '') : v;
const toMultiple = (v: string | string[] | undefined) =>
  v === undefined ? undefined : Array.isArray(v) ? v : v ? [v] : [];

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  {
    className,
    type = 'multiple',
    collapsible = true,
    value,
    defaultValue,
    onValueChange,
    items,
    headingLevel = 'h3',
    children,
    ...props
  },
  ref,
) {
  const shared = {
    ref,
    'data-slot': 'accordion',
    'data-type': type,
    className: cn(
      'overflow-hidden rounded-lg border border-border-decorative bg-surface font-sans',
      className,
    ),
    ...props,
  };
  const content = items
    ? items.map((item, i) => {
        const itemValue = item.value ?? `item-${i}`;
        return (
          <AccordionItem key={itemValue} value={itemValue} disabled={item.disabled}>
            <AccordionTrigger headingLevel={headingLevel}>{item.title}</AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        );
      })
    : children;

  if (type === 'single') {
    return (
      <AccordionPrimitive.Root
        {...shared}
        type="single"
        collapsible={collapsible}
        value={toSingle(value)}
        defaultValue={toSingle(defaultValue)}
        onValueChange={onValueChange}
      >
        {content}
      </AccordionPrimitive.Root>
    );
  }
  return (
    <AccordionPrimitive.Root
      {...shared}
      type="multiple"
      value={toMultiple(value)}
      defaultValue={toMultiple(defaultValue)}
      onValueChange={onValueChange}
    >
      {content}
    </AccordionPrimitive.Root>
  );
});
Accordion.displayName = 'Accordion';

/* ---- AccordionItem -------------------------------------------------------- */

export type AccordionItemProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      data-slot="accordion-item"
      className={cn('not-first:border-t not-first:border-border-decorative', className)}
      {...props}
    />
  );
});
AccordionItem.displayName = 'AccordionItem';

/* ---- AccordionTrigger ----------------------------------------------------- */

/** Phosphor 2.1.1 `caret-down` bold, the HTML's `#ph-chevron-down-bold`. */
function ChevronGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z" />
    </svg>
  );
}

export type AccordionTriggerProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Trigger
> & {
  /**
   * The heading element around the button. Pick it for the page outline:
   * under a section `h2`, an FAQ's questions are `h3`.
   *
   * @default 'h3'
   */
  headingLevel?: AccordionHeadingLevel;
};

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(function AccordionTrigger({ className, headingLevel = 'h3', children, ...props }, ref) {
  return (
    <AccordionPrimitive.Header asChild>
      {React.createElement(
        headingLevel,
        { 'data-slot': 'accordion-header', className: 'm-0 flex' },
        <AccordionPrimitive.Trigger
          ref={ref}
          data-slot="accordion-trigger"
          className={cn(
            'm-0 flex w-full flex-1 cursor-pointer items-center justify-between gap-4',
            'border-0 bg-transparent p-4 text-left',
            'font-sans text-md leading-body font-semibold text-content',
            'transition-colors duration-[var(--motion-duration-instant)] ease-[var(--motion-easing-productive-in-out)]',
            'hover:bg-surface-hover',
            // Inset ring: the root clips its corners (overflow hidden), so an
            // outside ring would be cut off on the first and last header.
            'outline-none focus-visible:ring-[3px] focus-visible:ring-border-focus/50 focus-visible:ring-inset',
            'disabled:cursor-not-allowed disabled:text-content-disabled disabled:hover:bg-transparent',
            'motion-reduce:transition-none',
            '[&>[data-slot=accordion-chevron]]:size-icon-sm [&>[data-slot=accordion-chevron]]:shrink-0',
            '[&>[data-slot=accordion-chevron]]:transition-transform',
            '[&>[data-slot=accordion-chevron]]:duration-[var(--motion-duration-normal)]',
            '[&>[data-slot=accordion-chevron]]:ease-[var(--motion-easing-productive-in-out)]',
            'motion-reduce:[&>[data-slot=accordion-chevron]]:transition-none',
            'data-[state=open]:[&>[data-slot=accordion-chevron]]:rotate-180',
            className,
          )}
          {...props}
        >
          {children}
          <ChevronGlyph data-slot="accordion-chevron" />
        </AccordionPrimitive.Trigger>,
      )}
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = 'AccordionTrigger';

/* ---- AccordionContent ----------------------------------------------------- */

export type AccordionContentProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Content
>;

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      data-slot="accordion-content"
      className={cn(
        // Body copy follows the responsive body token (15px, 16px from md), as
        // the HTML panel inherits it from <body>.
        'overflow-hidden font-sans text-(length:--type-body-size) leading-(--type-body-lh) text-content-secondary',
        'data-[state=open]:animate-ssx-accordion-down data-[state=closed]:animate-ssx-accordion-up',
        'motion-reduce:animate-none',
        className,
      )}
      {...props}
    >
      {/* Padding lives here, not on the animated element: padding on the part
          whose height animates would give every closed panel a floor. */}
      <div data-slot="accordion-content-inner" className="grid gap-3 px-4 pt-1 pb-4 [&>*]:m-0">
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = 'AccordionContent';
