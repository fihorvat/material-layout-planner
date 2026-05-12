import { describe, it, expect } from 'vitest';
import {
  unionAabb,
  intersectAabb,
  aabbContainsPoint,
  aabbsIntersect,
  expandAabb,
} from '../boundingBox';

const a = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
const b = { minX: 5, minY: 5, maxX: 15, maxY: 15 };

describe('boundingBox', () => {
  it('union', () => {
    expect(unionAabb(a, b)).toEqual({ minX: 0, minY: 0, maxX: 15, maxY: 15 });
  });
  it('intersection', () => {
    expect(intersectAabb(a, b)).toEqual({ minX: 5, minY: 5, maxX: 10, maxY: 10 });
    expect(intersectAabb(a, { minX: 100, minY: 100, maxX: 200, maxY: 200 })).toBeNull();
  });
  it('contains point', () => {
    expect(aabbContainsPoint(a, { x: 5, y: 5 })).toBe(true);
    expect(aabbContainsPoint(a, { x: 50, y: 50 })).toBe(false);
  });
  it('aabbs intersect', () => {
    expect(aabbsIntersect(a, b)).toBe(true);
    expect(aabbsIntersect(a, { minX: 100, minY: 100, maxX: 200, maxY: 200 })).toBe(false);
  });
  it('expand', () => {
    expect(expandAabb(a, 2)).toEqual({ minX: -2, minY: -2, maxX: 12, maxY: 12 });
  });
});
