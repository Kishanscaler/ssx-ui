import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Button } from '../Button';
import { Field } from '../Field';
import { Input } from '../Input';
import { Form, type FormError } from './Form';
import { FormActions } from './FormActions';
import { FormErrorSummary } from './FormErrorSummary';

/**
 * CONTRACT tests. Form decides where focus goes after a failed submit;
 * FormErrorSummary lists errors as links that focus their fields; FormActions
 * is layout. None of them owns values or rules.
 */

type Errors = Record<string, string | undefined>;

/** A plain-state application form: validates in onSubmit, renders Fields. */
function PlainStateForm({ withSummary = true, onValid }: { withSummary?: boolean; onValid?: () => void }) {
  const [errors, setErrors] = React.useState<Errors>({});
  return (
    <Form
      aria-label="Application"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const next: Errors = {};
        if (!data.get('name')) next.name = 'Enter your full name';
        if (!String(data.get('email') ?? '').endsWith('@scaler.com')) next.email = 'Enter your @scaler.com email';
        setErrors(next);
        if (Object.keys(next).length === 0) onValid?.();
      }}
    >
      {withSummary ? <FormErrorSummary errors={errors} /> : null}
      <Field label="Full name" controlId="name" error={errors.name}>
        <Input name="name" />
      </Field>
      <Field label="Scaler email" controlId="email" error={errors.email}>
        <Input name="email" type="email" />
      </Field>
      <FormActions>
        <Button type="submit">Submit application</Button>
      </FormActions>
    </Form>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Form', () => {
  it('renders a <form> with noValidate on by default, and lets it be turned off', () => {
    const { rerender } = render(<Form aria-label="Apply" />);
    const form = screen.getByRole('form', { name: 'Apply' });
    expect(form).toHaveAttribute('data-slot', 'form');
    expect(form).toHaveAttribute('novalidate');
    rerender(<Form aria-label="Apply" noValidate={false} />);
    expect(form).not.toHaveAttribute('novalidate');
  });

  it('forwards the ref and merges className', () => {
    const ref = React.createRef<HTMLFormElement>();
    render(<Form ref={ref} aria-label="Apply" className="max-w-lg" />);
    expect(ref.current?.tagName).toBe('FORM');
    expect(ref.current?.className).toContain('max-w-lg');
    expect(ref.current?.className).toContain('grid');
  });

  it('moves focus to the error summary after a failed submit', () => {
    render(<PlainStateForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Submit application' }));
    const summary = document.querySelector('[data-slot=form-error-summary]');
    expect(summary).not.toBeNull();
    expect(summary).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'There are 2 problems' })).toBeInTheDocument();
  });

  it('moves focus to the first invalid field when there is no summary', () => {
    render(<PlainStateForm withSummary={false} />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Aarav Krishnan' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit application' }));
    // Name passed; email is the first aria-invalid control.
    expect(screen.getByLabelText('Scaler email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Scaler email')).toHaveFocus();
  });

  it('re-focuses the summary on a second failed submit', () => {
    render(<PlainStateForm />);
    const submit = screen.getByRole('button', { name: 'Submit application' });
    fireEvent.click(submit);
    screen.getByLabelText('Full name').focus();
    fireEvent.click(submit);
    expect(document.querySelector('[data-slot=form-error-summary]')).toHaveFocus();
  });

  it('leaves focus alone after a successful submit', () => {
    const onValid = vi.fn();
    render(<PlainStateForm onValid={onValid} />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Aarav Krishnan' } });
    fireEvent.change(screen.getByLabelText('Scaler email'), { target: { value: 'aarav.k@scaler.com' } });
    const submit = screen.getByRole('button', { name: 'Submit application' });
    submit.focus();
    fireEvent.click(submit);
    expect(onValid).toHaveBeenCalledTimes(1);
    expect(submit).toHaveFocus();
    expect(document.querySelector('[data-slot=form-error-summary]')).toBeNull();
  });

  it('does not move focus when focusOnError is off', () => {
    function Harness() {
      const [error, setError] = React.useState<string>();
      return (
        <Form
          aria-label="Apply"
          focusOnError={false}
          onSubmit={(event) => {
            event.preventDefault();
            setError('Enter your full name');
          }}
        >
          <Field label="Full name" error={error}>
            <Input />
          </Field>
          <Button type="submit">Submit</Button>
        </Form>
      );
    }
    render(<Harness />);
    const submit = screen.getByRole('button', { name: 'Submit' });
    submit.focus();
    fireEvent.click(submit);
    expect(screen.getByLabelText('Full name')).toHaveAttribute('aria-invalid', 'true');
    expect(submit).toHaveFocus();
  });

  describe('native constraints', () => {
    function NativeForm({
      onSubmit,
      constraintValidation,
    }: {
      onSubmit: () => void;
      constraintValidation?: boolean;
    }) {
      const [errors, setErrors] = React.useState<FormError[]>([]);
      const byId = Object.fromEntries(errors.map((e) => [e.fieldId, 'Required']));
      return (
        <Form
          aria-label="Apply"
          constraintValidation={constraintValidation}
          onInvalidSubmit={(list) => setErrors(list)}
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Field label="City" controlId="city" error={byId.city}>
            <Input name="city" defaultValue="Bengaluru" required />
          </Field>
          <Field label="Pincode" controlId="pin" error={byId.pin}>
            <Input name="pin" required />
          </Field>
          <Button type="submit">Submit</Button>
        </Form>
      );
    }

    it('cancels the submit, reports the failures as FormErrors and focuses the first', () => {
      const onSubmit = vi.fn();
      const onInvalidSubmit = vi.fn();
      render(
        <Form aria-label="Apply" onInvalidSubmit={onInvalidSubmit} onSubmit={onSubmit}>
          <Input aria-label="City" id="city" defaultValue="Bengaluru" required />
          <Input aria-label="Pincode" id="pin" required />
          <Input aria-label="Email" id="mail" type="email" defaultValue="not-an-email" />
          <Button type="submit">Submit</Button>
        </Form>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onInvalidSubmit).toHaveBeenCalledTimes(1);
      const errors = onInvalidSubmit.mock.calls[0]![0] as FormError[];
      expect(errors.map((e) => e.fieldId)).toEqual(['pin', 'mail']);
      // No error UI was rendered, so focus falls back to the first failure.
      expect(screen.getByLabelText('Pincode')).toHaveFocus();
    });

    it('focuses the first field the consumer then marks invalid', () => {
      const onSubmit = vi.fn();
      render(<NativeForm onSubmit={onSubmit} />);
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByLabelText('Pincode')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Pincode')).toHaveFocus();
    });

    it('falls back to the browser message when nothing handles an invalid submit', () => {
      const onSubmit = vi.fn();
      const report = vi.spyOn(HTMLFormElement.prototype, 'reportValidity').mockReturnValue(false);
      render(
        <Form aria-label="Apply" onSubmit={onSubmit}>
          <Input aria-label="Pincode" required />
          <Button type="submit">Submit</Button>
        </Form>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
      expect(report).toHaveBeenCalledTimes(1);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('skips the check with constraintValidation={false}', () => {
      const onSubmit = vi.fn();
      render(<NativeForm onSubmit={onSubmit} constraintValidation={false} />);
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});

describe('FormErrorSummary', () => {
  it('renders nothing without errors, so it can be written unconditionally', () => {
    const { container, rerender } = render(<FormErrorSummary errors={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<FormErrorSummary errors={{ name: undefined, email: '' }} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<FormErrorSummary />);
    expect(container).toBeEmptyDOMElement();
  });

  it('counts in the heading, singular and plural, at the chosen level', () => {
    const { rerender } = render(<FormErrorSummary errors={[{ fieldId: 'a', message: 'Enter your name' }]} />);
    expect(screen.getByRole('heading', { level: 2, name: 'There is a problem' })).toBeInTheDocument();
    rerender(
      <FormErrorSummary
        headingAs="h3"
        errors={[
          { fieldId: 'a', message: 'One' },
          { fieldId: 'b', message: 'Two' },
          { fieldId: 'c', message: 'Three' },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'There are 3 problems' })).toBeInTheDocument();
    rerender(<FormErrorSummary title={(n) => `${n} fields need attention`} errors={{ a: 'One' }} />);
    expect(screen.getByRole('heading', { name: '1 fields need attention' })).toBeInTheDocument();
  });

  it('links each error to its field, and following a link focuses the field', () => {
    render(
      <>
        <FormErrorSummary
          errors={[
            { fieldId: 'fee', message: 'Enter the fee in rupees' },
            { message: 'Payment gateway timed out. Try again.' },
          ]}
        />
        <Field label="Semester fee" controlId="fee">
          <Input />
        </Field>
      </>,
    );
    const link = screen.getByRole('link', { name: 'Enter the fee in rupees' });
    expect(link).toHaveAttribute('href', '#fee');
    fireEvent.click(link);
    expect(screen.getByLabelText('Semester fee')).toHaveFocus();
    // A form-level error has no field to go to: text, not a link.
    expect(screen.getByText('Payment gateway timed out. Try again.').tagName).toBe('LI');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('takes an object keyed by field id', () => {
    render(<FormErrorSummary errors={{ email: 'Enter your @scaler.com email', phone: undefined }} />);
    expect(screen.getByRole('link', { name: 'Enter your @scaler.com email' })).toHaveAttribute('href', '#email');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('focuses a radio group’s radio when the id names the group', () => {
    render(
      <>
        <FormErrorSummary autoFocus={false} errors={{ track: 'Choose a track' }} />
        <div id="track" role="radiogroup" aria-label="Track">
          <button type="button" role="radio" aria-checked="false">
            Data
          </button>
          <button type="button" role="radio" aria-checked="true">
            Product
          </button>
        </div>
      </>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Choose a track' }));
    expect(screen.getByRole('radio', { name: 'Product' })).toHaveFocus();
  });

  it('is an alert, and focuses itself when errors appear', () => {
    const { rerender } = render(<FormErrorSummary errors={[]} />);
    rerender(<FormErrorSummary errors={{ name: 'Enter your full name' }} />);
    const summary = document.querySelector('[data-slot=form-error-summary]') as HTMLElement;
    expect(summary).toHaveFocus();
    expect(summary).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('alert')).toHaveTextContent('There is a problemEnter your full name');
  });

  it('focuses when mounted with errors (a server action result), unless autoFocus is off', () => {
    const { unmount } = render(<FormErrorSummary errors={{ name: 'Enter your full name' }} />);
    expect(document.querySelector('[data-slot=form-error-summary]')).toHaveFocus();
    unmount();
    render(<FormErrorSummary autoFocus={false} errors={{ name: 'Enter your full name' }} />);
    expect(document.querySelector('[data-slot=form-error-summary]')).not.toHaveFocus();
  });

  it('does not steal focus again while errors stay on screen', () => {
    const { rerender } = render(<FormErrorSummary errors={{ a: 'One', b: 'Two' }} />);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    rerender(<FormErrorSummary errors={{ a: 'One' }} />);
    expect(input).toHaveFocus();
    input.remove();
  });

  it('uses the danger Alert recipe', () => {
    render(<FormErrorSummary errors={{ a: 'One' }} className="mb-4" />);
    const summary = document.querySelector('[data-slot=form-error-summary]') as HTMLElement;
    expect(summary.className).toContain('bg-danger-surface');
    expect(summary.className).toContain('border-danger-border');
    expect(summary.className).toContain('mb-4');
  });
});

describe('FormActions', () => {
  it('sticky reads the scroll-pad contract, so it sits flush to the container, not floating', () => {
    render(
      <FormActions sticky data-testid="actions">
        <button type="button">Submit</button>
      </FormActions>,
    );
    const bar = screen.getByTestId('actions');
    expect(bar).toHaveAttribute('data-sticky');
    expect(bar.className).toContain('bottom-[calc(-1*var(--scroll-pad-bottom,0px))]');
    expect(bar.className).toContain('-mx-[var(--scroll-pad-x,0px)]');
    expect(bar.className).toContain('px-[var(--scroll-pad-x,0px)]');
    expect(bar.className).toContain('last:-mb-[var(--scroll-pad-bottom,0px)]');
  });

  it('keeps the markup order: safe answer first, primary last', () => {
    render(
      <FormActions data-testid="actions">
        <Button variant="secondary">Save draft</Button>
        <Button type="submit">Submit application</Button>
      </FormActions>,
    );
    const actions = screen.getByTestId('actions');
    expect(actions).toHaveAttribute('data-slot', 'form-actions');
    expect(actions).not.toHaveAttribute('data-sticky');
    const buttons = screen.getAllByRole('button').map((b) => b.textContent);
    expect(buttons).toEqual(['Save draft', 'Submit application']);
    // Stacked on phones (no reverse: visual order is tab order), a row from sm.
    expect(actions.className).toContain('flex-col');
    expect(actions.className).not.toContain('flex-col-reverse');
    expect(actions.className).toContain('sm:justify-end');
  });

  it('pins to the bottom with a hairline and the safe-area inset when sticky', () => {
    render(<FormActions sticky data-testid="actions" />);
    const actions = screen.getByTestId('actions');
    expect(actions).toHaveAttribute('data-sticky');
    expect(actions.className).toContain('sticky');
    expect(actions.className).toContain('bottom-[calc(-1*var(--scroll-pad-bottom,0px))]');
    expect(actions.className).toContain('border-t');
    expect(actions.className).toContain('env(safe-area-inset-bottom');
  });
});
