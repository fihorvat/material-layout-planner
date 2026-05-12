import { describe, expect, it, beforeEach } from 'vitest';
import { useProjectStore, useHistoryStore } from '@/state';
import {
  dispatchCommand,
  createSurfaceCommand,
  addEdgeRuleCommand,
} from '@/domain/commands';
import { createSurface } from '@/domain/surfaces/createSurface';
import { computeWorkingPolygon } from '@/domain/materialLayout/computeWorkingPolygon';
import { newEdgeRuleId } from '@/domain/ids';
import { polygonArea } from '@/domain/geometry';

describe('integration: physical overlap on edge', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });

  it('expands the physical working polygon outward', () => {
    const surface = createSurface({
      name: 'A',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    });
    dispatchCommand(createSurfaceCommand({ surface }));
    dispatchCommand(addEdgeRuleCommand({
      surfaceId: surface.id,
      rule: {
        id: newEdgeRuleId(),
        surfaceId: surface.id,
        edgeIndex: 1,
        ruleType: 'physicalOverlap',
        maxOverlapMm: 10,
        overlapOpacity: 0.25,
        applyThicknessCompensation: false,
      },
    }));
    const project = useProjectStore.getState().project;
    const updatedSurface = project.surfaces[0]!;
    const r = computeWorkingPolygon({ surface: updatedSurface, connections: project.surfaceConnections });
    expect(Math.abs(polygonArea(r.physical.outer))).toBeGreaterThan(Math.abs(polygonArea(r.visible.outer)));
  });
});
