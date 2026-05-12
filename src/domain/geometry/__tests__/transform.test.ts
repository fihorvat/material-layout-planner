import { describe, it, expect } from 'vitest';
import { identity, translate, scaleMat, rotateMat, multiply, applyTo } from '../transform';

describe('transform', () => {
  it('identity is a no-op', () => {
    expect(applyTo(identity(), { x: 3, y: 4 })).toEqual({ x: 3, y: 4 });
  });

  it('translate', () => {
    expect(applyTo(translate(10, 20), { x: 1, y: 2 })).toEqual({ x: 11, y: 22 });
  });

  it('scale', () => {
    expect(applyTo(scaleMat(2, 3), { x: 4, y: 5 })).toEqual({ x: 8, y: 15 });
  });

  it('rotate 90 deg', () => {
    const r = applyTo(rotateMat(90), { x: 1, y: 0 });
    expect(r.x).toBeCloseTo(0, 9);
    expect(r.y).toBeCloseTo(1, 9);
  });

  it('multiply composes correctly', () => {
    const t = translate(5, 0);
    const r = rotateMat(90);
    const composed = multiply(t, r);
    const p = applyTo(composed, { x: 1, y: 0 });
    expect(p.x).toBeCloseTo(5, 9);
    expect(p.y).toBeCloseTo(1, 9);
  });
});
