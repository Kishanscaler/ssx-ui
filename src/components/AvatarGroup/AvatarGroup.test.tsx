import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// The Avatar Group MOLECULE is the existing atom export; this file holds the
// molecule-level contract from the HTML's `avatar-group` block, not a new
// component. See AvatarGroup.stories.tsx.
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '../Avatar';

const COHORT = [
  ['Aarav Krishnan', 'AK'],
  ['Diya Menon', 'DM'],
  ['Kabir Sethi', 'KS'],
] as const;

describe('AvatarGroup (molecule contract)', () => {
  it('group-labelled form: one role="img" names everyone; the "+N" is not read twice', () => {
    render(
      <AvatarGroup size="sm" aria-label="Aarav Krishnan, Diya Menon, Kabir Sethi and 7 more students in Cohort 7">
        {COHORT.map(([, initials]) => (
          <Avatar key={initials}>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        ))}
        <AvatarGroupCount>+7</AvatarGroupCount>
      </AvatarGroup>,
    );
    const group = screen.getByRole('img', {
      name: 'Aarav Krishnan, Diya Menon, Kabir Sethi and 7 more students in Cohort 7',
    });
    expect(group).toHaveAttribute('data-slot', 'avatar-group');
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByText('+7')).toHaveAttribute('aria-hidden', 'true');
  });

  it('per-avatar form (the HTML): each avatar and the overflow count are named images', () => {
    render(
      <AvatarGroup size="sm">
        {COHORT.map(([name, initials]) => (
          <Avatar key={initials} aria-label={name}>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        ))}
        {/* The count's aria-hidden is a default the caller can override. */}
        <AvatarGroupCount role="img" aria-hidden={false} aria-label="7 more students in Cohort 7">
          +7
        </AvatarGroupCount>
      </AvatarGroup>,
    );
    const group = document.querySelector('[data-slot=avatar-group]');
    expect(group).not.toHaveAttribute('role');
    const imgs = screen.getAllByRole('img');
    expect(imgs.map((i) => i.getAttribute('aria-label'))).toEqual([
      'Aarav Krishnan',
      'Diya Menon',
      'Kabir Sethi',
      '7 more students in Cohort 7',
    ]);
  });

  it.each([
    ['sm', 'size-7'],
    ['md', 'size-control-md'],
    ['lg', 'size-control-lg'],
  ] as const)('size %s reaches every avatar and the count', (size, cls) => {
    render(
      <AvatarGroup size={size} aria-label="Mentors and 3 more">
        <Avatar>
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>,
    );
    const avatar = document.querySelector('[data-slot=avatar]');
    const count = document.querySelector('[data-slot=avatar-group-count]');
    expect(avatar).toHaveAttribute('data-size', size);
    expect(count).toHaveAttribute('data-size', size);
    expect(avatar).toHaveClass(cls);
    expect(count).toHaveClass(cls);
  });

  it('overlaps by 10px and cuts each avatar out with a surface ring (the HTML’s -10px + 2px surface)', () => {
    render(
      <AvatarGroup aria-label="Panel">
        <Avatar>
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
      </AvatarGroup>,
    );
    const group = screen.getByRole('img');
    expect(group).toHaveClass('-space-x-2.5');
    expect(group.className).toContain('*:data-[slot=avatar]:ring-surface');
    expect(group.className).toContain('*:data-[slot=avatar-group-count]:ring-surface');
  });
});
