import type { Point2D, PlacementPattern } from '@/types';

export type UnitRectangle = {
  index: { row: number; col: number };
  corners: Point2D[];
  centerWorld: Point2D;
  widthMm: number;
  heightMm: number;
  rotationDeg: number;
};

export type LayoutCandidate = {
  pattern: PlacementPattern;
  grid: UnitRectangle[];
  meta: { variation: string };
};
