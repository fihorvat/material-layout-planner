import { beforeEach, describe, expect, it } from 'vitest';
import {
  dispatchCommand,
  undo,
  redo,
  canUndo,
  canRedo,
  addDrawingEntityCommand,
} from '@/domain/commands';
import { useProjectStore, useHistoryStore } from '@/state';
import { defaultDrawingStyle } from '@/types';
import type { LineEntity } from '@/types';

const makeLine = (id: string): LineEntity => ({
  id,
  type: 'line',
  start: { x: 0, y: 0 },
  end: { x: 100, y: 0 },
  showDimension: false,
  style: defaultDrawingStyle(),
});

describe('dispatcher', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });

  it('dispatch then undo returns to starting project', () => {
    const start = useProjectStore.getState().project.drawingEntities;
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L1') }));
    expect(useProjectStore.getState().project.drawingEntities).toHaveLength(start.length + 1);
    expect(canUndo()).toBe(true);
    undo();
    expect(useProjectStore.getState().project.drawingEntities).toEqual(start);
    expect(canRedo()).toBe(true);
  });

  it('undo then redo restores after-state', () => {
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L1') }));
    undo();
    redo();
    expect(useProjectStore.getState().project.drawingEntities.map((e) => e.id)).toEqual(['L1']);
  });

  it('two dispatches then two undos', () => {
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L1') }));
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L2') }));
    undo();
    undo();
    expect(useProjectStore.getState().project.drawingEntities).toHaveLength(0);
  });

  it('dispatch after undo clears future', () => {
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L1') }));
    undo();
    expect(canRedo()).toBe(true);
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L2') }));
    expect(canRedo()).toBe(false);
  });

  it('respects maxDepth', () => {
    useHistoryStore.getState().setMaxDepth(2);
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L1') }));
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L2') }));
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L3') }));
    expect(useHistoryStore.getState().past).toHaveLength(2);
  });

  it('marks project dirty and bumps updatedAt', () => {
    const before = useProjectStore.getState().project.updatedAt;
    expect(useProjectStore.getState().isDirty).toBe(false);
    dispatchCommand(addDrawingEntityCommand({ entity: makeLine('L1') }));
    const after = useProjectStore.getState().project.updatedAt;
    expect(useProjectStore.getState().isDirty).toBe(true);
    expect(after >= before).toBe(true);
  });
});
