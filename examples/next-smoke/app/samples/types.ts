import type * as React from 'react';
import type * as UI from '@kishanscaler/ssx-ui';

/**
 * A sample renders one export in a SERVER Component: `(ui) => element`, or
 * the NAME of the export whose sample already renders this one (a compound
 * part: `SelectItem: 'Select'`). No function props (onClick, ...) — they
 * cannot cross into a client atom from here, which is the point of the test.
 */
export type Sample = ((ui: typeof UI) => React.ReactNode) | string;
export type Samples = Partial<Record<keyof typeof UI, Sample>>;
