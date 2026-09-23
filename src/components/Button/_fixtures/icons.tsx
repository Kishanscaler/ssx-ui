/**
 * Story fixtures only — NOT part of the public API.
 *
 * The real system ships Phosphor 2.1.1 through an allowlisted registry
 * (`tokens/icons.json`, 127 entries). That component does not exist in React
 * yet, and faking it here would put a second, unreviewed icon source into the
 * package. These are four hand-written paths whose only job is to prove the
 * Button's icon slots, sizing and spacing. Delete them the day `<Icon>` lands.
 */
import * as React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    ...props,
  };
}

export const PlusIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ArrowRightIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const DownloadIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 6h16M9 6V4h6v2M7 6l1 14h8l1-14M10 10v6M14 10v6" />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4.5-4.5" />
  </svg>
);
