import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLineDraw } from '../useLineDraw';
import { useProjectStore, useEditorStore, useHistoryStore } from '@/state';

// Simulate a Konva stage with getPointerPosition.
const makeStageRef = (pos: { x: number; y: number } | null) => ({
  current: {
    getPointerPosition: () => pos,
    width: () => 800,
    height: () => 600,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
});

describe('useLineDraw', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useEditorStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });

  it('first click sets phase to pickSecond', () => {
    const stageRef = makeStageRef({ x: 100, y: 100 });
    const { result } = renderHook(() => useLineDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    expect(result.current.state.phase).toBe('pickSecond');
  });

  it('two clicks commit a line via command', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useLineDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    stageRef.current.getPointerPosition = () => ({ x: 200, y: 0 });
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    const lines = useProjectStore.getState().project.drawingEntities;
    expect(lines).toHaveLength(1);
    expect(lines[0]?.type).toBe('line');
  });

  it('numeric submit creates a line of given length and angle', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useLineDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    act(() => result.current.openNumericPrompt());
    act(() => result.current.submitNumeric(1000, 0));
    const lines = useProjectStore.getState().project.drawingEntities;
    expect(lines).toHaveLength(1);
    const line = lines[0];
    if (line?.type !== 'line') throw new Error('expected line');
    expect(line.end.x).toBeCloseTo(1000);
    expect(line.end.y).toBeCloseTo(0);
  });

  it('Esc cancel resets to pickFirst', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useLineDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    act(() => result.current.cancel());
    expect(result.current.state.phase).toBe('pickFirst');
  });
});
