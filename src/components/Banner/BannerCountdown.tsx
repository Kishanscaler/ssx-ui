'use client';

// Client: it ticks (an interval started after mount) and calls onComplete.
import * as React from 'react';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * BannerCountdown
 *
 * The time left until a deadline, for the message of a Banner ("Early-bird
 * fee ends in 2d 04h 12m 09s"). A Banner has no `timer` prop on purpose: a
 * countdown is one kind of content in the message, so it is composed at build
 * time, and this is the small, safe piece to compose it with:
 *
 *   <Banner tone="brand" appearance="solid" actionLabel="Apply" actionHref="/apply">
 *     Early-bird fee ends in{' '}
 *     <BannerCountdown to="2026-09-30T23:59:00+05:30" label="30 Sep, 11:59 PM IST" />
 *   </Banner>
 *
 * SERVER RENDERING. The time left depends on the clock of whoever renders it,
 * and the server's clock is not the visitor's, so the server (and the first
 * client render, which must match it) prints a stable placeholder. The real
 * value appears after mount and then ticks once a second. No hydration
 * mismatch, whatever the server's time zone or clock.
 *
 * SCREEN READERS. A Banner is a live region; digits changing every second
 * inside one would be read out every second. The ticking digits are
 * therefore `aria-hidden`, and a screen reader gets `label`, the deadline
 * itself, which never changes ("30 Sep, 11:59 PM IST"). Name the deadline in
 * the visitor's terms, time zone included.
 *
 * Digits are tabular, so the text does not jitter as it ticks.
 * ------------------------------------------------------------------------- */

export type BannerCountdownProps = Omit<React.HTMLAttributes<HTMLTimeElement>, 'children'> & {
  /**
   * The deadline: an ISO 8601 string (what a CMS date field stores; include
   * the offset, `2026-09-30T23:59:00+05:30`), a `Date`, or epoch milliseconds.
   */
  to: string | number | Date;
  /**
   * The deadline in words, for screen readers and as the `<time>`'s meaning:
   * "30 Sep, 11:59 PM IST". Read instead of the ticking digits.
   */
  label: string;
  /**
   * Shown once the deadline has passed (the digits stop at zero otherwise).
   *
   * @default '0s'
   */
  expiredText?: string;
  /** Called once, when the countdown reaches zero on the visitor's clock. */
  onComplete?: () => void;
};

type Parts = { d: number; h: number; m: number; s: number };

function toMs(to: BannerCountdownProps['to']): number {
  if (to instanceof Date) return to.getTime();
  if (typeof to === 'number') return to;
  return Date.parse(to);
}

function split(ms: number): Parts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

/** `2d 04h 12m 09s`, `04h 12m 09s`, `12m 09s`: leading zero units dropped. */
export function formatCountdown(ms: number): string {
  const { d, h, m, s } = split(ms);
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  if (h > 0) return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  return `${pad(m)}m ${pad(s)}s`;
}

export const BannerCountdown = React.forwardRef<HTMLTimeElement, BannerCountdownProps>(function BannerCountdown(
  { to, label, expiredText = '0s', onComplete, className, ...props },
  ref,
) {
  const target = toMs(to);
  // null until mounted: the server and the hydrating render agree on it.
  const [left, setLeft] = React.useState<number | null>(null);
  const completeRef = React.useRef(onComplete);
  completeRef.current = onComplete;

  React.useEffect(() => {
    if (Number.isNaN(target)) return undefined;
    let done = false;
    const tick = () => {
      const next = target - Date.now();
      setLeft(next);
      if (next <= 0 && !done) {
        done = true;
        clearInterval(id);
        if (completeRef.current) completeRef.current();
      }
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [target]);

  const iso = Number.isNaN(target) ? undefined : new Date(target).toISOString();
  const text = left === null ? '--' : left <= 0 ? expiredText : formatCountdown(left);

  return (
    <time
      ref={ref}
      data-slot="banner-countdown"
      data-state={left === null ? 'pending' : left <= 0 ? 'expired' : 'running'}
      dateTime={iso}
      className={cn('font-semibold whitespace-nowrap tabular-nums', className)}
      {...props}
    >
      <span aria-hidden="true">{text}</span>
      <span className="sr-only">{label}</span>
    </time>
  );
});
BannerCountdown.displayName = 'BannerCountdown';
