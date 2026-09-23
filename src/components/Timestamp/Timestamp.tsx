'use client';

// Client: a relative time ("2 hours ago") depends on the reader's clock, so it
// is computed after mount and re-computed on a timer.
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { formatAbsolute, formatRelative, machineValue, nextTick, toDate, type TimestampValue } from './format';

/* ---------------------------------------------------------------------------
 * Timestamp
 *
 * A moment in time, in the form the reader needs, always inside a
 * `<time dateTime>` so the machine-readable value survives whatever the words
 * say. Tabular figures, so a column of them aligns and does not shimmer as it
 * re-renders.
 *
 *   absolute  4 Mar 2026, 11:42 PM       anything auditable, dated or disputed
 *   relative  2 hours ago                recency in a feed (absolute in `title`)
 *   both      2 hours ago · 4 Mar 2026, 11:42 PM   the preferred form
 *   date      4 Mar 2026                 a day, not a moment
 *
 * Never relative alone on a record someone may have to quote back: "3 days
 * ago" is not evidence.
 *
 * LOCALE AND ZONE. `en-IN` and `Asia/Kolkata` by default, so a Next.js server
 * in UTC and a reader's browser in IST print the same absolute text. For the
 * English locales the text is assembled from `formatToParts` with a fixed
 * shape ("4 Mar 2026, 11:42 PM": short month, upper-case AM/PM), because ICU
 * versions disagree on the details (Node prints "Sept" and "pm").
 *
 * SSR AND HYDRATION. The server has no idea what "now" is for the reader, so
 * the server render, and the client's FIRST render, show the ABSOLUTE text,
 * and the relative text replaces it in an effect after mount. The two renders
 * therefore match and there is no hydration mismatch; the cost is one swap of
 * the words on load. If you know "now" at render time (a request timestamp),
 * pass `now` and the relative text renders on the server too; the client then
 * takes over from the real clock after mount. In React 16 (client only) the
 * swap happens before the first paint the user sees, in practice.
 *
 * TICKING. Relative text re-computes every 30s while under an hour away,
 * every minute under a day, and stops after that. `live={false}` freezes it.
 *
 * INPUT. A `Date`, epoch milliseconds, or an ISO string. Give a string an
 * explicit offset ("2026-03-04T23:42+05:30"): without one, JavaScript reads it
 * in the host's zone, which differs between the server and the reader. A
 * string passes through to `dateTime` unchanged.
 * ------------------------------------------------------------------------- */

export const timestampVariants = cva('font-sans text-sm tabular-nums', {
  variants: {
    tone: {
      default: 'text-content-secondary',
      primary: 'text-content',
      // A deadline that is close, or passed: the HTML's
      // data-ink="status-warning-content" / "status-danger-content".
      warning: 'text-warning-content',
      danger: 'text-danger-content',
    },
  },
  defaultVariants: { tone: 'default' },
});

type TimestampVariantProps = VariantProps<typeof timestampVariants>;

/** String unions, so a Storyblok option value can be passed straight in. */
export type TimestampTone = NonNullable<TimestampVariantProps['tone']>;
export type TimestampFormat = 'absolute' | 'relative' | 'both' | 'date';

/* ---- component ------------------------------------------------------------ */

export type TimestampProps = Omit<React.TimeHTMLAttributes<HTMLTimeElement>, 'dateTime'> &
  TimestampVariantProps & {
    /** The moment: a `Date`, epoch ms, or an ISO string with an offset. */
    date: TimestampValue;
    /**
     * `absolute` "4 Mar 2026, 11:42 PM" · `relative` "2 hours ago" (absolute
     * in the tooltip) · `both` relative then " · absolute" (preferred where
     * recency matters) · `date` "4 Mar 2026".
     *
     * @default 'absolute'
     */
    format?: TimestampFormat;
    /**
     * `default` secondary ink · `primary` body ink · `warning` a deadline that
     * is close · `danger` overdue.
     *
     * @default 'default'
     */
    tone?: TimestampTone;
    /**
     * BCP 47 locale for the words.
     *
     * @default 'en-IN'
     */
    locale?: string;
    /**
     * IANA zone the absolute text is printed in. Fixed by default so server
     * and client agree.
     *
     * @default 'Asia/Kolkata'
     */
    timeZone?: string;
    /**
     * "Now" for the first render (server and client), e.g. the request time.
     * Lets the relative text render on the server; after mount the real
     * clock takes over. Unset: the first render shows the absolute text.
     */
    now?: TimestampValue;
    /**
     * Keep relative text current on a timer (30s under an hour, 60s under a
     * day, then stop).
     *
     * @default true
     */
    live?: boolean;
    /**
     * Replaces the visible text entirely ("Submitted 4 Mar 2026, 11:42 PM"),
     * keeping `dateTime`, the tabular figures and the tone.
     */
    children?: React.ReactNode;
  };

export const Timestamp = React.forwardRef<HTMLTimeElement, TimestampProps>(function Timestamp(
  {
    className,
    date,
    format = 'absolute',
    tone = 'default',
    locale = 'en-IN',
    timeZone = 'Asia/Kolkata',
    now,
    live = true,
    title,
    children,
    ...props
  },
  ref,
) {
  const wantsRelative = format === 'relative' || format === 'both';
  // null until mounted (and no `now`): render the absolute text, as the server did.
  const [clock, setClock] = React.useState<number | null>(() =>
    now !== undefined ? toDate(now).getTime() : null,
  );

  const time = toDate(date).getTime();
  React.useEffect(() => {
    if (!wantsRelative) return undefined;
    setClock(Date.now());
    if (!live) return undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      const delay = nextTick(time, Date.now());
      if (delay == null) return;
      timer = setTimeout(() => {
        setClock(Date.now());
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [wantsRelative, live, time]);

  const dateOnly = format === 'date';
  const absolute = formatAbsolute(date, !dateOnly, { locale, timeZone });
  const relative = wantsRelative && clock != null ? formatRelative(date, clock, { locale }) : null;

  let text: React.ReactNode;
  if (children != null) text = children;
  else if (format === 'relative') text = relative ?? absolute;
  else text = absolute;

  const timeEl = (
    <time
      ref={ref}
      data-slot="timestamp"
      data-format={format}
      data-tone={tone}
      dateTime={machineValue(date, dateOnly, timeZone)}
      title={title ?? (format === 'relative' && relative != null ? absolute : undefined)}
      // The words depend on the clock, the zone database and ICU; the markup
      // around them does not. Scoped to this element's text only.
      suppressHydrationWarning
      className={cn(timestampVariants({ tone }), className)}
      {...props}
    >
      {format === 'both' && children == null ? (relative ?? absolute) : text}
    </time>
  );

  if (format !== 'both' || children != null) return timeEl;

  // `both`: relative in the <time>, the absolute after it. Before the relative
  // text exists the <time> already shows the absolute, so the suffix waits.
  return (
    <span data-slot="timestamp-group" className="font-sans">
      {timeEl}
      {relative != null ? (
        <span
          data-slot="timestamp-absolute"
          className="text-sm text-content-secondary tabular-nums"
        >{` · ${absolute}`}</span>
      ) : null}
    </span>
  );
});
Timestamp.displayName = 'Timestamp';
