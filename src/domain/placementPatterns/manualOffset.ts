import type { PlacementPattern, Material, Surface, Point2D } from '@/types';
import { pointsToAabb } from '@/domain/geometry';
import { surfaceCentroid } from '@/domain/surfaces/surfaceGeometry';

type SnapStep = 'none' | '1mm' | '5mm' | '10mm' | 'jointStep' | 'unitStep';

export const computeEffectivePatternOrigin = (
  pattern: PlacementPattern,
  surface: Surface,
): Point2D => {
  const offset = { x: pattern.offsetXmm, y: pattern.offsetYmm };
  switch (pattern.originMode) {
    case 'surfaceCenter': {
      const c = surfaceCentroid(surface);
      return { x: c.x + offset.x, y: c.y + offset.y };
    }
    case 'topLeft': {
      const b = pointsToAabb(surface.outerBoundary);
      return { x: b.minX + offset.x, y: b.minY + offset.y };
    }
    case 'bottomLeft': {
      const b = pointsToAabb(surface.outerBoundary);
      return { x: b.minX + offset.x, y: b.maxY + offset.y };
    }
    case 'customPoint': {
      const c = pattern.customOrigin ?? { x: 0, y: 0 };
      return { x: c.x + offset.x, y: c.y + offset.y };
    }
    default:
      return offset;
  }
};

const snapNumber = (v: number, step: number): number =>
  step > 0 ? Math.round(v / step) * step : v;

export const snapOffset = (
  delta: Point2D,
  snap: SnapStep,
  pattern: PlacementPattern,
  material: Material | null,
): Point2D => {
  if (snap === 'none') return delta;
  let stepX: number;
  let stepY: number;
  switch (snap) {
    case '1mm':
      stepX = 1;
      stepY = 1;
      break;
    case '5mm':
      stepX = 5;
      stepY = 5;
      break;
    case '10mm':
      stepX = 10;
      stepY = 10;
      break;
    case 'jointStep':
      stepX = Math.max(pattern.jointMm, 0.01);
      stepY = stepX;
      break;
    case 'unitStep':
      if (!material) return delta;
      stepX = material.unitWidthMm + pattern.jointMm;
      stepY = material.unitHeightMm + pattern.jointMm;
      break;
    default:
      return delta;
  }
  return { x: snapNumber(delta.x, stepX), y: snapNumber(delta.y, stepY) };
};
