import type { Point2D } from '@/types';
import { distance } from '@/domain/geometry';

export type SnapMode =
  | 'grid'
  | 'point'
  | 'endpoint'
  | 'midpoint'
  | 'axis'
  | 'angle'
  | 'intersection';

export type SnapSegment = { a: Point2D; b: Point2D };

export type SnapInput = {
  worldPoint: Point2D;
  tolerancePx: number;
  scale: number;
  gridSizeMm: number;
  snapEnabled: boolean;
  snapModes: SnapMode[];
  candidatePoints?: Point2D[];
  candidateSegments?: SnapSegment[];
};

export type SnapResult = {
  point: Point2D;
  source: SnapMode | 'none';
  marker?: { kind: SnapMode; point: Point2D };
};

const midpoint = (a: Point2D, b: Point2D): Point2D => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const snapToGrid = (p: Point2D, gridSizeMm: number): Point2D => ({
  x: Math.round(p.x / gridSizeMm) * gridSizeMm,
  y: Math.round(p.y / gridSizeMm) * gridSizeMm,
});

export const snap = (input: SnapInput): SnapResult => {
  if (!input.snapEnabled) {
    return { point: input.worldPoint, source: 'none' };
  }
  const tolWorld = input.tolerancePx / Math.max(input.scale, 1e-9);

  const modes = new Set(input.snapModes);

  if (modes.has('endpoint') && input.candidateSegments) {
    for (const seg of input.candidateSegments) {
      for (const corner of [seg.a, seg.b]) {
        if (distance(input.worldPoint, corner) <= tolWorld) {
          return { point: corner, source: 'endpoint', marker: { kind: 'endpoint', point: corner } };
        }
      }
    }
  }
  if (modes.has('midpoint') && input.candidateSegments) {
    for (const seg of input.candidateSegments) {
      const m = midpoint(seg.a, seg.b);
      if (distance(input.worldPoint, m) <= tolWorld) {
        return { point: m, source: 'midpoint', marker: { kind: 'midpoint', point: m } };
      }
    }
  }
  if (modes.has('point') && input.candidatePoints) {
    for (const p of input.candidatePoints) {
      if (distance(input.worldPoint, p) <= tolWorld) {
        return { point: p, source: 'point', marker: { kind: 'point', point: p } };
      }
    }
  }
  if (modes.has('grid') && input.gridSizeMm > 0) {
    const g = snapToGrid(input.worldPoint, input.gridSizeMm);
    if (distance(input.worldPoint, g) <= Math.max(tolWorld, input.gridSizeMm / 2)) {
      return { point: g, source: 'grid', marker: { kind: 'grid', point: g } };
    }
  }
  return { point: input.worldPoint, source: 'none' };
};
