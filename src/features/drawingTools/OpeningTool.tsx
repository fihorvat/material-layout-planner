import { useEffect } from 'react';
import type Konva from 'konva';
import { useOpeningDraw } from './opening/useOpeningDraw';
import { OpeningRectPreview, OpeningPolyPreview } from './opening/OpeningPreview';
import { registerDrawingCancel } from './drawingCancelRegistry';

export const useOpeningTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useOpeningDraw(stageRef);

  useEffect(() => registerDrawingCancel(draw.cancel), [draw.cancel]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') draw.cancel();
      else if (e.key === 'Enter' && draw.mode === 'polygon') draw.closePolygonNow();
      else if (e.key === 'Backspace' && draw.mode === 'polygon') draw.removeLastPolygonVertex();
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

  let overlay: React.ReactNode = null;
  if (draw.state.phase === 'rectPickSecond' && draw.rectPreview) {
    overlay = (
      <OpeningRectPreview
        origin={draw.rectPreview.origin}
        widthMm={draw.rectPreview.widthMm}
        heightMm={draw.rectPreview.heightMm}
      />
    );
  } else if (draw.state.phase === 'polyDrawing') {
    overlay = <OpeningPolyPreview points={draw.state.points} cursor={draw.state.cursor} />;
  }

  return {
    onStagePointerDown,
    onStagePointerMove,
    overlays: overlay,
    mode: draw.mode,
    commitFromSelection: draw.commitFromSelection,
  };
};

export type UseOpeningToolReturn = ReturnType<typeof useOpeningTool>;
