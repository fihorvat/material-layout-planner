import type { Material, MaterialLayout, MaterialLayoutStats, Project } from '@/types';
import { polygonArea } from '@/domain/geometry';
import type { CuttingDiagram } from './cuttingDiagram';

const round01 = (n: number): number => Math.round(n * 10) / 10;

const countPurchasedUnits = (layout: MaterialLayout): number => {
  const sourceUnits = new Set<number>();
  for (const piece of layout.pieces) {
    if (typeof piece.sourceUnitIndex === 'number') {
      sourceUnits.add(piece.sourceUnitIndex);
    }
  }
  if (layout.pieces.length > 0 && layout.pieces.every((piece) => typeof piece.sourceUnitIndex === 'number')) {
    return sourceUnits.size;
  }
  return layout.pieces.length;
};

export const computeLayoutStats = (
  layout: MaterialLayout,
  material: Material,
  cuttingDiagram?: CuttingDiagram,
): MaterialLayoutStats => {
  let visibleArea = 0;
  let physicalArea = 0;
  let fullUnitCount = 0;
  let cutPieceCount = 0;
  let smallPieceCount = 0;
  const uniqueCuts = new Set<string>();
  for (const piece of layout.pieces) {
    visibleArea += Math.abs(polygonArea(piece.visiblePolygon));
    physicalArea += Math.abs(polygonArea(piece.physicalPolygon));
    if (piece.isFullUnit) fullUnitCount += 1;
    if (piece.isCutPiece) {
      cutPieceCount += 1;
      uniqueCuts.add(
        `${round01(piece.boundingWidthMm)}x${round01(piece.boundingHeightMm)}x${piece.isIrregular ? 'I' : 'R'}`,
      );
    }
    if (
      piece.boundingWidthMm < material.minPieceWidthMm ||
      piece.boundingHeightMm < material.minPieceHeightMm
    ) {
      smallPieceCount += 1;
    }
  }
  const unitArea = material.unitWidthMm * material.unitHeightMm;
  const purchased = cuttingDiagram
    ? cuttingDiagram.units.length * unitArea
    : countPurchasedUnits(layout) * unitArea;
  const wasteArea = Math.max(0, purchased - physicalArea);
  const wastePercent = purchased > 0 ? (wasteArea / purchased) * 100 : 0;
  return {
    visibleAreaMm2: visibleArea,
    physicalMaterialAreaMm2: physicalArea,
    purchasedMaterialAreaMm2: purchased,
    fullUnitCount,
    cutPieceCount,
    totalPieceCount: layout.pieces.length,
    wasteAreaMm2: wasteArea,
    wastePercent: Math.min(100, wastePercent),
    uniqueCutCount: uniqueCuts.size,
    smallPieceCount,
  };
};

export type ProjectStats = {
  totalVisibleAreaMm2: number;
  totalPhysicalAreaMm2: number;
  totalPurchasedAreaMm2: number;
  totalFullUnits: number;
  totalCutPieces: number;
  totalPieces: number;
  totalWasteAreaMm2: number;
  totalWastePercent: number;
  perMaterial: Array<{
    materialId: string;
    materialName: string;
    fullUnits: number;
    cutPieces: number;
    purchasedAreaMm2: number;
    wasteAreaMm2: number;
    wastePercent: number;
  }>;
};

export const computeProjectStats = (
  project: Project,
  cuttingDiagrams: Record<string, CuttingDiagram> = {},
): ProjectStats => {
  let visible = 0;
  let physical = 0;
  let purchased = 0;
  let fullUnits = 0;
  let cutPieces = 0;
  let totalPieces = 0;
  let waste = 0;
  const perMaterial = new Map<
    string,
    {
      materialId: string;
      materialName: string;
      fullUnits: number;
      cutPieces: number;
      purchasedAreaMm2: number;
      wasteAreaMm2: number;
      physicalAreaMm2: number;
    }
  >();

  for (const layout of project.materialLayouts) {
    const material = project.materials.find((m) => m.id === layout.materialId);
    if (!material) continue;
    const stats = computeLayoutStats(layout, material, cuttingDiagrams[layout.id]);
    visible += stats.visibleAreaMm2;
    physical += stats.physicalMaterialAreaMm2;
    purchased += stats.purchasedMaterialAreaMm2;
    fullUnits += stats.fullUnitCount;
    cutPieces += stats.cutPieceCount;
    totalPieces += stats.totalPieceCount;
    waste += stats.wasteAreaMm2;
    const entry = perMaterial.get(material.id) ?? {
      materialId: material.id,
      materialName: material.name,
      fullUnits: 0,
      cutPieces: 0,
      purchasedAreaMm2: 0,
      wasteAreaMm2: 0,
      physicalAreaMm2: 0,
    };
    entry.fullUnits += stats.fullUnitCount;
    entry.cutPieces += stats.cutPieceCount;
    entry.purchasedAreaMm2 += stats.purchasedMaterialAreaMm2;
    entry.wasteAreaMm2 += stats.wasteAreaMm2;
    entry.physicalAreaMm2 += stats.physicalMaterialAreaMm2;
    perMaterial.set(material.id, entry);
  }

  const totalWastePercent = purchased > 0 ? (waste / purchased) * 100 : 0;
  return {
    totalVisibleAreaMm2: visible,
    totalPhysicalAreaMm2: physical,
    totalPurchasedAreaMm2: purchased,
    totalFullUnits: fullUnits,
    totalCutPieces: cutPieces,
    totalPieces,
    totalWasteAreaMm2: waste,
    totalWastePercent: Math.min(100, totalWastePercent),
    perMaterial: Array.from(perMaterial.values()).map((e) => ({
      materialId: e.materialId,
      materialName: e.materialName,
      fullUnits: e.fullUnits,
      cutPieces: e.cutPieces,
      purchasedAreaMm2: e.purchasedAreaMm2,
      wasteAreaMm2: e.wasteAreaMm2,
      wastePercent: e.purchasedAreaMm2 > 0 ? Math.min(100, (e.wasteAreaMm2 / e.purchasedAreaMm2) * 100) : 0,
    })),
  };
};
