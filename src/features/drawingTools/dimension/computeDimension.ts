import type { DimensionEntity, DimensionReference, Project, Point2D } from '@/types';
import { polygonArea, polygonCentroid, distance, radToDeg } from '@/domain/geometry';
import { formatLength } from '@/domain/units';

export type ComputedDimension =
  | {
      kind: 'linear';
      a: Point2D;
      b: Point2D;
      valueText: string;
      midpoint: Point2D;
      angleDeg: number;
    }
  | {
      kind: 'angle';
      vertex: Point2D;
      armA: Point2D;
      armB: Point2D;
      valueText: string;
    }
  | { kind: 'area'; center: Point2D; valueText: string };

const resolvePoint = (ref: DimensionReference, project: Project): Point2D | null => {
  if (ref.kind === 'point') {
    for (const e of project.drawingEntities) {
      if (e.type === 'line') {
        if (e.id === ref.id) return ref.pointIndex === 1 ? e.end : e.start;
      }
    }
    return null;
  }
  if (ref.kind === 'line') {
    const e = project.drawingEntities.find((x) => x.id === ref.id);
    if (e && e.type === 'line') {
      return ref.pointIndex === 1 ? e.end : e.start;
    }
    return null;
  }
  if (ref.kind === 'edge') {
    const s = project.surfaces.find((x) => x.id === ref.id);
    if (!s) return null;
    const i = ref.pointIndex ?? 0;
    return s.outerBoundary[i] ?? null;
  }
  return null;
};

const segmentRef = (ref: DimensionReference, project: Project): { a: Point2D; b: Point2D } | null => {
  if (ref.kind === 'line') {
    const e = project.drawingEntities.find((x) => x.id === ref.id);
    if (e && e.type === 'line') return { a: e.start, b: e.end };
  }
  if (ref.kind === 'edge') {
    const s = project.surfaces.find((x) => x.id === ref.id);
    if (!s) return null;
    const i = ref.pointIndex ?? 0;
    const a = s.outerBoundary[i];
    const b = s.outerBoundary[(i + 1) % s.outerBoundary.length];
    if (a && b) return { a, b };
  }
  return null;
};

export const computeDimension = (
  dim: DimensionEntity,
  project: Project,
): ComputedDimension | null => {
  if (dim.dimensionType === 'area') {
    const ref = dim.references[0];
    if (!ref) return null;
    let pts: Point2D[] | null = null;
    if (ref.kind === 'entity') {
      const e = project.drawingEntities.find((x) => x.id === ref.id);
      if (e && e.type === 'polygon') pts = e.points;
      const s = project.surfaces.find((x) => x.id === ref.id);
      if (s) pts = s.outerBoundary;
    }
    if (!pts || pts.length < 3) return null;
    const area = Math.abs(polygonArea(pts));
    const center = polygonCentroid(pts);
    const valueText = dim.textOverride ?? `${(area / 1_000_000).toFixed(3)} m\u00B2`;
    return { kind: 'area', center, valueText };
  }

  if (dim.dimensionType === 'angle') {
    const segA = segmentRef(dim.references[0] ?? { kind: 'point', id: '' }, project);
    const segB = segmentRef(dim.references[1] ?? { kind: 'point', id: '' }, project);
    if (!segA || !segB) return null;
    const vertex = segA.b;
    const v1 = { x: segA.a.x - vertex.x, y: segA.a.y - vertex.y };
    const v2 = { x: segB.b.x - vertex.x, y: segB.b.y - vertex.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const m1 = Math.hypot(v1.x, v1.y);
    const m2 = Math.hypot(v2.x, v2.y);
    if (m1 < 1e-9 || m2 < 1e-9) return null;
    const a = radToDeg(Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))));
    return {
      kind: 'angle',
      vertex,
      armA: segA.a,
      armB: segB.b,
      valueText: dim.textOverride ?? `${a.toFixed(1)}\u00B0`,
    };
  }

  const a = resolvePoint(dim.references[0] ?? { kind: 'point', id: '' }, project);
  const b = resolvePoint(dim.references[1] ?? { kind: 'point', id: '' }, project);
  if (!a || !b) return null;
  let value: number;
  let pa = a;
  let pb = b;
  if (dim.dimensionType === 'horizontal') {
    value = Math.abs(b.x - a.x);
    pa = { x: a.x, y: a.y };
    pb = { x: b.x, y: a.y };
  } else if (dim.dimensionType === 'vertical') {
    value = Math.abs(b.y - a.y);
    pa = { x: a.x, y: a.y };
    pb = { x: a.x, y: b.y };
  } else {
    value = distance(a, b);
  }
  const angleDeg = radToDeg(Math.atan2(pb.y - pa.y, pb.x - pa.x));
  const midpoint = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
  return {
    kind: 'linear',
    a: pa,
    b: pb,
    valueText: dim.textOverride ?? formatLength(value),
    midpoint,
    angleDeg,
  };
};
