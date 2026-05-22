import { describe, expect, it } from 'vitest';
import { createEmptyProject, defaultDrawingStyle, defaultSurfaceStyle, type Project } from '@/types';
import type { Surface } from '@/types';
import { applyCutCandidateToProject } from '../useCutDraw';

const makeProject = (): { project: Project; surface: Surface } => {
  const project = createEmptyProject('Cut test', {
    id: 'prj_cut',
    now: '2026-05-22T00:00:00.000Z',
  });
  const surface: Surface = {
    id: 'srf_1',
    name: 'Wall',
    outerBoundary: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 60 },
      { x: 0, y: 60 },
    ],
    holes: [
      [
        { x: 20, y: 20 },
        { x: 40, y: 20 },
        { x: 40, y: 40 },
        { x: 20, y: 40 },
      ],
    ],
    holeMeta: [
      {
        id: 'opn_1',
        showDimensions: false,
        style: defaultDrawingStyle(),
      },
    ],
    materialId: null,
    placementPatternId: null,
    edgeRules: [],
    connections: [],
    showName: true,
    showDimensions: true,
    showArea: false,
    style: defaultSurfaceStyle(),
  };
  project.surfaces = [surface];
  return { project, surface };
};

describe('applyCutCandidateToProject', () => {
  it('inserts a point on a surface edge', () => {
    const { project } = makeProject();
    const result = applyCutCandidateToProject(project, {
      kind: 'surface',
      surfaceId: 'srf_1',
      edgeIndex: 0,
      point: { x: 50, y: 0 },
      edge: { a: { x: 0, y: 0 }, b: { x: 100, y: 0 } },
      distanceMm: 0,
    });

    expect(result.label).toBe('Add point on surface');
    expect(result.next.surfaces[0]?.outerBoundary).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 60 },
      { x: 0, y: 60 },
    ]);
  });

  it('inserts a point on an opening edge', () => {
    const { project } = makeProject();
    const result = applyCutCandidateToProject(project, {
      kind: 'opening',
      surfaceId: 'srf_1',
      openingId: 'opn_1',
      edgeIndex: 0,
      point: { x: 30, y: 20 },
      edge: { a: { x: 20, y: 20 }, b: { x: 40, y: 20 } },
      distanceMm: 0,
    });

    expect(result.label).toBe('Add point on opening');
    expect(result.next.surfaces[0]?.holes[0]).toEqual([
      { x: 20, y: 20 },
      { x: 30, y: 20 },
      { x: 40, y: 20 },
      { x: 40, y: 40 },
      { x: 20, y: 40 },
    ]);
  });
});