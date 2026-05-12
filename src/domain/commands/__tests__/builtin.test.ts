import { beforeEach, describe, expect, it } from 'vitest';
import {
  dispatchCommand,
  undo,
  redo,
  addDrawingEntityCommand,
  updateDrawingEntityCommand,
  deleteDrawingEntityCommand,
  changeProjectSettingsCommand,
  replaceProjectCommand,
} from '@/domain/commands';
import { useProjectStore, useHistoryStore } from '@/state';
import { defaultDrawingStyle, createEmptyProject } from '@/types';
import type { LineEntity } from '@/types';

const makeLine = (id: string, name?: string): LineEntity => ({
  id,
  type: 'line',
  start: { x: 0, y: 0 },
  end: { x: 100, y: 0 },
  name,
  showDimension: false,
  style: defaultDrawingStyle(),
});

describe('builtin commands', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });

  it('addDrawingEntity → undo deletes → redo restores', () => {
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L1') }));
    expect(useProjectStore.getState().project.drawingEntities[0]?.id).toBe('L1');
    undo();
    expect(useProjectStore.getState().project.drawingEntities).toHaveLength(0);
    redo();
    expect(useProjectStore.getState().project.drawingEntities[0]?.id).toBe('L1');
  });

  it('updateDrawingEntity patches name and inverse restores it', () => {
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L1', 'orig') }));
    dispatchCommand(updateDrawingEntityCommand({ id: 'L1', patch: { name: 'next' } }));
    const found = useProjectStore.getState().project.drawingEntities[0] as LineEntity | undefined;
    expect(found?.name).toBe('next');
    undo();
    const after = useProjectStore.getState().project.drawingEntities[0] as LineEntity | undefined;
    expect(after?.name).toBe('orig');
  });

  it('deleteDrawingEntity reinsert at original index', () => {
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L1') }));
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L2') }));
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L3') }));
    dispatchCommand(deleteDrawingEntityCommand({ id: 'L2' }));
    expect(useProjectStore.getState().project.drawingEntities.map((e) => e.id)).toEqual(['L1', 'L3']);
    undo();
    expect(useProjectStore.getState().project.drawingEntities.map((e) => e.id)).toEqual(['L1', 'L2', 'L3']);
  });

  it('changeProjectSettings updates and inverse restores', () => {
    const before = useProjectStore.getState().project.settings.gridSizeMm;
    dispatchCommand(changeProjectSettingsCommand({ patch: { gridSizeMm: 25 } }));
    expect(useProjectStore.getState().project.settings.gridSizeMm).toBe(25);
    undo();
    expect(useProjectStore.getState().project.settings.gridSizeMm).toBe(before);
  });

  it('replaceProject swap with full inverse', () => {
    const other = createEmptyProject('Other', { id: 'p2', now: '2026-01-01T00:00:00Z' });
    dispatchCommand(replaceProjectCommand({ next: other }));
    expect(useProjectStore.getState().project.id).toBe('p2');
    undo();
    expect(useProjectStore.getState().project.id).not.toBe('p2');
  });
});
