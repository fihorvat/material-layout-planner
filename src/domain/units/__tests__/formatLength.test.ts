import { describe, it, expect } from 'vitest';
import { formatLength } from '../formatLength';

describe('formatLength', () => {
  it('formats with default mm unit', () => {
    expect(formatLength(600)).toBe('600 mm');
  });

  it('auto picks mm/cm/m by magnitude', () => {
    expect(formatLength(2300, { unit: 'auto' })).toBe('2.3 m');
    expect(formatLength(230, { unit: 'auto' })).toBe('23 cm');
    expect(formatLength(23, { unit: 'auto' })).toBe('23 mm');
    expect(formatLength(0, { unit: 'auto' })).toBe('0 mm');
  });

  it('respects unit override', () => {
    expect(formatLength(1500, { unit: 'cm' })).toBe('150 cm');
    expect(formatLength(1500, { unit: 'm' })).toBe('1.5 m');
  });

  it('respects decimals override', () => {
    expect(formatLength(1234, { unit: 'mm', decimals: 0 })).toBe('1234 mm');
    expect(formatLength(1234.567, { unit: 'mm', decimals: 2 })).toBe('1234.57 mm');
  });

  it('trims trailing zeros', () => {
    expect(formatLength(1000, { unit: 'm' })).toBe('1 m');
    expect(formatLength(2000, { unit: 'auto' })).toBe('2 m');
  });
});
