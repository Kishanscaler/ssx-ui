import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { IconButton } from '../IconButton';
import { ToolbarSpacer } from '../Toolbar';
import {
  ChatComposer,
  ChatComposerAttachment,
  ChatComposerAttachments,
  ChatComposerFooter,
  ChatComposerHeader,
  ChatComposerInput,
  ChatComposerSend,
  ChatComposerStatus,
  type ChatComposerProps,
} from './ChatComposer';

const G = () => <svg aria-hidden="true" />;

function Composer(props: Partial<ChatComposerProps> & { children?: React.ReactNode }) {
  const { children, ...rest } = props;
  return (
    <ChatComposer {...rest}>
      {children}
      <ChatComposerInput placeholder="Ask about binary search…" />
      <ChatComposerFooter>
        <IconButton variant="tertiary" aria-label="Attach a file">
          <G />
        </IconButton>
        <ToolbarSpacer />
        <ChatComposerSend />
      </ChatComposerFooter>
    </ChatComposer>
  );
}

const input = () => screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement;
const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
const enter = (init: Partial<KeyboardEventInit> & { keyCode?: number } = {}) =>
  fireEvent.keyDown(input(), { key: 'Enter', code: 'Enter', ...init });

describe('ChatComposer', () => {
  it('is a form with slotted parts; the input is named "Message" and starts one row tall', () => {
    render(<Composer />);
    const form = input().closest('form');
    expect(form).toHaveAttribute('data-slot', 'chat-composer');
    expect(form).toHaveAttribute('data-elevation', 'raised');
    expect(form?.querySelector('[data-slot="chat-composer-body"]')).toHaveClass('bg-surface-raised', 'shadow-raised');
    expect(input()).toHaveAttribute('data-slot', 'chat-composer-input');
    expect(input()).toHaveAttribute('rows', '1');
    expect(input()).toHaveAttribute('enterkeyhint', 'send');
    expect(input()).toHaveClass('field-sizing-content', 'border-0', 'max-h-(--chat-composer-input-max-height)', 'overflow-y-auto');
    expect(screen.getByRole('toolbar', { name: 'Message options' })).toBeInTheDocument();
  });

  it('Enter sends the draft and clears it; Shift+Enter does not send', () => {
    const onSubmit = vi.fn();
    render(<Composer onSubmit={onSubmit} />);
    type('Why is the pivot the minimum?');
    const shift = enter({ shiftKey: true });
    expect(shift).toBe(true); // not prevented: the browser inserts the newline
    expect(onSubmit).not.toHaveBeenCalled();
    const plain = enter();
    expect(plain).toBe(false); // prevented: no newline
    expect(onSubmit).toHaveBeenCalledWith('Why is the pivot the minimum?');
    expect(input().value).toBe('');
  });

  it('never sends while an IME composition is active (isComposing, keyCode 229, composition events)', () => {
    const onSubmit = vi.fn();
    render(<Composer onSubmit={onSubmit} />);
    type('बाइनरी सर्च');
    enter({ isComposing: true });
    enter({ keyCode: 229 });
    fireEvent.compositionStart(input());
    enter();
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input());
    enter();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('बाइनरी सर्च');
  });

  it('never sends an empty or whitespace draft; Send is disabled then', () => {
    const onSubmit = vi.fn();
    render(<Composer onSubmit={onSubmit} />);
    const send = screen.getByRole('button', { name: 'Send message' });
    expect(send).toBeDisabled();
    type('   \n  ');
    expect(send).toBeDisabled();
    enter();
    expect(onSubmit).not.toHaveBeenCalled();
    type('Explain lower_bound');
    expect(send).toBeEnabled();
    expect(send).toHaveAttribute('type', 'submit');
    expect(send).toHaveAttribute('data-state', 'send');
  });

  it('the Send button submits the form and focus returns to the input', () => {
    const onSubmit = vi.fn();
    render(<Composer onSubmit={onSubmit} />);
    type('Is the array rotated at index 4?');
    const send = screen.getByRole('button', { name: 'Send message' });
    send.focus();
    fireEvent.click(send);
    expect(onSubmit).toHaveBeenCalledWith('Is the array rotated at index 4?');
    expect(input().value).toBe('');
    expect(send).toBeDisabled();
    expect(document.activeElement).toBe(input());
  });

  it('keeps the draft when onSubmit returns false', () => {
    render(<Composer onSubmit={() => false} />);
    type('Keep me');
    enter();
    expect(input().value).toBe('Keep me');
  });

  it('puts the draft back when an async send fails, unless the user typed again', async () => {
    let reject!: (e: Error) => void;
    const onSubmit = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    render(<Composer onSubmit={onSubmit} />);
    type('Retry me');
    enter();
    expect(input().value).toBe(''); // cleared at once: reads as sent
    await act(async () => {
      reject(new Error('offline'));
    });
    expect(input().value).toBe('Retry me');

    let resolveFalse!: (v: boolean) => void;
    onSubmit.mockImplementationOnce(() => new Promise<boolean>((r) => (resolveFalse = r)) as unknown as Promise<void>);
    enter();
    type('something new');
    await act(async () => {
      resolveFalse(false);
    });
    expect(input().value).toBe('something new');
  });

  it('controlled: the clear arrives as onValueChange("")', () => {
    function Controlled({ onValueChange }: { onValueChange: (v: string) => void }) {
      const [value, setValue] = React.useState('Hello tutor');
      return (
        <Composer
          value={value}
          onValueChange={(v) => {
            onValueChange(v);
            setValue(v);
          }}
          onSubmit={() => {}}
        />
      );
    }
    const spy = vi.fn();
    render(<Controlled onValueChange={spy} />);
    expect(input().value).toBe('Hello tutor');
    enter();
    expect(spy).toHaveBeenLastCalledWith('');
    expect(input().value).toBe('');
  });

  it('streaming: Send becomes Stop (never disabled), Enter does not send, Escape stops', () => {
    const onSubmit = vi.fn();
    const onStop = vi.fn();
    const { rerender } = render(<Composer onSubmit={onSubmit} onStop={onStop} streaming />);
    expect(screen.queryByRole('button', { name: 'Send message' })).toBeNull();
    const stop = screen.getByRole('button', { name: 'Stop generating' });
    expect(stop).toBeEnabled();
    expect(stop).toHaveAttribute('type', 'button');
    expect(stop).toHaveAttribute('data-state', 'stop');
    expect(input().closest('form')).toHaveAttribute('data-streaming', '');

    type('Next question while it streams');
    enter();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input().value).toBe('Next question while it streams');

    fireEvent.keyDown(input(), { key: 'Escape' });
    expect(onStop).toHaveBeenCalledTimes(1);
    fireEvent.click(stop);
    expect(onStop).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(input());

    rerender(<Composer onSubmit={onSubmit} onStop={onStop} />);
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
    fireEvent.keyDown(input(), { key: 'Escape' });
    expect(onStop).toHaveBeenCalledTimes(2); // Escape only stops while streaming
  });

  it('Stop that becomes a disabled Send hands focus to the input', () => {
    const { rerender } = render(<Composer streaming onStop={() => {}} />);
    const stop = screen.getByRole('button', { name: 'Stop generating' });
    stop.focus();
    rerender(<Composer onStop={() => {}} />);
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    expect(document.activeElement).toBe(input());
  });

  it('disabled disables the input and Send; the frame takes the disabled fill', () => {
    render(<Composer disabled defaultValue="Draft" />);
    expect(input()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    expect(input().closest('[data-slot="chat-composer-body"]')).toHaveAttribute('data-disabled', '');
    // Your own controls in the frame too: the frame is a disabled fieldset.
    expect(screen.getByRole('button', { name: 'Attach a file' })).toBeDisabled();
  });

  it('disabled while streaming keeps Stop usable', () => {
    const onStop = vi.fn();
    render(<Composer disabled streaming onStop={onStop} />);
    const stop = screen.getByRole('button', { name: 'Stop generating' });
    expect(stop).toBeEnabled();
    expect(input()).toBeDisabled();
    fireEvent.click(stop);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('Escape still stops when an enclosing drawer already prevented it; your own handler can cancel', () => {
    const onStop = vi.fn();
    render(
      <div
        onKeyDownCapture={(e) => {
          if (e.key === 'Escape') e.preventDefault();
        }}
      >
        <Composer streaming onStop={onStop} />
      </div>,
    );
    fireEvent.keyDown(input(), { key: 'Escape' });
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('a preventDefault in your onKeyDown cancels the send', () => {
    const onSubmit = vi.fn();
    render(
      <ChatComposer onSubmit={onSubmit}>
        <ChatComposerInput onKeyDown={(e) => e.preventDefault()} />
      </ChatComposer>,
    );
    type('hello');
    enter();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('flat elevation draws the field border and focus ring', () => {
    render(<Composer elevation="flat" />);
    const body = input().closest('[data-slot="chat-composer-body"]') as HTMLElement;
    expect(body).toHaveClass('border-field-border', 'bg-field');
    expect(body.className).toContain('has-[[data-slot=chat-composer-input]:focus-visible]:ring-halo');
    expect(body).not.toHaveAttribute('data-elevation');
  });

  it('the footer toolbar cascades sm; Send stays md and outside the toolbar', () => {
    render(<Composer />);
    const toolbar = screen.getByRole('toolbar', { name: 'Message options' });
    expect(screen.getByRole('button', { name: 'Attach a file' })).toHaveAttribute('data-size', 'icon-sm');
    const send = screen.getByRole('button', { name: 'Send message' });
    expect(send).toHaveAttribute('data-size', 'icon-md');
    expect(toolbar.contains(send)).toBe(false);
    expect(send.parentElement).toHaveAttribute('data-slot', 'chat-composer-footer');
  });

  it('a label from outside via aria-labelledby replaces the default name', () => {
    render(
      <ChatComposer>
        <span id="lbl">Ask the DSA tutor</span>
        <ChatComposerInput aria-labelledby="lbl" />
      </ChatComposer>,
    );
    expect(screen.getByRole('textbox', { name: 'Ask the DSA tutor' })).not.toHaveAttribute('aria-label');
  });

  it('parts throw a clear error outside a ChatComposer', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ChatComposerSend />)).toThrow('ChatComposerSend must be used inside a <ChatComposer>.');
    spy.mockRestore();
  });
});

describe('ChatComposerAttachments', () => {
  function Files({ collapseAfter }: { collapseAfter?: number }) {
    const [files, setFiles] = React.useState(['assignment-3.pdf', 'binary-search.py', 'notes.md']);
    return (
      <ChatComposer>
        <ChatComposerAttachments collapseAfter={collapseAfter}>
          {files.map((f) => (
            <ChatComposerAttachment key={f} onRemove={() => setFiles((all) => all.filter((x) => x !== f))}>
              {f}
            </ChatComposerAttachment>
          ))}
        </ChatComposerAttachments>
        <ChatComposerInput />
      </ChatComposer>
    );
  }

  it('lists removable chips; removing one moves focus to the next ✕, the last to the input', () => {
    render(<Files />);
    const group = screen.getByRole('group', { name: 'Attachments' });
    expect(group).toHaveAttribute('data-slot', 'chat-composer-attachments');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Remove assignment-3.pdf' }));
    expect(screen.queryByText('assignment-3.pdf')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove binary-search.py' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove notes.md' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove binary-search.py' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove binary-search.py' }));
    expect(screen.queryByRole('group', { name: 'Attachments' })).toBeNull();
    expect(document.activeElement).toBe(input());
  });

  it('collapses to "N files" past collapseAfter, with aria-expanded', () => {
    render(<Files collapseAfter={2} />);
    const toggle = screen.getByRole('button', { name: '3 files' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const list = document.getElementById(toggle.getAttribute('aria-controls') as string);
    expect(list).not.toHaveAttribute('hidden');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(list).toHaveAttribute('hidden');
    expect(screen.getByRole('group', { name: 'Attachments' })).toHaveAttribute('data-state', 'collapsed');
    fireEvent.click(toggle);
    expect(list).not.toHaveAttribute('hidden');
  });

  it('no toggle at or under the threshold', () => {
    render(<Files />);
    expect(screen.queryByRole('button', { name: '3 files' })).toBeNull();
  });

  it('shows upload progress and an error per file', () => {
    render(
      <ChatComposer>
        <ChatComposerAttachments>
          <ChatComposerAttachment progress={40} onRemove={() => {}}>
            binary-search.py
          </ChatComposerAttachment>
          <ChatComposerAttachment error="Too large: 25 MB max" onRemove={() => {}}>
            lecture-12.mp4
          </ChatComposerAttachment>
          <ChatComposerAttachment progress={100}>assignment-3.pdf</ChatComposerAttachment>
        </ChatComposerAttachments>
        <ChatComposerInput />
      </ChatComposer>,
    );
    const bar = screen.getByRole('progressbar', { name: 'Uploading binary-search.py' });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.getAttribute('data-status'))).toEqual(['uploading', 'error', 'ready']);
    expect(screen.getByText('Too large: 25 MB max')).toHaveClass('text-danger-content');
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    // Not removable: no control in it at all.
    expect(items[2]?.querySelector('button')).toBeNull();
  });
});

