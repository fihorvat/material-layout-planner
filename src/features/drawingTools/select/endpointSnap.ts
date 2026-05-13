import type { Point2D, Project } from '@/types';
import { snap } from '@/features/editor/canvas/snap';

/**
 * Collects candidate snap points from a project's drawing entities while
 * excluding a set of line endpoints (e.g. those currently being dragged).
 * Exclusion keys use the format `${entityId}.${'start'|'end'}`.
 */
export const collectEndpointSnapCandidates = (
  project: Project,
  excludedLineEndpoints: ReadonlySet<string>,
): Point2D[] => {
  const pts: Point2D[] = [];
  for (const e of project.drawingEntities) {
    if (e.type === 'line') {
      if (!excludedLineEndpoints.has(`${e.id}.start`)) pts.push(e.start);
      if (!excludedLineEndpoints.has(`${e.id}.end`)) pts.push(e.end);
    } else if (e.type === 'rectangle') {
      pts.push(
        { x: e.origin.x, y: e.origin.y },
        { x: e.origin.x + e.widthMm, y: e.origin.y },
        { x: e.origin.x + e.widthMm, y: e.origin.y + e.heightMm },
        { x: e.origin.x, y: e.origin.y + e.heightMm },
      );
    } else if (e.type === 'polygon') {
      pts.push(...e.points);
    }
  }
  return pts;
};

export type EndpointSnapOptions = {
  worldPoint: Point2D;
  project: Project;
  excludedLineEndpoints: ReadonlySet<string>;
  snapEnabled: boolean;
  snapTolerancePx: number;
  viewportScale: number;
};

/**
 * Snaps a dragged line endpoint onto a nearby existing vertex (line
 * endpoint, rectangle corner, or polygon vertex), so dropping one line's
 * end on another connects them. Returns the input point unchanged when
 * snap is disabled or no candidate lies within tolerance.
 */
export const snapDroppedLineEndpoint = (opts: EndpointSnapOptions): Point2D => {
  if (!opts.snapEnabled) return opts.worldPoint;
  const candidates = collectEndpointSnapCandidates(
    opts.project,
    opts.excludedLineEndpoints,
  );
  if (candidates.length === 0) return opts.worldPoint;
  const result = snap({
    worldPoint: opts.worldPoint,
    tolerancePx: opts.snapTolerancePx,
    scale: opts.viewportScale,
    // Grid is intentionally ignored here so endpoints don't get pulled to
    // a grid line when the intent is to connect to another vertex.
    gridSizeMm: 0,
    snapEnabled: true,
    snapModes: ['point'],
    candidatePoints: candidates,
  });
  return result.point;
};
