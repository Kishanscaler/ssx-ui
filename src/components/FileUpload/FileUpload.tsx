'use client';

// Client: the drop zone keeps drag and rejection state and attaches the drag,
// drop, click and change handlers; the file rows attach cancel / remove /
// retry handlers and generate the id that ties Retry to its error.
import * as React from 'react';
import { cva } from 'class-variance-authority';

import { announce, ensureAnnouncer } from '../../lib/announce';
import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { useId } from '../../lib/use-id';
import { Badge } from '../Badge';
import { Button, buttonVariants } from '../Button';
import { emptyStateArtVariants } from '../EmptyState';
import { headingVariants } from '../Heading';
import { IconButton } from '../IconButton';
import { ProgressBar } from '../ProgressBar';

/* ---------------------------------------------------------------------------
 * FileUpload, FileUploadList, FileUploadItem
 *
 * A drop target plus the list of what has been attached, each row carrying
 * its own progress and its own failure: an assignment submission, an
 * admissions document, a capstone recording. Always state the accepted
 * formats and the size limit before someone picks a file (`hint`, generated
 * from `accept` and `maxSize` when you do not write one). Do NOT report an
 * upload error in a toast: the row that failed is where people look.
 *
 *   <Field label="Week 6 submission" error={errors.file}>
 *     <FileUpload accept=".pdf,.zip,.ipynb,.py" maxSize={25 * MB}
 *       onFilesAdded={startUpload} onFilesRejected={(r) => setError(r[0].message)} />
 *   </Field>
 *   <FileUploadList>
 *     <FileUploadItem name="avl-trees.ipynb" size={12_373_196} status="uploading" progress={36}
 *       meta="about 20 seconds left" onCancel={…} />
 *   </FileUploadList>
 *
 * No upload logic: FileUpload validates (type, size, count) and hands you
 * `File`s; you upload them and render the rows from your own state.
 *
 * The zone is one big click target over a real `<input type="file">`, which is
 * the keyboard path (it is the focusable element, visually hidden, its focus
 * ring drawn on the zone) and the Field's control (label, help, error and
 * `aria-invalid` all land on it). A rejected pick turns the zone invalid
 * (`.is-invalid`) with the reason as its title — ".mov is not accepted" — and
 * is announced; it also goes to `onFilesRejected` for a Field error.
 * ------------------------------------------------------------------------- */

/* ---- helpers -------------------------------------------------------------- */

const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

const trimZero = (text: string) => text.replace(/\.0$/, '');

/** Bytes as the preview writes them: `1.4 MB`, `312 MB`, `820 KB`. Binary units. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < KB) return `${Math.round(bytes)} B`;
  if (bytes < MB) return `${Math.round(bytes / KB)} KB`;
  const unit = bytes < GB ? MB : GB;
  const value = bytes / unit;
  return `${trimZero(value < 100 ? value.toFixed(1) : String(Math.round(value)))} ${unit === MB ? 'MB' : 'GB'}`;
}

const acceptTokens = (accept: string | undefined) =>
  (accept ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

function tokenName(token: string): string {
  if (token.startsWith('.')) return token.slice(1).toUpperCase();
  const [kind = '', sub = ''] = token.split('/');
  if (sub === '*') return `${kind} files`;
  return (sub.split(/[.+-]/).pop() ?? sub).toUpperCase();
}

/** `.pdf,.zip,.py` → `PDF, ZIP or PY` (`or`) / `PDF, ZIP, PY` (`list`). */
function describeAccept(accept: string | undefined, joiner: 'or' | 'list'): string {
  const names = acceptTokens(accept).map(tokenName);
  if (names.length === 0) return '';
  if (joiner === 'list' || names.length === 1) return names.join(', ');
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
}

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot).toLowerCase() : '';
};

function accepts(file: File, accept: string | undefined): boolean {
  const tokens = acceptTokens(accept);
  if (tokens.length === 0) return true;
  const ext = extensionOf(file.name);
  const type = (file.type || '').toLowerCase();
  return tokens.some((t) => {
    if (t.startsWith('.')) return ext === t;
    if (t.endsWith('/*')) return type.startsWith(t.slice(0, -1));
    return type === t;
  });
}

/* ---- types ---------------------------------------------------------------- */

