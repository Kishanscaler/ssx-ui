import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Heading } from '../Heading';
import { Text } from '../Text';

/* ---------------------------------------------------------------------------
 * SectionHeader (marketing entry)
 *
 * The header a marketing section opens with: an eyebrow, the title, a
 * secondary line, and an optional aside (arrows, a CTA). The SSB home page's
 * one header (RowSection, PlacementsHeader, PeopleShowcase, Immersions), as
 * flat props a Storyblok blok maps onto field for field.
 *
 *   <Section density="roomy" aria-labelledby="alumni-title">
 *     <Container>
 *       <SectionHeader eyebrow="Alumni" title="Already in the roles" titleId="alumni-title" />
 *       …the row…
 *
 * EVERY OPTIONAL SLOT OMITTED IS A VARIANT. No eyebrow, no eyebrow line; no
 * description, no sub-line; no aside, no aside slot (and no empty column).
 *
 * The title takes two flat devices a CMS field can carry: `\n` starts a new
 * line block (the page's two-line "turn": "Students at SSB didn't just build
 * careers. / They built companies."), and `titleAccent` names a phrase in it
 * to set in the accent colour.
 *
 * WIDTH comes from the cell: the copy is held to the prose measure
 * (`--size-measure-max`), the root takes whatever it sits in.
 *
 * MARKERS, NOT MOTION. The root and its parts carry `data-slot` and
 * `data-part` for the motion layer to bind to; nothing here animates.
 *
 * ON A PHOTO. Inside a `data-surface-ink="on-image"` region the title and the
 * sub-line pick their on-image inks themselves (Heading, Text). The eyebrow
 * and the accent are this component's own: they are the brand ink on the
 * page and the on-image ink on a photo (as Text's `brand` tone is: a brand hue
 * is not contrast-gated over a photograph).
 *
 * Where the SSB page differs from these defaults, on purpose and by token:
 *   - display titles at medium weight: the page sets `--type-display-weight`
 *     (README, Token requests), not a prop;
 *   - the eyebrow in the logo's green: the page re-points `--content-brand`
 *     in SSB light; the accent reads `--ssx-content-accent` first;
 *   - the quieter sub-line: `descriptionSize="md"` (body size). The page also
 *     sets it at 1.6 leading (the body role's is 1.55), caps it at 40rem
 *     (the measure is 72ch, about the same at 16px) and closes the copy's gap
 *     to 8px (12px here, `gap-3`). Those stay page overrides.
 *
 * Server component: no hooks, no handlers. React 16 safe.
 * ------------------------------------------------------------------------- */

/** Where the aside sits from `sm` up. */
export type SectionHeaderAsideAt = 'end' | 'title' | 'below';
/** The copy's alignment. */
export type SectionHeaderAlign = 'start' | 'center';
/** The title's visual rank: a section's, or a sub-section's within one. */
export type SectionHeaderTitleSize = 'display' | '1';
/** The title's outline level. */
export type SectionHeaderTitleElement = 'h1' | 'h2' | 'h3';
/** The sub-line's size. */
export type SectionHeaderDescriptionSize = 'md' | 'lg';
/** The gap under the header. */
export type SectionHeaderSpacing = 'sm' | 'md';

export const sectionHeaderVariants = cva('min-w-0 font-sans', {
  variants: {
    asideAt: {
      // Level with the header's foot from `sm` (the carousel's arrows).
      end: 'flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between',
      // Under the copy at every width.
      below: 'flex flex-col gap-6',
      // A grid, so the aside can sit in the title's own row, centred on it
      // (PlacementsHeader's report CTA). The copy's parts become the first
      // column's rows (the copy is `display: contents` here); the first column
      // is capped at the measure, measured at the root's font size as the
      // flex layouts' copy is, and the second takes the rest so the aside
      // sits at the far end.
      title: [
        'grid grid-cols-[minmax(0,var(--size-measure-max))] gap-y-3',
        'sm:grid-cols-[minmax(0,var(--size-measure-max))_minmax(auto,1fr)] sm:gap-x-10',
      ],
    },
    align: {
      start: '',
      center: 'items-center text-center',
    },
    spacing: {
      md: 'mb-10 sm:mb-12',
      sm: 'mb-6 sm:mb-8',
    },
  },
  defaultVariants: { asideAt: 'end', align: 'start', spacing: 'md' },
});

