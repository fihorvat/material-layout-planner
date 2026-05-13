import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSurfaceTool } from '../SurfaceTool';
import { useProjectStore, useEditorStore, useHistoryStore } from '@/state';

const makeStageRef = (pos: { x: number; y: number } | null) => ({
  current: {
    getPointerPosition: () => pos,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
});

describe('useSurfaceTool', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useEditorStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });

  it('Escape resets surface drawing state', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useSurfaceTool(stageRef));
    act(() => result.current.onStagePointerDown({ evt: { button: 0 } as MouseEvent }));
    stageRef.current.getPointerPosition = () => ({ x: 100, y: 0 });
    act(() => result.current.onStagePointerDown({ evt: { button: 0 } as MouseEvent }));
    stageRef.current.getPointerPosition = () => ({ x: 100, y: 100 });
    act(() => result.current.onStagePointerDown({ evt: { button: 0 } as MouseEvent }));
    // overlays should be rendered while drawing
    expect(result.current.overlays).not.toBeNull();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(result.current.overlays).toBeNull();
    expect(useProjectStore.getState().project.surfaces).toHaveLength(0);
  });

  it('closing the surface by clicking the first vertex creates a Surface, not a polygon', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useSurfaceTool(stageRef));
    // three corners of a triangle
    act(() => result.current.onStagePointerDown({ evt: { button: 0 } as MouseEvent }));
    stageRef.current.getPointerPosition = () => ({ x: 100, y: 0 });
    act(() => result.current.onStagePointerDown({ evt: { button: 0 } as MouseEvent }));
    stageRef.current.getPointerPosition = () => ({ x: 100, y: 100 });
    act(() => result.current.onStagePointerDown({ evt: { button: 0 } as MouseEvent }));
    // click back on the first point to close
    stageRef.current.getPointerPosition = () => ({ x: 0, y: 0 });
    act(() => result.current.onStagePointerDown({ evt: { button: 0 } as MouseEvent }));

    const project = useProjectStore.getState().project;
    expect(project.surfaces).toHaveLength(1);
    expect(project.drawingEntities).toHaveLength(0);
  });

  it('pressing Enter closes the surface and creates a Surface, not a polygon', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useSurfaceTool(stageRef));
    act(() => result.current.onStagePointerDown({ evt: { button: 0 } as MouseEvent }));
    stageRef.current.getPointerPosition = () => ({ x: 100, y: 0 });
    act(() => result.current.onStagePointerDown({ evt: { button: 0 } as MouseEvent }));
    stageRef.current.getPointerPosition = () => ({ x: 100, y: 100 });
    act(() => result.current.onStagePointerDown({ evt: { button: 0 } as MouseEvent }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    const project = useProjectStore.getState().project;
    expect(project.surfaces).toHaveLength(1);
    expect(project.drawingEntities).toHaveLength(0);
  });
});