/** Why a file was turned away. */
export type FileUploadRejectionReason = 'type' | 'size' | 'count';
/** What the zone is showing. */
export type FileUploadState = 'idle' | 'dragover' | 'invalid' | 'disabled';

/** A file that did not pass `accept`, `maxSize` or the count limit. */
export interface FileUploadRejection {
  /** The file. */
  file: File;
  /** Which rule it broke. */
  reason: FileUploadRejectionReason;
  /** A sentence to show ("week-6.mov is not accepted"). */
  message: string;
}

/* ---- glyphs (Phosphor 2.1.1, MIT; the preview sprite's ids) --------------- */

const PATH = {
  // ph-upload / ph-upload-fill / ph-cancelled-fill / ph-lock-fill
  upload:
    'M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0ZM93.66,77.66,120,51.31V144a8,8,0,0,0,16,0V51.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,77.66Z',
  uploadFill:
    'M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0ZM88,80h32v64a8,8,0,0,0,16,0V80h32a8,8,0,0,0,5.66-13.66l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,88,80Z',
  cancelledFill:
    'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,130.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32L139.31,128Z',
  lockFill:
    'M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96Z',
  // ph-file-upload / ph-success-fill / ph-error-fill
  fileUpload:
    'M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-42.34-77.66a8,8,0,0,1-11.32,11.32L136,139.31V184a8,8,0,0,1-16,0V139.31l-10.34,10.35a8,8,0,0,1-11.32-11.32l24-24a8,8,0,0,1,11.32,0Z',
  successFill:
    'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z',
  errorFill:
    'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z',
  // ph-check-bold / ph-close-bold / ph-delete-bold / ph-refresh
  checkBold:
    'M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z',
  closeBold:
    'M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z',
  deleteBold:
    'M216,48H180V36A28,28,0,0,0,152,8H104A28,28,0,0,0,76,36V48H40a12,12,0,0,0,0,24h4V208a20,20,0,0,0,20,20H192a20,20,0,0,0,20-20V72h4a12,12,0,0,0,0-24ZM100,36a4,4,0,0,1,4-4h48a4,4,0,0,1,4,4V48H100Zm88,168H68V72H188ZM116,104v64a12,12,0,0,1-24,0V104a12,12,0,0,1,24,0Zm48,0v64a12,12,0,0,1-24,0V104a12,12,0,0,1,24,0Z',
  refresh:
    'M240,56v48a8,8,0,0,1-8,8H184a8,8,0,0,1,0-16H211.4L184.81,71.64l-.25-.24a80,80,0,1,0-1.67,114.78,8,8,0,0,1,11,11.63A95.44,95.44,0,0,1,128,224h-1.32A96,96,0,1,1,195.75,60L224,85.8V56a8,8,0,1,1,16,0Z',
} as const;

function Glyph({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <path d={d} />
    </svg>
  );
}

/* ---- FileUpload (the drop zone) ------------------------------------------- */

export const fileUploadVariants = cva([
  'group/file-upload relative grid justify-items-center gap-2 p-8 text-center font-sans',
  'rounded-lg border-2 border-dashed border-border-control bg-surface-subtle',
  'transition-[border-color,background-color] duration-[var(--motion-duration-normal)] ease-productive-in-out motion-reduce:transition-none',
  // Rest: the whole zone is the click target; hover and drag-over read the same.
  'data-[state=idle]:cursor-pointer data-[state=invalid]:cursor-pointer',
  'data-[state=idle]:hover:border-border-brand data-[state=idle]:hover:bg-surface-brand-subtle',
  'data-[state=dragover]:border-border-brand data-[state=dragover]:bg-surface-brand-subtle',
  // Rejected (`.is-invalid`), also when the Field marks the input invalid.
  'data-[state=invalid]:border-danger data-[state=invalid]:bg-danger-surface',
  // Closed (`[aria-disabled]`): the decorative border and a neutral disc — the
  // fill and the lock say it, not an opacity.
  'data-[state=disabled]:cursor-not-allowed data-[state=disabled]:border-border-decorative',
  // The focus ring of the (visually hidden) file input, drawn on the zone.
  'has-[input:focus-visible]:border-border-focus has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-border-focus/50',
]);

