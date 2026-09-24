import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  FileUpload,
  FileUploadItem,
  FileUploadList,
  type FileUploadItemStatus,
  type FileUploadProps,
} from './FileUpload';
import { Field } from '../Field';
import { Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

const MB = 1024 * 1024;
const STATUSES: FileUploadItemStatus[] = ['queued', 'uploading', 'complete', 'failed'];

const meta = {
  title: 'Organisms/FileUpload',
  component: FileUpload,
  subcomponents: { FileUploadList, FileUploadItem } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A drop target plus the list of what has been attached, each row carrying its own progress and its',
          'own failure. Always state the accepted formats and the size limit before someone picks a file',
          '(`hint`, generated from `accept` + `maxSize`). Do NOT report an upload error in a toast.',
          '',
          'No upload logic: `FileUpload` validates type, size and count and hands you `File`s',
          '(`onFilesAdded`) and rejections (`onFilesRejected`); you upload and render `FileUploadItem` rows from',
          'your own state. The zone is one click target over a real `<input type="file">` — the keyboard path',
          '(Tab, then Enter or Space) and the Field\'s control: a Field label, help and error land on it.',
          '',
          'A rejected pick turns the zone invalid with the reason as its heading (".mov is not accepted") and is',
          'announced. Closed (`disabled`): the lock, no picker, drops ignored.',
        ].join('\n'),
      },
    },
  },
  args: {
    accept: '.pdf,.zip,.ipynb,.py',
    maxSize: 25 * MB,
    multiple: false,
    maxFiles: undefined,
    fileCount: 0,
    title: 'Drop your submission here',
    description: 'or attach it from your device — one file per assignment',
    browseLabel: 'Browse files',
    hint: 'PDF, ZIP, IPYNB or PY · up to 25 MB · Data Structures & Algorithms — Week 6',
    dragTitle: 'Release to attach',
    retryLabel: 'Choose another file',
    disabled: false,
  },
  argTypes: {
    accept: { control: 'text' },
    maxSize: { control: 'number' },
    multiple: { control: 'boolean' },
    maxFiles: { control: 'number' },
    fileCount: { control: 'number' },
    title: { control: 'text' },
    description: { control: 'text' },
    browseLabel: { control: 'text' },
    hint: { control: 'text' },
    dragTitle: { control: 'text' },
    retryLabel: { control: 'text' },
    disabled: { control: 'boolean' },
    name: { control: 'text' },
    icon: { control: false },
    onFilesAdded: { action: 'filesAdded' },
    onFilesRejected: { action: 'filesRejected' },
    className: { control: 'text' },
  },
  render: (args) => (
    <div style={{ maxWidth: 640 }}>
      <FileUpload {...args} />
    </div>
  ),
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The drop zone, driven by the controls (`#file-upload`, "dropzone · rest"). Pick or drop a file. */
export const Playground: Story = {};

type UploadRow = {
  id: number;
  name: string;
  size: number;
  status: FileUploadItemStatus;
  progress?: number;
  error?: string;
};

/**
 * The whole flow in a Field: pick or drop, and each accepted file "uploads"
 * (simulated) in its own row; cancel, remove and retry work. A file over 25 MB
 * or of the wrong type is turned away by the zone and reported in the Field.
 */
export const SubmissionFlow: Story = {
  name: 'Submission flow (Field + list)',
  render: function Render(args: FileUploadProps) {
    const [rows, setRows] = React.useState<UploadRow[]>([
      { id: 1, name: 'week-6-writeup.pdf', size: 1.4 * MB, status: 'complete' },
    ]);
    const [error, setError] = React.useState<string | undefined>();
    const nextId = React.useRef(2);

    React.useEffect(() => {
      if (!rows.some((r) => r.status === 'uploading')) return undefined;
      const timer = setInterval(() => {
        setRows((current) =>
          current.map((r) => {
            if (r.status !== 'uploading') return r;
            const progress = Math.min(100, (r.progress ?? 0) + 12);
            return progress >= 100 ? { ...r, progress, status: 'complete' } : { ...r, progress };
          }),
        );
      }, 400);
      return () => clearInterval(timer);
    }, [rows]);

    const update = (id: number, patch: Partial<UploadRow>) =>
      setRows((current) => current.map((r) => (r.id === id ? { ...r, ...patch } : r)));

    return (
      <div style={{ maxWidth: 640, display: 'grid', gap: 'var(--space-4)' }}>
        <Field label="Week 6 submission" help="Up to three files; the write-up and your notebooks." error={error}>
          <FileUpload
            {...args}
            multiple
            maxFiles={3}
            fileCount={rows.length}
            title="Drop your files here"
            description="or attach them from your device"
            hint={undefined}
            onFilesAdded={(files) => {
              setError(undefined);
              setRows((current) => [
                ...current,
                ...files.map((f) => ({ id: nextId.current++, name: f.name, size: f.size, status: 'uploading' as const, progress: 0 })),
              ]);
            }}
            onFilesRejected={(rejections) => setError(rejections[0]?.message)}
          />
        </Field>
        {rows.length ? (
          <FileUploadList aria-label="Attached files">
            {rows.map((r) => (
              <FileUploadItem
                key={r.id}
                name={r.name}
                size={r.size}
                status={r.status}
                progress={r.progress}
                error={r.error}
                meta={r.status === 'uploading' ? 'uploading…' : undefined}
                onCancel={() =>
                  update(r.id, { status: 'failed', error: 'Upload cancelled. Retry to send it again.' })
                }
                onRetry={() => update(r.id, { status: 'uploading', progress: 0, error: undefined })}
                onRemove={() => setRows((current) => current.filter((x) => x.id !== r.id))}
              />
            ))}
          </FileUploadList>
        ) : null}
      </div>
    );
  },
};

