import { describe, expect, it } from 'vitest';
import { buildCuttingDiagram } from '../cuttingDiagram';
import { createMaterial } from '@/domain/materials/material';
import type { MaterialLayout, MaterialPiece } from '@/types';

const makePiece = (
  id: string,
  widthMm: number,
  heightMm: number,
): MaterialPiece => ({
  id,
  surfaceId: 'S',
  materialId: 'M',
  pieceCode: id,
  physicalPolygon: [
    { x: 0, y: 0 },
    { x: widthMm, y: 0 },
    { x: widthMm, y: heightMm },
    { x: 0, y: heightMm },
  ],
  visiblePolygon: [
    { x: 0, y: 0 },
    { x: widthMm, y: 0 },
    { x: widthMm, y: heightMm },
    { x: 0, y: heightMm },
  ],
  overlapPolygons: [],
  boundingWidthMm: widthMm,
  boundingHeightMm: heightMm,
  thicknessMm: 20,
  rotationDeg: 0,
  isFullUnit: false,
  isCutPiece: true,
  isIrregular: false,
  labelPosition: { x: 0, y: 0 },
  warnings: [],
});

const wrapLayout = (pieces: MaterialPiece[]): MaterialLayout => ({
  id: 'L',
  surfaceId: 'S',
  materialId: 'M',
  placementPatternId: 'P',
  generatedAt: 'now',
  pieces,
  stats: {
    visibleAreaMm2: 0,
    physicalMaterialAreaMm2: 0,
    purchasedMaterialAreaMm2: 0,
    fullUnitCount: 0,
    cutPieceCount: 0,
    totalPieceCount: 0,
    wasteAreaMm2: 0,
    wastePercent: 0,
    uniqueCutCount: 0,
    smallPieceCount: 0,
  },
  settingsSnapshot: {
    material: createMaterial({ name: 'M', unitWidthMm: 1000, unitHeightMm: 500, id: 'M' }),
    placementPattern: {
      id: 'P', name: 'P', type: 'stacked', orientation: 'horizontal',
      angleDeg: 0, jointMm: 0, offsetXmm: 0, offsetYmm: 0,
      rowOffsetMm: 0, rowOffsetPercent: 0,
      originMode: 'topLeft', direction: 'leftToRight', symmetryMode: 'none',
      optimizationPriority: {
        wasteWeight: 1, symmetryWeight: 1, cutCountWeight: 1,
        smallPieceWeight: 1, jointAlignmentWeight: 0, manualOffsetLocked: false,
      },
    },
    edgeRules: [],
  },
});

describe('buildCuttingDiagram blade kerf', () => {
  it('packs two pieces on one unit when kerf is zero', () => {
    const material = createMaterial({
      name: 'M', unitWidthMm: 1000, unitHeightMm: 500, id: 'M',
    });
    const layout = wrapLayout([makePiece('A', 500, 500), makePiece('B', 500, 500)]);
    const diagram = buildCuttingDiagram(layout, material, { bladeKerfMm: 0 });
    expect(diagram.units).toHaveLength(1);
    expect(diagram.units[0]!.pieces).toHaveLength(2);
    // Second piece starts where the first ends (no kerf gap).
    const xs = diagram.units[0]!.pieces.map((p) => p.xMm).sort((a, b) => a - b);
    expect(xs).toEqual([0, 500]);
  });

  it('offsets the second piece by the kerf width', () => {
    const material = createMaterial({
      name: 'M', unitWidthMm: 1000, unitHeightMm: 500, id: 'M',
    });
    // Two 497.5 mm pieces only fit side-by-side on a 1000 mm sheet if we
    // leave a 2.5 mm kerf strip between them (497.5 + 2.5 + 497.5 == 1000).
    const layout = wrapLayout([makePiece('A', 497.5, 500), makePiece('B', 497.5, 500)]);
    const diagram = buildCuttingDiagram(layout, material, { bladeKerfMm: 2.5 });
    expect(diagram.units).toHaveLength(1);
    const xs = diagram.units[0]!.pieces.map((p) => p.xMm).sort((a, b) => a - b);
    expect(xs[0]).toBeCloseTo(0, 6);
    expect(xs[1]).toBeCloseTo(500, 6);
  });

  it('forces a new sheet when kerf prevents side-by-side fit', () => {
    const material = createMaterial({
      name: 'M', unitWidthMm: 1000, unitHeightMm: 500, id: 'M',
    });
    // 500 + 500 fits exactly with kerf=0 but overflows with kerf=2.5.
    const layout = wrapLayout([makePiece('A', 500, 500), makePiece('B', 500, 500)]);
    const diagram = buildCuttingDiagram(layout, material, { bladeKerfMm: 2.5 });
    expect(diagram.units).toHaveLength(2);
  });
});
