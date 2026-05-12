import { describe, expect, it } from 'vitest';
import { computeAnchorPosition } from '../computeAnchorPosition';
import { createEmptyProject, defaultSurfaceStyle, defaultTextStyle } from '@/types';
import type { Project, LabelEntity } from '@/types';

const makeProject = (mut: (p: Project) => void): Project => {
  const p = createEmptyProject('T');
  mut(p);
  return p;
};

const makeLabel = (over: Partial<LabelEntity>): LabelEntity => ({
  id: 'L1',
  text: 'X',
  anchorType: 'free',
  position: { x: 0, y: 0 },
  rotationDeg: 0,
  style: defaultTextStyle(),
  ...over,
});

describe('computeAnchorPosition', () => {
  it('free returns position as-is', () => {
    const p = createEmptyProject('T');
    const pos = computeAnchorPosition(makeLabel({ position: { x: 10, y: 20 } }), p);
    expect(pos).toEqual({ x: 10, y: 20 });
  });

  it('surface returns centroid + offset', () => {
    const p = makeProject((proj) => {
      proj.surfaces.push({
        id: 'S1',
        name: 'S',
        outerBoundary: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
        holes: [],
        materialId: null,
        placementPatternId: null,
        edgeRules: [],
        connections: [],
        showName: false,
        showDimensions: false,
        showArea: false,
        style: defaultSurfaceStyle(),
      });
    });
    const r = computeAnchorPosition(
      makeLabel({ anchorType: 'surface', anchorId: 'S1', position: { x: 5, y: -5 } }),
      p,
    );
    expect(r).not.toBeNull();
    expect(r!.x).toBeCloseTo(55);
    expect(r!.y).toBeCloseTo(45);
  });

  it('missing anchor returns null', () => {
    const p = createEmptyProject('T');
    const r = computeAnchorPosition(
      makeLabel({ anchorType: 'surface', anchorId: 'missing' }),
      p,
    );
    expect(r).toBeNull();
  });
});
