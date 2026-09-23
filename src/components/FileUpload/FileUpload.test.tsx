import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Field } from '../Field';
import { FileUpload, FileUploadItem, FileUploadList, formatFileSize } from './FileUpload';

const MB = 1024 * 1024;

function file(name: string, bytes = 10, type = '') {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: bytes });
  return f;
}

const zone = () => document.querySelector('[data-slot="file-upload"]') as HTMLElement;
const input = () => document.querySelector('input[type="file"]') as HTMLInputElement;
const drag = (files: File[]) => ({ dataTransfer: { files, types: ['Files'], items: files, dropEffect: '' } });

describe('formatFileSize', () => {
  it('writes sizes the way the preview does', () => {
    expect(formatFileSize(1.4 * MB)).toBe('1.4 MB');
    expect(formatFileSize(312 * MB)).toBe('312 MB');
    expect(formatFileSize(25 * MB)).toBe('25 MB');
    expect(formatFileSize(820 * 1024)).toBe('820 KB');
    expect(formatFileSize(512)).toBe('512 B');
  });
});

describe('FileUpload', () => {
  it('states formats and limit, and is a labelled file input', () => {
    render(<FileUpload accept=".pdf,.zip,.ipynb,.py" maxSize={25 * MB} title="Drop your submission here" />);
    expect(zone()).toHaveAttribute('data-state', 'idle');
    expect(screen.getByText('PDF, ZIP, IPYNB or PY · up to 25 MB')).toHaveAttribute('data-slot', 'file-upload-hint');
    const el = input();
    expect(el).toHaveAttribute('accept', '.pdf,.zip,.ipynb,.py');
    expect(el).toHaveAccessibleName('Drop your submission here');
    expect(el).toHaveAccessibleDescription(/or attach it from your device.*PDF, ZIP, IPYNB or PY · up to 25 MB/);
    expect(el.className).toContain('sr-only');
    expect(screen.getByText('Browse files')).toHaveAttribute('aria-hidden', 'true');
  });

  it('a Field labels, describes and invalidates the input', () => {
    render(
      <Field label="Week 6 submission" help="One file per assignment." error="Attach your write-up before you submit.">
        <FileUpload accept=".pdf" />
      </Field>,
    );
    const el = screen.getByLabelText('Week 6 submission');
    expect(el).toBe(input());
    expect(el).toHaveAttribute('aria-invalid', 'true');
    expect(el).toHaveAccessibleDescription(/One file per assignment\..*Attach your write-up/);
    expect(zone()).toHaveAttribute('data-state', 'invalid');
  });

  it('clicking the zone opens the picker', () => {
    render(<FileUpload />);
    const click = vi.spyOn(input(), 'click');
    fireEvent.click(zone().querySelector('[data-slot="file-upload-title"]')!);
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('hands over accepted files and rejects the wrong type', () => {
    const onFilesAdded = vi.fn();
    const onFilesRejected = vi.fn();
    render(
      <FileUpload accept=".pdf,.zip,.ipynb,.py" maxSize={25 * MB} onFilesAdded={onFilesAdded} onFilesRejected={onFilesRejected} />,
    );
    const pdf = file('week-6-writeup.pdf', 1.4 * MB, 'application/pdf');
    fireEvent.change(input(), { target: { files: [pdf] } });
    expect(onFilesAdded).toHaveBeenCalledWith([pdf]);
    expect(zone()).toHaveAttribute('data-state', 'idle');

    const mov = file('demo.mov', 5 * MB, 'video/quicktime');
    fireEvent.change(input(), { target: { files: [mov] } });
    expect(onFilesRejected).toHaveBeenCalledWith([{ file: mov, reason: 'type', message: '.mov is not accepted' }]);
    expect(zone()).toHaveAttribute('data-state', 'invalid');
    expect(screen.getByText('.mov is not accepted')).toHaveAttribute('data-slot', 'file-upload-title');
    expect(screen.getByText('Accepted: PDF, ZIP, IPYNB, PY · up to 25 MB')).toBeInTheDocument();
    expect(screen.getByText('Choose another file')).toBeInTheDocument();
    expect(input()).toHaveAttribute('aria-invalid', 'true');
  });

  it('rejects a file over the size limit and over the count', () => {
    const onFilesAdded = vi.fn();
    const onFilesRejected = vi.fn();
    render(<FileUpload maxSize={25 * MB} onFilesAdded={onFilesAdded} onFilesRejected={onFilesRejected} />);
    const big = file('cohort-7-capstone-demo.zip', 312 * MB);
    fireEvent.change(input(), { target: { files: [big] } });
    expect(onFilesRejected.mock.calls[0]?.[0][0]).toMatchObject({
      reason: 'size',
      message: 'cohort-7-capstone-demo.zip is 312 MB and the limit is 25 MB',
    });

    const a = file('a.pdf');
    const b = file('b.pdf');
    fireEvent.drop(zone(), drag([a, b]));
    expect(onFilesAdded).toHaveBeenCalledWith([a]);
    expect(onFilesRejected.mock.calls[1]?.[0]).toEqual([{ file: b, reason: 'count', message: 'Attach one file at a time' }]);
  });

  it('counts files already attached against maxFiles', () => {
    const onFilesAdded = vi.fn();
    const onFilesRejected = vi.fn();
    render(<FileUpload multiple maxFiles={3} fileCount={2} onFilesAdded={onFilesAdded} onFilesRejected={onFilesRejected} />);
    expect(input()).toHaveAttribute('multiple');
    const [a, b] = [file('a.pdf'), file('b.pdf')];
    fireEvent.change(input(), { target: { files: [a, b] } });
    expect(onFilesAdded).toHaveBeenCalledWith([a]);
    expect(onFilesRejected.mock.calls[0]?.[0][0]).toMatchObject({ reason: 'count', message: 'You can attach up to 3 files' });
  });

  it('shows the drag-over state and takes a drop', () => {
    const onFilesAdded = vi.fn();
    render(<FileUpload accept=".pdf" onFilesAdded={onFilesAdded} />);
    const f = file('a.pdf');
    fireEvent.dragEnter(zone(), drag([f]));
    expect(zone()).toHaveAttribute('data-state', 'dragover');
    expect(screen.getByText('Release to attach')).toBeInTheDocument();
    expect(screen.getByText('1 file · PDF')).toBeInTheDocument();
    fireEvent.dragLeave(zone(), drag([f]));
    expect(zone()).toHaveAttribute('data-state', 'idle');
    fireEvent.dragEnter(zone(), drag([f]));
    fireEvent.drop(zone(), drag([f]));
    expect(zone()).toHaveAttribute('data-state', 'idle');
    expect(onFilesAdded).toHaveBeenCalledWith([f]);
  });

  it('disabled: no picker, drops ignored, the lock state', () => {
    const onFilesAdded = vi.fn();
    render(<FileUpload disabled title="Submissions closed" description="The deadline passed on 4 Mar 2026, 11:59 PM." onFilesAdded={onFilesAdded} />);
    expect(zone()).toHaveAttribute('data-state', 'disabled');
    expect(zone()).toHaveAttribute('aria-disabled', 'true');
    expect(input()).toBeDisabled();
    const click = vi.spyOn(input(), 'click');
    fireEvent.click(zone());
    expect(click).not.toHaveBeenCalled();
    fireEvent.drop(zone(), drag([file('a.pdf')]));
    expect(onFilesAdded).not.toHaveBeenCalled();
    expect(screen.queryByText('Browse files')).toBeNull();
  });

  it('props land on the input, className on the zone, ref on the input', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<FileUpload ref={ref} name="submission" data-testid="fu" className="p-4" />);
    expect(ref.current).toBe(input());
    expect(input()).toHaveAttribute('name', 'submission');
    expect(screen.getByTestId('fu')).toBe(input());
    expect(zone().className).toContain('p-4');
    expect(zone().className).not.toContain('p-8');
  });
});

