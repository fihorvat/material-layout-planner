import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptyProject, defaultDrawingStyle, defaultSurfaceStyle } from '@/types';
import {
  useHistoryStore,
  useProjectStore,
  useSelectedVertexStore,
  useSelectionStore,
} from '@/state';
import { deleteSelectedVertex } from '../deleteSelectedVertex';

describe('deleteSelectedVertex', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
    useSelectionStore.getState().resetForTests();
    useSelectedVertexStore.getState().resetForTests();
  });

  it('turns a rectangle into a triangle polygon when deleting a corner', () => {
    const project = createEmptyProject('vertex-delete');
    project.drawingEntities = [
      {
        id: 'rect-1',
        type: 'rectangle',
        origin: { x: 0, y: 0 },
        widthMm: 400,
        heightMm: 200,
        rotationDeg: 0,
        name: 'Rect',
        showDimensions: true,
        style: defaultDrawingStyle(),
      },
    ];
    useProjectStore.getState().replaceProject(project);
    useSelectionStore.getState().select({ kind: 'rectangle', id: 'rect-1' });
    useSelectedVertexStore.getState().selectVertex({
      kind: 'rectCorner',
      entityId: 'rect-1',
      corner: 1,
    });

    expect(deleteSelectedVertex()).toBe(true);

    const entity = useProjectStore.getState().project.drawingEntities[0];
    expect(entity?.type).toBe('polygon');
    expect(entity?.points).toHaveLength(3);
    expect(useSelectionStore.getState().selected).toEqual([
      { kind: 'polygon', id: entity?.id ?? '' },
    ]);
    expect(useSelectedVertexStore.getState().selectedVertex).toBeNull();
  });

  it('removes a polygon vertex while keeping the polygon selected', () => {
    const project = createEmptyProject('vertex-delete');
    project.drawingEntities = [
      {
        id: 'poly-1',
        type: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
        name: 'Poly',
        showSegmentDimensions: false,
        showArea: true,
        style: defaultDrawingStyle(),
      },
    ];
    useProjectStore.getState().replaceProject(project);
    useSelectionStore.getState().select({ kind: 'polygon', id: 'poly-1' });
    useSelectedVertexStore.getState().selectVertex({
      kind: 'polygonVertex',
      entityId: 'poly-1',
      index: 2,
    });

    expect(deleteSelectedVertex()).toBe(true);

    const entity = useProjectStore.getState().project.drawingEntities[0];
    expect(entity?.type).toBe('polygon');
    expect(entity?.points).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    ]);
    expect(useSelectionStore.getState().selected).toEqual([{ kind: 'polygon', id: 'poly-1' }]);
  });

  it('does not delete a vertex from a triangle', () => {
    const project = createEmptyProject('vertex-delete');
    project.drawingEntities = [
      {
        id: 'poly-1',
        type: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 50, y: 80 },
        ],
        name: 'Tri',
        showSegmentDimensions: false,
        showArea: true,
        style: defaultDrawingStyle(),
      },
    ];
    useProjectStore.getState().replaceProject(project);
    useSelectedVertexStore.getState().selectVertex({
      kind: 'polygonVertex',
      entityId: 'poly-1',
      index: 1,
    });

    expect(deleteSelectedVertex()).toBe(false);
    expect(useProjectStore.getState().project.drawingEntities[0]?.type).toBe('polygon');
    expect(useProjectStore.getState().project.drawingEntities[0]?.points).toHaveLength(3);
  });

  it('removes vertices from surfaces and openings', () => {
    const project = createEmptyProject('vertex-delete');
    project.surfaces = [
      {
        id: 'surface-1',
        name: 'Surface',
        outerBoundary: [
          { x: 0, y: 0 },
          { x: 300, y: 0 },
          { x: 300, y: 200 },
          { x: 0, y: 200 },
        ],
        holes: [
          [
            { x: 50, y: 50 },
            { x: 150, y: 50 },
            { x: 150, y: 150 },
            { x: 50, y: 150 },
          ],
        ],
        holeMeta: [
          {
            id: 'opening-1',
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
        showArea: true,
        style: defaultSurfaceStyle(),
      },
    ];
    useProjectStore.getState().replaceProject(project);

    useSelectedVertexStore.getState().selectVertex({
      kind: 'surfaceVertex',
      surfaceId: 'surface-1',
      index: 3,
    });
    expect(deleteSelectedVertex()).toBe(true);
    expect(useProjectStore.getState().project.surfaces[0]?.outerBoundary).toHaveLength(3);

    useSelectedVertexStore.getState().selectVertex({
      kind: 'openingVertex',
      surfaceId: 'surface-1',
      openingId: 'opening-1',
      index: 0,
    });
    expect(deleteSelectedVertex()).toBe(true);
    expect(useProjectStore.getState().project.surfaces[0]?.holes[0]).toHaveLength(3);
  });
});