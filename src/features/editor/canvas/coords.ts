import type { Point2D } from '@/types';
import type { Viewport } from '@/state';

export const worldToScreen = (p: Point2D, v: Viewport): { x: number; y: number } => ({
  x: p.x * v.scale + v.offsetXPx,
  y: p.y * v.scale + v.offsetYPx,
});

export const screenToWorld = (sx: number, sy: number, v: Viewport): Point2D => ({
  x: (sx - v.offsetXPx) / v.scale,
  y: (sy - v.offsetYPx) / v.scale,
});

export const screenDeltaToWorld = (
  dxPx: number,
  dyPx: number,
  v: Viewport,
): { dx: number; dy: number } => ({
  dx: dxPx / v.scale,
  dy: dyPx / v.scale,
});

export const visibleWorldBounds = (
  v: Viewport,
  widthPx: number,
  heightPx: number,
): { minX: number; minY: number; maxX: number; maxY: number } => {
  const tl = screenToWorld(0, 0, v);
  const br = screenToWorld(widthPx, heightPx, v);
  return { minX: tl.x, minY: tl.y, maxX: br.x, maxY: br.y };
};
