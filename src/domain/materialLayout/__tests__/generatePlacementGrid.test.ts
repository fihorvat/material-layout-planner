import { describe, expect, it } from 'vitest';
import { generatePlacementGrid } from '../generatePlacementGrid';
import { createSurface } from '@/domain/surfaces/createSurface';
import { createMaterial } from '@/domain/materials/material';
import { createPlacementPattern } from '@/domain/placementPatterns/placementPattern';
import { pointsToAabb } from '@/domain/geometry';

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

const aabb = pointsToAabb(surface.outerBoundary);

describe('generatePlacementGrid', () => {
  it('stacked with zero joint covers AABB plus 1-unit margin', () => {
    const pattern = createPlacementPattern({
      name: 'P',
      jointMm: 0,
      originMode: 'topLeft',
      offsetXmm: 0,
      offsetYmm: 0,
    });
    const grid = generatePlacementGrid({ surface, material, pattern, workingAabb: aabb });
    // 2 cols cover 1200, 3 rows cover 900; with 1-unit margin extra each side, expect at least 6 inside.
    const inside = grid.filter((u) => {
      const c = u.centerWorld;
      return c.x >= 0 && c.x <= 1200 && c.y >= 0 && c.y <= 900;
    });
    expect(inside.length).toBe(6);
  });

  it('stacked with 3mm joint uses step 603 / 303', () => {
    const pattern = createPlacementPattern({
      name: 'P',
      jointMm: 3,
      originMode: 'topLeft',
    });
    const grid = generatePlacementGrid({ surface, material, pattern, workingAabb: aabb });
    expect(grid.length).toBeGreaterThan(0);
    // Distance between adjacent column centers in the same row should be 603.
    const row0 = grid.filter((u) => u.index.row === 0).sort((a, b) => a.index.col - b.index.col);
    if (row0.length >= 2) {
      const a = row0[0]!.centerWorld;
      const b = row0[1]!.centerWorld;
      expect(b.x - a.x).toBeCloseTo(603, 3);
    }
  });

  it('runningBondHalf shifts odd rows by stepX/2', () => {
    const pattern = createPlacementPattern({
      name: 'P',
      type: 'runningBondHalf',
      jointMm: 0,
      originMode: 'topLeft',
    });
    const grid = generatePlacementGrid({ surface, material, pattern, workingAabb: aabb });
    const row0 = grid.find((u) => u.index.row === 0 && u.index.col === 0);
    const row1 = grid.find((u) => u.index.row === 1 && u.index.col === 0);
    expect(row0).toBeTruthy();
    expect(row1).toBeTruthy();
    if (row0 && row1) {
      expect(row1.centerWorld.x - row0.centerWorld.x).toBeCloseTo(300, 3);
    }
  });
});
