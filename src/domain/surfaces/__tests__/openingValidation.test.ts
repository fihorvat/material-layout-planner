import { describe, expect, it } from 'vitest';
import { validateOpening, findEnclosingSurface } from '../openingValidation';
import { createSurface } from '../createSurface';

describe('validateOpening', () => {
  const surface = createSurface({
    name: 'S',
    outerBoundary: [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 1000 },
      { x: 0, y: 1000 },
    ],
  });

  it('accepts a hole entirely inside the surface', () => {
    const hole = [
      { x: 200, y: 200 },
      { x: 400, y: 200 },
      { x: 400, y: 400 },
      { x: 200, y: 400 },
    ];
    expect(validateOpening(surface, hole).valid).toBe(true);
  });

  it('rejects a hole extending outside the surface', () => {
    const hole = [
      { x: 900, y: 900 },
      { x: 1200, y: 900 },
      { x: 1200, y: 1100 },
      { x: 900, y: 1100 },
    ];
    const v = validateOpening(surface, hole);
    expect(v.valid).toBe(false);
    expect(v.issues.some((i) => i.code === 'openingOutsideSurface')).toBe(true);
  });

  it('rejects overlap with an existing hole', () => {
    const existing = [
      { x: 200, y: 200 },
      { x: 400, y: 200 },
      { x: 400, y: 400 },
      { x: 200, y: 400 },
    ];
    const surfaceWithHole = { ...surface, holes: [existing] };
    const overlap = [
      { x: 350, y: 350 },
      { x: 500, y: 350 },
      { x: 500, y: 500 },
      { x: 350, y: 500 },
    ];
    const v = validateOpening(surfaceWithHole, overlap);
    expect(v.valid).toBe(false);
    expect(v.issues.some((i) => i.code === 'openingOverlap')).toBe(true);
  });
});

describe('findEnclosingSurface', () => {
  it('returns the smallest surface containing the point', () => {
    const big = createSurface({
      name: 'big',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 1000, y: 0 },
        { x: 1000, y: 1000 },
        { x: 0, y: 1000 },
      ],
    });
    const small = createSurface({
      name: 'small',
      outerBoundary: [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 },
      ],
    });
    const found = findEnclosingSurface([big, small], { x: 200, y: 200 });
    expect(found?.id).toBe(small.id);
  });

  it('returns null when no surface contains the point', () => {
    const s = createSurface({
      name: 'S',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    });
    expect(findEnclosingSurface([s], { x: 500, y: 500 })).toBeNull();
  });
});
