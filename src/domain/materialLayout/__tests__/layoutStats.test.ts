import { describe, expect, it } from 'vitest';
import { computeLayoutStats } from '../layoutStats';
import { buildMaterialLayout } from '../buildMaterialLayout';
import { createSurface } from '@/domain/surfaces/createSurface';
import { createMaterial } from '@/domain/materials/material';
import { createPlacementPattern } from '@/domain/placementPatterns/placementPattern';

describe('computeLayoutStats', () => {
  it('full coverage produces zero waste', () => {
    const surface = createSurface({
      name: 'S',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 1200, y: 0 },
        { x: 1200, y: 900 },
        { x: 0, y: 900 },
      ],
    });
    const material = createMaterial({ name: 'M', unitWidthMm: 600, unitHeightMm: 300 });
    const pattern = createPlacementPattern({ name: 'P', jointMm: 0, originMode: 'topLeft' });
    const layout = buildMaterialLayout({
      surface,
      surfaceIndex: 0,
      material,
      pattern,
      edgeRules: [],
      visibleSurfacePolygon: { outer: surface.outerBoundary },
      physicalWorkingPolygon: { outer: surface.outerBoundary },
    });
    const stats = computeLayoutStats(layout, material);
    expect(stats.fullUnitCount).toBe(6);
    expect(stats.cutPieceCount).toBe(0);
    expect(stats.wasteAreaMm2).toBeCloseTo(0, 0);
  });
});
