import { useCallback, useState } from 'react';
import type Konva from 'konva';
import type { Point2D, LineEntity, PolygonEntity } from '@/types';
import { useDrawingToolStore, useEditorStore, useProjectStore } from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { snap } from '@/features/editor/canvas/snap';
import { degToRad, ensureCCW, validatePolygon } from '@/domain/geometry';
import {
  collectShapeBoundingBoxes,
  isDrawingModeActiveSnapshot,
  snapToBoundingBoxEdge,
} from '@/features/drawingTools/drawingMode';
import {
  dispatchCommand,
  addDrawingEntityCommand,
  deleteDrawingEntityCommand,
  replaceProjectCommand,
} from '@/domain/commands';
import { newDrawingEntityId } from '@/domain/ids';

export type ModifierKeys = {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
};

type LineDrawState =
  | { phase: 'pickFirst' }
  | {
      phase: 'pickSecond';
      first: Point2D;
      cursor: Point2D;
      ortho: boolean;
      // Points of the active polyline chain, in click order.
      // The last entry equals `first` (the active starting point).
      chainPoints: Point2D[];
      // IDs of line entities that have been committed as part of the chain.
      // Length is always `chainPoints.length - 1`.
      chainLineIds: string[];
    };

// Distance under which two points are considered coincident (mm).
const CLOSE_EPSILON_MM = 1e-3;

const pointsCoincide = (a: Point2D, b: Point2D): boolean =>
  Math.hypot(a.x - b.x, a.y - b.y) <= CLOSE_EPSILON_MM;

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

const candidatePoints = (): Point2D[] => {
  const project = useProjectStore.getState().project;
  const pts: Point2D[] = [];
  for (const e of project.drawingEntities) {
    if (e.type === 'line') {
      pts.push(e.start, e.end);
    } else if (e.type === 'rectangle') {
      pts.push(
        { x: e.origin.x, y: e.origin.y },
        { x: e.origin.x + e.widthMm, y: e.origin.y },
        { x: e.origin.x + e.widthMm, y: e.origin.y + e.heightMm },
        { x: e.origin.x, y: e.origin.y + e.heightMm },
      );
    } else if (e.type === 'polygon') {
      pts.push(...e.points);
    }
  }
  return pts;
};

const resolveWorldFromStage = (stageRef: React.RefObject<Konva.Stage | null>): Point2D | null => {
  const stage = stageRef.current;
  if (!stage) return null;
  const pos = stage.getPointerPosition();
  if (!pos) return null;
  const v = useEditorStore.getState().viewport;
  return screenToWorld(pos.x, pos.y, v);
};

