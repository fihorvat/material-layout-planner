import type { Point2D } from '@/types';
import { GEOMETRY_EPS } from './point';

export const segmentsIntersect = (
  a1: Point2D,
  a2: Point2D,
  b1: Point2D,
  b2: Point2D,
): Point2D | null => {
  const r = { x: a2.x - a1.x, y: a2.y - a1.y };
  const s = { x: b2.x - b1.x, y: b2.y - b1.y };
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < GEOMETRY_EPS) return null;
  const t = ((b1.x - a1.x) * s.y - (b1.y - a1.y) * s.x) / denom;
  const u = ((b1.x - a1.x) * r.y - (b1.y - a1.y) * r.x) / denom;
  if (t < -GEOMETRY_EPS || t > 1 + GEOMETRY_EPS) return null;
  if (u < -GEOMETRY_EPS || u > 1 + GEOMETRY_EPS) return null;
  return { x: a1.x + r.x * t, y: a1.y + r.y * t };
};

export const selfIntersects = (points: readonly Point2D[]): boolean => {
  const n = points.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    const a1 = points[i]!;
    const a2 = points[(i + 1) % n]!;
    for (let j = i + 1; j < n; j++) {
      if (j === i) continue;
      if ((j + 1) % n === i) continue;
      if (i === 0 && (j + 1) % n === 0) continue;
      const b1 = points[j]!;
      const b2 = points[(j + 1) % n]!;
      if (Math.abs(i - j) <= 1) continue;
      const hit = segmentsIntersect(a1, a2, b1, b2);
      if (hit) return true;
    }
  }
  return false;
};
