import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePolygonTool } from '../../PolygonTool';
import { useProjectStore, useEditorStore, useHistoryStore } from '@/state';

const makeStageRef = (pos: { x: number; y: number } | null) => ({
  current: {
    getPointerPosition: () => pos,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
});

describe('usePolygonTool Escape', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useEditorStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });

  it('Escape clears in-progress polygon drawing', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => usePolygonTool(stageRef));
    act(() => result.current.onStagePointerDown({ evt: { button: 0, shiftKey: false, altKey: false, ctrlKey: false } as MouseEvent }));
    stageRef.current.getPointerPosition = () => ({ x: 100, y: 0 });
    act(() => result.current.onStagePointerDown({ evt: { button: 0, shiftKey: false, altKey: false, ctrlKey: false } as MouseEvent }));
    stageRef.current.getPointerPosition = () => ({ x: 100, y: 100 });
    act(() => result.current.onStagePointerDown({ evt: { button: 0, shiftKey: false, altKey: false, ctrlKey: false } as MouseEvent }));

    expect(result.current.overlays).not.toBeNull();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(result.current.overlays).toBeNull();
    expect(useProjectStore.getState().project.drawingEntities).toHaveLength(0);
  });
});