export const useLineDraw = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const [state, setState] = useState<LineDrawState>({ phase: 'pickFirst' });
  const [numericPrompt, setNumericPrompt] = useState<
    { first: Point2D; initialAngleDeg: number; initialLength?: string } | null
  >(null);

  const resolvePoint = useCallback(
    (mods: ModifierKeys): { point: Point2D; bboxSnapped: boolean } | null => {
      const raw = resolveWorldFromStage(stageRef);
      if (!raw) return null;
      const editor = useEditorStore.getState();
      const v = editor.viewport;
      const settings = useProjectStore.getState().project.settings;
      const snapEnabled = editor.snapEnabled && !mods.alt;

      // When Shift is held with snap enabled AND drawing mode is active,
      // first try to project the cursor onto a nearby bounding-rectangle
      // edge so a line endpoint can be made exactly colinear with an
      // existing shape's bbox. Falls back to the normal grid/endpoint snap
      // when no bbox edge is in tolerance or drawing mode is off.
      if (snapEnabled && mods.shift && isDrawingModeActiveSnapshot()) {
        const project = useProjectStore.getState().project;
        const bboxes = collectShapeBoundingBoxes(project);
        const tolMm = editor.snapTolerancePx / Math.max(v.scale, 1e-9);
        const onBbox = snapToBoundingBoxEdge(raw, tolMm, bboxes);
        if (onBbox) return { point: onBbox, bboxSnapped: true };
      }

      const result = snap({
        worldPoint: raw,
        tolerancePx: editor.snapTolerancePx,
        scale: v.scale,
        gridSizeMm: settings.gridSizeMm,
        snapEnabled,
        snapModes: ['endpoint', 'point', 'grid'],
        candidatePoints: candidatePoints(),
      });
      return { point: result.point, bboxSnapped: false };
    },
    [stageRef],
  );

  const onPointerMove = useCallback(
    (mods: ModifierKeys) => {
      if (state.phase !== 'pickSecond') return;
      const resolved = resolvePoint(mods);
      if (!resolved) return;
      let p = resolved.point;
      // Bbox-edge snap already constrains the endpoint to a fixed axis, so
      // applying ortho on top of it would override the snap.
      const ortho = mods.shift && !resolved.bboxSnapped;
      if (ortho) p = constrainAngle(state.first, p);
      setState({
        phase: 'pickSecond',
        first: state.first,
        cursor: p,
        ortho,
        chainPoints: state.chainPoints,
        chainLineIds: state.chainLineIds,
      });
    },
    [resolvePoint, state],
  );

  const commitLine = useCallback((first: Point2D, end: Point2D): string | null => {
    if (pointsCoincide(first, end)) return null;
    const id = newDrawingEntityId();
    const entity: LineEntity = {
      id,
      type: 'line',
      start: first,
      end,
      showDimension: true,
      style: { ...useDrawingToolStore.getState().style },
    };
    dispatchCommand(addDrawingEntityCommand({ entity }));
    return id;
  }, []);

  // Attempt to close the active chain into a single polygon entity.
  // Returns true when the replacement was dispatched (chain consumed).
  const tryCloseChainToPolygon = useCallback(
    (chainPoints: Point2D[], chainLineIds: string[]): boolean => {
      if (chainPoints.length < 3 || chainLineIds.length < chainPoints.length - 1) {
        return false;
      }
      const candidate = ensureCCW(chainPoints);
      const validation = validatePolygon(candidate);
      if (!validation.valid) return false;
      const project = useProjectStore.getState().project;
      const idSet = new Set(chainLineIds);
      const remaining = project.drawingEntities.filter((e) => !idSet.has(e.id));
      // Bail out if any chain line has already been removed externally.
      if (project.drawingEntities.length - remaining.length !== chainLineIds.length) {
        return false;
      }
      const polygon: PolygonEntity = {
        id: newDrawingEntityId(),
        type: 'polygon',
        points: candidate,
        showSegmentDimensions: true,
        showArea: false,
        style: { ...useDrawingToolStore.getState().style },
      };
      const nextProject = {
        ...project,
        drawingEntities: [...remaining, polygon],
      };
      dispatchCommand(
        replaceProjectCommand({ next: nextProject }, 'Close lines into polygon'),
      );
      return true;
    },
    [],
  );

  const onPointerDown = useCallback(
    (mods: ModifierKeys) => {
      const resolved = resolvePoint(mods);
      if (!resolved) return;
      const p = resolved.point;
      if (state.phase === 'pickFirst') {
        setState({
          phase: 'pickSecond',
          first: p,
          cursor: p,
          ortho: mods.shift && !resolved.bboxSnapped,
          chainPoints: [p],
          chainLineIds: [],
        });
        return;
      }
      let end = p;
      // Bbox-edge snap already fixes one axis, so skip ortho constraint
      // when the resolved point came from a bbox snap.
      if (mods.shift && !resolved.bboxSnapped) end = constrainAngle(state.first, end);
      const chainStart = state.chainPoints[0];
      // If the click closes the chain back to its starting point and the
      // chain has at least 3 distinct vertices, collapse the chained lines
      // into a single polygon entity.
      if (
        chainStart &&
        state.chainPoints.length >= 3 &&
        pointsCoincide(end, chainStart) &&
        tryCloseChainToPolygon(state.chainPoints, state.chainLineIds)
      ) {
        setState({ phase: 'pickFirst' });
        return;
      }
      const id = commitLine(state.first, end);
      if (!id) return;
      setState({
        phase: 'pickSecond',
        first: end,
        cursor: end,
        ortho: mods.shift && !resolved.bboxSnapped,
        chainPoints: [...state.chainPoints, end],
        chainLineIds: [...state.chainLineIds, id],
      });
    },
    [resolvePoint, state, commitLine, tryCloseChainToPolygon],
  );

  const cancel = useCallback(() => {
    setState({ phase: 'pickFirst' });
    setNumericPrompt(null);
  }, []);

  // Backspace handler: while a polyline chain is in progress, drop the most
  // recently committed segment (and its endpoint) so the user can re-click
  // to place a different next vertex. When no segment has been committed
  // (only the first anchor exists) this returns the tool to "pick first".
  const removeLast = useCallback(() => {
    if (state.phase !== 'pickSecond') return;
    if (state.chainLineIds.length === 0) {
      // Only the initial anchor has been placed; clear it.
      setState({ phase: 'pickFirst' });
      setNumericPrompt(null);
      return;
    }
    const lastLineId = state.chainLineIds[state.chainLineIds.length - 1]!;
    dispatchCommand(deleteDrawingEntityCommand({ id: lastLineId }));
    const newChainPoints = state.chainPoints.slice(0, -1);
    const newChainIds = state.chainLineIds.slice(0, -1);
    const newFirst = newChainPoints[newChainPoints.length - 1] ?? state.first;
    setState({
      phase: 'pickSecond',
      first: newFirst,
      cursor: newFirst,
      ortho: false,
      chainPoints: newChainPoints,
      chainLineIds: newChainIds,
    });
    setNumericPrompt(null);
  }, [state]);

  const openNumericPrompt = useCallback((initialLength?: string) => {
    if (state.phase !== 'pickSecond') return;
    const dx = state.cursor.x - state.first.x;
    const dy = state.cursor.y - state.first.y;
    const initialAngleDeg = Math.hypot(dx, dy) < 1e-9 ? 0 : (Math.atan2(dy, dx) * 180) / Math.PI;
    setNumericPrompt({ first: state.first, initialAngleDeg, initialLength });
  }, [state]);

  const submitNumeric = useCallback(
    (lengthMm: number, angleDeg: number) => {
      if (state.phase !== 'pickSecond') {
        setNumericPrompt(null);
        return;
      }
      const a = degToRad(angleDeg);
      const end = {
        x: state.first.x + Math.cos(a) * lengthMm,
        y: state.first.y + Math.sin(a) * lengthMm,
      };
      const chainStart = state.chainPoints[0];
      if (
        chainStart &&
        state.chainPoints.length >= 3 &&
        pointsCoincide(end, chainStart) &&
        tryCloseChainToPolygon(state.chainPoints, state.chainLineIds)
      ) {
        setState({ phase: 'pickFirst' });
        setNumericPrompt(null);
        return;
      }
      const id = commitLine(state.first, end);
      if (!id) {
        setNumericPrompt(null);
        return;
      }
      setState({
        phase: 'pickSecond',
        first: end,
        cursor: end,
        ortho: false,
        chainPoints: [...state.chainPoints, end],
        chainLineIds: [...state.chainLineIds, id],
      });
      setNumericPrompt(null);
    },
    [state, commitLine, tryCloseChainToPolygon],
  );

  return {
    state,
    numericPrompt,
    onPointerMove,
    onPointerDown,
    openNumericPrompt,
    submitNumeric,
    removeLast,
    cancel,
  };
};
