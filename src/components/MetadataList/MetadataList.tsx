import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * MetadataList
 *
 * Key-value facts about ONE object, in a fixed order, read far more often than
 * edited: an application record, a cohort's details. A real `<dl>`: the
 * term/description relationship is the whole point, and a grid of divs throws
 * it away. Not for editable fields (that is a form of `Field`s).
 *
 *   inline   term left (a 140px minimum, so every value starts at the same x),
 *            value right, wrapping rather than truncating. The HTML's `.meta`.
 *   stacked  term above value, for a narrow column or a sidebar.
 *
 * An unknown value is written out ("Not assigned yet", `tone="muted"`), never
 * left as an empty cell that reads as a rendering bug; the flat `items` field
 * does this for you with `emptyValue`.
 *
 *   <MetadataList items={[{ term: 'Application ID', value: 'SST-2029-0416' }, …]} />
 *
 *   <MetadataList>
 *     <MetadataItem term="Submitted"><Timestamp date={…} /></MetadataItem>
 *     <MetadataItem>
 *       <MetadataTerm>Status</MetadataTerm>
 *       <MetadataDescription><Badge tone="warning">In review</Badge></MetadataDescription>
 *     </MetadataItem>
 *   </MetadataList>
 *
 * Each row is a `<div>` inside the `<dl>`, which HTML allows exactly so a
 * term and its description can be styled as one row.
 *
 * Server component: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

export const metadataListVariants = cva('group/meta m-0 grid gap-3 p-0 font-sans', {
  variants: {
    layout: {
      inline: '',
      stacked: '',
    },
  },
  defaultVariants: { layout: 'inline' },
});

type MetadataListVariantProps = VariantProps<typeof metadataListVariants>;

/** String unions, so a Storyblok option value can be passed straight in. */
export type MetadataListLayout = NonNullable<MetadataListVariantProps['layout']>;
export type MetadataDescriptionTone = 'default' | 'muted';

/* ---- parts ---------------------------------------------------------------- */

export type MetadataTermProps = React.HTMLAttributes<HTMLElement>;

/** The key: 13px secondary, a 140px minimum in the inline layout. */
export const MetadataTerm = React.forwardRef<HTMLElement, MetadataTermProps>(function MetadataTerm(
  { className, ...props },
  ref,
) {
  return (
    <dt
      ref={ref}
      data-slot="metadata-term"
      className={cn(
        'm-0 shrink-0 text-sm leading-body text-content-secondary',
        'group-data-[layout=inline]/meta:min-w-[140px]',
        className,
      )}
      {...props}
    />
  );
});
MetadataTerm.displayName = 'MetadataTerm';

export type MetadataDescriptionProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * `muted` for a not-yet-known value written out in words ("Assessment
   * pending", "—").
   *
   * @default 'default'
   */
  tone?: MetadataDescriptionTone;
};

/** The value: 15px primary. Wraps; never truncates. */
export const MetadataDescription = React.forwardRef<HTMLElement, MetadataDescriptionProps>(
  function MetadataDescription({ className, tone = 'default', ...props }, ref) {
    return (
      <dd
        ref={ref}
        data-slot="metadata-description"
        data-tone={tone}
        className={cn(
          'm-0 min-w-0 text-base leading-body break-words',
          tone === 'muted' ? 'text-content-secondary' : 'text-content',
          className,
        )}
        {...props}
      />
    );
  },
);
MetadataDescription.displayName = 'MetadataDescription';

export type MetadataItemProps = React.HTMLAttributes<HTMLDivElement> & {
  /** The key, as a flat field. Renders a `MetadataTerm`. */
  term?: React.ReactNode;
  /**
   * The value, as a flat field. Renders a `MetadataDescription`; `children`
   * are used when it is unset.
   */
  value?: React.ReactNode;
  /**
   * The tone of the flat `value`'s description.
   *
   * @default 'default'
   */
  valueTone?: MetadataDescriptionTone;
};

/**
 * One row. With `term`, its `value` (or `children`) becomes the description;
 * without it, `children` are the `MetadataTerm` / `MetadataDescription` parts.
 */
export const MetadataItem = React.forwardRef<HTMLDivElement, MetadataItemProps>(function MetadataItem(
  { className, term, value, valueTone = 'default', children, ...props },
  ref,
) {
  const flat = term != null && term !== '';
  return (
    <div
      ref={ref}
      data-slot="metadata-item"
      className={cn(
        'flex min-w-0',
        'group-data-[layout=inline]/meta:items-baseline group-data-[layout=inline]/meta:gap-4',
        'group-data-[layout=stacked]/meta:flex-col group-data-[layout=stacked]/meta:gap-0.5',
        className,
      )}
      {...props}
    >
      {flat ? (
        <>
          <MetadataTerm>{term}</MetadataTerm>
          <MetadataDescription tone={valueTone}>{value !== undefined ? value : children}</MetadataDescription>
        </>
      ) : (
        children
      )}
    </div>
  );
});
MetadataItem.displayName = 'MetadataItem';

/* ---- root ----------------------------------------------------------------- */

/** One row of the flat `items` field (a Storyblok nested blok). */
export type MetadataListEntry = {
  /** The key. */
  term: React.ReactNode;
  /** The value. Empty (`null`, `undefined`, `''`): `emptyValue`, muted. */
  value?: React.ReactNode;
  /** `muted` for a pending value written out in words. */
  tone?: MetadataDescriptionTone;
  /** A stable React key. Unset: the index. */
  key?: React.Key;
};

export type MetadataListProps = React.HTMLAttributes<HTMLDListElement> &
  MetadataListVariantProps & {
    /**
     * `inline` term and value side by side (the HTML's `.meta`) · `stacked`
     * term above value, for a narrow column.
     *
     * @default 'inline'
     */
    layout?: MetadataListLayout;
    /** Flat rows, rendered before any children. */
    items?: MetadataListEntry[];
    /**
     * What an empty flat `value` shows, muted. Never a blank cell.
     *
     * @default '—'
     */
    emptyValue?: React.ReactNode;
  };

export const MetadataList = React.forwardRef<HTMLDListElement, MetadataListProps>(function MetadataList(
  { className, layout = 'inline', items, emptyValue = '—', children, ...props },
  ref,
) {
  return (
    <dl
      ref={ref}
      data-slot="metadata-list"
      data-layout={layout}
      className={cn(metadataListVariants({ layout }), className)}
      {...props}
    >
      {items?.map((item, index) => {
        const empty = item.value == null || item.value === '' || item.value === false;
        return (
          <MetadataItem
            key={item.key ?? index}
            term={item.term}
            value={empty ? emptyValue : item.value}
            valueTone={empty ? 'muted' : (item.tone ?? 'default')}
          />
        );
      })}
      {children}
    </dl>
  );
});
MetadataList.displayName = 'MetadataList';
