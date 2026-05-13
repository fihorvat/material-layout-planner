import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOpeningDraw } from '../useOpeningDraw';
import {
  useProjectStore,
  useEditorStore,
  useHistoryStore,
  useSelectionStore,
  useOpeningToolStore,
} from '@/state';
import { useToastStore } from '@/state/toastStore';
import { dispatchCommand, createSurfaceCommand } from '@/domain/commands';
import { createSurface } from '@/domain/surfaces/createSurface';

const makeStageRef = (pos: { x: number; y: number } | null) => ({
  current: {
    getPointerPosition: () => pos,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
});

const seedSurface = () => {
  const s = createSurface({
    name: 'S1',
    outerBoundary: [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 1000 },
      { x: 0, y: 1000 },
    ],
  });
  dispatchCommand(createSurfaceCommand({ surface: s }));
  return s;
};

describe('useOpeningDraw — rectangle mode', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useEditorStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
    useSelectionStore.getState().resetForTests();
    useOpeningToolStore.getState().resetForTests();
    useToastStore.getState().clearToasts();
  });

  it('two clicks inside a surface commit an opening', () => {
    const surface = seedSurface();
    const stageRef = makeStageRef({ x: 200, y: 200 });
    const { result } = renderHook(() => useOpeningDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    stageRef.current.getPointerPosition = () => ({ x: 400, y: 400 });
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    const after = useProjectStore.getState().project.surfaces.find((s) => s.id === surface.id)!;
    expect(after.holes).toHaveLength(1);
    expect(after.holeMeta).toHaveLength(1);
  });

  it('rejects with toast when the first click is outside any surface', () => {
    seedSurface();
    const stageRef = makeStageRef({ x: 5000, y: 5000 });
    const { result } = renderHook(() => useOpeningDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    stageRef.current.getPointerPosition = () => ({ x: 5200, y: 5200 });
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    const surfaces = useProjectStore.getState().project.surfaces;
    expect(surfaces[0]?.holes ?? []).toHaveLength(0);
    expect(
      useToastStore
        .getState()
        .toasts.some(
          (t) =>
            /no surfaces yet/i.test(t.message) ||
            /click inside a surface/i.test(t.message) ||
            /start inside a surface/i.test(t.message),
        ),
    ).toBe(true);
  });

  it('rejects with toast when opening extends outside the surface', () => {
    seedSurface();
    const stageRef = makeStageRef({ x: 900, y: 900 });
    const { result } = renderHook(() => useOpeningDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    stageRef.current.getPointerPosition = () => ({ x: 1200, y: 1200 });
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    const surfaces = useProjectStore.getState().project.surfaces;
    expect(surfaces[0]?.holes ?? []).toHaveLength(0);
    expect(
      useToastStore
        .getState()
        .toasts.some((t) => /outside parent surface|invalid/i.test(t.message)),
    ).toBe(true);
  });
});

describe('useOpeningDraw — polygon mode', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useEditorStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
    useSelectionStore.getState().resetForTests();
    useOpeningToolStore.getState().resetForTests();
    useToastStore.getState().clearToasts();
    useOpeningToolStore.getState().setMode('polygon');
  });

  it('closes via closePolygonNow and commits a triangular opening', () => {
    const surface = seedSurface();
    const stageRef = makeStageRef({ x: 200, y: 200 });
    const { result } = renderHook(() => useOpeningDraw(stageRef));
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    stageRef.current.getPointerPosition = () => ({ x: 400, y: 200 });
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    stageRef.current.getPointerPosition = () => ({ x: 300, y: 400 });
    act(() => result.current.onPointerDown({ shift: false, alt: false, ctrl: false }));
    act(() => result.current.closePolygonNow());
    const after = useProjectStore.getState().project.surfaces.find((s) => s.id === surface.id)!;
    expect(after.holes).toHaveLength(1);
    expect(after.holes[0]).toHaveLength(3);
  });
});
