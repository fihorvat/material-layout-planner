import type { Point2D } from '@/types';
import { rotate } from './point';
import type { Aabb } from './boundingBox';

export const rectangleToPoints = (
  origin: Point2D,
  widthMm: number,
  heightMm: number,
  rotationDeg: number = 0,
): Point2D[] => {
  const corners: Point2D[] = [
    { x: 0, y: 0 },
    { x: widthMm, y: 0 },
    { x: widthMm, y: heightMm },
    { x: 0, y: heightMm },
  ];
  return corners.map((c) => {
    const rotated = rotationDeg === 0 ? c : rotate(c, rotationDeg);
    return { x: origin.x + rotated.x, y: origin.y + rotated.y };
  });
};

export const pointsToAabb = (points: readonly Point2D[]): Aabb => {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
};
