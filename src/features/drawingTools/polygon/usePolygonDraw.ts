import { useCallback, useState } from 'react';
import type Konva from 'konva';
import type { Point2D, PolygonEntity } from '@/types';
import { useDrawingToolStore, useEditorStore, useProjectStore } from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { distance, ensureCCW, validatePolygon, degToRad } from '@/domain/geometry';
import { dispatchCommand, addDrawingEntityCommand } from '@/domain/commands';
import { newDrawingEntityId } from '@/domain/ids';
import {
  collectShapeBoundingBoxes,
  isDrawingModeActiveSnapshot,
  snapToBoundingBoxEdge,
} from '@/features/drawingTools/drawingMode';

export type ModifierKeys = { shift: boolean; alt: boolean; ctrl: boolean };

export type AlignmentGuides = {
  horizontal?: Point2D;
  vertical?: Point2D;
};

type PolygonDrawState =
  | { phase: 'idle' }
  | {
      phase: 'drawing';
      points: Point2D[];
      cursor: Point2D;
      ortho: boolean;
      alignments?: AlignmentGuides;
    };

const SNAP_CLOSE_PX = 10;
const ALIGN_PX = 8;

const constrainAngle = (from: Point2D, to: Point2D, stepDeg = 90): Point2D => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return to;
  const angle = Math.atan2(dy, dx);
  const step = degToRad(stepDeg);
  const snapped = Math.round(angle / step) * step;
  return {
    x: from.x + Math.cos(snapped) * len,
    y: from.y + Math.sin(snapped) * len,
  };
};

const computeAxisAlignment = (
  raw: Point2D,
  points: readonly Point2D[],
  tol: number,
): { cursor: Point2D; alignments: AlignmentGuides } => {
  let horizontal: Point2D | undefined;
  let vertical: Point2D | undefined;
  let bestDY = tol;
  let bestDX = tol;
  for (const p of points) {
    const dy = Math.abs(raw.y - p.y);
    if (dy < bestDY) {
      bestDY = dy;
      horizontal = p;
    }
    const dx = Math.abs(raw.x - p.x);
    if (dx < bestDX) {
      bestDX = dx;
      vertical = p;
    }
  }
  const cursor: Point2D = {
    x: vertical ? vertical.x : raw.x,
    y: horizontal ? horizontal.y : raw.y,
  };
  return { cursor, alignments: { horizontal, vertical } };
};

const resolveWorld = (stageRef: React.RefObject<Konva.Stage | null>): Point2D | null => {
  const s = stageRef.current;
  if (!s) return null;
  const pos = s.getPointerPosition();
  if (!pos) return null;
  const v = useEditorStore.getState().viewport;
  return screenToWorld(pos.x, pos.y, v);
};

type PolygonDrawOptions = {
  /**
   * Optional override for the commit step. When provided, the hook will call
   * this with the validated (CCW-normalized) points instead of creating a
   * polygon `DrawingEntity`. Return `true` to indicate the commit succeeded
   * (the draw state will be reset to `idle`). Used by the Surface tool to
   * produce a `Surface` instead of a polygon when the user closes the shape
   * by clicking the first vertex.
   */
  onCommit?: (points: Point2D[]) => boolean;
};

