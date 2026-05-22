import { describe, expect, it } from 'vitest';
import {
  constrainSurfacePatternOffset,
  computeEffectivePatternOrigin,
  getSurfacePatternOffset,
  getSurfacePatternOffsetAxes,
  snapOffset,
} from '../manualOffset';
import { createPlacementPattern } from '../placementPattern';
import { createMaterial } from '@/domain/materials/material';
import { createSurface } from '@/domain/surfaces/createSurface';

const square = createSurface({
  name: 'S',
  outerBoundary: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ],
});

describe('manualOffset', () => {
  it('surfaceCenter origin equals centroid', () => {
    const p = createPlacementPattern({ name: 'P', originMode: 'surfaceCenter' });
    const o = computeEffectivePatternOrigin(p, square);
    expect(o.x).toBeCloseTo(50);
    expect(o.y).toBeCloseTo(50);
  });

  it('topLeft origin equals AABB top-left', () => {
    const p = createPlacementPattern({ name: 'P', originMode: 'topLeft' });
    expect(computeEffectivePatternOrigin(p, square)).toEqual({ x: 0, y: 0 });
  });

  it('snapOffset 5mm rounds correctly', () => {
    const p = createPlacementPattern({ name: 'P' });
    const r = snapOffset({ x: 12, y: -7 }, '5mm', p, null);
    expect(r).toEqual({ x: 10, y: -5 });
  });

  it('snapOffset unitStep uses unit+joint', () => {
    const p = createPlacementPattern({ name: 'P', jointMm: 3 });
    const m = createMaterial({ name: 'M', unitWidthMm: 600, unitHeightMm: 300 });
    const r = snapOffset({ x: 700, y: 320 }, 'unitStep', p, m);
    expect(r.x).toBe(603);
    expect(r.y).toBe(303);
  });

  it('limits per-surface offsets to the horizontal axis for horizontal patterns', () => {
    const p = createPlacementPattern({ name: 'P', orientation: 'horizontal', type: 'stacked' });
    expect(getSurfacePatternOffsetAxes(p)).toEqual({ allowX: true, allowY: false });
    expect(getSurfacePatternOffset({ patternOffsetXmm: 12, patternOffsetYmm: 9 }, p)).toEqual({
      x: 12,
      y: 0,
    });
    expect(constrainSurfacePatternOffset({ x: 13, y: 17 }, p)).toEqual({ x: 13, y: 0 });
  });

  it('limits per-surface offsets to the vertical axis for vertical patterns', () => {
    const p = createPlacementPattern({
      name: 'P',
      orientation: 'vertical',
      type: 'verticalStacked',
    });
    expect(getSurfacePatternOffsetAxes(p)).toEqual({ allowX: false, allowY: true });
    expect(getSurfacePatternOffset({ patternOffsetXmm: 12, patternOffsetYmm: 9 }, p)).toEqual({
      x: 0,
      y: 9,
    });
    expect(constrainSurfacePatternOffset({ x: 13, y: 17 }, p)).toEqual({ x: 0, y: 17 });
  });
});
