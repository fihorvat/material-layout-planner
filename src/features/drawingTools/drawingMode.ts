import type { Point2D, Project } from '@/types';
import {
  pointsToAabb,
  rectangleToPoints,
  type Aabb,
} from '@/domain/geometry';
import { useEditorStore, useSelectionStore } from '@/state';

/**
 * Returns true when the user-facing "drawing mode" visual aids and
 * bbox-edge snap should be active.
 *
 * Drawing mode turns on when:
 *  - the user has explicitly enabled the toolbar toggle, OR
 *  - any shape is currently selected (treated as an implicit hint that the
 *    user is about to align new drawings to the existing shapes).
 */
export const useDrawingModeActive = (): boolean => {
  const enabled = useEditorStore((s) => s.drawingModeEnabled);
  const hasSelection = useSelectionStore((s) => s.selected.length > 0);
  return enabled || hasSelection;
};

/**
 * Non-hook accessor for tool hooks that need to query drawing-mode state
 * inside `useCallback`s without subscribing to the stores.
 */
export const isDrawingModeActiveSnapshot = (): boolean => {
  const enabled = useEditorStore.getState().drawingModeEnabled;
  const hasSelection = useSelectionStore.getState().selected.length > 0;
  return enabled || hasSelection;
};

/**
 * Collects every shape vertex visible to the user while a drawing tool is
 * active. Used to render snap dots on top of existing geometry so other
 * shapes can be aligned to them by eye while drawing.
 */
export const collectShapeVertices = (project: Project): Point2D[] => {
  const pts: Point2D[] = [];
  for (const e of project.drawingEntities) {
    if (e.type === 'line') {
      pts.push(e.start, e.end);
    } else if (e.type === 'rectangle') {
      const corners = rectangleToPoints(
        e.origin,
        e.widthMm,
        e.heightMm,
        e.rotationDeg ?? 0,
      );
      pts.push(...corners);
    } else if (e.type === 'polygon') {
      pts.push(...e.points);
    }
  }
  for (const s of project.surfaces) {
    pts.push(...s.outerBoundary);
    for (const hole of s.holes) pts.push(...hole);
  }
  return pts;
};

type IdentifiedBbox = { id: string; bbox: Aabb };

export type ShapeEdge = { a: Point2D; b: Point2D };

const polylineEdges = (points: readonly Point2D[], closed: boolean): ShapeEdge[] => {
  const out: ShapeEdge[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    out.push({ a: points[i]!, b: points[i + 1]! });
  }
  if (closed && points.length >= 2) {
    out.push({ a: points[points.length - 1]!, b: points[0]! });
  }
  return out;
};

/**
 * Returns every actual edge segment of every visible shape: line entities,
 * the four (potentially rotated) edges of rectangles, all polygon segments,
 * and the outer plus hole boundaries of surfaces. Used by the ortho-measure
 * overlay to project ray distances onto real geometry rather than the
 * looser bounding-rectangle envelope.
 */
export const collectShapeEdges = (project: Project): ShapeEdge[] => {
  const edges: ShapeEdge[] = [];
  for (const e of project.drawingEntities) {
    if (e.type === 'line') {
      edges.push({ a: e.start, b: e.end });
    } else if (e.type === 'rectangle') {
      const corners = rectangleToPoints(
        e.origin,
        e.widthMm,
        e.heightMm,
        e.rotationDeg ?? 0,
      );
      edges.push(...polylineEdges(corners, true));
    } else if (e.type === 'polygon') {
      edges.push(...polylineEdges(e.points, true));
    }
  }
  for (const s of project.surfaces) {
    edges.push(...polylineEdges(s.outerBoundary, true));
    for (const hole of s.holes) {
      edges.push(...polylineEdges(hole, true));
    }
  }
  return edges;
};

/**
 * Returns the axis-aligned bounding rectangles of polygons, rectangles, and
 * surfaces. Lines are intentionally omitted because their bbox degenerates
 * to the line itself and offers no extra snap reference.
 */
export const collectShapeBoundingBoxes = (project: Project): IdentifiedBbox[] => {
  const out: IdentifiedBbox[] = [];
  for (const e of project.drawingEntities) {
    if (e.type === 'rectangle') {
      const corners = rectangleToPoints(
        e.origin,
        e.widthMm,
        e.heightMm,
        e.rotationDeg ?? 0,
      );
      out.push({ id: `rect:${e.id}`, bbox: pointsToAabb(corners) });
    } else if (e.type === 'polygon') {
      out.push({ id: `poly:${e.id}`, bbox: pointsToAabb(e.points) });
    }
  }
  for (const s of project.surfaces) {
    out.push({ id: `surf:${s.id}`, bbox: pointsToAabb(s.outerBoundary) });
  }
  return out;
};

const closestPointOnSegment = (
  p: Point2D,
  a: Point2D,
  b: Point2D,
): { point: Point2D; distance: number } => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) {
    return {
      point: { x: a.x, y: a.y },
      distance: Math.hypot(p.x - a.x, p.y - a.y),
    };
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const point = { x: a.x + dx * t, y: a.y + dy * t };
  return { point, distance: Math.hypot(p.x - point.x, p.y - point.y) };
};

const bboxEdges = (bbox: Aabb): readonly [Point2D, Point2D][] => [
  [
    { x: bbox.minX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.minY },
  ],
  [
    { x: bbox.maxX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.maxY },
  ],
  [
    { x: bbox.maxX, y: bbox.maxY },
    { x: bbox.minX, y: bbox.maxY },
  ],
  [
    { x: bbox.minX, y: bbox.maxY },
    { x: bbox.minX, y: bbox.minY },
  ],
];

/**
 * Projects the given world point onto the nearest bounding-rectangle edge
 * across the provided bboxes. Returns the projection point when its
 * distance to the input is within `toleranceMm`, otherwise `null`.
 *
 * Snapping to a bounding-rectangle edge constrains one cardinal axis of the
 * cursor to that of an existing shape, which is how the drawing tools form
 * perfect 90 degree corners with the bounding box of a nearby shape.
 */
export const snapToBoundingBoxEdge = (
  worldPoint: Point2D,
  toleranceMm: number,
  bboxes: readonly IdentifiedBbox[],
): Point2D | null => {
  let best: { point: Point2D; distance: number } | null = null;
  for (const { bbox } of bboxes) {
    for (const [a, b] of bboxEdges(bbox)) {
      const r = closestPointOnSegment(worldPoint, a, b);
      if (r.distance <= toleranceMm && (!best || r.distance < best.distance)) {
        best = r;
      }
    }
  }
  return best ? best.point : null;
};
