import { useCallback, useState } from 'react';
import type Konva from 'konva';
import type { Point2D, RectangleEntity } from '@/types';
import { defaultDrawingStyle } from '@/types';
import { useEditorStore } from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { dispatchCommand, addDrawingEntityCommand } from '@/domain/commands';
import { newDrawingEntityId } from '@/domain/ids';

export type ModifierKeys = { shift: boolean; alt: boolean; ctrl: boolean };

export type RectangleDrawState =
  | { phase: 'pickFirst' }
  | { phase: 'pickSecond'; first: Point2D; cursor: Point2D; alt: boolean; shift: boolean };

const resolveWorld = (stageRef: React.RefObject<Konva.Stage | null>): Point2D | null => {
  const s = stageRef.current;
  if (!s) return null;
  const pos = s.getPointerPosition();
  if (!pos) return null;
  const v = useEditorStore.getState().viewport;
  return screenToWorld(pos.x, pos.y, v);
};

export type RectInputs = { origin: Point2D; widthMm: number; heightMm: number };

export const computeRect = (first: Point2D, cursor: Point2D, mods: { shift: boolean; alt: boolean }): RectInputs => {
  let dx = cursor.x - first.x;
  let dy = cursor.y - first.y;
  if (mods.shift) {
    const m = Math.max(Math.abs(dx), Math.abs(dy));
    dx = Math.sign(dx || 1) * m;
    dy = Math.sign(dy || 1) * m;
  }
  if (mods.alt) {
    const w = Math.abs(dx) * 2;
    const h = Math.abs(dy) * 2;
    return {
      origin: { x: first.x - w / 2, y: first.y - h / 2 },
      widthMm: w,
      heightMm: h,
    };
  }
  const w = Math.abs(dx);
  const h = Math.abs(dy);
  const ox = Math.min(first.x, first.x + dx);
  const oy = Math.min(first.y, first.y + dy);
  return { origin: { x: ox, y: oy }, widthMm: w, heightMm: h };
};

export const useRectangleDraw = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const [state, setState] = useState<RectangleDrawState>({ phase: 'pickFirst' });
  const [numericPrompt, setNumericPrompt] = useState<{ first: Point2D; alt: boolean } | null>(null);

  const commit = useCallback((inputs: RectInputs) => {
    if (inputs.widthMm <= 0 || inputs.heightMm <= 0) return;
    const entity: RectangleEntity = {
      id: newDrawingEntityId(),
      type: 'rectangle',
      origin: inputs.origin,
      widthMm: inputs.widthMm,
      heightMm: inputs.heightMm,
      rotationDeg: 0,
      showDimensions: true,
      style: defaultDrawingStyle(),
    };
    dispatchCommand(addDrawingEntityCommand({ entity }));
  }, []);

  const onPointerDown = useCallback(
    (mods: ModifierKeys) => {
      const p = resolveWorld(stageRef);
      if (!p) return;
      if (state.phase === 'pickFirst') {
        setState({ phase: 'pickSecond', first: p, cursor: p, alt: mods.alt, shift: mods.shift });
        return;
      }
      const inputs = computeRect(state.first, p, { shift: mods.shift, alt: mods.alt });
      commit(inputs);
      setState({ phase: 'pickFirst' });
    },
    [stageRef, state, commit],
  );

  const onPointerMove = useCallback(
    (mods: ModifierKeys) => {
      if (state.phase !== 'pickSecond') return;
      const p = resolveWorld(stageRef);
      if (!p) return;
      setState({ ...state, cursor: p, alt: mods.alt, shift: mods.shift });
    },
    [stageRef, state],
  );

  const cancel = useCallback(() => {
    setState({ phase: 'pickFirst' });
    setNumericPrompt(null);
  }, []);

  const openNumericPrompt = useCallback(() => {
    if (state.phase !== 'pickSecond') return;
    setNumericPrompt({ first: state.first, alt: state.alt });
  }, [state]);

  const submitNumeric = useCallback(
    (widthMm: number, heightMm: number) => {
      if (!numericPrompt) return;
      const f = numericPrompt.first;
      const origin = numericPrompt.alt
        ? { x: f.x - widthMm / 2, y: f.y - heightMm / 2 }
        : f;
      commit({ origin, widthMm, heightMm });
      setState({ phase: 'pickFirst' });
      setNumericPrompt(null);
    },
    [numericPrompt, commit],
  );

  const preview = state.phase === 'pickSecond'
    ? computeRect(state.first, state.cursor, { shift: state.shift, alt: state.alt })
    : null;

  return { state, preview, numericPrompt, onPointerDown, onPointerMove, openNumericPrompt, submitNumeric, cancel };
};
