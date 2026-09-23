import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Button } from '../Button';
import { Heading, type HeadingElement } from '../Heading';
import { Text } from '../Text';

/* ---------------------------------------------------------------------------
 * EmptyState
 *
 * What fills a region that has nothing in it. There are three different
 * reasons for emptiness, and each needs its own words and its own action:
 *
 *   first run   nothing created yet     invitational, a primary "Create…"
 *   no results  this query missed       neutral, "Clear all filters"
 *   error       WE failed, not the user plain, a retry and a reference code;
 *                                       the art disc goes `artTone="danger"`
 *
 * Shipping one generic "No data" for all three is the usual way this component
 * goes wrong. Delight is allowed on an empty state and never on an error.
 *
 * The art disc (`EmptyStateArt`) is the HTML's `.empty__art`: 96px, a 48px
 * glyph, brand-subtle by default, with the `--danger / --success / --warning
 * / --info / --neutral / --solid` family as `tone`, so the glyph never
 * contradicts the state it announces (no brand-green error mark on a red
 * disc). It is decorative (`aria-hidden`): the title says what happened.
 *
 *   <EmptyState icon={<UsersThree />} title="No cohorts yet"
 *     description="Create your first one…" actionLabel="Create a cohort" actionHref="/cohorts/new" />
 *
 *   <EmptyState>
 *     <EmptyStateArt tone="danger"><WarningCircle /></EmptyStateArt>
 *     <EmptyStateTitle>We couldn't load the placement report</EmptyStateTitle>
 *     <EmptyStateDescription>…quote reference PLC-5502 to support.</EmptyStateDescription>
 *     <EmptyStateActions><Button onClick={retry}>Try again</Button></EmptyStateActions>
 *   </EmptyState>
 *
 * Server component: no hooks, no handlers of its own. (The flat action is a
 * link; a button with a handler goes in `actions` from a client component.)
 * ------------------------------------------------------------------------- */

export const emptyStateVariants = cva(
  'grid justify-items-center gap-3 px-6 py-12 text-center font-sans',
);

export const emptyStateArtVariants = cva(
  [
    'grid size-24 shrink-0 place-content-center rounded-full',
    "[&_svg:not([class*='size-'])]:size-icon-2xl [&_svg]:shrink-0",
  ],
  {
    variants: {
      tone: {
        brand: 'bg-surface-brand-subtle text-content-brand',
        neutral: 'bg-surface-active text-content-secondary',
        info: 'bg-info-surface text-info-icon',
        success: 'bg-success-surface text-success-icon',
        warning: 'bg-warning-surface text-warning-icon',
        danger: 'bg-danger-surface text-danger-icon',
        solid: 'bg-surface-brand-solid text-content-on-brand-solid',
      },
    },
    defaultVariants: { tone: 'brand' },
  },
);

/** String union, so a Storyblok option value can be passed straight in. */
export type EmptyStateArtTone = NonNullable<VariantProps<typeof emptyStateArtVariants>['tone']>;

/* ---- parts ---------------------------------------------------------------- */

export type EmptyStateArtProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * The disc's colour family. `brand` the neutral-positive default (first run,
   * no results) · `danger` an error · `success` / `warning` / `info` the other
   * statuses · `neutral` a quiet grey · `solid` the brand fill, for a disc on
   * a brand-subtle ground.
   *
   * @default 'brand'
   */
  tone?: EmptyStateArtTone;
};

/** The 96px disc behind the glyph. Pass the svg as the child; it is sized to 48px. */
export const EmptyStateArt = React.forwardRef<HTMLDivElement, EmptyStateArtProps>(
  function EmptyStateArt({ className, tone = 'brand', ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="empty-state-art"
        data-tone={tone}
        aria-hidden="true"
        className={cn(emptyStateArtVariants({ tone }), className)}
        {...props}
      />
    );
  },
);
EmptyStateArt.displayName = 'EmptyStateArt';

export type EmptyStateTitleProps = Omit<React.ComponentPropsWithoutRef<typeof Heading>, 'as'> & {
  /**
   * The outline level. Pick it for the page's outline; the size stays `2`.
   *
   * @default 'h3'
   */
  as?: HeadingElement;
};

