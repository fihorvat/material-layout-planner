import { useCallback, useEffect, useState } from 'react';
import type Konva from 'konva';
import type { Point2D, Surface } from '@/types';
import {
  useEditorStore,
  useProjectStore,
  useSelectionStore,
  useSplitToolStore,
  type SplitMode,
} from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { closestEdgeOfPoints, pointInPolygon } from '@/domain/geometry';
import {
  dispatchCommand,
  splitSurfaceCommand,
} from '@/domain/commands';
import {
  splitSurfaceByLine,
  splitSurfaceByPolygon,
  splitSurfaceAtDimension,
  type SplitResult,
} from '@/domain/surfaces/splitSurface';

export type ModifierKeys = { shift: boolean; alt: boolean; ctrl: boolean };

export type SplitDrawState =
  | { phase: 'idle'; mode: SplitMode }
  | { phase: 'linePickB'; mode: 'line'; first: Point2D; cursor: Point2D; ortho: boolean }
  | {
      phase: 'rectPickB';
      mode: 'rectangle';
      first: Point2D;
      cursor: Point2D;
    }
  | {
      phase: 'polyDrawing';
      mode: 'polygon';
      points: Point2D[];
      cursor: Point2D;
    }
  | {
      phase: 'dimPickEdge';
      mode: 'dimension';
    };

const resolveWorld = (stageRef: React.RefObject<Konva.Stage | null>): Point2D | null => {
  const s = stageRef.current;
  if (!s) return null;
  const pos = s.getPointerPosition();
  if (!pos) return null;
  const v = useEditorStore.getState().viewport;
  return screenToWorld(pos.x, pos.y, v);
};

const constrainAngle = (from: Point2D, to: Point2D, stepDeg = 90): Point2D => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return to;
  const a = Math.atan2(dy, dx);
  const step = (stepDeg * Math.PI) / 180;
  const snapped = Math.round(a / step) * step;
  return { x: from.x + Math.cos(snapped) * len, y: from.y + Math.sin(snapped) * len };
};

const SNAP_CLOSE_PX = 10;

export type SplitDrawAPI = {
  state: SplitDrawState;
  error: string | null;
  onPointerDown: (mods: ModifierKeys) => void;
  onPointerMove: (mods: ModifierKeys) => void;
  closePolygonNow: () => void;
  removeLastPolygonVertex: () => void;
  /** Drop the last placed anchor for any active phase (line / rect / polygon). */
  removeLastPoint: () => void;
  cancel: () => void;
  /** Surface targeted by the tool (first selected surface). null when none. */
  targetSurface: Surface | null;
  /** Commit a dimension-based split. Returns true on success. */
  applyDimensionSplit: (surfaceId: string, edgeIndex: number, offsetMm: number) => boolean;
};

const pickTargetSurface = (cursor: Point2D | null): Surface | null => {
  const project = useProjectStore.getState().project;
  const selection = useSelectionStore.getState().selected;
  const selectedSurface = selection.find((e) => e.kind === 'surface');
  if (selectedSurface) {
    const s = project.surfaces.find((s2) => s2.id === selectedSurface.id);
    if (s) return s;
  }
  // Fallback: surface under cursor.
  if (cursor) {
    for (const s of project.surfaces) {
      if (pointInPolygon(cursor, s.outerBoundary)) return s;
    }
  }
  return null;
};

const commitSplit = (result: SplitResult, sourceId: string, setError: (e: string | null) => void): boolean => {
  if (result.issues.length > 0) {
    setError(result.issues.map((i) => i.message).join('; '));
    return false;
  }
  if (result.parts.length < 2) {
    setError('Split did not produce 2 or more parts');
    return false;
  }
  dispatchCommand(splitSurfaceCommand({ sourceId, parts: result.parts }));
  setError(null);
  return true;
};

