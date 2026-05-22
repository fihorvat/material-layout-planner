import type { Project, Point2D, LineEntity, RectangleEntity, PolygonEntity, Surface } from '@/types';
import type { DimensionEditTarget } from '@/state';
import {
  dispatchCommand,
  updateDrawingEntityCommand,
  updateSurfaceCommand,
  updateOpeningCommand,
  findOpeningSurface,
} from '@/domain/commands';

const setEndPointAtLength = (a: Point2D, b: Point2D, newLengthMm: number): Point2D => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9 || newLengthMm <= 0) return b;
  const k = newLengthMm / len;
  return { x: a.x + dx * k, y: a.y + dy * k };
};

export const applyEdgeLength = (
  project: Project,
  target: DimensionEditTarget,
  newLengthMm: number,
): boolean => {
  if (!Number.isFinite(newLengthMm) || newLengthMm <= 0) return false;

  if (target.kind === 'line') {
    const e = project.drawingEntities.find((x) => x.id === target.entityId);
    if (!e || e.type !== 'line') return false;
    const newEnd = setEndPointAtLength(e.start, e.end, newLengthMm);
    if (newEnd.x === e.end.x && newEnd.y === e.end.y) return false;
    dispatchCommand(
      updateDrawingEntityCommand(
        { id: e.id, patch: { end: newEnd } as Partial<LineEntity> },
        `Set line length to ${newLengthMm} mm`,
      ),
    );
    return true;
  }

  if (target.kind === 'rectWidth' || target.kind === 'rectHeight') {
    const e = project.drawingEntities.find((x) => x.id === target.entityId);
    if (!e || e.type !== 'rectangle') return false;
    const patch: Partial<RectangleEntity> =
      target.kind === 'rectWidth'
        ? { widthMm: newLengthMm }
        : { heightMm: newLengthMm };
    dispatchCommand(
      updateDrawingEntityCommand(
        { id: e.id, patch },
        `Resize rectangle`,
      ),
    );
    return true;
  }

  if (target.kind === 'polygonEdge') {
    const e = project.drawingEntities.find((x) => x.id === target.entityId);
    if (!e || e.type !== 'polygon') return false;
    const pts = e.points;
    const i = target.edgeIndex;
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    if (!a || !b) return false;
    const newB = setEndPointAtLength(a, b, newLengthMm);
    const dx = newB.x - b.x;
    const dy = newB.y - b.y;
    // Shift the moving vertex and every vertex after it so subsequent edges keep their direction/length.
    const nextPts = pts.map((p, idx) => {
      const k = (i + 1) % pts.length;
      if (idx === k) return newB;
      // Only the moving vertex changes; other vertices stay fixed to keep the rest of the polygon intact.
      return p;
    });
    void dx;
    void dy;
    dispatchCommand(
      updateDrawingEntityCommand(
        { id: e.id, patch: { points: nextPts } as Partial<PolygonEntity> },
        `Resize polygon edge ${i + 1}`,
      ),
    );
    return true;
  }

  if (target.kind === 'surfaceEdge') {
    const s = project.surfaces.find((x) => x.id === target.surfaceId);
    if (!s) return false;
    const pts = s.outerBoundary;
    const i = target.edgeIndex;
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    if (!a || !b) return false;
    const newB = setEndPointAtLength(a, b, newLengthMm);
    const nextPts = pts.map((p, idx) =>
      idx === (i + 1) % pts.length ? newB : p,
    );
    dispatchCommand(
      updateSurfaceCommand(
        { id: s.id, patch: { outerBoundary: nextPts } as Partial<Surface> },
        `Resize surface edge ${i + 1}`,
      ),
    );
    return true;
  }

  if (target.kind === 'openingEdge') {
    const found = findOpeningSurface(project, target.openingId);
    if (!found || found.surface.id !== target.surfaceId) return false;
    const hole = found.surface.holes[found.index];
    if (!hole) return false;
    const a = hole[target.edgeIndex];
    const b = hole[(target.edgeIndex + 1) % hole.length];
    if (!a || !b) return false;
    const newB = setEndPointAtLength(a, b, newLengthMm);
    const nextHole = hole.map((point, index) =>
      index === (target.edgeIndex + 1) % hole.length ? newB : point,
    );
    dispatchCommand(
      updateOpeningCommand(
        {
          surfaceId: target.surfaceId,
          openingId: target.openingId,
          patch: { hole: nextHole },
        },
        `Resize opening edge ${target.edgeIndex + 1}`,
      ),
    );
    return true;
  }

  return false;
};

export const getEdgeLength = (
  project: Project,
  target: DimensionEditTarget,
): number | null => {
  if (target.kind === 'line') {
    const e = project.drawingEntities.find((x) => x.id === target.entityId);
    if (!e || e.type !== 'line') return null;
    return Math.hypot(e.end.x - e.start.x, e.end.y - e.start.y);
  }
  if (target.kind === 'rectWidth' || target.kind === 'rectHeight') {
    const e = project.drawingEntities.find((x) => x.id === target.entityId);
    if (!e || e.type !== 'rectangle') return null;
    return target.kind === 'rectWidth' ? e.widthMm : e.heightMm;
  }
  if (target.kind === 'polygonEdge') {
    const e = project.drawingEntities.find((x) => x.id === target.entityId);
    if (!e || e.type !== 'polygon') return null;
    const a = e.points[target.edgeIndex];
    const b = e.points[(target.edgeIndex + 1) % e.points.length];
    if (!a || !b) return null;
    return Math.hypot(b.x - a.x, b.y - a.y);
  }
  if (target.kind === 'surfaceEdge') {
    const s = project.surfaces.find((x) => x.id === target.surfaceId);
    if (!s) return null;
    const a = s.outerBoundary[target.edgeIndex];
    const b = s.outerBoundary[(target.edgeIndex + 1) % s.outerBoundary.length];
    if (!a || !b) return null;
    return Math.hypot(b.x - a.x, b.y - a.y);
  }
  if (target.kind === 'openingEdge') {
    const found = findOpeningSurface(project, target.openingId);
    if (!found || found.surface.id !== target.surfaceId) return null;
    const hole = found.surface.holes[found.index];
    if (!hole) return null;
    const a = hole[target.edgeIndex];
    const b = hole[(target.edgeIndex + 1) % hole.length];
    if (!a || !b) return null;
    return Math.hypot(b.x - a.x, b.y - a.y);
  }
  return null;
};
