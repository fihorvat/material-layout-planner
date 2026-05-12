import { describe, it, expect } from 'vitest';
import {
  lineLength,
  lineAngleDeg,
  lineDirection,
  segmentMidpoint,
  closestPointOnSegment,
  pointToLineDistance,
} from '../line';

const seg = { a: { x: 0, y: 0 }, b: { x: 10, y: 0 } };

describe('line', () => {
  it('length and angle', () => {
    expect(lineLength(seg)).toBe(10);
    expect(lineAngleDeg(seg)).toBe(0);
    expect(lineAngleDeg({ a: { x: 0, y: 0 }, b: { x: 0, y: 5 } })).toBe(90);
  });

  it('direction is unit', () => {
    const d = lineDirection(seg);
    expect(d).toEqual({ x: 1, y: 0 });
  });

  it('midpoint', () => {
    expect(segmentMidpoint(seg)).toEqual({ x: 5, y: 0 });
  });

  it('closestPointOnSegment clamps to endpoints', () => {
    expect(closestPointOnSegment({ x: -5, y: 5 }, seg)).toEqual({ x: 0, y: 0 });
    expect(closestPointOnSegment({ x: 15, y: 5 }, seg)).toEqual({ x: 10, y: 0 });
    expect(closestPointOnSegment({ x: 5, y: 5 }, seg)).toEqual({ x: 5, y: 0 });
  });

  it('pointToLineDistance', () => {
    expect(pointToLineDistance({ x: 5, y: 3 }, seg)).toBe(3);
  });
});
