import { describe, it, expect } from 'vitest';
import { rectangleToPoints, pointsToAabb } from '../rectangle';

describe('rectangle', () => {
  it('axis-aligned rectangle to four points', () => {
    const pts = rectangleToPoints({ x: 0, y: 0 }, 100, 50, 0);
    expect(pts).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ]);
  });

  it('rotated rectangle has correct corners', () => {
    const pts = rectangleToPoints({ x: 0, y: 0 }, 100, 0.0001, 90);
    expect(pts[1]!.x).toBeCloseTo(0, 6);
    expect(pts[1]!.y).toBeCloseTo(100, 6);
  });

  it('pointsToAabb', () => {
    const aabb = pointsToAabb([
      { x: 1, y: 2 },
      { x: -3, y: 5 },
      { x: 4, y: -1 },
    ]);
    expect(aabb).toEqual({ minX: -3, minY: -1, maxX: 4, maxY: 5 });
  });
});
