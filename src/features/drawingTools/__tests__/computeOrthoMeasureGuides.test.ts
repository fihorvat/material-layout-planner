import { describe, it, expect } from 'vitest';
import { computeOrthoMeasureGuides } from '@/features/drawingTools/OrthoMeasureGuides';
import type { IdentifiedBbox } from '@/features/drawingTools/drawingMode';

const bbox = (
  id: string,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): IdentifiedBbox => ({ id, bbox: { minX, minY, maxX, maxY } });

describe('computeOrthoMeasureGuides', () => {
  it('returns no guides when there are no bboxes', () => {
    expect(computeOrthoMeasureGuides({ x: 0, y: 0 }, [])).toEqual([]);
  });

  it('emits an east guide when a bbox lies to the right and the cursor row crosses it', () => {
    const cursor = { x: 0, y: 50 };
    const bboxes = [bbox('a', 100, 0, 200, 100)];
    const guides = computeOrthoMeasureGuides(cursor, bboxes);
    const east = guides.find((g) => g.to.x > cursor.x && g.orientation === 'horizontal');
    expect(east).toBeDefined();
    expect(east!.to).toEqual({ x: 100, y: 50 });
    expect(east!.distanceMm).toBeCloseTo(100, 6);
  });

  it('emits west / north / south guides correctly', () => {
    const cursor = { x: 500, y: 500 };
    const bboxes = [
      bbox('w', 100, 400, 300, 600), // west
      bbox('n', 400, 100, 600, 300), // north (smaller y)
      bbox('s', 400, 700, 600, 900), // south (larger y)
    ];
    const guides = computeOrthoMeasureGuides(cursor, bboxes);
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

  it('ignores bboxes whose extent does not cross the cursor row/column', () => {
    const cursor = { x: 0, y: 0 };
    const bboxes = [bbox('off-row', 100, 200, 200, 300)]; // y range 200..300 does not cross y=0
    const guides = computeOrthoMeasureGuides(cursor, bboxes);
    expect(guides).toEqual([]);
  });

  it('picks the nearest bbox edge in each direction when multiple compete', () => {
    const cursor = { x: 0, y: 50 };
    const bboxes = [
      bbox('far', 500, 0, 600, 100),
      bbox('near', 200, 0, 300, 100),
    ];
    const guides = computeOrthoMeasureGuides(cursor, bboxes);
    const east = guides.find((g) => g.orientation === 'horizontal' && g.to.x > cursor.x);
    expect(east!.to.x).toBe(200);
    expect(east!.distanceMm).toBeCloseTo(200, 6);
  });
});
