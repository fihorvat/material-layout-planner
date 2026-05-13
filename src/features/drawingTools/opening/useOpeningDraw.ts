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
import { ensureCW, validatePolygon, distance, degToRad } from '@/domain/geometry';
import {
  dispatchCommand,
  addOpeningCommand,
  deleteDrawingEntityCommand,
} from '@/domain/commands';
import {
  validateOpening,
  findEnclosingSurface,
} from '@/domain/surfaces/openingValidation';
import { noEnclosingSurfaceMessage } from '@/domain/surfaces/noEnclosingSurfaceMessage';
import { computeRect } from '@/features/drawingTools/rectangle/useRectangleDraw';
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

type OpeningDrawState =
  | { phase: 'idle' }
  | { phase: 'rectPickSecond'; first: Point2D; cursor: Point2D; shift: boolean; alt: boolean }
  | {
      phase: 'polyDrawing';
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

const tryBboxEdgeSnap = (raw: Point2D): Point2D | null => {
  const editor = useEditorStore.getState();
  if (!editor.snapEnabled) return null;
  if (!isDrawingModeActiveSnapshot()) return null;
  const project = useProjectStore.getState().project;
  const bboxes = collectShapeBoundingBoxes(project);
  if (bboxes.length === 0) return null;
  const tolMm = editor.snapTolerancePx / Math.max(editor.viewport.scale, 1e-9);
  return snapToBoundingBoxEdge(raw, tolMm, bboxes);
};

const resolveWorld = (stageRef: React.RefObject<Konva.Stage | null>): Point2D | null => {
  const s = stageRef.current;
  if (!s) return null;
  const pos = s.getPointerPosition();
  if (!pos) return null;
  const v = useEditorStore.getState().viewport;
  return screenToWorld(pos.x, pos.y, v);
};

// Resolve the world position of the cursor for a rectangle-mode click,
// applying bbox-edge snap when Shift is held with drawing mode active.
// Returns the raw position when no snap applies.
const resolveRectPoint = (
  stageRef: React.RefObject<Konva.Stage | null>,
  mods: ModifierKeys,
): Point2D | null => {
  const raw = resolveWorld(stageRef);
  if (!raw) return null;
  if (mods.shift && !mods.alt) {
    const snapped = tryBboxEdgeSnap(raw);
    if (snapped) return snapped;
  }
  return raw;
};

// Resolve the next polygon vertex/cursor for opening polygon mode. Mirrors
// the rules of `usePolygonDraw` so the user gets the same snapping,
// alignment, and ortho behavior when punching a polygon-shaped opening.
const resolvePolyPoint = (
  raw: Point2D,
  prevPoints: readonly Point2D[],
  mods: ModifierKeys,
): { point: Point2D; ortho: boolean; alignments?: AlignmentGuides } => {
  const last = prevPoints[prevPoints.length - 1];
  if (mods.shift) {
    const onBbox = tryBboxEdgeSnap(raw);
    if (onBbox) return { point: onBbox, ortho: false };
    if (last) return { point: constrainAngle(last, raw), ortho: true };
    return { point: raw, ortho: true };
  }
  const v = useEditorStore.getState().viewport;
  const aligned = computeAxisAlignment(raw, prevPoints, ALIGN_PX / Math.max(v.scale, 1e-9));
  return { point: aligned.cursor, ortho: false, alignments: aligned.alignments };
};

const rectanglePolygon = (origin: Point2D, w: number, h: number): Point2D[] => [
  { x: origin.x, y: origin.y },
  { x: origin.x + w, y: origin.y },
  { x: origin.x + w, y: origin.y + h },
  { x: origin.x, y: origin.y + h },
];

const issuesToMessage = (issues: { code: string; message: string }[]): string =>
  issues.map((i) => i.message || i.code).join('; ');

export type OpeningNumericPrompt =
  | { kind: 'rect'; first: Point2D; alt: boolean; initialLength?: string }
  | { kind: 'poly'; initialAngleDeg: number; initialLength?: string };

export const useOpeningDraw = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const mode = useOpeningToolStore((s) => s.mode);
  const [state, setState] = useState<OpeningDrawState>({ phase: 'idle' });
  const [numericPrompt, setNumericPrompt] = useState<OpeningNumericPrompt | null>(null);

  const cancel = useCallback(() => {
    setState({ phase: 'idle' });
    setNumericPrompt(null);
  }, []);

  const cancelNumericPrompt = useCallback(() => {
    setNumericPrompt(null);
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
          noEnclosingSurfaceMessage(project, referencePoint),
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
      if (mode === 'rectangle') {
        const p = resolveRectPoint(stageRef, mods);
        if (!p) return;
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
      const raw = resolveWorld(stageRef);
      if (!raw) return;
      if (state.phase !== 'polyDrawing') {
        setState({ phase: 'polyDrawing', points: [raw], cursor: raw, ortho: mods.shift });
        return;
      }
      const resolved = resolvePolyPoint(raw, state.points, mods);
      const p = resolved.point;
      const first = state.points[0]!;
      const v = useEditorStore.getState().viewport;
      const closeWorldDist = SNAP_CLOSE_PX / Math.max(v.scale, 1e-9);
      if (state.points.length >= 3 && distance(first, p) <= closeWorldDist) {
        if (tryCommit(state.points, first)) cancel();
        return;
      }
      setState({
        phase: 'polyDrawing',
        points: [...state.points, p],
        cursor: p,
        ortho: resolved.ortho,
        alignments: resolved.alignments,
      });
    },
    [mode, state, stageRef, tryCommit, cancel],
  );

  const onPointerMove = useCallback(
    (mods: ModifierKeys) => {
      setState((cur) => {
        if (cur.phase === 'rectPickSecond') {
          const p = resolveRectPoint(stageRef, mods);
          if (!p) return cur;
          return { ...cur, cursor: p, shift: mods.shift, alt: mods.alt };
        }
        if (cur.phase === 'polyDrawing') {
          const raw = resolveWorld(stageRef);
          if (!raw) return cur;
          const resolved = resolvePolyPoint(raw, cur.points, mods);
          return {
            phase: 'polyDrawing',
            points: cur.points,
            cursor: resolved.point,
            ortho: resolved.ortho,
            alignments: resolved.alignments,
          };
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
    setState({
      phase: 'polyDrawing',
      points: state.points.slice(0, -1),
      cursor: state.cursor,
      ortho: state.ortho,
      alignments: state.alignments,
    });
  }, [state, cancel]);

  // Backspace handler for rectangle mode: drop the first point and return
  // to idle so the user can re-anchor the rectangle without canceling the
  // whole tool.
  const removeLastRectPoint = useCallback(() => {
    if (state.phase !== 'rectPickSecond') return;
    setState({ phase: 'idle' });
  }, [state]);

  // Numeric-input support. The opening tool mirrors the rectangle and
  // polygon tools: while drawing, the user can type a digit/decimal to
  // open a small numeric prompt and commit the next dimension precisely
  // (e.g. "37cm"). Rectangle mode prompts for width + height, polygon
  // mode prompts for length + angle of the next edge.
  const openNumericPrompt = useCallback(
    (initialLength?: string) => {
      if (state.phase === 'rectPickSecond') {
        setNumericPrompt({
          kind: 'rect',
          first: state.first,
          alt: state.alt,
          initialLength,
        });
        return;
      }
      if (state.phase === 'polyDrawing') {
        const last = state.points[state.points.length - 1];
        if (!last) return;
        const dx = state.cursor.x - last.x;
        const dy = state.cursor.y - last.y;
        const initialAngleDeg =
          Math.hypot(dx, dy) < 1e-9 ? 0 : (Math.atan2(dy, dx) * 180) / Math.PI;
        setNumericPrompt({ kind: 'poly', initialAngleDeg, initialLength });
      }
    },
    [state],
  );

  const submitNumericRect = useCallback(
    (widthMm: number, heightMm: number) => {
      if (!numericPrompt || numericPrompt.kind !== 'rect') return;
      if (widthMm <= 0 || heightMm <= 0) {
        setNumericPrompt(null);
        return;
      }
      const f = numericPrompt.first;
      const origin = numericPrompt.alt
        ? { x: f.x - widthMm / 2, y: f.y - heightMm / 2 }
        : f;
      const polygon = rectanglePolygon(origin, widthMm, heightMm);
      if (tryCommit(polygon, origin)) cancel();
      else setNumericPrompt(null);
    },
    [numericPrompt, tryCommit, cancel],
  );

  const submitNumericPoly = useCallback(
    (lengthMm: number, angleDeg: number) => {
      if (!numericPrompt || numericPrompt.kind !== 'poly') return;
      if (state.phase !== 'polyDrawing') {
        setNumericPrompt(null);
        return;
      }
      const last = state.points[state.points.length - 1];
      if (!last) {
        setNumericPrompt(null);
        return;
      }
      const a = degToRad(angleDeg);
      const next: Point2D = {
        x: last.x + Math.cos(a) * lengthMm,
        y: last.y + Math.sin(a) * lengthMm,
      };
      setState({
        phase: 'polyDrawing',
        points: [...state.points, next],
        cursor: next,
        ortho: false,
        alignments: undefined,
      });
      setNumericPrompt(null);
    },
    [numericPrompt, state],
  );

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
    numericPrompt,
    onPointerDown,
    onPointerMove,
    closePolygonNow,
    removeLastPolygonVertex,
    removeLastRectPoint,
    openNumericPrompt,
    submitNumericRect,
    submitNumericPoly,
    cancelNumericPrompt,
    commitFromSelection,
    cancel,
  };
};
