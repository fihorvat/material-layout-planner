import { useEffect } from 'react';
import type Konva from 'konva';
import { SplitPreview } from './split/SplitPreview';
import { SplitDimensionPrompt } from './split/SplitDimensionPrompt';
import { useSplitSurfaceDraw } from './split/useSplitSurfaceDraw';
import { registerDrawingCancel } from '@/features/drawingTools/drawingCancelRegistry';

export const useSplitSurfaceTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useSplitSurfaceDraw(stageRef);

  useEffect(() => registerDrawingCancel(draw.cancel), [draw.cancel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') draw.cancel();
      else if (e.key === 'Enter' && draw.state.phase === 'polyDrawing') draw.closePolygonNow();
      else if (e.key === 'Backspace') {
        if (
          draw.state.phase === 'polyDrawing' ||
          draw.state.phase === 'linePickB' ||
          draw.state.phase === 'rectPickB'
        ) {
          e.preventDefault();
          draw.removeLastPoint();
        }
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

  const overlays = <SplitPreview state={draw.state} surface={draw.targetSurface} />;

  const domOverlay = (
    <SplitDimensionPrompt
      onSubmit={({ surfaceId, edgeIndex, offsetMm }) =>
        draw.applyDimensionSplit(surfaceId, edgeIndex, offsetMm)
      }
    />
  );

  return {
    onStagePointerDown,
    onStagePointerMove,
    overlays,
    domOverlay,
    error: draw.error,
    targetSurface: draw.targetSurface,
  };
};
