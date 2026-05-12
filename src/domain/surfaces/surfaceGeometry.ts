import type { Surface, Point2D } from '@/types';
import {
  polygonArea,
  polygonCentroid,
  distance,
  pointsToAabb,
  type Aabb,
} from '@/domain/geometry';

export const surfaceArea = (s: Surface): number => {
  const outer = Math.abs(polygonArea(s.outerBoundary));
  let holes = 0;
  for (const h of s.holes) {
    holes += Math.abs(polygonArea(h));
  }
  return outer - holes;
};

export const surfaceCentroid = (s: Surface): Point2D => {
  // Compound centroid weighted by signed area; for MVP use outer centroid.
  return polygonCentroid(s.outerBoundary);
};

export type SurfaceEdge = {
  index: number;
  a: Point2D;
  b: Point2D;
  lengthMm: number;
  midpoint: Point2D;
};

export const surfaceEdges = (s: Surface): SurfaceEdge[] => {
  const out: SurfaceEdge[] = [];
  const pts = s.outerBoundary;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    out.push({
      index: i,
      a,
      b,
      lengthMm: distance(a, b),
      midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    });
  }
  return out;
};

export const surfaceBoundingBox = (s: Surface): Aabb => pointsToAabb(s.outerBoundary);
