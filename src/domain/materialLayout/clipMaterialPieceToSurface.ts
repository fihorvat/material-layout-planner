import type { Point2D } from '@/types';
import type { Polygon } from '@/domain/geometry';
import {
  polygonIntersection,
  polygonDifference,
  polygonArea,
  rotate,
  pointsToAabb,
} from '@/domain/geometry';
import type { UnitRectangle } from './types';
import type { OverlapZone } from './computeWorkingPolygon';

const cornersToPolygon = (corners: Point2D[]): Polygon => ({ outer: corners });

const MIN_FRAGMENT_AREA_MM2 = 1;
const DEFAULT_OVERLAP_OPACITY = 0.25;

const significantParts = (parts: Polygon[]): Polygon[] =>
  parts.filter((part) => Math.abs(polygonArea(part.outer)) >= MIN_FRAGMENT_AREA_MM2);

const subtractVisibleParts = (physical: Polygon, visibleParts: Polygon[]): Polygon[] => {
  let remainder: Polygon[] = [physical];
  for (const visible of visibleParts) {
    remainder = remainder.flatMap((part) => polygonDifference(part, visible));
  }
  return significantParts(remainder);
};

const localBoundingBox = (poly: Point2D[], origin: Point2D, rotationDeg: number) => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of poly) {
    const local = rotationDeg === 0 ? p : rotate(p, -rotationDeg, origin);
    if (local.x < minX) minX = local.x;
    if (local.y < minY) minY = local.y;
    if (local.x > maxX) maxX = local.x;
    if (local.y > maxY) maxY = local.y;
  }
  return { width: maxX - minX, height: maxY - minY };
};

type ClipResult = {
  visiblePolygon: Point2D[];
  physicalPolygon: Point2D[];
  overlapPolygons: Point2D[][];
  overlapPolygonOpacities: number[];
  boundingWidthMm: number;
  boundingHeightMm: number;
};

const overlapIntersectionArea = (polygon: Point2D[], zone: Polygon): number =>
  polygonIntersection({ outer: polygon }, zone).reduce(
    (sum, part) => sum + Math.abs(polygonArea(part.outer)),
    0,
  );

const resolveOverlapOpacity = (polygon: Point2D[], overlapZones: OverlapZone[]): number => {
  let bestOpacity = DEFAULT_OVERLAP_OPACITY;
  let bestArea = 0;
  for (const zone of overlapZones) {
    const area = overlapIntersectionArea(polygon, zone.polygon);
    if (area > bestArea) {
      bestArea = area;
      bestOpacity = zone.opacity01;
    }
  }
  return bestOpacity;
};

export const clipMaterialPieceToSurface = (input: {
  unit: UnitRectangle;
  visibleSurfacePolygon: Polygon;
  physicalWorkingPolygon: Polygon;
  overlapZones?: OverlapZone[];
}): ClipResult[] => {
  const unitPoly = cornersToPolygon(input.unit.corners);
  const physicalParts = significantParts(
    polygonIntersection(unitPoly, input.physicalWorkingPolygon),
  );

  return physicalParts
    .map((physical) => {
      const visibleParts = significantParts(
        polygonIntersection(physical, input.visibleSurfacePolygon),
      );
      if (visibleParts.length === 0) return null;

      let visible = visibleParts[0]!;
      let visibleArea = Math.abs(polygonArea(visible.outer));
      for (const part of visibleParts) {
        const area = Math.abs(polygonArea(part.outer));
        if (area > visibleArea) {
          visible = part;
          visibleArea = area;
        }
      }

      const overlapPolygons = subtractVisibleParts(physical, visibleParts).map(
        (part) => part.outer,
      );
      const overlapPolygonOpacities = overlapPolygons.map((polygon) =>
        resolveOverlapOpacity(polygon, input.overlapZones ?? []),
      );
      const local = localBoundingBox(
        physical.outer,
        input.unit.centerWorld,
        input.unit.rotationDeg,
      );
      return {
        visiblePolygon: visible.outer,
        physicalPolygon: physical.outer,
        overlapPolygons,
        overlapPolygonOpacities,
        boundingWidthMm: local.width,
        boundingHeightMm: local.height,
      };
    })
    .filter((result): result is ClipResult => result !== null)
    .sort((a, b) => {
      const aBox = pointsToAabb(a.physicalPolygon);
      const bBox = pointsToAabb(b.physicalPolygon);
      return aBox.minY - bBox.minY || aBox.minX - bBox.minX;
    });
};
