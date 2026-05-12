import { describe, expect, it } from 'vitest';
import { buildMaterialLayout } from '../buildMaterialLayout';
import { createSurface } from '@/domain/surfaces/createSurface';
import { createMaterial } from '@/domain/materials/material';
import { createPlacementPattern } from '@/domain/placementPatterns/placementPattern';

const baseSurface = createSurface({
  name: 'S',
  outerBoundary: [
    { x: 0, y: 0 },
    { x: 1200, y: 0 },
    { x: 1200, y: 900 },
    { x: 0, y: 900 },
  ],
});
const material = createMaterial({ name: 'M', unitWidthMm: 600, unitHeightMm: 300 });

describe('buildMaterialLayout', () => {
  it('produces 6 full unit pieces for 1200x900 with 600x300 zero joint', () => {
    const pattern = createPlacementPattern({
      name: 'P',
      jointMm: 0,
      originMode: 'topLeft',
    });
    const visible = { outer: baseSurface.outerBoundary };
    const layout = buildMaterialLayout({
      surface: baseSurface,
      surfaceIndex: 0,
      material,
      pattern,
      edgeRules: [],
      visibleSurfacePolygon: visible,
      physicalWorkingPolygon: visible,
    });
    expect(layout.pieces).toHaveLength(6);
    for (const piece of layout.pieces) {
      expect(piece.isFullUnit).toBe(true);
      expect(piece.overlapPolygons).toHaveLength(0);
    }
  });

  it('honors holes — pieces over the hole have overlap-style geometry', () => {
    const surface = {
      ...baseSurface,
      holes: [
        [
          { x: 500, y: 350 },
          { x: 700, y: 350 },
          { x: 700, y: 550 },
          { x: 500, y: 550 },
        ],
      ],
    };
    const pattern = createPlacementPattern({
      name: 'P',
      jointMm: 0,
      originMode: 'topLeft',
    });
    const visible = { outer: surface.outerBoundary, holes: surface.holes };
    const layout = buildMaterialLayout({
      surface,
      surfaceIndex: 0,
      material,
      pattern,
      edgeRules: [],
      visibleSurfacePolygon: visible,
      physicalWorkingPolygon: visible,
    });
    // Holes turn affected pieces into irregular shapes (with a notch).
    const irregular = layout.pieces.filter((p) => p.isIrregular);
    expect(irregular.length).toBeGreaterThan(0);
  });
});
