import { describe, it, expect } from 'vitest';
import { parseLength, ParseLengthError } from '../parseLength';

describe('parseLength', () => {
  it.each([
    [600, 600],
    ['600', 600],
    ['600 mm', 600],
    ['600mm', 600],
    ['60 cm', 600],
    ['60cm', 600],
    ['0.6 m', 600],
    ['2.3cm', 23],
    ['3 mm', 3],
    [' 1,5 m ', 1500],
    ['0', 0],
    ['0 mm', 0],
  ])('parses %s -> %d mm', (input, expected) => {
    expect(parseLength(input).mm).toBeCloseTo(expected, 9);
  });

  it('respects defaultUnit', () => {
    expect(parseLength('5', { defaultUnit: 'cm' }).mm).toBe(50);
    expect(parseLength('1', { defaultUnit: 'm' }).mm).toBe(1000);
  });

  it('throws on empty string', () => {
    expect(() => parseLength('')).toThrow(ParseLengthError);
    expect(() => parseLength('   ')).toThrow(ParseLengthError);
    try {
      parseLength('');
    } catch (e) {
      expect((e as ParseLengthError).code).toBe('empty');
    }
  });

  it('throws on negative values', () => {
    expect(() => parseLength('-1 mm')).toThrow(ParseLengthError);
    try {
      parseLength('-1');
    } catch (e) {
      expect((e as ParseLengthError).code).toBe('negative');
    }
  });

  it('throws on non-finite numbers', () => {
    expect(() => parseLength(NaN)).toThrow(ParseLengthError);
    expect(() => parseLength(Infinity)).toThrow(ParseLengthError);
  });

  it('throws on unknown unit', () => {
    expect(() => parseLength('5 in')).toThrow(ParseLengthError);
    try {
      parseLength('5 in');
    } catch (e) {
      expect((e as ParseLengthError).code).toBe('unknownUnit');
    }
  });

  it('is case-insensitive on units', () => {
    expect(parseLength('5 CM').mm).toBe(50);
    expect(parseLength('1 M').mm).toBe(1000);
  });
});
