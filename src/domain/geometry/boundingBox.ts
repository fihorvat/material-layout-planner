import type { Point2D } from '@/types';

export type Aabb = { minX: number; minY: number; maxX: number; maxY: number };

export const unionAabb = (a: Aabb, b: Aabb): Aabb => ({
  minX: Math.min(a.minX, b.minX),
  minY: Math.min(a.minY, b.minY),
  maxX: Math.max(a.maxX, b.maxX),
  maxY: Math.max(a.maxY, b.maxY),
});

export const intersectAabb = (a: Aabb, b: Aabb): Aabb | null => {
  const minX = Math.max(a.minX, b.minX);
  const minY = Math.max(a.minY, b.minY);
  const maxX = Math.min(a.maxX, b.maxX);
  const maxY = Math.min(a.maxY, b.maxY);
  if (minX > maxX || minY > maxY) return null;
  return { minX, minY, maxX, maxY };
};

export const aabbContainsPoint = (a: Aabb, p: Point2D): boolean =>
  p.x >= a.minX && p.x <= a.maxX && p.y >= a.minY && p.y <= a.maxY;

export const aabbsIntersect = (a: Aabb, b: Aabb): boolean =>
  !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);

export const expandAabb = (a: Aabb, mm: number): Aabb => ({
  minX: a.minX - mm,
  minY: a.minY - mm,
  maxX: a.maxX + mm,
  maxY: a.maxY + mm,
});

export const aabbWidth = (a: Aabb): number => a.maxX - a.minX;
export const aabbHeight = (a: Aabb): number => a.maxY - a.minY;
export const aabbCenter = (a: Aabb): Point2D => ({
  x: (a.minX + a.maxX) / 2,
  y: (a.minY + a.maxY) / 2,
});