/** What is (not) here, in words: "No cohorts yet". A `Heading`, size 2. */
export const EmptyStateTitle = React.forwardRef<HTMLHeadingElement, EmptyStateTitleProps>(
  function EmptyStateTitle({ as = 'h3', size = '2', ...props }, ref) {
    return <Heading ref={ref} as={as} size={size} data-slot="empty-state-title" {...props} />;
  },
);
EmptyStateTitle.displayName = 'EmptyStateTitle';

export type EmptyStateDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/** Why it is empty and what to do: 13px secondary. */
export const EmptyStateDescription = React.forwardRef<HTMLParagraphElement, EmptyStateDescriptionProps>(
  function EmptyStateDescription({ className, ...props }, ref) {
    return (
      <Text
        ref={ref}
        as="p"
        size="sm"
        tone="secondary"
        data-slot="empty-state-description"
        className={cn('m-0', className)}
        {...props}
      />
    );
  },
);
EmptyStateDescription.displayName = 'EmptyStateDescription';

export type EmptyStateActionsProps = React.HTMLAttributes<HTMLDivElement>;

/** The way forward: one primary action, optionally a tertiary beside it. */
export const EmptyStateActions = React.forwardRef<HTMLDivElement, EmptyStateActionsProps>(
  function EmptyStateActions({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="empty-state-actions"
        className={cn('flex flex-wrap items-center justify-center gap-2', className)}
        {...props}
      />
    );
  },
);
EmptyStateActions.displayName = 'EmptyStateActions';

/* ---- root ----------------------------------------------------------------- */

/** String union for the flat action's button variant. */
export type EmptyStateActionVariant = 'primary' | 'secondary' | 'tertiary';

export type EmptyStateProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  /** The glyph for the art disc (your svg, e.g. a Phosphor icon). Omit it for no art. */
  icon?: React.ReactNode;
  /**
   * The art disc's tone. `danger` for an error state.
   *
   * @default 'brand'
   */
  artTone?: EmptyStateArtTone;
  /** What is (not) here: "No students match that search". Renders `EmptyStateTitle`. */
  title?: React.ReactNode;
  /**
   * The title's outline level.
   *
   * @default 'h3'
   */
  titleAs?: HeadingElement;
  /** Why, and what to do next. Renders `EmptyStateDescription`. */
  description?: React.ReactNode;
  /** Action elements (buttons), rendered in `EmptyStateActions`. Wins over `actionLabel`. */
  actions?: React.ReactNode;
  /** Flat action: the label of a link styled as a button. Needs `actionHref`. */
  actionLabel?: string;
  /** Flat action: where `actionLabel` goes. */
  actionHref?: string;
  /**
   * Flat action: the button variant. `primary` to create the first thing,
   * `secondary` to clear filters.
   *
   * @default 'primary'
   */
  actionVariant?: EmptyStateActionVariant;
};

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  {
    className,
    icon,
    artTone = 'brand',
    title,
    titleAs = 'h3',
    description,
    actions,
    actionLabel,
    actionHref,
    actionVariant = 'primary',
    children,
    ...props
  },
  ref,
) {
  const flatActions =
    actions ??
    (actionLabel && actionHref ? (
      <Button asChild variant={actionVariant}>
        <a href={actionHref}>{actionLabel}</a>
      </Button>
    ) : null);

  return (
    <div ref={ref} data-slot="empty-state" className={cn(emptyStateVariants(), className)} {...props}>
      {icon != null && icon !== false ? <EmptyStateArt tone={artTone}>{icon}</EmptyStateArt> : null}
      {title != null && title !== '' ? <EmptyStateTitle as={titleAs}>{title}</EmptyStateTitle> : null}
      {description != null && description !== '' ? (
        <EmptyStateDescription>{description}</EmptyStateDescription>
      ) : null}
      {flatActions ? <EmptyStateActions>{flatActions}</EmptyStateActions> : null}
      {children}
    </div>
  );
});
EmptyState.displayName = 'EmptyState';
