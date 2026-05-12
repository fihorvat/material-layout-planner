import type { Point2D } from '@/types';
import { GEOMETRY_EPS, distance, lerp, normalize, radToDeg, sub } from './point';

export type Segment = { a: Point2D; b: Point2D };

export const lineLength = (line: Segment): number => distance(line.a, line.b);

export const lineAngleDeg = (line: Segment): number => {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  return radToDeg(Math.atan2(dy, dx));
};

export const lineDirection = (line: Segment): Point2D => normalize(sub(line.b, line.a));

export const segmentMidpoint = (line: Segment): Point2D => lerp(line.a, line.b, 0.5);

export const closestPointOnSegment = (p: Point2D, line: Segment): Point2D => {
  const ax = line.a.x;
  const ay = line.a.y;
  const bx = line.b.x;
  const by = line.b.y;
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < GEOMETRY_EPS) return { x: ax, y: ay };
  let t = ((p.x - ax) * dx + (p.y - ay) * dy) / lenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  return { x: ax + dx * t, y: ay + dy * t };
};

export const pointToLineDistance = (p: Point2D, line: Segment): number =>
  distance(p, closestPointOnSegment(p, line));