export interface SectionHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * 12px caps kicker above the title, in the brand ink (the on-image ink
   * inside a `data-surface-ink="on-image"` region). Kept out of the outline
   * (`<p>`). Omit it for no eyebrow.
   */
  eyebrow?: string;
  /**
   * The title. A `\n` starts a new line block (a two-line turn); each line is
   * its own block, with a space between them for assistive tech.
   */
  title: string;
  /**
   * A phrase inside `title` set in the accent colour
   * (`--ssx-content-accent`, falling back to `--content-brand`; the on-image
   * ink on a photo). Its first occurrence is marked, within one line. If it
   * does not occur in `title`, the title renders unchanged.
   */
  titleAccent?: string;
  /**
   * The title's outline level. `h3` for a sub-section's heading inside a
   * section.
   *
   * @default 'h2'
   */
  titleAs?: SectionHeaderTitleElement;
  /**
   * `display` for a section (36px, 28px on a phone), `1` for a sub-section
   * within one (`type-h1`).
   *
   * @default 'display'
   */
  titleSize?: SectionHeaderTitleSize;
  /**
   * The title's id: the one the enclosing Section's `aria-labelledby` points
   * at. Passed in, never generated (React 16 has no `useId`).
   */
  titleId?: string;
  /** Secondary line under the title, held to the prose measure. Omit it for none. */
  description?: string;
  /**
   * `lg` the lede (`Text size="lg"`: 16px on a phone, 18px from `sm`); `md`
   * the body size, the SSB page's quieter sub-line (16px).
   *
   * @default 'lg'
   */
  descriptionSize?: SectionHeaderDescriptionSize;
  /**
   * The copy's alignment. `center` also centres the aside UNDER the copy,
   * whatever `asideAt` says: a centred title with something at its right
   * reads off balance (`data-aside-at` reports `below` then).
   *
   * @default 'start'
   */
  align?: SectionHeaderAlign;
  /**
   * Code-side slot at the header's end: carousel arrows, a CTA. Not a CMS
   * field. Omit it and there is no aside slot.
   */
  aside?: React.ReactNode;
  /**
   * Where the aside sits from `sm` up: level with the header's foot
   * (`end`), centred on the title's line (`title`), or under the description
   * (`below`). Below `sm` it is always under the description.
   *
   * @default 'end'
   */
  asideAt?: SectionHeaderAsideAt;
  /**
   * The gap under the header, to what follows: `md` 40px (48px from `sm`),
   * the page's; `sm` 24px (32px from `sm`), for a sub-section.
   *
   * @default 'md'
   */
  spacing?: SectionHeaderSpacing;
}

const ACCENT_CLASS = cn(
  'text-[color:var(--ssx-content-accent,var(--content-brand))]',
  'in-data-[surface-ink=on-image]:text-on-image-ink',
);

/** The title's lines, the accent marked in the first line that holds it. */
function renderTitle(title: string, accent: string | undefined): React.ReactNode {
  const lines = title.split('\n');
  let accentLeft = Boolean(accent);
  const marked = lines.map((line) => {
    const at = accentLeft && accent ? line.indexOf(accent) : -1;
    if (at < 0 || !accent) return line;
    accentLeft = false;
    return (
      <>
        {line.slice(0, at)}
        <span data-slot="section-header-accent" className={ACCENT_CLASS}>
          {accent}
        </span>
        {line.slice(at + accent.length)}
      </>
    );
  });
  if (lines.length === 1) return marked[0];
  return marked.map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 ? ' ' : null}
      <span data-slot="section-header-line" className="block">
        {line}
      </span>
    </React.Fragment>
  ));
}

export const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(function SectionHeader(
  {
    className,
    eyebrow,
    title,
    titleAccent,
    titleAs = 'h2',
    titleSize = 'display',
    titleId,
    description,
    descriptionSize = 'lg',
    align = 'start',
    aside,
    asideAt = 'end',
    spacing = 'md',
    ...props
  },
  ref,
) {
  const hasAside = aside != null && aside !== false;
  // Centred copy takes its aside under it (see `align`).
  const at: SectionHeaderAsideAt = align === 'center' ? 'below' : asideAt;
  const grid = at === 'title';
  // In the grid the copy's parts are the first column's rows.
  const inColumn = grid ? 'sm:col-start-1' : undefined;

  return (
    <div
      ref={ref}
      data-slot="section-header"
      data-part="header"
      // TRANSITIONAL: the SSB page's motion hook binds to `data-enter`; the
      // motion layer is being taught `data-part`. Both until the next major,
      // which drops every `data-enter` here.
      data-enter="header"
      data-align={align}
      data-aside-at={at}
      data-title-size={titleSize}
      className={cn(sectionHeaderVariants({ asideAt: at, align, spacing }), className)}
      {...props}
    >
      <div
        data-slot="section-header-copy"
        className={cn(
          grid ? 'contents' : 'flex min-w-0 max-w-measure flex-col gap-3',
          align === 'center' && 'items-center',
        )}
      >
        {eyebrow ? (
          <Heading
            as="p"
            size="eyebrow"
            data-slot="section-header-eyebrow"
            data-part="eyebrow"
            data-enter="eyebrow"
            className={cn(
              'text-content-brand in-data-[surface-ink=on-image]:text-on-image-ink',
              inColumn,
            )}
          >
            {eyebrow}
          </Heading>
        ) : null}
        <Heading
          as={titleAs}
          size={titleSize}
          id={titleId}
          data-slot="section-header-title"
          data-part="headline"
          data-enter="headline"
          className={inColumn}
        >
          {renderTitle(title, titleAccent)}
        </Heading>
        {description ? (
          <Text
            as="p"
            size={descriptionSize}
            tone="secondary"
            data-slot="section-header-description"
            data-part="sub"
            data-enter="sub"
            className={cn('max-w-measure', inColumn)}
          >
            {description}
          </Text>
        ) : null}
      </div>
      {hasAside ? (
        <div
          data-slot="section-header-aside"
          data-part="controls"
          data-enter="controls"
          className={cn(
            'min-w-0',
            at === 'end' && 'sm:shrink-0',
            // In the title's row, centred on it, at the far end. Below `sm`
            // it follows the description, 24px down as in the flex layouts.
            grid && 'mt-3 sm:col-start-2 sm:mt-0 sm:self-center sm:justify-self-end',
            grid && (eyebrow ? 'sm:row-start-2' : 'sm:row-start-1'),
          )}
        >
          {aside}
        </div>
      ) : null}
    </div>
  );
});
SectionHeader.displayName = 'SectionHeader';
