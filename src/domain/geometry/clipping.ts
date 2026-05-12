import type { Point2D } from '@/types';
import { GEOMETRY_EPS } from './point';

const inside = (p: Point2D, a: Point2D, b: Point2D): boolean => {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) >= -GEOMETRY_EPS;
};

const intersection = (p1: Point2D, p2: Point2D, a: Point2D, b: Point2D): Point2D => {
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;
  const x3 = a.x;
  const y3 = a.y;
  const x4 = b.x;
  const y4 = b.y;
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < GEOMETRY_EPS) return p2;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
};

export const clipPolygonToConvex = (
  subject: readonly Point2D[],
  clip: readonly Point2D[],
): Point2D[] => {
  if (subject.length === 0 || clip.length < 3) return [];
  let output: Point2D[] = subject.slice();
  const n = clip.length;
  for (let i = 0; i < n; i++) {
    const input = output;
    output = [];
    const a = clip[i]!;
    const b = clip[(i + 1) % n]!;
    for (let j = 0; j < input.length; j++) {
      const current = input[j]!;
      const prev = input[(j - 1 + input.length) % input.length]!;
      const curIn = inside(current, a, b);
      const prevIn = inside(prev, a, b);
      if (curIn) {
        if (!prevIn) {
          output.push(intersection(prev, current, a, b));
        }
        output.push(current);
      } else if (prevIn) {
        output.push(intersection(prev, current, a, b));
      }
    }
    if (output.length === 0) return [];
  }
  return output;
};
