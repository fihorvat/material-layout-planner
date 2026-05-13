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
    // Pin viewport scale so screen->world mapping is 1:1 in tests regardless
    // of the production default zoom.
    useEditorStore.getState().setViewport({ offsetXPx: 0, offsetYPx: 0, scale: 1 });
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

  it('Shift snaps the second point to the nearest 90° axis', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useLineDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    // cursor near 30° from origin at radius ~200
    stageRef.current.getPointerPosition = () => ({ x: 173, y: 100 });
    act(() => result.current.onPointerDown({ shift: true, alt: true, ctrl: false }));
    const lines = useProjectStore.getState().project.drawingEntities;
    expect(lines).toHaveLength(1);
    const line = lines[0];
    if (line?.type !== 'line') throw new Error('expected line');
    // 30° from 0 snaps to 0°; end should lie on the +x axis (y ≈ 0)
    expect(Math.abs(line.end.y)).toBeLessThan(1e-6);
    expect(line.end.x).toBeGreaterThan(0);
  });

  it('Pointer move flags ortho when shift is held', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useLineDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    stageRef.current.getPointerPosition = () => ({ x: 200, y: 50 });
    act(() => result.current.onPointerMove({ shift: true, alt: true, ctrl: false }));
    if (result.current.state.phase !== 'pickSecond') throw new Error('expected pickSecond');
    expect(result.current.state.ortho).toBe(true);
    // ortho-snapped cursor lies on +x axis
    expect(Math.abs(result.current.state.cursor.y)).toBeLessThan(1e-6);
  });

  it('openNumericPrompt pre-fills initial angle from current direction', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useLineDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    // cursor at (0, 100) -> angle 90°
    stageRef.current.getPointerPosition = () => ({ x: 0, y: 100 });
    act(() => result.current.onPointerMove({ shift: false, alt: true, ctrl: false }));
    act(() => result.current.openNumericPrompt());
    expect(result.current.numericPrompt?.initialAngleDeg).toBeCloseTo(90);
  });

  it('openNumericPrompt forwards initial length string when provided', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useLineDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    act(() => result.current.openNumericPrompt('2'));
    expect(result.current.numericPrompt?.initialLength).toBe('2');
  });

  it('Esc cancel resets to pickFirst', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useLineDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    act(() => result.current.cancel());
    expect(result.current.state.phase).toBe('pickFirst');
  });

  it('after committing a line, the next click continues the chain from that endpoint', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useLineDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    stageRef.current.getPointerPosition = () => ({ x: 200, y: 0 });
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    // Still drawing: chain continues from the just-committed endpoint.
    if (result.current.state.phase !== 'pickSecond') throw new Error('expected pickSecond');
    expect(result.current.state.first.x).toBeCloseTo(200);
    expect(result.current.state.first.y).toBeCloseTo(0);
    expect(result.current.state.chainPoints).toHaveLength(2);
    expect(result.current.state.chainLineIds).toHaveLength(1);
    // Next click extends the chain (does not start a fresh line entity from elsewhere).
    stageRef.current.getPointerPosition = () => ({ x: 200, y: 200 });
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    const entities = useProjectStore.getState().project.drawingEntities;
    expect(entities).toHaveLength(2);
    const last = entities[1];
    if (last?.type !== 'line') throw new Error('expected line');
    expect(last.start.x).toBeCloseTo(200);
    expect(last.start.y).toBeCloseTo(0);
    expect(last.end.x).toBeCloseTo(200);
    expect(last.end.y).toBeCloseTo(200);
  });

  it('closing the chain back to its start collapses the lines into a polygon', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useLineDraw(stageRef));
    // Click 1: chain start at (0, 0)
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    // Click 2: (200, 0)
    stageRef.current.getPointerPosition = () => ({ x: 200, y: 0 });
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    // Click 3: (200, 200)
    stageRef.current.getPointerPosition = () => ({ x: 200, y: 200 });
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    // Three lines should not yet exist; only two segments drawn so far.
    expect(useProjectStore.getState().project.drawingEntities).toHaveLength(2);
    // Click 4: back to (0, 0) -> closes loop, replaces lines with a polygon.
    stageRef.current.getPointerPosition = () => ({ x: 0, y: 0 });
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    const entities = useProjectStore.getState().project.drawingEntities;
    expect(entities).toHaveLength(1);
    const only = entities[0];
    if (only?.type !== 'polygon') throw new Error('expected polygon');
    expect(only.points).toHaveLength(3);
    expect(result.current.state.phase).toBe('pickFirst');
  });

  it('clicking the chain start with fewer than 3 vertices does not create a polygon', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useLineDraw(stageRef));
    // Click 1: (0, 0)
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    // Click 2: (200, 0)
    stageRef.current.getPointerPosition = () => ({ x: 200, y: 0 });
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    // Click 3 back at start (0, 0) -> only 2 vertices in chain; should commit a normal line.
    stageRef.current.getPointerPosition = () => ({ x: 0, y: 0 });
    act(() => result.current.onPointerDown({ shift: false, alt: true, ctrl: false }));
    const entities = useProjectStore.getState().project.drawingEntities;
    expect(entities).toHaveLength(2);
    expect(entities.every((e) => e.type === 'line')).toBe(true);
  });
});
