import { describe, expect, it } from 'vitest';
import { buildCutList } from '../materialCutList';
import { createEmptyProject } from '@/types';
import { createSurface } from '@/domain/surfaces/createSurface';
import { createMaterial } from '@/domain/materials/material';
import type { MaterialLayout } from '@/types';

const makeProject = () => {
  const project = createEmptyProject('T');
  const surface = createSurface({
    name: 'S',
    outerBoundary: [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 500 },
      { x: 0, y: 500 },
    ],
  });
  const material = createMaterial({
    name: 'M',
    unitWidthMm: 500,
    unitHeightMm: 250,
    thicknessMm: 20,
    id: 'mat_1',
  });
  project.surfaces.push(surface);
  project.materials.push(material);
  return { project, surface, material };
};

const piece = (over: Partial<MaterialLayout['pieces'][number]>): MaterialLayout['pieces'][number] => ({
  id: 'p',
  surfaceId: 'S',
  materialId: 'M',
  pieceCode: 'A-01',
  physicalPolygon: [],
  visiblePolygon: [],
  overlapPolygons: [],
  boundingWidthMm: 500,
  boundingHeightMm: 250,
  thicknessMm: 20,
  rotationDeg: 0,
  isFullUnit: true,
  isCutPiece: false,
  isIrregular: false,
  labelPosition: { x: 0, y: 0 },
  warnings: [],
  ...over,
});

describe('buildCutList', () => {
  it('groups identical full units', () => {
    const { project, surface, material } = makeProject();
    project.materialLayouts.push({
      id: 'l1',
      surfaceId: surface.id,
      materialId: material.id,
      placementPatternId: 'p',
      generatedAt: 'now',
      pieces: [piece({ pieceCode: 'A-01', surfaceId: surface.id, materialId: material.id }), piece({ pieceCode: 'A-02', surfaceId: surface.id, materialId: material.id })],
      stats: {
        visibleAreaMm2: 0, physicalMaterialAreaMm2: 0, purchasedMaterialAreaMm2: 0,
        fullUnitCount: 0, cutPieceCount: 0, totalPieceCount: 0,
        wasteAreaMm2: 0, wastePercent: 0, uniqueCutCount: 0, smallPieceCount: 0,
      },
      settingsSnapshot: { material, placementPattern: {
        id: 'p', name: 'P', type: 'stacked', orientation: 'horizontal', angleDeg: 0,
        jointMm: 0, offsetXmm: 0, offsetYmm: 0, rowOffsetMm: 0, rowOffsetPercent: 0,
        originMode: 'topLeft', direction: 'leftToRight', symmetryMode: 'none',
        optimizationPriority: { wasteWeight: 1, symmetryWeight: 1, cutCountWeight: 1, smallPieceWeight: 1, jointAlignmentWeight: 0, manualOffsetLocked: false },
      }, edgeRules: [] },
    });
    const list = buildCutList(project);
    expect(list).toHaveLength(1);
    expect(list[0]?.quantity).toBe(2);
  });

  it('irregular pieces never group', () => {
    const { project, surface, material } = makeProject();
    const irreg = (code: string) => piece({ pieceCode: code, surfaceId: surface.id, materialId: material.id, isIrregular: true, isFullUnit: false, isCutPiece: true });
    project.materialLayouts.push({
      id: 'l1',
      surfaceId: surface.id,
      materialId: material.id,
      placementPatternId: 'p',
      generatedAt: 'now',
      pieces: [irreg('A-01'), irreg('A-02')],
      stats: { visibleAreaMm2: 0, physicalMaterialAreaMm2: 0, purchasedMaterialAreaMm2: 0, fullUnitCount: 0, cutPieceCount: 0, totalPieceCount: 0, wasteAreaMm2: 0, wastePercent: 0, uniqueCutCount: 0, smallPieceCount: 0 },
      settingsSnapshot: { material, placementPattern: { id: 'p', name: 'P', type: 'stacked', orientation: 'horizontal', angleDeg: 0, jointMm: 0, offsetXmm: 0, offsetYmm: 0, rowOffsetMm: 0, rowOffsetPercent: 0, originMode: 'topLeft', direction: 'leftToRight', symmetryMode: 'none', optimizationPriority: { wasteWeight: 1, symmetryWeight: 1, cutCountWeight: 1, smallPieceWeight: 1, jointAlignmentWeight: 0, manualOffsetLocked: false } }, edgeRules: [] },
    });
    expect(buildCutList(project)).toHaveLength(2);
  });
});
