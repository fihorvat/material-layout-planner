import { describe, it, expect } from 'vitest';
import { polygonDifference, polygonIntersection, polygonUnion } from '../polygonBoolean';
import { polygonArea } from '../polygon';

const big = {
  outer: [
    { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 },
  ],
};
const small = {
  outer: [
    { x: 25, y: 25 }, { x: 75, y: 25 }, { x: 75, y: 75 }, { x: 25, y: 75 },
  ],
};

describe('polygonBoolean', () => {
  it('intersection: big & small = small (area 2500)', () => {
    const result = polygonIntersection(big, small);
    expect(result).toHaveLength(1);
    expect(Math.abs(polygonArea(result[0]!.outer))).toBeCloseTo(2500, 6);
  });

  it('union: big | small = big', () => {
    const result = polygonUnion(big, small);
    expect(result).toHaveLength(1);
    expect(Math.abs(polygonArea(result[0]!.outer))).toBeCloseTo(10000, 6);
  });

  it('difference: big - small leaves a polygon with a hole', () => {
    const result = polygonDifference(big, small);
    expect(result).toHaveLength(1);
    const outerArea = Math.abs(polygonArea(result[0]!.outer));
    const holes = result[0]!.holes ?? [];
    expect(outerArea).toBeCloseTo(10000, 6);
    expect(holes).toHaveLength(1);
    expect(Math.abs(polygonArea(holes[0]!))).toBeCloseTo(2500, 6);
  });
});
