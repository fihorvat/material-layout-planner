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

  describe('constrainAngle', () => {
    it('snaps a point ~30° above the x-axis onto the +x axis (90° step)', () => {
      const from = { x: 0, y: 0 };
      const to = { x: Math.cos(Math.PI / 6) * 10, y: Math.sin(Math.PI / 6) * 10 };
      const r = P.constrainAngle(from, to);
      expect(r.x).toBeCloseTo(10, 6);
      expect(r.y).toBeCloseTo(0, 6);
    });

    it('preserves the input distance after snapping', () => {
      const from = { x: 5, y: 7 };
      const to = { x: 5 + 4, y: 7 + 3 };
      const r = P.constrainAngle(from, to);
      const d = Math.hypot(r.x - from.x, r.y - from.y);
      expect(d).toBeCloseTo(5, 6);
    });

    it('snaps near-vertical input onto the +y axis', () => {
      const from = { x: 1, y: 1 };
      const to = { x: 1.2, y: 6 };
      const r = P.constrainAngle(from, to);
      expect(r.x).toBeCloseTo(1, 6);
      expect(r.y).toBeGreaterThan(1);
    });

    it('returns `to` unchanged when `from` and `to` coincide', () => {
      const p = { x: 2, y: 3 };
      expect(P.constrainAngle(p, p)).toEqual(p);
    });
  });
});
