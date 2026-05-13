import { beforeEach, describe, expect, it } from 'vitest';
import {
  dispatchCommand,
  undo,
  redo,
  createSurfaceCommand,
  addOpeningCommand,
  removeOpeningCommand,
  updateOpeningCommand,
  findOpeningSurface,
} from '@/domain/commands';
import { createSurface } from '@/domain/surfaces/createSurface';
import { useProjectStore, useHistoryStore } from '@/state';

const square = (size = 1000) => [
  { x: 0, y: 0 },
  { x: size, y: 0 },
  { x: size, y: size },
  { x: 0, y: size },
];

const inset = [
  { x: 200, y: 200 },
  { x: 800, y: 200 },
  { x: 800, y: 800 },
  { x: 200, y: 800 },
];

describe('opening commands', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });

  it('addOpening adds a hole + holeMeta in sync; undo removes both; redo re-adds', () => {
    const s = createSurface({ name: 'S1', outerBoundary: square(1000) });
    dispatchCommand(createSurfaceCommand({ surface: s }));
    dispatchCommand(addOpeningCommand({ surfaceId: s.id, hole: inset }));
    const after = useProjectStore.getState().project.surfaces[0]!;
    expect(after.holes).toHaveLength(1);
    expect(after.holeMeta).toHaveLength(1);
    expect(after.holeMeta[0]!.id.startsWith('opn_')).toBe(true);

    const openingId = after.holeMeta[0]!.id;
    undo();
    const undone = useProjectStore.getState().project.surfaces[0]!;
    expect(undone.holes).toHaveLength(0);
    expect(undone.holeMeta).toHaveLength(0);
    redo();
    const redone = useProjectStore.getState().project.surfaces[0]!;
    expect(redone.holes).toHaveLength(1);
    expect(redone.holeMeta[0]!.id).toBe(openingId);
  });

  it('removeOpening removes opening by id; undo restores at original index', () => {
    const s = createSurface({ name: 'S1', outerBoundary: square(1000) });
    dispatchCommand(createSurfaceCommand({ surface: s }));
    dispatchCommand(addOpeningCommand({ surfaceId: s.id, hole: inset }));
    dispatchCommand(
      addOpeningCommand({
        surfaceId: s.id,
        hole: [
          { x: 50, y: 50 },
          { x: 100, y: 50 },
          { x: 100, y: 100 },
          { x: 50, y: 100 },
        ],
      }),
    );
    const before = useProjectStore.getState().project.surfaces[0]!;
    expect(before.holes).toHaveLength(2);
    const firstId = before.holeMeta[0]!.id;
    dispatchCommand(removeOpeningCommand({ surfaceId: s.id, openingId: firstId }));
    const after = useProjectStore.getState().project.surfaces[0]!;
    expect(after.holes).toHaveLength(1);
    expect(after.holeMeta.find((m) => m.id === firstId)).toBeUndefined();
    undo();
    const undone = useProjectStore.getState().project.surfaces[0]!;
    expect(undone.holes).toHaveLength(2);
    expect(undone.holeMeta[0]!.id).toBe(firstId);
  });

  it('updateOpening patches both hole and meta; undo restores prior values', () => {
    const s = createSurface({ name: 'S1', outerBoundary: square(1000) });
    dispatchCommand(createSurfaceCommand({ surface: s }));
    dispatchCommand(addOpeningCommand({ surfaceId: s.id, hole: inset }));
    const openingId = useProjectStore.getState().project.surfaces[0]!.holeMeta[0]!.id;
    const newHole = [
      { x: 300, y: 300 },
      { x: 700, y: 300 },
      { x: 700, y: 700 },
      { x: 300, y: 700 },
    ];
    dispatchCommand(
      updateOpeningCommand({
        surfaceId: s.id,
        openingId,
        patch: { hole: newHole, meta: { name: 'window' } },
      }),
    );
    const after = useProjectStore.getState().project.surfaces[0]!;
    expect(after.holes[0]).toEqual(newHole);
    expect(after.holeMeta[0]!.name).toBe('window');
    undo();
    const undone = useProjectStore.getState().project.surfaces[0]!;
    expect(undone.holes[0]).toEqual(inset);
    expect(undone.holeMeta[0]!.name).toBeUndefined();
  });

  it('findOpeningSurface locates the parent surface by opening id', () => {
    const s = createSurface({ name: 'S1', outerBoundary: square(1000) });
    dispatchCommand(createSurfaceCommand({ surface: s }));
    dispatchCommand(addOpeningCommand({ surfaceId: s.id, hole: inset }));
    const openingId = useProjectStore.getState().project.surfaces[0]!.holeMeta[0]!.id;
    const project = useProjectStore.getState().project;
    const found = findOpeningSurface(project, openingId);
    expect(found?.surface.id).toBe(s.id);
    expect(found?.index).toBe(0);
  });
});
