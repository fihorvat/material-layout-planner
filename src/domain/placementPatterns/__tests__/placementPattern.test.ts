import { describe, expect, it, beforeEach } from 'vitest';
import { createPlacementPattern, rowOffsetForType, effectiveRowOffsetMm } from '../placementPattern';
import { createMaterial } from '@/domain/materials/material';
import { useProjectStore, useHistoryStore } from '@/state';
import {
  dispatchCommand,
  addPlacementPatternCommand,
  updatePlacementPatternCommand,
  deletePlacementPatternCommand,
  assignPlacementPatternCommand,
} from '@/domain/commands';

describe('placementPattern domain', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });

  it('createPlacementPattern defaults', () => {
    const p = createPlacementPattern({ name: 'P' });
    expect(p.type).toBe('stacked');
    expect(p.jointMm).toBe(3);
    expect(p.optimizationPriority.manualOffsetLocked).toBe(false);
  });

  it('rowOffsetForType returns half and third', () => {
    expect(rowOffsetForType('runningBondHalf', 600)).toBe(300);
    expect(rowOffsetForType('runningBondThird', 600)).toBeCloseTo(200);
    expect(rowOffsetForType('stacked', 600)).toBe(0);
  });

  it('effectiveRowOffsetMm uses percent when no type and no mm', () => {
    const m = createMaterial({ name: 'M', unitWidthMm: 600, unitHeightMm: 300 });
    const p = createPlacementPattern({ name: 'P', type: 'customOffset', rowOffsetPercent: 25 });
    expect(effectiveRowOffsetMm(p, m)).toBeCloseTo(150);
  });

  it('addPlacementPattern roundtrip', () => {
    const p = createPlacementPattern({ name: 'P' });
    dispatchCommand(addPlacementPatternCommand({ pattern: p }));
    expect(useProjectStore.getState().project.placementPatterns).toHaveLength(1);
    dispatchCommand(updatePlacementPatternCommand({ id: p.id, patch: { jointMm: 5 } }));
    expect(useProjectStore.getState().project.placementPatterns[0]?.jointMm).toBe(5);
    dispatchCommand(deletePlacementPatternCommand({ id: p.id }));
    expect(useProjectStore.getState().project.placementPatterns).toHaveLength(0);
  });

  it('assignPlacementPattern updates surface', () => {
    const p = createPlacementPattern({ name: 'P' });
    dispatchCommand(addPlacementPatternCommand({ pattern: p }));
    useProjectStore.setState((st) => ({
      ...st,
      project: {
        ...st.project,
        surfaces: [{
          id: 'S1',
          name: 'S',
          outerBoundary: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
          holes: [],
          materialId: null,
          placementPatternId: null,
          edgeRules: [],
          connections: [],
          showName: false,
          showDimensions: false,
          showArea: false,
          style: { strokeColor: '#000', strokeWidthPx: 1, fillColor: '#fff', fillOpacity: 1, textColor: '#000' },
        }],
      },
    }));
    dispatchCommand(assignPlacementPatternCommand({ surfaceId: 'S1', patternId: p.id }));
    expect(useProjectStore.getState().project.surfaces[0]?.placementPatternId).toBe(p.id);
  });
});
