import { describe, it, expect } from 'vitest';
import {
  polygonArea,
  polygonPerimeter,
  polygonCentroid,
  pointInPolygon,
  polygonOrientation,
  ensureCCW,
  ensureCW,
  isClosed,
  closePolygon,
} from '../polygon';

const square = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

describe('polygon', () => {
  it('100x100 square area is 10000 (CCW positive)', () => {
    expect(polygonArea(square)).toBe(10000);
    expect(polygonArea(square.slice().reverse())).toBe(-10000);
  });

  it('perimeter is 400', () => {
    expect(polygonPerimeter(square)).toBe(400);
  });

  it('centroid is the geometric center', () => {
    const c = polygonCentroid(square);
    expect(c.x).toBeCloseTo(50, 9);
    expect(c.y).toBeCloseTo(50, 9);
  });

  it('orientation detection', () => {
    expect(polygonOrientation(square)).toBe('ccw');
    expect(polygonOrientation(square.slice().reverse())).toBe('cw');
  });

  it('ensureCCW / ensureCW', () => {
    expect(polygonOrientation(ensureCCW(square.slice().reverse()))).toBe('ccw');
    expect(polygonOrientation(ensureCW(square))).toBe('cw');
  });

  it('pointInPolygon on L-shape with concave corner', () => {
    const L = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 50, y: 50 },
      { x: 50, y: 100 },
      { x: 0, y: 100 },
    ];
    expect(pointInPolygon({ x: 25, y: 25 }, L)).toBe(true);
    expect(pointInPolygon({ x: 75, y: 75 }, L)).toBe(false);
    expect(pointInPolygon({ x: 75, y: 25 }, L)).toBe(true);
  });

  it('isClosed and closePolygon', () => {
    const closed = [...square, { x: 0, y: 0 }];
    expect(isClosed(closed)).toBe(true);
    expect(isClosed(square)).toBe(false);
    expect(closePolygon(closed)).toEqual(square);
  });
});