const artClass = cn(
  // Hover / drag-over escalate the disc to the solid brand (the zone itself
  // becomes brand-subtle, and a subtle disc would vanish into it).
  'transition-colors duration-[var(--motion-duration-normal)] ease-productive-in-out motion-reduce:transition-none',
  'group-data-[state=idle]/file-upload:group-hover/file-upload:bg-surface-brand-solid',
  'group-data-[state=idle]/file-upload:group-hover/file-upload:text-content-on-brand-solid',
  'group-data-[state=dragover]/file-upload:bg-surface-brand-solid group-data-[state=dragover]/file-upload:text-content-on-brand-solid',
  // Rejected: the danger border ink behind the danger glyph, on the danger surface.
  'group-data-[state=invalid]/file-upload:bg-danger-border group-data-[state=invalid]/file-upload:text-danger-icon',
);

export type FileUploadProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'type' | 'title' | 'size' | 'value' | 'defaultValue' | 'onChange' | 'accept' | 'multiple'
> & {
  /**
   * Accepted types, as the input's `accept`: extensions and/or MIME types
   * (`.pdf,.zip,.ipynb,.py`, `image/*`). Enforced on drop as well as in the
   * picker. Empty: any type.
   */
  accept?: string;
  /** The largest file allowed, in bytes (`25 * 1024 * 1024`). */
  maxSize?: number;
  /**
   * Allow several files in one pick or drop.
   *
   * @default false
   */
  multiple?: boolean;
  /**
   * How many files may be attached in total. Counts `fileCount` too.
   *
   * @default 1, or no limit with `multiple`
   */
  maxFiles?: number;
  /**
   * How many files are already attached (your list), for `maxFiles`.
   *
   * @default 0
   */
  fileCount?: number;
  /** Called with the files that passed every rule, in pick / drop order. */
  onFilesAdded?: (files: File[]) => void;
  /** Called with the files that were turned away, and why. */
  onFilesRejected?: (rejections: FileUploadRejection[]) => void;
  /**
   * The zone's heading.
   *
   * @default 'Drop your file here' ('Drop files here' with `multiple`)
   */
  title?: React.ReactNode;
  /**
   * The line under the heading.
   *
   * @default 'or attach it from your device'
   */
  description?: React.ReactNode;
  /**
   * The button-look label inside the zone (the zone is the button).
   *
   * @default 'Browse files'
   */
  browseLabel?: string;
  /**
   * The formats-and-limit line. Generated from `accept` and `maxSize`
   * ("PDF, ZIP, IPYNB or PY · up to 25 MB") when omitted; add the context
   * after it yourself ("… · Data Structures & Algorithms — Week 6").
   */
  hint?: React.ReactNode;
  /**
   * The heading while a file is dragged over.
   *
   * @default 'Release to attach'
   */
  dragTitle?: React.ReactNode;
  /**
   * The button-look label after a rejection.
   *
   * @default 'Choose another file'
   */
  retryLabel?: string;
  /**
   * Closed ("Submissions closed"): the lock, no picker, drops ignored. Say why
   * in `title` and `description`.
   *
   * @default false
   */
  disabled?: boolean;
  /** The resting glyph, 48px. The upload arrow by default. */
  icon?: React.ReactNode;
  /** Classes for the zone (the root). Every other prop lands on the `<input>`. */
  className?: string;
};

/**
 * The drop zone. The ref, `id`, `name`, `aria-*` and every other input
 * attribute land on the `<input type="file">`; `className` on the zone.
 */
