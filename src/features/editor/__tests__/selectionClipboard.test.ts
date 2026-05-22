import { beforeEach, describe, expect, it } from 'vitest';
import {
  createEmptyProject,
  defaultDimensionStyle,
  defaultDrawingStyle,
  defaultSurfaceStyle,
  defaultTextStyle,
  type LabelEntity,
  type Project,
  type Surface,
} from '@/types';
import { encodeEdgeId } from '@/domain/surfaces/connectSurfaces';
import { useHistoryStore, useProjectStore, useSelectionStore } from '@/state';
import {
  buildClipboardSnapshot,
  pasteClipboardIntoProject,
  translateSelectionInProject,
  useSelectionClipboardStore,
} from '../selectionClipboard';

const makeSurface = (): Surface => ({
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
      name: 'Window',
      showDimensions: false,
      style: defaultDrawingStyle(),
      labelOffset: { x: 2, y: 3 },
    },
  ],
  materialId: null,
  placementPatternId: null,
  edgeRules: [],
  connections: [],
  showName: true,
  showDimensions: false,
  showArea: false,
  style: defaultSurfaceStyle(),
});

const makeProject = (): Project => {
  const project = createEmptyProject('Clipboard', {
    id: 'prj_clipboard',
    now: '2026-05-22T00:00:00.000Z',
  });
  project.drawingEntities = [
    {
      id: 'dwg_1',
      type: 'line',
      start: { x: 0, y: 0 },
      end: { x: 20, y: 0 },
      showDimension: false,
      style: defaultDrawingStyle(),
    },
  ];
  project.surfaces = [makeSurface()];
  project.dimensions = [
    {
      id: 'dim_1',
      type: 'dimension',
      dimensionType: 'aligned',
      references: [{ kind: 'edge', id: encodeEdgeId('srf_1', 0) }],
      offsetMm: 12,
      style: defaultDimensionStyle(),
    },
  ];
  project.labels = [
    {
      id: 'lbl_1',
      text: 'Surface note',
      anchorType: 'surface',
      anchorId: 'srf_1',
      position: { x: 5, y: 6 },
      rotationDeg: 0,
      style: defaultTextStyle(),
    } satisfies LabelEntity,
    {
      id: 'lbl_2',
      text: 'Loose note',
      anchorType: 'free',
      position: { x: 10, y: 12 },
      rotationDeg: 0,
      style: defaultTextStyle(),
    } satisfies LabelEntity,
  ];
  return project;
};

describe('selectionClipboard', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useSelectionStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
    useSelectionClipboardStore.getState().resetForTests();
  });

  it('pastes cloned selection with remapped ids and reselection', () => {
    const project = makeProject();
    const selection = [
      { kind: 'line' as const, id: 'dwg_1' },
      { kind: 'surface' as const, id: 'srf_1' },
      { kind: 'opening' as const, id: 'opn_1' },
      { kind: 'dimension' as const, id: 'dim_1' },
      { kind: 'label' as const, id: 'lbl_1' },
    ];

    const snapshot = buildClipboardSnapshot(project, selection);
    expect(snapshot).not.toBeNull();

    const result = pasteClipboardIntoProject(project, snapshot!, 10);
    expect(result.nextProject.drawingEntities).toHaveLength(2);
    expect(result.nextProject.surfaces).toHaveLength(2);
    expect(result.nextProject.dimensions).toHaveLength(2);
    expect(result.nextProject.labels).toHaveLength(3);
    expect(result.selection).toHaveLength(5);

    const pastedSurface = result.nextProject.surfaces[1]!;
    expect(pastedSurface.id).not.toBe('srf_1');
    expect(pastedSurface.outerBoundary[0]).toEqual({ x: 10, y: 10 });
    expect(pastedSurface.holeMeta[0]?.id).not.toBe('opn_1');

    const pastedDimension = result.nextProject.dimensions[1]!;
    expect(pastedDimension.references[0]?.id).toBe(encodeEdgeId(pastedSurface.id, 0));

    const pastedLabel = result.nextProject.labels[2]!;
    expect(pastedLabel.anchorId).toBe(pastedSurface.id);
    expect(pastedLabel.position).toEqual({ x: 5, y: 6 });

    expect(result.selection).toContainEqual({ kind: 'surface', id: pastedSurface.id });
    expect(result.selection).toContainEqual({ kind: 'opening', id: pastedSurface.holeMeta[0]!.id });
  });

  it('translates movable selection without double-moving anchored labels', () => {
    const project = makeProject();
    const moved = translateSelectionInProject(
      project,
      [
        { kind: 'surface', id: 'srf_1' },
        { kind: 'opening', id: 'opn_1' },
        { kind: 'label', id: 'lbl_1' },
        { kind: 'label', id: 'lbl_2' },
      ],
      7,
      9,
    );

    expect(moved.surfaces[0]?.outerBoundary[0]).toEqual({ x: 7, y: 9 });
    expect(moved.surfaces[0]?.holes[0]?.[0]).toEqual({ x: 27, y: 29 });
    expect(moved.labels[0]?.position).toEqual({ x: 5, y: 6 });
    expect(moved.labels[1]?.position).toEqual({ x: 17, y: 21 });
  });
});
