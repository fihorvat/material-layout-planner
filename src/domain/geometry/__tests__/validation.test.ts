import { describe, it, expect } from 'vitest';
import { validatePolygon } from '../validation';

describe('validatePolygon', () => {
  it('flags too few points', () => {
    const r = validatePolygon([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === 'tooFewPoints')).toBe(true);
  });

  it('accepts a simple square', () => {
    const r = validatePolygon([
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
    ]);
    expect(r.valid).toBe(true);
  });

  it('flags self-intersection', () => {
    const r = validatePolygon([
      { x: 0, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 0 }, { x: 0, y: 10 },
    ]);
    expect(r.issues.some((i) => i.code === 'selfIntersecting')).toBe(true);
  });

  it('flags zero area', () => {
    const r = validatePolygon([
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 },
    ]);
    expect(r.issues.some((i) => i.code === 'zeroArea')).toBe(true);
  });
});
