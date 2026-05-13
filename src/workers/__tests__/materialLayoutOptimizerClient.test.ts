import { afterEach, describe, expect, it } from 'vitest';
import { runOptimizer, resetOptimizerWorkerForTests } from '../materialLayoutOptimizerClient';
import { createSurface } from '@/domain/surfaces/createSurface';
import { createMaterial } from '@/domain/materials/material';
import { createPlacementPattern } from '@/domain/placementPatterns/placementPattern';
import { defaultOptimizationPriority } from '@/types';

const setup = () => {
  const surface = createSurface({
    name: 'A',
    outerBoundary: [
      { x: 0, y: 0 },
      { x: 1200, y: 0 },
      { x: 1200, y: 600 },
      { x: 0, y: 600 },
    ],
  });
  const material = createMaterial({
    name: 'M',
    unitWidthMm: 600,
    unitHeightMm: 300,
    thicknessMm: 20,
  });
  const pattern = createPlacementPattern({ name: 'P' });
  return { surface, material, pattern };
};

describe('runOptimizer', () => {
  afterEach(() => {
    resetOptimizerWorkerForTests();
  });

  it('returns an empty array for empty input without spawning a worker', async () => {
    const r = await runOptimizer([]);
    expect(r).toEqual([]);
  });

  it('falls back to the synchronous optimizer when no Worker is available', async () => {
    const { surface, material, pattern } = setup();
    const r = await runOptimizer([
      {
        surface,
        surfaceIndex: 0,
        material,
        pattern,
        edgeRules: [],
        connections: [],
        visibleSurfacePolygon: { outer: surface.outerBoundary },
        physicalWorkingPolygon: { outer: surface.outerBoundary },
        priority: defaultOptimizationPriority(),
      },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]!.layout.pieces.length).toBeGreaterThan(0);
  });
});
