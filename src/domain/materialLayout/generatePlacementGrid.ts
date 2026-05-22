import type { Surface, Material, PlacementPattern, Point2D } from '@/types';
import type { Aabb } from '@/domain/geometry';
import { rotate } from '@/domain/geometry';
import {
  computeEffectivePatternOrigin,
  getSurfacePatternOffset,
} from '@/domain/placementPatterns/manualOffset';
import { effectiveRowOffsetMm } from '@/domain/placementPatterns/placementPattern';
import type { UnitRectangle } from './types';

const swapDimsIfVertical = (
  pattern: PlacementPattern,
  material: Material,
): { unitW: number; unitH: number } => {
  if (pattern.orientation === 'vertical') {
    return { unitW: material.unitHeightMm, unitH: material.unitWidthMm };
  }
  return { unitW: material.unitWidthMm, unitH: material.unitHeightMm };
};

const buildUnitCorners = (
  cx: number,
  cy: number,
  w: number,
  h: number,
  rotationDeg: number,
  origin: Point2D,
): Point2D[] => {
  const local: Point2D[] = [
    { x: cx - w / 2, y: cy - h / 2 },
    { x: cx + w / 2, y: cy - h / 2 },
    { x: cx + w / 2, y: cy + h / 2 },
    { x: cx - w / 2, y: cy + h / 2 },
  ];
  if (rotationDeg === 0) return local;
  return local.map((p) => rotate(p, rotationDeg, origin));
};

const rotatedAabb = (aabb: Aabb, origin: Point2D, angleDeg: number): Aabb => {
  if (angleDeg === 0) return aabb;
  const corners: Point2D[] = [
    { x: aabb.minX, y: aabb.minY },
    { x: aabb.maxX, y: aabb.minY },
    { x: aabb.maxX, y: aabb.maxY },
    { x: aabb.minX, y: aabb.maxY },
  ].map((p) => rotate(p, -angleDeg, origin));
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of corners) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
};

export const generatePlacementGrid = (input: {
  surface: Surface;
  material: Material;
  pattern: PlacementPattern;
  workingAabb: Aabb;
  patternAnchorSurface?: Surface;
  patternOriginTranslation?: Point2D;
}): UnitRectangle[] => {
  const { material, pattern, workingAabb, patternAnchorSurface, patternOriginTranslation } = input;
  const { unitW, unitH } = swapDimsIfVertical(pattern, material);
  const joint = pattern.jointMm;
  const stepX = unitW + joint;
  const stepY = unitH + joint;
  const rowOffset = effectiveRowOffsetMm(pattern, material);

  const baseOrigin = computeEffectivePatternOrigin(pattern, patternAnchorSurface ?? input.surface);
  const surfaceOffset = getSurfacePatternOffset(input.surface, pattern);
  const rawOrigin = {
    x: baseOrigin.x + (patternOriginTranslation?.x ?? 0) + surfaceOffset.x,
    y: baseOrigin.y + (patternOriginTranslation?.y ?? 0) + surfaceOffset.y,
  };
  const cornerOffsetX =
    pattern.originMode === 'topLeft' || pattern.originMode === 'bottomLeft' ? unitW / 2 : 0;
  const cornerOffsetY =
    pattern.originMode === 'topLeft'
      ? unitH / 2
      : pattern.originMode === 'bottomLeft'
        ? -unitH / 2
        : 0;
  const origin: Point2D = {
    x: rawOrigin.x + cornerOffsetX,
    y: rawOrigin.y + cornerOffsetY,
  };
  const rotationDeg = pattern.orientation === 'customAngle' ? pattern.angleDeg : 0;
  const localAabb = rotatedAabb(workingAabb, origin, rotationDeg);

  const margin = Math.max(unitW, unitH) + joint;
  const colMin = Math.floor((localAabb.minX - origin.x - margin) / stepX);
  const colMax = Math.ceil((localAabb.maxX - origin.x + margin) / stepX);
  const rowMin = Math.floor((localAabb.minY - origin.y - margin) / stepY);
  const rowMax = Math.ceil((localAabb.maxY - origin.y + margin) / stepY);

  const out: UnitRectangle[] = [];
  for (let row = rowMin; row <= rowMax; row++) {
    const rowShift = ((row % 2) + 2) % 2 === 1 ? rowOffset : 0;
    for (let col = colMin; col <= colMax; col++) {
      const cx = origin.x + col * stepX + rowShift;
      const cy = origin.y + row * stepY;
      const corners = buildUnitCorners(cx, cy, unitW, unitH, rotationDeg, origin);
      const centerWorld =
        rotationDeg === 0 ? { x: cx, y: cy } : rotate({ x: cx, y: cy }, rotationDeg, origin);
      out.push({
        index: { row, col },
        corners,
        centerWorld,
        widthMm: unitW,
        heightMm: unitH,
        rotationDeg,
      });
    }
  }
  return out;
};
