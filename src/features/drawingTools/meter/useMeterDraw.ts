import { useCallback, useMemo, useState } from 'react';
import type Konva from 'konva';
import type { Point2D, LineEntity } from '@/types';
import { useDrawingToolStore, useEditorStore, useProjectStore } from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { snap } from '@/features/editor/canvas/snap';
import { collectShapeEdges, type ShapeEdge } from '@/features/drawingTools/drawingMode';
import { dispatchCommand, addDrawingEntityCommand } from '@/domain/commands';
import { newDrawingEntityId } from '@/domain/ids';

export type ModifierKeys = {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
};

export type MeterDrawState =
  | { phase: 'pickFirst' }
  | { phase: 'pickSecond'; first: Point2D; cursor: Point2D; snappedToEdge: boolean };

const CLOSE_EPSILON_MM = 1e-3;

const pointsCoincide = (a: Point2D, b: Point2D): boolean =>
  Math.hypot(a.x - b.x, a.y - b.y) <= CLOSE_EPSILON_MM;

const closestPointOnSegment = (
  p: Point2D,
  a: Point2D,
  b: Point2D,
): { point: Point2D; distance: number } => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) {
    return { point: { x: a.x, y: a.y }, distance: Math.hypot(p.x - a.x, p.y - a.y) };
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const point = { x: a.x + dx * t, y: a.y + dy * t };
  return { point, distance: Math.hypot(p.x - point.x, p.y - point.y) };
};

/**
 * Projects a world point onto the nearest segment of any visible shape edge.
 * Returns the projection only when it falls within `toleranceMm` of the input.
 * Used by the meter tool's Shift-snap so a measurement endpoint can be placed
 * exactly on an existing line/edge instead of free-floating in space.
 */
export const snapToNearestEdge = (
  worldPoint: Point2D,
  toleranceMm: number,
  edges: readonly ShapeEdge[],
): Point2D | null => {
  let best: { point: Point2D; distance: number } | null = null;
  for (const seg of edges) {
    const r = closestPointOnSegment(worldPoint, seg.a, seg.b);
    if (r.distance <= toleranceMm && (!best || r.distance < best.distance)) {
      best = r;
    }
  }
  return best ? best.point : null;
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

export const useMeterDraw = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const [state, setState] = useState<MeterDrawState>({ phase: 'pickFirst' });

  const resolvePoint = useCallback(
    (mods: ModifierKeys): { point: Point2D; snappedToEdge: boolean } | null => {
      const raw = resolveWorldFromStage(stageRef);
      if (!raw) return null;
      const editor = useEditorStore.getState();
      const v = editor.viewport;
      const settings = useProjectStore.getState().project.settings;
      const snapEnabled = editor.snapEnabled && !mods.alt;

      // Shift + meter = project onto the nearest existing shape edge so the
      // user can measure to/from arbitrary points along a line without having
      // to hit an exact endpoint.
      if (mods.shift) {
        const project = useProjectStore.getState().project;
        const edges = collectShapeEdges(project);
        const tolMm = Math.max(editor.snapTolerancePx, 16) / Math.max(v.scale, 1e-9);
        const onEdge = snapToNearestEdge(raw, tolMm, edges);
        if (onEdge) return { point: onEdge, snappedToEdge: true };
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
      return { point: result.point, snappedToEdge: false };
    },
    [stageRef],
  );

  const onPointerMove = useCallback(
    (mods: ModifierKeys) => {
      if (state.phase !== 'pickSecond') return;
      const resolved = resolvePoint(mods);
      if (!resolved) return;
      setState({
        phase: 'pickSecond',
        first: state.first,
        cursor: resolved.point,
        snappedToEdge: resolved.snappedToEdge,
      });
    },
    [resolvePoint, state],
  );

  const commitMeter = useCallback((first: Point2D, end: Point2D): string | null => {
    if (pointsCoincide(first, end)) return null;
    const id = newDrawingEntityId();
    // A meter is just a line entity whose dimension label is always visible,
    // so it participates in selection, properties, snap and persistence the
    // same way a regular line does.
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
          snappedToEdge: resolved.snappedToEdge,
        });
        return;
      }
      commitMeter(state.first, p);
      // Reset back to "pickFirst" so each measurement is independent.
      setState({ phase: 'pickFirst' });
    },
    [resolvePoint, state, commitMeter],
  );

  const cancel = useCallback(() => {
    setState({ phase: 'pickFirst' });
  }, []);

  return useMemo(
    () => ({ state, onPointerDown, onPointerMove, cancel }),
    [state, onPointerDown, onPointerMove, cancel],
  );
};
