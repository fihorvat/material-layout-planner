import { describe, it, expect } from 'vitest';
import { offsetPolygon } from '../offsetPolygon';
import { pointsToAabb } from '../rectangle';

const square = [
  { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 },
];

describe('offsetPolygon', () => {
  it('inflates a 100x100 square by 10 to a 120x120 centered square', () => {
    const out = offsetPolygon(square, 10);
    const aabb = pointsToAabb(out);
    expect(aabb.minX).toBeCloseTo(-10, 6);
    expect(aabb.minY).toBeCloseTo(-10, 6);
    expect(aabb.maxX).toBeCloseTo(110, 6);
    expect(aabb.maxY).toBeCloseTo(110, 6);
  });

  it('deflates a 100x100 square by 10 to an 80x80 centered square', () => {
    const out = offsetPolygon(square, -10);
    const aabb = pointsToAabb(out);
    expect(aabb.minX).toBeCloseTo(10, 6);
    expect(aabb.minY).toBeCloseTo(10, 6);
    expect(aabb.maxX).toBeCloseTo(90, 6);
    expect(aabb.maxY).toBeCloseTo(90, 6);
  });

  it('zero distance returns the same polygon', () => {
    const out = offsetPolygon(square, 0);
    expect(out).toEqual(square);
  });
});
