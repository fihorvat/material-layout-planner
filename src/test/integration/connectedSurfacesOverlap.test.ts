import { describe, expect, it, beforeEach } from 'vitest';
import { useProjectStore, useHistoryStore } from '@/state';
import {
  dispatchCommand,
  createSurfaceCommand,
  addEdgeRuleCommand,
  addConnectionCommand,
} from '@/domain/commands';
import { createSurface } from '@/domain/surfaces/createSurface';
import { computeWorkingPolygon } from '@/domain/materialLayout/computeWorkingPolygon';
import { newEdgeRuleId } from '@/domain/ids';
import { polygonArea } from '@/domain/geometry';
import { makeConnection } from '@/domain/surfaces/connectSurfaces';

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
    dispatchCommand(
      addEdgeRuleCommand({
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
      }),
    );
    const project = useProjectStore.getState().project;
    const updatedSurface = project.surfaces[0]!;
    const r = computeWorkingPolygon({
      surface: updatedSurface,
      connections: project.surfaceConnections,
    });
    expect(Math.abs(polygonArea(r.physical.outer))).toBeGreaterThan(
      Math.abs(polygonArea(r.visible.outer)),
    );
  });

  it('limits connected overlap to the selected donor side', () => {
    const surfaceA = createSurface({
      name: 'A',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    });
    const surfaceB = createSurface({
      name: 'B',
      outerBoundary: [
        { x: 100, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 100 },
        { x: 100, y: 100 },
      ],
    });
    dispatchCommand(createSurfaceCommand({ surface: surfaceA }));
    dispatchCommand(createSurfaceCommand({ surface: surfaceB }));
    dispatchCommand(
      addConnectionCommand({
        connection: makeConnection({
          surfaceAId: surfaceA.id,
          edgeAIndex: 1,
          surfaceBId: surfaceB.id,
          edgeBIndex: 3,
          connectionType: 'buttJoint',
          allowPhysicalOverlap: true,
          physicalOverlapSide: 'surfaceA',
          defaultOverlapMm: 10,
        }),
      }),
    );

    const project = useProjectStore.getState().project;
    const updatedA = project.surfaces.find((entry) => entry.id === surfaceA.id)!;
    const updatedB = project.surfaces.find((entry) => entry.id === surfaceB.id)!;
    const resultA = computeWorkingPolygon({
      surface: updatedA,
      connections: project.surfaceConnections,
    });
    const resultB = computeWorkingPolygon({
      surface: updatedB,
      connections: project.surfaceConnections,
    });

    expect(Math.abs(polygonArea(resultA.physical.outer))).toBeGreaterThan(
      Math.abs(polygonArea(resultA.visible.outer)),
    );
    expect(Math.abs(polygonArea(resultB.physical.outer))).toBeCloseTo(
      Math.abs(polygonArea(resultB.visible.outer)),
      6,
    );
  });
});