export const useSplitSurfaceDraw = (
  stageRef: React.RefObject<Konva.Stage | null>,
): SplitDrawAPI => {
  const mode = useSplitToolStore((s) => s.mode);
  const innerMode = useSplitToolStore((s) => s.innerMode);
  const setDimensionPending = useSplitToolStore((s) => s.setDimensionPending);
  // Subscribe so the hook re-renders when the user selects a surface.
  const selection = useSelectionStore((s) => s.selected);
  const surfaces = useProjectStore((s) => s.project.surfaces);

  const initialState = (m: SplitMode): SplitDrawState => {
    if (m === 'dimension') return { phase: 'dimPickEdge', mode: 'dimension' };
    return { phase: 'idle', mode: m };
  };

  const [state, setState] = useState<SplitDrawState>(() => initialState(mode));
  const [error, setError] = useState<string | null>(null);
  const [targetSurfaceFallback, setTargetSurfaceFallback] = useState<Surface | null>(null);

  // Reset when the user switches sub-mode.
  useEffect(() => {
    setState(initialState(mode));
    setError(null);
  }, [mode]);

  const selectedSurfaceEntry = selection.find((e) => e.kind === 'surface');
  const selectedSurface = selectedSurfaceEntry
    ? surfaces.find((s) => s.id === selectedSurfaceEntry.id) ?? null
    : null;
  const targetSurface = selectedSurface ?? targetSurfaceFallback;

  const onPointerDown = useCallback(
    (mods: ModifierKeys) => {
      const raw = resolveWorld(stageRef);
      if (!raw) return;

      if (state.mode === 'dimension') {
        const surface = pickTargetSurface(raw);
        if (!surface) {
          setError('Select a surface first');
          return;
        }
        setTargetSurfaceFallback(surface);
        const edge = closestEdgeOfPoints(raw, surface.outerBoundary, true);
        if (!edge) return;
        const v = useEditorStore.getState().viewport;
        const tolWorld = (SNAP_CLOSE_PX * 4) / Math.max(v.scale, 1e-9);
        if (edge.distance > tolWorld) {
          setError('Click closer to a surface edge');
          return;
        }
        setError(null);
        setDimensionPending({ surfaceId: surface.id, edgeIndex: edge.edgeIndex });
        return;
      }

      const surface = pickTargetSurface(raw);
      if (!surface) {
        setError('Select a surface first');
        return;
      }
      setTargetSurfaceFallback(surface);
      setError(null);

      if (state.mode === 'line') {
        if (state.phase === 'idle') {
          setState({
            phase: 'linePickB',
            mode: 'line',
            first: raw,
            cursor: raw,
            ortho: mods.shift,
          });
          return;
        }
        let b = raw;
        if (mods.shift) b = constrainAngle(state.first, raw);
        const result = splitSurfaceByLine(surface, { a: state.first, b });
        if (commitSplit(result, surface.id, setError)) {
          setState({ phase: 'idle', mode: 'line' });
        }
        return;
      }

      if (state.mode === 'rectangle') {
        if (state.phase === 'idle') {
          setState({ phase: 'rectPickB', mode: 'rectangle', first: raw, cursor: raw });
          return;
        }
        const f = state.first;
        const minX = Math.min(f.x, raw.x);
        const minY = Math.min(f.y, raw.y);
        const maxX = Math.max(f.x, raw.x);
        const maxY = Math.max(f.y, raw.y);
        if (maxX - minX < 1 || maxY - minY < 1) {
          setError('Rectangle too small');
          setState({ phase: 'idle', mode: 'rectangle' });
          return;
        }
        const inner: Point2D[] = [
          { x: minX, y: minY },
          { x: maxX, y: minY },
          { x: maxX, y: maxY },
          { x: minX, y: maxY },
        ];
        const result = splitSurfaceByPolygon(surface, inner, { mode: innerMode });
        if (commitSplit(result, surface.id, setError)) {
          setState({ phase: 'idle', mode: 'rectangle' });
        }
        return;
      }

      if (state.mode === 'polygon') {
        if (state.phase === 'idle') {
          setState({ phase: 'polyDrawing', mode: 'polygon', points: [raw], cursor: raw });
          return;
        }
        // polyDrawing: try to close if click is near first vertex.
        const first = state.points[0];
        const v = useEditorStore.getState().viewport;
        const closeWorldDist = SNAP_CLOSE_PX / v.scale;
        if (first && state.points.length >= 3 && Math.hypot(first.x - raw.x, first.y - raw.y) <= closeWorldDist) {
          const result = splitSurfaceByPolygon(surface, state.points, { mode: innerMode });
          if (commitSplit(result, surface.id, setError)) {
            setState({ phase: 'idle', mode: 'polygon' });
          }
          return;
        }
        setState({
          phase: 'polyDrawing',
          mode: 'polygon',
          points: [...state.points, raw],
          cursor: raw,
        });
      }
    },
    [state, stageRef, innerMode, setDimensionPending],
  );

  const onPointerMove = useCallback(
    (mods: ModifierKeys) => {
      const raw = resolveWorld(stageRef);
      if (!raw) return;
      if (state.phase === 'linePickB') {
        const cursor = mods.shift ? constrainAngle(state.first, raw) : raw;
        setState({ ...state, cursor, ortho: mods.shift });
      } else if (state.phase === 'rectPickB') {
        setState({ ...state, cursor: raw });
      } else if (state.phase === 'polyDrawing') {
        setState({ ...state, cursor: raw });
      }
    },
    [state, stageRef],
  );

  const closePolygonNow = useCallback(() => {
    if (state.phase !== 'polyDrawing') return;
    const surface = pickTargetSurface(null) ?? targetSurfaceFallback;
    if (!surface) {
      setError('Select a surface first');
      return;
    }
    if (state.points.length < 3) {
      setError('Need at least 3 points');
      return;
    }
    const result = splitSurfaceByPolygon(surface, state.points, { mode: innerMode });
    if (commitSplit(result, surface.id, setError)) {
      setState({ phase: 'idle', mode: 'polygon' });
    }
  }, [state, innerMode, targetSurfaceFallback]);

  const removeLastPolygonVertex = useCallback(() => {
    if (state.phase !== 'polyDrawing') return;
    if (state.points.length <= 1) {
      setState({ phase: 'idle', mode: 'polygon' });
      return;
    }
    setState({ ...state, points: state.points.slice(0, -1) });
  }, [state]);

  // Backspace handler for 2-point modes (line, rectangle): drop the first
  // anchor and return to idle so the user can re-pick without canceling
  // the whole tool.
  const removeLastPoint = useCallback(() => {
    if (state.phase === 'linePickB') {
      setState({ phase: 'idle', mode: 'line' });
    } else if (state.phase === 'rectPickB') {
      setState({ phase: 'idle', mode: 'rectangle' });
    } else if (state.phase === 'polyDrawing') {
      if (state.points.length <= 1) {
        setState({ phase: 'idle', mode: 'polygon' });
      } else {
        setState({ ...state, points: state.points.slice(0, -1) });
      }
    }
  }, [state]);

  const cancel = useCallback(() => {
    setError(null);
    setDimensionPending(null);
    if (mode === 'dimension') {
      setState({ phase: 'dimPickEdge', mode: 'dimension' });
    } else {
      setState({ phase: 'idle', mode });
    }
  }, [mode, setDimensionPending]);

  /** Public API used by the dimension prompt to commit. */
  const applyDimensionSplit = useCallback(
    (surfaceId: string, edgeIndex: number, offsetMm: number): boolean => {
      const project = useProjectStore.getState().project;
      const surface = project.surfaces.find((s) => s.id === surfaceId);
      if (!surface) {
        setError('Surface not found');
        return false;
      }
      const result = splitSurfaceAtDimension(surface, edgeIndex, offsetMm);
      return commitSplit(result, surface.id, setError);
    },
    [],
  );

  return {
    state,
    error,
    onPointerDown,
    onPointerMove,
    closePolygonNow,
    removeLastPolygonVertex,
    removeLastPoint,
    cancel,
    targetSurface,
    applyDimensionSplit,
  };
};

export type UseSplitSurfaceDrawReturn = ReturnType<typeof useSplitSurfaceDraw>;
