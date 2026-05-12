import { describe, expect, it } from 'vitest';
import { snap } from '../snap';

describe('snap', () => {
  it('bypasses when snapEnabled is false', () => {
    const r = snap({
      worldPoint: { x: 12.3, y: 4.5 },
      tolerancePx: 8,
      scale: 1,
      gridSizeMm: 10,
      snapEnabled: false,
      snapModes: ['grid'],
    });
    expect(r.source).toBe('none');
    expect(r.point).toEqual({ x: 12.3, y: 4.5 });
  });

  it('snaps to grid when nearby', () => {
    const r = snap({
      worldPoint: { x: 11, y: 9 },
      tolerancePx: 100,
      scale: 1,
      gridSizeMm: 10,
      snapEnabled: true,
      snapModes: ['grid'],
    });
    expect(r.source).toBe('grid');
    expect(r.point).toEqual({ x: 10, y: 10 });
  });

  it('endpoint snap takes priority over grid', () => {
    const r = snap({
      worldPoint: { x: 11, y: 11 },
      tolerancePx: 100,
      scale: 1,
      gridSizeMm: 10,
      snapEnabled: true,
      snapModes: ['endpoint', 'grid'],
      candidateSegments: [{ a: { x: 12, y: 12 }, b: { x: 20, y: 20 } }],
    });
    expect(r.source).toBe('endpoint');
    expect(r.point).toEqual({ x: 12, y: 12 });
  });

  it('midpoint snap', () => {
    const r = snap({
      worldPoint: { x: 15, y: 0.2 },
      tolerancePx: 100,
      scale: 1,
      gridSizeMm: 100,
      snapEnabled: true,
      snapModes: ['midpoint'],
      candidateSegments: [{ a: { x: 10, y: 0 }, b: { x: 20, y: 0 } }],
    });
    expect(r.source).toBe('midpoint');
    expect(r.point).toEqual({ x: 15, y: 0 });
  });
});
