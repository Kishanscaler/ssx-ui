import * as React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useId } from './use-id';
import { composeRefs } from './compose-refs';
import { useComposedRefs } from './use-composed-refs';

/** Runs on React 19 (`React.useId`) AND React 16.12 (the counter fallback). */
describe('useId', () => {
  function Probe({ id }: { id?: string }) {
    const value = useId(id);
    return <span data-testid="probe" data-id={value} />;
  }

  it('is unique per component and stable across re-renders', () => {
    const { getAllByTestId, rerender } = render(
      <>
        <Probe />
        <Probe />
      </>,
    );
    const [a, b] = getAllByTestId('probe').map((el) => el.getAttribute('data-id'));
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);

    rerender(
      <>
        <Probe />
        <Probe />
      </>,
    );
    expect(getAllByTestId('probe').map((el) => el.getAttribute('data-id'))).toEqual([a, b]);
  });

  it("lets the caller's id win", () => {
    const { getByTestId } = render(<Probe id="work-email" />);
    expect(getByTestId('probe')).toHaveAttribute('data-id', 'work-email');
  });
});

describe('composeRefs / useComposedRefs', () => {
  it('hands one node to an object ref and a callback ref', () => {
    const object = React.createRef<HTMLDivElement>();
    let called: HTMLDivElement | null = null;
    const callback = (node: HTMLDivElement | null) => {
      called = node;
    };
    composeRefs<HTMLDivElement>(object, callback, undefined)(document.createElement('div'));
    expect(object.current).toBeInstanceOf(HTMLDivElement);
    expect(called).toBe(object.current);
  });

  it('composes a forwarded ref with an inner one inside a forwardRef atom', () => {
    const Field = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<'input'>>(
      function Field(props, forwarded) {
        const inner = React.useRef<HTMLInputElement>(null);
        const ref = useComposedRefs(forwarded, inner);
        return <input ref={ref} {...props} />;
      },
    );
    const outer = React.createRef<HTMLInputElement>();
    render(<Field ref={outer} aria-label="Name" />);
    expect(outer.current).toBeInstanceOf(HTMLInputElement);
  });
});
