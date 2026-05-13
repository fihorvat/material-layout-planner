import { useEffect } from 'react';
import type Konva from 'konva';
import { useCutDraw } from './cut/useCutDraw';
import { CutPreview } from './cut/CutPreview';
import { registerDrawingCancel } from './drawingCancelRegistry';

export const useCutTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useCutDraw(stageRef);

  useEffect(() => registerDrawingCancel(draw.cancel), [draw.cancel]);

  const onStagePointerDown = (e: { evt: PointerEvent | MouseEvent }) => {
    if ((e.evt as MouseEvent).button !== 0) return;
    draw.onPointerDown({ shift: e.evt.shiftKey, alt: e.evt.altKey, ctrl: e.evt.ctrlKey });
  };
  const onStagePointerMove = (e: { evt: PointerEvent | MouseEvent }) => {
    draw.onPointerMove({ shift: e.evt.shiftKey, alt: e.evt.altKey, ctrl: e.evt.ctrlKey });
  };

  const overlays =
    draw.state.phase === 'pickSecond' ? (
      <CutPreview first={draw.state.first} cursor={draw.state.cursor} />
    ) : null;

  return { onStagePointerDown, onStagePointerMove, overlays };
};
