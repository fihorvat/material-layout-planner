import type { Surface, Point2D } from '@/types';
import { validatePolygon, pointInPolygon, aabbsIntersect, pointsToAabb } from '@/domain/geometry';

export type OpeningValidation = {
  valid: boolean;
  issues: { code: string; message: string }[];
};

export const validateOpening = (surface: Surface, hole: Point2D[]): OpeningValidation => {
  const issues: OpeningValidation['issues'] = [];
  const polyVal = validatePolygon(hole);
  if (!polyVal.valid) {
    for (const iss of polyVal.issues) {
      issues.push({ code: iss.code, message: `Opening polygon: ${iss.code}` });
    }
  }
  for (const p of hole) {
    if (!pointInPolygon(p, surface.outerBoundary)) {
      issues.push({ code: 'openingOutsideSurface', message: 'Opening extends outside parent surface' });
      break;
    }
  }
  const newBox = pointsToAabb(hole);
  for (let i = 0; i < surface.holes.length; i++) {
    const existing = surface.holes[i]!;
    const existBox = pointsToAabb(existing);
    if (aabbsIntersect(existBox, newBox)) {
      const intersects =
        hole.some((p) => pointInPolygon(p, existing)) ||
        existing.some((p) => pointInPolygon(p, hole));
      if (intersects) {
        issues.push({ code: 'openingOverlap', message: `Overlaps existing opening ${i}` });
        break;
      }
    }
  }
  return { valid: issues.length === 0, issues };
};

export const findEnclosingSurface = (surfaces: Surface[], point: Point2D): Surface | null => {
  let best: Surface | null = null;
  let bestArea = Infinity;
  for (const s of surfaces) {
    if (pointInPolygon(point, s.outerBoundary)) {
      const b = pointsToAabb(s.outerBoundary);
      const area = (b.maxX - b.minX) * (b.maxY - b.minY);
      if (area < bestArea) {
        best = s;
        bestArea = area;
      }
    }
  }
  return best;
};
