import { describe, it, expect } from 'vitest';
import { computeOrthoMeasureGuides } from '@/features/drawingTools/OrthoMeasureGuides';
import type { ShapeEdge } from '@/features/drawingTools/drawingMode';

// Convenience: build the four edges of an axis-aligned rectangle so the
// existing bbox-style scenarios still exercise the ray-cast code path.
const rectEdges = (
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): ShapeEdge[] => [
  { a: { x: minX, y: minY }, b: { x: maxX, y: minY } },
  { a: { x: maxX, y: minY }, b: { x: maxX, y: maxY } },
  { a: { x: maxX, y: maxY }, b: { x: minX, y: maxY } },
  { a: { x: minX, y: maxY }, b: { x: minX, y: minY } },
];

describe('computeOrthoMeasureGuides', () => {
  it('returns no guides when there are no edges', () => {
    expect(computeOrthoMeasureGuides({ x: 0, y: 0 }, [])).toEqual([]);
  });

  it('emits an east guide when a shape lies to the right and the cursor row crosses it', () => {
    const cursor = { x: 0, y: 50 };
    const edges = rectEdges(100, 0, 200, 100);
    const guides = computeOrthoMeasureGuides(cursor, edges);
    const east = guides.find((g) => g.to.x > cursor.x && g.orientation === 'horizontal');
    expect(east).toBeDefined();
    expect(east!.to).toEqual({ x: 100, y: 50 });
    expect(east!.distanceMm).toBeCloseTo(100, 6);
  });

  it('emits west / north / south guides correctly', () => {
    const cursor = { x: 500, y: 500 };
    const edges = [
      ...rectEdges(100, 400, 300, 600), // west
      ...rectEdges(400, 100, 600, 300), // north (smaller y)
      ...rectEdges(400, 700, 600, 900), // south (larger y)
    ];
    const guides = computeOrthoMeasureGuides(cursor, edges);
    const byKey = (k: 'h-left' | 'h-right' | 'v-up' | 'v-down') =>
      guides.find((g) => {
        if (k === 'h-left') return g.orientation === 'horizontal' && g.to.x < cursor.x;
        if (k === 'h-right') return g.orientation === 'horizontal' && g.to.x > cursor.x;
        if (k === 'v-up') return g.orientation === 'vertical' && g.to.y < cursor.y;
        return g.orientation === 'vertical' && g.to.y > cursor.y;
      });
    expect(byKey('h-left')!.to).toEqual({ x: 300, y: 500 });
    expect(byKey('h-left')!.distanceMm).toBeCloseTo(200, 6);
    expect(byKey('v-up')!.to).toEqual({ x: 500, y: 300 });
    expect(byKey('v-up')!.distanceMm).toBeCloseTo(200, 6);
    expect(byKey('v-down')!.to).toEqual({ x: 500, y: 700 });
    expect(byKey('v-down')!.distanceMm).toBeCloseTo(200, 6);
    expect(byKey('h-right')).toBeUndefined();
  });

  it('ignores shapes whose edges do not cross the cursor row/column', () => {
    const cursor = { x: 0, y: 0 };
    const edges = rectEdges(100, 200, 200, 300); // y range 200..300 does not cross y=0
    const guides = computeOrthoMeasureGuides(cursor, edges);
    expect(guides).toEqual([]);
  });

  it('picks the nearest edge in each direction when multiple compete', () => {
    const cursor = { x: 0, y: 50 };
    const edges = [...rectEdges(500, 0, 600, 100), ...rectEdges(200, 0, 300, 100)];
    const guides = computeOrthoMeasureGuides(cursor, edges);
    const east = guides.find((g) => g.orientation === 'horizontal' && g.to.x > cursor.x);
    expect(east!.to.x).toBe(200);
    expect(east!.distanceMm).toBeCloseTo(200, 6);
  });

  // The defining regression case for this change: a rotated rectangle's
  // bounding box extends further than its outline along every axis, so the
  // old bbox-based implementation would over-report the distance. The new
  // edge-based implementation must hit the actual diamond outline instead.
  it('projects onto the actual shape outline, not its axis-aligned bbox', () => {
    // 100x100 square rotated 45 degrees around (200, 0): its corners are
    // (200, -50sqrt(2)), (200+50sqrt(2), 0), (200, 50sqrt(2)), (200-50sqrt(2), 0).
    const s = 50 * Math.SQRT2;
    const diamond: ShapeEdge[] = [
      { a: { x: 200, y: -s }, b: { x: 200 + s, y: 0 } },
      { a: { x: 200 + s, y: 0 }, b: { x: 200, y: s } },
      { a: { x: 200, y: s }, b: { x: 200 - s, y: 0 } },
      { a: { x: 200 - s, y: 0 }, b: { x: 200, y: -s } },
    ];
    // Cursor at (0, 25): horizontal ray east hits the upper-left diamond
    // edge at x = 200 - (s - 25), well inside the bbox's left side
    // (which would have been at x = 200 - s).
    const cursor = { x: 0, y: 25 };
    const guides = computeOrthoMeasureGuides(cursor, diamond);
    const east = guides.find((g) => g.orientation === 'horizontal' && g.to.x > cursor.x);
    expect(east).toBeDefined();
    expect(east!.to.x).toBeCloseTo(200 - (s - 25), 6);
    expect(east!.to.x).toBeGreaterThan(200 - s + 1); // strictly inside the bbox
  });

  it('also measures against line entities (no bbox would exist for these)', () => {
    const cursor = { x: 0, y: 50 };
    const edges: ShapeEdge[] = [{ a: { x: 100, y: 0 }, b: { x: 100, y: 200 } }];
    const guides = computeOrthoMeasureGuides(cursor, edges);
    const east = guides.find((g) => g.orientation === 'horizontal' && g.to.x > cursor.x);
    expect(east).toBeDefined();
    expect(east!.to).toEqual({ x: 100, y: 50 });
    expect(east!.distanceMm).toBeCloseTo(100, 6);
  });
});
