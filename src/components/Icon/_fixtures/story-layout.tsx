/**
 * STORY FIXTURE — layout helpers shared by the batch A stories (a row of
 * specimens, each with the small caps label the HTML preview's `.spec` has).
 * Not part of the public API. Inline styles on purpose: this is the canvas,
 * not a component, and it must not add classes to the Tailwind scan.
 */
import * as React from 'react';

export const Row = ({ children, align = 'center' }: { children: React.ReactNode; align?: 'center' | 'start' }) => (
  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: align === 'center' ? 'flex-end' : 'flex-start' }}>
    {children}
  </div>
);

export const Stack = ({ children, gap = 24 }: { children: React.ReactNode; gap?: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap }}>{children}</div>
);

export const Label = ({ children }: { children: React.ReactNode }) => (
  // The eyebrow role (weight, 0.08em tracking, caps), at 11px: specimen
  // labels are story chrome and sit a step under the content they caption.
  <p className="m-0 font-sans type-eyebrow text-[0.6875rem] text-content-secondary">
    {children}
  </p>
);

/** One specimen: a label above whatever it demonstrates. */
export const Spec = ({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, width: wide ? '100%' : undefined, maxWidth: wide ? 720 : undefined }}>
    <Label>{label}</Label>
    <div>{children}</div>
  </div>
);

/** A raised card, for "in situ" specimens. */
export const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div
    style={{
      background: 'var(--surface-raised)',
      border: '1px solid var(--border-raised)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      ...style,
    }}
  >
    {children}
  </div>
);
