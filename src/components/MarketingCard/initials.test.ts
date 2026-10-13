import { describe, expect, it } from 'vitest';

import { initials } from './initials';

describe('initials', () => {
  it('first letters of up to two words, a "Dr." dropped', () => {
    expect(initials('Aashish US')).toBe('AU');
    expect(initials('ravi kumar singh')).toBe('RK');
    expect(initials('Dr. Priya Menon')).toBe('PM');
    expect(initials('dr Priya Menon')).toBe('PM');
    expect(initials('Madhuker')).toBe('M');
    expect(initials('  Sanjay   Kumar ')).toBe('SK');
    expect(initials('')).toBe('');
  });

  it('a name that only starts with "Dr" keeps its letter', () => {
    expect(initials('Drishti Rao')).toBe('DR');
  });
});
