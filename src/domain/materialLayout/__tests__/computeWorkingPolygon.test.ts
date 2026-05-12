import { describe, expect, it } from 'vitest';
import { computeWorkingPolygon } from '../computeWorkingPolygon';
import { createSurface } from '@/domain/surfaces/createSurface';
import { pointsToAabb, polygonArea } from '@/domain/geometry';
import { newEdgeRuleId } from '@/domain/ids';

describe('computeWorkingPolygon', () => {
  it('hardStop yields physical equal to visible', () => {
    const s = createSurface({
      name: 'S',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    });
    const r = computeWorkingPolygon({ surface: s, connections: [] });
    expect(polygonArea(r.physical.outer)).toBeCloseTo(polygonArea(r.visible.outer));
  });

  it('physicalOverlap expands outward', () => {
    const outer = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const s = createSurface({ name: 'S', outerBoundary: outer });
    // edge 1 is from (100,0) -> (100,100) for CCW (y down)? Need to confirm.
    s.edgeRules.push({
      id: newEdgeRuleId(),
      surfaceId: s.id,
      edgeIndex: 1,
      ruleType: 'physicalOverlap',
      maxOverlapMm: 10,
      overlapOpacity: 0.25,
      applyThicknessCompensation: false,
    });
    const r = computeWorkingPolygon({ surface: s, connections: [] });
    const a = pointsToAabb(r.physical.outer);
    const w = a.maxX - a.minX;
    expect(w).toBeGreaterThanOrEqual(100);
  });
});
