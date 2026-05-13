import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMeterDraw } from '../useMeterDraw';
import { useProjectStore, useEditorStore, useHistoryStore } from '@/state';

const makeStageRef = (pos: { x: number; y: number } | null) => ({
  current: {
    getPointerPosition: () => pos,
    width: () => 800,
    height: () => 600,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
});

describe('useMeterDraw', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useEditorStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
    useEditorStore.getState().setViewport({ offsetXPx: 0, offsetYPx: 0, scale: 1 });
  });

  it('two clicks commit a meter line entity', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useMeterDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    stageRef.current.getPointerPosition = () => ({ x: 200, y: 0 });
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    const entities = useProjectStore.getState().project.drawingEntities;
    expect(entities).toHaveLength(1);
    expect(entities[0]?.type).toBe('line');
  });

  it('committed meter line uses a distinct stroke color (cyan)', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useMeterDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    stageRef.current.getPointerPosition = () => ({ x: 200, y: 0 });
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    const entities = useProjectStore.getState().project.drawingEntities;
    const line = entities[0];
    if (line?.type !== 'line') throw new Error('expected line');
    expect(line.style.strokeColor).toBe('#0ea5e9');
    expect(line.style.strokeWidthPx).toBeGreaterThanOrEqual(1.5);
  });

  it('Shift constrains the second point to the nearest 90° axis', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useMeterDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    // cursor at ~30° from origin
    stageRef.current.getPointerPosition = () => ({ x: 173, y: 100 });
    act(() => result.current.onPointerDown({ shift: true, alt: true, ctrl: false }));
    const entities = useProjectStore.getState().project.drawingEntities;
    expect(entities).toHaveLength(1);
    const line = entities[0];
    if (line?.type !== 'line') throw new Error('expected line');
    expect(Math.abs(line.end.y)).toBeLessThan(1e-6);
    expect(line.end.x).toBeGreaterThan(0);
  });
});