describe('ChatComposerStatus', () => {
  it('is a polite live region that stays mounted, drawn above the frame by default', () => {
    const { rerender } = render(
      <Composer>
        <ChatComposerStatus />
      </Composer>,
    );
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toBeEmptyDOMElement();
    const form = region.closest('form') as HTMLFormElement;
    expect(form.firstElementChild).toBe(region);

    rerender(
      <Composer>
        <ChatComposerStatus tone="danger" title="Couldn't send. Check your connection and try again." />
      </Composer>,
    );
    expect(screen.getByRole('status')).toBe(region);
    expect(region).toHaveTextContent("Couldn't send. Check your connection and try again.");
    // Polite even for danger: the Alert inside takes no live role of its own.
    expect(region.querySelector('[data-slot="alert"]')).toHaveAttribute('role', 'none');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('statusPosition="below" draws it after the frame', () => {
    render(
      <Composer statusPosition="below">
        <ChatComposerStatus tone="warning" title="Context window is 90% full" />
      </Composer>,
    );
    const form = screen.getByRole('status').closest('form') as HTMLFormElement;
    expect(form.lastElementChild).toBe(screen.getByRole('status'));
    expect(form).toHaveAttribute('data-status-position', 'below');
  });
});

describe('ChatComposerHeader', () => {
  it('is a small toolbar row above the input', () => {
    render(
      <ChatComposer>
        <ChatComposerHeader aria-label="Chat context">
          <IconButton variant="tertiary" aria-label="Pick a topic">
            <G />
          </IconButton>
        </ChatComposerHeader>
        <ChatComposerInput />
      </ChatComposer>,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Chat context' });
    expect(toolbar).toHaveAttribute('data-size', 'sm');
    expect(toolbar.parentElement).toHaveAttribute('data-slot', 'chat-composer-header');
    expect(screen.getByRole('button', { name: 'Pick a topic' })).toHaveAttribute('data-size', 'icon-sm');
  });
});
