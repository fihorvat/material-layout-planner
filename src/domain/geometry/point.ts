import type { Point2D } from '@/types';

export const GEOMETRY_EPS = 1e-6;

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

export const add = (a: Point2D, b: Point2D): Point2D => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Point2D, b: Point2D): Point2D => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (p: Point2D, s: number): Point2D => ({ x: p.x * s, y: p.y * s });
export const dot = (a: Point2D, b: Point2D): number => a.x * b.x + a.y * b.y;
export const cross = (a: Point2D, b: Point2D): number => a.x * b.y - a.y * b.x;

export const length = (p: Point2D): number => Math.sqrt(p.x * p.x + p.y * p.y);

export const distance = (a: Point2D, b: Point2D): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const lerp = (a: Point2D, b: Point2D, t: number): Point2D => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

export const equals = (a: Point2D, b: Point2D, eps: number = GEOMETRY_EPS): boolean =>
  Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps;

export const rotate = (p: Point2D, angleDeg: number, origin?: Point2D): Point2D => {
  const o = origin ?? { x: 0, y: 0 };
  const rad = degToRad(angleDeg);
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const dx = p.x - o.x;
  const dy = p.y - o.y;
  return { x: o.x + dx * c - dy * s, y: o.y + dx * s + dy * c };
};

export const normalize = (p: Point2D): Point2D => {
  const len = length(p);
  if (len < GEOMETRY_EPS) return { x: 0, y: 0 };
  return { x: p.x / len, y: p.y / len };
};

/**
 * Returns `to` projected onto the nearest ray emitted from `from` whose
 * direction is a multiple of `stepDeg` (default 90°). Preserves the distance
 * between `from` and `to`. Used to implement the "ortho / Shift" snap during
 * both drawing and corner-editing.
 */
export const constrainAngle = (from: Point2D, to: Point2D, stepDeg = 90): Point2D => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < GEOMETRY_EPS) return to;
  const angle = Math.atan2(dy, dx);
  const step = degToRad(stepDeg);
  const snapped = Math.round(angle / step) * step;
  return {
    x: from.x + Math.cos(snapped) * len,
    y: from.y + Math.sin(snapped) * len,
  };
};
