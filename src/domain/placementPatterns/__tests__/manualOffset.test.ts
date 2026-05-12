import { describe, expect, it } from 'vitest';
import { computeEffectivePatternOrigin, snapOffset } from '../manualOffset';
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
});
