import type { Point2D } from '@/types';
import { GEOMETRY_EPS, distance, equals } from './point';

export const polygonArea = (points: readonly Point2D[]): number => {
  const n = points.length;
  if (n < 3) return 0;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % n]!;
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
};

export const polygonPerimeter = (points: readonly Point2D[]): number => {
  const n = points.length;
  if (n < 2) return 0;
  let perim = 0;
  for (let i = 0; i < n; i++) {
    perim += distance(points[i]!, points[(i + 1) % n]!);
  }
  return perim;
};

export const polygonCentroid = (points: readonly Point2D[]): Point2D => {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0 };
  if (n === 1) return { x: points[0]!.x, y: points[0]!.y };
  let cx = 0;
  let cy = 0;
  let twiceArea = 0;
  for (let i = 0; i < n; i++) {
    const p0 = points[i]!;
    const p1 = points[(i + 1) % n]!;
    const cross = p0.x * p1.y - p1.x * p0.y;
    twiceArea += cross;
    cx += (p0.x + p1.x) * cross;
    cy += (p0.y + p1.y) * cross;
  }
  if (Math.abs(twiceArea) < GEOMETRY_EPS) {
    let sx = 0;
    let sy = 0;
    for (const p of points) {
      sx += p.x;
      sy += p.y;
    }
    return { x: sx / n, y: sy / n };
  }
  const factor = 3 * twiceArea;
  return { x: cx / factor, y: cy / factor };
};

export const isClosed = (points: readonly Point2D[], eps: number = GEOMETRY_EPS): boolean => {
  if (points.length < 2) return false;
  return equals(points[0]!, points[points.length - 1]!, eps);
};

export const closePolygon = (points: readonly Point2D[]): Point2D[] => {
  if (points.length === 0) return [];
  if (isClosed(points)) return points.slice(0, -1);
  return points.slice();
};

export const pointInPolygon = (p: Point2D, points: readonly Point2D[]): boolean => {
  const n = points.length;
  if (n < 3) return false;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = points[i]!.x;
    const yi = points[i]!.y;
    const xj = points[j]!.x;
    const yj = points[j]!.y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + (yj === yi ? GEOMETRY_EPS : 0)) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

export const polygonOrientation = (points: readonly Point2D[]): 'cw' | 'ccw' => {
  const area = polygonArea(points);
  return area >= 0 ? 'ccw' : 'cw';
};

export const ensureCCW = (points: readonly Point2D[]): Point2D[] => {
  return polygonOrientation(points) === 'ccw' ? points.slice() : points.slice().reverse();
};

export const ensureCW = (points: readonly Point2D[]): Point2D[] => {
  return polygonOrientation(points) === 'cw' ? points.slice() : points.slice().reverse();
};
