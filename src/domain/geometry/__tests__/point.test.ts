import { describe, it, expect } from 'vitest';
import * as P from '../point';

describe('point', () => {
  it('add/sub/scale', () => {
    expect(P.add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
    expect(P.sub({ x: 5, y: 5 }, { x: 1, y: 2 })).toEqual({ x: 4, y: 3 });
    expect(P.scale({ x: 2, y: 3 }, 5)).toEqual({ x: 10, y: 15 });
  });

  it('dot and cross', () => {
    expect(P.dot({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe(11);
    expect(P.cross({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(1);
  });

  it('length and distance', () => {
    expect(P.length({ x: 3, y: 4 })).toBe(5);
    expect(P.distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('lerp', () => {
    expect(P.lerp({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5)).toEqual({ x: 5, y: 10 });
  });

  it('rotate', () => {
    const r = P.rotate({ x: 1, y: 0 }, 90);
    expect(r.x).toBeCloseTo(0, 9);
    expect(r.y).toBeCloseTo(1, 9);
  });

  it('equals with eps', () => {
    expect(P.equals({ x: 1, y: 2 }, { x: 1.0000001, y: 2.0000001 })).toBe(true);
    expect(P.equals({ x: 1, y: 2 }, { x: 2, y: 2 })).toBe(false);
  });

  it('normalize zero -> zero', () => {
    expect(P.normalize({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    const n = P.normalize({ x: 3, y: 4 });
    expect(P.length(n)).toBeCloseTo(1, 9);
  });
});
