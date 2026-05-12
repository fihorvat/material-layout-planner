import { describe, expect, it } from 'vitest';
import { splitSurfaceByLine, splitSurfaceAtDimension, splitSurfaceByPolygon } from '../splitSurface';
import { createSurface } from '../createSurface';
import { surfaceArea } from '../surfaceGeometry';

const rect = (w = 1000, h = 1000) =>
  createSurface({
    name: 'R',
    outerBoundary: [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ],
  });

describe('splitSurface', () => {
  it('splits a rectangle by a vertical line into two halves with combined area equal to source', () => {
    const s = rect(1000, 500);
    const result = splitSurfaceByLine(s, { a: { x: 500, y: -100 }, b: { x: 500, y: 600 } });
    expect(result.issues).toHaveLength(0);
    expect(result.parts.length).toBeGreaterThanOrEqual(2);
    const total = result.parts.reduce((acc, p) => acc + surfaceArea(p), 0);
    expect(total).toBeCloseTo(surfaceArea(s), 0);
  });

  it('extracts inner rectangle', () => {
    const s = rect(1000, 1000);
    const inner = [
      { x: 250, y: 250 },
      { x: 750, y: 250 },
      { x: 750, y: 750 },
      { x: 250, y: 750 },
    ];
    const result = splitSurfaceByPolygon(s, inner, { mode: 'extractInner' });
    expect(result.parts.length).toBeGreaterThanOrEqual(2);
  });

  it('split at dimension', () => {
    const s = rect(1000, 500);
    const result = splitSurfaceAtDimension(s, 0, 300);
    expect(result.issues).toHaveLength(0);
    expect(result.parts.length).toBeGreaterThanOrEqual(2);
  });
});
