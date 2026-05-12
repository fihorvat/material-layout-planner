import { describe, expect, it } from 'vitest';
import { hitTest } from '../HitTest';
import { createEmptyProject, defaultDrawingStyle, defaultSurfaceStyle } from '@/types';
import type { LayerVisibility, LayerId } from '@/state';
import { LAYER_IDS } from '@/state';
import type { Project } from '@/types';

const layers = (): LayerVisibility => {
  const l = {} as LayerVisibility;
  for (const id of LAYER_IDS as readonly LayerId[]) {
    l[id] = { visible: true, locked: false, opacity01: 1 };
  }
  return l;
};

const project = (mut: (p: Project) => void): Project => {
  const p = createEmptyProject('Test');
  mut(p);
  return p;
};

describe('hitTest', () => {
  it('hits a rectangle interior', () => {
    const p = project((proj) => {
      proj.drawingEntities.push({
        id: 'R1',
        type: 'rectangle',
        origin: { x: 0, y: 0 },
        widthMm: 100,
        heightMm: 50,
        rotationDeg: 0,
        showDimensions: false,
        style: defaultDrawingStyle(),
      });
    });
    const r = hitTest({
      worldPoint: { x: 50, y: 25 },
      tolerancePxAsMm: 5,
      project: p,
      layers: layers(),
    });
    expect(r.topHit?.id).toBe('R1');
  });

  it('hits a line near it within tolerance', () => {
    const p = project((proj) => {
      proj.drawingEntities.push({
        id: 'L1',
        type: 'line',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        showDimension: false,
        style: defaultDrawingStyle(),
      });
    });
    const r = hitTest({
      worldPoint: { x: 50, y: 2 },
      tolerancePxAsMm: 5,
      project: p,
      layers: layers(),
    });
    expect(r.topHit?.id).toBe('L1');
  });

  it('locked layer is ignored', () => {
    const p = project((proj) => {
      proj.drawingEntities.push({
        id: 'L1',
        type: 'line',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        showDimension: false,
        style: defaultDrawingStyle(),
      });
    });
    const lay = layers();
    lay.construction.locked = true;
    const r = hitTest({
      worldPoint: { x: 50, y: 0 },
      tolerancePxAsMm: 5,
      project: p,
      layers: lay,
    });
    expect(r.topHit).toBeNull();
  });

  it('surfaces have higher z than drawing entities', () => {
    const p = project((proj) => {
      proj.drawingEntities.push({
        id: 'R1',
        type: 'rectangle',
        origin: { x: 0, y: 0 },
        widthMm: 100,
        heightMm: 100,
        rotationDeg: 0,
        showDimensions: false,
        style: defaultDrawingStyle(),
      });
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
    const r = hitTest({
      worldPoint: { x: 50, y: 50 },
      tolerancePxAsMm: 5,
      project: p,
      layers: layers(),
    });
    expect(r.topHit?.kind).toBe('surface');
  });
});
