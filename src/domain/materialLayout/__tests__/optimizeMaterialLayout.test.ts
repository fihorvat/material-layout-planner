import { describe, expect, it } from 'vitest';
import { optimizeMaterialLayout } from '../optimizeMaterialLayout';
import { createSurface } from '@/domain/surfaces/createSurface';
import { createMaterial } from '@/domain/materials/material';
import { createPlacementPattern } from '@/domain/placementPatterns/placementPattern';
import { defaultOptimizationPriority } from '@/types';

const setup = () => {
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
  return { surface, material, pattern };
};

describe('optimizeMaterialLayout', () => {
  it('manualOffsetLocked returns the user pattern variation', () => {
    const { surface, material, pattern } = setup();
    const r = optimizeMaterialLayout({
      surface,
      surfaceIndex: 0,
      material,
      pattern,
      edgeRules: [],
      connections: [],
      visibleSurfacePolygon: { outer: surface.outerBoundary },
      physicalWorkingPolygon: { outer: surface.outerBoundary },
      priority: { ...defaultOptimizationPriority(), manualOffsetLocked: true },
    });
    expect(r.variation).toBe('manualLock');
  });

  it('returns a layout with pieces', () => {
    const { surface, material, pattern } = setup();
    const r = optimizeMaterialLayout({
      surface,
      surfaceIndex: 0,
      material,
      pattern,
      edgeRules: [],
      connections: [],
      visibleSurfacePolygon: { outer: surface.outerBoundary },
      physicalWorkingPolygon: { outer: surface.outerBoundary },
      priority: defaultOptimizationPriority(),
    });
    expect(r.layout.pieces.length).toBeGreaterThan(0);
  });
});
