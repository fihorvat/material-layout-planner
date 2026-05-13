import { useEffect } from 'react';
import type Konva from 'konva';
import { usePolygonDraw } from './polygon/usePolygonDraw';
import { PolygonPreview } from './polygon/PolygonPreview';
import { NumericPromptOverlay } from './line/NumericPromptOverlay';
import { registerDrawingCancel } from './drawingCancelRegistry';

export const usePolygonTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = usePolygonDraw(stageRef);
  useEffect(() => registerDrawingCancel(draw.cancel), [draw.cancel]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') draw.cancel();
      else if (e.key === 'Enter') draw.closeNow();
      else if (e.key === 'Backspace') draw.removeLast();
      else if (/^[0-9.]$/.test(e.key) && draw.state.phase === 'drawing' && !draw.numericPrompt) {
        draw.openNumericPrompt();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draw]);

  const onStagePointerDown = (e: { evt: MouseEvent }) => {
    if (e.evt.button !== 0) return;
    draw.onPointerDown({ shift: e.evt.shiftKey, alt: e.evt.altKey, ctrl: e.evt.ctrlKey });
  };
  const onStagePointerMove = (e: { evt: MouseEvent }) => {
    draw.onPointerMove({ shift: e.evt.shiftKey, alt: e.evt.altKey, ctrl: e.evt.ctrlKey });
  };

  const overlays =
    draw.state.phase === 'drawing' ? (
      <PolygonPreview
        points={draw.state.points}
        cursor={draw.state.cursor}
        ortho={draw.state.ortho}
        alignments={draw.state.alignments}
      />
    ) : null;

  const domOverlay = draw.numericPrompt ? (
    <NumericPromptOverlay
      onSubmit={draw.submitNumeric}
      onCancel={draw.cancelNumericPrompt}
      initialAngleDeg={draw.numericPrompt.initialAngleDeg}
    />
  ) : null;

  return { onStagePointerDown, onStagePointerMove, overlays, domOverlay, error: draw.error };
};
