import { useEffect } from 'react';
import type Konva from 'konva';
import { useLineDraw } from './line/useLineDraw';
import { LinePreview } from './line/LinePreview';
import { NumericPromptOverlay } from './line/NumericPromptOverlay';
import { registerDrawingCancel } from './drawingCancelRegistry';

export const useLineTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useLineDraw(stageRef);

  useEffect(() => registerDrawingCancel(draw.cancel), [draw.cancel]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Escape') {
        draw.cancel();
        return;
      }
      if (/^[0-9.]$/.test(e.key) && draw.state.phase === 'pickSecond') {
        draw.openNumericPrompt();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draw]);

  const onStagePointerDown = (e: { evt: PointerEvent | MouseEvent }) => {
    if (e.evt.button !== 0 && !(e.evt as PointerEvent).pointerType) return;
    if ((e.evt as MouseEvent).button !== 0) return;
    draw.onPointerDown({ shift: e.evt.shiftKey, alt: e.evt.altKey, ctrl: e.evt.ctrlKey });
  };
  const onStagePointerMove = (e: { evt: PointerEvent | MouseEvent }) => {
    draw.onPointerMove({ shift: e.evt.shiftKey, alt: e.evt.altKey, ctrl: e.evt.ctrlKey });
  };

  const overlays =
    draw.state.phase === 'pickSecond' ? (
      <LinePreview first={draw.state.first} cursor={draw.state.cursor} ortho={draw.state.ortho} />
    ) : null;

  const domOverlay = draw.numericPrompt ? (
    <NumericPromptOverlay
      onSubmit={draw.submitNumeric}
      onCancel={draw.cancel}
      initialAngleDeg={draw.numericPrompt.initialAngleDeg}
    />
  ) : null;

  return { onStagePointerDown, onStagePointerMove, overlays, domOverlay };
};
