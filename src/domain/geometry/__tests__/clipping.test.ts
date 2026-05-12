import { describe, it, expect } from 'vitest';
import { clipPolygonToConvex } from '../clipping';
import { polygonArea } from '../polygon';

const square = [
  { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 },
];

describe('clipPolygonToConvex', () => {
  it('rectangle clipped to itself returns same area', () => {
    const out = clipPolygonToConvex(square, square);
    expect(Math.abs(polygonArea(out))).toBeCloseTo(10000, 6);
  });

  it('clips to inner rectangle', () => {
    const inner = [
      { x: 25, y: 25 }, { x: 75, y: 25 }, { x: 75, y: 75 }, { x: 25, y: 75 },
    ];
    const out = clipPolygonToConvex(square, inner);
    expect(Math.abs(polygonArea(out))).toBeCloseTo(2500, 6);
  });

  it('returns empty when disjoint', () => {
    const far = [
      { x: 1000, y: 1000 }, { x: 2000, y: 1000 }, { x: 2000, y: 2000 }, { x: 1000, y: 2000 },
    ];
    const out = clipPolygonToConvex(square, far);
    expect(out).toEqual([]);
  });
});