export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(function FileUpload(
  {
    className,
    accept,
    maxSize,
    multiple = false,
    maxFiles,
    fileCount = 0,
    onFilesAdded,
    onFilesRejected,
    title,
    description = 'or attach it from your device',
    browseLabel = 'Browse files',
    hint,
    dragTitle = 'Release to attach',
    retryLabel = 'Choose another file',
    disabled = false,
    icon,
    id,
    name,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...props
  },
  forwardedRef,
) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const ref = useComposedRefs(forwardedRef, inputRef);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const hintId = `${baseId}-hint`;

  const [dragCount, setDragCount] = React.useState<number | null>(null);
  const depth = React.useRef(0);
  const [rejection, setRejection] = React.useState<string | null>(null);

  React.useEffect(() => {
    ensureAnnouncer();
  }, []);

  const limit = maxFiles ?? (multiple ? Infinity : 1);
  const kinds = describeAccept(accept, 'or');
  const limitText = maxSize != null ? `up to ${formatFileSize(maxSize)}` : '';
  const autoHint = [kinds, limitText].filter(Boolean).join(' · ');
  const acceptedText = [describeAccept(accept, 'list'), limitText].filter(Boolean).join(' · ');

  const fieldInvalid = ariaInvalid === true || ariaInvalid === 'true';
  const state: FileUploadState = disabled
    ? 'disabled'
    : dragCount != null
      ? 'dragover'
      : rejection != null || fieldInvalid
        ? 'invalid'
        : 'idle';

  const take = (list: FileList | File[] | null | undefined) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    const accepted: File[] = [];
    const rejected: FileUploadRejection[] = [];
    let room = Math.max(0, limit - fileCount);
    for (const file of files) {
      if (!accepts(file, accept)) {
        const what = extensionOf(file.name) || file.type || file.name;
        rejected.push({ file, reason: 'type', message: `${what} is not accepted` });
      } else if (maxSize != null && file.size > maxSize) {
        rejected.push({
          file,
          reason: 'size',
          message: `${file.name} is ${formatFileSize(file.size)} and the limit is ${formatFileSize(maxSize)}`,
        });
      } else if (room <= 0) {
        rejected.push({
          file,
          reason: 'count',
          message: limit === 1 ? 'Attach one file at a time' : `You can attach up to ${limit} files`,
        });
      } else {
        room -= 1;
        accepted.push(file);
      }
    }
    const first = rejected[0];
    setRejection(first ? first.message : null);
    if (accepted.length) onFilesAdded?.(accepted);
    if (first) {
      onFilesRejected?.(rejected);
      announce(`${first.message}. Accepted: ${acceptedText || 'any file'}.`);
    } else {
      announce(accepted.length === 1 ? `${accepted[0]?.name ?? 'File'} attached` : `${accepted.length} files attached`);
    }
  };

  const hasFiles = (event: React.DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files');

  const heading =
    state === 'dragover'
      ? dragTitle
      : state === 'invalid' && rejection != null
        ? rejection
        : (title ?? (multiple ? 'Drop files here' : 'Drop your file here'));
  const sub =
    state === 'dragover'
      ? [`${dragCount ?? 1} ${dragCount === 1 ? 'file' : 'files'}`, kinds].filter(Boolean).join(' · ')
      : state === 'invalid' && rejection != null
        ? `Accepted: ${acceptedText || 'any file'}`
        : description;
  const art =
    state === 'dragover' ? (
      <Glyph d={PATH.uploadFill} />
    ) : state === 'invalid' ? (
      <Glyph d={PATH.cancelledFill} />
    ) : state === 'disabled' ? (
      <Glyph d={PATH.lockFill} />
    ) : (
      (icon ?? <Glyph d={PATH.upload} />)
    );
  const showHint = state === 'idle' || (state === 'invalid' && rejection == null);
  const hintText = hint ?? autoHint;

  const describedBy =
    [ariaDescribedBy, descriptionId, showHint && hintText ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div
      data-slot="file-upload"
      data-state={state}
      aria-disabled={disabled ? true : undefined}
      className={cn(fileUploadVariants(), className)}
      onClick={(event) => {
        if (disabled || event.target === inputRef.current) return;
        inputRef.current?.click();
      }}
      onDragEnter={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        depth.current += 1;
        if (disabled) return;
        setRejection(null);
        setDragCount(event.dataTransfer.items?.length || 1);
      }}
      onDragOver={(event) => {
        if (!hasFiles(event)) return;
        // Always claim the drag, so a file dropped on a closed zone is not
        // opened by the browser instead.
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
      }}
      onDragLeave={(event) => {
        if (!hasFiles(event)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragCount(null);
      }}
      onDrop={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        depth.current = 0;
        setDragCount(null);
        if (!disabled) take(event.dataTransfer.files);
      }}
    >
      <span data-slot="file-upload-art" aria-hidden="true" className={cn(
        emptyStateArtVariants({ tone: state === 'disabled' ? 'neutral' : 'brand' }),
        artClass,
      )}>
        {art}
      </span>
      <span data-slot="file-upload-title" id={titleId} className={cn(headingVariants({ size: '3' }), 'text-content')}>
        {heading}
      </span>
      {sub != null && sub !== '' ? (
        <span data-slot="file-upload-description" id={descriptionId} className="text-sm text-content-secondary">
          {sub}
        </span>
      ) : null}
      {state === 'idle' || state === 'invalid' ? (
        <span
          data-slot="file-upload-browse"
          aria-hidden="true"
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'pointer-events-none')}
        >
          {rejection != null ? retryLabel : browseLabel}
        </span>
      ) : null}
      {showHint && hintText ? (
        <span data-slot="file-upload-hint" id={hintId} className="text-xs text-content-secondary">
          {hintText}
        </span>
      ) : null}
      <input
        ref={ref}
        data-slot="file-upload-input"
        type="file"
        id={id}
        name={name}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-invalid={state === 'invalid' ? true : ariaInvalid}
        aria-label={ariaLabel}
        // Named by the zone's heading unless a Field label (or yours) names it.
        aria-labelledby={ariaLabelledBy ?? (ariaLabel == null && id == null ? titleId : undefined)}
        aria-describedby={describedBy}
        className="sr-only"
        onChange={(event) => {
          take(event.currentTarget.files);
          // Let the same file be picked again after a rejection or a removal,
          // unless the input itself submits the files (`name`).
          if (name == null) event.currentTarget.value = '';
        }}
        {...props}
      />
    </div>
  );
});
FileUpload.displayName = 'FileUpload';

