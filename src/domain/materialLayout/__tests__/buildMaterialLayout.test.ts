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

  it('honors holes - pieces over the hole have overlap-style geometry', () => {
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
    const irregular = layout.pieces.filter((p) => p.isIrregular);
    expect(irregular.length).toBeGreaterThan(0);
  });

  it('keeps all disconnected fragments when an opening splits a single material unit', () => {
    const surface = createSurface({
      name: 'Split',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 1800, y: 0 },
        { x: 1800, y: 300 },
        { x: 0, y: 300 },
      ],
      holes: [
        [
          { x: 600, y: 100 },
          { x: 1200, y: 100 },
          { x: 1200, y: 200 },
          { x: 600, y: 200 },
        ],
      ],
    });
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

    expect(layout.pieces).toHaveLength(4);
    expect(layout.pieces.filter((piece) => piece.isCutPiece)).toHaveLength(2);
    expect(new Set(layout.pieces.map((piece) => piece.sourceUnitIndex)).size).toBe(3);
  });

  it('preserves configured overlap opacity on clipped overlap polygons', () => {
    const surface = createSurface({
      name: 'Overlap',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    });
    const overlapMaterial = createMaterial({
      name: 'Overlap material',
      unitWidthMm: 110,
      unitHeightMm: 100,
    });
    const pattern = createPlacementPattern({
      name: 'P',
      jointMm: 0,
      originMode: 'topLeft',
    });
    const layout = buildMaterialLayout({
      surface,
      surfaceIndex: 0,
      material: overlapMaterial,
      pattern,
      edgeRules: [],
      visibleSurfacePolygon: { outer: surface.outerBoundary },
      physicalWorkingPolygon: {
        outer: [
          { x: 0, y: 0 },
          { x: 110, y: 0 },
          { x: 110, y: 100 },
          { x: 0, y: 100 },
        ],
      },
      overlapZones: [
        {
          polygon: {
            outer: [
              { x: 100, y: 0 },
              { x: 110, y: 0 },
              { x: 110, y: 100 },
              { x: 100, y: 100 },
            ],
          },
          opacity01: 0.55,
        },
      ],
    });

    expect(layout.pieces).toHaveLength(1);
    expect(layout.pieces[0]?.overlapPolygons).toHaveLength(1);
    expect(layout.pieces[0]?.overlapPolygonOpacities).toEqual([0.55]);
  });
});
