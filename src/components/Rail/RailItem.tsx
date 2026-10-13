import * as React from 'react';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * RailItem
 *
 * One item of a `Rail`: a plain `li`. Its width is the Rail's to set (its
 * `itemWidth`, through `--ssx-rail-item-w`), never the card's: a card inside
 * takes the item's width and its full height (`[&>*]:h-full`), so a row of
 * cards with uneven copy lines up. Server-safe: no state.
 *
 *   <Rail label="Mentors" itemName="mentor">
 *     {mentors.map((m) => (
 *       <RailItem key={m.id}><PersonCard {...m} /></RailItem>
 *     ))}
 *   </Rail>
 *
 * Marker: `data-slot="rail-item"` (`data-copy` on the Rail's looped copies).
 * ------------------------------------------------------------------------- */

export interface RailItemProps extends React.LiHTMLAttributes<HTMLLIElement> {}

export const RailItem = React.forwardRef<HTMLLIElement, RailItemProps>(function RailItem(
  { className, ...props },
  ref,
) {
  return (
    <li
      ref={ref}
      data-slot="rail-item"
      className={cn(
        'w-(--ssx-rail-item-w) min-w-0 flex-none snap-start [&>*]:h-full',
        // The phone stack: every swipe stops on the next card.
        'in-data-[item-width=view]:snap-always',
        className,
      )}
      {...props}
    />
  );
});
RailItem.displayName = 'RailItem';