/* ---- FileUploadList ------------------------------------------------------- */

export type FileUploadListProps = React.ComponentPropsWithoutRef<'ul'>;

/**
 * The attached files (`.list`): hairline rows in a rounded, bordered list.
 * Name it (`aria-label="Attached files"`) when the page has several.
 */
export const FileUploadList = React.forwardRef<HTMLUListElement, FileUploadListProps>(function FileUploadList(
  { className, ...props },
  ref,
) {
  return (
    <ul
      ref={ref}
      data-slot="file-upload-list"
      className={cn(
        'm-0 list-none overflow-hidden rounded-lg border border-border-decorative bg-surface p-0 font-sans',
        'divide-y divide-border-decorative',
        className,
      )}
      {...props}
    />
  );
});
FileUploadList.displayName = 'FileUploadList';

/* ---- FileUploadItem ------------------------------------------------------- */

/** Where one file is. */
export type FileUploadItemStatus = 'queued' | 'uploading' | 'complete' | 'failed';

const STATUS = {
  queued: { tone: 'default', label: 'Queued', glyph: PATH.fileUpload, ink: 'text-content-secondary' },
  uploading: { tone: 'info', label: 'Uploading', glyph: PATH.fileUpload, ink: 'text-info-icon' },
  complete: { tone: 'success', label: 'Complete', glyph: PATH.successFill, ink: 'text-success-icon' },
  failed: { tone: 'danger', label: 'Failed', glyph: PATH.errorFill, ink: 'text-danger-icon' },
} as const;

export type FileUploadItemProps = Omit<React.ComponentPropsWithoutRef<'li'>, 'onError'> & {
  /** The file name ("week-6-writeup.pdf"). */
  name: string;
  /** The file size in bytes. */
  size?: number;
  /**
   * Where the file is. `uploading` draws the progress bar; `failed` the error
   * and Retry.
   *
   * @default 'complete'
   */
  status?: FileUploadItemStatus;
  /** Percent uploaded (0–100), with `uploading`. Omitted: an indeterminate bar. */
  progress?: number;
  /**
   * Extra detail after the size: "about 20 seconds left", "uploaded 4 Mar
   * 2026, 11:42 PM".
   */
  meta?: React.ReactNode;
  /**
   * Why it failed, with `failed`: say what to do ("Compress the recording or
   * link it from Drive instead"). Retry is described by it.
   */
  error?: React.ReactNode;
  /** The badge text. Defaults to the status ("Uploading", "Complete", "Failed", "Queued"). */
  statusLabel?: React.ReactNode;
  /** Cancel an upload in progress: draws the ✕ while `uploading`. */
  onCancel?: () => void;
  /** Remove the file: draws the bin (not while `uploading`). */
  onRemove?: () => void;
  /** Try again: draws Retry while `failed`. */
  onRetry?: () => void;
  /**
   * The ✕'s accessible name.
   *
   * @default `Cancel the upload of ${name}`
   */
  cancelLabel?: string;
  /**
   * The bin's accessible name.
   *
   * @default `Remove ${name}`
   */
  removeLabel?: string;
  /**
   * The Retry button's text.
   *
   * @default 'Retry'
   */
  retryLabel?: string;
};

