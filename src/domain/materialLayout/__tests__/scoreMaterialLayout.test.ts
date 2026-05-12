import { describe, expect, it } from 'vitest';
import { scoreMaterialLayout } from '../scoreMaterialLayout';
import { buildMaterialLayout } from '../buildMaterialLayout';
import { createSurface } from '@/domain/surfaces/createSurface';
import { createMaterial } from '@/domain/materials/material';
import { createPlacementPattern } from '@/domain/placementPatterns/placementPattern';
import { defaultOptimizationPriority } from '@/types';

const buildExact = () => {
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
  return { surface, material, pattern, layout };
};

describe('scoreMaterialLayout', () => {
  it('perfect tile yields zero waste, zero cuts', () => {
    const { surface, material, layout } = buildExact();
    const score = scoreMaterialLayout({
      layout,
      surface,
      material,
      priority: defaultOptimizationPriority(),
    });
    expect(score.parts.waste).toBeCloseTo(0);
    expect(score.parts.cutCount).toBe(0);
  });

  it('weights propagate into total', () => {
    const { surface, material, layout } = buildExact();
    const priority = { ...defaultOptimizationPriority(), wasteWeight: 0, cutCountWeight: 0, symmetryWeight: 0, smallPieceWeight: 0, jointAlignmentWeight: 0 };
    const score = scoreMaterialLayout({ layout, surface, material, priority });
    expect(score.total).toBeCloseTo(0);
  });
});
