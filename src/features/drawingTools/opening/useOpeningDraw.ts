import { useCallback, useState } from 'react';
import type Konva from 'konva';
import type { Point2D, Surface } from '@/types';
import {
  useEditorStore,
  useProjectStore,
  useSelectionStore,
  useOpeningToolStore,
} from '@/state';
import { useToastStore } from '@/state/toastStore';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { ensureCW, validatePolygon, distance } from '@/domain/geometry';
import {
  dispatchCommand,
  addOpeningCommand,
  deleteDrawingEntityCommand,
} from '@/domain/commands';
import {
  validateOpening,
  findEnclosingSurface,
} from '@/domain/surfaces/openingValidation';
import { computeRect } from '@/features/drawingTools/rectangle/useRectangleDraw';

export type ModifierKeys = { shift: boolean; alt: boolean; ctrl: boolean };

export type OpeningDrawState =
  | { phase: 'idle' }
  | { phase: 'rectPickSecond'; first: Point2D; cursor: Point2D; shift: boolean; alt: boolean }
  | { phase: 'polyDrawing'; points: Point2D[]; cursor: Point2D };

const SNAP_CLOSE_PX = 10;

const resolveWorld = (stageRef: React.RefObject<Konva.Stage | null>): Point2D | null => {
  const s = stageRef.current;
  if (!s) return null;
  const pos = s.getPointerPosition();
  if (!pos) return null;
  const v = useEditorStore.getState().viewport;
  return screenToWorld(pos.x, pos.y, v);
};

const rectanglePolygon = (origin: Point2D, w: number, h: number): Point2D[] => [
  { x: origin.x, y: origin.y },
  { x: origin.x + w, y: origin.y },
  { x: origin.x + w, y: origin.y + h },
  { x: origin.x, y: origin.y + h },
];

const issuesToMessage = (issues: { code: string; message: string }[]): string =>
  issues.map((i) => i.message || i.code).join('; ');

export const useOpeningDraw = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const mode = useOpeningToolStore((s) => s.mode);
  const [state, setState] = useState<OpeningDrawState>({ phase: 'idle' });

  const cancel = useCallback(() => {
    setState({ phase: 'idle' });
  }, []);

  const tryCommit = useCallback(
    (hole: Point2D[], referencePoint: Point2D): boolean => {
      if (hole.length < 3) {
        useToastStore.getState().pushToast('Opening needs at least 3 points', 'error');
        return false;
      }
      const polyVal = validatePolygon(hole);
      if (!polyVal.valid) {
        useToastStore.getState().pushToast(
          `Invalid opening: ${polyVal.issues.map((i) => i.code).join(', ')}`,
          'error',
        );
        return false;
      }
      const project = useProjectStore.getState().project;
      const parent: Surface | null = findEnclosingSurface(project.surfaces, referencePoint);
      if (!parent) {
        useToastStore.getState().pushToast(
          'Opening must start inside a surface',
          'error',
        );
        return false;
      }
      const normalized = ensureCW(hole);
      const validation = validateOpening(parent, normalized);
      if (!validation.valid) {
        useToastStore.getState().pushToast(
          `Opening invalid: ${issuesToMessage(validation.issues)}`,
          'error',
        );
        return false;
      }
      const tool = useOpeningToolStore.getState();
      dispatchCommand(
        addOpeningCommand({
          surfaceId: parent.id,
          hole: normalized,
          meta: { showDimensions: tool.showDimensions, style: tool.style },
        }),
      );
      return true;
    },
    [],
  );

  const onPointerDown = useCallback(
    (mods: ModifierKeys) => {
      const p = resolveWorld(stageRef);
      if (!p) return;

      if (mode === 'rectangle') {
        if (state.phase !== 'rectPickSecond') {
          setState({ phase: 'rectPickSecond', first: p, cursor: p, shift: mods.shift, alt: mods.alt });
          return;
        }
        const inputs = computeRect(state.first, p, { shift: mods.shift, alt: mods.alt });
        if (inputs.widthMm <= 0 || inputs.heightMm <= 0) {
          cancel();
          return;
        }
        const polygon = rectanglePolygon(inputs.origin, inputs.widthMm, inputs.heightMm);
        if (tryCommit(polygon, state.first)) cancel();
        else cancel();
        return;
      }

      // polygon mode
      if (state.phase !== 'polyDrawing') {
        setState({ phase: 'polyDrawing', points: [p], cursor: p });
        return;
      }
      const first = state.points[0]!;
      const v = useEditorStore.getState().viewport;
      const closeWorldDist = SNAP_CLOSE_PX / Math.max(v.scale, 1e-9);
      if (state.points.length >= 3 && distance(first, p) <= closeWorldDist) {
        if (tryCommit(state.points, first)) cancel();
        return;
      }
      setState({ phase: 'polyDrawing', points: [...state.points, p], cursor: p });
    },
    [mode, state, stageRef, tryCommit, cancel],
  );

  const onPointerMove = useCallback(
    (mods: ModifierKeys) => {
      const p = resolveWorld(stageRef);
      if (!p) return;
      setState((cur) => {
        if (cur.phase === 'rectPickSecond') {
          return { ...cur, cursor: p, shift: mods.shift, alt: mods.alt };
        }
        if (cur.phase === 'polyDrawing') {
          return { ...cur, cursor: p };
        }
        return cur;
      });
    },
    [stageRef],
  );

  const closePolygonNow = useCallback(() => {
    if (state.phase !== 'polyDrawing') return;
    const first = state.points[0];
    if (!first) return;
    if (tryCommit(state.points, first)) cancel();
  }, [state, tryCommit, cancel]);

  const removeLastPolygonVertex = useCallback(() => {
    if (state.phase !== 'polyDrawing') return;
    if (state.points.length <= 1) {
      cancel();
      return;
    }
    setState({ phase: 'polyDrawing', points: state.points.slice(0, -1), cursor: state.cursor });
  }, [state, cancel]);

  const commitFromSelection = useCallback((): boolean => {
    const sel = useSelectionStore.getState().selected;
    const project = useProjectStore.getState().project;
    const entry = sel.find((e) => e.kind === 'rectangle' || e.kind === 'polygon');
    if (!entry) {
      useToastStore.getState().pushToast(
        'Select a rectangle or polygon to convert into an opening',
        'warning',
      );
      return false;
    }
    const entity = project.drawingEntities.find((e) => e.id === entry.id);
    if (!entity) return false;
    let polygon: Point2D[];
    if (entity.type === 'rectangle') {
      polygon = rectanglePolygon(entity.origin, entity.widthMm, entity.heightMm);
    } else if (entity.type === 'polygon') {
      polygon = entity.points;
    } else {
      return false;
    }
    const reference = polygon[0]!;
    if (!tryCommit(polygon, reference)) return false;
    try {
      dispatchCommand(deleteDrawingEntityCommand({ id: entity.id }));
    } catch {
      // best-effort: opening was added even if entity deletion fails.
    }
    useSelectionStore.getState().clear();
    return true;
  }, [tryCommit]);

  const rectPreview = state.phase === 'rectPickSecond'
    ? computeRect(state.first, state.cursor, { shift: state.shift, alt: state.alt })
    : null;

  return {
    mode,
    state,
    rectPreview,
    onPointerDown,
    onPointerMove,
    closePolygonNow,
    removeLastPolygonVertex,
    commitFromSelection,
    cancel,
  };
};