/**
 * One attached file: status glyph, name, size / progress / error, status
 * badge, and its action (cancel, remove or retry).
 */
export const FileUploadItem = React.forwardRef<HTMLLIElement, FileUploadItemProps>(function FileUploadItem(
  {
    className,
    name,
    size,
    status = 'complete',
    progress,
    meta,
    error,
    statusLabel,
    onCancel,
    onRemove,
    onRetry,
    cancelLabel,
    removeLabel,
    retryLabel = 'Retry',
    ...props
  },
  ref,
) {
  const errorId = `${useId()}-error`;
  const look = STATUS[status];
  const pct = progress == null ? null : Math.round(Math.min(100, Math.max(0, progress)));
  const sizeText = size != null ? formatFileSize(size) : '';
  const hasMeta = meta != null && meta !== '';

  let detail: React.ReactNode = null;
  if (status === 'uploading') {
    const done = size != null && pct != null ? `${formatFileSize((size * pct) / 100)} of ${sizeText}` : sizeText;
    detail = (
      <>
        <span data-slot="file-upload-item-progress-text" className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-content-secondary tabular-nums">
            {done}
            {hasMeta ? (done ? <> · {meta}</> : meta) : null}
          </span>
          {pct != null ? <span className="text-sm text-content-secondary tabular-nums">{pct}%</span> : null}
        </span>
        <ProgressBar value={pct} aria-label={`Uploading ${name}`} className="mt-1" />
      </>
    );
  } else if (status === 'failed' && error != null && error !== '') {
    detail = (
      <span
        data-slot="file-upload-item-error"
        id={errorId}
        className={cn(
          // FieldError's look; not FieldError itself, which would register as
          // the enclosing Field's error.
          'flex items-start gap-1 text-sm text-danger-content',
          '[&>svg]:mt-[calc((1lh-var(--size-icon-sm))/2)] [&>svg]:size-icon-sm [&>svg]:shrink-0',
        )}
      >
        <Glyph d={PATH.errorFill} />
        <span>{error}</span>
      </span>
    );
  } else if (sizeText || hasMeta) {
    detail = (
      <span className="text-sm text-content-secondary tabular-nums">
        {sizeText}
        {hasMeta ? (sizeText ? <> · {meta}</> : meta) : null}
      </span>
    );
  }

  const hasError = status === 'failed' && error != null && error !== '';

  return (
    <li
      ref={ref}
      data-slot="file-upload-item"
      data-status={status}
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        'transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none hover:bg-surface-hover',
        className,
      )}
      {...props}
    >
      <Glyph d={look.glyph} className={cn('size-icon-md shrink-0', look.ink)} />
      <span data-slot="file-upload-item-body" className="grid min-w-0 flex-1 gap-0.5">
        <span data-slot="file-upload-item-name" className="text-base text-content [overflow-wrap:anywhere]">
          {name}
        </span>
        {detail}
      </span>
      <Badge tone={look.tone}>
        {status === 'complete' && statusLabel == null ? <Glyph d={PATH.checkBold} /> : null}
        {statusLabel ?? look.label}
      </Badge>
      {status === 'uploading' && onCancel ? (
        <IconButton
          variant="neutral"
          size="sm"
          aria-label={cancelLabel ?? `Cancel the upload of ${name}`}
          onClick={onCancel}
        >
          <Glyph d={PATH.closeBold} />
        </IconButton>
      ) : null}
      {status === 'failed' && onRetry ? (
        <Button
          variant="secondary"
          size="sm"
          aria-describedby={hasError ? errorId : undefined}
          onClick={onRetry}
        >
          <Glyph d={PATH.refresh} />
          {retryLabel}
        </Button>
      ) : null}
      {status !== 'uploading' && onRemove ? (
        <IconButton variant="neutral" size="sm" aria-label={removeLabel ?? `Remove ${name}`} onClick={onRemove}>
          <Glyph d={PATH.deleteBold} />
        </IconButton>
      ) : null}
    </li>
  );
});
FileUploadItem.displayName = 'FileUploadItem';
