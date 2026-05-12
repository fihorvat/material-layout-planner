import type { Surface, Point2D } from '@/types';
import { polygonDifference, polygonIntersection, ensureCCW } from '@/domain/geometry';
import { createSurface } from './createSurface';

export type SplitIssue = { code: string; message: string };
export type SplitResult = { parts: Surface[]; issues: SplitIssue[] };

const surfaceToPolygon = (s: Surface) => ({ outer: s.outerBoundary, holes: s.holes });

const cloneSurfaceMeta = (source: Surface, name: string, outer: Point2D[], holes: Point2D[][]): Surface => {
  const base = createSurface({ name, outerBoundary: outer, holes });
  return {
    ...base,
    materialId: source.materialId,
    placementPatternId: source.placementPatternId,
    showName: source.showName,
    showDimensions: source.showDimensions,
    showArea: source.showArea,
    style: source.style,
  };
};

export const splitSurfaceByPolygon = (
  surface: Surface,
  inner: Point2D[],
  opts: { mode: 'extractInner' | 'subtractInner'; namePrefix?: string },
): SplitResult => {
  const prefix = opts.namePrefix ?? surface.name;
  const innerPoly = { outer: ensureCCW(inner) };
  const sourcePoly = surfaceToPolygon(surface);
  const issues: SplitIssue[] = [];
  if (opts.mode === 'subtractInner') {
    const subtracted = polygonDifference(sourcePoly, innerPoly);
    if (subtracted.length === 0) {
      issues.push({ code: 'noResult', message: 'Subtraction produced no surface' });
      return { parts: [], issues };
    }
    const parts: Surface[] = subtracted.map((poly, i) =>
      cloneSurfaceMeta(surface, `${prefix} ${String.fromCharCode(65 + i)}`, poly.outer, poly.holes ?? []),
    );
    return { parts, issues };
  }
  // extractInner: result = inner intersect source + (source - inner)
  const inside = polygonIntersection(sourcePoly, innerPoly);
  const outside = polygonDifference(sourcePoly, innerPoly);
  if (inside.length === 0) {
    issues.push({ code: 'noOverlap', message: 'Split region does not overlap source surface' });
    return { parts: [], issues };
  }
  const parts: Surface[] = [];
  let idx = 0;
  for (const poly of [...inside, ...outside]) {
    parts.push(
      cloneSurfaceMeta(surface, `${prefix} ${String.fromCharCode(65 + idx)}`, poly.outer, poly.holes ?? []),
    );
    idx += 1;
  }
  return { parts, issues };
};

export const splitSurfaceByLine = (
  surface: Surface,
  cut: { a: Point2D; b: Point2D },
  opts: { namePrefix?: string } = {},
): SplitResult => {
  const dx = cut.b.x - cut.a.x;
  const dy = cut.b.y - cut.a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) {
    return { parts: [], issues: [{ code: 'degenerateCut', message: 'Cut line is degenerate' }] };
  }
  const nx = -dy / len;
  const ny = dx / len;
  const ex = (dx / len) * 1e6;
  const ey = (dy / len) * 1e6;
  const ax = cut.a.x - ex;
  const ay = cut.a.y - ey;
  const bx = cut.b.x + ex;
  const by = cut.b.y + ey;
  const buildHalf = (sign: 1 | -1): Point2D[] => [
    { x: ax + nx * 1e6 * sign, y: ay + ny * 1e6 * sign },
    { x: bx + nx * 1e6 * sign, y: by + ny * 1e6 * sign },
    { x: bx, y: by },
    { x: ax, y: ay },
  ];
  const sourcePoly = surfaceToPolygon(surface);
  const prefix = opts.namePrefix ?? surface.name;
  const left = polygonIntersection(sourcePoly, { outer: buildHalf(1) });
  const right = polygonIntersection(sourcePoly, { outer: buildHalf(-1) });
  const parts: Surface[] = [];
  let idx = 0;
  for (const poly of [...left, ...right]) {
    parts.push(
      cloneSurfaceMeta(surface, `${prefix} ${String.fromCharCode(65 + idx)}`, poly.outer, poly.holes ?? []),
    );
    idx += 1;
  }
  if (parts.length < 2) {
    return { parts, issues: [{ code: 'cutMissedSurface', message: 'Cut line does not divide surface into two' }] };
  }
  return { parts, issues: [] };
};

export const splitSurfaceAtDimension = (
  surface: Surface,
  edgeIndex: number,
  offsetMm: number,
  opts: { perpendicular?: boolean; namePrefix?: string } = {},
): SplitResult => {
  const pts = surface.outerBoundary;
  const a = pts[edgeIndex];
  const b = pts[(edgeIndex + 1) % pts.length];
  if (!a || !b) {
    return { parts: [], issues: [{ code: 'badEdgeIndex', message: 'Edge index out of range' }] };
  }
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) {
    return { parts: [], issues: [{ code: 'degenerateEdge', message: 'Edge is degenerate' }] };
  }
  const t = Math.max(0, Math.min(1, offsetMm / len));
  const cutOrigin: Point2D = { x: a.x + dx * t, y: a.y + dy * t };
  // perpendicular direction
  const perp = opts.perpendicular === false
    ? { x: dx / len, y: dy / len }
    : { x: -dy / len, y: dx / len };
  const cutEnd: Point2D = { x: cutOrigin.x + perp.x * 1e6, y: cutOrigin.y + perp.y * 1e6 };
  return splitSurfaceByLine(surface, { a: cutOrigin, b: cutEnd }, opts);
};
