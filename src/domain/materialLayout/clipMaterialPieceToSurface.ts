import type { Point2D, Material } from '@/types';
import type { Polygon } from '@/domain/geometry';
import { polygonIntersection, polygonDifference, polygonArea, rotate } from '@/domain/geometry';
import type { UnitRectangle } from './types';

const cornersToPolygon = (corners: Point2D[]): Polygon => ({ outer: corners });

const pickLargest = (parts: Polygon[]): Polygon | null => {
  let best: Polygon | null = null;
  let bestArea = -Infinity;
  for (const p of parts) {
    const a = Math.abs(polygonArea(p.outer));
    if (a > bestArea) {
      best = p;
      bestArea = a;
    }
  }
  if (!best || Math.abs(polygonArea(best.outer)) < 1) return null;
  return best;
};

const localBoundingBox = (poly: Point2D[], origin: Point2D, rotationDeg: number) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of poly) {
    const local = rotationDeg === 0 ? p : rotate(p, -rotationDeg, origin);
    if (local.x < minX) minX = local.x;
    if (local.y < minY) minY = local.y;
    if (local.x > maxX) maxX = local.x;
    if (local.y > maxY) maxY = local.y;
  }
  return { width: maxX - minX, height: maxY - minY };
};

export type ClipResult = {
  visiblePolygon: Point2D[];
  physicalPolygon: Point2D[];
  overlapPolygons: Point2D[][];
  boundingWidthMm: number;
  boundingHeightMm: number;
};

export const clipMaterialPieceToSurface = (input: {
  unit: UnitRectangle;
  visibleSurfacePolygon: Polygon;
  physicalWorkingPolygon: Polygon;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  material: Material;
}): ClipResult | null => {
  const unitPoly = cornersToPolygon(input.unit.corners);
  const physicalParts = polygonIntersection(unitPoly, input.physicalWorkingPolygon);
  const physical = pickLargest(physicalParts);
  if (!physical) return null;
  const visibleParts = polygonIntersection({ outer: physical.outer }, input.visibleSurfacePolygon);
  const visible = pickLargest(visibleParts);
  if (!visible) return null;
  const overlapParts = polygonDifference({ outer: physical.outer }, { outer: visible.outer });
  const overlapPolygons = overlapParts
    .filter((p) => Math.abs(polygonArea(p.outer)) >= 1)
    .map((p) => p.outer);
  const local = localBoundingBox(physical.outer, input.unit.centerWorld, input.unit.rotationDeg);
  return {
    visiblePolygon: visible.outer,
    physicalPolygon: physical.outer,
    overlapPolygons,
    boundingWidthMm: local.width,
    boundingHeightMm: local.height,
  };
};