export const usePolygonDraw = (
  stageRef: React.RefObject<Konva.Stage | null>,
  options: PolygonDrawOptions = {},
) => {
  const { onCommit } = options;
  const [state, setState] = useState<PolygonDrawState>({ phase: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [numericPrompt, setNumericPrompt] = useState<
    { initialAngleDeg: number; initialLength?: string } | null
  >(null);

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
    if (onCommit) {
      const ok = onCommit(normalized);
      if (ok) setError(null);
      return ok;
    }
    const entity: PolygonEntity = {
      id: newDrawingEntityId(),
      type: 'polygon',
      points: normalized,
      showSegmentDimensions: true,
      showArea: false,
      style: { ...useDrawingToolStore.getState().style },
    };
    dispatchCommand(addDrawingEntityCommand({ entity }));
    setError(null);
    return true;
  }, [onCommit]);

  // When Shift is held with snap enabled AND drawing mode is active, try
  // projecting the cursor onto a nearby bounding-rectangle edge so a polygon
  // vertex can be made exactly colinear with an existing shape's bbox.
  // Returns null when there is no bbox edge in tolerance or drawing mode is
  // off.
  const tryBboxEdgeSnap = useCallback((raw: Point2D): Point2D | null => {
    const editor = useEditorStore.getState();
    if (!editor.snapEnabled) return null;
    if (!isDrawingModeActiveSnapshot()) return null;
    const project = useProjectStore.getState().project;
    const bboxes = collectShapeBoundingBoxes(project);
    if (bboxes.length === 0) return null;
    const tolMm = editor.snapTolerancePx / Math.max(editor.viewport.scale, 1e-9);
    return snapToBoundingBoxEdge(raw, tolMm, bboxes);
  }, []);

  const onPointerDown = useCallback(
    (mods: ModifierKeys = { shift: false, alt: false, ctrl: false }) => {
      const raw = resolveWorld(stageRef);
      if (!raw) return;
      if (state.phase === 'idle') {
        setState({ phase: 'drawing', points: [raw], cursor: raw, ortho: mods.shift });
        return;
      }
      const last = state.points[state.points.length - 1];
      const v = useEditorStore.getState().viewport;
      let p: Point2D;
      let alignments: AlignmentGuides | undefined;
      let ortho = mods.shift;
      if (mods.shift) {
        const onBbox = tryBboxEdgeSnap(raw);
        if (onBbox) {
          p = onBbox;
          ortho = false;
        } else if (last) {
          p = constrainAngle(last, raw);
        } else {
          p = raw;
        }
      } else {
        const aligned = computeAxisAlignment(raw, state.points, ALIGN_PX / v.scale);
        p = aligned.cursor;
        alignments = aligned.alignments;
      }
      const first = state.points[0];
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
        ortho,
        alignments,
      });
    },
    [state, stageRef, tryCommit, tryBboxEdgeSnap],
  );

  const onPointerMove = useCallback(
    (mods: ModifierKeys = { shift: false, alt: false, ctrl: false }) => {
      if (state.phase !== 'drawing') return;
      const raw = resolveWorld(stageRef);
      if (!raw) return;
      const last = state.points[state.points.length - 1];
      let cursor: Point2D;
      let alignments: AlignmentGuides | undefined;
      let ortho = mods.shift;
      if (mods.shift) {
        const onBbox = tryBboxEdgeSnap(raw);
        if (onBbox) {
          cursor = onBbox;
          ortho = false;
        } else if (last) {
          cursor = constrainAngle(last, raw);
        } else {
          cursor = raw;
        }
      } else {
        const v = useEditorStore.getState().viewport;
        const aligned = computeAxisAlignment(raw, state.points, ALIGN_PX / v.scale);
        cursor = aligned.cursor;
        alignments = aligned.alignments;
      }
      setState({ ...state, cursor, ortho, alignments });
    },
    [state, stageRef, tryBboxEdgeSnap],
  );

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
    setNumericPrompt(null);
  }, []);

  const cancelNumericPrompt = useCallback(() => {
    setNumericPrompt(null);
  }, []);

  const openNumericPrompt = useCallback((initialLength?: string) => {
    if (state.phase !== 'drawing') return;
    const last = state.points[state.points.length - 1];
    if (!last) return;
    const dx = state.cursor.x - last.x;
    const dy = state.cursor.y - last.y;
    const initialAngleDeg = Math.hypot(dx, dy) < 1e-9 ? 0 : (Math.atan2(dy, dx) * 180) / Math.PI;
    setNumericPrompt({ initialAngleDeg, initialLength });
  }, [state]);

  const submitNumeric = useCallback(
    (lengthMm: number, angleDeg: number) => {
      if (state.phase !== 'drawing') {
        setNumericPrompt(null);
        return;
      }
      const last = state.points[state.points.length - 1];
      if (!last) {
        setNumericPrompt(null);
        return;
      }
      const a = degToRad(angleDeg);
      const next = {
        x: last.x + Math.cos(a) * lengthMm,
        y: last.y + Math.sin(a) * lengthMm,
      };
      setState({ ...state, points: [...state.points, next], cursor: next });
      setNumericPrompt(null);
    },
    [state],
  );

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

  return {
    state,
    error,
    numericPrompt,
    onPointerDown,
    onPointerMove,
    removeLast,
    closeNow,
    cancel,
    appendSegment,
    openNumericPrompt,
    submitNumeric,
    cancelNumericPrompt,
  };
};
