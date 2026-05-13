import { useCallback, useMemo, useState } from 'react';
import type Konva from 'konva';
import type { Point2D, LineEntity } from '@/types';
import { useDrawingToolStore, useEditorStore, useProjectStore } from '@/state';
import { snap } from '@/features/editor/canvas/snap';
import { constrainAngle } from '@/domain/geometry';
import {
  collectSnapCandidates,
  resolveWorldFromStage,
} from '@/features/drawingTools/drawingCoords';
import { dispatchCommand, addDrawingEntityCommand } from '@/domain/commands';
import { newDrawingEntityId } from '@/domain/ids';

export type ModifierKeys = {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
};

type MeterDrawState =
  | { phase: 'pickFirst' }
  | { phase: 'pickSecond'; first: Point2D; cursor: Point2D; ortho: boolean };

const CLOSE_EPSILON_MM = 1e-3;

// Distinct color used to render committed meter lines so they are easy to
// tell apart from regular drawing lines on the canvas. Matches the cyan
// hue used in the in-progress preview.
const METER_STROKE_COLOR = '#0ea5e9';
const METER_LABEL_COLOR = '#0369a1';

const pointsCoincide = (a: Point2D, b: Point2D): boolean =>
  Math.hypot(a.x - b.x, a.y - b.y) <= CLOSE_EPSILON_MM;

export const useMeterDraw = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const [state, setState] = useState<MeterDrawState>({ phase: 'pickFirst' });

  const resolvePoint = useCallback(
    (mods: ModifierKeys): Point2D | null => {
      const raw = resolveWorldFromStage(stageRef);
      if (!raw) return null;
      const editor = useEditorStore.getState();
      const v = editor.viewport;
      const settings = useProjectStore.getState().project.settings;
      const snapEnabled = editor.snapEnabled && !mods.alt;

      const result = snap({
        worldPoint: raw,
        tolerancePx: editor.snapTolerancePx,
        scale: v.scale,
        gridSizeMm: settings.gridSizeMm,
        snapEnabled,
        snapModes: ['endpoint', 'point', 'grid'],
        candidatePoints: collectSnapCandidates(useProjectStore.getState().project),
      });
      return result.point;
    },
    [stageRef],
  );

  const onPointerMove = useCallback(
    (mods: ModifierKeys) => {
      if (state.phase !== 'pickSecond') return;
      const raw = resolvePoint(mods);
      if (!raw) return;
      // Shift constrains the second point to a 90° ray from the first,
      // matching the line tool's ortho-lock convention.
      const cursor = mods.shift ? constrainAngle(state.first, raw) : raw;
      setState({
        phase: 'pickSecond',
        first: state.first,
        cursor,
        ortho: mods.shift,
      });
    },
    [resolvePoint, state],
  );

  const commitMeter = useCallback((first: Point2D, end: Point2D): string | null => {
    if (pointsCoincide(first, end)) return null;
    const id = newDrawingEntityId();
    // A meter is just a line entity whose dimension label is always visible,
    // so it participates in selection, properties, snap and persistence the
    // same way a regular line does. We override the stroke/label colors to
    // cyan so meter annotations are visually distinct from regular drawing
    // lines on the canvas (matches the in-progress preview color).
    const baseStyle = useDrawingToolStore.getState().style;
    const entity: LineEntity = {
      id,
      type: 'line',
      start: first,
      end,
      showDimension: true,
      style: {
        ...baseStyle,
        strokeColor: METER_STROKE_COLOR,
        strokeWidthPx: Math.max(baseStyle.strokeWidthPx, 1.5),
        textColor: METER_LABEL_COLOR,
      },
    };
    dispatchCommand(addDrawingEntityCommand({ entity }));
    return id;
  }, []);

  const onPointerDown = useCallback(
    (mods: ModifierKeys) => {
      const raw = resolvePoint(mods);
      if (!raw) return;
      if (state.phase === 'pickFirst') {
        setState({
          phase: 'pickSecond',
          first: raw,
          cursor: raw,
          ortho: false,
        });
        return;
      }
      // Apply the same ortho lock to the committed endpoint as the preview
      // showed, so what the user saw is what gets persisted.
      const end = mods.shift ? constrainAngle(state.first, raw) : raw;
      commitMeter(state.first, end);
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
