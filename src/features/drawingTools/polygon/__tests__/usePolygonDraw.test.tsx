import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePolygonDraw } from '../usePolygonDraw';
import { useProjectStore, useEditorStore, useHistoryStore } from '@/state';

const makeStageRef = (pos: { x: number; y: number } | null) => ({
  current: {
    getPointerPosition: () => pos,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
});

const setCursor = (stageRef: { current: { getPointerPosition: () => { x: number; y: number } | null } }, x: number, y: number) => {
  stageRef.current.getPointerPosition = () => ({ x, y });
};

describe('usePolygonDraw', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useEditorStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });

  it('three clicks + Enter commits a polygon', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => usePolygonDraw(stageRef));
    act(() => result.current.onPointerDown());
    setCursor(stageRef, 100, 0);
    act(() => result.current.onPointerDown());
    setCursor(stageRef, 100, 100);
    act(() => result.current.onPointerDown());
    act(() => result.current.closeNow());
    const ents = useProjectStore.getState().project.drawingEntities;
    expect(ents).toHaveLength(1);
    expect(ents[0]?.type).toBe('polygon');
  });

  it('Backspace removes last point', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => usePolygonDraw(stageRef));
    act(() => result.current.onPointerDown());
    setCursor(stageRef, 100, 0);
    act(() => result.current.onPointerDown());
    act(() => result.current.removeLast());
    if (result.current.state.phase !== 'drawing') throw new Error('expected drawing');
    expect(result.current.state.points).toHaveLength(1);
  });

  it('self-intersecting polygon is rejected', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => usePolygonDraw(stageRef));
    act(() => result.current.onPointerDown());
    setCursor(stageRef, 100, 0);
    act(() => result.current.onPointerDown());
    setCursor(stageRef, 0, 100);
    act(() => result.current.onPointerDown());
    setCursor(stageRef, 100, 100);
    act(() => result.current.onPointerDown());
    act(() => result.current.closeNow());
    expect(useProjectStore.getState().project.drawingEntities).toHaveLength(0);
    expect(result.current.error).toBeTruthy();
  });

  it('Shift snaps a polyline segment to the nearest 90° axis', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => usePolygonDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    // next click near 30° from previous point at (173, 100)
    setCursor(stageRef, 173, 100);
    act(() => result.current.onPointerDown({ shift: true, alt: false, ctrl: false }));
    if (result.current.state.phase !== 'drawing') throw new Error('expected drawing');
    expect(result.current.state.ortho).toBe(true);
    const p1 = result.current.state.points[1]!;
    // snapped to +x axis
    expect(Math.abs(p1.y)).toBeLessThan(1e-6);
    expect(p1.x).toBeGreaterThan(0);
  });

  it('submitNumeric appends a point at the given length and closes the prompt', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => usePolygonDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    setCursor(stageRef, 50, 0);
    act(() => result.current.onPointerMove({ shift: false, alt: false, ctrl: false }));
    act(() => result.current.openNumericPrompt());
    expect(result.current.numericPrompt?.initialAngleDeg).toBeCloseTo(0);
    act(() => result.current.submitNumeric(250, 90));
    if (result.current.state.phase !== 'drawing') throw new Error('expected drawing');
    expect(result.current.state.points).toHaveLength(2);
    const p = result.current.state.points[1]!;
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(250);
    expect(result.current.numericPrompt).toBeNull();
  });

  it('appendSegment adds a point from last at length+angle', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => usePolygonDraw(stageRef));
    act(() => result.current.onPointerDown());
    act(() => result.current.appendSegment(100, 0));
    if (result.current.state.phase !== 'drawing') throw new Error('expected drawing');
    expect(result.current.state.points).toHaveLength(2);
    const p = result.current.state.points[1]!;
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(0);
  });
});
