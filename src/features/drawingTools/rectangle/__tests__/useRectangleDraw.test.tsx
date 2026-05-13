import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRectangleDraw, computeRect } from '../useRectangleDraw';
import { useProjectStore, useEditorStore, useHistoryStore } from '@/state';

const makeStageRef = (pos: { x: number; y: number } | null) => ({
  current: {
    getPointerPosition: () => pos,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
});

describe('useRectangleDraw', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useEditorStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });

  it('computeRect normalizes negative drags', () => {
    const r = computeRect({ x: 100, y: 100 }, { x: 0, y: 0 }, { shift: false, alt: false });
    expect(r.origin).toEqual({ x: 0, y: 0 });
    expect(r.widthMm).toBe(100);
    expect(r.heightMm).toBe(100);
  });

  it('computeRect with Shift produces square', () => {
    const r = computeRect({ x: 0, y: 0 }, { x: 100, y: 30 }, { shift: true, alt: false });
    expect(r.widthMm).toBe(100);
    expect(r.heightMm).toBe(100);
  });

  it('computeRect with Alt centers on first', () => {
    const r = computeRect({ x: 50, y: 50 }, { x: 100, y: 80 }, { shift: false, alt: true });
    expect(r.widthMm).toBe(100);
    expect(r.heightMm).toBe(60);
    expect(r.origin).toEqual({ x: 0, y: 20 });
  });

  it('two clicks commits a rectangle command', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useRectangleDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    stageRef.current.getPointerPosition = () => ({ x: 200, y: 100 });
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    const ents = useProjectStore.getState().project.drawingEntities;
    expect(ents).toHaveLength(1);
    expect(ents[0]?.type).toBe('rectangle');
  });

  it('openNumericPrompt forwards initial length string when provided', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useRectangleDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    act(() => result.current.openNumericPrompt('5'));
    expect(result.current.numericPrompt?.initialLength).toBe('5');
  });

  it('numeric submit creates exact dimensions', () => {
    const stageRef = makeStageRef({ x: 0, y: 0 });
    const { result } = renderHook(() => useRectangleDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    act(() => result.current.openNumericPrompt());
    act(() => result.current.submitNumeric(800, 400));
    const e = useProjectStore.getState().project.drawingEntities[0];
    if (e?.type !== 'rectangle') throw new Error('expected rectangle');
    expect(e.widthMm).toBe(800);
    expect(e.heightMm).toBe(400);
  });
});
