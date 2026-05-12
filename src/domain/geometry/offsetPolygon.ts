import type { Point2D } from '@/types';
import { GEOMETRY_EPS } from './point';
import { polygonOrientation } from './polygon';

const normalAt = (a: Point2D, b: Point2D, ccw: boolean): { x: number; y: number } => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < GEOMETRY_EPS) return { x: 0, y: 0 };
  if (ccw) {
    return { x: -dy / len, y: dx / len };
  }
  return { x: dy / len, y: -dx / len };
};

/**
 * Miter offset (positive inflates, negative deflates).
 * Suitable for simple polygons with non-extreme angles; sharp corners may produce spikes.
 */
export const offsetPolygon = (
  points: readonly Point2D[],
  distanceMm: number,
): Point2D[] => {
  const n = points.length;
  if (n < 3 || Math.abs(distanceMm) < GEOMETRY_EPS) return points.slice();

  const orientationCCW = polygonOrientation(points) === 'ccw';
  const offsetDir = orientationCCW ? -distanceMm : distanceMm;

  const result: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n]!;
    const curr = points[i]!;
    const next = points[(i + 1) % n]!;
    const n1 = normalAt(prev, curr, orientationCCW);
    const n2 = normalAt(curr, next, orientationCCW);
    const bisector = { x: n1.x + n2.x, y: n1.y + n2.y };
    const blen = Math.sqrt(bisector.x * bisector.x + bisector.y * bisector.y);
    if (blen < GEOMETRY_EPS) {
      result.push({ x: curr.x + n1.x * offsetDir, y: curr.y + n1.y * offsetDir });
      continue;
    }
    bisector.x /= blen;
    bisector.y /= blen;
    const cosHalf = bisector.x * n1.x + bisector.y * n1.y;
    const miterLen = cosHalf < GEOMETRY_EPS ? offsetDir : offsetDir / cosHalf;
    result.push({ x: curr.x + bisector.x * miterLen, y: curr.y + bisector.y * miterLen });
  }
  return result;
};
