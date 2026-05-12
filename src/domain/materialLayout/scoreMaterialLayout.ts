import type { MaterialLayout, Surface, Material, OptimizationPriority } from '@/types';
import { polygonArea, pointsToAabb } from '@/domain/geometry';
import { surfaceCentroid } from '@/domain/surfaces/surfaceGeometry';

export type LayoutScore = {
  total: number;
  parts: {
    waste: number;
    cutCount: number;
    smallPiece: number;
    asymmetry: number;
    jointMisalignment: number;
  };
};

export const scoreMaterialLayout = (input: {
  layout: MaterialLayout;
  surface: Surface;
  material: Material;
  priority: OptimizationPriority;
  context?: { connectedLayouts?: MaterialLayout[] };
}): LayoutScore => {
  const { layout, surface, material, priority } = input;
  const unitArea = material.unitWidthMm * material.unitHeightMm;
  let physicalArea = 0;
  let fullUnitCount = 0;
  let cutCount = 0;
  let smallPiece = 0;
  for (const piece of layout.pieces) {
    physicalArea += Math.abs(polygonArea(piece.physicalPolygon));
    if (piece.isFullUnit) fullUnitCount += 1;
    if (piece.isCutPiece) cutCount += 1;
    if (
      piece.boundingWidthMm < material.minPieceWidthMm ||
      piece.boundingHeightMm < material.minPieceHeightMm
    ) {
      smallPiece += 1;
    }
  }
  const purchasedArea = (fullUnitCount + cutCount) * unitArea;
  const waste = purchasedArea > 0 ? (purchasedArea - physicalArea) / purchasedArea : 0;

  const centroid = surfaceCentroid(surface);
  const aabb = pointsToAabb(surface.outerBoundary);
  let asymmetry = 0;
  if (priority.symmetryWeight > 0 && layout.pieces.length > 0) {
    let nearestX = Infinity;
    let nearestY = Infinity;
    for (const piece of layout.pieces) {
      for (const v of piece.visiblePolygon) {
        nearestX = Math.min(nearestX, Math.abs(v.x - centroid.x));
        nearestY = Math.min(nearestY, Math.abs(v.y - centroid.y));
      }
    }
    const widthMm = aabb.maxX - aabb.minX || 1;
    const heightMm = aabb.maxY - aabb.minY || 1;
    asymmetry = (nearestX / widthMm + nearestY / heightMm) / 2;
  }

  const jointMisalignment = 0;

  const total =
    waste * priority.wasteWeight +
    cutCount * priority.cutCountWeight +
    smallPiece * priority.smallPieceWeight +
    asymmetry * priority.symmetryWeight +
    jointMisalignment * priority.jointAlignmentWeight;

  return {
    total,
    parts: { waste, cutCount, smallPiece, asymmetry, jointMisalignment },
  };
};
