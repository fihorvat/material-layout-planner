import type { Point2D, Project, DrawingEntity } from '@/types';
import { pointInPolygon, pointsToAabb, aabbContainsPoint } from '@/domain/geometry';

const rectPolygon = (e: Extract<DrawingEntity, { type: 'rectangle' }>): Point2D[] => [
  { x: e.origin.x, y: e.origin.y },
  { x: e.origin.x + e.widthMm, y: e.origin.y },
  { x: e.origin.x + e.widthMm, y: e.origin.y + e.heightMm },
  { x: e.origin.x, y: e.origin.y + e.heightMm },
];

const drawingEntityAtPoint = (project: Project, p: Point2D): DrawingEntity | null => {
  for (const e of project.drawingEntities) {
    if (e.type === 'rectangle') {
      const pts = rectPolygon(e);
      if (aabbContainsPoint(pointsToAabb(pts), p) && pointInPolygon(p, pts)) return e;
    } else if (e.type === 'polygon') {
      if (aabbContainsPoint(pointsToAabb(e.points), p) && pointInPolygon(p, e.points)) return e;
    }
  }
  return null;
};

/**
 * Build an actionable explanation for the user when the opening tool cannot
 * find an enclosing surface at the click point. Distinguishes "no surfaces
 * exist at all" and "you clicked on a drawing entity that is not a surface
 * yet" from the generic "click was outside any surface" case.
 */
export const noEnclosingSurfaceMessage = (project: Project, p: Point2D): string => {
  const hit = drawingEntityAtPoint(project, p);
  if (hit) {
    return `That ${hit.type} is a drawing entity, not a Surface. Convert it to a Surface first (Surface tool, shortcut F) — openings can only be punched into Surfaces.`;
  }
  if (project.surfaces.length === 0) {
    return 'No surfaces yet. Create a Surface first (Surface tool, shortcut F), then punch openings into it.';
  }
  return 'Click inside a Surface to start the opening. Openings are holes in Surfaces, not in the empty canvas.';
};