describe('FileUploadItem', () => {
  it('uploading: progress, meta, cancel', () => {
    const onCancel = vi.fn();
    render(
      <FileUploadList aria-label="Attached files">
        <FileUploadItem
          name="avl-order-statistic-trees.ipynb"
          size={11.8 * MB}
          status="uploading"
          progress={36}
          meta="about 20 seconds left"
          onCancel={onCancel}
        />
      </FileUploadList>,
    );
    expect(screen.getByRole('list', { name: 'Attached files' })).toHaveAttribute('data-slot', 'file-upload-list');
    const row = screen.getByRole('listitem');
    expect(row).toHaveAttribute('data-status', 'uploading');
    expect(screen.getByRole('progressbar', { name: 'Uploading avl-order-statistic-trees.ipynb' })).toHaveAttribute(
      'aria-valuenow',
      '36',
    );
    expect(row).toHaveTextContent('4.2 MB of 11.8 MB · about 20 seconds left');
    expect(row).toHaveTextContent('36%');
    expect(screen.getByText('Uploading')).toHaveAttribute('data-tone', 'info');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel the upload of avl-order-statistic-trees.ipynb' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('complete: size, badge, remove', () => {
    const onRemove = vi.fn();
    render(
      <FileUploadList>
        <FileUploadItem name="week-6-writeup.pdf" size={1.4 * MB} meta="uploaded 4 Mar 2026, 11:42 PM" onRemove={onRemove} />
      </FileUploadList>,
    );
    expect(screen.getByRole('listitem')).toHaveTextContent('1.4 MB · uploaded 4 Mar 2026, 11:42 PM');
    expect(screen.getByText('Complete').closest('[data-slot="badge"]')).toHaveAttribute('data-tone', 'success');
    fireEvent.click(screen.getByRole('button', { name: 'Remove week-6-writeup.pdf' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('failed: the error describes Retry', () => {
    const onRetry = vi.fn();
    render(
      <FileUploadList>
        <FileUploadItem
          name="capstone.zip"
          status="failed"
          error="Upload failed — the file is 312 MB and the limit is 25 MB."
          onRetry={onRetry}
        />
      </FileUploadList>,
    );
    const retry = screen.getByRole('button', { name: 'Retry' });
    expect(retry).toHaveAccessibleDescription('Upload failed — the file is 312 MB and the limit is 25 MB.');
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Failed')).toHaveAttribute('data-tone', 'danger');
  });

  it('merges className last and forwards refs', () => {
    const listRef = React.createRef<HTMLUListElement>();
    const itemRef = React.createRef<HTMLLIElement>();
    render(
      <FileUploadList ref={listRef} className="rounded-md">
        <FileUploadItem ref={itemRef} name="a.pdf" className="px-2" />
      </FileUploadList>,
    );
    expect(listRef.current?.className).toContain('rounded-md');
    expect(listRef.current?.className).not.toContain('rounded-lg');
    expect(itemRef.current?.className).toContain('px-2');
    expect(itemRef.current?.className).not.toContain('px-4');
  });
});
