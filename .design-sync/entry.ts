/**
 * Design-sync entry: what Claude Design receives. NOT a package entry point.
 *
 * Scope, first sync: the atoms (the `Atoms/*` and `Brand/*` stories) plus `cn`.
 * The foundations reach Claude Design as tokens in the compiled stylesheet
 * (`.design-sync/ds.source.css`) and as the vocabulary table in
 * `conventions.md`. They are not components, so there is nothing here to export.
 *
 * Every line re-exports a public barrel that `src/index.ts` already exports.
 * Add molecules and organisms here when they join the sync.
 */
export * from '../src/components/Avatar';
export * from '../src/components/Badge';
export * from '../src/components/Button';
export * from '../src/components/Checkbox';
export * from '../src/components/Code';
export * from '../src/components/Divider';
export * from '../src/components/GlassButton';
export * from '../src/components/Heading';
export * from '../src/components/Icon';
export * from '../src/components/IconButton';
export * from '../src/components/Input';
export * from '../src/components/Kbd';
export * from '../src/components/Link';
export * from '../src/components/Logo';
export * from '../src/components/NumberInput';
export * from '../src/components/OtpInput';
export * from '../src/components/PhoneInput';
export * from '../src/components/ProgressBar';
export * from '../src/components/RadioGroup';
export * from '../src/components/Select';
export * from '../src/components/Skeleton';
export * from '../src/components/Slider';
export * from '../src/components/Spinner';
export * from '../src/components/StatusDot';
export * from '../src/components/Switch';
export * from '../src/components/Text';
export * from '../src/components/Textarea';
export * from '../src/components/ToggleButton';
export * from '../src/components/VisuallyHidden';

export { cn } from '../src/lib/cn';
export type { SurfaceInk } from '../src/lib/surface-ink';