/** The zone states you can pin (`#file-upload`, "States"): rest, rejected, closed after the deadline. Drag a file over the Playground for drag-over. */
export const ZoneStates: Story = {
  parameters: { controls: { disable: true } },
  name: 'Zone states',
  render: () => (
    <Row align="start">
      <Spec label="rest">
        <div style={{ width: '100%', maxWidth: 300 }}>
          <FileUpload accept=".pdf,.zip,.ipynb,.py" maxSize={25 * MB} title="Drop your submission here" />
        </div>
      </Spec>
      <Spec label="rejected (Field error)">
        <div style={{ width: '100%', maxWidth: 300 }}>
          <Field label="Capstone recording" error=".mov is not accepted — export it as MP4 or link it from Drive.">
            <FileUpload accept=".pdf,.zip,.ipynb,.py" maxSize={25 * MB} />
          </Field>
        </div>
      </Spec>
      <Spec label="disabled after the deadline">
        <div style={{ width: '100%', maxWidth: 300 }}>
          <FileUpload
            disabled
            title="Submissions closed"
            description="The deadline passed on 4 Mar 2026, 11:59 PM."
          />
        </div>
      </Spec>
    </Row>
  ),
};

/** The attached list (`#file-upload`, "Uploaded files"): uploading, complete, failed with retry, queued. */
export const UploadedFiles: Story = {
  parameters: { controls: { disable: true } },
  name: 'Uploaded files',
  render: () => (
    <Stack>
      <div style={{ maxWidth: 640 }}>
        <FileUploadList aria-label="Attached files">
          <FileUploadItem
            name="avl-order-statistic-trees.ipynb"
            size={11.8 * MB}
            status="uploading"
            progress={36}
            meta="about 20 seconds left"
            onCancel={() => {}}
          />
          <FileUploadItem
            name="week-6-writeup.pdf"
            size={1.4 * MB}
            status="complete"
            meta="uploaded 4 Mar 2026, 11:42 PM"
            onRemove={() => {}}
          />
          <FileUploadItem
            name="cohort-7-capstone-demo-recording-final-v3.zip"
            status="failed"
            error="Upload failed — the file is 312 MB and the limit for this assignment is 25 MB. Compress the recording or link it from Drive instead."
            onRetry={() => {}}
          />
          <FileUploadItem name="order-statistics.py" size={14 * 1024} status="queued" meta="waiting" onRemove={() => {}} />
        </FileUploadList>
      </div>
    </Stack>
  ),
};

/** One row, driven by the controls. */
export const Item: StoryObj<typeof FileUploadItem> = {
  render: (args) => (
    <div style={{ maxWidth: 640 }}>
      <FileUploadList>
        <FileUploadItem {...args} />
      </FileUploadList>
    </div>
  ),
  args: {
    name: 'avl-order-statistic-trees.ipynb',
    size: 11.8 * MB,
    status: 'uploading',
    progress: 36,
    meta: 'about 20 seconds left',
    error: 'Upload failed — the connection dropped. Retry to send it again.',
  },
  argTypes: {
    name: { control: 'text' },
    size: { control: 'number' },
    status: { control: 'select', options: STATUSES },
    progress: { control: { type: 'range', min: 0, max: 100 } },
    meta: { control: 'text' },
    error: { control: 'text' },
    statusLabel: { control: 'text' },
    onCancel: { action: 'cancel' },
    onRemove: { action: 'remove' },
    onRetry: { action: 'retry' },
  },
};
