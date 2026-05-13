import type { Point2D, Project, DrawingEntity } from '@/types';
import type { LayerVisibility } from '@/state';
import type { SelectableKind } from '@/state';
import type { Aabb } from '@/domain/geometry';
import {
  pointInPolygon,
  pointsToAabb,
  aabbContainsPoint,
  pointToLineDistance,
  distance,
} from '@/domain/geometry';

export type HitCandidate = {
  kind: SelectableKind;
  id: string;
  zIndex: number;
  bbox: Aabb;
};

export type HitTestInput = {
  worldPoint: Point2D;
  tolerancePxAsMm: number;
  project: Project;
  layers: LayerVisibility;
};

export type HitTestResult = {
  topHit: HitCandidate | null;
  allHits: HitCandidate[];
};

const aabbArea = (b: Aabb): number => (b.maxX - b.minX) * (b.maxY - b.minY);

const rectPoints = (e: Extract<DrawingEntity, { type: 'rectangle' }>): Point2D[] => {
  const x0 = e.origin.x;
  const y0 = e.origin.y;
  const x1 = x0 + e.widthMm;
  const y1 = y0 + e.heightMm;
  return [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
};

export const hitTest = (input: HitTestInput): HitTestResult => {
  const { worldPoint, tolerancePxAsMm, project, layers } = input;
  const candidates: HitCandidate[] = [];

  if (layers.materialLayout.visible && !layers.materialLayout.locked) {
    for (const layout of project.materialLayouts) {
      for (const piece of layout.pieces) {
        const bbox = pointsToAabb(piece.visiblePolygon);
        if (
          aabbContainsPoint(bbox, worldPoint) &&
          pointInPolygon(worldPoint, piece.visiblePolygon)
        ) {
          candidates.push({ kind: 'materialPiece', id: piece.id, zIndex: 60, bbox });
        }
      }
    }
  }

  if (layers.openings.visible && !layers.openings.locked) {
    for (const surface of project.surfaces) {
      for (let i = 0; i < surface.holes.length; i++) {
        const hole = surface.holes[i]!;
        const meta = surface.holeMeta[i];
        const bbox = pointsToAabb(hole);
        if (aabbContainsPoint(bbox, worldPoint) && pointInPolygon(worldPoint, hole)) {
          const id = meta?.id ?? `${surface.id}:hole:${i}`;
          candidates.push({ kind: 'opening', id, zIndex: 50, bbox });
        }
      }
    }
  }

  if (layers.surfaces.visible && !layers.surfaces.locked) {
    for (const surface of project.surfaces) {
      const bbox = pointsToAabb(surface.outerBoundary);
      if (
        aabbContainsPoint(bbox, worldPoint) &&
        pointInPolygon(worldPoint, surface.outerBoundary)
      ) {
        candidates.push({ kind: 'surface', id: surface.id, zIndex: 40, bbox });
      }
    }
  }

  if (layers.construction.visible && !layers.construction.locked) {
    for (const entity of project.drawingEntities) {
      if (entity.type === 'line') {
        const d = pointToLineDistance(worldPoint, { a: entity.start, b: entity.end });
        if (d <= tolerancePxAsMm) {
          const bbox = pointsToAabb([entity.start, entity.end]);
          candidates.push({ kind: 'line', id: entity.id, zIndex: 30, bbox });
        }
      } else if (entity.type === 'rectangle') {
        const pts = rectPoints(entity);
        const bbox = pointsToAabb(pts);
        if (aabbContainsPoint(bbox, worldPoint) && pointInPolygon(worldPoint, pts)) {
          candidates.push({ kind: 'rectangle', id: entity.id, zIndex: 30, bbox });
        }
      } else if (entity.type === 'polygon') {
        const bbox = pointsToAabb(entity.points);
        if (aabbContainsPoint(bbox, worldPoint) && pointInPolygon(worldPoint, entity.points)) {
          candidates.push({ kind: 'polygon', id: entity.id, zIndex: 30, bbox });
        }
      }
    }
  }

  if (layers.labels.visible && !layers.labels.locked) {
    for (const label of project.labels) {
      if (distance(worldPoint, label.position) <= tolerancePxAsMm) {
        const r = tolerancePxAsMm;
        const bbox: Aabb = {
          minX: label.position.x - r,
          minY: label.position.y - r,
          maxX: label.position.x + r,
          maxY: label.position.y + r,
        };
        candidates.push({ kind: 'label', id: label.id, zIndex: 70, bbox });
      }
    }
  }

  candidates.sort((a, b) => {
    if (a.zIndex !== b.zIndex) return b.zIndex - a.zIndex;
    return aabbArea(a.bbox) - aabbArea(b.bbox);
  });

  return { topHit: candidates[0] ?? null, allHits: candidates };
};

export const entitiesIntersectingAabb = (
  project: Project,
  bbox: Aabb,
  containmentOnly = false,
): HitCandidate[] => {
  const out: HitCandidate[] = [];
  const intersects = (b: Aabb): boolean =>
    !(b.maxX < bbox.minX || b.minX > bbox.maxX || b.maxY < bbox.minY || b.minY > bbox.maxY);
  const contained = (b: Aabb): boolean =>
    b.minX >= bbox.minX && b.maxX <= bbox.maxX && b.minY >= bbox.minY && b.maxY <= bbox.maxY;
  const test = (b: Aabb): boolean => (containmentOnly ? contained(b) : intersects(b));

  for (const entity of project.drawingEntities) {
    let pts: Point2D[];
    let kind: SelectableKind;
    if (entity.type === 'line') {
      pts = [entity.start, entity.end];
      kind = 'line';
    } else if (entity.type === 'rectangle') {
      pts = rectPoints(entity);
      kind = 'rectangle';
    } else {
      pts = entity.points;
      kind = 'polygon';
    }
    const b = pointsToAabb(pts);
    if (test(b)) out.push({ kind, id: entity.id, zIndex: 30, bbox: b });
  }
  for (const surface of project.surfaces) {
    const b = pointsToAabb(surface.outerBoundary);
    if (test(b)) out.push({ kind: 'surface', id: surface.id, zIndex: 40, bbox: b });
  }
  return out;
};
