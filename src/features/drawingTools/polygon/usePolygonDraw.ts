import { useCallback, useState } from 'react';
import type Konva from 'konva';
import type { Point2D, PolygonEntity } from '@/types';
import { defaultDrawingStyle } from '@/types';
import { useEditorStore } from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { distance, ensureCCW, validatePolygon, degToRad } from '@/domain/geometry';
import { dispatchCommand, addDrawingEntityCommand } from '@/domain/commands';
import { newDrawingEntityId } from '@/domain/ids';

export type ModifierKeys = { shift: boolean; alt: boolean; ctrl: boolean };

export type PolygonDrawState =
  | { phase: 'idle' }
  | { phase: 'drawing'; points: Point2D[]; cursor: Point2D };

const SNAP_CLOSE_PX = 10;

const resolveWorld = (stageRef: React.RefObject<Konva.Stage | null>): Point2D | null => {
  const s = stageRef.current;
  if (!s) return null;
  const pos = s.getPointerPosition();
  if (!pos) return null;
  const v = useEditorStore.getState().viewport;
  return screenToWorld(pos.x, pos.y, v);
};

export const usePolygonDraw = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const [state, setState] = useState<PolygonDrawState>({ phase: 'idle' });
  const [error, setError] = useState<string | null>(null);

  const tryCommit = useCallback((points: Point2D[]) => {
    if (points.length < 3) {
      setError('Need at least 3 points');
      return false;
    }
    const normalized = ensureCCW(points);
    const validation = validatePolygon(normalized);
    if (!validation.valid) {
      const codes = validation.issues.map((i) => i.code).join(', ');
      setError(`Invalid polygon: ${codes}`);
      return false;
    }
    const entity: PolygonEntity = {
      id: newDrawingEntityId(),
      type: 'polygon',
      points: normalized,
      showSegmentDimensions: false,
      showArea: false,
      style: defaultDrawingStyle(),
    };
    dispatchCommand(addDrawingEntityCommand({ entity }));
    setError(null);
    return true;
  }, []);

  const onPointerDown = useCallback(() => {
    const p = resolveWorld(stageRef);
    if (!p) return;
    if (state.phase === 'idle') {
      setState({ phase: 'drawing', points: [p], cursor: p });
      return;
    }
    const first = state.points[0];
    const v = useEditorStore.getState().viewport;
    const closeWorldDist = SNAP_CLOSE_PX / v.scale;
    if (first && state.points.length >= 3 && distance(first, p) <= closeWorldDist) {
      if (tryCommit(state.points)) {
        setState({ phase: 'idle' });
      }
      return;
    }
    setState({
      phase: 'drawing',
      points: [...state.points, p],
      cursor: p,
    });
  }, [state, stageRef, tryCommit]);

  const onPointerMove = useCallback(() => {
    if (state.phase !== 'drawing') return;
    const p = resolveWorld(stageRef);
    if (!p) return;
    setState({ ...state, cursor: p });
  }, [state, stageRef]);

  const removeLast = useCallback(() => {
    if (state.phase !== 'drawing') return;
    if (state.points.length === 0) return;
    if (state.points.length === 1) {
      setState({ phase: 'idle' });
      return;
    }
    setState({ ...state, points: state.points.slice(0, -1) });
  }, [state]);

  const closeNow = useCallback(() => {
    if (state.phase !== 'drawing') return;
    if (tryCommit(state.points)) {
      setState({ phase: 'idle' });
    }
  }, [state, tryCommit]);

  const cancel = useCallback(() => {
    setState({ phase: 'idle' });
    setError(null);
  }, []);

  const appendSegment = useCallback(
    (lengthMm: number, angleDeg: number) => {
      if (state.phase !== 'drawing') return;
      const last = state.points[state.points.length - 1];
      if (!last) return;
      const a = degToRad(angleDeg);
      const next = {
        x: last.x + Math.cos(a) * lengthMm,
        y: last.y + Math.sin(a) * lengthMm,
      };
      setState({ ...state, points: [...state.points, next], cursor: next });
    },
    [state],
  );

  return { state, error, onPointerDown, onPointerMove, removeLast, closeNow, cancel, appendSegment };
};
