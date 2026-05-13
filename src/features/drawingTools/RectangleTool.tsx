import { useEffect } from 'react';
import type Konva from 'konva';
import { useRectangleDraw } from './rectangle/useRectangleDraw';
import { RectanglePreview } from './rectangle/RectanglePreview';
import { NumericPromptOverlay } from './line/NumericPromptOverlay';
import { registerDrawingCancel } from './drawingCancelRegistry';

export const useRectangleTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useRectangleDraw(stageRef);

  useEffect(() => registerDrawingCancel(draw.cancel), [draw.cancel]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') draw.cancel();
      else if (/^[0-9.]$/.test(e.key) && draw.state.phase === 'pickSecond') {
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

  const overlays = draw.preview ? (
    <RectanglePreview
      origin={draw.preview.origin}
      widthMm={draw.preview.widthMm}
      heightMm={draw.preview.heightMm}
      cursor={draw.state.phase === 'pickSecond' ? draw.state.cursor : undefined}
    />
  ) : null;

  const domOverlay = draw.numericPrompt ? (
    <NumericPromptOverlay
      onSubmit={(w, h) => draw.submitNumeric(w, h)}
      onCancel={draw.cancel}
    />
  ) : null;

  return { onStagePointerDown, onStagePointerMove, overlays, domOverlay };
};
