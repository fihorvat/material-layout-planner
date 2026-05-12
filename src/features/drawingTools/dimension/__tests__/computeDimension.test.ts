import { describe, expect, it } from 'vitest';
import { computeDimension } from '../computeDimension';
import { createEmptyProject, defaultDimensionStyle, defaultDrawingStyle, defaultSurfaceStyle } from '@/types';
import type { Project, DimensionEntity } from '@/types';

const seed = (mut: (p: Project) => void): Project => {
  const p = createEmptyProject('T');
  mut(p);
  return p;
};

const makeDim = (over: Partial<DimensionEntity>): DimensionEntity => ({
  id: 'D1',
  type: 'dimension',
  dimensionType: 'horizontal',
  references: [],
  offsetMm: 0,
  style: defaultDimensionStyle(),
  ...over,
});

describe('computeDimension', () => {
  it('horizontal returns x-distance', () => {
    const p = seed((proj) => {
      proj.drawingEntities.push({
        id: 'L1',
        type: 'line',
        start: { x: 0, y: 5 },
        end: { x: 100, y: 5 },
        showDimension: false,
        style: defaultDrawingStyle(),
      });
    });
    const dim = makeDim({
      dimensionType: 'horizontal',
      references: [
        { kind: 'line', id: 'L1', pointIndex: 0 },
        { kind: 'line', id: 'L1', pointIndex: 1 },
      ],
    });
    const r = computeDimension(dim, p);
    expect(r?.kind).toBe('linear');
    if (r?.kind === 'linear') {
      expect(r.valueText).toContain('100');
    }
  });

  it('vertical returns y-distance', () => {
    const p = seed((proj) => {
      proj.drawingEntities.push({
        id: 'L1',
        type: 'line',
        start: { x: 0, y: 0 },
        end: { x: 0, y: 200 },
        showDimension: false,
        style: defaultDrawingStyle(),
      });
    });
    const dim = makeDim({
      dimensionType: 'vertical',
      references: [
        { kind: 'line', id: 'L1', pointIndex: 0 },
        { kind: 'line', id: 'L1', pointIndex: 1 },
      ],
    });
    const r = computeDimension(dim, p);
    if (r?.kind !== 'linear') throw new Error('expected linear');
    expect(r.valueText).toContain('200');
  });

  it('aligned uses Euclidean distance', () => {
    const p = seed((proj) => {
      proj.drawingEntities.push({
        id: 'L1',
        type: 'line',
        start: { x: 0, y: 0 },
        end: { x: 3, y: 4 },
        showDimension: false,
        style: defaultDrawingStyle(),
      });
    });
    const dim = makeDim({
      dimensionType: 'aligned',
      references: [
        { kind: 'line', id: 'L1', pointIndex: 0 },
        { kind: 'line', id: 'L1', pointIndex: 1 },
      ],
    });
    const r = computeDimension(dim, p);
    if (r?.kind !== 'linear') throw new Error('expected linear');
    expect(r.valueText).toContain('5');
  });

  it('area returns m^2 of surface', () => {
    const p = seed((proj) => {
      proj.surfaces.push({
        id: 'S1',
        name: 'S',
        outerBoundary: [
          { x: 0, y: 0 },
          { x: 1000, y: 0 },
          { x: 1000, y: 1000 },
          { x: 0, y: 1000 },
        ],
        holes: [],
        materialId: null,
        placementPatternId: null,
        edgeRules: [],
        connections: [],
        showName: false,
        showDimensions: false,
        showArea: true,
        style: defaultSurfaceStyle(),
      });
    });
    const dim = makeDim({
      dimensionType: 'area',
      references: [{ kind: 'entity', id: 'S1' }],
    });
    const r = computeDimension(dim, p);
    if (r?.kind !== 'area') throw new Error('expected area');
    expect(r.valueText).toContain('1.000');
  });

  it('broken reference returns null', () => {
    const p = createEmptyProject('T');
    const dim = makeDim({
      dimensionType: 'horizontal',
      references: [
        { kind: 'line', id: 'missing', pointIndex: 0 },
        { kind: 'line', id: 'missing', pointIndex: 1 },
      ],
    });
    expect(computeDimension(dim, p)).toBeNull();
  });
});
