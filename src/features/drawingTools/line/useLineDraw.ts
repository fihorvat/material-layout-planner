import { useCallback, useState } from 'react';
import type Konva from 'konva';
import type { Point2D, LineEntity } from '@/types';
import { defaultDrawingStyle } from '@/types';
import { useEditorStore, useProjectStore } from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { snap } from '@/features/editor/canvas/snap';
import { degToRad } from '@/domain/geometry';
import { dispatchCommand, addDrawingEntityCommand } from '@/domain/commands';
import { newDrawingEntityId } from '@/domain/ids';

export type ModifierKeys = {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
};

export type LineDrawState =
  | { phase: 'pickFirst' }
  | { phase: 'pickSecond'; first: Point2D; cursor: Point2D };

const constrainAngle = (from: Point2D, to: Point2D, stepDeg = 15): Point2D => {
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
  const [numericPrompt, setNumericPrompt] = useState<{ first: Point2D } | null>(null);

  const resolvePoint = useCallback((mods: ModifierKeys): Point2D | null => {
    const raw = resolveWorldFromStage(stageRef);
    if (!raw) return null;
    const v = useEditorStore.getState().viewport;
    const settings = useProjectStore.getState().project.settings;
    const snapEnabled = useEditorStore.getState().snapEnabled && !mods.alt;
    const result = snap({
      worldPoint: raw,
      tolerancePx: useEditorStore.getState().snapTolerancePx,
      scale: v.scale,
      gridSizeMm: settings.gridSizeMm,
      snapEnabled,
      snapModes: ['endpoint', 'point', 'grid'],
      candidatePoints: candidatePoints(),
    });
    return result.point;
  }, [stageRef]);

  const onPointerMove = useCallback(
    (mods: ModifierKeys) => {
      if (state.phase !== 'pickSecond') return;
      let p = resolvePoint(mods);
      if (!p) return;
      if (mods.shift) p = constrainAngle(state.first, p);
      setState({ phase: 'pickSecond', first: state.first, cursor: p });
    },
    [resolvePoint, state],
  );

  const commitLine = useCallback((first: Point2D, end: Point2D) => {
    if (first.x === end.x && first.y === end.y) return;
    const entity: LineEntity = {
      id: newDrawingEntityId(),
      type: 'line',
      start: first,
      end,
      showDimension: false,
      style: defaultDrawingStyle(),
    };
    dispatchCommand(addDrawingEntityCommand({ entity }));
  }, []);

  const onPointerDown = useCallback(
    (mods: ModifierKeys) => {
      const p = resolvePoint(mods);
      if (!p) return;
      if (state.phase === 'pickFirst') {
        setState({ phase: 'pickSecond', first: p, cursor: p });
      } else {
        let end = p;
        if (mods.shift) end = constrainAngle(state.first, end);
        commitLine(state.first, end);
        setState({ phase: 'pickFirst' });
      }
    },
    [resolvePoint, state, commitLine],
  );

  const cancel = useCallback(() => {
    setState({ phase: 'pickFirst' });
    setNumericPrompt(null);
  }, []);

  const openNumericPrompt = useCallback(() => {
    if (state.phase !== 'pickSecond') return;
    setNumericPrompt({ first: state.first });
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
      commitLine(state.first, end);
      setState({ phase: 'pickFirst' });
      setNumericPrompt(null);
    },
    [state, commitLine],
  );

  return {
    state,
    numericPrompt,
    onPointerMove,
    onPointerDown,
    openNumericPrompt,
    submitNumeric,
    cancel,
  };
};
