import type {
  Surface,
  Material,
  PlacementPattern,
  EdgeRule,
  MaterialPiece,
  MaterialLayout,
} from '@/types';
import type { Polygon } from '@/domain/geometry';
import { pointsToAabb, polygonCentroid, polygonArea } from '@/domain/geometry';
import { generatePlacementGrid } from './generatePlacementGrid';
import { clipMaterialPieceToSurface } from './clipMaterialPieceToSurface';
import { buildPieceCode, buildSurfaceLetter } from './pieceCodes';
import { newMaterialPieceId, newMaterialLayoutId } from '@/domain/ids';
import type { UnitRectangle } from './types';

const FULL_UNIT_EPS_AREA = 0.5;

const isFullUnitPolygon = (unit: UnitRectangle, physical: { x: number; y: number }[]): boolean => {
  const expected = unit.widthMm * unit.heightMm;
  const actual = Math.abs(polygonArea(physical));
  return Math.abs(actual - expected) <= FULL_UNIT_EPS_AREA;
};

const isAxisAlignedRectangle = (
  physical: { x: number; y: number }[],
  unitW: number,
  unitH: number,
): boolean => {
  if (physical.length !== 4) return false;
  const aabb = pointsToAabb(physical);
  const w = aabb.maxX - aabb.minX;
  const h = aabb.maxY - aabb.minY;
  return Math.abs(w - unitW) < 1 && Math.abs(h - unitH) < 1;
};

export type BuildMaterialLayoutInput = {
  surface: Surface;
  surfaceIndex: number;
  material: Material;
  pattern: PlacementPattern;
  edgeRules: EdgeRule[];
  visibleSurfacePolygon: Polygon;
  physicalWorkingPolygon: Polygon;
  generatedAt?: string;
};

export const buildMaterialLayout = (input: BuildMaterialLayoutInput): MaterialLayout => {
  const workingAabb = pointsToAabb(input.physicalWorkingPolygon.outer);
  const grid = generatePlacementGrid({
    surface: input.surface,
    material: input.material,
    pattern: input.pattern,
    workingAabb,
  });
  const surfaceLetter = buildSurfaceLetter(input.surfaceIndex);
  const pieces: MaterialPiece[] = [];
  let index = 0;
  for (const unit of grid) {
    const result = clipMaterialPieceToSurface({
      unit,
      visibleSurfacePolygon: input.visibleSurfacePolygon,
      physicalWorkingPolygon: input.physicalWorkingPolygon,
      material: input.material,
    });
    if (!result) continue;
    const labelPos = polygonCentroid(result.visiblePolygon);
    const fullUnit = isFullUnitPolygon(unit, result.physicalPolygon);
    const irregular = !isAxisAlignedRectangle(result.physicalPolygon, unit.widthMm, unit.heightMm);
    pieces.push({
      id: newMaterialPieceId(),
      surfaceId: input.surface.id,
      materialId: input.material.id,
      pieceCode: buildPieceCode({ surfaceLetter, index }),
      physicalPolygon: result.physicalPolygon,
      visiblePolygon: result.visiblePolygon,
      overlapPolygons: result.overlapPolygons,
      boundingWidthMm: result.boundingWidthMm,
      boundingHeightMm: result.boundingHeightMm,
      thicknessMm: input.material.thicknessMm,
      rotationDeg: unit.rotationDeg,
      isFullUnit: fullUnit,
      isCutPiece: !fullUnit,
      isIrregular: irregular,
      labelPosition: labelPos,
      warnings: [],
    });
    index += 1;
  }
  return {
    id: newMaterialLayoutId(),
    surfaceId: input.surface.id,
    materialId: input.material.id,
    placementPatternId: input.pattern.id,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    pieces,
    settingsSnapshot: {
      material: input.material,
      placementPattern: input.pattern,
      edgeRules: input.edgeRules,
    },
    stats: {
      visibleAreaMm2: 0,
      physicalMaterialAreaMm2: 0,
      purchasedMaterialAreaMm2: 0,
      fullUnitCount: 0,
      cutPieceCount: 0,
      totalPieceCount: pieces.length,
      wasteAreaMm2: 0,
      wastePercent: 0,
      uniqueCutCount: 0,
      smallPieceCount: 0,
    },
  };
};
