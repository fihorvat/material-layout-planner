import { describe, expect, it } from 'vitest';
import { surfaceArea, surfaceCentroid, surfaceEdges } from '../surfaceGeometry';
import { createSurface, rectangleToSurface } from '../createSurface';
import { validateSurface } from '../validateSurface';
import { defaultDrawingStyle } from '@/types';
import type { RectangleEntity } from '@/types';

describe('surfaceGeometry', () => {
  it('surfaceArea of L-shape via hole', () => {
    const s = createSurface({
      name: 'L',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 1000, y: 0 },
        { x: 1000, y: 1000 },
        { x: 0, y: 1000 },
      ],
      holes: [
        [
          { x: 600, y: 600 },
          { x: 900, y: 600 },
          { x: 900, y: 900 },
          { x: 600, y: 900 },
        ],
      ],
    });
    const area = surfaceArea(s);
    expect(area).toBeCloseTo(1_000_000 - 90_000);
  });

  it('rectangle conversion gives correct area', () => {
    const rect: RectangleEntity = {
      id: 'R1',
      type: 'rectangle',
      origin: { x: 0, y: 0 },
      widthMm: 200,
      heightMm: 100,
      rotationDeg: 0,
      showDimensions: false,
      style: defaultDrawingStyle(),
    };
    const s = rectangleToSurface(rect, 'wall');
    expect(surfaceArea(s)).toBeCloseTo(20_000);
    expect(s.outerBoundary).toHaveLength(4);
  });

  it('surfaceEdges returns 4 edges for rectangle', () => {
    const s = createSurface({
      name: 'r',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
    });
    const edges = surfaceEdges(s);
    expect(edges).toHaveLength(4);
    expect(edges[0]?.lengthMm).toBeCloseTo(10);
  });

  it('surfaceCentroid of unit square is its center', () => {
    const s = createSurface({
      name: 'sq',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
    });
    const c = surfaceCentroid(s);
    expect(c.x).toBeCloseTo(5);
    expect(c.y).toBeCloseTo(5);
  });
});

describe('validateSurface', () => {
  it('reports hole outside outer', () => {
    const s = createSurface({
      name: 's',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      holes: [
        [
          { x: 200, y: 200 },
          { x: 300, y: 200 },
          { x: 300, y: 300 },
          { x: 200, y: 300 },
        ],
      ],
    });
    const v = validateSurface(s);
    expect(v.valid).toBe(false);
    expect(v.issues.some((i) => i.code === 'holeOutsideOuter')).toBe(true);
  });

  it('valid simple rectangle passes', () => {
    const s = createSurface({
      name: 's',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    });
    expect(validateSurface(s).valid).toBe(true);
  });
});
